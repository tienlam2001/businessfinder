import React from 'react';

const fmtCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const fmtNumber = (value) => (Number.isFinite(value) ? value.toFixed(2) : '0.00');

export default function StabilizedCashflowTable({ stabilizedResult }) {
  const rows = stabilizedResult?.rows || [];
  const titleNote =
    rows.length > 0 ? `Years 1-${rows.length} post-stabilization` : 'Add assumptions to view projection';

  return (
    <div className="glass-card">
      <div className="section-header">
        <div>
          <h3 className="section-title">Stabilized Cashflows</h3>
          <p className="section-subtitle">{titleNote}</p>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="cre-table">
          <thead>
            <tr>
              <th>Year</th>
              <th>Stabilized Rent</th>
              <th>EGI</th>
              <th>OpEx</th>
              <th>NOI</th>
              <th>Debt Service</th>
              <th>Cashflow to Equity</th>
              <th>DSCR</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.year}>
              <td>{row.year}</td>
              <td>{fmtCurrency(row.rent)}</td>
              <td>{fmtCurrency(row.egi)}</td>
              <td>{fmtCurrency(row.opEx ?? row.expenses)}</td>
              <td>{fmtCurrency(row.noi)}</td>
              <td>{fmtCurrency(row.debtService)}</td>
              <td>{fmtCurrency(row.cashflowToEquity)}</td>
              <td>{fmtNumber(row.dscr)}</td>
            </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} style={{ color: 'var(--text-secondary)', padding: '12px' }}>
                  Add value-add assumptions to see stabilized cashflows.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
