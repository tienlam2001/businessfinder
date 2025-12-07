import React from 'react';

export default function RefinanceForm({ refinance, onChange }) {
  const handleNumberChange = (field) => (e) => {
    const value = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
    onChange({ [field]: value });
  };

  return (
    <div className="glass-card">
      <div className="section-header">
        <div>
          <h3 className="section-title">Refinance &amp; Valuation</h3>
          <p className="section-subtitle">Cap rate drives value. Refi LTV limits proceeds.</p>
        </div>
      </div>
      <div className="cre-grid">
        <div className="input-group">
          <label className="input-label">Cap Rate (%)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            step="0.01"
            value={refinance.capRate}
            onChange={handleNumberChange('capRate')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Refi LTV (%)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={refinance.refiLTV}
            onChange={handleNumberChange('refiLTV')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Refi Interest Rate (%)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            step="0.01"
            value={refinance.refiInterestRate}
            onChange={handleNumberChange('refiInterestRate')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Refi Amortization (years)</label>
          <input
            className="modern-input"
            type="number"
            min="1"
            step="1"
            value={refinance.amortYears}
            onChange={handleNumberChange('amortYears')}
          />
        </div>
      </div>
    </div>
  );
}
