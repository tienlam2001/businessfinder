import React from 'react';

const parseNumber = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, n);
};

export default function BeforeValueAddForm({ before, onChange }) {
  const handleField = (field) => (e) => onChange({ [field]: parseNumber(e.target.value) });

  const handleExpense = (field) => (e) =>
    onChange({
      expenses: {
        ...before.expenses,
        [field]: parseNumber(e.target.value),
      },
    });

  const handleLoan = (field) => (e) =>
    onChange({
      loan: {
        ...before.loan,
        [field]: parseNumber(e.target.value),
      },
    });

  const handleUnitChange = (index, field, value) => {
    const next = before.unitMix.map((unit, idx) => (idx === index ? { ...unit, [field]: value } : unit));
    onChange({ unitMix: next });
  };

  const addUnitRow = () =>
    onChange({
      unitMix: [...before.unitMix, { type: 'Unit', count: 1, rent: 0 }],
    });

  const removeUnitRow = (index) => {
    const next = before.unitMix.filter((_, idx) => idx !== index);
    onChange({ unitMix: next.length ? next : [{ type: 'Unit', count: 1, rent: 0 }] });
  };

  return (
    <div className="glass-card">
      <div className="section-header">
        <div>
          <h3 className="section-title">Before Value-Add</h3>
          <p className="section-subtitle">As-is basis, rent roll, expenses, and current debt.</p>
        </div>
        <button className="btn-modern-subtle" type="button" onClick={addUnitRow}>
          + Add Unit Type
        </button>
      </div>

      <div className="cre-grid">
        <div className="input-group">
          <label className="input-label">Purchase Price ($)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            value={before.purchasePrice}
            onChange={handleField('purchasePrice')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Closing Costs ($)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            value={before.closingCosts}
            onChange={handleField('closingCosts')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">As-Is Cap Rate (decimal)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            step="0.001"
            placeholder="0.065"
            value={before.asIsCapRate || ''}
            onChange={(e) => onChange({ asIsCapRate: parseNumber(e.target.value) })}
          />
        </div>
      </div>

      <div className="table-wrapper" style={{ marginTop: 16 }}>
        <table className="cre-table">
          <thead>
            <tr>
              <th>Unit Type</th>
              <th>Count</th>
              <th>Rent ($/mo)</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {before.unitMix.map((unit, index) => (
              <tr key={index}>
                <td>
                  <input
                    className="table-input"
                    value={unit.type}
                    onChange={(e) => handleUnitChange(index, 'type', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="table-input"
                    type="number"
                    min="0"
                    value={unit.count}
                    onChange={(e) => handleUnitChange(index, 'count', parseNumber(e.target.value))}
                  />
                </td>
                <td>
                  <input
                    className="table-input"
                    type="number"
                    min="0"
                    value={unit.rent}
                    onChange={(e) => handleUnitChange(index, 'rent', parseNumber(e.target.value))}
                  />
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn-modern-subtle" type="button" onClick={() => removeUnitRow(index)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cre-grid" style={{ marginTop: 16 }}>
        <div className="input-group">
          <label className="input-label">Vacancy Rate (decimal)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={before.expenses.vacancyRate}
            onChange={handleExpense('vacancyRate')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Taxes ($/yr)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            value={before.expenses.taxes}
            onChange={handleExpense('taxes')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Insurance ($/yr)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            value={before.expenses.insurance}
            onChange={handleExpense('insurance')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Repairs ($/yr)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            value={before.expenses.repairs}
            onChange={handleExpense('repairs')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">CapEx Reserves ($/yr)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            value={before.expenses.capEx}
            onChange={handleExpense('capEx')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Management ($/yr)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            placeholder="Leave 0 to assume 8% of EGI"
            value={before.expenses.management}
            onChange={handleExpense('management')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Utilities ($/yr)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            value={before.expenses.utilities}
            onChange={handleExpense('utilities')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Payroll ($/yr)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            value={before.expenses.payroll}
            onChange={handleExpense('payroll')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Other ($/yr)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            value={before.expenses.other}
            onChange={handleExpense('other')}
          />
        </div>
      </div>

      <div className="cre-grid" style={{ marginTop: 16 }}>
        <div className="input-group">
          <label className="input-label">LTV (decimal)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={before.loan.ltv}
            onChange={handleLoan('ltv')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Interest Rate (decimal)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            step="0.001"
            value={before.loan.interestRate}
            onChange={handleLoan('interestRate')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Amortization (years)</label>
          <input
            className="modern-input"
            type="number"
            min="1"
            step="1"
            value={before.loan.amortYears}
            onChange={handleLoan('amortYears')}
          />
        </div>
      </div>
    </div>
  );
}
