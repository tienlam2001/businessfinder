import React from 'react';
import { fmtCurrency, fmtNumber, fmtPercent } from '../../utils/formatters';

const formatCoc = (value) => {
  if (value === undefined || value === null) return 'N/A';
  if (value === Infinity) return '∞';
  return fmtPercent(value);
};

export default function AfterSummaryCard({ result, exitCapRate }) {
  const cashflow = (result?.noi || 0) - (result?.refiADS || 0);
  const dscrLow = result?.refiADS ? result?.refiDSCR < 1.15 : false;
  const dscrDisplay = result?.refiADS ? fmtNumber(result?.refiDSCR, 2) : 'N/A';
  const cashInGreen = result?.cashLeftIn < 0;

  const stats = [
    { label: 'Stabilized Gross Rent', value: fmtCurrency(result?.grossRent) },
    { label: 'Effective Gross Income', value: fmtCurrency(result?.egi) },
    { label: 'Stabilized NOI', value: fmtCurrency(result?.noi) },
    { label: 'Stabilized Value', value: fmtCurrency(result?.stabilizedValue) },
    { label: 'Refi Loan Amount', value: fmtCurrency(result?.refiLoanAmount) },
    { label: 'Total Project Cost', value: fmtCurrency(result?.totalProjectCost) },
    {
      label: 'Cash Left In',
      value: fmtCurrency(result?.cashLeftIn),
      highlight: cashInGreen,
    },
    { label: 'Equity Created', value: fmtCurrency(result?.equityCreated) },
    { label: 'Annual Debt Service', value: fmtCurrency(result?.refiADS) },
    { label: 'Cashflow (NOI - ADS)', value: fmtCurrency(cashflow) },
    { label: 'Cash on Cash', value: formatCoc(result?.cashOnCash) },
  ];

  return (
    <div className="glass-card">
      <div className="section-header">
        <div>
          <h3 className="section-title">Stabilized / Refi Summary</h3>
          <p className="section-subtitle">Value and proceeds based on exit cap and refi terms.</p>
        </div>
      </div>

      <div className="stat-grid">
        {stats.map((stat) => (
          <div
            className="stat-card"
            key={stat.label}
            style={
              stat.highlight
                ? { borderColor: 'rgba(16, 185, 129, 0.4)', color: '#22c55e' }
                : {}
            }
          >
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
        <div className="stat-card" style={dscrLow ? { borderColor: '#f87171' } : {}}>
          <div className="stat-label">Refi DSCR</div>
          <div className="stat-value">{dscrDisplay}</div>
        </div>
      </div>

      {!exitCapRate && (
        <p className="section-subtitle" style={{ marginTop: 12, color: '#f87171' }}>
          Exit cap rate required to value the deal and size refi proceeds.
        </p>
      )}
      {dscrLow && (
        <p className="section-subtitle" style={{ marginTop: 8, color: '#f87171' }}>
          Refi DSCR below 1.15x — lender may reduce proceeds.
        </p>
      )}
      {cashInGreen && (
        <p className="section-subtitle" style={{ marginTop: 8, color: '#22c55e' }}>
          Negative cash left in — infinite return BRRRR scenario.
        </p>
      )}
    </div>
  );
}
