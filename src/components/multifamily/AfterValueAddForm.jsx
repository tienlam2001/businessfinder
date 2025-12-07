import React from 'react';

const parseNumber = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, n);
};

export default function AfterValueAddForm({ after, onChange }) {
  const handleField = (field) => (e) => onChange({ [field]: parseNumber(e.target.value) });

  const handleExpense = (field) => (e) =>
    onChange({
      postRehabExpenses: {
        ...after.postRehabExpenses,
        [field]: parseNumber(e.target.value),
      },
    });

  const handleLoan = (field) => (e) =>
    onChange({
      refiLoan: {
        ...after.refiLoan,
        [field]: parseNumber(e.target.value),
      },
    });

  const handleUnitChange = (index, field, value) => {
    const next = after.postRehabUnitMix.map((unit, idx) =>
      idx === index ? { ...unit, [field]: value } : unit
    );
    onChange({ postRehabUnitMix: next });
  };

  const addUnitRow = () =>
    onChange({
      postRehabUnitMix: [...after.postRehabUnitMix, { type: 'Unit', count: 1, rent: 0 }],
    });

  const removeUnitRow = (index) => {
    const next = after.postRehabUnitMix.filter((_, idx) => idx !== index);
    onChange({ postRehabUnitMix: next.length ? next : [{ type: 'Unit', count: 1, rent: 0 }] });
  };

  return (
    <div className="glass-card">
      <div className="section-header">
        <div>
          <h3 className="section-title">After Value-Add</h3>
          <p className="section-subtitle">Stabilized rents, expenses, exit cap, and refi terms.</p>
        </div>
        <button className="btn-modern-subtle" type="button" onClick={addUnitRow}>
          + Add Unit Type
        </button>
      </div>

      <div className="cre-grid">
        <div className="input-group">
          <label className="input-label">Rehab Budget ($)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            value={after.rehabBudget}
            onChange={handleField('rehabBudget')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Exit Cap Rate (decimal)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            step="0.001"
            value={after.exitCapRate}
            onChange={handleField('exitCapRate')}
          />
        </div>
      </div>

      <div className="table-wrapper" style={{ marginTop: 16 }}>
        <table className="cre-table">
          <thead>
            <tr>
              <th>Unit Type</th>
              <th>Count</th>
              <th>Stabilized Rent ($/mo)</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {after.postRehabUnitMix.map((unit, index) => (
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
            value={after.postRehabExpenses.vacancyRate}
            onChange={handleExpense('vacancyRate')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Taxes ($/yr)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            value={after.postRehabExpenses.taxes}
            onChange={handleExpense('taxes')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Insurance ($/yr)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            value={after.postRehabExpenses.insurance}
            onChange={handleExpense('insurance')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Repairs ($/yr)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            value={after.postRehabExpenses.repairs}
            onChange={handleExpense('repairs')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">CapEx Reserves ($/yr)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            value={after.postRehabExpenses.capEx}
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
            value={after.postRehabExpenses.management}
            onChange={handleExpense('management')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Utilities ($/yr)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            value={after.postRehabExpenses.utilities}
            onChange={handleExpense('utilities')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Payroll ($/yr)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            value={after.postRehabExpenses.payroll}
            onChange={handleExpense('payroll')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Other ($/yr)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            value={after.postRehabExpenses.other}
            onChange={handleExpense('other')}
          />
        </div>
      </div>

      <div className="cre-grid" style={{ marginTop: 16 }}>
        <div className="input-group">
          <label className="input-label">Refi LTV (decimal)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={after.refiLoan.ltv}
            onChange={handleLoan('ltv')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Refi Interest Rate (decimal)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            step="0.001"
            value={after.refiLoan.interestRate}
            onChange={handleLoan('interestRate')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Refi Amortization (years)</label>
          <input
            className="modern-input"
            type="number"
            min="1"
            step="1"
            value={after.refiLoan.amortYears}
            onChange={handleLoan('amortYears')}
          />
        </div>
      </div>
    </div>
  );
}
