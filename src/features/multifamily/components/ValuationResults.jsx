import React from 'react';
import { fmtCurrency, fmtPercent } from '../../../utils/formatters';

export default function ValuationResults({ valuation, acquisitionLoan, refinanceLoan }) {
  const ltv = valuation?.value ? acquisitionLoan / valuation.value : 0;
  const refiLtv = valuation?.value ? refinanceLoan / valuation.value : 0;

  const stats = [
    { label: 'Stabilized Value', value: fmtCurrency(valuation?.value) },
    { label: 'Cap Rate', value: fmtPercent(valuation?.capRate) },
    { label: 'Acquisition Loan', value: fmtCurrency(acquisitionLoan) },
    { label: 'LTV at Purchase', value: fmtPercent(ltv) },
    { label: 'Refi Loan', value: fmtCurrency(refinanceLoan) },
    { label: 'Refi LTV', value: fmtPercent(refiLtv) },
  ];

  return (
    <div className="glass-card">
      <div className="section-header">
        <div>
          <h3 className="section-title">Valuation &amp; Proceeds</h3>
          <p className="section-subtitle">Income approach valuation drives refi proceeds.</p>
        </div>
      </div>
      <div className="stat-grid">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>
      <p className="section-subtitle" style={{ marginTop: 12 }}>
        Assumes straight cap valuation. If NOI is negative, value will reflect that risk.
      </p>
    </div>
  );
}
