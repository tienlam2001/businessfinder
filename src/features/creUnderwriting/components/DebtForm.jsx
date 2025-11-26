import React from 'react';

export default function DebtForm({ debt, onChange }) {
  const handleChange = (field) => (e) => {
    onChange({ [field]: e.target.value });
  };

  return (
    <div className="glass-card">
      <div className="section-header">
        <div>
          <h3 className="section-title">Debt Assumptions</h3>
          <p className="section-subtitle">Structure used for DSCR/LTV sizing.</p>
        </div>
      </div>
      <div className="cre-grid">
        <div className="input-group">
          <label className="input-label">Interest Rate (%)</label>
          <input
            className="modern-input"
            type="number"
            value={debt.interestRatePct}
            onChange={handleChange('interestRatePct')}
            min="0"
            step="0.01"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Amortization (Years)</label>
          <input
            className="modern-input"
            type="number"
            value={debt.amortYears}
            onChange={handleChange('amortYears')}
            min="1"
            step="1"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Interest-Only Period (Years)</label>
          <input
            className="modern-input"
            type="number"
            value={debt.ioYears}
            onChange={handleChange('ioYears')}
            min="0"
            step="1"
          />
        </div>
        <div className="input-group">
          <label className="input-label">LTV (%)</label>
          <input
            className="modern-input"
            type="number"
            value={debt.ltvPct}
            onChange={handleChange('ltvPct')}
            min="0"
            step="0.1"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Min DSCR</label>
          <input
            className="modern-input"
            type="number"
            value={debt.dscrMin}
            onChange={handleChange('dscrMin')}
            min="0"
            step="0.01"
          />
        </div>
      </div>
    </div>
  );
}
