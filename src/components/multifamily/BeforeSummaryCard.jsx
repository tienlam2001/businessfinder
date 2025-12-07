import React from 'react';
import { fmtCurrency, fmtNumber, fmtPercent } from '../../utils/formatters';

const formatCoc = (value) => {
  if (value === undefined || value === null) return 'N/A';
  if (value === Infinity) return '∞';
  return fmtPercent(value);
};

export default function BeforeSummaryCard({ result, asIsCapRate, purchasePrice }) {
  const cashflow = (result?.noi || 0) - (result?.ads || 0);
  const dscrLow = result?.ads ? result?.dscr < 1.15 : false;
  const dscrDisplay = result?.ads ? fmtNumber(result?.dscr, 2) : 'N/A';

  const stats = [
    { label: 'Gross Rent (Annual)', value: fmtCurrency(result?.grossRent) },
    { label: 'Effective Gross Income', value: fmtCurrency(result?.egi) },
    { label: 'NOI', value: fmtCurrency(result?.noi) },
    { label: 'As-Is Value', value: fmtCurrency(result?.asIsValue || purchasePrice) },
    { label: 'As-Is Cap Rate', value: fmtPercent(result?.asIsCap) },
    { label: 'Loan Amount', value: fmtCurrency(result?.loanAmount) },
    { label: 'Annual Debt Service', value: fmtCurrency(result?.ads) },
    { label: 'Cashflow (NOI - ADS)', value: fmtCurrency(cashflow) },
    { label: 'Cash on Cash', value: formatCoc(result?.cashOnCash) },
  ];

  return (
    <div className="glass-card">
      <div className="section-header">
        <div>
          <h3 className="section-title">As-Is Summary</h3>
          <p className="section-subtitle">Based on current rents/expenses and purchase LTV.</p>
        </div>
      </div>
      <div className="stat-grid">
        {stats.map((stat) => (
          <div
            className="stat-card"
            key={stat.label}
            style={
              stat.label === 'Cashflow (NOI - ADS)' && cashflow < 0
                ? { borderColor: '#f87171' }
                : {}
            }
          >
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
        <div className="stat-card" style={dscrLow ? { borderColor: '#f87171' } : {}}>
          <div className="stat-label">DSCR</div>
          <div className="stat-value">{dscrDisplay}</div>
        </div>
      </div>
      {dscrLow && (
        <p className="section-subtitle" style={{ marginTop: 12, color: '#f87171' }}>
          DSCR below 1.15x — lenders may constrain proceeds.
        </p>
      )}
      {!asIsCapRate && (
        <p className="section-subtitle" style={{ marginTop: 8 }}>
          As-is cap rate not provided; value defaults to purchase price.
        </p>
      )}
    </div>
  );
}
