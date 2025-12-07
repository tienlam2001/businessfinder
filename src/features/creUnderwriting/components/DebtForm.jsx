import React from 'react';
import InputField from './InputField';
import SelectField from './SelectField';

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
        <InputField
          label="Interest Rate (%)"
          type="number"
          value={debt.interestRatePct}
          onChange={handleChange('interestRatePct')}
          min="0"
          step="0.01"
        />
        <InputField
          label="Amortization (Years)"
          type="number"
          value={debt.amortYears}
          onChange={handleChange('amortYears')}
          min="1"
          step="1"
        />
        <InputField
          label="Interest-Only Period (Years)"
          type="number"
          value={debt.ioYears}
          onChange={handleChange('ioYears')}
          min="0"
          step="1"
        />
        <SelectField
          label="Loan Sizing Basis"
          value={debt.loanSizingMethod || 'lesser'}
          onChange={handleChange('loanSizingMethod')}
        >
          <option value="lesser">Lesser of DSCR & LTV</option>
          <option value="dscr">DSCR Only</option>
          <option value="ltv">LTV Only</option>
        </SelectField>
        <InputField
          label="LTV (%)"
          type="number"
          value={debt.ltvPct}
          onChange={handleChange('ltvPct')}
          min="0"
          step="0.1"
        />
        <InputField
          label="What-If: Extra Down (%)"
          type="number"
          value={debt.whatIfExtraDownPct ?? 0}
          onChange={handleChange('whatIfExtraDownPct')}
          min="0"
          step="0.5"
        />
        <InputField
          label="Min DSCR"
          type="number"
          value={debt.dscrMin}
          onChange={handleChange('dscrMin')}
          min="0"
          step="0.01"
        />
      </div>
    </div>
  );
}
