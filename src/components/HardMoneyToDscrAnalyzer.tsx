// You are Gemini Code Assist in a React + TypeScript project with Tailwind CSS.
// Build a focused "Hard Money → DSCR Refi" analyzer for a BRRRR-style deal.
// The specific structure is:
//   Hard Money (80% LTV purchase + 100% rehab financed) → DSCR 30-year refinance.
//
// ===================================================
// TECH + PROJECT CONTEXT
// ===================================================
// - React + TypeScript SPA.
// - Tailwind CSS for styling; no other UI libraries.
// - We are adding a single main component:
//      <HardMoneyToDscrAnalyzer />
// - This component can be used stand-alone or dropped into a bigger app.
//
// Requirements:
// - Use React functional components.
// - Use useState or useReducer for local state.
// - All calculations must be in pure functions (separate from UI).
// - Use TypeScript interfaces/types for inputs and outputs.
// - Keep UI clean, card-based, mobile responsive.
//
// ===================================================
// DATA MODEL
// ===================================================
import React, { useState, useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './HardMoneyToDscrAnalyzer.css';

// 1) Deal Inputs
// ---------------------------------------------------
type DealInputs = {
  loanSizingMethod: 'ltv' | 'dscr';
  // Purchase & Rehab
  imageUrls: string[];
  purchasePrice: number;
  rehabBudget: number;        // total rehab budget
  rehabMonths: number;        // length of rehab/hold under hard money

  // Soft costs & closing
  closingCosts: number;       // title, lender fees, etc. (excluding points)
  additionalCosts: number;    // misc: inspections, appraisals, etc.

  // Hard Money
  hmInterestRateAnnual: number;   // e.g. 0.12 for 12%
  hmPointsPercent: number;        // e.g. 0.02 for 2% of total loan

  // DSCR Refi
  arv: number;                    // appraised value at refi
  dscrLtv: number;                // e.g. 0.75
  dscrRequired: number;           // e.g. 1.20
  dscrRateAnnual: number;         // e.g. 0.075 for 7.5%
  dscrTermYears: number;          // e.g. 30
  dscrClosingCostPercent: number; // e.g. 0.03 (3% of new loan)

  // Rental / Operations
  monthlyRent: number;
  vacancyRate: number;            // 0.05 = 5%
  taxesAnnual: number;
  insuranceAnnual: number;
  hoaMonthly: number;
  utilitiesMonthlyOwner: number;
  maintenancePercentOfRent: number;   // e.g. 0.08
  capexPercentOfRent: number;         // e.g. 0.07
  managementPercentOfRent: number;    // e.g. 0.08

  // Projections
  rentGrowthPercentAnnual: number;
  expenseGrowthPercentAnnual: number;
  appreciationPercentAnnual: number;
};

// 2) Derived Hard Money Structure
// ---------------------------------------------------
type HardMoneyPhase = {
  hmPurchaseLoanAmount: number;     // 80% of purchase
  hmRehabLoanAmount: number;       // 100% of rehab
  hmTotalLoanAmount: number;       // purchase + rehab

  hmDownPayment: number;           // purchasePrice - hmPurchaseLoanAmount
  hmPointsCost: number;            // hmTotalLoanAmount * hmPointsPercent
  hmMonthlyInterestOnly: number;   // hmTotalLoanAmount * rate / 12
  hmTotalInterestDuringRehab: number; // hmMonthlyInterestOnly * rehabMonths

  cashToClose: number;             // downPayment + closingCosts + hmPointsCost
  totalCashIntoDealBeforeRefi: number; // cashToClose + additionalCosts + hmTotalInterestDuringRehab
  totalProjectCost: number;        // purchasePrice + rehabBudget + closingCosts + additionalCosts + hmTotalInterestDuringRehab
};

// 3) DSCR Phase & Outputs
// ---------------------------------------------------
type DscrPhase = {
  effectiveGrossIncomeAnnual: number;
  operatingExpensesAnnual: number;
  noiAnnual: number;

  // Loan sizing
  loanByLtv: number;
  loanByDscr: number;
  finalLoanAmount: number;          // min(loanByLtv, loanByDscr)

  monthlyMortgagePayment: number;   // based on amortization
  annualDebtService: number;
  achievedDscr: number;

  refiClosingCosts: number;        // finalLoanAmount * dscrClosingCostPercent
  payoffHardMoney: number;         // hmTotalLoanAmount
  netCashAtRefi: number;           // finalLoanAmount - payoffHardMoney - refiClosingCosts

  cashLeftInDeal: number;
  equityAfterRefi: number;         // arv - finalLoanAmount

  // Performance post-refi
  monthlyCashflowAfterDebt: number;
  annualCashflowAfterDebt: number;
  refiCashOutReturn: number;
  cashOnCashReturnYear1: number;   // annualCashflowAfterDebt / max(cashLeftInDeal, 1)
};

// 4) Global Calculation Result
// ---------------------------------------------------
type DealAnalysis = {
  inputs: DealInputs;
  hardMoney: HardMoneyPhase;
  dscr: DscrPhase;
};

type ProjectionYear = {
  year: number;
  monthlyRent: number;
  noiAnnual: number;
  monthlyCashflow: number;
  cumulativeCashflow: number;
  cumulativeEquity: number;
};

type Projections = {
  years: ProjectionYear[];
};




// ===================================================
// CALCULATION LOGIC (PURE FUNCTIONS)
// ===================================================

function mortgagePayment(principal: number, annualRate: number, termYears: number): number {
  if (principal <= 0 || annualRate <= 0) return 0;
  const monthlyRate = annualRate / 12;
  const numberOfPayments = termYears * 12;
  if (monthlyRate === 0) return principal / numberOfPayments;
  const factor = Math.pow(1 + monthlyRate, numberOfPayments);
  return principal * (monthlyRate * factor) / (factor - 1);
}

function remainingBalance(principal: number, annualRate: number, termYears: number, paymentsMade: number): number {
    if (principal <= 0) return 0;
    const monthlyRate = annualRate / 12;
    const totalPayments = termYears * 12;
    if (monthlyRate === 0) return principal - (principal / totalPayments) * paymentsMade;

    const powTotal = Math.pow(1 + monthlyRate, totalPayments) || 1;
    const powPaid = Math.pow(1 + monthlyRate, paymentsMade);
    return principal * (powTotal - powPaid) / (powTotal - 1);
}

function analyzeDeal(inputs: DealInputs): DealAnalysis {
  // 1) Hard Money Phase
  const hmPurchaseLoanAmount = inputs.purchasePrice * 0.80;
  const hmRehabLoanAmount = inputs.rehabBudget * 1.00;
  const hmTotalLoanAmount = hmPurchaseLoanAmount + hmRehabLoanAmount;
  const hmDownPayment = inputs.purchasePrice - hmPurchaseLoanAmount;
  const hmPointsCost = hmTotalLoanAmount * inputs.hmPointsPercent;
  const hmMonthlyInterestOnly = hmTotalLoanAmount * inputs.hmInterestRateAnnual / 12;
  const hmTotalInterestDuringRehab = hmMonthlyInterestOnly * inputs.rehabMonths;
  const cashToClose = hmDownPayment + inputs.closingCosts + hmPointsCost;
  const totalCashIntoDealBeforeRefi = cashToClose + inputs.additionalCosts + hmTotalInterestDuringRehab;
  const totalProjectCost = inputs.purchasePrice + inputs.rehabBudget + inputs.closingCosts + inputs.additionalCosts + hmTotalInterestDuringRehab;

  const hardMoney: HardMoneyPhase = {
    hmPurchaseLoanAmount,
    hmRehabLoanAmount,
    hmTotalLoanAmount,
    hmDownPayment,
    hmPointsCost,
    hmMonthlyInterestOnly,
    hmTotalInterestDuringRehab,
    cashToClose,
    totalCashIntoDealBeforeRefi,
    totalProjectCost,
  };

  // 2) Rental & NOI
  const effectiveGrossIncomeAnnual = inputs.monthlyRent * (1 - inputs.vacancyRate) * 12;
  const variableExpensesAnnual = (inputs.monthlyRent * 12) * (inputs.maintenancePercentOfRent + inputs.capexPercentOfRent + inputs.managementPercentOfRent);
  const fixedExpensesAnnual = inputs.taxesAnnual + inputs.insuranceAnnual + (inputs.hoaMonthly * 12) + (inputs.utilitiesMonthlyOwner * 12);
  const operatingExpensesAnnual = variableExpensesAnnual + fixedExpensesAnnual;
  const noiAnnual = effectiveGrossIncomeAnnual - operatingExpensesAnnual;

  // 3) DSCR Loan Sizing
  const loanByLtv = inputs.arv * inputs.dscrLtv;
  const annualDebtServiceMax = noiAnnual / inputs.dscrRequired;
  const monthlyPmtMax = annualDebtServiceMax / 12;
  const r = inputs.dscrRateAnnual / 12;
  const n = inputs.dscrTermYears * 12;
  let loanByDscr = 0;
  if (r > 0) {
    loanByDscr = monthlyPmtMax * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n));
  }
  const finalLoanAmount =
    inputs.loanSizingMethod === 'dscr'
      ? loanByDscr
      : loanByLtv;

  const monthlyMortgagePayment = mortgagePayment(finalLoanAmount, inputs.dscrRateAnnual, inputs.dscrTermYears);
  const annualDebtService = monthlyMortgagePayment * 12;
  const achievedDscr = annualDebtService > 0 ? noiAnnual / annualDebtService : Infinity;

  // 4) Refi Cash Flows
  const refiClosingCosts = finalLoanAmount * inputs.dscrClosingCostPercent;
  const payoffHardMoney = hmTotalLoanAmount; // Per prompt, payoff is total loan amount
  const netCashAtRefi = finalLoanAmount - payoffHardMoney - refiClosingCosts;

  let cashLeftInDeal;
  if (netCashAtRefi >= 0) {
    cashLeftInDeal = Math.max(totalCashIntoDealBeforeRefi - netCashAtRefi, 0);
  } else {
    cashLeftInDeal = totalCashIntoDealBeforeRefi + Math.abs(netCashAtRefi);
  }

  const equityAfterRefi = inputs.arv - finalLoanAmount;
  const monthlyCashflowAfterDebt = (noiAnnual / 12) - monthlyMortgagePayment;
  const annualCashflowAfterDebt = monthlyCashflowAfterDebt * 12;
  const refiCashOutReturn = netCashAtRefi / Math.max(totalCashIntoDealBeforeRefi, 1);
  const cashOnCashReturnYear1 = annualCashflowAfterDebt / Math.max(cashLeftInDeal, 1);

  const dscr: DscrPhase = {
    effectiveGrossIncomeAnnual,
    operatingExpensesAnnual,
    noiAnnual,
    loanByLtv,
    loanByDscr,
    finalLoanAmount,
    monthlyMortgagePayment,
    annualDebtService,
    achievedDscr,
    refiClosingCosts,
    payoffHardMoney,
    netCashAtRefi,
    cashLeftInDeal,
    equityAfterRefi,
    monthlyCashflowAfterDebt,
    annualCashflowAfterDebt,
    refiCashOutReturn,
    cashOnCashReturnYear1,
  };

  return { inputs, hardMoney, dscr };
}

function calculateProjections(inputs: DealInputs, analysis: DealAnalysis): Projections {
  const years: ProjectionYear[] = [];
  const baseNoi = analysis.dscr.noiAnnual;
  const baseRent = inputs.monthlyRent;
  const baseOpex = analysis.dscr.effectiveGrossIncomeAnnual - baseNoi;
  const mortgage = analysis.dscr.monthlyMortgagePayment;
  const loanPrincipal = analysis.dscr.finalLoanAmount;
  const loanRate = inputs.dscrRateAnnual;
  const loanTerm = inputs.dscrTermYears;
  const startingArv = inputs.arv;

  let cumulativeCashflow = 0;

  for (let i = 1; i <= 30; i++) {
    const rentGrowthFactor = Math.pow(1 + inputs.rentGrowthPercentAnnual, i);
    const expenseGrowthFactor = Math.pow(1 + inputs.expenseGrowthPercentAnnual, i);
    const appreciationFactor = Math.pow(1 + inputs.appreciationPercentAnnual, i);
    
    const projectedRent = baseRent * rentGrowthFactor;
    const projectedEgi = projectedRent * (1 - inputs.vacancyRate) * 12; // This is annual
    const projectedOpex = baseOpex * expenseGrowthFactor;
    const projectedNoi = projectedEgi - projectedOpex;
    const projectedMonthlyCashflow = (projectedNoi / 12) - mortgage;

    cumulativeCashflow += projectedMonthlyCashflow * 12;

    const projectedValue = startingArv * appreciationFactor;
    const remainingLoanBalance = remainingBalance(loanPrincipal, loanRate, loanTerm, i * 12);
    const cumulativeEquity = projectedValue - remainingLoanBalance;

    years.push({
      year: i,
      monthlyRent: projectedRent,
      noiAnnual: projectedNoi,
      monthlyCashflow: projectedMonthlyCashflow,
      cumulativeCashflow,
      cumulativeEquity,
    });
  }
  return { years };
}
// ===================================================
// UI / UX REQUIREMENTS
// ===================================================

const defaultInputs: DealInputs = {
  loanSizingMethod: 'ltv',
  imageUrls: Array(10).fill(''),
  purchasePrice: 200000,
  rehabBudget: 50000,
  rehabMonths: 6,
  closingCosts: 4000,
  additionalCosts: 2000,
  hmInterestRateAnnual: 0.12,
  hmPointsPercent: 0.02,
  arv: 350000,
  dscrLtv: 0.75,
  dscrRequired: 1.20,
  dscrRateAnnual: 0.075,
  dscrTermYears: 30,
  dscrClosingCostPercent: 0.03,
  monthlyRent: 3000,
  vacancyRate: 0.05,
  taxesAnnual: 3500,
  insuranceAnnual: 1200,
  hoaMonthly: 0,
  utilitiesMonthlyOwner: 0,
  maintenancePercentOfRent: 0.08,
  capexPercentOfRent: 0.07,
  managementPercentOfRent: 0.08,
  rentGrowthPercentAnnual: 0.03,
  expenseGrowthPercentAnnual: 0.02,
  appreciationPercentAnnual: 0.03,
};

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
const formatPercent = (value: number) => new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
const formatNumber = (value: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

const InputField: React.FC<{ label: string; name: keyof DealInputs; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; isPercent?: boolean; helperText?: string }> = ({ label, name, value, onChange, isPercent, helperText }) => (
  <div className="hm-field">
    <label htmlFor={name} className="hm-label">{label}</label>
    <div className="hm-input-wrapper">
      <input
        id={name}
        name={name}
        type="number"
        step={isPercent ? '0.01' : '100'}
        value={isPercent ? value * 100 : value}
        onChange={onChange}
        className="hm-input"
      />
      {isPercent && <span className="hm-input-suffix">%</span>}
    </div>
    {helperText && <p className="hm-helper">{helperText}</p>}
  </div>
);

const OutputField: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className={`hm-output ${highlight ? 'hm-output-strong' : ''}`}>
    <span className="hm-output-label">{label}</span>
    <span className="hm-output-value">{value}</span>
  </div>
);

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="hm-card">
    <h3 className="hm-card-title">{title}</h3>
    <div className="space-y-2">{children}</div>
  </div>
);

const RiskFlag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="hm-flag hm-flag-risk">{children}</div>
);

const InfoFlag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="hm-flag hm-flag-info">{children}</div>
);

type HoverData = {
  year: number;
  cumulativeCashflow: number;
  cumulativeEquity: number;
  x: number;
};

export default function HardMoneyToDscrAnalyzer() {
  const [inputs, setInputs] = useState<DealInputs>(defaultInputs); 
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  const handleLoanSizingChange = (method: 'ltv' | 'dscr') => {
    setInputs(prev => ({
      ...prev,
      loanSizingMethod: method,
    }));
  };

  const handleImageFileChange = (index: number, file: File | null) => {
    const newImageUrls = [...inputs.imageUrls];
    // Revoke the old object URL to prevent memory leaks
    if (newImageUrls[index] && newImageUrls[index].startsWith('blob:')) {
      URL.revokeObjectURL(newImageUrls[index]);
    }
    newImageUrls[index] = file ? URL.createObjectURL(file) : '';
    setInputs(prev => ({
      ...prev,
      imageUrls: newImageUrls,
    }));
  };
  const analysis = useMemo(() => analyzeDeal(inputs), [inputs]);
  const projections = useMemo(() => calculateProjections(inputs, analysis), [inputs, analysis]);
  const [hoverData, setHoverData] = useState<HoverData | null>(null);
  const { hardMoney, dscr } = analysis;

  const inputSections = {
    "Purchase & Rehab": [
      { label: "Purchase Price", name: "purchasePrice" },
      { label: "Rehab Budget", name: "rehabBudget" },
      { label: "Rehab Months", name: "rehabMonths" },
    ],
    "Soft Costs & Hard Money": [
      { label: "Closing Costs (Purchase)", name: "closingCosts" },
      { label: "Additional Costs", name: "additionalCosts" },
      { label: "HM Interest Rate", name: "hmInterestRateAnnual", isPercent: true },
      { label: "HM Points", name: "hmPointsPercent", isPercent: true },
    ],
    "DSCR Refi": [
      { label: "After Repair Value (ARV)", name: "arv" },
      { label: "DSCR LTV", name: "dscrLtv", isPercent: true },
      { label: "DSCR Required", name: "dscrRequired" },
      { label: "DSCR Interest Rate", name: "dscrRateAnnual", isPercent: true },
      { label: "DSCR Term (Years)", name: "dscrTermYears" },
      { label: "DSCR Closing Costs", name: "dscrClosingCostPercent", isPercent: true },
    ],
    "Rental & Operations": [
      { label: "Monthly Rent", name: "monthlyRent" },
      { label: "Vacancy Rate", name: "vacancyRate", isPercent: true },
      { label: "Taxes (Annual)", name: "taxesAnnual" },
      { label: "Insurance (Annual)", name: "insuranceAnnual" },
      { label: "HOA (Monthly)", name: "hoaMonthly" },
      { label: "Utilities (Owner, Monthly)", name: "utilitiesMonthlyOwner" },
      { label: "Maintenance % of Rent", name: "maintenancePercentOfRent", isPercent: true },
      { label: "CapEx % of Rent", name: "capexPercentOfRent", isPercent: true },
    ],
    "Long-Term Projections": [
      { label: "Annual Rent Growth", name: "rentGrowthPercentAnnual", isPercent: true },
      { label: "Annual Expense Growth", name: "expenseGrowthPercentAnnual", isPercent: true },
      { label: "Annual Appreciation", name: "appreciationPercentAnnual", isPercent: true },
    ],
  };

  const chartConfig = {
    width: 500,
    height: 250,
    padding: 40,
  };

  const chartData = useMemo(() => {
    if (!projections.years.length) return null;

    const maxEquity = Math.max(...projections.years.map(p => p.cumulativeEquity), 1);
    const maxAbsCashflow = Math.max(...projections.years.map(p => Math.abs(p.cumulativeCashflow)), 1);
    const cashflowRange = {
      min: Math.min(0, ...projections.years.map(p => p.cumulativeCashflow)),
      max: Math.max(0, ...projections.years.map(p => p.cumulativeCashflow)),
    };
    const cashflowTotalRange = cashflowRange.max - cashflowRange.min;

    const getPath = (dataKey: 'cumulativeEquity' | 'cumulativeCashflow') => {
      return projections.years
        .map((p, i) => {
          const x = chartConfig.padding + (p.year / 30) * (chartConfig.width - chartConfig.padding * 2);
          let y;
          if (dataKey === 'cumulativeEquity') {
            y = chartConfig.height - chartConfig.padding - (p.cumulativeEquity / maxEquity) * (chartConfig.height - chartConfig.padding * 2);
          } else {
            y = chartConfig.height - chartConfig.padding - ((p.cumulativeCashflow - cashflowRange.min) / cashflowTotalRange) * (chartConfig.height - chartConfig.padding * 2);
          }
          return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(' ');
    };

    return { maxEquity, cashflowRange, getPath };
  }, [projections]);

  const handleMouseOver = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!chartData) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const year = Math.round(((x - chartConfig.padding) / (chartConfig.width - chartConfig.padding * 2)) * 30);

    if (year >= 1 && year <= 30) {
      const point = projections.years[year - 1];
      if (point) {
        setHoverData({ ...point, x: chartConfig.padding + (point.year / 30) * (chartConfig.width - chartConfig.padding * 2) });
      }
    } else {
      setHoverData(null);
    }
  };

  const handleGeneratePdf = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);
  
    // Get elements to manipulate for PDF layout
    const pdfButton = document.getElementById('pdf-button');
    const inputColumn = document.getElementById('pdf-input-column');
    const outputColumn = document.getElementById('pdf-output-column');
  
    // Hide button and input column, make output column full-width
    pdfButton?.classList.add('hidden');
    inputColumn?.classList.add('hidden');
    outputColumn?.classList.remove('lg:col-span-1');
    outputColumn?.classList.add('lg:col-span-2');
  
    const canvas = await html2canvas(reportRef.current, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      windowWidth: reportRef.current.scrollWidth,
      windowHeight: reportRef.current.scrollHeight,
      onclone: (document) => {
        document.getElementById('pdf-button')?.style.setProperty('display', 'none', 'important');
      }
    });
  
    // Restore layout after capture
    pdfButton?.classList.remove('hidden');
    inputColumn?.classList.remove('hidden');
    outputColumn?.classList.add('lg:col-span-1');
    outputColumn?.classList.remove('lg:col-span-2');
  
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: 'letter',
    });
  
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
    let heightLeft = imgHeight;
    let position = 0;
  
    // Add header
    pdf.setFontSize(16);
    pdf.text('Investment Property Analysis', pdfWidth / 2, 0.5, { align: 'center' });
    pdf.setFontSize(10);
    pdf.text(inputs.imageUrls.some(u => u) ? `Property: ${inputs.purchasePrice}` : 'Sample Property Analysis', 0.5, 0.8);
    pdf.text(`Report Date: ${new Date().toLocaleDateString()}`, pdfWidth - 0.5, 0.8, { align: 'right' });
    position = 1; // Start content below header
    heightLeft -= 1;
  
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdf.internal.pageSize.getHeight() - 1; // page height minus margin
  
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }
  
    pdf.save(`Loan-Analysis-${inputs.purchasePrice || 'Sample'}.pdf`);
    setIsGeneratingPdf(false);
  };

  return (
    <div className="hm-shell">
      <div ref={reportRef} className="hm-report max-w-7xl mx-auto overflow-hidden">
        <div className="hm-header text-center">
          <h1 className="hm-title">Hard Money → DSCR Analyzer</h1>
          <p className="hm-subtitle">Model a BRRRR deal: 80% LTV purchase + 100% rehab financed, then a DSCR refinance.</p>
        </div>

        <div id="pdf-button" className="hm-pdf print:hidden flex justify-center mt-8 mb-4">
          <button
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf}
            className="btn-modern"
          >
            {isGeneratingPdf ? 'Generating...' : 'Create PDF Report'}
          </button>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          <Card title="Property Images">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {inputs.imageUrls.map((url, index) => (
                <div key={index} className="relative">
                  <input
                    id={`imageUpload${index}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileChange(index, e.target.files ? e.target.files[0] : null)}
                    className="sr-only"
                  />
                  <label
                    htmlFor={`imageUpload${index}`}
                    className="cursor-pointer aspect-square rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-600/70 hover:border-cyan-400 transition-colors bg-slate-800/60"
                  >
                    {url ? (
                      <>
                        <img src={url} alt={`Property ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={(e) => { e.preventDefault(); handleImageFileChange(index, null); }}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 text-xs leading-none hover:bg-black/80"
                          aria-label="Remove image"
                        >
                          &#x2715;
                        </button>
                      </>
                    ) : (
                      <span className="text-slate-400 text-sm">Upload {index + 1}</span>
                    )}
                  </label>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Column */}
            <div id="pdf-input-column" className="space-y-6">
              {Object.entries(inputSections).map(([title, fields]) => (
                <Card key={title} title={title}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {title === 'DSCR Refi' && (
                      <div className="sm:col-span-2 flex flex-col gap-2">
                        <span className="hm-label">Loan Sizing Method</span>
                        <div className="hm-pills">
                          <button
                            type="button"
                            onClick={() => handleLoanSizingChange('ltv')}
                            className={`hm-pill ${inputs.loanSizingMethod === 'ltv' ? 'active' : ''}`}
                          >
                            By LTV
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLoanSizingChange('dscr')}
                            className={`hm-pill ${inputs.loanSizingMethod === 'dscr' ? 'active' : ''}`}
                          >
                            By DSCR
                          </button>
                        </div>
                      </div>
                    )}
                    {fields.map((field) => (
                      <div key={field.name} className={fields.length % 2 !== 0 && fields.indexOf(field) === fields.length - 1 ? 'sm:col-span-2' : ''}>
                        <InputField
                          label={field.label}
                          name={field.name as keyof DealInputs}
                          value={inputs[field.name as keyof DealInputs]}
                          onChange={(e) => {
                            const { name, value } = e.target;
                            const isPercent = field.isPercent;
                            const numericValue = parseFloat(value);
                            setInputs((prev) => ({
                              ...prev,
                              [name]: isPercent ? (isNaN(numericValue) ? 0 : numericValue / 100) : (isNaN(numericValue) ? 0 : numericValue),
                            }));
                          }}
                          isPercent={field.isPercent}
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>

            {/* Output Column */}
            <div id="pdf-output-column" className="space-y-6 lg:col-span-1">
              <Card title="Initial Investment Summary">
                <OutputField label="Purchase Loan (80% LTV)" value={formatCurrency(hardMoney.hmPurchaseLoanAmount)} />
                <OutputField label="Rehab Loan (100% financed)" value={formatCurrency(hardMoney.hmRehabLoanAmount)} />
                <OutputField label="Total Hard Money Loan" value={formatCurrency(hardMoney.hmTotalLoanAmount)} />
                <hr className="border-slate-800 my-2" />
                <OutputField label="Your Down Payment" value={formatCurrency(hardMoney.hmDownPayment)} />
                <OutputField label="Total Cash to Close" value={formatCurrency(hardMoney.cashToClose)} />
                <hr className="border-slate-800 my-2" />
                <OutputField label="Monthly Interest (IO Only)" value={formatCurrency(hardMoney.hmMonthlyInterestOnly)} />
                <OutputField label="Total Interest During Rehab" value={formatCurrency(hardMoney.hmTotalInterestDuringRehab)} />
              </Card>

              <Card title="Refinance Summary (DSCR Loan)">
                <OutputField label="ARV" value={formatCurrency(inputs.arv)} />
                <OutputField label="Max Loan Allowed by LTV" value={formatCurrency(dscr.loanByLtv)} />
                <OutputField label="Max Loan Allowed by DSCR" value={formatCurrency(dscr.loanByDscr)} />
                <OutputField label="Approved Loan Amount" value={formatCurrency(dscr.finalLoanAmount)} highlight />
                <hr className="border-slate-800 my-2" />
                <OutputField label="Actual DSCR" value={formatNumber(dscr.achievedDscr)} />
                <OutputField label="Refinance Closing Costs" value={formatCurrency(dscr.refiClosingCosts)} />
                {dscr.achievedDscr < inputs.dscrRequired && (
                  <RiskFlag>Loan limited by DSCR — income too tight for full leverage.</RiskFlag>
                )}
              </Card>

              <Card title="Monthly Cashflow (Investor View)">
                <OutputField label="Rent Collected" value={formatCurrency(inputs.monthlyRent)} />
                <OutputField label="Vacancy Adjustment" value={`-${formatCurrency(inputs.monthlyRent * inputs.vacancyRate)}`} />
                <hr className="border-slate-800 my-2" />
                <OutputField label="Effective Income After Vacancy" value={formatCurrency(dscr.effectiveGrossIncomeAnnual / 12)} />
                <div className="text-sm text-slate-400 pt-2">- Operating Expenses</div>
                <div className="pl-4 text-sm space-y-1">
                  <OutputField label="Taxes" value={`-${formatCurrency(inputs.taxesAnnual / 12)}`} />
                  <OutputField label="Insurance" value={`-${formatCurrency(inputs.insuranceAnnual / 12)}`} />
                  <OutputField label="Maintenance" value={`-${formatCurrency(inputs.monthlyRent * inputs.maintenancePercentOfRent)}`} />
                  <OutputField label="CapEx" value={`-${formatCurrency(inputs.monthlyRent * inputs.capexPercentOfRent)}`} />
                  <OutputField label="Management" value={`-${formatCurrency(inputs.monthlyRent * inputs.managementPercentOfRent)}`} />
                  <OutputField label="HOA" value={`-${formatCurrency(inputs.hoaMonthly)}`} />
                  <OutputField label="Utilities" value={`-${formatCurrency(inputs.utilitiesMonthlyOwner)}`} />
                </div>
                <hr className="border-slate-800 my-2" />
                <OutputField label="NOI (Before Debt)" value={formatCurrency(dscr.noiAnnual / 12)} />
                <hr className="border-slate-800 my-2" />
                <OutputField label="Loan Payment (P&I)" value={`-${formatCurrency(dscr.monthlyMortgagePayment)}`} />
                <hr className="border-slate-700 my-2" />
                <OutputField label="Net Cashflow (After Debt)" value={formatCurrency(dscr.monthlyCashflowAfterDebt)} highlight />
              </Card>

              <Card title="Investor Returns Summary">
                <OutputField label="Total Cash Invested" value={formatCurrency(hardMoney.totalCashIntoDealBeforeRefi)} />
                <OutputField label="Cash Returned at Refi" value={formatCurrency(dscr.netCashAtRefi)} />
                <OutputField label="Return on Cash at Refi" value={formatPercent(dscr.refiCashOutReturn)} highlight />
                <OutputField label="Cash Remaining in Deal" value={formatCurrency(dscr.cashLeftInDeal)} highlight />
                <OutputField label="Equity Created" value={formatCurrency(dscr.equityAfterRefi)} />
                <hr className="border-slate-800 my-2" />
                <OutputField label="Monthly Cashflow After Debt" value={formatCurrency(dscr.monthlyCashflowAfterDebt)} />
                <OutputField label="Cash-on-Cash: Year 1" value={formatPercent(dscr.cashOnCashReturnYear1)} highlight />
                {hardMoney.totalProjectCost > inputs.arv * 0.85 && (
                  <RiskFlag>Warning: Your total project cost is high relative to ARV.</RiskFlag>
                )}
                {dscr.cashLeftInDeal > 1 && (
                  <InfoFlag>This amount remains invested after refinance.</InfoFlag>
                )}
              </Card>

              {/* Appraisal / Bank Underwriting Summary */}
              <Card title="Appraisal / Bank Underwriting Summary">
                <OutputField label="NOI (Annual)" value={formatCurrency(dscr.noiAnnual)} />
                <OutputField label="Achieved DSCR" value={formatNumber(dscr.achievedDscr)} />
                <OutputField
                  label="Implied Cap Rate"
                  value={formatPercent(dscr.noiAnnual / inputs.arv)}
                />
                <OutputField
                  label="Income Approach Value (NOI / Market Cap Rate)"
                  value={formatCurrency(dscr.noiAnnual / 0.065)}
                />
                <div className="pt-2">
                  <div className="text-slate-400 text-xs font-semibold pb-1">DSCR Sensitivity (-5% to +5% Rent)</div>
                  <OutputField
                    label="DSCR at -5% Rent"
                    value={formatNumber((dscr.noiAnnual * 0.95) / dscr.annualDebtService)}
                  />
                  <OutputField
                    label="DSCR at +5% Rent"
                    value={formatNumber((dscr.noiAnnual * 1.05) / dscr.annualDebtService)}
                  />
                </div>
                {/* Conservative underwriting flags */}
                {dscr.achievedDscr < inputs.dscrRequired && (
                  <RiskFlag>DSCR falls below lender requirement under current NOI.</RiskFlag>
                )}
                {(dscr.noiAnnual / inputs.arv) < 0.055 && (
                  <RiskFlag>Cap rate is unusually low — valuation may be aggressive.</RiskFlag>
                )}
              </Card>

              <Card title="30-Year Cash Flow Projection">
                <div className="overflow-x-auto">
                  <table className="hm-table text-sm">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Rent</th>
                        <th>NOI (Annual)</th>
                        <th>Cash Flow (Mo)</th>
                        <th>Cum. Cash Flow</th>
                        <th>Cum. Equity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projections.years.map((p) => (
                        <tr key={p.year}>
                          <td className="font-medium text-slate-200">{p.year}</td>
                          <td>{formatCurrency(p.monthlyRent)}</td>
                          <td>{formatCurrency(p.noiAnnual)}</td>
                          <td className={p.monthlyCashflow > 0 ? 'text-emerald-400' : 'text-amber-400'}>{formatCurrency(p.monthlyCashflow)}</td>
                          <td className={p.cumulativeCashflow > 0 ? 'text-slate-200' : 'text-orange-300'}>{formatCurrency(p.cumulativeCashflow)}</td>
                          <td className="text-cyan-300 font-semibold">{formatCurrency(p.cumulativeEquity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {chartData && (
                  <div className="relative mt-4 hm-chart">
                    <svg
                      width="100%"
                      viewBox={`0 0 ${chartConfig.width} ${chartConfig.height}`}
                      onMouseMove={handleMouseOver}
                      onMouseLeave={() => setHoverData(null)}
                    >
                      {Array.from({ length: 5 }).map((_, i) => (
                        <line
                          key={i}
                          x1={chartConfig.padding}
                          y1={chartConfig.padding + (i / 4) * (chartConfig.height - chartConfig.padding * 2)}
                          x2={chartConfig.width - chartConfig.padding}
                          y2={chartConfig.padding + (i / 4) * (chartConfig.height - chartConfig.padding * 2)}
                          stroke="#1f2937"
                          strokeWidth="1"
                        />
                      ))}
                      <line
                        x1={chartConfig.padding}
                        y1={chartConfig.height - chartConfig.padding}
                        x2={chartConfig.width - chartConfig.padding}
                        y2={chartConfig.height - chartConfig.padding}
                        stroke="#334155"
                        strokeWidth="1"
                      />
                      <path d={chartData.getPath('cumulativeCashflow')} fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                      <path d={chartData.getPath('cumulativeEquity')} fill="none" stroke="#06b6d4" strokeWidth="2.5" />

                      {hoverData && (
                        <g>
                          <line
                            x1={hoverData.x}
                            y1={chartConfig.padding}
                            x2={hoverData.x}
                            y2={chartConfig.height - chartConfig.padding}
                            stroke="#94a3b8"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                          <foreignObject x={hoverData.x > chartConfig.width / 2 ? hoverData.x - 140 : hoverData.x + 10} y={chartConfig.padding} width="130" height="90">
                            <div className="bg-slate-900/90 border border-slate-700 rounded-md p-2 text-xs shadow-lg text-slate-100">
                              <div className="font-bold">Year {hoverData.year}</div>
                              <div><span className="text-cyan-300 font-semibold">Equity:</span> {formatCurrency(hoverData.cumulativeEquity)}</div>
                              <div><span className="text-amber-300 font-semibold">Cash:</span> {formatCurrency(hoverData.cumulativeCashflow)}</div>
                            </div>
                          </foreignObject>
                        </g>
                      )}
                    </svg>
                    <div className="hm-chart-legend mt-2">
                      <span><span className="hm-legend-dot" style={{ background: '#06b6d4' }} /> Cumulative Equity</span>
                      <span><span className="hm-legend-dot" style={{ background: '#f59e0b' }} /> Cumulative Cash Flow</span>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
