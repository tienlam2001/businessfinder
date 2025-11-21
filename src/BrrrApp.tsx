import React, { createContext, useContext, useMemo, useReducer, useState } from 'react';

type PropertyProfile = {
  address: string;
  city: string;
  state: string;
  zip: string;
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
  county?: string;
  zoning?: string;
};

type OwnerProfile = {
  ownerName?: string;
  ownerLLCName?: string;
  ownerMailingAddress?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  infoSource?: string;
};

type AcquisitionRehab = {
  purchasePrice: number;
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
  dailyCarryingCost: number;
};

type PurchaseFinancing = {
  useHardMoney: boolean;
  purchaseLTV: number;
  interestRate: number;
  termMonths: number;
  interestOnly: boolean;
  pointsPercent: number;
  lenderFees: number;
};

type RehabFinancing = {
  financed: boolean;
  rehabLTC: number;
  interestRate: number;
  termMonths: number;
  interestOnly: boolean;
  pointsPercent: number;
  lenderFees: number;
};

type RefiFinancing = {
  arv: number;
  refiLTV: number;
  interestRate: number;
  termYears: number;
  closingCosts: number;
  seasoningMonths: number;
};

type RentalOps = {
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

type BrrrrState = {
  propertyProfile: PropertyProfile;
  ownerProfile: OwnerProfile;
  acquisitionRehab: AcquisitionRehab;
  purchaseFinancing: PurchaseFinancing;
  rehabFinancing: RehabFinancing;
  refiFinancing: RefiFinancing;
  rentalOps: RentalOps;
};

type BrrrrOutputs = {
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
};

const defaultState: BrrrrState = {
  propertyProfile: {
    address: '123 Maple St',
    city: 'Cleveland',
    state: 'OH',
    zip: '44101',
    yearBuilt: 1998,
    propertyType: 'SFH',
    squareFeet: 1850,
    lotSizeSqFt: 7400,
    beds: 3,
    baths: 2,
    county: 'Cuyahoga',
    arvEstimate: 255000,
  },
  ownerProfile: {
    ownerName: 'Nexus Capital LLC',
    ownerLLCName: 'Nexus Capital LLC',
    ownerMailingAddress: '456 Investor Way, Suite 300',
    ownerPhone: '(216) 555-4211',
    ownerEmail: 'team@nexus.cap',
    infoSource: 'public record',
  },
  acquisitionRehab: {
    purchasePrice: 180000,
    earnestMoney: 2500,
    inspectionCost: 650,
    appraisalCost: 650,
    closingCosts: 3500,
    realtorFees: 0,
    rehabExterior: 3500,
    rehabInterior: 6000,
    rehabKitchen: 10000,
    rehabBaths: 8000,
    rehabHVAC: 3500,
    rehabElectrical: 2500,
    rehabPlumbing: 2500,
    rehabWindowsDoors: 4000,
    rehabAppliances: 2500,
    rehabPermits: 1000,
    rehabLandscaping: 1000,
    rehabMisc: 1500,
    rehabOveragePercent: 10,
    rehabTimelineDays: 90,
    dailyCarryingCost: 45,
  },
  purchaseFinancing: {
    useHardMoney: true,
    purchaseLTV: 82,
    interestRate: 10.25,
    termMonths: 12,
    interestOnly: true,
    pointsPercent: 2,
    lenderFees: 1250,
  },
  rehabFinancing: {
    financed: true,
    rehabLTC: 85,
    interestRate: 11.5,
    termMonths: 12,
    interestOnly: true,
    pointsPercent: 1.5,
    lenderFees: 600,
  },
  refiFinancing: {
    arv: 255000,
    refiLTV: 75,
    interestRate: 6.5,
    termYears: 30,
    closingCosts: 4200,
    seasoningMonths: 6,
  },
  rentalOps: {
    marketRent: 2200,
    vacancyRate: 5,
    taxesAnnual: 3600,
    insuranceAnnual: 1200,
    maintenancePercent: 8,
    capexPercent: 5,
    managementPercent: 8,
    hoaMonthly: 0,
    utilitiesMonthlyOwnerPaid: 150,
  },
};

const BrrrrContext = createContext<{
  state: BrrrrState;
  update: <K extends keyof BrrrrState>(section: K, patch: Partial<BrrrrState[K]>) => void;
}>({
  state: defaultState,
  update: () => undefined,
});

type Action<K extends keyof BrrrrState> = {
  type: 'update';
  section: K;
  patch: Partial<BrrrrState[K]>;
};

const reducer = <K extends keyof BrrrrState>(state: BrrrrState, action: Action<K>): BrrrrState => {
  if (action.type === 'update') {
    return {
      ...state,
      [action.section]: { ...state[action.section], ...action.patch },
    };
  }
  return state;
};

const BrrrrProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, defaultState);
  const update = <K extends keyof BrrrrState>(section: K, patch: Partial<BrrrrState[K]>) => {
    dispatch({ type: 'update', section, patch });
  };
  return <BrrrrContext.Provider value={{ state, update }}>{children}</BrrrrContext.Provider>;
};

const useBrrrr = () => useContext(BrrrrContext);

const sumRehab = (acq: AcquisitionRehab) =>
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

const calculateTotalRehab = (acq: AcquisitionRehab) => {
  const rehabTotal = sumRehab(acq);
  const contingencyMultiplier = 1 + (acq.rehabOveragePercent || 0) / 100;
  const rehabWithContingency = rehabTotal * contingencyMultiplier;
  return { rehabTotal, rehabWithContingency };
};

const calculateAllInCosts = (state: BrrrrState) => {
  const { acquisitionRehab, purchaseFinancing } = state;
  const { rehabWithContingency } = calculateTotalRehab(acquisitionRehab);
  const purchaseLoanAmount = acquisitionRehab.purchasePrice * (purchaseFinancing.purchaseLTV / 100);
  const totalAcquisitionCosts =
    acquisitionRehab.earnestMoney +
    acquisitionRehab.inspectionCost +
    acquisitionRehab.appraisalCost +
    acquisitionRehab.closingCosts +
    acquisitionRehab.realtorFees +
    purchaseFinancing.lenderFees +
    (purchaseFinancing.pointsPercent / 100) * purchaseLoanAmount;
  const carrying = acquisitionRehab.rehabTimelineDays * acquisitionRehab.dailyCarryingCost;
  return acquisitionRehab.purchasePrice + totalAcquisitionCosts + rehabWithContingency + carrying;
};

const mortgagePayment = (principal: number, annualRatePercent: number, termYears: number) => {
  const monthlyRate = annualRatePercent / 100 / 12;
  const totalMonths = termYears * 12;
  if (totalMonths === 0) return 0;
  if (monthlyRate === 0) return principal / totalMonths;
  const factor = Math.pow(1 + monthlyRate, totalMonths);
  return principal * ((monthlyRate * factor) / (factor - 1));
};

const calculateBrrrrOutputs = (state: BrrrrState): BrrrrOutputs => {
  const { acquisitionRehab, purchaseFinancing, rehabFinancing, refiFinancing, rentalOps } = state;
  const { rehabTotal, rehabWithContingency } = calculateTotalRehab(acquisitionRehab);
  const purchaseLoanAmount = acquisitionRehab.purchasePrice * (purchaseFinancing.purchaseLTV / 100);
  const totalAcquisitionCosts =
    acquisitionRehab.earnestMoney +
    acquisitionRehab.inspectionCost +
    acquisitionRehab.appraisalCost +
    acquisitionRehab.closingCosts +
    acquisitionRehab.realtorFees +
    purchaseFinancing.lenderFees +
    (purchaseFinancing.pointsPercent / 100) * purchaseLoanAmount;
  const carrying = acquisitionRehab.rehabTimelineDays * acquisitionRehab.dailyCarryingCost;
  const rehabLoanAmount = rehabFinancing.financed ? rehabWithContingency * (rehabFinancing.rehabLTC / 100) : 0;
  const totalPointsAndFees =
    purchaseFinancing.lenderFees +
    rehabFinancing.lenderFees +
    (purchaseFinancing.pointsPercent / 100) * purchaseLoanAmount +
    (rehabFinancing.pointsPercent / 100) * rehabLoanAmount;
  const allInCost = acquisitionRehab.purchasePrice + totalAcquisitionCosts + rehabWithContingency + carrying;
  const downPayment = acquisitionRehab.purchasePrice - purchaseLoanAmount;
  const totalCashIntoDeal = downPayment + totalAcquisitionCosts + (rehabWithContingency - rehabLoanAmount) + carrying;

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

  const monthsFinanced = Math.max(1, Math.min(acquisitionRehab.rehabTimelineDays / 30, purchaseFinancing.termMonths));
  const hardMoneyInterest =
    purchaseLoanAmount * (purchaseFinancing.interestRate / 100) * (monthsFinanced / 12);
  const hardMoneyPayoff = purchaseLoanAmount + hardMoneyInterest;

  const rehabMonths = Math.max(1, Math.min(acquisitionRehab.rehabTimelineDays / 30, rehabFinancing.termMonths || monthsFinanced));
  const rehabLoanInterest =
    rehabLoanAmount * (rehabFinancing.interestRate / 100) * (rehabMonths / 12);
  const rehabLoanPayoff = rehabLoanAmount + rehabLoanInterest;

  const cashOutFromRefi =
    refiLoanAmount - hardMoneyPayoff - rehabLoanPayoff - (refiFinancing.closingCosts || 0);
  const cashLeftInDeal = totalCashIntoDeal - cashOutFromRefi;
  const equityAfterRefi = refiFinancing.arv - refiLoanAmount;
  const cashOnCashReturnYear1 =
    (rentalCashflowMonthlyBeforeRefiDebt * 12) / (cashLeftInDeal !== 0 ? cashLeftInDeal : 1);

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
  };
};

const SectionCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

type InputProps = {
  label: string;
  value: string | number | undefined;
  onChange: (value: number | string) => void;
  type?: 'text' | 'number';
  step?: number;
  placeholder?: string;
  helper?: string;
};

const InputField = ({
  label,
  value,
  onChange,
  type = 'text',
  step,
  placeholder,
  helper,
}: InputProps) => (
  <label className="block">
    <span className="text-sm font-medium text-slate-700">{label}</span>
    <input
      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brrr-cyan focus:outline-none focus:ring-2 focus:ring-brrr-cyan/30"
      type={type}
      value={value ?? ''}
      step={step}
      placeholder={placeholder}
      onChange={(e) => {
        const raw = e.target.value;
        if (type === 'number') {
          const parsed = Number(raw);
          onChange(Number.isFinite(parsed) ? parsed : 0);
        } else {
          onChange(raw);
        }
      }}
      min={type === 'number' ? 0 : undefined}
    />
    {helper && <span className="mt-1 block text-xs text-slate-500">{helper}</span>}
  </label>
);

const TabButton = ({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) => (
  <button
    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
      active ? 'bg-brrr-cyan/15 text-brrr-cyan border border-brrr-cyan/40' : 'text-slate-600 hover:text-slate-800 border border-transparent'
    }`}
    onClick={onClick}
    type="button"
  >
    {label}
  </button>
);

const PropertyOwnerTab = () => {
  const { state, update } = useBrrrr();
  const { propertyProfile, ownerProfile } = state;

  const handlePropertyChange = <K extends keyof PropertyProfile>(key: K, value: PropertyProfile[K]) =>
    update('propertyProfile', { [key]: value });
  const handleOwnerChange = <K extends keyof OwnerProfile>(key: K, value: OwnerProfile[K]) =>
    update('ownerProfile', { [key]: value });

  return (
    <div className="space-y-6">
      <SectionCard title="Property Info">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Address" value={propertyProfile.address} onChange={(v) => handlePropertyChange('address', v as string)} />
          <InputField label="City" value={propertyProfile.city} onChange={(v) => handlePropertyChange('city', v as string)} />
          <InputField label="State" value={propertyProfile.state} onChange={(v) => handlePropertyChange('state', v as string)} />
          <InputField label="ZIP" value={propertyProfile.zip} onChange={(v) => handlePropertyChange('zip', v as string)} />
          <InputField label="County" value={propertyProfile.county} onChange={(v) => handlePropertyChange('county', v as string)} />
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Property Type</span>
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brrr-cyan focus:outline-none focus:ring-2 focus:ring-brrr-cyan/30"
              value={propertyProfile.propertyType}
              onChange={(e) => handlePropertyChange('propertyType', e.target.value as PropertyProfile['propertyType'])}
            >
              <option value="SFH">SFH</option>
              <option value="Duplex">Duplex</option>
              <option value="Triplex">Triplex</option>
              <option value="Fourplex">Fourplex</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <InputField
            label="Year Built"
            type="number"
            value={propertyProfile.yearBuilt}
            onChange={(v) => handlePropertyChange('yearBuilt', v === '' ? undefined : (v as number))}
          />
          <InputField
            label="Square Feet"
            type="number"
            value={propertyProfile.squareFeet}
            onChange={(v) => handlePropertyChange('squareFeet', v === '' ? undefined : (v as number))}
          />
          <InputField
            label="Lot Size (sq ft)"
            type="number"
            value={propertyProfile.lotSizeSqFt}
            onChange={(v) => handlePropertyChange('lotSizeSqFt', v === '' ? undefined : (v as number))}
          />
          <InputField
            label="Beds"
            type="number"
            value={propertyProfile.beds}
            onChange={(v) => handlePropertyChange('beds', v === '' ? undefined : (v as number))}
          />
          <InputField
            label="Baths"
            type="number"
            value={propertyProfile.baths}
            onChange={(v) => handlePropertyChange('baths', v === '' ? undefined : (v as number))}
          />
          <InputField
            label="ARV Estimate"
            type="number"
            value={propertyProfile.arvEstimate}
            onChange={(v) => handlePropertyChange('arvEstimate', v === '' ? undefined : (v as number))}
          />
        </div>
      </SectionCard>

      <SectionCard title="Owner Info">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Owner Name" value={ownerProfile.ownerName} onChange={(v) => handleOwnerChange('ownerName', v as string)} />
          <InputField label="LLC Name" value={ownerProfile.ownerLLCName} onChange={(v) => handleOwnerChange('ownerLLCName', v as string)} />
          <InputField
            label="Mailing Address"
            value={ownerProfile.ownerMailingAddress}
            onChange={(v) => handleOwnerChange('ownerMailingAddress', v as string)}
          />
          <InputField label="Phone" value={ownerProfile.ownerPhone} onChange={(v) => handleOwnerChange('ownerPhone', v as string)} />
          <InputField
            label="Email"
            value={ownerProfile.ownerEmail}
            onChange={(v) => handleOwnerChange('ownerEmail', v as string)}
            type="text"
          />
          <InputField
            label="Info Source"
            value={ownerProfile.infoSource}
            onChange={(v) => handleOwnerChange('infoSource', v as string)}
            placeholder="public record, skip tracing, etc."
          />
        </div>
      </SectionCard>
    </div>
  );
};

const AcquisitionRehabTab = () => {
  const { state, update } = useBrrrr();
  const { acquisitionRehab } = state;
  const rehabSummary = useMemo(() => calculateTotalRehab(acquisitionRehab), [acquisitionRehab]);
  const allIn = useMemo(() => calculateAllInCosts(state), [state]);

  const handleChange = <K extends keyof AcquisitionRehab>(key: K, value: AcquisitionRehab[K]) =>
    update('acquisitionRehab', { [key]: value });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <SectionCard title="Acquisition Costs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Purchase Price"
              type="number"
              value={acquisitionRehab.purchasePrice}
              onChange={(v) => handleChange('purchasePrice', (v as number) || 0)}
            />
            <InputField
              label="Earnest Money"
              type="number"
              value={acquisitionRehab.earnestMoney}
              onChange={(v) => handleChange('earnestMoney', (v as number) || 0)}
            />
            <InputField
              label="Inspection Cost"
              type="number"
              value={acquisitionRehab.inspectionCost}
              onChange={(v) => handleChange('inspectionCost', (v as number) || 0)}
            />
            <InputField
              label="Appraisal Cost"
              type="number"
              value={acquisitionRehab.appraisalCost}
              onChange={(v) => handleChange('appraisalCost', (v as number) || 0)}
            />
            <InputField
              label="Closing Costs"
              type="number"
              value={acquisitionRehab.closingCosts}
              onChange={(v) => handleChange('closingCosts', (v as number) || 0)}
            />
            <InputField
              label="Realtor Fees"
              type="number"
              value={acquisitionRehab.realtorFees}
              onChange={(v) => handleChange('realtorFees', (v as number) || 0)}
            />
          </div>
        </SectionCard>

        <SectionCard title="Rehab Budget">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Exterior"
              type="number"
              value={acquisitionRehab.rehabExterior}
              onChange={(v) => handleChange('rehabExterior', (v as number) || 0)}
            />
            <InputField
              label="Interior"
              type="number"
              value={acquisitionRehab.rehabInterior}
              onChange={(v) => handleChange('rehabInterior', (v as number) || 0)}
            />
            <InputField
              label="Kitchen"
              type="number"
              value={acquisitionRehab.rehabKitchen}
              onChange={(v) => handleChange('rehabKitchen', (v as number) || 0)}
            />
            <InputField
              label="Baths"
              type="number"
              value={acquisitionRehab.rehabBaths}
              onChange={(v) => handleChange('rehabBaths', (v as number) || 0)}
            />
            <InputField
              label="HVAC"
              type="number"
              value={acquisitionRehab.rehabHVAC}
              onChange={(v) => handleChange('rehabHVAC', (v as number) || 0)}
            />
            <InputField
              label="Electrical"
              type="number"
              value={acquisitionRehab.rehabElectrical}
              onChange={(v) => handleChange('rehabElectrical', (v as number) || 0)}
            />
            <InputField
              label="Plumbing"
              type="number"
              value={acquisitionRehab.rehabPlumbing}
              onChange={(v) => handleChange('rehabPlumbing', (v as number) || 0)}
            />
            <InputField
              label="Windows & Doors"
              type="number"
              value={acquisitionRehab.rehabWindowsDoors}
              onChange={(v) => handleChange('rehabWindowsDoors', (v as number) || 0)}
            />
            <InputField
              label="Appliances"
              type="number"
              value={acquisitionRehab.rehabAppliances}
              onChange={(v) => handleChange('rehabAppliances', (v as number) || 0)}
            />
            <InputField
              label="Permits"
              type="number"
              value={acquisitionRehab.rehabPermits}
              onChange={(v) => handleChange('rehabPermits', (v as number) || 0)}
            />
            <InputField
              label="Landscaping"
              type="number"
              value={acquisitionRehab.rehabLandscaping}
              onChange={(v) => handleChange('rehabLandscaping', (v as number) || 0)}
            />
            <InputField
              label="Miscellaneous"
              type="number"
              value={acquisitionRehab.rehabMisc}
              onChange={(v) => handleChange('rehabMisc', (v as number) || 0)}
            />
            <InputField
              label="Contingency (%)"
              type="number"
              value={acquisitionRehab.rehabOveragePercent}
              onChange={(v) => handleChange('rehabOveragePercent', (v as number) || 0)}
              helper="Applied to rehab subtotal"
            />
            <InputField
              label="Timeline (days)"
              type="number"
              value={acquisitionRehab.rehabTimelineDays}
              onChange={(v) => handleChange('rehabTimelineDays', (v as number) || 0)}
            />
            <InputField
              label="Daily Carrying Cost"
              type="number"
              value={acquisitionRehab.dailyCarryingCost}
              onChange={(v) => handleChange('dailyCarryingCost', (v as number) || 0)}
              helper="Taxes + utilities + interest per day"
            />
          </div>
        </SectionCard>
      </div>

      <div className="space-y-4">
        <div className="bg-slate-900 text-white rounded-xl shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-200">Rehab Total</span>
            <strong>${rehabSummary.rehabTotal.toLocaleString()}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-200">Rehab + Contingency</span>
            <strong>${Math.round(rehabSummary.rehabWithContingency).toLocaleString()}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-200">Projected All-In</span>
            <strong>${Math.round(allIn).toLocaleString()}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

const FinancingTab = () => {
  const { state, update } = useBrrrr();
  const { purchaseFinancing, rehabFinancing, refiFinancing } = state;

  const handlePurchaseChange = <K extends keyof PurchaseFinancing>(key: K, value: PurchaseFinancing[K]) =>
    update('purchaseFinancing', { [key]: value });
  const handleRehabChange = <K extends keyof RehabFinancing>(key: K, value: RehabFinancing[K]) =>
    update('rehabFinancing', { [key]: value });
  const handleRefiChange = <K extends keyof RefiFinancing>(key: K, value: RefiFinancing[K]) =>
    update('refiFinancing', { [key]: value });

  return (
    <div className="space-y-6">
      <SectionCard title="Purchase / Bridge">
        <div className="flex items-center gap-3">
          <input
            id="useHardMoney"
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brrr-cyan focus:ring-brrr-cyan"
            checked={purchaseFinancing.useHardMoney}
            onChange={(e) => handlePurchaseChange('useHardMoney', e.target.checked)}
          />
          <label htmlFor="useHardMoney" className="text-sm text-slate-700">
            Use hard money / bridge financing
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Purchase LTV (%)"
            type="number"
            value={purchaseFinancing.purchaseLTV}
            onChange={(v) => handlePurchaseChange('purchaseLTV', (v as number) || 0)}
          />
          <InputField
            label="Rate (%)"
            type="number"
            step={0.01}
            value={purchaseFinancing.interestRate}
            onChange={(v) => handlePurchaseChange('interestRate', (v as number) || 0)}
          />
          <InputField
            label="Term (months)"
            type="number"
            value={purchaseFinancing.termMonths}
            onChange={(v) => handlePurchaseChange('termMonths', (v as number) || 0)}
          />
          <InputField
            label="Points (%)"
            type="number"
            value={purchaseFinancing.pointsPercent}
            onChange={(v) => handlePurchaseChange('pointsPercent', (v as number) || 0)}
          />
          <InputField
            label="Lender Fees"
            type="number"
            value={purchaseFinancing.lenderFees}
            onChange={(v) => handlePurchaseChange('lenderFees', (v as number) || 0)}
          />
        </div>
      </SectionCard>

      <SectionCard title="Rehab Financing">
        <div className="flex items-center gap-3">
          <input
            id="rehabFinanced"
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brrr-purple focus:ring-brrr-purple"
            checked={rehabFinancing.financed}
            onChange={(e) => handleRehabChange('financed', e.target.checked)}
          />
          <label htmlFor="rehabFinanced" className="text-sm text-slate-700">
            Finance rehab budget
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="LTC on Rehab (%)"
            type="number"
            value={rehabFinancing.rehabLTC}
            onChange={(v) => handleRehabChange('rehabLTC', (v as number) || 0)}
            helper="Percent of rehab cost financed"
          />
          <InputField
            label="Rate (%)"
            type="number"
            step={0.01}
            value={rehabFinancing.interestRate}
            onChange={(v) => handleRehabChange('interestRate', (v as number) || 0)}
          />
          <InputField
            label="Term (months)"
            type="number"
            value={rehabFinancing.termMonths}
            onChange={(v) => handleRehabChange('termMonths', (v as number) || 0)}
          />
          <InputField
            label="Points (%)"
            type="number"
            value={rehabFinancing.pointsPercent}
            onChange={(v) => handleRehabChange('pointsPercent', (v as number) || 0)}
          />
          <InputField
            label="Lender Fees"
            type="number"
            value={rehabFinancing.lenderFees}
            onChange={(v) => handleRehabChange('lenderFees', (v as number) || 0)}
          />
        </div>
      </SectionCard>

      <SectionCard title="Refinance">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="ARV"
            type="number"
            value={refiFinancing.arv}
            onChange={(v) => handleRefiChange('arv', (v as number) || 0)}
          />
          <InputField
            label="Refi LTV (%)"
            type="number"
            value={refiFinancing.refiLTV}
            onChange={(v) => handleRefiChange('refiLTV', (v as number) || 0)}
          />
          <InputField
            label="Rate (%)"
            type="number"
            step={0.01}
            value={refiFinancing.interestRate}
            onChange={(v) => handleRefiChange('interestRate', (v as number) || 0)}
          />
          <InputField
            label="Term (years)"
            type="number"
            value={refiFinancing.termYears}
            onChange={(v) => handleRefiChange('termYears', (v as number) || 0)}
          />
          <InputField
            label="Closing Costs"
            type="number"
            value={refiFinancing.closingCosts}
            onChange={(v) => handleRefiChange('closingCosts', (v as number) || 0)}
          />
          <InputField
            label="Seasoning (months)"
            type="number"
            value={refiFinancing.seasoningMonths}
            onChange={(v) => handleRefiChange('seasoningMonths', (v as number) || 0)}
          />
        </div>
      </SectionCard>
    </div>
  );
};

const ResultsTab = () => {
  const { state } = useBrrrr();
  const outputs = useMemo(() => calculateBrrrrOutputs(state), [state]);
  const riskFlags: string[] = [];
  if (outputs.dscr < 1.1) riskFlags.push('DSCR below 1.10 target');
  if (outputs.allInCost > 0.85 * state.refiFinancing.arv) riskFlags.push('All-in cost above 85% of ARV');
  if (outputs.cashLeftInDeal > 0) riskFlags.push(`Cash left in deal: $${Math.round(outputs.cashLeftInDeal).toLocaleString()}`);

  const card = (label: string, value: string, accent = '') => (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${accent}`}>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
    </div>
  );

  const fmtMoney = (n: number) => `$${Math.round(n).toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {card('All-In Cost', fmtMoney(outputs.allInCost))}
        {card('Refi Loan Amount', fmtMoney(outputs.refiLoanAmount))}
        {card('Cash Left In Deal', fmtMoney(outputs.cashLeftInDeal), outputs.cashLeftInDeal > 0 ? 'border-orange-200 bg-orange-50' : '')}
        {card('Equity After Refi', fmtMoney(outputs.equityAfterRefi))}
        {card('DSCR', outputs.dscr.toFixed(2))}
        {card(
          'Year 1 Cash-on-Cash',
          outputs.cashOnCashReturnYear1 === Infinity
            ? '∞'
            : `${(outputs.cashOnCashReturnYear1 * 100).toFixed(1)}%`,
        )}
        {card('Monthly Cashflow (pre-debt)', fmtMoney(outputs.rentalCashflowMonthlyBeforeRefiDebt))}
      </div>

      <SectionCard title="Detail">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-2">Before Refi</h4>
            <ul className="space-y-1 text-sm text-slate-700">
              <li>Purchase Loan: {fmtMoney(outputs.purchaseLoanAmount)}</li>
              <li>Rehab Loan: {fmtMoney(outputs.rehabLoanAmount)}</li>
              <li>Total Acquisition Costs: {fmtMoney(outputs.totalAcquisitionCosts)}</li>
              <li>Total Rehab (w/ contingency): {fmtMoney(outputs.totalRehabCostWithContingency)}</li>
              <li>Total Cash Into Deal: {fmtMoney(outputs.totalCashIntoDeal)}</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-2">After Refi</h4>
            <ul className="space-y-1 text-sm text-slate-700">
              <li>Hard Money Payoff: {fmtMoney(outputs.hardMoneyPayoff)}</li>
              <li>Rehab Loan Payoff: {fmtMoney(outputs.rehabLoanPayoff)}</li>
              <li>Cash Out From Refi: {fmtMoney(outputs.cashOutFromRefi)}</li>
              <li>Equity After Refi: {fmtMoney(outputs.equityAfterRefi)}</li>
              <li>Annual Debt Service: {fmtMoney(outputs.annualDebtService)}</li>
              <li>NOI: {fmtMoney(outputs.noiAnnual)}</li>
              <li>DSCR: {outputs.dscr.toFixed(2)}</li>
            </ul>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Risk Flags">
        {riskFlags.length === 0 ? (
          <p className="text-sm text-emerald-600">No obvious risks detected.</p>
        ) : (
          <ul className="space-y-1 text-sm text-orange-700">
            {riskFlags.map((flag) => (
              <li key={flag}>• {flag}</li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
};

const RentalOpsPanel = () => {
  const { state, update } = useBrrrr();
  const { rentalOps } = state;
  const handleChange = <K extends keyof RentalOps>(key: K, value: RentalOps[K]) => update('rentalOps', { [key]: value });

  return (
    <SectionCard title="Rental & Operations">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InputField
          label="Market Rent"
          type="number"
          value={rentalOps.marketRent}
          onChange={(v) => handleChange('marketRent', (v as number) || 0)}
        />
        <InputField
          label="Vacancy (%)"
          type="number"
          value={rentalOps.vacancyRate}
          onChange={(v) => handleChange('vacancyRate', (v as number) || 0)}
        />
        <InputField
          label="Taxes (annual)"
          type="number"
          value={rentalOps.taxesAnnual}
          onChange={(v) => handleChange('taxesAnnual', (v as number) || 0)}
        />
        <InputField
          label="Insurance (annual)"
          type="number"
          value={rentalOps.insuranceAnnual}
          onChange={(v) => handleChange('insuranceAnnual', (v as number) || 0)}
        />
        <InputField
          label="Maintenance (% rent)"
          type="number"
          value={rentalOps.maintenancePercent}
          onChange={(v) => handleChange('maintenancePercent', (v as number) || 0)}
        />
        <InputField
          label="CapEx (% rent)"
          type="number"
          value={rentalOps.capexPercent}
          onChange={(v) => handleChange('capexPercent', (v as number) || 0)}
        />
        <InputField
          label="Management (% rent)"
          type="number"
          value={rentalOps.managementPercent}
          onChange={(v) => handleChange('managementPercent', (v as number) || 0)}
        />
        <InputField
          label="HOA (monthly)"
          type="number"
          value={rentalOps.hoaMonthly}
          onChange={(v) => handleChange('hoaMonthly', (v as number) || 0)}
        />
        <InputField
          label="Owner Paid Utilities (monthly)"
          type="number"
          value={rentalOps.utilitiesMonthlyOwnerPaid}
          onChange={(v) => handleChange('utilitiesMonthlyOwnerPaid', (v as number) || 0)}
        />
      </div>
    </SectionCard>
  );
};

const BrrrApp = () => {
  const [tab, setTab] = useState<'property' | 'acquisition' | 'financing' | 'results'>('property');
  const { state } = useBrrrr();

  const tabs = [
    { key: 'property', label: 'Property & Owner' },
    { key: 'acquisition', label: 'Acquisition & Rehab' },
    { key: 'financing', label: 'Financing' },
    { key: 'results', label: 'Results' },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <p className="text-sm font-semibold text-brrr-cyan uppercase tracking-wide mb-1">BRRR Analyzer</p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Buy · Rehab · Rent · Refinance · Repeat</h1>
          <p className="text-sm text-slate-600 mt-1">Typed, tabbed, and ready for quick scenario work.</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {tabs.map((t) => (
              <TabButton key={t.key} label={t.label} active={tab === t.key} onClick={() => setTab(t.key)} />
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {tab === 'property' && <PropertyOwnerTab />}
        {tab === 'acquisition' && (
          <>
            <AcquisitionRehabTab />
            <RentalOpsPanel />
          </>
        )}
        {tab === 'financing' && <FinancingTab />}
        {tab === 'results' && (
          <>
            <ResultsTab />
            <RentalOpsPanel />
          </>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">Current summary</p>
          <p>
            Property: {state.propertyProfile.address}, {state.propertyProfile.city} · Purchase ${' '}
            {state.acquisitionRehab.purchasePrice.toLocaleString()} · ARV ${' '}
            {state.refiFinancing.arv.toLocaleString()}
          </p>
        </div>
      </main>
    </div>
  );
};

export default function BrrrAppWrapped() {
  return (
    <BrrrrProvider>
      <BrrrApp />
    </BrrrrProvider>
  );
}
