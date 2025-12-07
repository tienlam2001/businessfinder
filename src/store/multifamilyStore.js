import { useState } from 'react';

export const createDefaultDeal = () => ({
  id: 'draft',
  name: 'Multifamily Deal',
  address: '',
  yearBuilt: 1995,
  market: '',
  unitMix: [
    { type: '2 Bed', count: 4, currentRent: 1200, marketRent: 1350 },
    { type: '1 Bed', count: 2, currentRent: 1000, marketRent: 1150 },
  ],
  expenses: {
    taxes: 12000,
    insurance: '',
    repairs: 6000,
    capEx: '',
    management: '',
    utilities: 3600,
    payroll: 0,
    other: 1200,
    vacancyRate: 5,
  },
  purchasePrice: 650000,
  rehabBudget: 80000,
  closingCosts: 15000,
  loan: {
    ltv: 75,
    interestRate: 6.5,
    amortYears: 30,
  },
  refinance: {
    refiLTV: 70,
    refiInterestRate: 6,
    amortYears: 30,
    capRate: 6,
  },
});

export function useMultifamilyDeal(initialDeal) {
  const [deal, setDeal] = useState(initialDeal || createDefaultDeal());

  const updateRoot = (patch) => setDeal((prev) => ({ ...prev, ...patch }));
  const updateExpenses = (patch) =>
    setDeal((prev) => ({ ...prev, expenses: { ...prev.expenses, ...patch } }));
  const updateLoan = (patch) => setDeal((prev) => ({ ...prev, loan: { ...prev.loan, ...patch } }));
  const updateRefinance = (patch) =>
    setDeal((prev) => ({ ...prev, refinance: { ...prev.refinance, ...patch } }));
  const updateUnitMix = (nextMix) => setDeal((prev) => ({ ...prev, unitMix: nextMix }));

  const reset = () => setDeal(createDefaultDeal());

  return {
    deal,
    setDeal,
    updateRoot,
    updateExpenses,
    updateLoan,
    updateRefinance,
    updateUnitMix,
    reset,
  };
}
