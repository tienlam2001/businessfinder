const DEFAULT_VACANCY_RATE = 0.05;
const DEFAULT_MANAGEMENT_RATE = 0.08; // 8% of EGI if not provided
const DEFAULT_CAPEX_PER_UNIT = 250; // annual reserve per door
const DEFAULT_INSURANCE_PER_UNIT = 350; // annual default per door

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};
const hasNumber = (value) => value !== undefined && value !== null && value !== '';

export function calculateGrossPotentialRent(unitMix = []) {
  return unitMix.reduce(
    (sum, unit) => sum + toNumber(unit.currentRent) * toNumber(unit.count),
    0
  );
}

export function calculateEffectiveGrossIncome(gpr, vacancyRatePct = DEFAULT_VACANCY_RATE * 100) {
  const vacancyRate = clamp(toNumber(vacancyRatePct) / 100, 0, 1);
  return {
    vacancyRate,
    effectiveGrossIncome: gpr * (1 - vacancyRate),
  };
}

export function calculateOperatingExpenses(unitMix = [], expenses = {}, effectiveGrossIncome) {
  const totalUnits = unitMix.reduce((sum, unit) => sum + toNumber(unit.count), 0);
  const taxes = toNumber(expenses.taxes);
  const insurance = hasNumber(expenses.insurance)
    ? toNumber(expenses.insurance)
    : totalUnits * DEFAULT_INSURANCE_PER_UNIT;
  const repairs = toNumber(expenses.repairs);
  const capEx = hasNumber(expenses.capEx)
    ? toNumber(expenses.capEx)
    : totalUnits * DEFAULT_CAPEX_PER_UNIT;
  const utilities = toNumber(expenses.utilities);
  const payroll = toNumber(expenses.payroll);
  const other = toNumber(expenses.other);

  const management = hasNumber(expenses.management)
    ? toNumber(expenses.management)
    : effectiveGrossIncome * DEFAULT_MANAGEMENT_RATE;

  const totalExpenses = taxes + insurance + repairs + capEx + utilities + payroll + other + management;

  return {
    totalUnits,
    taxes,
    insurance,
    repairs,
    capEx,
    utilities,
    payroll,
    other,
    management,
    totalExpenses,
  };
}

export function calculateValuation(noi, capRatePct) {
  const capRate = clamp(toNumber(capRatePct) / 100, 0, 1);
  if (capRate <= 0) return { value: 0, capRate };
  return { value: noi / capRate, capRate };
}

export function calculateLoanAmount(basis, ltvPct) {
  return toNumber(basis) * (clamp(toNumber(ltvPct), 0, 100) / 100);
}

export function calculateAnnualDebtService(loanAmount, interestRatePct, amortYears) {
  const principal = toNumber(loanAmount);
  const rate = clamp(toNumber(interestRatePct), 0, 100) / 100 / 12;
  const termMonths = Math.max(1, Math.round(toNumber(amortYears) * 12));

  if (principal <= 0 || rate <= 0) return 0;

  const monthlyPayment = (principal * rate) / (1 - Math.pow(1 + rate, -termMonths));
  return monthlyPayment * 12;
}

export function calculateDSCR(noi, annualDebtService) {
  if (annualDebtService <= 0) return 0;
  return toNumber(noi) / annualDebtService;
}

export function calculateCashLeftIn(purchasePrice, rehabBudget, closingCosts, refiLoan) {
  const totalCost = toNumber(purchasePrice) + toNumber(rehabBudget) + toNumber(closingCosts);
  return {
    totalCost,
    cashLeftIn: totalCost - toNumber(refiLoan),
  };
}

export function calculateMultifamily(deal) {
  const unitMix = deal?.unitMix || [];
  const expenses = deal?.expenses || {};
  const purchasePrice = toNumber(deal?.purchasePrice);
  const rehabBudget = toNumber(deal?.rehabBudget);
  const closingCosts = toNumber(deal?.closingCosts);
  const loan = deal?.loan || {};
  const refinance = deal?.refinance || {};

  const grossPotentialRent = calculateGrossPotentialRent(unitMix);
  const { vacancyRate, effectiveGrossIncome } = calculateEffectiveGrossIncome(
    grossPotentialRent,
    expenses.vacancyRate
  );
  const opEx = calculateOperatingExpenses(unitMix, expenses, effectiveGrossIncome);
  const noi = effectiveGrossIncome - opEx.totalExpenses;

  const valuation = calculateValuation(noi, refinance.capRate);
  const stabilizedValue = Math.max(0, valuation.value);
  const acquisitionLoan = calculateLoanAmount(Math.max(0, purchasePrice), loan.ltv);
  const refinanceLoanUncapped = calculateLoanAmount(stabilizedValue, refinance.refiLTV);
  const refinanceLoan = Math.min(refinanceLoanUncapped, stabilizedValue);
  const annualDebtService = calculateAnnualDebtService(
    acquisitionLoan,
    loan.interestRate,
    loan.amortYears
  );
  const dscr = calculateDSCR(noi, annualDebtService);
  const { totalCost, cashLeftIn } = calculateCashLeftIn(
    purchasePrice,
    rehabBudget,
    closingCosts,
    refinanceLoan
  );

  const equityCreated = valuation.value - totalCost;

  const warnings = [];
  if (!unitMix.length) warnings.push('Add at least one unit to run calculations.');
  if (valuation.capRate <= 0) warnings.push('Cap rate must be greater than 0 to value the property.');
  if (dscr > 0 && dscr < 1.15) warnings.push('DSCR is below 1.15x lender comfort.');
  if (refinanceLoanUncapped > stabilizedValue)
    warnings.push('Refi loan exceeds stabilized value. Clamping to LTV.');

  return {
    grossPotentialRent,
    effectiveGrossIncome,
    vacancyRate,
    totalUnits: opEx.totalUnits,
    noi,
    expenses: opEx,
    valuation,
    acquisitionLoan,
    refinanceLoan,
    annualDebtService,
    dscr,
    totalCost,
    cashLeftIn,
    equityCreated,
    warnings,
  };
}
