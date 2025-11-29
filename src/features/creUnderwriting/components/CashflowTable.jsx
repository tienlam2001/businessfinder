import React from 'react';

const fmtCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const fmtNumber = (value) => (Number.isFinite(value) ? value.toFixed(2) : '0.00');

export default function CashflowTable({ scenarioResult }) {
  const rows = scenarioResult?.cashflows || [];

  return (
    <div className="glass-card">
      <div className="section-header">
        <div>
          <h3 className="section-title">Cashflow Table</h3>
          <p className="section-subtitle">Annual performance for the active scenario.</p>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="cre-table">
          <thead>
            <tr>
              <th>Year</th>
              <th>GPR</th>
              <th>EGI</th>
              <th>OpEx</th>
              <th>NOI</th>
              <th>Debt Service</th>
              <th>Cashflow</th>
              <th>DSCR</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.year}>
              <td>{row.year}</td>
              <td>{fmtCurrency(row.gpr)}</td>
              <td>{fmtCurrency(row.egi)}</td>
              <td>{fmtCurrency(row.opEx ?? row.expenses)}</td>
              <td>{fmtCurrency(row.noi)}</td>
              <td>{fmtCurrency(row.debtService)}</td>
              <td>{fmtCurrency(row.cashflowToEquity)}</td>
                <td>{fmtNumber(row.dscr)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
