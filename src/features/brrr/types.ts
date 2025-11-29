export type PropertyProfile = {
  address: string;
  yearBuilt?: number;
  propertyType: 'SFH' | 'Duplex' | 'Triplex' | 'Fourplex' | 'Other';
  squareFeet?: number;
  lotSizeSqFt?: number;
  beds?: number;
  baths?: number;
  sellerName?: string;
  askingPrice?: number;
  arvEstimate?: number;
  lastSoldPrice?: number;
  lastSoldDate?: string;
  zoning?: string;
};

export type OwnerProfile = {
  ownerName?: string;
  ownerLLCName?: string;
  ownerMailingAddress?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  infoSource?: string;
};

export type AcquisitionRehab = {
  purchasePrice: number;
  earnestMoneyMode: 'percent' | 'dollar';
  earnestMoneyPercent: number;
  earnestMoneyAbsolute: number;
  inspectionCostMode: 'percent' | 'dollar';
  inspectionCostPercent: number;
  inspectionCostAbsolute: number;
  appraisalCostMode: 'percent' | 'dollar';
  appraisalCostPercent: number;
  appraisalCostAbsolute: number;
  closingCostsMode: 'percent' | 'dollar';
  closingCostsPercent: number;
  closingCostsAbsolute: number;
  realtorFeesMode: 'percent' | 'dollar';
  realtorFeesPercent: number;
  realtorFeesAbsolute: number;
  earnestMoney: number;
  inspectionCost: number;
  appraisalCost: number;
  closingCosts: number;
  realtorFees: number;
  rehabExterior: number;
  rehabInterior: number;
  rehabKitchen: number;
  rehabBaths: number;
  rehabHVAC: number;
  rehabElectrical: number;
  rehabPlumbing: number;
  rehabWindowsDoors: number;
  rehabAppliances: number;
  rehabPermits: number;
  rehabLandscaping: number;
  rehabMisc: number;
  rehabOveragePercent: number;
  rehabTimelineDays: number;
};

export type PurchaseFinancing = {
  useHardMoney: boolean;
  purchaseLTV: number;
  interestRate: number;
  termMonths: number;
  interestOnly: boolean;
  pointsPercent: number;
  lenderFees: number;
};

export type RehabFinancing = {
  financed: boolean;
  rehabLTC: number;
  interestRate: number;
  termMonths: number;
  interestOnly: boolean;
  pointsPercent: number;
  lenderFees: number;
};

export type RefiFinancing = {
  arv: number;
  refiLTV: number;
  interestRate: number;
  termYears: number;
  closingCosts: number;
  seasoningMonths: number;
};

export type RentalOps = {
  marketRent: number;
  vacancyRate: number;
  taxesAnnual: number;
  insuranceAnnual: number;
  maintenancePercent: number;
  capexPercent: number;
  managementPercent: number;
  hoaMonthly: number;
  utilitiesMonthlyOwnerPaid: number;
};

export type BrrrrState = {
  propertyProfile: PropertyProfile;
  ownerProfile: OwnerProfile;
  acquisitionRehab: AcquisitionRehab;
  purchaseFinancing: PurchaseFinancing;
  rehabFinancing: RehabFinancing;
  refiFinancing: RefiFinancing;
  rentalOps: RentalOps;
};

export type BrrrrOutputs = {
  totalRehabCost: number;
  totalRehabCostWithContingency: number;
  totalAcquisitionCosts: number;
  allInCost: number;
  purchaseLoanAmount: number;
  rehabLoanAmount: number;
  totalPointsAndFees: number;
  totalCashIntoDeal: number;
  effectiveGrossIncomeAnnual: number;
  operatingExpensesAnnual: number;
  noiAnnual: number;
  rentalCashflowMonthlyBeforeRefiDebt: number;
  refiLoanAmount: number;
  refiMonthlyPI: number;
  annualDebtService: number;
  dscr: number;
  hardMoneyPayoff: number;
  rehabLoanPayoff: number;
  cashOutFromRefi: number;
  cashLeftInDeal: number;
  equityAfterRefi: number;
  cashOnCashReturnYear1: number;
  cashflowAfterRefiMonthly: number;
};
