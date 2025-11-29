import React from 'react';

type InputProps = {
  label: string;
  value: string | number | undefined;
  onChange: (value: number | string) => void;
  type?: 'text' | 'number';
  step?: number;
  placeholder?: string;
  helper?: string;
};

export const InputField = ({
  label,
  value,
  onChange,
  type = 'text',
  step,
  placeholder,
  helper,
}: InputProps) => (
  <label className="block">
    <span className="text-sm font-medium text-slate-200">{label}</span>
    <input
      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm shadow-sm focus:border-brrr-cyan focus:outline-none focus:ring-2 focus:ring-brrr-cyan/30"
      type={type}
      value={value ?? ''}
      step={step}
      placeholder={placeholder}
      onChange={(e) => {
        const raw = e.target.value;
        if (type === 'number') {
          const parsed = Number(raw);
          onChange(Number.isFinite(parsed) ? parsed : 0);
        } else {
          onChange(raw);
        }
      }}
      min={type === 'number' ? 0 : undefined}
    />
    {helper && <span className="mt-1 block text-xs text-slate-400">{helper}</span>}
  </label>
);

export const SectionCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="brrr-card bg-slate-900/60 rounded-xl shadow-sm border border-slate-800 p-4 md:p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-slate-50">{title}</h3>
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

export const TabButton = ({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) => (
  <button
    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
      active ? 'bg-brrr-cyan/20 text-white border border-brrr-cyan/40 shadow-[0_0_25px_rgba(6,182,212,0.25)]' : 'text-slate-300 hover:text-white border border-transparent'
    }`}
    onClick={onClick}
    type="button"
  >
    {label}
  </button>
);

type CostInputProps = {
  label: string;
  mode: 'percent' | 'dollar';
  percentValue: number;
  absoluteValue: number;
  purchasePrice: number;
  onModeChange: (mode: 'percent' | 'dollar') => void;
  onPercentChange: (value: number) => void;
  onAbsoluteChange: (value: number) => void;
};

export const CostInputField = ({
  label,
  mode,
  percentValue,
  absoluteValue,
  purchasePrice,
  onModeChange,
  onPercentChange,
  onAbsoluteChange,
}: CostInputProps) => {
  const estimatedValue = mode === 'percent' ? purchasePrice * (percentValue / 100) : absoluteValue;

  return (
    <div className="block">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <div className="flex items-center gap-2 mt-1">
        <div className="flex rounded-lg border border-slate-700 p-0.5 bg-slate-900/60">
          <button
            type="button"
            onClick={() => onModeChange('percent')}
            className={`px-2 py-1 text-xs rounded-md ${mode === 'percent' ? 'bg-slate-800 text-slate-50' : 'text-slate-400 hover:bg-slate-800/70'}`}
          >
            %
          </button>
          <button
            type="button"
            onClick={() => onModeChange('dollar')}
            className={`px-2 py-1 text-xs rounded-md ${mode === 'dollar' ? 'bg-slate-800 text-slate-50' : 'text-slate-400 hover:bg-slate-800/70'}`}
          >
            $
          </button>
        </div>
        <input
          className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm shadow-sm focus:border-brrr-cyan focus:outline-none focus:ring-2 focus:ring-brrr-cyan/30"
          type="number"
          step={mode === 'percent' ? 0.1 : 1}
          value={mode === 'percent' ? percentValue : absoluteValue}
          onChange={(e) => (mode === 'percent' ? onPercentChange(Number(e.target.value)) : onAbsoluteChange(Number(e.target.value)))}
        />
      </div>
      <span className="mt-1 block text-xs text-slate-400">Est: ${Math.round(estimatedValue).toLocaleString()}</span>
    </div>
  );
};
