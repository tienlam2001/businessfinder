import React, { useMemo, useState } from 'react';
import { calcAfter, calcBefore } from '../utils/calculations/multifamily.ts';
import BeforeValueAddForm from '../components/multifamily/BeforeValueAddForm';
import AfterValueAddForm from '../components/multifamily/AfterValueAddForm';
import BeforeSummaryCard from '../components/multifamily/BeforeSummaryCard';
import AfterSummaryCard from '../components/multifamily/AfterSummaryCard';
import ComparisonSummary from '../components/multifamily/ComparisonSummary';

const defaultDeal = {
  id: 'draft',
  name: 'MF Value-Add',
  address: '',
  market: '',
  yearBuilt: 1995,
  before: {
    purchasePrice: 850000,
    closingCosts: 20000,
    unitMix: [
      { type: '2BR', count: 4, rent: 1200 },
      { type: '1BR', count: 4, rent: 950 },
    ],
    expenses: {
      taxes: 16000,
      insurance: 2800,
      repairs: 7000,
      capEx: 3500,
      management: 0, // default to 8% of EGI in UI guidance
      utilities: 4200,
      payroll: 0,
      other: 1500,
      vacancyRate: 0.05,
    },
    loan: {
      ltv: 0.75,
      interestRate: 0.065,
      amortYears: 30,
    },
    asIsCapRate: 0.065,
  },
  after: {
    rehabBudget: 150000,
    postRehabUnitMix: [
      { type: '2BR', count: 4, rent: 1450 },
      { type: '1BR', count: 4, rent: 1150 },
    ],
    postRehabExpenses: {
      taxes: 17500,
      insurance: 3200,
      repairs: 7500,
      capEx: 4000,
      management: 0,
      utilities: 4400,
      payroll: 0,
      other: 1800,
      vacancyRate: 0.05,
    },
    exitCapRate: 0.065,
    refiLoan: {
      ltv: 0.75,
      interestRate: 0.06,
      amortYears: 30,
    },
  },
};

export default function MultifamilyTab() {
  const [deal, setDeal] = useState(defaultDeal);

  const updateBefore = (patch) =>
    setDeal((prev) => ({ ...prev, before: { ...prev.before, ...patch } }));
  const updateAfter = (patch) =>
    setDeal((prev) => ({ ...prev, after: { ...prev.after, ...patch } }));

  const beforeResult = useMemo(() => calcBefore(deal), [deal]);
  const afterResult = useMemo(() => calcAfter(deal), [deal]);

  const warnings = [];
  if (!deal.before.unitMix?.length) warnings.push('Add at least one unit in the as-is unit mix.');
  if (!deal.after.postRehabUnitMix?.length)
    warnings.push('Add at least one unit in the stabilized unit mix.');
  if (!deal.before.asIsCapRate || deal.before.asIsCapRate <= 0) {
    warnings.push('As-is cap rate missing. Value will default to purchase price.');
  }
  if (!deal.after.exitCapRate || deal.after.exitCapRate <= 0) {
    warnings.push('Exit cap rate is required to value the stabilized deal.');
  }
  if (beforeResult.dscr !== Infinity && beforeResult.dscr < 1.15) {
    warnings.push('As-is DSCR is below 1.15x.');
  }
  if (afterResult.refiDSCR !== Infinity && afterResult.refiDSCR < 1.15) {
    warnings.push('Refi DSCR is below 1.15x.');
  }
  if (afterResult.refiLoanAmount && afterResult.refiLoanAmount / (afterResult.stabilizedValue || 1) > 0.8) {
    warnings.push('Refi LTV exceeds 80%.');
  }
  if (afterResult.cashLeftIn > afterResult.totalProjectCost * 0.3) {
    warnings.push('Cash left in is high relative to project cost.');
  }

  return (
    <div className="cre-underwriting-page">
      <div className="cre-toolbar">
        <div>
          <h2 style={{ margin: 0 }}>Multifamily – Value Add</h2>
          <p className="section-subtitle" style={{ marginTop: 4 }}>
            As-Is snapshot plus stabilized/refi view with live comparisons.
          </p>
        </div>
        <button className="btn-modern-subtle" onClick={() => setDeal(defaultDeal)} type="button">
          Reset Defaults
        </button>
      </div>

      {warnings.length > 0 && (
        <div className="alert warning">
          {warnings.map((w, idx) => (
            <div key={idx}>{w}</div>
          ))}
        </div>
      )}

      <div className="cre-grid two-col">
        <BeforeValueAddForm before={deal.before} onChange={updateBefore} />
        <BeforeSummaryCard
          result={beforeResult}
          asIsCapRate={deal.before.asIsCapRate}
          purchasePrice={deal.before.purchasePrice}
        />
      </div>

      <div className="cre-grid two-col">
        <AfterValueAddForm after={deal.after} onChange={updateAfter} />
        <AfterSummaryCard result={afterResult} exitCapRate={deal.after.exitCapRate} />
      </div>

      <ComparisonSummary before={beforeResult} after={afterResult} />
    </div>
  );
}
