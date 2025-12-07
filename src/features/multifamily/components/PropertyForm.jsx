import React from 'react';

export default function PropertyForm({ deal, onChange }) {
  const handleTextChange = (field) => (e) => onChange({ [field]: e.target.value });
  const handleNumberChange = (field) => (e) => {
    const value = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
    onChange({ [field]: value });
  };

  return (
    <div className="glass-card">
      <div className="section-header">
        <div>
          <h3 className="section-title">Property &amp; Basis</h3>
          <p className="section-subtitle">Core acquisition inputs.</p>
        </div>
      </div>
      <div className="cre-grid">
        <div className="input-group">
          <label className="input-label">Deal Name</label>
          <input
            className="modern-input"
            value={deal.name}
            onChange={handleTextChange('name')}
            placeholder="123 Main St Apartments"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Address</label>
          <input
            className="modern-input"
            value={deal.address}
            onChange={handleTextChange('address')}
            placeholder="123 Main St, City, ST"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Market</label>
          <input
            className="modern-input"
            value={deal.market}
            onChange={handleTextChange('market')}
            placeholder="City / Submarket"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Year Built</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            value={deal.yearBuilt}
            onChange={handleNumberChange('yearBuilt')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Purchase Price ($)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            value={deal.purchasePrice}
            onChange={handleNumberChange('purchasePrice')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Rehab Budget ($)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            value={deal.rehabBudget}
            onChange={handleNumberChange('rehabBudget')}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Closing Costs ($)</label>
          <input
            className="modern-input"
            type="number"
            min="0"
            value={deal.closingCosts}
            onChange={handleNumberChange('closingCosts')}
          />
        </div>
      </div>
    </div>
  );
}
