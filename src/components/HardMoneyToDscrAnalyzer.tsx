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

// 1) Deal Inputs
// ---------------------------------------------------
type DealInputs = {
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
  <div className="flex flex-col space-y-1">
    <label htmlFor={name} className="text-sm font-medium text-gray-600">{label}</label>
    <div className="relative">
      <input
        id={name}
        name={name}
        type="number"
        step={isPercent ? "0.01" : "100"}
        value={isPercent ? value * 100 : value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      {isPercent && <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">%</span>}
    </div>
    {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
  </div>
);

const OutputField: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className={`flex justify-between items-center py-2 ${highlight ? 'font-bold' : ''}`}>
    <span className="text-gray-600">{label}</span>
    <span className={highlight ? 'text-blue-600' : 'text-gray-900'}>{value}</span>
  </div>
);

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-xl shadow p-4 sm:p-6">
    <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">{title}</h3>
    <div className="space-y-2">{children}</div>
  </div>
);

const RiskFlag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-3 mt-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">
    {children}
  </div>
);

const InfoFlag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="p-3 mt-4 text-sm text-blue-700 bg-blue-100 border border-blue-300 rounded-md">
      {children}
    </div>
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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const isPercent = e.target.dataset.isPercent === 'true';
    const numericValue = parseFloat(value);

    setInputs(prev => ({
      ...prev,
      [name]: isPercent ? (isNaN(numericValue) ? 0 : numericValue / 100) : (isNaN(numericValue) ? 0 : numericValue),
    }));
  };

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
    <div className="bg-gray-50 min-h-screen">
      <div ref={reportRef} className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 bg-white">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Hard Money → DSCR Analyzer</h1>
          <p className="mt-2 text-md text-gray-600">Model a BRRRR deal: 80% LTV purchase + 100% rehab financed, then a DSCR refinance.</p>
        </div>

        <div id="pdf-button" className="fixed bottom-6 right-6 z-50 print:hidden">
            <button
                onClick={handleGeneratePdf}
                disabled={isGeneratingPdf}
                className="bg-blue-600 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-blue-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {isGeneratingPdf ? 'Generating...' : 'Create PDF Report'}
            </button>
        </div>

        <Card title="Property Images">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {inputs.imageUrls.map((url, index) => (
              <div key={index} className="relative">
                <input
                  id={`imageUpload${index}`}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageFileChange(index, e.target.files ? e.target.files[0] : null)}
                  className="sr-only" // Visually hide the input
                />
                <label
                  htmlFor={`imageUpload${index}`}
                  className="cursor-pointer aspect-square bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors"
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
                    <span className="text-gray-500 text-sm">Upload {index + 1}</span>
                  )}
                </label>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Column */}
          <div id="pdf-input-column" className="space-y-6">
            {Object.entries(inputSections).map(([title, fields]) => (
              <Card key={title} title={title}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {title === "DSCR Refi" && (
                    <div className="sm:col-span-2">
                      <label className="text-sm font-medium text-gray-600">Loan Sizing Method</label>
                      <div className="mt-1 flex rounded-md border border-gray-300 p-0.5 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleLoanSizingChange('ltv')}
                          className={`w-1/2 rounded-md px-3 py-1 text-sm font-semibold transition-colors ${
                            inputs.loanSizingMethod === 'ltv' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          By LTV
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLoanSizingChange('dscr')}
                          className={`w-1/2 rounded-md px-3 py-1 text-sm font-semibold transition-colors ${
                            inputs.loanSizingMethod === 'dscr' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          By DSCR
                        </button>
                      </div>
                    </div>
                  )}
                  {fields.map(field => (
                    <div key={field.name} className={fields.length % 2 !== 0 && fields.indexOf(field) === fields.length -1 ? 'sm:col-span-2' : ''}>
                        <InputField
                            label={field.label}
                            name={field.name as keyof DealInputs}
                            value={inputs[field.name as keyof DealInputs]}
                            onChange={(e) => {
                                const { name, value } = e.target;
                                const isPercent = field.isPercent;
                                const numericValue = parseFloat(value);
                                setInputs(prev => ({
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
            <Card title="Hard Money Summary">
              <OutputField label="HM Purchase Loan" value={formatCurrency(hardMoney.hmPurchaseLoanAmount)} />
              <OutputField label="HM Rehab Loan" value={formatCurrency(hardMoney.hmRehabLoanAmount)} />
              <OutputField label="HM Total Loan" value={formatCurrency(hardMoney.hmTotalLoanAmount)} />
              <hr className="border-t border-gray-200" />
              <OutputField label="Down Payment" value={formatCurrency(hardMoney.hmDownPayment)} />
              <OutputField label="Cash to Close" value={formatCurrency(hardMoney.cashToClose)} />
              <hr className="border-t border-gray-200" />
              <OutputField label="HM Monthly Interest-Only" value={formatCurrency(hardMoney.hmMonthlyInterestOnly)} />
              <OutputField label="HM Total Interest (Rehab)" value={formatCurrency(hardMoney.hmTotalInterestDuringRehab)} />
            </Card>

            <Card title="DSCR & Refi">
              <OutputField label="ARV" value={formatCurrency(inputs.arv)} />
              <OutputField label="Loan by LTV" value={formatCurrency(dscr.loanByLtv)} />
              <OutputField label="Loan by DSCR" value={formatCurrency(dscr.loanByDscr)} />
              <OutputField label="Final Loan Amount" value={formatCurrency(dscr.finalLoanAmount)} highlight />
              <hr className="border-t border-gray-200" />
              <OutputField label="DSCR Achieved" value={formatNumber(dscr.achievedDscr)} />
              <OutputField label="Refi Closing Costs" value={formatCurrency(dscr.refiClosingCosts)} />
              {dscr.achievedDscr < inputs.dscrRequired && (
                <RiskFlag>Loan is DSCR-constrained. Cashflow is tight.</RiskFlag>
              )}
            </Card>

            <Card title="Monthly Cash Flow Breakdown">
              <OutputField label="Gross Scheduled Rent" value={formatCurrency(inputs.monthlyRent)} />
              <OutputField label="Vacancy Loss" value={`-${formatCurrency(inputs.monthlyRent * inputs.vacancyRate)}`} />
              <hr className="border-t border-gray-200" />
              <OutputField label="Effective Gross Income" value={formatCurrency(dscr.effectiveGrossIncomeAnnual / 12)} />
              <div className="text-sm text-gray-500 pt-2">- Operating Expenses</div>
              <div className="pl-4 text-sm space-y-1">
                <OutputField label="Taxes" value={`-${formatCurrency(inputs.taxesAnnual / 12)}`} />
                <OutputField label="Insurance" value={`-${formatCurrency(inputs.insuranceAnnual / 12)}`} />
                <OutputField label="Maintenance" value={`-${formatCurrency(inputs.monthlyRent * inputs.maintenancePercentOfRent)}`} />
                <OutputField label="CapEx" value={`-${formatCurrency(inputs.monthlyRent * inputs.capexPercentOfRent)}`} />
                <OutputField label="Management" value={`-${formatCurrency(inputs.monthlyRent * inputs.managementPercentOfRent)}`} />
                <OutputField label="HOA" value={`-${formatCurrency(inputs.hoaMonthly)}`} />
                <OutputField label="Utilities" value={`-${formatCurrency(inputs.utilitiesMonthlyOwner)}`} />
              </div>
              <hr className="border-t border-gray-200" />
              <OutputField label="Net Operating Income (NOI)" value={formatCurrency(dscr.noiAnnual / 12)} />
              <hr className="border-t border-gray-200" />
              <OutputField label="Mortgage (P&I)" value={`-${formatCurrency(dscr.monthlyMortgagePayment)}`} />
              <hr className="border-t-2 border-gray-300" />
              <OutputField label="Total Monthly Cash Flow" value={formatCurrency(dscr.monthlyCashflowAfterDebt)} highlight />
            </Card>

            <Card title="Final Position">
              <OutputField label="Total Cash Into Deal (before refi)" value={formatCurrency(hardMoney.totalCashIntoDealBeforeRefi)} />
              <OutputField label="Cash Back to You at Refi" value={formatCurrency(dscr.netCashAtRefi)} />
              <OutputField label="Cash Out vs. Cash In" value={formatPercent(dscr.refiCashOutReturn)} highlight />
              <OutputField label="Your Cash Left in Deal" value={formatCurrency(dscr.cashLeftInDeal)} highlight />
              <OutputField label="Your Equity Created" value={formatCurrency(dscr.equityAfterRefi)} />
              <hr className="border-t border-gray-200" />
              <OutputField label="Monthly Cashflow After Debt" value={formatCurrency(dscr.monthlyCashflowAfterDebt)} />
              <OutputField label="Year 1 Cash-on-Cash Return" value={formatPercent(dscr.cashOnCashReturnYear1)} highlight />
              {hardMoney.totalProjectCost > inputs.arv * 0.85 && (
                <RiskFlag>All-in cost ({formatCurrency(hardMoney.totalProjectCost)}) is &gt; 85% of ARV.</RiskFlag>
              )}
              {dscr.cashLeftInDeal > 1 && (
                <InfoFlag>You have {formatCurrency(dscr.cashLeftInDeal)} of your own cash in this deal.</InfoFlag>
              )}
            </Card>

            <Card title="30-Year Cash Flow Projection">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-100">
                    <tr>
                      <th className="px-4 py-2">Year</th>
                      <th className="px-4 py-2 text-right">Rent</th>
                      <th className="px-4 py-2 text-right">NOI (Annual)</th>
                      <th className="px-4 py-2 text-right">Cash Flow (Mo)</th>
                      <th className="px-4 py-2 text-right">Cum. Cash Flow</th>
                      <th className="px-4 py-2 text-right">Cum. Equity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projections.years.map(p => (
                      <tr key={p.year} className="border-b border-gray-200 last:border-b-0">
                        <td className="px-4 py-2 font-medium">{p.year}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(p.monthlyRent)}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(p.noiAnnual)}</td>
                        <td className={`px-4 py-2 text-right font-semibold ${p.monthlyCashflow > 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(p.monthlyCashflow)}</td>
                        <td className={`px-4 py-2 text-right font-semibold ${p.cumulativeCashflow > 0 ? 'text-gray-700' : 'text-orange-600'}`}>{formatCurrency(p.cumulativeCashflow)}</td>
                        <td className={`px-4 py-2 text-right font-bold text-blue-700`}>{formatCurrency(p.cumulativeEquity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {chartData && (
                <div className="relative mt-4">
                  <svg
                    width="100%"
                    viewBox={`0 0 ${chartConfig.width} ${chartConfig.height}`}
                    onMouseMove={handleMouseOver}
                    onMouseLeave={() => setHoverData(null)}
                  >
                    {/* Y-Axis Grid Lines */}
                    {Array.from({ length: 5 }).map((_, i) => (
                      <line
                        key={i}
                        x1={chartConfig.padding}
                        y1={chartConfig.padding + (i / 4) * (chartConfig.height - chartConfig.padding * 2)}
                        x2={chartConfig.width - chartConfig.padding}
                        y2={chartConfig.padding + (i / 4) * (chartConfig.height - chartConfig.padding * 2)}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                      />
                    ))}
                    {/* X-Axis */}
                    <line
                      x1={chartConfig.padding}
                      y1={chartConfig.height - chartConfig.padding}
                      x2={chartConfig.width - chartConfig.padding}
                      y2={chartConfig.height - chartConfig.padding}
                      stroke="#d1d5db"
                      strokeWidth="1"
                    />
                    {/* Data Paths */}
                    <path d={chartData.getPath('cumulativeCashflow')} fill="none" stroke="#f59e0b" strokeWidth="2" />
                    <path d={chartData.getPath('cumulativeEquity')} fill="none" stroke="#1d4ed8" strokeWidth="2" />

                    {/* Hover Indicator */}
                    {hoverData && (
                      <g>
                        <line
                          x1={hoverData.x}
                          y1={chartConfig.padding}
                          x2={hoverData.x}
                          y2={chartConfig.height - chartConfig.padding}
                          stroke="#9ca3af"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                        <foreignObject x={hoverData.x > chartConfig.width / 2 ? hoverData.x - 130 : hoverData.x + 10} y={chartConfig.padding} width="120" height="80">
                           <div className="bg-white/80 backdrop-blur-sm border border-gray-300 rounded-md p-2 text-xs shadow-lg">
                              <div className="font-bold">Year {hoverData.year}</div>
                              <div><span className="font-semibold text-blue-700">Equity:</span> {formatCurrency(hoverData.cumulativeEquity)}</div>
                              <div><span className="font-semibold text-amber-500">Cash:</span> {formatCurrency(hoverData.cumulativeCashflow)}</div>
                           </div>
                        </foreignObject>
                      </g>
                    )}
                  </svg>
                  <div className="flex justify-center gap-4 text-xs mt-2">
                      <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-700"></div>
                          <span>Cumulative Equity</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                          <span>Cumulative Cash Flow</span>
                      </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}