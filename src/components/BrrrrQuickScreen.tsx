import React, { useEffect, useMemo, useState } from 'react';

type FinancingType = 'Hard Money' | 'Investor';

type QuickScreenInputs = {
  address: string;
  purchasePrice: number;
  rehab: number;
  arv: number;
  rent: number;
  taxes: number;
  insurance: number;
  hoa: number;
  financingType: FinancingType;
  hmRate: number; // annual rate as decimal
  points: number; // as decimal
  investorRate: number; // annual rate as decimal
  profitSplit: number; // your share, decimal (0.5 = 50/50)
};

type QuickScreenResult = {
  hmLoan: number;
  downPayment: number;
  pointsCost: number;
  interestCost: number;
  allIn: number;
  cashNeededToday: number;
  noi: number;
  refiLoan: number;
  mortgagePayment: number;
  dscr: number;
  cashLeftIn: number;
  cashflow: number;
};

type RuleResult = {
  label: string;
  pass: boolean;
  detail: string;
};

type Snapshot = {
  address: string;
  purchasePrice: number;
  arv: number;
  rehab: number;
  rent: number;
  taxes: number;
  insurance: number;
  hoa: number;
  savedAt: string;
};

const CLOSING_COST = 5000;
const DSCR_RATE = 0.0725; // assumed DSCR refi rate (7.25%)
const DSCR_TERM_YEARS = 30;
const MIN_DSCR = 1.15;
const SNAPSHOT_KEY = 'brrrrQuickScreenSnapshots';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

function calculateMortgagePayment(principal: number, annualRate: number, termYears: number): number {
  if (principal <= 0 || annualRate <= 0) return 0;
  const monthlyRate = annualRate / 12;
  const n = termYears * 12;
  const factor = Math.pow(1 + monthlyRate, n);
  return principal * (monthlyRate * factor) / (factor - 1);
}

function calculateQuickScreen(inputs: QuickScreenInputs): QuickScreenResult {
  const loanBase =
    inputs.financingType === 'Hard Money'
      ? inputs.purchasePrice * 0.8 + inputs.rehab
      : inputs.purchasePrice + inputs.rehab;

  const downPayment = inputs.financingType === 'Hard Money' ? inputs.purchasePrice * 0.2 : 0;
  const pointsCost = inputs.financingType === 'Hard Money' ? loanBase * inputs.points : 0;
  const rate = inputs.financingType === 'Hard Money' ? inputs.hmRate : inputs.investorRate;
  const interestCost = loanBase * rate * (6 / 12);

  const allIn = inputs.purchasePrice + inputs.rehab + pointsCost + interestCost + CLOSING_COST;
  const cashNeededToday = downPayment + pointsCost + CLOSING_COST;
  const noi =
    inputs.rent * 12 * 0.95 -
    (inputs.taxes + inputs.insurance + inputs.hoa * 12 + inputs.rent * 12 * 0.35);
  const refiLoan = inputs.arv * 0.75;
  const monthlyMortgagePayment = calculateMortgagePayment(refiLoan, DSCR_RATE, DSCR_TERM_YEARS);
  const dscr = monthlyMortgagePayment > 0 ? noi / (monthlyMortgagePayment * 12) : 0;
  const cashLeftIn = allIn - refiLoan;
  const cashflow = inputs.rent * 0.65 - monthlyMortgagePayment;

  return {
    hmLoan: loanBase,
    downPayment,
    pointsCost,
    interestCost,
    allIn,
    cashNeededToday,
    noi,
    refiLoan,
    mortgagePayment: monthlyMortgagePayment,
    dscr,
    cashLeftIn,
    cashflow,
  };
}

function buildRules(inputs: QuickScreenInputs, result: QuickScreenResult): RuleResult[] {
  return [
    {
      label: 'All-in ≤ 80% of ARV',
      pass: result.allIn <= inputs.arv * 0.8,
      detail: `${formatCurrency(result.allIn)} vs ${formatCurrency(inputs.arv * 0.8)}`,
    },
    {
      label: 'Rent ≥ 1% of Purchase',
      pass: inputs.rent >= inputs.purchasePrice * 0.01,
      detail: `${formatCurrency(inputs.rent)} vs ${formatCurrency(inputs.purchasePrice * 0.01)}`,
    },
    {
      label: 'DSCR ≥ 1.15',
      pass: result.dscr >= MIN_DSCR,
      detail: `${formatNumber(result.dscr)} DSCR`,
    },
    {
      label: 'Cash Left In ≤ $10k',
      pass: result.cashLeftIn <= 10000,
      detail: formatCurrency(result.cashLeftIn),
    },
    {
      label: 'Cashflow ≥ $150/mo',
      pass: result.cashflow >= 150,
      detail: formatCurrency(result.cashflow),
    },
  ];
}

const defaultInputs: QuickScreenInputs = {
  address: '',
  purchasePrice: 225000,
  rehab: 45000,
  arv: 325000,
  rent: 2500,
  taxes: 3600,
  insurance: 1200,
  hoa: 0,
  financingType: 'Hard Money',
  hmRate: 0.12,
  points: 0.02,
  investorRate: 0.08,
  profitSplit: 0.5,
};

const FieldWrapper: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="flex flex-col text-sm font-medium text-slate-700 space-y-1">
    <span>{label}</span>
    {children}
  </label>
);

const StatCard: React.FC<{
  title: string;
  value: string;
  note?: string;
  tone?: 'good' | 'warn';
}> = ({ title, value, note, tone }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-1">
    <div className="text-xs uppercase tracking-wide text-slate-500">{title}</div>
    <div className={`text-2xl font-semibold ${tone === 'warn' ? 'text-amber-600' : 'text-slate-900'}`}>{value}</div>
    {note && <div className="text-xs text-slate-500">{note}</div>}
  </div>
);

function getStoredSnapshots(): Snapshot[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(SNAPSHOT_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Snapshot[];
  } catch {
    return [];
  }
}

function persistSnapshots(list: Snapshot[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(list));
}

export default function BrrrrQuickScreen() {
  const [inputs, setInputs] = useState<QuickScreenInputs>(defaultInputs);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);

  useEffect(() => {
    setSnapshots(getStoredSnapshots());
  }, []);

  const result = useMemo(() => calculateQuickScreen(inputs), [inputs]);
  const rules = useMemo(() => buildRules(inputs, result), [inputs, result]);
  const overallPass = rules.every(rule => rule.pass);

  const handleSaveSnapshot = () => {
    const snapshot: Snapshot = {
      address: inputs.address || 'Untitled',
      purchasePrice: inputs.purchasePrice,
      arv: inputs.arv,
      rehab: inputs.rehab,
      rent: inputs.rent,
      taxes: inputs.taxes,
      insurance: inputs.insurance,
      hoa: inputs.hoa,
      savedAt: new Date().toISOString(),
    };
    const updated = [snapshot, ...snapshots].slice(0, 10);
    setSnapshots(updated);
    persistSnapshots(updated);
  };

  const handleNumberChange =
    (key: keyof QuickScreenInputs, divisor = 1) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      setInputs(prev => ({ ...prev, [key]: isNaN(value) ? 0 : value / divisor }));
    };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            BRRRR Quick Screen
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Fast pre-underwriting for Hard Money or Investor capital</h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Plug in a BRRRR deal and see if it clears the quick rules-of-thumb before deep underwriting.
            Assumes DSCR refi at 75% LTV, {Math.round(DSCR_RATE * 10000) / 100}% rate, {DSCR_TERM_YEARS}-year amortization.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Inputs</h2>
                <select
                  className="text-sm rounded-md border border-slate-300 px-3 py-1.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={inputs.financingType}
                  onChange={e =>
                    setInputs(prev => ({
                      ...prev,
                      financingType: e.target.value as FinancingType,
                    }))
                  }
                >
                  <option value="Hard Money">Hard Money</option>
                  <option value="Investor">Investor Money</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldWrapper label="Address">
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={inputs.address}
                    onChange={e => setInputs(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main St"
                  />
                </FieldWrapper>
                <FieldWrapper label="Purchase Price">
                  <input
                    type="number"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={inputs.purchasePrice}
                    onChange={handleNumberChange('purchasePrice')}
                    min={0}
                    step={1000}
                  />
                </FieldWrapper>
                <FieldWrapper label="Rehab Budget">
                  <input
                    type="number"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={inputs.rehab}
                    onChange={handleNumberChange('rehab')}
                    min={0}
                    step={1000}
                  />
                </FieldWrapper>
                <FieldWrapper label="After Repair Value (ARV)">
                  <input
                    type="number"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={inputs.arv}
                    onChange={handleNumberChange('arv')}
                    min={0}
                    step={1000}
                  />
                </FieldWrapper>
                <FieldWrapper label="Monthly Rent">
                  <input
                    type="number"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={inputs.rent}
                    onChange={handleNumberChange('rent')}
                    min={0}
                    step={50}
                  />
                </FieldWrapper>
                <FieldWrapper label="Annual Taxes">
                  <input
                    type="number"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={inputs.taxes}
                    onChange={handleNumberChange('taxes')}
                    min={0}
                    step={100}
                  />
                </FieldWrapper>
                <FieldWrapper label="Annual Insurance">
                  <input
                    type="number"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={inputs.insurance}
                    onChange={handleNumberChange('insurance')}
                    min={0}
                    step={100}
                  />
                </FieldWrapper>
                <FieldWrapper label="Monthly HOA">
                  <input
                    type="number"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={inputs.hoa}
                    onChange={handleNumberChange('hoa')}
                    min={0}
                    step={25}
                  />
                </FieldWrapper>
                {inputs.financingType === 'Hard Money' ? (
                  <>
                    <FieldWrapper label="Hard Money Rate (Annual %)">
                      <div className="relative">
                        <input
                          type="number"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          value={inputs.hmRate * 100}
                          onChange={handleNumberChange('hmRate', 100)}
                          min={0}
                          step={0.25}
                        />
                        <span className="absolute inset-y-0 right-3 flex items-center text-slate-500 text-sm">%</span>
                      </div>
                    </FieldWrapper>
                    <FieldWrapper label="Points (%)">
                      <div className="relative">
                        <input
                          type="number"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          value={inputs.points * 100}
                          onChange={handleNumberChange('points', 100)}
                          min={0}
                          step={0.25}
                        />
                        <span className="absolute inset-y-0 right-3 flex items-center text-slate-500 text-sm">%</span>
                      </div>
                    </FieldWrapper>
                  </>
                ) : (
                  <>
                    <FieldWrapper label="Investor Rate (Annual %)">
                      <div className="relative">
                        <input
                          type="number"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          value={inputs.investorRate * 100}
                          onChange={handleNumberChange('investorRate', 100)}
                          min={0}
                          step={0.25}
                        />
                        <span className="absolute inset-y-0 right-3 flex items-center text-slate-500 text-sm">%</span>
                      </div>
                    </FieldWrapper>
                    <FieldWrapper label="Profit Split (Your Share %)">
                      <div className="relative">
                        <input
                          type="number"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          value={inputs.profitSplit * 100}
                          onChange={handleNumberChange('profitSplit', 100)}
                          min={0}
                          max={100}
                          step={5}
                        />
                        <span className="absolute inset-y-0 right-3 flex items-center text-slate-500 text-sm">%</span>
                      </div>
                    </FieldWrapper>
                  </>
                )}
              </div>

              <button
                type="button"
                className="w-full inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-white font-semibold shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600"
                onClick={handleSaveSnapshot}
              >
                Save Property Snapshot
              </button>

              {snapshots.length > 0 && (
                <div className="border-t border-slate-200 pt-4 space-y-2">
                  <div className="text-xs font-semibold uppercase text-slate-500">Saved Snapshots</div>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {snapshots.map(snap => (
                      <div
                        key={snap.savedAt}
                        className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2 bg-slate-50"
                      >
                        <div className="text-sm text-slate-800">
                          <div className="font-semibold">{snap.address}</div>
                          <div className="text-xs text-slate-500">
                            {formatCurrency(snap.purchasePrice)} buy · {formatCurrency(snap.rehab)} rehab ·{' '}
                            {formatCurrency(snap.arv)} ARV
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-500">{new Date(snap.savedAt).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard
                title="Cash Needed Today"
                value={formatCurrency(result.cashNeededToday)}
                note={`Down ${formatCurrency(result.downPayment)} + Points ${formatCurrency(result.pointsCost)} + Closing ${formatCurrency(
                  CLOSING_COST,
                )}`}
                tone={result.cashNeededToday > 40000 ? 'warn' : 'good'}
              />
              <StatCard
                title="Cash Left In After Refi"
                value={formatCurrency(result.cashLeftIn)}
                note={`All-in ${formatCurrency(result.allIn)} vs Refi ${formatCurrency(result.refiLoan)}`}
                tone={result.cashLeftIn > 0 ? 'warn' : 'good'}
              />
              <StatCard
                title="DSCR"
                value={formatNumber(result.dscr)}
                note={`NOI ${formatCurrency(result.noi)} / Debt ${formatCurrency(result.mortgagePayment * 12)}`}
                tone={result.dscr < MIN_DSCR ? 'warn' : 'good'}
              />
              <StatCard
                title="Estimated Cashflow"
                value={formatCurrency(result.cashflow)}
                note={`Rent net ${formatCurrency(inputs.rent * 0.65)} - Mortgage ${formatCurrency(result.mortgagePayment)}`}
                tone={result.cashflow < 150 ? 'warn' : 'good'}
              />
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Financing Snapshot</h3>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    overallPass ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {overallPass ? 'PASS' : 'CHECK'}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <div className="text-slate-500">Financing Type</div>
                  <div className="font-semibold text-slate-900">{inputs.financingType}</div>
                  <div className="text-slate-500">Loan Amount</div>
                  <div className="font-semibold text-slate-900">{formatCurrency(result.hmLoan)}</div>
                  <div className="text-slate-500">Interest (6 months)</div>
                  <div className="font-semibold text-slate-900">{formatCurrency(result.interestCost)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-slate-500">Assumed DSCR Refi</div>
                  <div className="font-semibold text-slate-900">
                    {formatCurrency(result.refiLoan)} @ {Math.round(DSCR_RATE * 10000) / 100}% · {DSCR_TERM_YEARS} yrs
                  </div>
                  <div className="text-slate-500">Mortgage Payment</div>
                  <div className="font-semibold text-slate-900">{formatCurrency(result.mortgagePayment)}</div>
                  {inputs.financingType === 'Investor' && (
                    <div className="text-slate-700">
                      Your share of cashflow at {Math.round(inputs.profitSplit * 100)}%: {formatCurrency(result.cashflow * inputs.profitSplit)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3">
              <div className="text-lg font-semibold text-slate-900">Pass / Fail Summary</div>
              <div className="space-y-2">
                {rules.map(rule => (
                  <div
                    key={rule.label}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{rule.label}</div>
                      <div className="text-xs text-slate-500">{rule.detail}</div>
                    </div>
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        rule.pass ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {rule.pass ? 'PASS' : 'CHECK'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
