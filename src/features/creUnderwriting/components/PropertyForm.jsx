import React from 'react';

export default function PropertyForm({ property, onChange }) {
  const handleChange = (field) => (e) => {
    onChange({ [field]: e.target.value });
  };

  return (
    <div className="glass-card">
      <div className="section-header">
        <div>
          <h3 className="section-title">Property</h3>
          <p className="section-subtitle">Core assumptions for the retail asset.</p>
        </div>
      </div>
      <div className="cre-grid">
        <div className="input-group">
          <label className="input-label">Property Name</label>
          <input
            className="modern-input"
            value={property.name}
            onChange={handleChange('name')}
            placeholder="Shops at Main"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Address</label>
          <input
            className="modern-input"
            value={property.address}
            onChange={handleChange('address')}
            placeholder="123 Market St"
          />
        </div>
        <div className="input-group">
          <label className="input-label">GLA (Sq Ft)</label>
          <input
            className="modern-input"
            type="number"
            value={property.glaSqft}
            onChange={handleChange('glaSqft')}
            min="0"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Purchase Price ($)</label>
          <input
            className="modern-input"
            type="number"
            value={property.purchasePrice}
            onChange={handleChange('purchasePrice')}
            min="0"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Vacancy &amp; Credit Loss (%)</label>
          <input
            className="modern-input"
            type="number"
            value={property.vacancyRatePct}
            onChange={handleChange('vacancyRatePct')}
            min="0"
            step="0.1"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Hold Period (Years)</label>
          <input
            className="modern-input"
            type="number"
            value={property.holdPeriodYears}
            onChange={handleChange('holdPeriodYears')}
            min="1"
            step="1"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Discount Rate (%)</label>
          <input
            className="modern-input"
            type="number"
            value={property.discountRatePct || 0}
            onChange={handleChange('discountRatePct')}
            min="0"
            step="0.1"
          />
        </div>
      </div>
    </div>
  );
}
