import { useEffect, useMemo, useState } from 'react';
import {
  Calculator,
  Save,
  AlertTriangle,
  ArrowRightCircle,
  DollarSign,
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  buildFlipModel,
  createDefaultFlipInputs,
  mergeFlipInputs,
} from '../flip';

const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `$${Number(value).toLocaleString()}`;
};

const percent = (value, decimals = 1) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${(Number(value) * 100).toFixed(decimals)}%`;
};

const useFlipModel = (residence) => {
  const [model, setModel] = useState(() =>
    mergeFlipInputs(residence?.flipModel, createDefaultFlipInputs()),
  );
  useEffect(() => {
    setModel(mergeFlipInputs(residence?.flipModel, createDefaultFlipInputs()));
  }, [residence]);
  return [model, setModel];
};

export default function FlipCalculator({ residence }) {
  const [model, setModel] = useFlipModel(residence);
  const [sensitivity, setSensitivity] = useState({
    arvPercent: 0,
    holdingDelta: 0,
    sellingCostDelta: 0,
  });
  const [saveState, setSaveState] = useState('idle');

  const result = useMemo(
    () => buildFlipModel(model, sensitivity),
    [model, sensitivity],
  );

  const handleSharedChange = (field) => (event) => {
    const value = Number(event.target.value);
    setModel((prev) => ({
      ...prev,
      shared: { ...prev.shared, [field]: Number.isFinite(value) ? value : 0 },
    }));
  };

  const handleFinancingChange = (path) => (event) => {
    const value = Number(event.target.value);
    setModel((prev) => {
      const next = { ...prev, financing: { ...prev.financing } };
      const [section, field] = path.split('.');
      next.financing[section] = {
        ...next.financing[section],
        [field]: Number.isFinite(value) ? value : 0,
      };
      return next;
    });
  };

  const setFundingMode = (mode) => {
    setModel((prev) => ({
      ...prev,
      financing: { ...prev.financing, mode },
    }));
  };

  const handleSensitivityChange = (field) => (event) => {
    const value = Number(event.target.value);
    setSensitivity((prev) => ({ ...prev, [field]: Number.isFinite(value) ? value : 0 }));
  };

  const handleSave = async () => {
    try {
      setSaveState('saving');
      await updateDoc(doc(db, 'residences', residence.id), {
        flipModel: model,
      });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch (error) {
      console.error(error);
      setSaveState('error');
    }
  };

  const { metrics, derived } = result;
  const isInvestor = model.financing.mode === 'investor';

  return (
    <section className="mt-10 rounded-3xl border border-white/10 bg-slate-950/60 p-6 text-white shadow-2xl shadow-black/40">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Flip Disposition Modeling
          </p>
          <h2 className="text-2xl font-semibold">Flip Calculator</h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="btn-modern"
            disabled={saveState === 'saving'}
          >
            <Save size={16} />
            {saveState === 'saving'
              ? 'Saving...'
              : saveState === 'saved'
                ? 'Saved'
                : 'Save Model'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Total Cost" value={formatCurrency(metrics.totalCost)} />
        <SummaryCard label="Net Sale Proceeds" value={formatCurrency(metrics.saleNet)} />
        <SummaryCard
          label="Gross Profit"
          value={formatCurrency(metrics.grossProfit)}
          variant="positive"
        />
        <SummaryCard
          label="ROI"
          value={metrics.roi === Infinity ? '∞' : percent(metrics.roi)}
        />
        <SummaryCard
          label="Payback"
          value={
            metrics.paybackMonths ? `${metrics.paybackMonths.toFixed(1)} mo` : '—'
          }
        />
        {isInvestor ? (
          <SummaryCard
            label="Sponsor / Investor"
            value={`${formatCurrency(derived.sponsorShare || 0)} / ${formatCurrency(
              derived.investorShare || 0,
            )}`}
          />
        ) : (
          <SummaryCard
            label="Cash Required"
            value={formatCurrency(derived.sponsorCashIn)}
          />
        )}
      </div>

      {isInvestor && (
        <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
          <AlertTriangle size={16} className="mr-2 inline" />
          Investor split assumes profit share is calculated after legal + pref. Sponsor
          ROI uses legal fees as cash in.
        </div>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <InputGroup title="Flip Inputs" icon={<Calculator size={16} />}>
            <div className="grid gap-4 md:grid-cols-2">
              <LabeledNumber
                label="Purchase Price"
                value={model.shared.purchasePrice}
                onChange={handleSharedChange('purchasePrice')}
              />
              <LabeledNumber
                label="After Repair Value"
                value={model.shared.arv}
                onChange={handleSharedChange('arv')}
              />
              <LabeledNumber
                label="Rehab % of ARV"
                value={model.shared.rehabPctOfARV}
                onChange={handleSharedChange('rehabPctOfARV')}
              />
              <LabeledNumber
                label="Closing % (Purchase)"
                value={model.shared.closingPctPurchase}
                onChange={handleSharedChange('closingPctPurchase')}
              />
              <LabeledNumber
                label="Holding Months"
                value={model.shared.holdingMonths}
                onChange={handleSharedChange('holdingMonths')}
              />
              <LabeledNumber
                label="Selling Costs %"
                value={model.shared.sellingCostPct}
                onChange={handleSharedChange('sellingCostPct')}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <LabeledNumber
                label="Taxes / Yr"
                value={model.shared.taxesAnnual}
                onChange={handleSharedChange('taxesAnnual')}
              />
              <LabeledNumber
                label="Insurance / Yr"
                value={model.shared.insuranceAnnual}
                onChange={handleSharedChange('insuranceAnnual')}
              />
              <LabeledNumber
                label="HOA / Yr"
                value={model.shared.hoaAnnual}
                onChange={handleSharedChange('hoaAnnual')}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <LabeledNumber
                label="Utilities / Mo"
                value={model.shared.utilitiesMonthly}
                onChange={handleSharedChange('utilitiesMonthly')}
              />
              <LabeledNumber
                label="Other Carrying / Mo"
                value={model.shared.otherCarryingMonthly}
                onChange={handleSharedChange('otherCarryingMonthly')}
              />
            </div>
          </InputGroup>

          <InputGroup title="Sensitivity">
            <div className="grid gap-4">
              <SliderRow
                label="ARV"
                value={sensitivity.arvPercent}
                min={-10}
                max={10}
                step={0.5}
                unit="%"
                onChange={handleSensitivityChange('arvPercent')}
              />
              <SliderRow
                label="Holding Months"
                value={sensitivity.holdingDelta}
                min={-6}
                max={6}
                step={1}
                unit=""
                onChange={handleSensitivityChange('holdingDelta')}
              />
              <SliderRow
                label="Selling Cost %"
                value={sensitivity.sellingCostDelta}
                min={-2}
                max={2}
                step={0.1}
                unit="%"
                onChange={handleSensitivityChange('sellingCostDelta')}
              />
            </div>
          </InputGroup>
        </div>

        <div className="space-y-6">
          <InputGroup title="Financing Mode" icon={<ArrowRightCircle size={16} />}>
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'hardMoney', label: 'Hard Money' },
                { key: 'investor', label: 'Investor' },
                { key: 'allCash', label: 'All Cash' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFundingMode(key)}
                  className={`rounded-full border px-4 py-1 text-sm ${
                    model.financing.mode === key
                      ? 'border-emerald-400 bg-emerald-400/10 text-emerald-200'
                      : 'border-white/10 text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {model.financing.mode === 'hardMoney' && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <LabeledNumber
                  label="LTV % on Purchase"
                  value={model.financing.hardMoney.ltvPctOnPurchase}
                  onChange={handleFinancingChange('hardMoney.ltvPctOnPurchase')}
                />
                <LabeledNumber
                  label="Rate APR"
                  value={model.financing.hardMoney.rateAPR}
                  onChange={handleFinancingChange('hardMoney.rateAPR')}
                />
                <LabeledNumber
                  label="Points %"
                  value={model.financing.hardMoney.pointsPct}
                  onChange={handleFinancingChange('hardMoney.pointsPct')}
                />
                <LabeledNumber
                  label="Rehab Financed %"
                  value={model.financing.hardMoney.rehabFinancedPct}
                  onChange={handleFinancingChange('hardMoney.rehabFinancedPct')}
                />
              </div>
            )}

            {model.financing.mode === 'investor' && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <LabeledNumber
                  label="Profit Share %"
                  value={model.financing.investor.profitSharePct}
                  onChange={handleFinancingChange('investor.profitSharePct')}
                />
                <LabeledNumber
                  label="Pref Rate APR"
                  value={model.financing.investor.prefRateAPR}
                  onChange={handleFinancingChange('investor.prefRateAPR')}
                />
                <LabeledNumber
                  label="Legal + Misc ($)"
                  value={model.financing.investor.legalMiscFixed}
                  onChange={handleFinancingChange('investor.legalMiscFixed')}
                />
              </div>
            )}
          </InputGroup>

          <InputGroup title="Cost Breakdown" icon={<DollarSign size={16} />}>
            <dl className="space-y-2 text-sm text-slate-300">
              <Row label="Rehab Budget" value={formatCurrency(derived.rehabCost)} />
              <Row
                label="Closing (Purchase)"
                value={formatCurrency(derived.closingPurchase)}
              />
              <Row label="Carrying" value={formatCurrency(derived.carryingBase)} />
              <Row
                label="Interest & Points"
                value={formatCurrency(derived.financingInterest + derived.financingPoints)}
              />
              <Row label="Cash Needed" value={formatCurrency(derived.sponsorCashIn)} />
            </dl>
          </InputGroup>

          {isInvestor && (
            <InputGroup title="Distributions">
              <dl className="space-y-2 text-sm text-slate-300">
                <Row
                  label="Preferred Accrual"
                  value={formatCurrency(derived.prefAccrual || 0)}
                />
                <Row
                  label="Sponsor Share"
                  value={formatCurrency(derived.sponsorShare || 0)}
                />
                <Row
                  label="Investor Share"
                  value={formatCurrency(derived.investorShare || 0)}
                />
              </dl>
            </InputGroup>
          )}
        </div>
      </div>
    </section>
  );
}

const SummaryCard = ({ label, value, variant = 'neutral' }) => {
  const palette =
    variant === 'positive'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
      : 'border-white/10 bg-white/5 text-white';
  return (
    <div className={`rounded-2xl border p-4 ${palette}`}>
      <p className="text-xs uppercase tracking-wide text-white/70">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
};

const InputGroup = ({ title, icon, children }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-black/30">
    <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
      {icon} {title}
    </div>
    {children}
  </div>
);

const LabeledNumber = ({ label, value, onChange }) => (
  <label className="flex flex-col gap-1 text-sm text-slate-200">
    {label}
    <input
      type="number"
      value={value}
      onChange={onChange}
      className="modern-input"
    />
  </label>
);

const SliderRow = ({ label, value, min, max, step, unit, onChange }) => (
  <label className="flex flex-col gap-1 text-sm text-slate-200">
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="text-slate-400">
        {value}
        {unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
    />
  </label>
);

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <span>{label}</span>
    <span className="font-semibold text-white">{value}</span>
  </div>
);
