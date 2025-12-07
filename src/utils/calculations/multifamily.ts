export type Unit = {
  type: string; // "1BR", "2BR", "Studio"
  count: number;
  rent: number; // monthly rent per unit
};

export type Expenses = {
  taxes: number;
  insurance: number;
  repairs: number;
  capEx: number;
  management: number;
  utilities: number;
  payroll: number;
  other: number;
  vacancyRate: number; // 0.05 = 5%
};

export type LoanTerms = {
  ltv: number; // 0.75 = 75%
  interestRate: number; // 0.065 = 6.5%
  amortYears: number; // 25, 30
};

export type BeforeValueAdd = {
  purchasePrice: number;
  closingCosts: number;
  unitMix: Unit[];
  expenses: Expenses;
  loan: LoanTerms;
  asIsCapRate?: number; // optional; if provided, use for implied value
};

export type AfterValueAdd = {
  rehabBudget: number;
  postRehabUnitMix: Unit[]; // rents after renovation / reposition
  postRehabExpenses: Expenses;
  exitCapRate: number; // used for stabilized value
  refiLoan: LoanTerms; // refi LTV, rate, amort
};

export type MultifamilyDeal = {
  id: string;
  name: string;
  address: string;
  market: string;
  yearBuilt?: number;

  before: BeforeValueAdd;
  after: AfterValueAdd;
};

export function calcGrossRent(unitMix: Unit[]): number {
  return unitMix.reduce(
    (sum, u) => sum + (Number(u.rent) || 0) * (Number(u.count) || 0) * 12, // Annualize
    0
  );
}

export function calcNOI(unitMix: Unit[], expenses: Expenses) {
  const grossRent = calcGrossRent(unitMix);
  const egi = grossRent * (1 - (expenses.vacancyRate || 0));

  const {
    taxes = 0,
    insurance = 0,
    repairs = 0,
    capEx = 0,
    management = 0,
    utilities = 0,
    payroll = 0,
    other = 0,
  } = expenses;

  // If management is provided as a fixed amount, use it. Otherwise, calculate it as a % of EGI.
  const managementCost = management > 0 ? management : egi * 0.08; // Default 8% if not provided

  // If CapEx is not provided, default to $300/unit/year
  const totalUnits = unitMix.reduce((sum, u) => sum + (Number(u.count) || 0), 0);
  const capExCost = capEx > 0 ? capEx : totalUnits * 300;

  const totalExpenses =
    taxes + insurance + repairs + capExCost + managementCost + utilities + payroll + other;

  const noi = egi - totalExpenses;

  return { grossRent, egi, totalExpenses, noi };
}

export function annualDebtService(principal: number, rate: number, years: number) {
  if (!principal || !rate || !years || years <= 0 || rate <= 0) return 0;
  const monthlyRate = rate / 12;
  const n = years * 12;
  const payment = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));
  return payment * 12;
}

export function calcDSCR(noi: number, ads: number) {
  if (!ads || ads === 0) return Infinity;
  return noi / ads;
}

export function calcValueFromNOI(noi: number, capRate: number) {
  if (!noi || !capRate || capRate === 0) return 0;
  return noi / capRate;
}

export function calcBefore(deal: MultifamilyDeal) {
  const { before } = deal;
  const { purchasePrice, unitMix, expenses, loan, asIsCapRate } = before;

  const { grossRent, egi, totalExpenses, noi } = calcNOI(unitMix, expenses);

  const loanAmount = (purchasePrice || 0) * (loan.ltv || 0);
  const ads = annualDebtService(loanAmount, loan.interestRate, loan.amortYears);
  const dscr = calcDSCR(noi, ads);
  const cashflow = noi - ads;

  const cashInvested = (purchasePrice || 0) + (before.closingCosts || 0) - loanAmount;
  const cashOnCash = cashInvested > 0 ? cashflow / cashInvested : Infinity;

  let asIsValue = purchasePrice || 0;
  if (asIsCapRate && asIsCapRate > 0) {
    asIsValue = calcValueFromNOI(noi, asIsCapRate);
  }

  const asIsCap = asIsValue > 0 ? noi / asIsValue : 0;

  return {
    grossRent,
    egi,
    totalExpenses,
    noi,
    loanAmount,
    ads,
    dscr,
    asIsValue,
    asIsCap,
    cashflow,
    cashInvested,
    cashOnCash,
  };
}

export function calcAfter(deal: MultifamilyDeal) {
  const { before, after } = deal;

  const { purchasePrice, closingCosts } = before;
  const { rehabBudget, postRehabUnitMix, postRehabExpenses, exitCapRate, refiLoan } = after;

  const {
    grossRent,
    egi,
    totalExpenses,
    noi,
  } = calcNOI(postRehabUnitMix, postRehabExpenses);

  const stabilizedValue = calcValueFromNOI(noi, exitCapRate);

  const refiLoanAmount = stabilizedValue * (refiLoan.ltv || 0);
  const refiADS = annualDebtService(refiLoanAmount, refiLoan.interestRate, refiLoan.amortYears);
  const refiDSCR = calcDSCR(noi, refiADS);
  const cashflowAfterRefi = noi - refiADS;

  const totalProjectCost = (purchasePrice || 0) + (closingCosts || 0) + (rehabBudget || 0);

  const cashLeftIn = totalProjectCost - refiLoanAmount;
  const equityCreated = stabilizedValue - totalProjectCost;
  const cashOnCash = cashLeftIn > 0 ? cashflowAfterRefi / cashLeftIn : Infinity;

  return {
    grossRent, egi, totalExpenses, noi,
    stabilizedValue,
    refiLoanAmount, refiADS, refiDSCR,
    totalProjectCost,
    cashLeftIn,
    equityCreated,
    cashflowAfterRefi,
    cashOnCash,
  };
}
