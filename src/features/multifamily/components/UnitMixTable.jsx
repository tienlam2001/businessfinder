import React from 'react';
import { fmtCurrency } from '../../../utils/formatters';

export default function UnitMixTable({ unitMix, onChange }) {
  const handleChange = (index, field, value) => {
    const next = unitMix.map((unit, idx) =>
      idx === index ? { ...unit, [field]: value } : unit
    );
    onChange(next);
  };

  const handleNumberChange = (index, field) => (e) => {
    const value = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
    handleChange(index, field, value);
  };

  const handleTextChange = (index, field) => (e) => handleChange(index, field, e.target.value);

  const addRow = () =>
    onChange([
      ...unitMix,
      { type: 'Unit', count: 1, currentRent: 0, marketRent: 0 },
    ]);

  const removeRow = (index) => {
    const next = unitMix.filter((_, idx) => idx !== index);
    onChange(next.length ? next : [{ type: 'Unit', count: 1, currentRent: 0, marketRent: 0 }]);
  };

  const totalUnits = unitMix.reduce((sum, u) => sum + Number(u.count || 0), 0);
  const gpr = unitMix.reduce(
    (sum, u) => sum + Number(u.count || 0) * Number(u.currentRent || 0),
    0
  );

  return (
    <div className="glass-card">
      <div className="section-header">
        <div>
          <h3 className="section-title">Unit Mix &amp; Rents</h3>
          <p className="section-subtitle">Auto-updates GPR.</p>
        </div>
        <div className="scenario-tabs">
          <button className="btn-modern-subtle" type="button" onClick={addRow}>
            + Add Unit Type
          </button>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="cre-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Count</th>
              <th>Current Rent ($)</th>
              <th>Market Rent ($)</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {unitMix.map((unit, index) => (
              <tr key={index}>
                <td>
                  <input
                    className="table-input"
                    value={unit.type}
                    onChange={handleTextChange(index, 'type')}
                    placeholder="2 Bed / 1 Bath"
                  />
                </td>
                <td>
                  <input
                    className="table-input"
                    type="number"
                    min="0"
                    value={unit.count}
                    onChange={handleNumberChange(index, 'count')}
                  />
                </td>
                <td>
                  <input
                    className="table-input"
                    type="number"
                    min="0"
                    value={unit.currentRent}
                    onChange={handleNumberChange(index, 'currentRent')}
                  />
                </td>
                <td>
                  <input
                    className="table-input"
                    type="number"
                    min="0"
                    value={unit.marketRent}
                    onChange={handleNumberChange(index, 'marketRent')}
                  />
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className="btn-modern-subtle"
                    type="button"
                    onClick={() => removeRow(index)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div className="stat-card" style={{ minWidth: 180 }}>
          <div className="stat-label">Total Units</div>
          <div className="stat-value">{totalUnits}</div>
        </div>
        <div className="stat-card" style={{ minWidth: 180 }}>
          <div className="stat-label">Gross Potential Rent</div>
          <div className="stat-value">{fmtCurrency(gpr)}</div>
        </div>
      </div>
    </div>
  );
}
