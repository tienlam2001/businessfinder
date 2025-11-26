// Unified underwriting engine for CRE retail
export function normalizeNumber(value) {
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function mortgagePayment(principal, annualRatePct, termYears) {
  const ratePct = normalizeNumber(annualRatePct);
  const monthlyRate = ratePct / 100 / 12;
  const n = Math.max(1, Math.floor(normalizeNumber(termYears)) * 12);
  if (principal <= 0) return 0;
  if (monthlyRate === 0) return principal / n;
  const factor = Math.pow(1 + monthlyRate, n);
  return principal * (monthlyRate * factor) / (factor - 1);
}

function annualDebtService(loanAmount, debt, yearIndex = 0) {
  if (!loanAmount || loanAmount <= 0) return 0;
  const ratePct = normalizeNumber(debt?.interestRatePct);
  const ioYears = Math.max(0, Math.floor(normalizeNumber(debt?.ioYears)));
  if (yearIndex < ioYears) {
    return loanAmount * (ratePct / 100);
  }
  const paymentMonthly = mortgagePayment(
    loanAmount,
    ratePct,
    Math.max(1, normalizeNumber(debt?.amortYears))
  );
  return paymentMonthly * 12;
}

function buildDebtServiceSchedule(loanAmount, debt, holdYears) {
  const years = Math.max(1, holdYears);
  const schedule = [];
  for (let i = 0; i < years; i++) {
    schedule.push(annualDebtService(loanAmount, debt, i));
  }
  return schedule;
}

function buildRentSchedule(model, scenarioKey) {
  const holdYears = Math.max(1, Math.floor(normalizeNumber(model?.property?.holdPeriodYears)) || 1);
  const scenario = model?.scenarios?.[scenarioKey] || {};
  const rentGrowthAdj = normalizeNumber(scenario.rentGrowthAdjPct) / 100;
  const schedule = Array.from({ length: holdYears }, () => 0);

  (model?.tenants || []).forEach((tenant) => {
    const sqft = normalizeNumber(tenant.sqft);
    const rentPsf = normalizeNumber(tenant.baseRentPsfYear);
    const rentYearOne = sqft * rentPsf;
    const baseEscalation = normalizeNumber(tenant.annualEscalationPct) / 100;
    const growthRate = baseEscalation + rentGrowthAdj;
    const startYear = Math.max(1, Math.floor(normalizeNumber(tenant.startYear) || 1));
    const leaseTermYears = Math.max(1, Math.floor(normalizeNumber(tenant.leaseTermYears) || holdYears));

    for (let i = 0; i < holdYears; i++) {
      const yearNumber = i + 1;
      if (yearNumber < startYear) continue;
      const yearsSinceStart = yearNumber - startYear;
      const growthYears = Math.min(Math.max(0, yearsSinceStart), leaseTermYears - 1);
      const rentThisYear = rentYearOne * Math.pow(1 + growthRate, growthYears);
      schedule[i] += rentThisYear;
    }
  });

  return schedule;
}

function applyVacancy(gprByYear, vacancyPct) {
  const vacancyRate = Math.min(1, Math.max(0, normalizeNumber(vacancyPct) / 100));
  return gprByYear.map((gpr) => gpr * (1 - vacancyRate));
}

function buildExpenseSchedule(model, scenarioKey, egiByYear = []) {
  const scenario = model?.scenarios?.[scenarioKey] || {};
  const expenseAdj = 1 + normalizeNumber(scenario.expenseGrowthAdjPct) / 100;
  const expenses = model?.expenses || {};
  const holdYears = egiByYear.length || Math.max(1, Math.floor(normalizeNumber(model?.property?.holdPeriodYears)) || 1);
  const fixedBase = (
    normalizeNumber(expenses.taxes) +
    normalizeNumber(expenses.insurance) +
    normalizeNumber(expenses.repairsMaintenance) +
    normalizeNumber(expenses.utilities) +
    normalizeNumber(expenses.otherExpenses)
  ) * expenseAdj;

  const mgmtPct = normalizeNumber(expenses.managementPctOfEGI) / 100;

  const schedule = [];
  for (let i = 0; i < holdYears; i++) {
    const egi = egiByYear[i] ?? 0;
    const managementFee = egi * mgmtPct;
    schedule.push(fixedBase + managementFee);
  }
  return schedule;
}

function calculateNOI(egiByYear, expensesByYear) {
  return egiByYear.map((egi, idx) => egi - (expensesByYear[idx] ?? 0));
}

function findMaxLoanByDSCR(noiYear1, debt, priceBenchmark) {
  const dscrTarget = normalizeNumber(debt?.dscrMin);
  if (noiYear1 <= 0 || dscrTarget <= 0) return 0;

  const targetDebtService = noiYear1 / dscrTarget;
  const dsForLoan = (loan) => annualDebtService(loan, debt, 0);

  let low = 0;
  let high = Math.max(normalizeNumber(priceBenchmark), targetDebtService * 2, 1);
  for (let i = 0; i < 20; i++) {
    if (dsForLoan(high) >= targetDebtService) break;
    high *= 2;
  }

  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    const ds = dsForLoan(mid);
    if (Math.abs(ds - targetDebtService) < 1e-4) return mid;
    if (ds > targetDebtService) high = mid;
    else low = mid;
  }
  return (low + high) / 2;
}

function calculateMaxPriceByDSCR(maxLoanByDSCR, debt) {
  const ltv = normalizeNumber(debt?.ltvPct) / 100;
  if (ltv <= 0) return 0;
  return maxLoanByDSCR / ltv;
}

function runScenario(model, scenarioKey) {
  const holdYears = Math.max(1, Math.floor(normalizeNumber(model?.property?.holdPeriodYears)) || 1);
  const purchasePrice = normalizeNumber(model?.property?.purchasePrice);
  const gprByYear = buildRentSchedule(model, scenarioKey);
  const scenario = model?.scenarios?.[scenarioKey] || {};
  const vacancyPct = normalizeNumber(model?.property?.vacancyRatePct) + normalizeNumber(scenario.vacancyAdjPct);
  const egiByYear = applyVacancy(gprByYear, vacancyPct);
  const expenseByYear = buildExpenseSchedule(model, scenarioKey, egiByYear);
  const noiByYear = calculateNOI(egiByYear, expenseByYear);

  const noiYear1 = noiByYear[0] ?? 0;
  const ltvLoanBase = purchasePrice * (normalizeNumber(model?.debt?.ltvPct) / 100);
  const maxLoanByDSCR = findMaxLoanByDSCR(noiYear1, model?.debt, purchasePrice);
  const ltvLoan = purchasePrice > 0 ? ltvLoanBase : maxLoanByDSCR; // if no price entered, allow DSCR sizing to drive
  const loanAmount = Math.min(ltvLoan || 0, maxLoanByDSCR || 0);
  const debtServiceSchedule = buildDebtServiceSchedule(loanAmount, model?.debt, holdYears);
  const cashflowsToEquity = noiByYear.map((noi, idx) => noi - (debtServiceSchedule[idx] ?? 0));
  const dscrSeries = debtServiceSchedule.map((ds, idx) => (ds ? (noiByYear[idx] ?? 0) / ds : 0));
  const minDscr = dscrSeries.reduce((min, dscr) => (min === null ? dscr : Math.min(min, dscr)), null);
  const equityRequired = Math.max(0, purchasePrice - loanAmount);
  const cashOnCashYear1 = equityRequired > 0 ? (cashflowsToEquity[0] ?? 0) / equityRequired : 0;

  const cashflows = noiByYear.map((noi, idx) => ({
    year: idx + 1,
    gpr: gprByYear[idx] ?? 0,
    egi: egiByYear[idx] ?? 0,
    expenses: expenseByYear[idx] ?? 0,
    noi,
    debtService: debtServiceSchedule[idx] ?? 0,
    cashflowToEquity: cashflowsToEquity[idx] ?? 0,
    dscr: dscrSeries[idx] ?? 0,
  }));

  return {
    summary: {
      gprYear1: gprByYear[0] ?? 0,
      egiYear1: egiByYear[0] ?? 0,
      expensesYear1: expenseByYear[0] ?? 0,
      noiYear1,
      dscrYear1: dscrSeries[0] ?? 0,
      minDscr: minDscr ?? 0,
      loanAmount,
      maxLoanByDSCR,
      maxPriceByDSCR: calculateMaxPriceByDSCR(maxLoanByDSCR, model?.debt),
      equityRequired,
      cashOnCashYear1,
      debtServiceYear1: debtServiceSchedule[0] ?? 0,
      vacancyApplied: Math.min(1, Math.max(0, vacancyPct / 100)),
    },
    cashflows,
  };
}

function buildStabilizedRentSeries(model) {
  const years = 10;
  const va = model.valueAdd || {};
  const series = Array.from({ length: years }, () => 0);

  (va.newRents || []).forEach((line) => {
    const sqft = normalizeNumber(line.sqft);
    const rentPsf = normalizeNumber(line.projectedRentPsf);
    const escal = normalizeNumber(line.escalationPct) / 100;
    for (let i = 0; i < years; i++) {
      const rentThisYear = sqft * rentPsf * Math.pow(1 + escal, i);
      series[i] += rentThisYear;
    }
  });

  const ownerUser = va.ownerUser || {};
  if (ownerUser.useOwnerUser) {
    const ownerRent = normalizeNumber(ownerUser.sqft) * normalizeNumber(ownerUser.internalRentPsf);
    for (let i = 0; i < years; i++) {
      series[i] += ownerRent;
    }
  }

  return series;
}

function runValueAdd(model, baseScenario) {
  const va = model?.valueAdd || {};
  const ownerUser = va.ownerUser || {};
  const purchasePrice = normalizeNumber(model?.property?.purchasePrice);
  const rehabBudget = normalizeNumber(va.rehabBudget);
  const buildOutCost = normalizeNumber(ownerUser.buildOutCost);
  const totalCapEx = rehabBudget + buildOutCost;

  const rehabMonths = Math.max(1, Math.floor(normalizeNumber(va.rehabMonths) || 1));
  const monthlyRehabSpend = totalCapEx / rehabMonths;

  const baseLoanAmount = baseScenario?.summary?.loanAmount || 0;
  const baseDebtServiceYear1 = baseScenario?.summary?.debtServiceYear1 || 0;
  const refinanceMonth = Math.max(1, Math.floor(normalizeNumber(va.refinanceMonth) || 1));
  const negativeCarry = (baseDebtServiceYear1 / 12) * refinanceMonth;

  const stabilizedRentSeries = buildStabilizedRentSeries(model);
  const vacancyPct = normalizeNumber(model?.property?.vacancyRatePct) + normalizeNumber(model?.scenarios?.base?.vacancyAdjPct);
  const vacancyRate = Math.min(1, Math.max(0, vacancyPct / 100));

  const stabilizedEGISeries = stabilizedRentSeries.map((rent) => rent * (1 - vacancyRate));
  const stabilizedExpenseSeries = buildExpenseSchedule(model, 'base', stabilizedEGISeries);
  const stabilizedNOISeries = calculateNOI(stabilizedEGISeries, stabilizedExpenseSeries);

  const stabilizedRent = stabilizedRentSeries[0] ?? 0;
  const stabilizedEGI = stabilizedEGISeries[0] ?? 0;
  const stabilizedExpenses = stabilizedExpenseSeries[0] ?? 0;
  const stabilizedNOI = stabilizedNOISeries[0] ?? 0;

  const exitCapRate = normalizeNumber(va.exitCapRate) / 100;
  const stabilizedValue = exitCapRate > 0 ? stabilizedNOI / exitCapRate : 0;

  const maxLoanByDSCR = findMaxLoanByDSCR(stabilizedNOI, model?.debt, stabilizedValue);
  const ltvLoan = stabilizedValue * (normalizeNumber(model?.debt?.ltvPct) / 100);
  const refinanceLoan = Math.min(maxLoanByDSCR || 0, ltvLoan || 0);
  const refinanceDebtService = annualDebtService(refinanceLoan, model?.debt, 0);

  const refinanceCosts = refinanceLoan * (normalizeNumber(va.refinanceCostsPct) / 100);
  const totalCostBasis = purchasePrice + totalCapEx + negativeCarry;
  const cashOut = refinanceLoan - refinanceCosts - totalCostBasis;

  const debtServiceSchedule = buildDebtServiceSchedule(refinanceLoan, model?.debt, 10);
  const stabilizedCashflows = stabilizedNOISeries.map((noi, idx) => {
    const debtService = debtServiceSchedule[idx] ?? 0;
    const cashflowToEquity = noi - debtService;
    const dscr = debtService ? noi / debtService : 0;
    return {
      year: idx + 1,
      rent: stabilizedRentSeries[idx] ?? 0,
      egi: stabilizedEGISeries[idx] ?? 0,
      expenses: stabilizedExpenseSeries[idx] ?? 0,
      noi,
      debtService,
      cashflowToEquity,
      dscr,
    };
  });

  return {
    monthlyRehabSpend,
    negativeCarry,
    totalCapEx,
    stabilizedRent,
    stabilizedEGI,
    stabilizedExpenses,
    stabilizedNOI,
    stabilizedValue,
    refinanceLoan,
    refinanceCosts,
    refinanceDebtService,
    cashOut,
    stabilizedCashflows,
  };
}

export function runUnderwriting(model) {
  const base = runScenario(model, 'base');
  const downside = runScenario(model, 'downside');
  const upside = runScenario(model, 'upside');
  const valueAdd = runValueAdd(model, base);

  return {
    base,
    downside,
    upside,
    valueAdd,
  };
}

export default runUnderwriting;
