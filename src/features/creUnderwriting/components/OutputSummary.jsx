import React from 'react';

const fmtCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const fmtPercent = (value, digits = 1) =>
  `${(Number.isFinite(value) ? value * 100 : 0).toFixed(digits)}%`;

const fmtNumber = (value, digits = 2) =>
  Number.isFinite(value) ? value.toFixed(digits) : '0.00';

export default function OutputSummary({ scenarioResult, valueAddResult, model, activeScenarioKey }) {
  const summary = scenarioResult?.summary || {};
  const dscrMin = Number(model?.debt?.dscrMin) || 0;
  const dscrYear1 = Number(summary.dscrYear1) || 0;
  const vacancyRate =
    (Number(model?.property?.vacancyRatePct) || 0) +
    (Number(model?.scenarios?.[activeScenarioKey]?.vacancyAdjPct) || 0);
  const valueAdd = valueAddResult || {};

  const warnings = [];
  if (dscrYear1 < dscrMin) {
    warnings.push(`DSCR ${fmtNumber(dscrYear1)} is below min ${fmtNumber(dscrMin)}`);
  }
  if (vacancyRate > 15) {
    warnings.push(`Vacancy at ${vacancyRate.toFixed(1)}% exceeds 15%`);
  }

  const stats = [
    { label: 'NOI Year 1', value: fmtCurrency(summary.noiYear1) },
    { label: 'DSCR Year 1', value: fmtNumber(dscrYear1) },
    { label: 'Min DSCR', value: fmtNumber(summary.minDscr) },
    { label: 'Underwritten Loan', value: fmtCurrency(summary.loanAmount) },
    { label: 'Max Loan by DSCR', value: fmtCurrency(summary.maxLoanByDSCR) },
    { label: 'Max Price by DSCR', value: fmtCurrency(summary.maxPriceByDSCR) },
    { label: 'Equity Required', value: fmtCurrency(summary.equityRequired) },
    { label: 'Cash-on-Cash Year 1', value: fmtPercent(summary.cashOnCashYear1) },
    { label: 'Stabilized Rent', value: fmtCurrency(valueAdd.stabilizedRent) },
    { label: 'Stabilized NOI', value: fmtCurrency(valueAdd.stabilizedNOI) },
    { label: 'Stabilized Value', value: fmtCurrency(valueAdd.stabilizedValue) },
    { label: 'Max Refinance Loan', value: fmtCurrency(valueAdd.refinanceLoan) },
    { label: 'Cash-Out After Refi', value: fmtCurrency(valueAdd.cashOut) },
  ];

  return (
    <div className="glass-card">
      <div className="section-header">
        <div>
          <h3 className="section-title">Output Summary</h3>
          <p className="section-subtitle">
            Viewing {activeScenarioKey.charAt(0).toUpperCase() + activeScenarioKey.slice(1)} scenario.
          </p>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="alert warning">
          {warnings.map((w, idx) => (
            <div key={idx}>{w}</div>
          ))}
        </div>
      )}

      <div className="stat-grid">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
