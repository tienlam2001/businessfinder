import React, { useMemo, useState } from 'react';
import { SectionCard } from '../components/Controls';
import { calculateBrrrrOutputs, mortgagePayment, remainingBalance } from '../calculations';
import { useBrrrr } from '../state';

const ResultsTab = () => {
  const { state } = useBrrrr();
  const outputs = useMemo(() => calculateBrrrrOutputs(state), [state]);
  const [rentGrowthPercent, setRentGrowthPercent] = useState<string>('3');
  const [appreciationPercent, setAppreciationPercent] = useState<string>('3');
  const [hover, setHover] = useState<{
    year: number;
    rent: number;
    equity: number;
    balance: number;
    cashflow: number;
    x: number;
    yRent: number;
    yEquity: number;
    yBalance: number;
    yCashflow: number;
  } | null>(null);

  const riskFlags: string[] = [];
  if (outputs.dscr < 1.1) riskFlags.push('DSCR below 1.10 target');
  if (outputs.allInCost > 0.85 * state.refiFinancing.arv) riskFlags.push('All-in cost above 85% of ARV');
  if (outputs.cashLeftInDeal > 0) riskFlags.push(`Cash left in deal: $${Math.round(outputs.cashLeftInDeal).toLocaleString()}`);

  const card = (label: string, value: string, accent = '') => (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm ${accent}`}>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-2xl font-semibold text-white mt-1">{value}</p>
    </div>
  );

  const fmtMoney = (n: number) => `$${Math.round(n).toLocaleString()}`;
  const lineDelay = (delay: string) => ({ ['--delay' as any]: delay });

  const projection = useMemo(() => {
    const years = 30;
    const rentGrowth = parseFloat(rentGrowthPercent);
    const valueGrowth = parseFloat(appreciationPercent);
    const rentGrowthRate = Number.isFinite(rentGrowth) ? rentGrowth / 100 : 0;
    const valueGrowthRate = Number.isFinite(valueGrowth) ? valueGrowth / 100 : 0;
    const rentStart = state.rentalOps.marketRent || 0;
    const valueStart = state.refiFinancing.arv || 0;
    const principal = outputs.refiLoanAmount || 0;
    const rate = state.refiFinancing.interestRate || 0;
    const term = state.refiFinancing.termYears || 0;

    const points: { year: number; rent: number; equity: number; balance: number; cashflow: number }[] = [];
    const noiYear0 =
      rentStart * (1 - (state.rentalOps.vacancyRate || 0) / 100) * 12 -
      (state.rentalOps.taxesAnnual || 0) -
      (state.rentalOps.insuranceAnnual || 0) -
      (state.rentalOps.hoaMonthly || 0) * 12 -
      (state.rentalOps.utilitiesMonthlyOwnerPaid || 0) * 12 -
      rentStart *
        12 *
        ((state.rentalOps.maintenancePercent || 0) / 100 +
          (state.rentalOps.capexPercent || 0) / 100 +
          (state.rentalOps.managementPercent || 0) / 100);
    const annualDebt = mortgagePayment(principal, rate, term) * 12;

    for (let year = 0; year <= years; year += 1) {
      const rent = rentStart * Math.pow(1 + rentGrowthRate, year);
      const value = valueStart * Math.pow(1 + valueGrowthRate, year);
      const balance = remainingBalance(principal, rate, term, year * 12);
      const equity = Math.max(0, value - balance);
      const noiScaled = noiYear0 * Math.pow(1 + rentGrowthRate, year);
      const cashflow = (noiScaled - annualDebt) / 12;
      points.push({ year, rent, equity, balance, cashflow });
    }

    const rentBase = rentStart || 1;
    const equityBase = Math.max(1, valueStart - principal);
    const balanceBase = Math.max(1, principal);
    const maxNorm =
      points.reduce(
        (m, p) => Math.max(m, p.rent / rentBase, p.equity / equityBase, p.balance / balanceBase),
        0,
      ) || 1;

    const cashflowMax = points.reduce((m, p) => Math.max(m, p.cashflow), Number.NEGATIVE_INFINITY);
    const cashflowMin = points.reduce((m, p) => Math.min(m, p.cashflow), Number.POSITIVE_INFINITY);
    const cashflowRange =
      cashflowMax === cashflowMin ? Math.max(1, Math.abs(cashflowMax) || 1) : cashflowMax - cashflowMin;

    return {
      points,
      rentBase,
      equityBase,
      balanceBase,
      maxNorm,
      rentEnd: points[points.length - 1]?.rent || 0,
      equityEnd: points[points.length - 1]?.equity || 0,
      balanceEnd: points[points.length - 1]?.balance || 0,
      cashflowEnd: points[points.length - 1]?.cashflow || 0,
      cashflowMax,
      cashflowMin,
      cashflowRange,
    };
  }, [
    appreciationPercent,
    outputs.refiLoanAmount,
    rentGrowthPercent,
    state.refiFinancing.arv,
    state.refiFinancing.interestRate,
    state.refiFinancing.termYears,
    state.rentalOps.capexPercent,
    state.rentalOps.hoaMonthly,
    state.rentalOps.insuranceAnnual,
    state.rentalOps.managementPercent,
    state.rentalOps.maintenancePercent,
    state.rentalOps.marketRent,
    state.rentalOps.taxesAnnual,
    state.rentalOps.utilitiesMonthlyOwnerPaid,
    state.rentalOps.vacancyRate,
  ]);

  const chart = { w: 880, h: 380, pad: 60, translateX: 48, translateY: 24, vbWidth: 980, vbHeight: 460 };

  const toPath = (key: 'rent' | 'equity' | 'balance' | 'cashflow') => {
    const { w, h, pad } = chart;
    return projection.points
      .map((p, idx) => {
        const x = pad + (p.year / 30) * (w - pad * 2);
        const y =
          h -
          pad -
          (key === 'cashflow'
            ? ((p.cashflow - projection.cashflowMin) / projection.cashflowRange) * (h - pad * 2)
            : ((projection.maxNorm > 0
                ? (key === 'rent'
                    ? p.rent / projection.rentBase
                    : key === 'equity'
                      ? p.equity / projection.equityBase
                      : key === 'balance'
                        ? p.balance / projection.balanceBase
                        : 0) / projection.maxNorm
                : 0) *
              (h - pad * 2)));
        return `${idx === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  };

  const handleHover = (evt: React.MouseEvent<SVGSVGElement>) => {
    const { w, h, pad, translateX } = chart;
    const rect = (evt.currentTarget as SVGSVGElement).getBoundingClientRect();
    const relX = ((evt.clientX - rect.left) / rect.width) * chart.vbWidth;
    const clampedX = Math.min(Math.max(relX - translateX, pad), chart.vbWidth - pad);
    const ratio = (clampedX - pad) / (w - pad * 2);
    const yearFloat = Math.max(0, Math.min(30, ratio * 30));
    const nearest = projection.points.reduce((best, p) => {
      const dist = Math.abs(p.year - yearFloat);
      if (!best || dist < best.dist) return { point: p, dist };
      return best;
    }, null as { point: { year: number; rent: number; equity: number; balance: number; cashflow: number }; dist: number } | null);
    if (!nearest) return;
    const p = nearest.point;
    const x = pad + (p.year / 30) * (w - pad * 2);
    const yRent =
      h -
      pad -
      ((projection.maxNorm > 0 ? (p.rent / projection.rentBase) / projection.maxNorm : 0) *
        (h - pad * 2));
    const yEquity =
      h -
      pad -
      ((projection.maxNorm > 0 ? (p.equity / projection.equityBase) / projection.maxNorm : 0) *
        (h - pad * 2));
    const yBalance =
      h -
      pad -
      ((projection.maxNorm > 0 ? (p.balance / projection.balanceBase) / projection.maxNorm : 0) *
        (h - pad * 2));
    const yCashflow =
      h -
      pad -
      (((p.cashflow - projection.cashflowMin) / projection.cashflowRange) * (h - pad * 2));
    setHover({
      year: p.year,
      rent: p.rent,
      equity: p.equity,
      balance: p.balance,
      cashflow: p.cashflow,
      x: x + translateX,
      yRent: yRent + chart.translateY,
      yEquity: yEquity + chart.translateY,
      yBalance: yBalance + chart.translateY,
      yCashflow: yCashflow + chart.translateY,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {card('All-In Cost', fmtMoney(outputs.allInCost))}
        {card('Refi Loan Amount', fmtMoney(outputs.refiLoanAmount))}
        {card('Your Cash Left in Deal', fmtMoney(outputs.cashLeftInDeal), outputs.cashLeftInDeal > 0 ? 'border-orange-500/40 bg-orange-500/10' : '')}
        {card('Your Equity Created', fmtMoney(outputs.equityAfterRefi))}
        {card('Monthly Cash Flow', fmtMoney(outputs.cashflowAfterRefiMonthly), outputs.cashflowAfterRefiMonthly < 0 ? 'border-red-500/40 bg-red-500/10' : 'border-emerald-500/40 bg-emerald-500/10')}
        {card('DSCR', outputs.dscr.toFixed(2))}
        {card(
          'Year 1 Cash-on-Cash',
          outputs.cashOnCashReturnYear1 === Infinity
            ? '∞'
            : `${(outputs.cashOnCashReturnYear1 * 100).toFixed(1)}%`,
        )}
        {card('Monthly NOI', fmtMoney(outputs.rentalCashflowMonthlyBeforeRefiDebt))}
      </div>

      <SectionCard title="Detail">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-100 mb-2">Before Refi</h4>
            <ul className="space-y-1 text-sm text-slate-300">
              <li>Purchase Loan: {fmtMoney(outputs.purchaseLoanAmount)}</li>
              <li>Rehab Loan: {fmtMoney(outputs.rehabLoanAmount)}</li>
              <li>Total Acquisition Costs: {fmtMoney(outputs.totalAcquisitionCosts)}</li>
              <li>Total Rehab (w/ contingency): {fmtMoney(outputs.totalRehabCostWithContingency)}</li>
              <li>Total Cash Into Deal: {fmtMoney(outputs.totalCashIntoDeal)}</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100 mb-2">After Refi</h4>
            <ul className="space-y-1 text-sm text-slate-300">
              <li>Hard Money Payoff: {fmtMoney(outputs.hardMoneyPayoff)}</li>
              <li>Rehab Loan Payoff: {fmtMoney(outputs.rehabLoanPayoff)}</li>
              <li>Cash Back to You (from Refi): {fmtMoney(outputs.cashOutFromRefi)}</li>
              <li>Your Equity Created: {fmtMoney(outputs.equityAfterRefi)}</li>
              <li>Annual Debt Service: {fmtMoney(outputs.annualDebtService)}</li>
              <li>NOI: {fmtMoney(outputs.noiAnnual)}</li>
              <li>DSCR: {outputs.dscr.toFixed(2)}</li>
            </ul>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Risk Flags">
        {riskFlags.length === 0 ? (
          <p className="text-sm text-emerald-400">No obvious risks detected.</p>
        ) : (
          <ul className="space-y-1 text-sm text-orange-300">
            {riskFlags.map((flag) => (
              <li key={flag}>• {flag}</li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="30-Year Trajectory">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-slate-200">
              Rent Growth (%/yr)
              <input
                type="number"
                step={0.25}
                className="ml-2 w-20 rounded border border-slate-700 bg-slate-900/60 px-2 py-1 text-sm text-white"
                value={rentGrowthPercent}
                onChange={(e) => setRentGrowthPercent(e.target.value)}
              />
            </label>
            <label className="text-sm font-medium text-slate-200">
              Appreciation (%/yr)
              <input
                type="number"
                step={0.25}
                className="ml-2 w-20 rounded border border-slate-700 bg-slate-900/60 px-2 py-1 text-sm text-white"
                value={appreciationPercent}
                onChange={(e) => setAppreciationPercent(e.target.value)}
              />
            </label>
            <span className="text-xs text-slate-400">Defaults 3%/yr. Clear either field to test 0%.</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 overflow-x-auto">
            <div className="relative">
              <svg
                width="100%"
                height="420"
                viewBox={`0 0 ${chart.vbWidth} ${chart.vbHeight}`}
                preserveAspectRatio="xMidYMid meet"
                onMouseMove={handleHover}
                onMouseLeave={() => setHover(null)}
              >
                <style>
                  {`
                    @keyframes drawLine {
                      0% { stroke-dashoffset: var(--dash, 1800); opacity: 0; }
                      30% { opacity: 1; }
                      100% { stroke-dashoffset: 0; opacity: 1; }
                    }
                    .line-animate {
                      stroke-dasharray: var(--dash, 1800);
                      stroke-dashoffset: var(--dash, 1800);
                      opacity: 0;
                      animation: drawLine 1.6s cubic-bezier(0.33, 1, 0.68, 1) forwards;
                      animation-delay: var(--delay, 0s);
                    }
                  `}
                </style>
                <rect x="0" y="0" width={chart.vbWidth} height={chart.vbHeight} rx="12" fill="#0f172a" />
                <g transform={`translate(${chart.translateX},${chart.translateY})`}>
                  <line
                    x1={chart.pad}
                    y1={chart.h - chart.pad}
                    x2={chart.w - chart.pad}
                    y2={chart.h - chart.pad}
                    stroke="#1e293b"
                    strokeWidth="1"
                  />
                  <line
                    x1={chart.pad}
                    y1={chart.pad}
                    x2={chart.pad}
                    y2={chart.h - chart.pad}
                    stroke="#1e293b"
                    strokeWidth="1"
                  />
                  {Array.from({ length: 7 }).map((_, idx) => {
                    const yTicksMax = Math.max(1.5, Math.ceil(projection.maxNorm * 10) / 10);
                    const step = yTicksMax / 5;
                    const val = step * idx;
                    const ratio = val / yTicksMax;
                    const y = chart.h - chart.pad - ratio * (chart.h - chart.pad * 2);
                    return (
                      <g key={idx}>
                        <line x1={chart.pad} x2={chart.w - chart.pad} y1={y} y2={y} stroke="#1e293b" strokeWidth="1" />
                        <text x={chart.pad - 10} y={y + 4} fontSize="10" fill="#94a3b8" textAnchor="end">
                          {val.toFixed(1)}
                        </text>
                      </g>
                    );
                  })}
                  {Array.from({ length: 6 }).map((_, idx) => {
                    const ratio = idx / 5;
                    const y = chart.h - chart.pad - ratio * (chart.h - chart.pad * 2);
                    const cashVal = projection.cashflowMin + projection.cashflowRange * ratio;
                    return (
                      <g key={`cf-${idx}`}>
                        <line
                          x1={chart.w - chart.pad}
                          x2={chart.w - chart.pad + 6}
                          y1={y}
                          y2={y}
                          stroke="#f59e0b"
                          strokeWidth="1"
                        />
                        <text x={chart.w - chart.pad + 8} y={y + 4} fontSize="10" fill="#f59e0b">
                          {fmtMoney(cashVal)}
                        </text>
                      </g>
                    );
                  })}
                  {[0, 5, 10, 15, 20, 25, 30].map((year) => {
                    const x = chart.pad + (year / 30) * (chart.w - chart.pad * 2);
                    return (
                      <g key={year}>
                        <line x1={x} x2={x} y1={chart.pad} y2={chart.h - chart.pad} stroke="#1e293b" strokeWidth="1" />
                        <text x={x} y={chart.h - chart.pad + 16} fontSize="10" fill="#94a3b8" textAnchor="middle">
                          {year}
                        </text>
                      </g>
                    );
                  })}
                  <path style={lineDelay('0s')} className="line-animate" d={toPath('rent')} fill="none" stroke="#0ea5e9" strokeWidth="2.5" />
                  <path style={lineDelay('0.05s')} className="line-animate" d={toPath('equity')} fill="none" stroke="#22c55e" strokeWidth="2.5" />
                  <path style={lineDelay('0.1s')} className="line-animate" d={toPath('balance')} fill="none" stroke="#475569" strokeWidth="2.5" />
                  <path style={lineDelay('0.15s')} className="line-animate" d={toPath('cashflow')} fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                  {hover && (
                    <>
                      {(() => {
                        const x = hover.x - chart.translateX;
                        const yRent = hover.yRent - chart.translateY;
                        const yEquity = hover.yEquity - chart.translateY;
                        const yBalance = hover.yBalance - chart.translateY;
                        const yCashflow = hover.yCashflow - chart.translateY;
                        return (
                          <>
                            <line
                              x1={x}
                              x2={x}
                              y1={chart.pad}
                              y2={chart.h - chart.pad}
                              stroke="#cbd5e1"
                              strokeDasharray="4 4"
                            />
                            <circle cx={x} cy={yRent} r="4" fill="#0ea5e9" />
                            <circle cx={x} cy={yEquity} r="4" fill="#22c55e" />
                            <circle cx={x} cy={yBalance} r="4" fill="#475569" />
                            <circle cx={x} cy={yCashflow} r="4" fill="#f59e0b" />
                          </>
                        );
                      })()}
                    </>
                  )}
                  <text x={chart.pad} y={chart.pad - 20} fontSize="10" fill="#94a3b8">
                    Indexed to Year 0 (1.0 = starting value)
                  </text>
                  <text x={chart.w / 2} y={chart.h - chart.pad + 32} fontSize="10" fill="#94a3b8" textAnchor="middle">
                    Years
                  </text>
                </g>
              </svg>
              {hover && (
                <div
                  className="absolute rounded-lg bg-slate-900 text-slate-100 shadow-lg border border-slate-700 px-3 py-2 text-xs"
                  style={{
                    left: Math.min(chart.vbWidth - 200, Math.max(40, hover.x)),
                    top: hover.yRent - 20,
                  }}
                >
                  <div className="font-semibold text-white">Year {hover.year}</div>
                  <div className="flex items-center gap-1 text-slate-200">
                    <span className="inline-block h-2 w-2 rounded-full bg-sky-400" />
                    Rent: {fmtMoney(hover.rent)}
                  </div>
                  <div className="flex items-center gap-1 text-slate-200">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    Equity: {fmtMoney(hover.equity)}
                  </div>
                  <div className="flex items-center gap-1 text-slate-200">
                    <span className="inline-block h-2 w-2 rounded-full bg-slate-400" />
                    Debt Balance: {fmtMoney(hover.balance)}
                  </div>
                  <div className="flex items-center gap-1 text-slate-200">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                    Cashflow: {fmtMoney(hover.cashflow)}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-2 py-1">
                  <span className="h-2 w-6 rounded bg-sky-400" />
                  <span>Rent • {fmtMoney(projection.rentEnd)}</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-2 py-1">
                  <span className="h-2 w-6 rounded bg-emerald-500" />
                  <span>Equity • {fmtMoney(projection.equityEnd)}</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-2 py-1">
                  <span className="h-2 w-6 rounded bg-slate-500" />
                  <span>Debt • {fmtMoney(projection.balanceEnd)}</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-2 py-1">
                  <span className="h-2 w-6 rounded bg-amber-500" />
                  <span>Cashflow • {fmtMoney(projection.cashflowEnd)}</span>
                </span>
              </div>
              <span className="text-slate-400 block mt-1">
                Indexed to year 0 to show growth; values shown are year 30 projections.
              </span>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

export default ResultsTab;
