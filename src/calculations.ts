/* eslint-disable max-lines */

export type FundingMode = 'debt' | 'equity';
export type ScenarioKey = 'hardMoney' | 'investorDebt' | 'investorEquity' | 'investorActive' | 'allCash';

export interface HoldingCostsInput {
  taxes: number;
  insurance: number;
  utilities: number;
  hoa: number;
}

export interface SharedInputs {
  purchasePrice: number;
  arv: number;
  rehabBudget: number;
  contingencyPercent: number;
  rehabDurationMonths: number;
  purchaseClosingPercent: number;
  purchaseClosingFixed: number;
  holdingCosts: HoldingCostsInput;
  marketRent: number;
  vacancyPercent: number;
  expenseRatioPercent: number | null;
  propertyManagementPercent: number;
  maintenanceReservePercent: number;
  annualPropertyTax: number;
  annualInsurance: number;
  annualHoa: number;
  marketCapRatePercent: number | null;
}

export interface HardMoneyInputs {
  ltvPercent: number;
  ratePercent: number;
  pointsPercent: number;
  originationFee: number;
  underwritingFee: number;
  drawFeePerDraw: number;
  drawCount: number;
  otherFees: number;
  exitClosingCosts: number;
}

export type ExitFeeBasis = 'loan' | 'arv';

export interface InvestorDebtInputs {
  advancePercent: number;
  ratePercent: number;
  pointsPercent: number;
  upfrontFees: number;
  exitFeePercent: number;
  exitFeeBasis: ExitFeeBasis;
  termMonths: number;
}

export interface InvestorEquityInputs {
  equityPercent: number;
  prefPercent: number;
  capitalContributed: number;
}

export interface InvestorInputs {
  fundingType: FundingMode;
  drawFeePerDraw: number;
  drawCount: number;
  otherFees: number;
  debt: InvestorDebtInputs;
  equity: InvestorEquityInputs;
}

export interface AllCashInputs {
  takeRefi: boolean;
}

export interface DscrRefiInputs {
  dscrTarget: number;
  maxLtvPercent: number;
  ratePercent: number;
  termYears: number;
  amortYears: number;
  closingCostsPercent: number;
  fees: number;
  prepayPenalty: boolean;
}

export interface BrrrInputs {
  shared: SharedInputs;
  hardMoney: HardMoneyInputs;
  investor: InvestorInputs;
  allCash: AllCashInputs;
  dscrRefi: DscrRefiInputs;
}

export interface SensitivityAdjustments {
  arvPercent: number;
  rentPercent: number;
  bridgeRateDelta: number;
  refiRateDelta: number;
  expensePercentDelta: number;
}

export interface ScenarioBadges {
  refiApproved: boolean;
  dscrFail: boolean;
  dscrShortfall: number;
  infiniteBrrr: boolean;
}

export interface ScenarioResult {
  scenario: ScenarioKey;
  totalProjectCost: number;
  sponsorCashIn: number;
  investorCashIn: number;
  cashOutToSponsor: number;
  cashAvailableToDistribute?: number;
  cashLeftIn: number;
  noi: number;
  refiProceeds: number;
  refiConstraint: 'DSCR' | 'LTV' | 'None';
  monthlyPAndI: number;
  actualDscr: number;
  dscrTarget: number;
  refiCosts: number;
  netRefiCash: number;
  bridgePayoff: number;
  maxLoanByDscr: number;
  maxLoanByLtv: number;
  annualDebtService: number;
  annualCashFlowToSponsor: number;
  yearOneCoC: number | null;
  paybackYears: number | null;
  equityCreated: number;
  yieldOnCost: number;
  spreadToMarketCap: number | null;
  prefAccrual?: number;
  investorOwnership?: number;
  sponsorOwnership?: number;
  notes: string[];
  badges: ScenarioBadges;
}

export interface OperatingSnapshot {
  gsr: number;
  vacancy: number;
  egi: number;
  operatingExpenses: number;
  noi: number;
}

export interface BaseDerivatives {
  rehabTotal: number;
  holdingCostsTotal: number;
  purchaseClosingTotal: number;
  operating: OperatingSnapshot;
}

export interface BuildBrrrModelResult {
  inputs: BrrrInputs;
  derived: BaseDerivatives;
  scenarios: {
    hardMoney: ScenarioResult;
    investorDebt: ScenarioResult;
    investorEquity: ScenarioResult;
    investorActive: ScenarioResult;
    allCash: ScenarioResult;
  };
  sensitivity: SensitivityAdjustments;
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

const ZERO_HOLDING: HoldingCostsInput = { taxes: 0, insurance: 0, utilities: 0, hoa: 0 };

const defaultSensitivity: SensitivityAdjustments = {
  arvPercent: 0,
  rentPercent: 0,
  bridgeRateDelta: 0,
  refiRateDelta: 0,
  expensePercentDelta: 0,
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const toNumber = (value: number | null | undefined, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clone = <T>(value: T): T => {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  return JSON.parse(JSON.stringify(value));
};

const deepMerge = <T>(base: T, patch?: DeepPartial<T>): T => {
  if (patch === undefined || patch === null) return base;
  if (base === undefined || base === null) return clone(patch as T);
  const result: T = clone(base);
  Object.entries(patch as Record<string, unknown>).forEach(([key, patchValue]) => {
    const typedKey = key as keyof T;
    if (patchValue && typeof patchValue === 'object' && !Array.isArray(patchValue)) {
      (result as Record<string, unknown>)[typedKey] = deepMerge(
        (result as Record<string, unknown>)[typedKey],
        patchValue as DeepPartial<unknown>,
      );
    } else if (patchValue !== undefined) {
      (result as Record<string, unknown>)[typedKey] = patchValue as unknown;
    }
  });
  return result;
};

const monthlyRate = (annualPercent: number) => (toNumber(annualPercent) / 100) / 12;

export const pmt = (rateMonthly: number, nMonths: number, principal: number) => {
  if (nMonths <= 0) return 0;
  if (Math.abs(rateMonthly) < 1e-8) {
    return principal / nMonths;
  }
  const numerator = rateMonthly * Math.pow(1 + rateMonthly, nMonths);
  const denominator = Math.pow(1 + rateMonthly, nMonths) - 1;
  if (Math.abs(denominator) < 1e-8) return 0;
  return principal * (numerator / denominator);
};

export const loanAmountFromDebtService = (monthlyDebtService: number, rateMonthlyValue: number, nMonths: number) => {
  if (nMonths <= 0 || Math.abs(rateMonthlyValue) < 1e-8) {
    return monthlyDebtService * nMonths;
  }
  const numerator = rateMonthlyValue * Math.pow(1 + rateMonthlyValue, nMonths);
  const denominator = Math.pow(1 + rateMonthlyValue, nMonths) - 1;
  if (Math.abs(denominator) < 1e-8) return 0;
  return monthlyDebtService / (numerator / denominator);
};

const computeRehabTotal = (shared: SharedInputs) => {
  const base = toNumber(shared.rehabBudget);
  const contingency = clamp(toNumber(shared.contingencyPercent), 0, 100) / 100;
  return base * (1 + contingency);
};

const computeHoldingCostsTotal = (shared: SharedInputs) => {
  const duration = clamp(toNumber(shared.rehabDurationMonths), 0, 48);
  const holding = shared.holdingCosts ?? ZERO_HOLDING;
  const monthlySum = toNumber(holding.taxes) + toNumber(holding.insurance) + toNumber(holding.utilities) + toNumber(holding.hoa);
  return monthlySum * duration;
};

const computePurchaseClosing = (shared: SharedInputs) => {
  const pct = clamp(toNumber(shared.purchaseClosingPercent), 0, 15) / 100;
  return shared.purchasePrice * pct + toNumber(shared.purchaseClosingFixed);
};

const buildOperatingSnapshot = (shared: SharedInputs): OperatingSnapshot => {
  const marketRent = Math.max(toNumber(shared.marketRent), 0);
  const vacancyPct = clamp(toNumber(shared.vacancyPercent), 0, 100) / 100;
  const gsr = marketRent * 12;
  const vacancy = gsr * vacancyPct;
  const egi = Math.max(gsr - vacancy, 0);
  const taxes = Math.max(toNumber(shared.annualPropertyTax), 0);
  const insurance = Math.max(toNumber(shared.annualInsurance), 0);
  const hoa = Math.max(toNumber(shared.annualHoa), 0);
  const explicit = taxes + insurance + hoa;
  const mgmt = clamp(toNumber(shared.propertyManagementPercent), 0, 100) / 100;
  const maintenance = clamp(toNumber(shared.maintenanceReservePercent), 0, 100) / 100;
  const expenseRatio = shared.expenseRatioPercent !== null ? clamp(shared.expenseRatioPercent, 0, 95) / 100 : null;
  let operatingExpenses: number;
  if (expenseRatio !== null && expenseRatio > 0) {
    operatingExpenses = Math.max(egi * expenseRatio, explicit);
  } else {
    operatingExpenses = explicit + egi * (mgmt + maintenance);
  }
  const noi = Math.max(egi - operatingExpenses, 0);
  return { gsr, vacancy, egi, operatingExpenses, noi };
};

const computeYieldOnCost = (noi: number, shared: SharedInputs, derived: BaseDerivatives) => {
  const denom = shared.purchasePrice + derived.rehabTotal + derived.purchaseClosingTotal;
  if (denom <= 0) return 0;
  return noi / denom;
};

interface BridgeCostInputs {
  shared: SharedInputs;
  derived: BaseDerivatives;
  bridgePrincipal: number;
  ratePercent: number;
  pointsPercent: number;
  fees: number;
  drawFees: number;
  otherFees: number;
  durationOverride?: number;
}

const computeBridgeCarry = ({
  shared,
  derived,
  bridgePrincipal,
  ratePercent,
  pointsPercent,
  fees,
  drawFees,
  otherFees,
  durationOverride,
}: BridgeCostInputs) => {
  const months = clamp(
    durationOverride !== undefined
      ? durationOverride
      : toNumber(shared.rehabDurationMonths),
    0,
    48,
  );
  const rate = monthlyRate(ratePercent);
  const interest = bridgePrincipal * rate * months;
  const points = bridgePrincipal * (clamp(pointsPercent, 0, 20) / 100);
  const totalProjectCost =
    shared.purchasePrice +
    derived.purchaseClosingTotal +
    derived.rehabTotal +
    derived.holdingCostsTotal +
    interest +
    points +
    fees +
    drawFees +
    otherFees;
  const sponsorCashIn =
    Math.max(shared.purchasePrice - bridgePrincipal, 0) +
    derived.purchaseClosingTotal +
    derived.rehabTotal +
    derived.holdingCostsTotal +
    interest +
    points +
    fees +
    drawFees +
    otherFees;
  return { interest, points, totalProjectCost, sponsorCashIn };
};

interface RefiComputationArgs {
  shared: SharedInputs;
  dscr: DscrRefiInputs;
  payoff: number;
  noi: number;
  refiRateDelta: number;
}

const computeRefi = ({ shared, dscr, payoff, noi, refiRateDelta }: RefiComputationArgs) => {
  const dscrTarget = Math.max(toNumber(dscr.dscrTarget), 0.5);
  if (shared.arv <= 0) {
    return {
      refiProceeds: 0,
      monthlyPAndI: 0,
      actualDscr: 0,
      refiConstraint: 'None' as const,
      refiCosts: 0,
      netRefiCash: -payoff,
      maxLoanByDscr: 0,
      maxLoanByLtv: 0,
    };
  }
  const amortYears = dscr.amortYears || dscr.termYears;
  const nMonths = Math.max(Math.round(amortYears * 12), 12);
  const rate = monthlyRate(dscr.ratePercent + refiRateDelta);
  const maxMonthlyDebt = Math.max(noi / dscrTarget / 12, 0);
  const maxLoanByDscr = loanAmountFromDebtService(maxMonthlyDebt, rate, nMonths);
  const maxLoanByLtv = shared.arv * (clamp(dscr.maxLtvPercent, 0, 90) / 100);
  const refiProceeds = Math.min(maxLoanByDscr, maxLoanByLtv);
  const monthlyPAndI = refiProceeds > 0 ? pmt(rate, nMonths, refiProceeds) : 0;
  const annualDebtService = monthlyPAndI * 12;
  const actualDscr = annualDebtService > 0 ? noi / annualDebtService : Infinity;
  const refiConstraint = maxLoanByDscr <= maxLoanByLtv ? 'DSCR' : 'LTV';
  const refiCosts = refiProceeds * (clamp(dscr.closingCostsPercent, 0, 5) / 100) + toNumber(dscr.fees);
  const netRefiCash = refiProceeds - refiCosts - payoff;
  return {
    refiProceeds,
    monthlyPAndI,
    actualDscr,
    refiConstraint,
    refiCosts,
    netRefiCash,
    maxLoanByDscr,
    maxLoanByLtv,
    annualDebtService,
    nMonths,
  };
};

const buildBadges = (scenario: ScenarioResult, dscr: DscrRefiInputs) => {
  const dscrSlack =
    scenario.maxLoanByLtv > 0
      ? (scenario.maxLoanByLtv - scenario.maxLoanByDscr) / scenario.maxLoanByLtv
      : 0;
  const refiApproved = scenario.actualDscr >= dscr.dscrTarget && dscrSlack <= 0.05;
  const dscrFail = scenario.refiConstraint !== 'None' && scenario.actualDscr < dscr.dscrTarget;
  const dscrShortfall = dscrFail ? dscr.dscrTarget - scenario.actualDscr : 0;
  const infiniteBrrr = scenario.cashLeftIn <= 100;
  scenario.badges = { refiApproved, dscrFail, dscrShortfall, infiniteBrrr };
};

const finalizeScenario = (
  base: Omit<ScenarioResult, 'badges'>,
  dscr: DscrRefiInputs,
): ScenarioResult => {
  const scenario: ScenarioResult = { ...base, badges: { refiApproved: false, dscrFail: false, dscrShortfall: 0, infiniteBrrr: false } };
  buildBadges(scenario, dscr);
  return scenario;
};

export const createDefaultBrrrInputs = (overrides?: DeepPartial<BrrrInputs>): BrrrInputs => {
  const shared: SharedInputs = {
    purchasePrice: 200_000,
    arv: 300_000,
    rehabBudget: 40_000,
    contingencyPercent: 10,
    rehabDurationMonths: 6,
    purchaseClosingPercent: 2,
    purchaseClosingFixed: 0,
    holdingCosts: { ...ZERO_HOLDING, taxes: 250, insurance: 125, utilities: 150 },
    marketRent: 2_400,
    vacancyPercent: 6,
    expenseRatioPercent: null,
    propertyManagementPercent: 8,
    maintenanceReservePercent: 5,
    annualPropertyTax: 3_200,
    annualInsurance: 1_200,
    annualHoa: 0,
    marketCapRatePercent: null,
  };

  const hardMoney: HardMoneyInputs = {
    ltvPercent: 85,
    ratePercent: 11.5,
    pointsPercent: 2,
    originationFee: 1_200,
    underwritingFee: 0,
    drawFeePerDraw: 100,
    drawCount: 6,
    otherFees: 0,
    exitClosingCosts: 0,
  };

  const investor: InvestorInputs = {
    fundingType: 'debt',
    drawFeePerDraw: 0,
    drawCount: 0,
    otherFees: 0,
    debt: {
      advancePercent: 90,
      ratePercent: 10,
      pointsPercent: 0,
      upfrontFees: 0,
      exitFeePercent: 1,
      exitFeeBasis: 'loan',
      termMonths: 9,
    },
    equity: {
      equityPercent: 40,
      prefPercent: 8,
      capitalContributed: 120_000,
    },
  };

  const dscrRefi: DscrRefiInputs = {
    dscrTarget: 1.2,
    maxLtvPercent: 70,
    ratePercent: 7.25,
    termYears: 30,
    amortYears: 30,
    closingCostsPercent: 2,
    fees: 1_500,
    prepayPenalty: false,
  };

  const base: BrrrInputs = {
    shared,
    hardMoney,
    investor,
    allCash: { takeRefi: false },
    dscrRefi,
  };
  return deepMerge(base, overrides);
};

export const mergeBrrrInputs = (current?: DeepPartial<BrrrInputs>, base?: BrrrInputs) =>
  deepMerge(base ?? createDefaultBrrrInputs(), current);

const applySensitivity = (inputs: BrrrInputs, adjustments?: SensitivityAdjustments): { model: BrrrInputs; applied: SensitivityAdjustments } => {
  const applied = adjustments ? { ...defaultSensitivity, ...adjustments } : { ...defaultSensitivity };
  const model = clone(inputs);
  model.shared.arv = model.shared.arv * (1 + applied.arvPercent / 100);
  model.shared.marketRent = model.shared.marketRent * (1 + applied.rentPercent / 100);
  if (model.shared.expenseRatioPercent !== null) {
    model.shared.expenseRatioPercent = clamp(
      model.shared.expenseRatioPercent + applied.expensePercentDelta,
      0,
      95,
    );
  }
  model.hardMoney.ratePercent += applied.bridgeRateDelta;
  model.investor.debt.ratePercent += applied.bridgeRateDelta;
  model.dscrRefi.ratePercent += applied.refiRateDelta;
  return { model, applied };
};

const buildHardMoneyScenario = (inputs: BrrrInputs, derived: BaseDerivatives, adjustments: SensitivityAdjustments): ScenarioResult => {
  const principal = inputs.shared.purchasePrice * (clamp(inputs.hardMoney.ltvPercent, 0, 100) / 100);
  const drawFees = inputs.hardMoney.drawFeePerDraw * inputs.hardMoney.drawCount;
  const { interest, points, totalProjectCost, sponsorCashIn } = computeBridgeCarry({
    shared: inputs.shared,
    derived,
    bridgePrincipal: principal,
    ratePercent: inputs.hardMoney.ratePercent,
    pointsPercent: inputs.hardMoney.pointsPercent,
    fees: toNumber(inputs.hardMoney.originationFee) + toNumber(inputs.hardMoney.underwritingFee),
    drawFees,
    otherFees: inputs.hardMoney.otherFees,
  });
  const payoff = principal + toNumber(inputs.hardMoney.exitClosingCosts);
  const refi = computeRefi({ shared: inputs.shared, dscr: inputs.dscrRefi, payoff, noi: derived.operating.noi, refiRateDelta: adjustments.refiRateDelta });
  const cashOutToSponsor = Math.max(0, refi.netRefiCash);
  const cashLeftIn = Math.max(0, sponsorCashIn - cashOutToSponsor);
  const annualCashFlowToSponsor = Math.max(derived.operating.noi - refi.annualDebtService, 0);
  const yearOneCoC = sponsorCashIn > 0 ? annualCashFlowToSponsor / sponsorCashIn : null;
  const paybackYears =
    annualCashFlowToSponsor > 0 ? cashLeftIn / annualCashFlowToSponsor : null;
  const equityCreated = Math.max(inputs.shared.arv - refi.refiProceeds, 0);
  const spread =
    inputs.shared.marketCapRatePercent !== null &&
    inputs.shared.marketCapRatePercent > 0 &&
    inputs.shared.arv > 0
      ? derived.operating.noi / inputs.shared.arv - inputs.shared.marketCapRatePercent / 100
      : null;
  return finalizeScenario(
    {
      scenario: 'hardMoney',
      totalProjectCost,
      sponsorCashIn,
      investorCashIn: 0,
      cashOutToSponsor,
      cashLeftIn,
      cashAvailableToDistribute: undefined,
      noi: derived.operating.noi,
      refiProceeds: refi.refiProceeds,
      refiConstraint: refi.refiConstraint,
      monthlyPAndI: refi.monthlyPAndI,
      actualDscr: refi.actualDscr,
      dscrTarget: inputs.dscrRefi.dscrTarget,
      refiCosts: refi.refiCosts,
      netRefiCash: refi.netRefiCash,
      bridgePayoff: payoff,
      maxLoanByDscr: refi.maxLoanByDscr,
      maxLoanByLtv: refi.maxLoanByLtv,
      annualDebtService: refi.annualDebtService ?? 0,
      annualCashFlowToSponsor,
      yearOneCoC,
      paybackYears,
      equityCreated,
      yieldOnCost: computeYieldOnCost(derived.operating.noi, inputs.shared, derived),
      spreadToMarketCap: spread,
      notes: [],
    },
    inputs.dscrRefi,
  );
};

const buildInvestorDebtScenario = (inputs: BrrrInputs, derived: BaseDerivatives, adjustments: SensitivityAdjustments): ScenarioResult => {
  const advance = clamp(inputs.investor.debt.advancePercent, 0, 100) / 100;
  const principal = inputs.shared.purchasePrice * advance;
  const drawFees = inputs.investor.drawFeePerDraw * inputs.investor.drawCount;
  const otherFees = toNumber(inputs.investor.otherFees);
  const durationOverride = Math.min(
    toNumber(inputs.shared.rehabDurationMonths),
    Math.max(toNumber(inputs.investor.debt.termMonths), 1),
  );
  const { interest, points, totalProjectCost, sponsorCashIn } = computeBridgeCarry({
    shared: inputs.shared,
    derived,
    bridgePrincipal: principal,
    ratePercent: inputs.investor.debt.ratePercent,
    pointsPercent: inputs.investor.debt.pointsPercent,
    fees: toNumber(inputs.investor.debt.upfrontFees),
    drawFees,
    otherFees,
    durationOverride,
  });
  const exitFeeBase =
    inputs.investor.debt.exitFeeBasis === 'arv'
      ? inputs.shared.arv
      : principal;
  const exitFee = exitFeeBase * (clamp(inputs.investor.debt.exitFeePercent, 0, 10) / 100);
  const payoff = principal + exitFee;
  const refi = computeRefi({ shared: inputs.shared, dscr: inputs.dscrRefi, payoff, noi: derived.operating.noi, refiRateDelta: adjustments.refiRateDelta });
  const cashOutToSponsor = Math.max(0, refi.netRefiCash);
  const cashLeftIn = Math.max(0, sponsorCashIn - cashOutToSponsor);
  const annualCashFlowToSponsor = Math.max(derived.operating.noi - refi.annualDebtService, 0);
  const yearOneCoC = sponsorCashIn > 0 ? annualCashFlowToSponsor / sponsorCashIn : null;
  const paybackYears =
    annualCashFlowToSponsor > 0 ? cashLeftIn / annualCashFlowToSponsor : null;
  const equityCreated = Math.max(inputs.shared.arv - refi.refiProceeds, 0);
  const spread =
    inputs.shared.marketCapRatePercent !== null &&
    inputs.shared.marketCapRatePercent > 0 &&
    inputs.shared.arv > 0
      ? derived.operating.noi / inputs.shared.arv - inputs.shared.marketCapRatePercent / 100
      : null;
  return finalizeScenario(
    {
      scenario: 'investorDebt',
      totalProjectCost,
      sponsorCashIn,
      investorCashIn: 0,
      cashOutToSponsor,
      cashLeftIn,
      cashAvailableToDistribute: undefined,
      noi: derived.operating.noi,
      refiProceeds: refi.refiProceeds,
      refiConstraint: refi.refiConstraint,
      monthlyPAndI: refi.monthlyPAndI,
      actualDscr: refi.actualDscr,
      dscrTarget: inputs.dscrRefi.dscrTarget,
      refiCosts: refi.refiCosts,
      netRefiCash: refi.netRefiCash,
      bridgePayoff: payoff,
      maxLoanByDscr: refi.maxLoanByDscr,
      maxLoanByLtv: refi.maxLoanByLtv,
      annualDebtService: refi.annualDebtService ?? 0,
      annualCashFlowToSponsor,
      yearOneCoC,
      paybackYears,
      equityCreated,
      yieldOnCost: computeYieldOnCost(derived.operating.noi, inputs.shared, derived),
      spreadToMarketCap: spread,
      notes: [],
    },
    inputs.dscrRefi,
  );
};

const buildInvestorEquityScenario = (inputs: BrrrInputs, derived: BaseDerivatives, adjustments: SensitivityAdjustments): ScenarioResult => {
  const totalProjectCost =
    inputs.shared.purchasePrice +
    derived.purchaseClosingTotal +
    derived.rehabTotal +
    derived.holdingCostsTotal;
  const investorOwnership = clamp(inputs.investor.equity.equityPercent, 0, 100) / 100;
  const sponsorOwnership = 1 - investorOwnership;
  const investorCashIn = Math.min(toNumber(inputs.investor.equity.capitalContributed), totalProjectCost);
  const sponsorCashIn = Math.max(totalProjectCost - investorCashIn, 0);
  const payoff = 0;
  const refi = computeRefi({ shared: inputs.shared, dscr: inputs.dscrRefi, payoff, noi: derived.operating.noi, refiRateDelta: adjustments.refiRateDelta });
  const availableCash = Math.max(0, refi.netRefiCash);
  const cashOutToSponsor = 0;
  const cashLeftIn = sponsorCashIn;
  const annualDebtService = refi.annualDebtService ?? 0;
  const annualCashFlow = Math.max(derived.operating.noi - annualDebtService, 0);
  const annualCashFlowToSponsor = annualCashFlow * sponsorOwnership;
  const yearOneCoC = sponsorCashIn > 0 ? annualCashFlowToSponsor / sponsorCashIn : null;
  const paybackYears =
    annualCashFlowToSponsor > 0 ? cashLeftIn / annualCashFlowToSponsor : null;
  const equityCreated = Math.max(inputs.shared.arv - refi.refiProceeds, 0);
  const prefAccrual =
    toNumber(inputs.investor.equity.capitalContributed) *
    (clamp(inputs.investor.equity.prefPercent, 0, 20) / 100) *
    (clamp(inputs.shared.rehabDurationMonths, 0, 48) / 12);
  const spread =
    inputs.shared.marketCapRatePercent !== null &&
    inputs.shared.marketCapRatePercent > 0 &&
    inputs.shared.arv > 0
      ? derived.operating.noi / inputs.shared.arv - inputs.shared.marketCapRatePercent / 100
      : null;
  return finalizeScenario(
    {
      scenario: 'investorEquity',
      totalProjectCost,
      sponsorCashIn,
      investorCashIn,
      cashOutToSponsor,
      cashLeftIn,
      cashAvailableToDistribute: availableCash,
      noi: derived.operating.noi,
      refiProceeds: refi.refiProceeds,
      refiConstraint: refi.refiConstraint,
      monthlyPAndI: refi.monthlyPAndI,
      actualDscr: refi.actualDscr,
      dscrTarget: inputs.dscrRefi.dscrTarget,
      refiCosts: refi.refiCosts,
      netRefiCash: refi.netRefiCash,
      bridgePayoff: payoff,
      maxLoanByDscr: refi.maxLoanByDscr,
      maxLoanByLtv: refi.maxLoanByLtv,
      annualDebtService,
      annualCashFlowToSponsor,
      yearOneCoC,
      paybackYears,
      equityCreated,
      yieldOnCost: computeYieldOnCost(derived.operating.noi, inputs.shared, derived),
      spreadToMarketCap: spread,
      prefAccrual,
      investorOwnership,
      sponsorOwnership,
      notes: [`Pref accrual during rehab: $${prefAccrual.toFixed(0)}`],
    },
    inputs.dscrRefi,
  );
};

const buildAllCashScenario = (inputs: BrrrInputs, derived: BaseDerivatives, adjustments: SensitivityAdjustments): ScenarioResult => {
  const totalProjectCost =
    inputs.shared.purchasePrice +
    derived.purchaseClosingTotal +
    derived.rehabTotal +
    derived.holdingCostsTotal;
  const sponsorCashIn = totalProjectCost;
  const payoff = 0;
  if (!inputs.allCash.takeRefi) {
    const annualCashFlowToSponsor = derived.operating.noi;
    const yearOneCoC = sponsorCashIn > 0 ? annualCashFlowToSponsor / sponsorCashIn : null;
    const paybackYears =
      annualCashFlowToSponsor > 0 ? sponsorCashIn / annualCashFlowToSponsor : null;
    const spread =
      inputs.shared.marketCapRatePercent !== null &&
      inputs.shared.marketCapRatePercent > 0 &&
      inputs.shared.arv > 0
        ? derived.operating.noi / inputs.shared.arv - inputs.shared.marketCapRatePercent / 100
        : null;
    return finalizeScenario(
      {
        scenario: 'allCash',
        totalProjectCost,
        sponsorCashIn,
        investorCashIn: 0,
        cashOutToSponsor: 0,
        cashLeftIn: sponsorCashIn,
        cashAvailableToDistribute: undefined,
        noi: derived.operating.noi,
        refiProceeds: 0,
        refiConstraint: 'None',
        monthlyPAndI: 0,
        actualDscr: 0,
        dscrTarget: inputs.dscrRefi.dscrTarget,
        refiCosts: 0,
        netRefiCash: 0,
        bridgePayoff: 0,
        maxLoanByDscr: 0,
        maxLoanByLtv: 0,
        annualDebtService: 0,
        annualCashFlowToSponsor,
        yearOneCoC,
        paybackYears,
        equityCreated: inputs.shared.arv,
        yieldOnCost: computeYieldOnCost(derived.operating.noi, inputs.shared, derived),
        spreadToMarketCap: spread,
        notes: ['DSCR refi disabled'],
      },
      inputs.dscrRefi,
    );
  }
  const refi = computeRefi({ shared: inputs.shared, dscr: inputs.dscrRefi, payoff, noi: derived.operating.noi, refiRateDelta: adjustments.refiRateDelta });
  const cashOutToSponsor = Math.max(0, refi.netRefiCash);
  const cashLeftIn = Math.max(0, sponsorCashIn - cashOutToSponsor);
  const annualCashFlowToSponsor = Math.max(derived.operating.noi - refi.annualDebtService, 0);
  const yearOneCoC = sponsorCashIn > 0 ? annualCashFlowToSponsor / sponsorCashIn : null;
  const paybackYears =
    annualCashFlowToSponsor > 0 ? cashLeftIn / annualCashFlowToSponsor : null;
  const equityCreated = Math.max(inputs.shared.arv - refi.refiProceeds, 0);
  const spread =
    inputs.shared.marketCapRatePercent !== null &&
    inputs.shared.marketCapRatePercent > 0 &&
    inputs.shared.arv > 0
      ? derived.operating.noi / inputs.shared.arv - inputs.shared.marketCapRatePercent / 100
      : null;
  return finalizeScenario(
    {
      scenario: 'allCash',
      totalProjectCost,
      sponsorCashIn,
      investorCashIn: 0,
      cashOutToSponsor,
      cashLeftIn,
      cashAvailableToDistribute: undefined,
      noi: derived.operating.noi,
      refiProceeds: refi.refiProceeds,
      refiConstraint: refi.refiConstraint,
      monthlyPAndI: refi.monthlyPAndI,
      actualDscr: refi.actualDscr,
      dscrTarget: inputs.dscrRefi.dscrTarget,
      refiCosts: refi.refiCosts,
      netRefiCash: refi.netRefiCash,
      bridgePayoff: payoff,
      maxLoanByDscr: refi.maxLoanByDscr,
      maxLoanByLtv: refi.maxLoanByLtv,
      annualDebtService: refi.annualDebtService ?? 0,
      annualCashFlowToSponsor,
      yearOneCoC,
      paybackYears,
      equityCreated,
      yieldOnCost: computeYieldOnCost(derived.operating.noi, inputs.shared, derived),
      spreadToMarketCap: spread,
      notes: [],
    },
    inputs.dscrRefi,
  );
};

export const buildBrrrModel = (
  rawInputs: BrrrInputs,
  adjustments?: SensitivityAdjustments,
): BuildBrrrModelResult => {
  const { model, applied } = applySensitivity(rawInputs, adjustments);
  const derived: BaseDerivatives = {
    rehabTotal: computeRehabTotal(model.shared),
    holdingCostsTotal: computeHoldingCostsTotal(model.shared),
    purchaseClosingTotal: computePurchaseClosing(model.shared),
    operating: buildOperatingSnapshot(model.shared),
  };
  const hardMoney = buildHardMoneyScenario(model, derived, applied);
  const investorDebt = buildInvestorDebtScenario(model, derived, applied);
  const investorEquity = buildInvestorEquityScenario(model, derived, applied);
  const investorActive =
    model.investor.fundingType === 'debt' ? investorDebt : investorEquity;
  const allCash = buildAllCashScenario(model, derived, applied);
  return {
    inputs: model,
    derived,
    scenarios: {
      hardMoney,
      investorDebt,
      investorEquity,
      investorActive,
      allCash,
    },
    sensitivity: applied,
  };
};

const selectScenario = (result: BuildBrrrModelResult, key: ScenarioKey) => {
  switch (key) {
    case 'hardMoney':
      return result.scenarios.hardMoney;
    case 'investorDebt':
      return result.scenarios.investorDebt;
    case 'investorEquity':
      return result.scenarios.investorEquity;
    case 'investorActive':
      return result.scenarios.investorActive;
    default:
      return result.scenarios.allCash;
  }
};

export const solveMaxOfferPrice = (
  baseInputs: BrrrInputs,
  scenario: ScenarioKey,
  targetCashLeft = 5000,
  adjustments?: SensitivityAdjustments,
): number | null => {
  const maxPrice = Math.max(baseInputs.shared.arv * 0.98, baseInputs.shared.purchasePrice);
  let low = 1000;
  let high = Math.max(maxPrice, 1000);
  let best: number | null = null;
  for (let i = 0; i < 35; i += 1) {
    const mid = (low + high) / 2;
    const trial = mergeBrrrInputs({ shared: { purchasePrice: mid } }, baseInputs);
    const result = buildBrrrModel(trial, adjustments);
    const scenarioResult = selectScenario(result, scenario);
    const cashLeft = scenarioResult.cashLeftIn ?? Number.POSITIVE_INFINITY;
    if (cashLeft <= targetCashLeft) {
      best = mid;
      low = mid;
    } else {
      high = mid;
    }
    if (Math.abs(high - low) < 100) break;
  }
  return best;
};
