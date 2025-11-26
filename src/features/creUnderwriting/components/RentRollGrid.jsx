import React from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';

const newTenant = () => ({
  id: `t-${Date.now()}`,
  name: '',
  sqft: 0,
  baseRentPsfYear: 0,
  leaseTermYears: 5,
  annualEscalationPct: 2,
  startYear: 1,
  leaseType: 'NNN',
});

export default function RentRollGrid({ tenants, onChange }) {
  const handleChange = (id, field, value) => {
    const updated = tenants.map((t) => (t.id === id ? { ...t, [field]: value } : t));
    onChange(updated);
  };

  const addRow = () => {
    onChange([...tenants, newTenant()]);
  };

  const removeRow = (id) => {
    onChange(tenants.filter((t) => t.id !== id));
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h3 className="section-title">Rent Roll</h3>
          <p className="section-subtitle">Tenant schedule with escalations and start years.</p>
        </div>
        <button className="btn-modern" type="button" onClick={addRow}>
          <PlusCircle size={16} /> Add Tenant
        </button>
      </div>
      <div className="table-wrapper">
        <table className="cre-table">
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Sq Ft</th>
              <th>Base Rent PSF/Year</th>
              <th>Lease Term (Years)</th>
              <th>Escalation %</th>
              <th>Start Year</th>
              <th>Lease Type</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id}>
                <td>
                  <input
                    className="table-input"
                    value={tenant.name}
                    onChange={(e) => handleChange(tenant.id, 'name', e.target.value)}
                    placeholder="Tenant name"
                  />
                </td>
                <td>
                  <input
                    className="table-input"
                    type="number"
                    value={tenant.sqft}
                    onChange={(e) => handleChange(tenant.id, 'sqft', e.target.value)}
                    min="0"
                  />
                </td>
                <td>
                  <input
                    className="table-input"
                    type="number"
                    value={tenant.baseRentPsfYear}
                    onChange={(e) => handleChange(tenant.id, 'baseRentPsfYear', e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </td>
                <td>
                  <input
                    className="table-input"
                    type="number"
                    value={tenant.leaseTermYears}
                    onChange={(e) => handleChange(tenant.id, 'leaseTermYears', e.target.value)}
                    min="1"
                    step="1"
                  />
                </td>
                <td>
                  <input
                    className="table-input"
                    type="number"
                    value={tenant.annualEscalationPct}
                    onChange={(e) => handleChange(tenant.id, 'annualEscalationPct', e.target.value)}
                    min="0"
                    step="0.1"
                  />
                </td>
                <td>
                  <input
                    className="table-input"
                    type="number"
                    value={tenant.startYear}
                    onChange={(e) => handleChange(tenant.id, 'startYear', e.target.value)}
                    min="1"
                    step="1"
                  />
                </td>
                <td>
                  <select
                    className="modern-input"
                    value={tenant.leaseType}
                    onChange={(e) => handleChange(tenant.id, 'leaseType', e.target.value)}
                  >
                    <option value="NNN">NNN</option>
                    <option value="Gross">Gross</option>
                    <option value="Modified Gross">Modified Gross</option>
                  </select>
                </td>
                <td>
                  <button
                    className="btn-modern-subtle"
                    type="button"
                    onClick={() => removeRow(tenant.id)}
                    style={{ padding: '8px 12px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
