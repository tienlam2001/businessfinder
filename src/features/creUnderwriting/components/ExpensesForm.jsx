import React from 'react';

export default function ExpensesForm({ expenses, onChange }) {
  const handleChange = (field) => (e) => {
    onChange({ [field]: e.target.value });
  };

  return (
    <div className="glass-card">
      <div className="section-header">
        <div>
          <h3 className="section-title">Operating Expenses</h3>
          <p className="section-subtitle">Flat OpEx with management tied to EGI.</p>
        </div>
      </div>
      <div className="cre-grid">
        <div className="input-group">
          <label className="input-label">Taxes (Annual)</label>
          <input
            className="modern-input"
            type="number"
            value={expenses.taxes}
            onChange={handleChange('taxes')}
            min="0"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Insurance (Annual)</label>
          <input
            className="modern-input"
            type="number"
            value={expenses.insurance}
            onChange={handleChange('insurance')}
            min="0"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Repairs &amp; Maintenance</label>
          <input
            className="modern-input"
            type="number"
            value={expenses.repairsMaintenance}
            onChange={handleChange('repairsMaintenance')}
            min="0"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Utilities</label>
          <input
            className="modern-input"
            type="number"
            value={expenses.utilities}
            onChange={handleChange('utilities')}
            min="0"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Management (% of EGI)</label>
          <input
            className="modern-input"
            type="number"
            value={expenses.managementPctOfEGI}
            onChange={handleChange('managementPctOfEGI')}
            min="0"
            step="0.1"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Other Expenses</label>
          <input
            className="modern-input"
            type="number"
            value={expenses.otherExpenses}
            onChange={handleChange('otherExpenses')}
            min="0"
          />
        </div>
      </div>
    </div>
  );
}
