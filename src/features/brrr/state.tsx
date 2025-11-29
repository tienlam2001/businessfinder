import React, { createContext, useContext, useEffect, useReducer } from 'react';
import {
  AcquisitionRehab,
  BrrrrState,
  OwnerProfile,
  PropertyProfile,
  PurchaseFinancing,
  RehabFinancing,
  RentalOps,
  RefiFinancing,
} from './types';

export const defaultState: BrrrrState = {
  propertyProfile: {
    address: '123 Maple St',
    yearBuilt: 1998,
    propertyType: 'SFH',
    squareFeet: 1850,
    lotSizeSqFt: 7400,
    beds: 3,
    baths: 2,
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
    earnestMoneyMode: 'percent',
    earnestMoneyPercent: 1,
    earnestMoneyAbsolute: 2500,
    inspectionCostMode: 'dollar',
    inspectionCostPercent: 0.5,
    inspectionCostAbsolute: 650,
    appraisalCostMode: 'dollar',
    appraisalCostPercent: 0.5,
    appraisalCostAbsolute: 650,
    closingCostsMode: 'percent',
    closingCostsPercent: 2,
    closingCostsAbsolute: 3500,
    realtorFeesMode: 'dollar',
    realtorFeesPercent: 3,
    realtorFeesAbsolute: 0,
    earnestMoney: 0,
    inspectionCost: 0,
    appraisalCost: 0,
    closingCosts: 0,
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
    return { ...state, [action.section]: { ...state[action.section], ...action.patch } };
  }
  return state;
};

export const BrrrrProvider = ({ children, residence }: { children: React.ReactNode; residence?: any }) => {
  const [state, dispatch] = useReducer(reducer, defaultState);

  useEffect(() => {
    if (residence && residence.brrrAnalysis) {
      Object.keys(residence.brrrAnalysis).forEach((key) => {
        if (key in defaultState) {
          dispatch({
            type: 'update',
            section: key as keyof BrrrrState,
            patch: residence.brrrAnalysis[key],
          });
        }
      });
    }
  }, [residence]);

  const update = <K extends keyof BrrrrState>(section: K, patch: Partial<BrrrrState[K]>) => {
    dispatch({ type: 'update', section, patch });
  };

  return <BrrrrContext.Provider value={{ state, update }}>{children}</BrrrrContext.Provider>;
};

export const useBrrrr = () => useContext(BrrrrContext);

// Convenience exports for tabs
export type { PropertyProfile, OwnerProfile, AcquisitionRehab, PurchaseFinancing, RehabFinancing, RefiFinancing, RentalOps };
