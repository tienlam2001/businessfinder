// Central underwriting engine for CRE retail - all math lives here.

export function normalizeNumber(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function mortgagePayment(principal, annualRatePct, termYears) {
  const loanAmount = normalizeNumber(principal);
  if (loanAmount <= 0) return 0;
  const months = Math.max(1, Math.floor(normalizeNumber(termYears)) * 12);
  const monthlyRate = normalizeNumber(annualRatePct) / 100 / 12;
  if (monthlyRate === 0) return loanAmount / months;
  const factor = Math.pow(1 + monthlyRate, months);
  return loanAmount * ((monthlyRate * factor) / (factor - 1));
}

function buildDebtServiceSchedule(loanAmount, debtConfig = {}, holdYears) {
  const scheduleYears = Math.max(1, Math.floor(normalizeNumber(holdYears)) || 1);
  const schedule = Array.from({ length: scheduleYears }, () => 0);
  const principal = normalizeNumber(loanAmount);
  if (principal <= 0) return schedule;

  const ratePct = normalizeNumber(debtConfig.interestRatePct);
  const amortYears = Math.max(1, Math.floor(normalizeNumber(debtConfig.amortYears)) || 1);
  const ioYears = Math.max(0, Math.floor(normalizeNumber(debtConfig.ioYears)) || 0);
  const amortizationTerm = Math.max(1, amortYears - ioYears > 0 ? amortYears - ioYears : amortYears);
  const amortizingPayment = mortgagePayment(principal, ratePct, amortizationTerm) * 12;

  for (let i = 0; i < scheduleYears; i++) {
    if (i < ioYears) {
      schedule[i] = principal * (ratePct / 100);
    } else {
      schedule[i] = amortizingPayment;
    }
  }

  return schedule;
}

function calculateNPV(cashflows = [], discountRatePct) {
  const r = normalizeNumber(discountRatePct) / 100;
  if (!cashflows.length || r <= -1) return 0;
  return cashflows.reduce((acc, cf, idx) => acc + (cf || 0) / Math.pow(1 + r, idx), 0);
}

function calculateIRR(cashflows = []) {
  if (!cashflows.length) return 0;
  const hasPos = cashflows.some((v) => v > 0);
  const hasNeg = cashflows.some((v) => v < 0);
  if (!hasPos || !hasNeg) return 0;

  const npvAt = (rate) => cashflows.reduce((acc, cf, idx) => acc + (cf || 0) / Math.pow(1 + rate, idx), 0);

  let low = -0.99;
  let high = 5; // allow up to 500% IRR for edge cases
  let npvLow = npvAt(low);
  let npvHigh = npvAt(high);
  if (npvLow * npvHigh > 0) return 0;

  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const npv = npvAt(mid);
    if (Math.abs(npv) < 1e-6) return mid;
    if (npvLow * npv < 0) {
      high = mid;
      npvHigh = npv;
    } else {
      low = mid;
      npvLow = npv;
    }
  }

  return (low + high) / 2;
}

function sizeLoanByDSCR(noiYear1, debtConfig = {}, benchmarkPrice = 0) {
  const dscrMin = normalizeNumber(debtConfig.dscrMin);
  if (noiYear1 <= 0 || dscrMin <= 0) return 0;

  const ratePct = normalizeNumber(debtConfig.interestRatePct);
  const amortYears = Math.max(1, Math.floor(normalizeNumber(debtConfig.amortYears)) || 1);
  const targetDebtService = noiYear1 / dscrMin;
  const paymentForLoan = (loan) => mortgagePayment(loan, ratePct, amortYears) * 12;

  let low = 0;
  let high = Math.max(benchmarkPrice || 0, targetDebtService * amortYears, 1);
  while (paymentForLoan(high) < targetDebtService && high < Number.MAX_SAFE_INTEGER / 4) {
    high *= 2;
  }

  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    const ds = paymentForLoan(mid);
    if (Math.abs(ds - targetDebtService) < 1e-4) return mid;
    if (ds > targetDebtService) high = mid;
    else low = mid;
  }

  return (low + high) / 2;
}

function runScenario(model = {}, scenarioKey = 'base') {
  const property = model.property || {};
  const tenants = Array.isArray(model.tenants) ? model.tenants : [];
  const expenses = model.expenses || {};
  const debt = model.debt || {};
  const scenario = (model.scenarios && model.scenarios[scenarioKey]) || {};
  const loanSizingMethod = (debt.loanSizingMethod || 'lesser').toLowerCase();

  const holdYears = Math.max(1, Math.floor(normalizeNumber(property.holdPeriodYears)) || 1);
  const dscrMin = normalizeNumber(debt.dscrMin);
  const rentAdjPct = normalizeNumber(scenario.rentGrowthAdjPct);
  const expenseAdjPct = normalizeNumber(scenario.expenseGrowthAdjPct);
  const vacancyAdjPct = normalizeNumber(scenario.vacancyAdjPct);

  const gprByYear = Array.from({ length: holdYears }, () => 0);
  tenants.forEach((tenant) => {
    const sqft = normalizeNumber(tenant.sqft);
    const baseRentPsf = normalizeNumber(tenant.baseRentPsfYear);
    const rentYear1 = sqft * baseRentPsf;
    const escalation = normalizeNumber(tenant.annualEscalationPct) / 100;
    const startYear = Math.max(1, Math.floor(normalizeNumber(tenant.startYear) || 1));
    const leaseTermYears = Math.max(1, Math.floor(normalizeNumber(tenant.leaseTermYears) || holdYears));

    for (let i = 0; i < holdYears; i++) {
      const yearNumber = i + 1;
      if (yearNumber < startYear || yearNumber >= startYear + leaseTermYears) continue;
      const growthYears = yearNumber - startYear;
      const rentThisYear = rentYear1 * Math.pow(1 + escalation, growthYears) * (1 + rentAdjPct / 100);
      gprByYear[i] += rentThisYear;
    }
  });

  let effectiveVacancyPct = normalizeNumber(property.vacancyRatePct) + vacancyAdjPct;
  effectiveVacancyPct = Math.min(30, Math.max(0, effectiveVacancyPct));
  const egiByYear = gprByYear.map((gpr) => gpr * (1 - effectiveVacancyPct / 100));

  const baseOpEx =
    normalizeNumber(expenses.taxes) +
    normalizeNumber(expenses.insurance) +
    normalizeNumber(expenses.repairsMaintenance) +
    normalizeNumber(expenses.utilities) +
    normalizeNumber(expenses.otherExpenses);
  const opExFixedScenario = baseOpEx * (1 + expenseAdjPct / 100);
  const mgmtPct = normalizeNumber(expenses.managementPctOfEGI) / 100;
  const opExTotalByYear = egiByYear.map((egi) => opExFixedScenario + egi * mgmtPct);
  const noiByYear = egiByYear.map((egi, idx) => egi - (opExTotalByYear[idx] || 0));

  const purchasePrice = normalizeNumber(property.purchasePrice);
  const ltvPct = normalizeNumber(debt.ltvPct);
  const ltvLoan = purchasePrice * (ltvPct / 100);
  const maxLoanByDSCR = sizeLoanByDSCR(noiByYear[0] || 0, debt, purchasePrice);
  let loanAmount = Math.min(ltvLoan || 0, maxLoanByDSCR || 0);
  if (loanSizingMethod === 'dscr') loanAmount = maxLoanByDSCR || 0;
  if (loanSizingMethod === 'ltv') loanAmount = ltvLoan || 0;

  const debtServiceSchedule = buildDebtServiceSchedule(loanAmount, debt, holdYears);
  const cashflowsToEquity = noiByYear.map((noi, idx) => (noi || 0) - (debtServiceSchedule[idx] || 0));

  const equityRequired = Math.max(0, purchasePrice - loanAmount);
  const cashOnCashYear1 = equityRequired > 0 ? (cashflowsToEquity[0] || 0) / equityRequired : 0;
  const cashOnCashAvg =
    equityRequired > 0 && holdYears > 0
      ? cashflowsToEquity.reduce((sum, cf) => sum + (cf || 0), 0) / (equityRequired * holdYears)
      : 0;

  const discountRatePct = normalizeNumber(property.discountRatePct) || 10;
  const cashflowStream = [equityRequired > 0 ? -equityRequired : 0, ...cashflowsToEquity];
  const npv = calculateNPV(cashflowStream, discountRatePct);
  const irr = calculateIRR(cashflowStream);

  const dscrSeries = debtServiceSchedule.map((ds, idx) => (ds > 0 ? (noiByYear[idx] || 0) / ds : 0));
  const minDscr = dscrSeries.reduce(
    (min, dscr) => (dscr > 0 && (min === null || dscr < min) ? dscr : min),
    null
  ) || 0;

  // What-if: test an extra down payment to see DSCR lift
  const whatIfExtraDownPct = Math.max(0, normalizeNumber(debt.whatIfExtraDownPct));
  const extraDownAmount = purchasePrice * (whatIfExtraDownPct / 100);
  const whatIfLoan = Math.max(0, loanAmount - extraDownAmount);
  const whatIfDebtServiceSchedule = buildDebtServiceSchedule(whatIfLoan, debt, holdYears);
  const whatIfDscrSeries = whatIfDebtServiceSchedule.map((ds, idx) =>
    ds > 0 ? (noiByYear[idx] || 0) / ds : 0
  );
  const whatIfEquityRequired = Math.max(0, purchasePrice - whatIfLoan);
  const additionalEquityForWhatIf = Math.max(0, whatIfEquityRequired - equityRequired);

  const cashflows = noiByYear.map((noi, idx) => ({
    year: idx + 1,
    gpr: gprByYear[idx] || 0,
    egi: egiByYear[idx] || 0,
    opEx: opExTotalByYear[idx] || 0,
    expenses: opExTotalByYear[idx] || 0,
    noi: noi || 0,
    debtService: debtServiceSchedule[idx] || 0,
    cashflowToEquity: cashflowsToEquity[idx] || 0,
    dscr: dscrSeries[idx] || 0,
  }));

  const ltvRatio = ltvPct / 100;
  const ltvAtUnderwrite = purchasePrice > 0 ? loanAmount / purchasePrice : 0;
  const loanForTargetDscr = maxLoanByDSCR || 0;
  const equityToMeetDscr = Math.max(0, purchasePrice - loanForTargetDscr);
  const additionalEquityToMeetDscr = Math.max(0, equityToMeetDscr - equityRequired);
  const ltvAtTargetDscr = purchasePrice > 0 ? loanForTargetDscr / purchasePrice : 0;
  const summary = {
    noiYear1: noiByYear[0] || 0,
    noiStabilized: noiByYear[2] || noiByYear[0] || 0,
    dscrYear1: dscrSeries[0] || 0,
    minDscr,
    maxLoanByDSCR,
    maxPriceByDSCR: ltvRatio > 0 ? maxLoanByDSCR / ltvRatio : 0,
    maxLoanByLTV: ltvLoan,
    loanAmount,
    equityRequired,
    cashOnCashYear1,
    cashOnCashAvg,
    npv,
    irr,
    debtServiceYear1: debtServiceSchedule[0] || 0,
    vacancyApplied: effectiveVacancyPct / 100,
    impliedCapRate: purchasePrice > 0 ? (noiByYear[0] || 0) / purchasePrice : 0,
    dscrMin,
    purchasePrice,
    holdYears,
    loanSizingMethod,
    ltvAtUnderwrite,
    ltvAtTargetDscr,
    loanForTargetDscr,
    equityToMeetDscr,
    additionalEquityToMeetDscr,
    whatIfExtraDownPct,
    whatIfLoan,
    whatIfDebtServiceYear1: whatIfDebtServiceSchedule[0] || 0,
    whatIfDscrYear1: whatIfDscrSeries[0] || 0,
    whatIfEquityRequired,
    additionalEquityForWhatIf,
  };

  return {
    summary,
    cashflows,
    dscrSeries,
  };
}

function runValueAdd(model = {}) {
  const va = model.valueAdd || {};
  const property = model.property || {};
  const expenses = model.expenses || {};
  const baseScenario = (model.scenarios && model.scenarios.base) || {};
  const debt = model.debt || {};
  const loanSizingMethod = (debt.loanSizingMethod || 'lesser').toLowerCase();

  const purchasePrice = normalizeNumber(property.purchasePrice);
  const rehabBudget = normalizeNumber(va.rehabBudget);
  const exitCapRate = normalizeNumber(va.exitCapRate) / 100;

  const stabilizedGPR = (Array.isArray(va.newRents) ? va.newRents : []).reduce(
    (sum, line) => sum + normalizeNumber(line.sqft) * normalizeNumber(line.projectedRentPsf),
    0
  );

  const effectiveVacancyPct = Math.min(
    30,
    Math.max(0, normalizeNumber(property.vacancyRatePct) + normalizeNumber(baseScenario.vacancyAdjPct))
  );
  const stabilizedEGI = stabilizedGPR * (1 - effectiveVacancyPct / 100);

  const baseOpEx =
    normalizeNumber(expenses.taxes) +
    normalizeNumber(expenses.insurance) +
    normalizeNumber(expenses.repairsMaintenance) +
    normalizeNumber(expenses.utilities) +
    normalizeNumber(expenses.otherExpenses);
  const opExFixedScenario = baseOpEx * (1 + normalizeNumber(baseScenario.expenseGrowthAdjPct) / 100);
  const mgmtPct = normalizeNumber(expenses.managementPctOfEGI) / 100;
  const stabilizedOpEx = opExFixedScenario + stabilizedEGI * mgmtPct;

  const stabilizedNOI = stabilizedEGI - stabilizedOpEx;
  const stabilizedValue = exitCapRate > 0 ? stabilizedNOI / exitCapRate : 0;

  const maxLoanByDSCR = sizeLoanByDSCR(stabilizedNOI, debt, stabilizedValue);
  const ltvLoan = stabilizedValue * (normalizeNumber(debt.ltvPct) / 100);
  let refinanceLoan = Math.min(maxLoanByDSCR || 0, ltvLoan || 0);
  if (loanSizingMethod === 'dscr') refinanceLoan = maxLoanByDSCR || 0;
  if (loanSizingMethod === 'ltv') refinanceLoan = ltvLoan || 0;

  const totalCostBasis = purchasePrice + rehabBudget;
  const cashOut = refinanceLoan - totalCostBasis;

  return {
    stabilizedGPR,
    stabilizedEGI,
    stabilizedOpEx,
    stabilizedNOI,
    stabilizedValue,
    refinanceLoan,
    cashOut,
    totalCostBasis,
  };
}

function runStabilized(model = {}, valueAddResult) {
  const baseScenario = (model.scenarios && model.scenarios.base) || {};
  const debt = model.debt || {};
  const property = model.property || {};
  const vaResult = valueAddResult || runValueAdd(model);

  const baseRent = vaResult.stabilizedGPR || 0;
  const vacancyPct = Math.min(
    30,
    Math.max(0, normalizeNumber(property.vacancyRatePct) + normalizeNumber(baseScenario.vacancyAdjPct))
  );
  const rentGrowth = 0.03 + normalizeNumber(baseScenario.rentGrowthAdjPct) / 100;
  const expenseGrowth = 0.02;
  const baseOpEx = vaResult.stabilizedOpEx || 0;

  const annualDebtService = vaResult.refinanceLoan
    ? mortgagePayment(
        vaResult.refinanceLoan,
        normalizeNumber(debt.interestRatePct),
        Math.max(1, Math.floor(normalizeNumber(debt.amortYears)) || 1)
      ) * 12
    : 0;

  const rows = [];
  let rent = baseRent;
  let opEx = baseOpEx;
  for (let i = 0; i < 10; i++) {
    if (i > 0) {
      rent *= 1 + rentGrowth;
      opEx *= 1 + expenseGrowth;
    }
    const egi = rent * (1 - vacancyPct / 100);
    const noi = egi - opEx;
    const debtService = annualDebtService;
    const cashflowToEquity = noi - debtService;
    const dscr = debtService > 0 ? noi / debtService : 0;

    rows.push({
      year: i + 1,
      rent,
      egi,
      opEx,
      noi,
      debtService,
      cashflowToEquity,
      dscr,
    });
  }

  return { rows };
}

export function runUnderwriting(model = {}) {
  const base = runScenario(model, 'base');
  const downside = runScenario(model, 'downside');
  const upside = runScenario(model, 'upside');
  const valueAdd = runValueAdd(model);
  const stabilized = runStabilized(model, valueAdd);

  return {
    base,
    downside,
    upside,
    valueAdd,
    stabilized,
  };
}
