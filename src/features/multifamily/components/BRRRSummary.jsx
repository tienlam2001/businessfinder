import React from 'react';
import { fmtCurrency } from '../../../utils/formatters';

export default function BRRRSummary({
  purchasePrice,
  rehabBudget,
  closingCosts,
  totalCost,
  refinanceLoan,
  cashLeftIn,
  equityCreated,
}) {
  const green = cashLeftIn < 0;

  const rows = [
    { label: 'Purchase', value: purchasePrice },
    { label: 'Rehab', value: rehabBudget },
    { label: 'Closing', value: closingCosts },
    { label: 'Total Cost', value: totalCost },
    { label: 'Refi Proceeds', value: refinanceLoan },
    { label: 'Cash Left In', value: cashLeftIn, highlight: green },
    { label: 'Equity Created', value: equityCreated },
  ];

  return (
    <div className="glass-card">
      <div className="section-header">
        <div>
          <h3 className="section-title">BRRRR Snapshot</h3>
          <p className="section-subtitle">How much cash is trapped after refinance.</p>
        </div>
      </div>
      <div className="stat-grid">
        {rows.map((row) => (
          <div
            className="stat-card"
            key={row.label}
            style={row.highlight ? { borderColor: 'rgba(16, 185, 129, 0.4)' } : {}}
          >
            <div className="stat-label">{row.label}</div>
            <div className="stat-value" style={row.highlight ? { color: '#22c55e' } : {}}>
              {fmtCurrency(row.value)}
            </div>
          </div>
        ))}
      </div>
      {green && (
        <p className="section-subtitle" style={{ marginTop: 12, color: '#22c55e' }}>
          Cash left in is negative — infinite return scenario.
        </p>
      )}
    </div>
  );
}
