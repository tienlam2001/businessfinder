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

import React, { useState, useMemo } from 'react';

// 1) Deal Inputs
// ---------------------------------------------------
type DealInputs = {
  // Purchase & Rehab
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
  cashOnCashReturnYear1: number;   // annualCashflowAfterDebt / max(cashLeftInDeal, 1)
};

// 4) Global Calculation Result
// ---------------------------------------------------
type DealAnalysis = {
  inputs: DealInputs;
  hardMoney: HardMoneyPhase;
  dscr: DscrPhase;
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
  const finalLoanAmount = Math.min(loanByLtv, loanByDscr);
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
    cashOnCashReturnYear1,
  };

  return { inputs, hardMoney, dscr };
}

// ===================================================
// UI / UX REQUIREMENTS
// ===================================================

const defaultInputs: DealInputs = {
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
        step={isPercent ? "0.1" : "100"}
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

export default function HardMoneyToDscrAnalyzer() {
  const [inputs, setInputs] = useState<DealInputs>(defaultInputs);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const isPercent = e.target.dataset.isPercent === 'true';
    const numericValue = parseFloat(value);

    setInputs(prev => ({
      ...prev,
      [name]: isPercent ? (isNaN(numericValue) ? 0 : numericValue / 100) : (isNaN(numericValue) ? 0 : numericValue),
    }));
  };

  const analysis = useMemo(() => analyzeDeal(inputs), [inputs]);
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
      { label: "Management % of Rent", name: "managementPercentOfRent", isPercent: true },
    ],
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Hard Money → DSCR Analyzer</h1>
          <p className="mt-2 text-md text-gray-600">Model a BRRRR deal: 80% LTV purchase + 100% rehab financed, then a DSCR refinance.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Column */}
          <div className="space-y-6">
            {Object.entries(inputSections).map(([title, fields]) => (
              <Card key={title} title={title}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="space-y-6">
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
              <OutputField label="Net Cash At Refi" value={formatCurrency(dscr.netCashAtRefi)} />
              {dscr.achievedDscr < inputs.dscrRequired && (
                <RiskFlag>Loan is DSCR-constrained. Cashflow is tight.</RiskFlag>
              )}
            </Card>

            <Card title="Final Position">
              <OutputField label="Total Cash Into Deal (before refi)" value={formatCurrency(hardMoney.totalCashIntoDealBeforeRefi)} />
              <OutputField label="Cash Left in Deal" value={formatCurrency(dscr.cashLeftInDeal)} highlight />
              <OutputField label="Equity After Refi" value={formatCurrency(dscr.equityAfterRefi)} />
              <hr className="border-t border-gray-200" />
              <OutputField label="Monthly Cashflow After Debt" value={formatCurrency(dscr.monthlyCashflowAfterDebt)} />
              <OutputField label="Year 1 Cash-on-Cash Return" value={formatPercent(dscr.cashOnCashReturnYear1)} highlight />
              {hardMoney.totalProjectCost > inputs.arv * 0.85 && (
                <RiskFlag>All-in cost ({formatCurrency(hardMoney.totalProjectCost)}) is &gt; 85% of ARV.</RiskFlag>
              )}
              {dscr.cashLeftInDeal > 0 && (
                <InfoFlag>You still have {formatCurrency(dscr.cashLeftInDeal)} tied up in this deal.</InfoFlag>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}