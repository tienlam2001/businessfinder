import React from 'react';

export default function ExpenseForm({ expenses, onChange, totalUnits }) {
  const handleNumberChange = (field) => (e) => {
    const value = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
    onChange({ [field]: value });
  };

  return (
    <div className="glass-card">
      <div className="section-header">
        <div>
          <h3 className="section-title">Operating Expenses</h3>
          <p className="section-subtitle">
            Vacancy defaults to 5%. Management defaults to 8% of EGI if left blank.
          </p>
        </div>
      </div>
      <div className="cre-grid">
        <div className="input-group">
          <label className="input-label">Vacancy (%)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={expenses.vacancyRate}
            onChange={handleNumberChange('vacancyRate')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Taxes ($/yr)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            value={expenses.taxes}
            onChange={handleNumberChange('taxes')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Insurance ($/yr)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            placeholder={totalUnits ? `$${totalUnits * 350} default` : '$350/unit default'}
            value={expenses.insurance}
            onChange={handleNumberChange('insurance')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Repairs &amp; Maint. ($/yr)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            value={expenses.repairs}
            onChange={handleNumberChange('repairs')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">CapEx Reserves ($/yr)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            placeholder={totalUnits ? `$${totalUnits * 250} default` : '$250/unit default'}
            value={expenses.capEx}
            onChange={handleNumberChange('capEx')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Management ($/yr)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            placeholder="Defaults to 8% of EGI"
            value={expenses.management}
            onChange={handleNumberChange('management')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Utilities ($/yr)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            value={expenses.utilities}
            onChange={handleNumberChange('utilities')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Payroll ($/yr)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            value={expenses.payroll}
            onChange={handleNumberChange('payroll')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Other ($/yr)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            value={expenses.other}
            onChange={handleNumberChange('other')}
          />
        </div>
      </div>
    </div>
  );
}
