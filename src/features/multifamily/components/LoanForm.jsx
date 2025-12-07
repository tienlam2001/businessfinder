import React from 'react';

export default function LoanForm({ loan, onChange }) {
  const handleNumberChange = (field) => (e) => {
    const value = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
    onChange({ [field]: value });
  };

  return (
    <div className="glass-card">
      <div className="section-header">
        <div>
          <h3 className="section-title">Acquisition Loan</h3>
          <p className="section-subtitle">Used for DSCR and equity required.</p>
        </div>
      </div>
      <div className="cre-grid">
        <div className="input-group">
          <label className="input-label">LTV (%)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={loan.ltv}
            onChange={handleNumberChange('ltv')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Interest Rate (%)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            step="0.01"
            value={loan.interestRate}
            onChange={handleNumberChange('interestRate')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Amortization (years)</label>
          <input
            className="modern-input"
            type="number"
            min="1"
            step="1"
            value={loan.amortYears}
            onChange={handleNumberChange('amortYears')}
          />
        </div>
      </div>
    </div>
  );
}
