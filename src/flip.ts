const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

const deepMerge = <T>(base: T, patch?: DeepPartial<T>): T => {
  if (!patch) return base;
  const output: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
  Object.entries(patch).forEach(([key, value]) => {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof output[key] === 'object'
    ) {
      output[key] = deepMerge(output[key], value);
    } else {
      output[key] = value;
    }
  });
  return output;
};

export type FlipFundingMode = 'hardMoney' | 'investor' | 'allCash';

export interface FlipSharedInputs {
  purchasePrice: number;
  arv: number;
  rehabPctOfARV: number;
  closingPctPurchase: number;
  holdingMonths: number;
  utilitiesMonthly: number;
  otherCarryingMonthly: number;
  sellingCostPct: number;
  taxesAnnual: number;
  insuranceAnnual: number;
  hoaAnnual: number;
}

export interface FlipHardMoneyInputs {
  ltvPctOnPurchase: number;
  rateAPR: number;
  pointsPct: number;
  termMonths: number;
  rehabFinancedPct: number;
}

export interface FlipInvestorInputs {
  profitSharePct: number;
  prefRateAPR: number;
  legalMiscFixed: number;
}

export interface FlipInputs {
  shared: FlipSharedInputs;
  financing: {
    mode: FlipFundingMode;
    hardMoney: FlipHardMoneyInputs;
    investor: FlipInvestorInputs;
  };
}

export interface FlipAdjustments {
  arvPercent: number;
  holdingDelta: number;
  sellingCostDelta: number;
}

export interface FlipDerived {
  rehabCost: number;
  closingPurchase: number;
  carryingBase: number;
  financingInterest: number;
  financingPoints: number;
  totalCost: number;
  saleNet: number;
  grossProfit: number;
  sponsorCashIn: number;
  investorShare?: number;
  sponsorShare?: number;
  prefAccrual?: number;
}

export interface FlipResult {
  inputs: FlipInputs;
  derived: FlipDerived;
  metrics: {
    totalCost: number;
    saleNet: number;
    grossProfit: number;
    roi: number | null;
    paybackMonths: number | null;
    sponsorShare?: number;
    investorShare?: number;
  };
}

export const createDefaultFlipInputs = (
  overrides?: DeepPartial<FlipInputs>,
): FlipInputs => {
  const base: FlipInputs = {
    shared: {
      purchasePrice: 200_000,
      arv: 300_000,
      rehabPctOfARV: 12,
      closingPctPurchase: 2,
      holdingMonths: 6,
      utilitiesMonthly: 350,
      otherCarryingMonthly: 250,
      sellingCostPct: 8,
      taxesAnnual: 3_600,
      insuranceAnnual: 1_500,
      hoaAnnual: 0,
    },
    financing: {
      mode: 'hardMoney',
      hardMoney: {
        ltvPctOnPurchase: 85,
        rateAPR: 11.5,
        pointsPct: 2,
        termMonths: 12,
        rehabFinancedPct: 75,
      },
      investor: {
        profitSharePct: 40,
        prefRateAPR: 8,
        legalMiscFixed: 5_000,
      },
    },
  };
  return deepMerge(base, overrides);
};

export const mergeFlipInputs = (current?: DeepPartial<FlipInputs>, base?: FlipInputs) =>
  deepMerge(base ?? createDefaultFlipInputs(), current);

const applyAdjustments = (inputs: FlipInputs, adjustments?: FlipAdjustments): FlipInputs => {
  if (!adjustments) return inputs;
  const clone = JSON.parse(JSON.stringify(inputs)) as FlipInputs;
  clone.shared.arv = clone.shared.arv * (1 + adjustments.arvPercent / 100);
  clone.shared.holdingMonths = Math.max(
    1,
    clone.shared.holdingMonths + adjustments.holdingDelta,
  );
  clone.shared.sellingCostPct = Math.max(
    0,
    clone.shared.sellingCostPct + adjustments.sellingCostDelta,
  );
  return clone;
};

const dollars = (value: number) => Math.max(Number(value) || 0, 0);

export const buildFlipModel = (
  inputsArg: FlipInputs,
  adjustments?: FlipAdjustments,
): FlipResult => {
  const inputs = applyAdjustments(inputsArg, adjustments);
  const shared = inputs.shared;
  const financing = inputs.financing;

  const purchasePrice = dollars(shared.purchasePrice);
  const arv = dollars(shared.arv);
  const rehabCost = arv * (clamp(shared.rehabPctOfARV, 0, 100) / 100);
  const closingPurchase =
    purchasePrice * (clamp(shared.closingPctPurchase, 0, 15) / 100);
  const holdingMonths = clamp(shared.holdingMonths, 1, 24);
  const carryingBase =
    ((dollars(shared.taxesAnnual) + dollars(shared.insuranceAnnual) + dollars(shared.hoaAnnual)) /
      12 +
      dollars(shared.utilitiesMonthly) +
      dollars(shared.otherCarryingMonthly)) *
    holdingMonths;

  let financingInterest = 0;
  let financingPoints = 0;
  let sponsorCashIn = 0;
  let investorShare: number | undefined;
  let sponsorShare: number | undefined;
  let prefAccrual: number | undefined;

  const sellingCostPct = clamp(shared.sellingCostPct, 0, 20);
  const saleNet = arv * (1 - sellingCostPct / 100);

  const mode = financing.mode;

  if (mode === 'hardMoney') {
    const purchaseLoan =
      purchasePrice * (clamp(financing.hardMoney.ltvPctOnPurchase, 0, 100) / 100);
    const rehabFinanced =
      rehabCost * (clamp(financing.hardMoney.rehabFinancedPct, 0, 100) / 100);
    const financedTotal = purchaseLoan + rehabFinanced;
    financingInterest =
      financedTotal *
      (clamp(financing.hardMoney.rateAPR, 0, 30) / 100 / 12) *
      holdingMonths;
    financingPoints = purchaseLoan * (clamp(financing.hardMoney.pointsPct, 0, 10) / 100);
    sponsorCashIn =
      (purchasePrice - purchaseLoan) +
      closingPurchase +
      (rehabCost - rehabFinanced) +
      carryingBase +
      financingInterest +
      financingPoints;
  } else if (mode === 'allCash') {
    sponsorCashIn = purchasePrice + closingPurchase + rehabCost + carryingBase;
  } else if (mode === 'investor') {
    const totalCostBeforeFinancing = purchasePrice + closingPurchase + rehabCost;
    prefAccrual =
      totalCostBeforeFinancing *
      (clamp(financing.investor.prefRateAPR, 0, 30) / 100 / 12) *
      holdingMonths;
    const legalFees = dollars(financing.investor.legalMiscFixed);
    investorShare =
      Math.max(
        0,
        (saleNet -
          (purchasePrice + closingPurchase + rehabCost + carryingBase + legalFees)) *
          (clamp(financing.investor.profitSharePct, 0, 100) / 100),
      ) || 0;
    sponsorShare =
      saleNet -
      (purchasePrice + closingPurchase + rehabCost + carryingBase + legalFees) -
      investorShare -
      (prefAccrual || 0);
    sponsorCashIn = legalFees || 0;
  }

  const totalCost =
    purchasePrice +
    closingPurchase +
    rehabCost +
    carryingBase +
    financingInterest +
    financingPoints;
  const grossProfit = saleNet - totalCost;

  const roi =
    sponsorCashIn > 0 ? grossProfit / sponsorCashIn : grossProfit > 0 ? Infinity : null;
  const paybackMonths =
    sponsorCashIn > 0 && grossProfit > 0
      ? (sponsorCashIn / grossProfit) * holdingMonths
      : null;

  return {
    inputs,
    derived: {
      rehabCost,
      closingPurchase,
      carryingBase,
      financingInterest,
      financingPoints,
      totalCost,
      saleNet,
      grossProfit,
      sponsorCashIn,
      investorShare,
      sponsorShare,
      prefAccrual,
    },
    metrics: {
      totalCost,
      saleNet,
      grossProfit,
      roi,
      paybackMonths,
      sponsorShare,
      investorShare,
    },
  };
};
