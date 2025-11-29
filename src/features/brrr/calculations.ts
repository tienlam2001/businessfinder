import { AcquisitionRehab, BrrrrOutputs, BrrrrState } from './types';

export const sumRehab = (acq: AcquisitionRehab) =>
  acq.rehabExterior +
  acq.rehabInterior +
  acq.rehabKitchen +
  acq.rehabBaths +
  acq.rehabHVAC +
  acq.rehabElectrical +
  acq.rehabPlumbing +
  acq.rehabWindowsDoors +
  acq.rehabAppliances +
  acq.rehabPermits +
  acq.rehabLandscaping +
  acq.rehabMisc;

export const calculateTotalRehab = (acq: AcquisitionRehab) => {
  const rehabTotal = sumRehab(acq);
  const contingencyMultiplier = 1 + (acq.rehabOveragePercent || 0) / 100;
  const rehabWithContingency = rehabTotal * contingencyMultiplier;
  return { rehabTotal, rehabWithContingency };
};

export const calculateAllInCosts = (state: BrrrrState) => {
  const { acquisitionRehab, purchaseFinancing } = state;
  const { rehabWithContingency } = calculateTotalRehab(acquisitionRehab);
  const purchaseLoanAmount = acquisitionRehab.purchasePrice * (purchaseFinancing.purchaseLTV / 100);
  const getCost = (
    mode: 'percent' | 'dollar',
    percent: number,
    absolute: number,
    base = acquisitionRehab.purchasePrice,
  ) => (mode === 'percent' ? base * (percent / 100) : absolute);

  const earnestMoney = getCost(acquisitionRehab.earnestMoneyMode, acquisitionRehab.earnestMoneyPercent, acquisitionRehab.earnestMoneyAbsolute);
  const inspectionCost = getCost(acquisitionRehab.inspectionCostMode, acquisitionRehab.inspectionCostPercent, acquisitionRehab.inspectionCostAbsolute);
  const appraisalCost = getCost(acquisitionRehab.appraisalCostMode, acquisitionRehab.appraisalCostPercent, acquisitionRehab.appraisalCostAbsolute);
  const closingCosts = getCost(acquisitionRehab.closingCostsMode, acquisitionRehab.closingCostsPercent, acquisitionRehab.closingCostsAbsolute);
  const realtorFees = getCost(acquisitionRehab.realtorFeesMode, acquisitionRehab.realtorFeesPercent, acquisitionRehab.realtorFeesAbsolute);
  const totalAcquisitionCosts =
    earnestMoney +
    inspectionCost +
    appraisalCost +
    closingCosts +
    realtorFees +
    purchaseFinancing.lenderFees +
    (purchaseFinancing.pointsPercent / 100) * purchaseLoanAmount;
  return acquisitionRehab.purchasePrice + totalAcquisitionCosts + rehabWithContingency;
};

export const mortgagePayment = (principal: number, annualRatePercent: number, termYears: number) => {
  const monthlyRate = annualRatePercent / 100 / 12;
  const totalMonths = termYears * 12;
  if (totalMonths === 0) return 0;
  if (monthlyRate === 0) return principal / totalMonths;
  const factor = Math.pow(1 + monthlyRate, totalMonths);
  return principal * ((monthlyRate * factor) / (factor - 1));
};

export const remainingBalance = (
  principal: number,
  annualRatePercent: number,
  termYears: number,
  paymentsMade: number,
) => {
  const monthlyRate = annualRatePercent / 100 / 12;
  const totalMonths = termYears * 12;
  if (totalMonths === 0) return 0;
  if (monthlyRate === 0) {
    const principalPaid = (principal / totalMonths) * paymentsMade;
    return Math.max(0, principal - principalPaid);
  }
  const powTotal = Math.pow(1 + monthlyRate, totalMonths);
  const powPaid = Math.pow(1 + monthlyRate, paymentsMade);
  const balance = principal * ((powTotal - powPaid) / (powTotal - 1));
  return Math.max(0, balance);
};

export const calculateBrrrrOutputs = (state: BrrrrState): BrrrrOutputs => {
  const { acquisitionRehab, purchaseFinancing, rehabFinancing, refiFinancing, rentalOps } = state;

  const getCost = (
    mode: 'percent' | 'dollar',
    percent: number,
    absolute: number,
    base = acquisitionRehab.purchasePrice,
  ) => (mode === 'percent' ? base * (percent / 100) : absolute);

  const earnestMoney = getCost(acquisitionRehab.earnestMoneyMode, acquisitionRehab.earnestMoneyPercent, acquisitionRehab.earnestMoneyAbsolute);
  const inspectionCost = getCost(acquisitionRehab.inspectionCostMode, acquisitionRehab.inspectionCostPercent, acquisitionRehab.inspectionCostAbsolute);
  const appraisalCost = getCost(acquisitionRehab.appraisalCostMode, acquisitionRehab.appraisalCostPercent, acquisitionRehab.appraisalCostAbsolute);
  const closingCosts = getCost(acquisitionRehab.closingCostsMode, acquisitionRehab.closingCostsPercent, acquisitionRehab.closingCostsAbsolute);
  const realtorFees = getCost(acquisitionRehab.realtorFeesMode, acquisitionRehab.realtorFeesPercent, acquisitionRehab.realtorFeesAbsolute);

  const { rehabTotal, rehabWithContingency } = calculateTotalRehab(acquisitionRehab);
  const purchaseLoanAmount = acquisitionRehab.purchasePrice * (purchaseFinancing.purchaseLTV / 100);

  const totalAcquisitionCosts =
    earnestMoney +
    inspectionCost +
    appraisalCost +
    closingCosts +
    realtorFees +
    purchaseFinancing.lenderFees +
    (purchaseFinancing.pointsPercent / 100) * purchaseLoanAmount;

  const rehabLoanAmount = rehabFinancing.financed ? rehabWithContingency * (rehabFinancing.rehabLTC / 100) : 0;

  const totalPointsAndFees =
    purchaseFinancing.lenderFees +
    rehabFinancing.lenderFees +
    (purchaseFinancing.pointsPercent / 100) * purchaseLoanAmount +
    (rehabFinancing.pointsPercent / 100) * rehabLoanAmount;

  const allInCost = acquisitionRehab.purchasePrice + totalAcquisitionCosts + rehabWithContingency;
  const downPayment = acquisitionRehab.purchasePrice - purchaseLoanAmount;
  const totalCashIntoDeal = downPayment + totalAcquisitionCosts + (rehabWithContingency - rehabLoanAmount);

  const effectiveGrossIncomeAnnual = rentalOps.marketRent * (1 - rentalOps.vacancyRate / 100) * 12;
  const variableExpensesAnnual =
    rentalOps.marketRent *
    12 *
    ((rentalOps.maintenancePercent + rentalOps.capexPercent + rentalOps.managementPercent) / 100);
  const fixedExpensesAnnual =
    rentalOps.taxesAnnual +
    rentalOps.insuranceAnnual +
    rentalOps.hoaMonthly * 12 +
    rentalOps.utilitiesMonthlyOwnerPaid * 12;
  const operatingExpensesAnnual = variableExpensesAnnual + fixedExpensesAnnual;
  const noiAnnual = effectiveGrossIncomeAnnual - operatingExpensesAnnual;
  const rentalCashflowMonthlyBeforeRefiDebt = noiAnnual / 12;

  const refiLoanAmount = refiFinancing.arv * (refiFinancing.refiLTV / 100);
  const refiMonthlyPI = mortgagePayment(refiLoanAmount, refiFinancing.interestRate, refiFinancing.termYears);
  const annualDebtService = refiMonthlyPI * 12;
  const dscr = annualDebtService > 0 ? noiAnnual / annualDebtService : 0;
  const cashflowAfterRefiMonthly = rentalCashflowMonthlyBeforeRefiDebt - refiMonthlyPI;

  const monthsFinanced = Math.max(1, Math.min(acquisitionRehab.rehabTimelineDays / 30, purchaseFinancing.termMonths));
  const hardMoneyInterest = purchaseLoanAmount * (purchaseFinancing.interestRate / 100) * (monthsFinanced / 12);
  const hardMoneyPayoff = purchaseLoanAmount + hardMoneyInterest;

  const rehabMonths = Math.max(1, Math.min(acquisitionRehab.rehabTimelineDays / 30, rehabFinancing.termMonths || monthsFinanced));
  const rehabLoanInterest = rehabLoanAmount * (rehabFinancing.interestRate / 100) * (rehabMonths / 12);
  const rehabLoanPayoff = rehabLoanAmount + rehabLoanInterest;

  const cashOutFromRefi = refiLoanAmount - hardMoneyPayoff - rehabLoanPayoff - (refiFinancing.closingCosts || 0);
  const cashLeftInDeal = totalCashIntoDeal - cashOutFromRefi;
  const equityAfterRefi = refiFinancing.arv - refiLoanAmount;
  const cashOnCashReturnYear1 =
    (cashflowAfterRefiMonthly * 12) / (cashLeftInDeal > 0 ? cashLeftInDeal : 1);

  return {
    totalRehabCost: rehabTotal,
    totalRehabCostWithContingency: rehabWithContingency,
    totalAcquisitionCosts,
    allInCost,
    purchaseLoanAmount,
    rehabLoanAmount,
    totalPointsAndFees,
    totalCashIntoDeal,
    effectiveGrossIncomeAnnual,
    operatingExpensesAnnual,
    noiAnnual,
    rentalCashflowMonthlyBeforeRefiDebt,
    refiLoanAmount,
    refiMonthlyPI,
    annualDebtService,
    dscr,
    hardMoneyPayoff,
    rehabLoanPayoff,
    cashOutFromRefi,
    cashLeftInDeal,
    equityAfterRefi,
    cashOnCashReturnYear1,
    cashflowAfterRefiMonthly,
  };
};
