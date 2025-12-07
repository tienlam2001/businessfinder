import React from 'react';

export default function DealGradeBox({ dscr, cashLeftIn, totalCost }) {
  const cashRatio = totalCost ? cashLeftIn / totalCost : 0;
  let grade = 'C';
  let note = 'Review underwriting assumptions; DSCR or cash recovery is weak.';

  if (dscr >= 1.25 && cashLeftIn <= 0) {
    grade = 'A';
    note = 'Strong cash-out with healthy DSCR — financeable and BRRRR-friendly.';
  } else if (dscr >= 1.15 && cashRatio <= 0.1) {
    grade = 'B';
    note = 'Meets lender DSCR but leaves limited cash in — workable with reserves.';
  } else if (dscr >= 1.1) {
    grade = 'B-';
    note = 'Borderline DSCR; consider more equity or higher income assumptions.';
  }

  return (
    <div className="glass-card">
      <div className="section-header">
        <div>
          <h3 className="section-title">Deal Grade</h3>
          <p className="section-subtitle">Quick heuristic based on DSCR + cash left in.</p>
        </div>
      </div>
      <div className="stat-grid">
        <div className="stat-card" style={{ textAlign: 'center' }}>
          <div className="stat-label">Grade</div>
          <div className="stat-value" style={{ fontSize: '2rem' }}>
            {grade}
          </div>
        </div>
      </div>
      <p className="section-subtitle" style={{ marginTop: 12 }}>{note}</p>
    </div>
  );
}
