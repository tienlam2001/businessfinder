import React from 'react';
import { fmtCurrency, fmtPercent, fmtNumber } from '../../../utils/formatters';

export default function OutputSummary({ scenarioResult, valueAddResult, activeScenarioKey }) {
  const summary = scenarioResult?.summary || {};
  const valueAdd = valueAddResult || {};
  const scenarioLabel = activeScenarioKey
    ? activeScenarioKey.charAt(0).toUpperCase() + activeScenarioKey.slice(1)
    : 'Base';
  const loanBasisLabels = {
    lesser: 'Lesser of DSCR/LTV',
    dscr: 'DSCR Only',
    ltv: 'LTV Only',
  };
  const loanBasis = loanBasisLabels[summary.loanSizingMethod] || loanBasisLabels.lesser;
  const extraDownAmount =
    (summary.purchasePrice || 0) * ((summary.whatIfExtraDownPct || 0) / 100);

  const warnings = [];
  if ((summary.dscrMin || 0) > 0 && (summary.dscrYear1 || 0) < summary.dscrMin) {
    warnings.push(`DSCR ${fmtNumber(summary.dscrYear1)} is below min ${fmtNumber(summary.dscrMin)}.`);
  }
  if ((summary.vacancyApplied || 0) > 0.15) {
    warnings.push(`Vacancy at ${fmtPercent(summary.vacancyApplied, 1)} exceeds 15%.`);
  }
  if (
    (valueAdd.stabilizedValue || 0) &&
    (valueAdd.totalCostBasis || 0) &&
    valueAdd.stabilizedValue < valueAdd.totalCostBasis
  ) {
    warnings.push('Stabilized value is below total project cost - value-add may destroy equity.');
  }

  const coreUnderwriting = [
    { label: 'NOI Year 1', value: fmtCurrency(summary.noiYear1) },
    { label: 'Stabilized NOI', value: fmtCurrency(summary.noiStabilized) },
    { label: 'DSCR Year 1', value: fmtNumber(summary.dscrYear1) },
    { label: 'Min DSCR', value: fmtNumber(summary.minDscr) },
    { label: 'Vacancy Applied', value: fmtPercent(summary.vacancyApplied) },
    { label: 'Implied Cap Rate', value: fmtPercent(summary.impliedCapRate) },
  ];

  const loanSizing = [
    { label: 'Loan Basis', value: loanBasis },
    { label: 'Underwritten LTV', value: fmtPercent(summary.ltvAtUnderwrite) },
    { label: 'Underwritten Loan', value: fmtCurrency(summary.loanAmount) },
    { label: 'Max Loan by LTV', value: fmtCurrency(summary.maxLoanByLTV) },
    { label: 'Max Loan by DSCR', value: fmtCurrency(summary.maxLoanByDSCR) },
    { label: 'Max Price by DSCR', value: fmtCurrency(summary.maxPriceByDSCR) },
    { label: 'Equity Required', value: fmtCurrency(summary.equityRequired) },
    { label: 'Debt Service Year 1', value: fmtCurrency(summary.debtServiceYear1) },
  ];

  const valueAddMetrics = [
    { label: 'Stabilized GPR', value: fmtCurrency(valueAdd.stabilizedGPR) },
    { label: 'Stabilized NOI', value: fmtCurrency(valueAdd.stabilizedNOI) },
    { label: 'Stabilized Value', value: fmtCurrency(valueAdd.stabilizedValue) },
  ];

  const refinanceOutcome = [
    { label: 'Refi Loan', value: fmtCurrency(valueAdd.refinanceLoan) },
    { label: 'Cash-Out After Refi', value: fmtCurrency(valueAdd.cashOut) },
    { label: 'Total Cost Basis', value: fmtCurrency(valueAdd.totalCostBasis) },
  ];

  const returnMetrics = [
    { label: 'NPV', value: fmtCurrency(summary.npv) },
    { label: 'IRR', value: fmtPercent(summary.irr) },
    { label: 'Cash-on-Cash Year 1', value: fmtPercent(summary.cashOnCashYear1) },
    { label: 'Average Cash-on-Cash', value: fmtPercent(summary.cashOnCashAvg) },
  ];

  const whatIfDown = [
    {
      label: 'Extra Down Tested',
      value: `${fmtPercent((summary.whatIfExtraDownPct || 0) / 100, 1)} (${fmtCurrency(
        extraDownAmount
      )})`,
    },
    { label: 'Loan After What-If', value: fmtCurrency(summary.whatIfLoan) },
    { label: 'DSCR Year 1 After What-If', value: fmtNumber(summary.whatIfDscrYear1) },
    { label: 'Added Equity vs Base', value: fmtCurrency(summary.additionalEquityForWhatIf) },
    { label: 'Debt Service After What-If', value: fmtCurrency(summary.whatIfDebtServiceYear1) },
  ];

  const dscrPath = [
    { label: 'DSCR Covenant', value: fmtNumber(summary.dscrMin) },
    { label: 'Loan at DSCR Limit', value: fmtCurrency(summary.loanForTargetDscr) },
    { label: 'LTV at DSCR Limit', value: fmtPercent(summary.ltvAtTargetDscr) },
    { label: 'Equity Needed for DSCR', value: fmtCurrency(summary.equityToMeetDscr) },
    { label: 'Added Equity Needed', value: fmtCurrency(summary.additionalEquityToMeetDscr) },
  ];

  return (
    <div className="glass-card">
      <div className="section-header">
        <div>
          <h3 className="section-title">Output Summary</h3>
          <p className="section-subtitle">Viewing {scenarioLabel} scenario.</p>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="alert warning">
          {warnings.map((w, idx) => (
            <div key={idx}>{w}</div>
          ))}
        </div>
      )}

      {/* ================= BEFORE VALUE-ADD ================= */}
      <div className="major-section-header">Before Value-Add</div>

      <div className="stat-section-header">Core Underwriting</div>
      <div className="stat-grid">
        {coreUnderwriting.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="stat-section-header">Loan Sizing</div>
      <div className="stat-grid">
        {loanSizing.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="stat-section-header">What-If: More Equity</div>
      <div className="stat-grid">
        {whatIfDown.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="stat-section-header">Path to DSCR Target</div>
      <div className="stat-grid">
        {dscrPath.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* ================= AFTER VALUE-ADD ================= */}
      <div className="major-section-header">After Value-Add & Refinance</div>

      <div className="stat-section-header">Value-Add Metrics</div>
      <div className="stat-grid">
        {valueAddMetrics.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="stat-section-header">Refinance Outcome</div>
      <div className="stat-grid">
        {refinanceOutcome.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="stat-section-header">Return Metrics</div>
      <div className="stat-grid">
        {returnMetrics.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="deal-verdict">
        <h4>Deal Verdict</h4>
        <p>
          {(summary.dscrYear1 || 0) >= (summary.dscrMin || 0) &&
          (summary.vacancyApplied || 0) <= 0.15
            ? 'This deal meets lender standards and appears financeable based on current underwriting.'
            : 'This deal shows risk factors - review DSCR, vacancy, and stabilized value before proceeding.'}
        </p>
      </div>
    </div>
  );
}
