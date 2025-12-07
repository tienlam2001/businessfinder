import React from 'react';
import { fmtCurrency, fmtNumber } from '../../../utils/formatters';

export default function DSCRCard({ dscr, annualDebtService, loanAmount }) {
  const belowThreshold = Number(dscr) > 0 && Number(dscr) < 1.15;

  return (
    <div className="glass-card">
      <div className="section-header">
        <div>
          <h3 className="section-title">DSCR Test</h3>
          <p className="section-subtitle">Assumes acquisition debt service.</p>
        </div>
      </div>
      <div className="stat-grid">
        <div className="stat-card" style={belowThreshold ? { borderColor: '#f87171' } : {}}>
          <div className="stat-label">DSCR</div>
          <div className="stat-value">{fmtNumber(dscr, 2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Annual Debt Service</div>
          <div className="stat-value">{fmtCurrency(annualDebtService)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Loan Amount</div>
          <div className="stat-value">{fmtCurrency(loanAmount)}</div>
        </div>
      </div>
      {belowThreshold && (
        <div className="alert warning" style={{ marginTop: 12 }}>
          DSCR below 1.15x — increase NOI or add equity.
        </div>
      )}
    </div>
  );
}
