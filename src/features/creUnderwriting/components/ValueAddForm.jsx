import React from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';

const newRentRow = () => ({
  id: `va-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  name: '',
  sqft: 0,
  projectedRentPsf: 0,
  escalationPct: 0,
});

export default function ValueAddForm({ valueAdd, onChange }) {
  const va = valueAdd || {};

  const handleChange = (field) => (e) => {
    onChange({ [field]: e.target.value });
  };

  const handleRentChange = (id, field, value) => {
    const updated = (va.newRents || []).map((r) => (r.id === id ? { ...r, [field]: value } : r));
    onChange({ newRents: updated });
  };

  const addRentRow = () => {
    onChange({ newRents: [...(va.newRents || []), newRentRow()] });
  };

  const removeRentRow = (id) => {
    onChange({ newRents: (va.newRents || []).filter((r) => r.id !== id) });
  };

  return (
    <div className="glass-card">
      <div className="section-header">
        <div>
          <h3 className="section-title">Value-Add Plan</h3>
          <p className="section-subtitle">Rehab, stabilization, and refinance assumptions.</p>
        </div>
      </div>

      <div className="cre-grid two-col">
        <div className="input-group">
          <label className="input-label">Rehab Budget ($)</label>
          <input
            className="modern-input"
            type="number"
            value={va.rehabBudget}
            onChange={handleChange('rehabBudget')}
            min="0"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Rehab Months</label>
          <input
            className="modern-input"
            type="number"
            value={va.rehabMonths}
            onChange={handleChange('rehabMonths')}
            min="1"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Exit Cap Rate (%)</label>
          <input
            className="modern-input"
            type="number"
            value={va.exitCapRate}
            onChange={handleChange('exitCapRate')}
            step="0.01"
            min="0"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Refinance Month</label>
          <input
            className="modern-input"
            type="number"
            value={va.refinanceMonth}
            onChange={handleChange('refinanceMonth')}
            min="1"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Refi Costs (% of Loan)</label>
          <input
            className="modern-input"
            type="number"
            value={va.refinanceCostsPct}
            onChange={handleChange('refinanceCostsPct')}
            min="0"
            step="0.1"
          />
        </div>
      </div>

      <div className="section-header" style={{ marginTop: 20 }}>
        <div>
          <h4 className="section-title" style={{ margin: 0 }}>Projected Rents</h4>
          <p className="section-subtitle">Post-stabilization rent roll.</p>
        </div>
        <button className="btn-modern" type="button" onClick={addRentRow}>
          <PlusCircle size={16} /> Add Projected Rent
        </button>
      </div>
      <div className="table-wrapper">
        <table className="cre-table">
          <thead>
            <tr>
              <th>Line</th>
              <th>Sq Ft</th>
              <th>Rent PSF</th>
              <th>Esc %</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(va.newRents || []).map((row) => (
              <tr key={row.id}>
                <td>
                  <input
                    className="table-input"
                    value={row.name}
                    onChange={(e) => handleRentChange(row.id, 'name', e.target.value)}
                    placeholder="New tenant / use"
                  />
                </td>
                <td>
                  <input
                    className="table-input"
                    type="number"
                    value={row.sqft}
                    onChange={(e) => handleRentChange(row.id, 'sqft', e.target.value)}
                    min="0"
                  />
                </td>
                <td>
                  <input
                    className="table-input"
                    type="number"
                    value={row.projectedRentPsf}
                    onChange={(e) => handleRentChange(row.id, 'projectedRentPsf', e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </td>
                <td>
                  <input
                    className="table-input"
                    type="number"
                    value={row.escalationPct}
                    onChange={(e) => handleRentChange(row.id, 'escalationPct', e.target.value)}
                    min="0"
                    step="0.1"
                  />
                </td>
                <td>
                  <button
                    className="btn-modern-subtle"
                    type="button"
                    onClick={() => removeRentRow(row.id)}
                    style={{ padding: '8px 12px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {(va.newRents || []).length === 0 && (
              <tr>
                <td colSpan={5} style={{ color: 'var(--text-secondary)', padding: '12px' }}>
                  No projected rents added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
