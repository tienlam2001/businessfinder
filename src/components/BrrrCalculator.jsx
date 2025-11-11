import { useEffect, useMemo, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  Calculator,
  Save,
  Download,
  SlidersHorizontal,
  BadgeCheck,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  buildBrrrModel,
  createDefaultBrrrInputs,
  mergeBrrrInputs,
  solveMaxOfferPrice,
} from '../calculations';

const defaultSensitivity = {
  arvPercent: 0,
  rentPercent: 0,
  bridgeRateDelta: 0,
  refiRateDelta: 0,
  expensePercentDelta: 0,
};

const scenarioTabs = [
  { key: 'hardMoney', label: 'Hard Money → DSCR' },
  { key: 'investorActive', label: 'Investor Money → DSCR' },
  { key: 'allCash', label: 'All-Cash Hold' },
];

const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value === Infinity ? '∞' : `$${Number(value).toLocaleString()}`;
};

const formatPercent = (value, decimals = 1) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${(Number(value) * 100).toFixed(decimals)}%`;
};

const formatRatio = (value, decimals = 2) => {
  if (value === null || value === undefined) return '—';
  if (value === Infinity) return '∞';
  return Number(value).toFixed(decimals);
};

const sumRentRoll = (rentRoll = []) =>
  rentRoll.reduce((total, unit) => total + (Number(unit.rent) || 0), 0);

const clone = (value) => JSON.parse(JSON.stringify(value));

const hydrateModel = (residence) => {
  const rentRollTotal = sumRentRoll(residence?.rentRoll);
  const purchasePrice = Number(residence?.purchasePrice) || 0;
  const quickRehab = Number(residence?.rehabBudgetQuick) || null;
  const inspectionPercent = Number(residence?.inspectionPercent) || 0;
  const closingPercent = Number(residence?.closingCostsPercent) || 0;
  const holdingPercent = Number(residence?.holdingPercent) || 0;
  const rentFromInputs =
    (Number(residence?.rentMonthly) || 0) +
    (Number(residence?.otherIncomeMonthly) || 0);
  const vacancyPercent =
    residence?.vacancyPercent !== undefined ? Number(residence.vacancyPercent) : undefined;
  const expenseRatio =
    residence?.opExPercent !== undefined ? Number(residence.opExPercent) : undefined;
  const investorFundingType =
    residence?.fundingMode === 'investorEquity'
      ? 'equity'
      : 'debt';
  const inspectionFixed =
    inspectionPercent > 0 && purchasePrice > 0
      ? purchasePrice * (inspectionPercent / 100)
      : undefined;
  const holdingFromPercent =
    holdingPercent > 0 && purchasePrice > 0
      ? purchasePrice * (holdingPercent / 100)
      : undefined;

  const holding = {
    taxes:
      residence?.propertyTax && residence.propertyTax > 0
        ? residence.propertyTax / 12
        : 0,
    insurance:
      residence?.insurance && residence.insurance > 0
        ? residence.insurance / 12
        : 0,
    utilities:
      holdingFromPercent !== undefined
        ? holdingFromPercent
        : Number(residence?.holdingUtilities) || 0,
    hoa: 0,
  };

  const overrides = {
    shared: {
      purchasePrice: purchasePrice || undefined,
      arv: residence?.arv || undefined,
      rehabBudget: quickRehab && quickRehab > 0
        ? quickRehab
        : residence?.rehabItems
            ? residence.rehabItems.reduce(
                (sum, item) => sum + (Number(item.cost) || 0),
                0,
              )
            : undefined,
      purchaseClosingPercent: closingPercent || undefined,
      purchaseClosingFixed: inspectionFixed,
      marketRent:
        rentRollTotal ||
        (rentFromInputs > 0 ? rentFromInputs : residence?.marketRent) ||
        undefined,
      annualPropertyTax: residence?.propertyTax || undefined,
      annualInsurance: residence?.insurance || undefined,
      holdingCosts: holding,
      vacancyPercent,
      expenseRatioPercent:
        expenseRatio !== undefined ? expenseRatio : undefined,
    },
    hardMoney: {
      ltvPercent: residence?.bridgeLtvPercent || undefined,
    },
    investor: {
      fundingType: residence?.investorFundingType || investorFundingType,
    },
    dscrRefi: {
      maxLtvPercent: residence?.dscrRefiLtvPercent || undefined,
      ratePercent: residence?.dscrRefiRatePercent || undefined,
      amortYears: residence?.dscrRefiAmortYears || undefined,
      termYears: residence?.dscrRefiAmortYears || undefined,
      dscrTarget: residence?.dscrRefiTarget || undefined,
    },
    allCash: {
      takeRefi:
        typeof residence?.allCashFlag === 'boolean'
          ? residence.allCashFlag
          : undefined,
    },
  };

  return mergeBrrrInputs(residence?.brrrModel, createDefaultBrrrInputs(overrides));
};

const setByPath = (draft, path, value) => {
  const keys = path.split('.');
  const last = keys.pop();
  let cursor = draft;
  keys.forEach((key) => {
    if (cursor[key] === undefined) cursor[key] = {};
    cursor = cursor[key];
  });
  cursor[last] = value;
};

const makeRangeLabel = (value) =>
  `${value > 0 ? '+' : ''}${value.toFixed(Number.isInteger(value) ? 0 : 1)}%`;

const scenarioTitle = {
  hardMoney: 'Hard Money → DSCR',
  investorDebt: 'Investor (Debt) → DSCR',
  investorEquity: 'Investor (Equity) → DSCR',
  investorActive: 'Investor Money → DSCR',
  allCash: 'All-Cash Hold',
};

const getScenarioForMaxOffer = (tabKey, fundingType) => {
  if (tabKey === 'investorActive') {
    return fundingType === 'equity' ? 'investorEquity' : 'investorDebt';
  }
  return tabKey;
};

const SummaryBadge = ({ variant, label }) => {
  const variants = {
    positive: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/40',
    warn: 'bg-amber-500/10 text-amber-200 border border-amber-400/40',
    neutral: 'bg-slate-500/10 text-slate-200 border border-slate-500/40',
  };
  return (
    <span className={`px-2 py-1 text-xs rounded-full ${variants[variant]}`}>
      {label}
    </span>
  );
};

const ScenarioCard = ({ scenario }) => (
  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-xl shadow-black/30">
    <div className="flex items-center justify-between text-sm text-slate-300">
      <span className="font-semibold text-white">
        {scenarioTitle[scenario.scenario] || 'Scenario'}
      </span>
      <SummaryBadge
      variant={scenario.badges.dscrFail ? 'warn' : scenario.badges.refiApproved ? 'positive' : 'neutral'}
      label={
        scenario.badges.dscrFail
          ? 'DSCR Needs Work'
          : scenario.badges.refiApproved
            ? 'Refi Approved'
            : 'Monitoring'
      }
    />
    </div>
    <dl className="mt-4 space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-slate-400">Total Project Cost</dt>
        <dd className="font-semibold text-white">{formatCurrency(scenario.totalProjectCost)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-slate-400">NOI</dt>
        <dd className="font-semibold text-white">{formatCurrency(scenario.noi)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-slate-400">Refi Proceeds</dt>
        <dd className="font-semibold text-white">
          {formatCurrency(scenario.refiProceeds)}{' '}
          <span className="text-xs text-slate-400">
            ({scenario.refiConstraint})
          </span>
        </dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-slate-400">Monthly P&I</dt>
        <dd className="font-semibold text-white">
          {formatCurrency(scenario.monthlyPAndI)}
        </dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-slate-400">DSCR</dt>
        <dd className="font-semibold text-white">
          {formatRatio(scenario.actualDscr)}{' '}
          <span className="text-xs text-slate-400">
            / Target {scenario.dscrTarget}
          </span>
        </dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-slate-400">Sponsor Cash In</dt>
        <dd className="font-semibold text-white">
          {formatCurrency(scenario.sponsorCashIn)}
        </dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-slate-400">
          {scenario.cashAvailableToDistribute !== undefined
            ? 'Available Cash'
            : 'Cash Out at Refi'}
        </dt>
        <dd className="font-semibold text-white">
          {formatCurrency(
            scenario.cashAvailableToDistribute ?? scenario.cashOutToSponsor,
          )}
        </dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-slate-400">Cash Left In</dt>
        <dd className="font-semibold text-white">
          {formatCurrency(scenario.cashLeftIn)}
        </dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-slate-400">Year-1 CoC</dt>
        <dd className="font-semibold text-white">
          {scenario.yearOneCoC === null
            ? '—'
            : formatPercent(scenario.yearOneCoC)}
        </dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-slate-400">Payback</dt>
        <dd className="font-semibold text-white">
          {scenario.paybackYears === null
            ? '—'
            : `${scenario.paybackYears.toFixed(1)} yrs`}
        </dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-slate-400">Equity Created</dt>
        <dd className="font-semibold text-white">
          {formatCurrency(scenario.equityCreated)}
        </dd>
      </div>
    </dl>
    <div className="mt-3 flex flex-wrap gap-2">
      {scenario.badges.infiniteBrrr && (
        <SummaryBadge variant="positive" label="BRRR Infinite" />
      )}
      {scenario.badges.dscrFail && (
        <SummaryBadge
          variant="warn"
          label={`DSCR short by ${scenario.badges.dscrShortfall.toFixed(2)}`}
        />
      )}
    </div>
    {scenario.prefAccrual ? (
      <p className="mt-3 text-xs text-slate-400">
        Pref accrual during rehab: {formatCurrency(scenario.prefAccrual)}
      </p>
    ) : null}
    {scenario.notes?.length > 0 && (
      <ul className="mt-2 list-disc pl-4 text-xs text-slate-400">
        {scenario.notes.map((note, idx) => (
          <li key={`${scenario.scenario}-note-${idx}`}>{note}</li>
        ))}
      </ul>
    )}
  </div>
);

export default function BrrrCalculator({ residence }) {
  const [model, setModel] = useState(() => hydrateModel(residence));
  const [activeTab, setActiveTab] = useState('hardMoney');
  const [sensitivity, setSensitivity] = useState(defaultSensitivity);
  const [saveState, setSaveState] = useState('idle');
  const [maxOffer, setMaxOffer] = useState(null);
  const pdfRef = useRef(null);

  useEffect(() => {
    setModel(hydrateModel(residence));
  }, [residence]);

  const calculation = useMemo(
    () => buildBrrrModel(model, sensitivity),
    [model, sensitivity],
  );

  const activeScenario =
    activeTab === 'investorActive'
      ? calculation.scenarios.investorActive
      : calculation.scenarios[activeTab];

  const getValue = (path) =>
    path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), model);

  const handleNumberChange = (path) => (event) => {
    const nextValue = event.target.value;
    const numeric = Number(nextValue);
    const value = Number.isFinite(numeric) ? numeric : 0;
    setModel((prev) => {
      const draft = clone(prev);
      setByPath(draft, path, value);
      return draft;
    });
  };

  const handleCheckboxChange = (path) => (event) => {
    const { checked } = event.target;
    setModel((prev) => {
      const draft = clone(prev);
      setByPath(draft, path, checked);
      return draft;
    });
  };

  const handleSensitivityChange = (field) => (event) => {
    setSensitivity((prev) => ({ ...prev, [field]: Number(event.target.value) }));
  };

  const handleFundingToggle = (mode) => {
    setModel((prev) => {
      const draft = clone(prev);
      draft.investor.fundingType = mode;
      return draft;
    });
  };

  const handleSaveModel = async () => {
    try {
      setSaveState('saving');
      await updateDoc(doc(db, 'residences', residence.id), {
        brrrModel: model,
      });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch (error) {
      console.error(error);
      setSaveState('error');
    }
  };

  const handleMaxOffer = () => {
    const scenarioKey = getScenarioForMaxOffer(
      activeTab,
      model.investor.fundingType,
    );
    const nextPrice = solveMaxOfferPrice(
      model,
      scenarioKey,
      5000,
      sensitivity,
    );
    if (!nextPrice) {
      setMaxOffer('No price meets ≤ $5K cash left.');
      return;
    }
    setMaxOffer(`Max offer ${formatCurrency(Math.round(nextPrice))}`);
    setModel((prev) => {
      const draft = clone(prev);
      draft.shared.purchasePrice = Math.round(nextPrice);
      return draft;
    });
  };

  const handlePdfExport = useReactToPrint({
    content: () => pdfRef.current,
    documentTitle: `${residence.propertyAddress || 'BRRR'}_model`,
  });

  return (
    <section className="mt-12 rounded-3xl border border-white/10 bg-slate-950/60 p-6 text-white shadow-2xl shadow-black/40">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-brrr-cyan">
            Automated BRRR modeling
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
            <Calculator size={20} className="text-brrr-cyan" />
            Project Finance Lab
          </h2>
          <p className="text-sm text-slate-300">
            Compare funding paths, test sensitivities, and export a branded PDF.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleMaxOffer}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            <Sparkles size={16} />
            Max Offer ≤ $5K
          </button>
          <button
            type="button"
            onClick={handleSaveModel}
            className="inline-flex items-center gap-2 rounded-full bg-brrr-cyan/20 px-4 py-2 text-sm font-semibold text-brrr-cyan transition hover:bg-brrr-cyan/30"
          >
            <Save size={16} />
            {saveState === 'saving'
              ? 'Saving...'
              : saveState === 'saved'
                ? 'Saved!'
                : 'Save Defaults'}
          </button>
          <button
            type="button"
            onClick={handlePdfExport}
            className="inline-flex items-center gap-2 rounded-full bg-brrr-purple/30 px-4 py-2 text-sm font-semibold text-brrr-purple transition hover:bg-brrr-purple/40"
          >
            <Download size={16} />
            Export PDF
          </button>
        </div>
      </div>

      {maxOffer && (
        <div className="mt-4 rounded-xl border border-brrr-cyan/30 bg-brrr-cyan/10 px-4 py-3 text-sm text-brrr-cyan">
          {maxOffer}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr,0.7fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
              <SlidersHorizontal size={16} />
              Sensitivity
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {[
                { label: 'ARV ±10%', field: 'arvPercent', min: -10, max: 10, step: 1 },
                { label: 'Rent ±10%', field: 'rentPercent', min: -10, max: 10, step: 1 },
                { label: 'Bridge Rate ±2%', field: 'bridgeRateDelta', min: -2, max: 2, step: 0.1 },
                { label: 'Refi Rate ±2%', field: 'refiRateDelta', min: -2, max: 2, step: 0.1 },
                { label: 'Expense Ratio ±5%', field: 'expensePercentDelta', min: -5, max: 5, step: 0.5 },
              ].map((slider) => (
                <label key={slider.field} className="text-xs uppercase tracking-wide text-slate-400">
                  {slider.label}{' '}
                  <span className="text-brrr-cyan">
                    {makeRangeLabel(sensitivity[slider.field])}
                  </span>
                  <input
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={sensitivity[slider.field]}
                    onChange={handleSensitivityChange(slider.field)}
                    className="mt-2 w-full accent-brrr-cyan"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-300">
              Property & Acquisition
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {[
                { label: 'Purchase Price', path: 'shared.purchasePrice', prefix: '$', step: 1000 },
                { label: 'ARV', path: 'shared.arv', prefix: '$', step: 1000 },
                { label: 'Closing Costs %', path: 'shared.purchaseClosingPercent', suffix: '%', step: 0.1 },
                { label: 'Closing Costs $', path: 'shared.purchaseClosingFixed', prefix: '$', step: 500 },
                { label: 'Rehab Budget', path: 'shared.rehabBudget', prefix: '$', step: 1000 },
                { label: 'Rehab Duration (months)', path: 'shared.rehabDurationMonths', step: 1 },
                { label: 'Contingency %', path: 'shared.contingencyPercent', suffix: '%', step: 0.5 },
              ].map((field) => (
                <label key={field.path} className="text-sm text-slate-300">
                  <span className="text-xs uppercase tracking-wide text-slate-400">
                    {field.label}
                  </span>
                  <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2">
                    {field.prefix && <span className="text-slate-500">{field.prefix}</span>}
                    <input
                      type="number"
                      step={field.step}
                      value={getValue(field.path) ?? ''}
                      onChange={handleNumberChange(field.path)}
                      className="w-full bg-transparent text-white outline-none"
                    />
                    {field.suffix && <span className="text-slate-500">{field.suffix}</span>}
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {['taxes', 'insurance', 'utilities', 'hoa'].map((key) => (
                <label key={key} className="text-sm text-slate-300">
                  <span className="text-xs uppercase tracking-wide text-slate-400">
                    Holding {key} / month
                  </span>
                  <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2">
                    <span className="text-slate-500">$</span>
                    <input
                      type="number"
                      step="50"
                      value={model.shared.holdingCosts[key]}
                      onChange={(event) => {
                        const numeric = Number(event.target.value) || 0;
                        setModel((prev) => {
                          const draft = clone(prev);
                          draft.shared.holdingCosts[key] = numeric;
                          return draft;
                        });
                      }}
                      className="w-full bg-transparent text-white outline-none"
                    />
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-300">
              Stabilized Operations
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {[
                { label: 'Market Rent (monthly)', path: 'shared.marketRent', prefix: '$', step: 50 },
                { label: 'Vacancy %', path: 'shared.vacancyPercent', suffix: '%', step: 0.5 },
                { label: 'Expense Ratio %', path: 'shared.expenseRatioPercent', suffix: '%', step: 0.5 },
                { label: 'Mgmt % of Rent', path: 'shared.propertyManagementPercent', suffix: '%', step: 0.5 },
                { label: 'Maintenance % of Rent', path: 'shared.maintenanceReservePercent', suffix: '%', step: 0.5 },
                { label: 'Annual Taxes', path: 'shared.annualPropertyTax', prefix: '$', step: 500 },
                { label: 'Annual Insurance', path: 'shared.annualInsurance', prefix: '$', step: 250 },
                { label: 'Annual HOA', path: 'shared.annualHoa', prefix: '$', step: 100 },
                { label: 'Market Cap Rate %', path: 'shared.marketCapRatePercent', suffix: '%', step: 0.1 },
              ].map((field) => (
                <label key={field.path} className="text-sm text-slate-300">
                  <span className="text-xs uppercase tracking-wide text-slate-400">
                    {field.label}
                  </span>
                  <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2">
                    {field.prefix && <span className="text-slate-500">{field.prefix}</span>}
                    <input
                      type="number"
                      step={field.step}
                      value={getValue(field.path) ?? ''}
                      onChange={handleNumberChange(field.path)}
                      className="w-full bg-transparent text-white outline-none"
                    />
                    {field.suffix && <span className="text-slate-500">{field.suffix}</span>}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-slate-300">
                Hard Money Bridge
              </p>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {[
                { label: 'LTV %', path: 'hardMoney.ltvPercent', suffix: '%', step: 1 },
                { label: 'Rate %', path: 'hardMoney.ratePercent', suffix: '%', step: 0.25 },
                { label: 'Points %', path: 'hardMoney.pointsPercent', suffix: '%', step: 0.25 },
                { label: 'Origination Fee', path: 'hardMoney.originationFee', prefix: '$', step: 250 },
                { label: 'Underwriting Fee', path: 'hardMoney.underwritingFee', prefix: '$', step: 250 },
                { label: 'Draw Fee', path: 'hardMoney.drawFeePerDraw', prefix: '$', step: 25 },
                { label: 'Draw Count', path: 'hardMoney.drawCount', step: 1 },
                { label: 'Other Fees', path: 'hardMoney.otherFees', prefix: '$', step: 250 },
                { label: 'Exit Closing Costs', path: 'hardMoney.exitClosingCosts', prefix: '$', step: 500 },
              ].map((field) => (
                <label key={field.path} className="text-sm text-slate-300">
                  <span className="text-xs uppercase tracking-wide text-slate-400">
                    {field.label}
                  </span>
                  <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2">
                    {field.prefix && <span className="text-slate-500">{field.prefix}</span>}
                    <input
                      type="number"
                      step={field.step}
                      value={getValue(field.path) ?? ''}
                      onChange={handleNumberChange(field.path)}
                      className="w-full bg-transparent text-white outline-none"
                    />
                    {field.suffix && <span className="text-slate-500">{field.suffix}</span>}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-wide text-slate-300">
                Investor Bridge
              </p>
              <div className="flex gap-2 rounded-full border border-white/10 bg-slate-950/70 p-1 text-xs font-semibold">
                {['debt', 'equity'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleFundingToggle(mode)}
                    className={`rounded-full px-3 py-1 ${
                      model.investor.fundingType === mode
                        ? 'bg-brrr-cyan/20 text-brrr-cyan'
                        : 'text-slate-400'
                    }`}
                  >
                    {mode === 'debt' ? 'Debt' : 'Equity'}
                  </button>
                ))}
              </div>
            </div>
            {model.investor.fundingType === 'debt' ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {[
                  { label: 'Advance % of Purchase', path: 'investor.debt.advancePercent', suffix: '%', step: 1 },
                  { label: 'Rate %', path: 'investor.debt.ratePercent', suffix: '%', step: 0.25 },
                  { label: 'Points %', path: 'investor.debt.pointsPercent', suffix: '%', step: 0.25 },
                  { label: 'Up-front Fees', path: 'investor.debt.upfrontFees', prefix: '$', step: 250 },
                  { label: 'Exit Fee %', path: 'investor.debt.exitFeePercent', suffix: '%', step: 0.25 },
                  { label: 'Exit Fee Basis (loan=0, arv=1)', path: 'investor.debt.exitFeeBasis', step: 1 },
                  { label: 'Term (months)', path: 'investor.debt.termMonths', step: 1 },
                  { label: 'Draw Fee', path: 'investor.drawFeePerDraw', prefix: '$', step: 25 },
                  { label: 'Draw Count', path: 'investor.drawCount', step: 1 },
                  { label: 'Other Fees', path: 'investor.otherFees', prefix: '$', step: 250 },
                ].map((field) => {
                  if (field.path === 'investor.debt.exitFeeBasis') {
                    return (
                      <label key={field.path} className="text-sm text-slate-300">
                        <span className="text-xs uppercase tracking-wide text-slate-400">
                          Exit Fee Basis
                        </span>
                        <select
                          value={model.investor.debt.exitFeeBasis}
                          onChange={(event) =>
                            setModel((prev) => {
                              const draft = clone(prev);
                              draft.investor.debt.exitFeeBasis = event.target.value;
                              return draft;
                            })
                          }
                          className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white focus:outline-none"
                        >
                          <option value="loan">Loan Amount</option>
                          <option value="arv">ARV</option>
                        </select>
                      </label>
                    );
                  }
                  return (
                    <label key={field.path} className="text-sm text-slate-300">
                      <span className="text-xs uppercase tracking-wide text-slate-400">
                        {field.label}
                      </span>
                      <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2">
                        {field.prefix && <span className="text-slate-500">{field.prefix}</span>}
                        <input
                          type="number"
                          step={field.step}
                          value={getValue(field.path) ?? ''}
                          onChange={handleNumberChange(field.path)}
                          className="w-full bg-transparent text-white outline-none"
                        />
                        {field.suffix && <span className="text-slate-500">{field.suffix}</span>}
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {[
                  { label: 'Investor Equity %', path: 'investor.equity.equityPercent', suffix: '%', step: 1 },
                  { label: 'Pref % (annual)', path: 'investor.equity.prefPercent', suffix: '%', step: 0.5 },
                  { label: 'Capital Contributed', path: 'investor.equity.capitalContributed', prefix: '$', step: 1000 },
                ].map((field) => (
                  <label key={field.path} className="text-sm text-slate-300">
                    <span className="text-xs uppercase tracking-wide text-slate-400">
                      {field.label}
                    </span>
                    <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2">
                      {field.prefix && <span className="text-slate-500">{field.prefix}</span>}
                      <input
                        type="number"
                        step={field.step}
                        value={getValue(field.path) ?? ''}
                        onChange={handleNumberChange(field.path)}
                        className="w-full bg-transparent text-white outline-none"
                      />
                      {field.suffix && <span className="text-slate-500">{field.suffix}</span>}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-300">
              Conventional DSCR Refi
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {[
                { label: 'DSCR Target', path: 'dscrRefi.dscrTarget', step: 0.05 },
                { label: 'Max LTV %', path: 'dscrRefi.maxLtvPercent', suffix: '%', step: 1 },
                { label: 'Rate %', path: 'dscrRefi.ratePercent', suffix: '%', step: 0.1 },
                { label: 'Term (years)', path: 'dscrRefi.termYears', step: 1 },
                { label: 'Amortization (years)', path: 'dscrRefi.amortYears', step: 1 },
                { label: 'Closing Costs %', path: 'dscrRefi.closingCostsPercent', suffix: '%', step: 0.1 },
                { label: 'Refi Fees $', path: 'dscrRefi.fees', prefix: '$', step: 250 },
              ].map((field) => (
                <label key={field.path} className="text-sm text-slate-300">
                  <span className="text-xs uppercase tracking-wide text-slate-400">
                    {field.label}
                  </span>
                  <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2">
                    {field.prefix && <span className="text-slate-500">{field.prefix}</span>}
                    <input
                      type="number"
                      step={field.step}
                      value={getValue(field.path) ?? ''}
                      onChange={handleNumberChange(field.path)}
                      className="w-full bg-transparent text-white outline-none"
                    />
                    {field.suffix && <span className="text-slate-500">{field.suffix}</span>}
                  </div>
                </label>
              ))}
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={model.dscrRefi.prepayPenalty}
                onChange={handleCheckboxChange('dscrRefi.prepayPenalty')}
              />
              Prepayment penalty applies
            </label>
          </div>

          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-300">
              All-Cash Options
            </p>
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={model.allCash.takeRefi}
                onChange={handleCheckboxChange('allCash.takeRefi')}
              />
              Take DSCR refi after stabilization
            </label>
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-6">
          {scenarioTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                activeTab === tab.key
                  ? 'border-brrr-cyan/60 bg-brrr-cyan/10 text-white'
                  : 'border-white/10 bg-slate-900/50 text-slate-300 hover:border-brrr-cyan/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <div className="space-y-4">
            <ScenarioCard scenario={calculation.scenarios.hardMoney} />
            <ScenarioCard
              scenario={calculation.scenarios.investorActive}
            />
            <ScenarioCard scenario={calculation.scenarios.allCash} />
          </div>
        </div>
      </div>

      {activeScenario.badges.dscrFail && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          <AlertTriangle size={18} />
          DSCR shortfall of {activeScenario.badges.dscrShortfall.toFixed(2)}.
          Max DSCR-compliant loan is{' '}
          {formatCurrency(activeScenario.maxLoanByDscr)}.
        </div>
      )}
      {model.dscrRefi.prepayPenalty && (
        <p className="mt-4 flex items-center gap-2 text-xs uppercase tracking-wide text-amber-200">
          <AlertTriangle size={14} />
          Note: Prepayment penalty toggle is ON for DSCR refi (display only).
        </p>
      )}

      <div
        ref={pdfRef}
        style={{ position: 'absolute', left: '-9999px', top: 0 }}
        className="w-[900px]"
      >
        <div className="min-h-screen bg-slate-950 text-white">
          <div className="bg-gradient-to-r from-brrr-cyan via-brrr-purple to-slate-900 p-12 text-center text-white">
            <h1 className="text-4xl font-bold">{residence.propertyAddress}</h1>
            <p className="mt-2 text-lg uppercase tracking-[0.3em]">
              BRRR Strategy Report
            </p>
            <p className="mt-4 text-sm uppercase tracking-widest text-white/70">
              {new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="grid gap-6 p-12">
            {[calculation.scenarios.hardMoney, calculation.scenarios.investorActive, calculation.scenarios.allCash].map(
              (scenario) => (
                <div key={scenario.scenario} className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                      {scenarioTitle[scenario.scenario] || scenario.scenario}
                    </h2>
                    <BadgeCheck className="text-brrr-cyan" />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Total Project Cost</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(scenario.totalProjectCost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">NOI</p>
                      <p className="text-lg font-semibold">{formatCurrency(scenario.noi)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Refi Proceeds</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(scenario.refiProceeds)} ({scenario.refiConstraint})
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Monthly P&I</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(scenario.monthlyPAndI)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">DSCR</p>
                      <p className="text-lg font-semibold">
                        {formatRatio(scenario.actualDscr)} / {scenario.dscrTarget}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Sponsor Cash In</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(scenario.sponsorCashIn)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Cash Left In</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(scenario.cashLeftIn)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Equity Created</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(scenario.equityCreated)}
                      </p>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
