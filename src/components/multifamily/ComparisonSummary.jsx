import React from 'react';
import { fmtCurrency, fmtNumber } from '../../utils/formatters';

export default function ComparisonSummary({ before, after }) {
  const beforeCashflow = (before?.noi || 0) - (before?.ads || 0);
  const afterCashflow = (after?.noi || 0) - (after?.refiADS || 0);
  const beforeDscrDisplay = before?.ads ? fmtNumber(before?.dscr, 2) : 'N/A';
  const afterDscrDisplay = after?.refiADS ? fmtNumber(after?.refiDSCR, 2) : 'N/A';

  const rows = [
    { label: 'Value', before: fmtCurrency(before?.asIsValue), after: fmtCurrency(after?.stabilizedValue) },
    { label: 'NOI', before: fmtCurrency(before?.noi), after: fmtCurrency(after?.noi) },
    { label: 'DSCR', before: beforeDscrDisplay, after: afterDscrDisplay },
    { label: 'Cashflow', before: fmtCurrency(beforeCashflow), after: fmtCurrency(afterCashflow) },
    { label: 'Cash Left In', before: fmtCurrency(0), after: fmtCurrency(after?.cashLeftIn) },
    { label: 'Equity Created', before: fmtCurrency(0), after: fmtCurrency(after?.equityCreated) },
  ];

  return (
    <div className="glass-card">
      <div className="section-header">
        <div>
          <h3 className="section-title">Before vs After</h3>
          <p className="section-subtitle">Quick comparison of value, cashflow, and DSCR.</p>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="cre-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>As-Is</th>
              <th>Stabilized</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td>{row.before}</td>
                <td>{row.after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
