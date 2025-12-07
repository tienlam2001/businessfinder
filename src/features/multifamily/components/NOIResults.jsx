import React from 'react';
import { fmtCurrency, fmtPercent } from '../../../utils/formatters';

export default function NOIResults({ grossPotentialRent, effectiveGrossIncome, vacancyRate, expenses, noi }) {
  const expenseLines = [
    { label: 'Taxes', value: expenses?.taxes },
    { label: 'Insurance', value: expenses?.insurance },
    { label: 'Repairs & Maint.', value: expenses?.repairs },
    { label: 'CapEx Reserves', value: expenses?.capEx },
    { label: 'Management', value: expenses?.management },
    { label: 'Utilities', value: expenses?.utilities },
    { label: 'Payroll', value: expenses?.payroll },
    { label: 'Other', value: expenses?.other },
  ];

  return (
    <div className="glass-card">
      <div className="section-header">
        <div>
          <h3 className="section-title">NOI Engine</h3>
          <p className="section-subtitle">Auto-applies vacancy &amp; management defaults.</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Gross Potential Rent</div>
          <div className="stat-value">{fmtCurrency(grossPotentialRent)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Vacancy</div>
          <div className="stat-value">{fmtPercent(vacancyRate)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Effective Gross Income</div>
          <div className="stat-value">{fmtCurrency(effectiveGrossIncome)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total OpEx</div>
          <div className="stat-value">{fmtCurrency(expenses?.totalExpenses)}</div>
        </div>
        <div className="stat-card" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}>
          <div className="stat-label">NOI</div>
          <div className="stat-value">{fmtCurrency(noi)}</div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div className="stat-section-header">Expense Breakdown</div>
        <div className="stat-grid">
          {expenseLines.map((line) => (
            <div className="stat-card" key={line.label}>
              <div className="stat-label">{line.label}</div>
              <div className="stat-value">{fmtCurrency(line.value)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
