import React from 'react';
import { InputField, SectionCard } from '../components/Controls';
import { PurchaseFinancing, RehabFinancing, RefiFinancing } from '../types';
import { useBrrrr } from '../state';

const FinancingTab = () => {
  const { state, update } = useBrrrr();
  const { purchaseFinancing, rehabFinancing, refiFinancing } = state;

  const handlePurchaseChange = <K extends keyof PurchaseFinancing>(key: K, value: PurchaseFinancing[K]) =>
    update('purchaseFinancing', { [key]: value });
  const handleRehabChange = <K extends keyof RehabFinancing>(key: K, value: RehabFinancing[K]) =>
    update('rehabFinancing', { [key]: value });
  const handleRefiChange = <K extends keyof RefiFinancing>(key: K, value: RefiFinancing[K]) =>
    update('refiFinancing', { [key]: value });

  return (
    <div className="space-y-6">
      <SectionCard title="Purchase / Bridge">
        <div className="flex items-center gap-3">
          <input
            id="useHardMoney"
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brrr-cyan focus:ring-brrr-cyan"
            checked={purchaseFinancing.useHardMoney}
            onChange={(e) => handlePurchaseChange('useHardMoney', e.target.checked)}
          />
          <label htmlFor="useHardMoney" className="text-sm text-slate-200">
            Use hard money / bridge financing
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Purchase LTV (%)"
            type="number"
            value={purchaseFinancing.purchaseLTV}
            onChange={(v) => handlePurchaseChange('purchaseLTV', (v as number) || 0)}
          />
          <InputField
            label="Rate (%)"
            type="number"
            step={0.01}
            value={purchaseFinancing.interestRate}
            onChange={(v) => handlePurchaseChange('interestRate', (v as number) || 0)}
          />
          <InputField
            label="Term (months)"
            type="number"
            value={purchaseFinancing.termMonths}
            onChange={(v) => handlePurchaseChange('termMonths', (v as number) || 0)}
          />
          <InputField
            label="Points (%)"
            type="number"
            value={purchaseFinancing.pointsPercent}
            onChange={(v) => handlePurchaseChange('pointsPercent', (v as number) || 0)}
          />
          <InputField
            label="Lender Fees"
            type="number"
            value={purchaseFinancing.lenderFees}
            onChange={(v) => handlePurchaseChange('lenderFees', (v as number) || 0)}
          />
        </div>
      </SectionCard>

      <SectionCard title="Rehab Financing">
        <div className="flex items-center gap-3">
          <input
            id="rehabFinanced"
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brrr-purple focus:ring-brrr-purple"
            checked={rehabFinancing.financed}
            onChange={(e) => handleRehabChange('financed', e.target.checked)}
          />
          <label htmlFor="rehabFinanced" className="text-sm text-slate-200">
            Finance rehab budget
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="LTC on Rehab (%)"
            type="number"
            value={rehabFinancing.rehabLTC}
            onChange={(v) => handleRehabChange('rehabLTC', (v as number) || 0)}
            helper="Percent of rehab cost financed"
          />
          <InputField
            label="Rate (%)"
            type="number"
            step={0.01}
            value={rehabFinancing.interestRate}
            onChange={(v) => handleRehabChange('interestRate', (v as number) || 0)}
          />
          <InputField
            label="Term (months)"
            type="number"
            value={rehabFinancing.termMonths}
            onChange={(v) => handleRehabChange('termMonths', (v as number) || 0)}
          />
          <InputField
            label="Points (%)"
            type="number"
            value={rehabFinancing.pointsPercent}
            onChange={(v) => handleRehabChange('pointsPercent', (v as number) || 0)}
          />
          <InputField
            label="Lender Fees"
            type="number"
            value={rehabFinancing.lenderFees}
            onChange={(v) => handleRehabChange('lenderFees', (v as number) || 0)}
          />
        </div>
      </SectionCard>

      <SectionCard title="Refinance">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="ARV"
            type="number"
            value={refiFinancing.arv}
            onChange={(v) => handleRefiChange('arv', (v as number) || 0)}
          />
          <InputField
            label="Refi LTV (%)"
            type="number"
            value={refiFinancing.refiLTV}
            onChange={(v) => handleRefiChange('refiLTV', (v as number) || 0)}
          />
          <InputField
            label="Rate (%)"
            type="number"
            step={0.01}
            value={refiFinancing.interestRate}
            onChange={(v) => handleRefiChange('interestRate', (v as number) || 0)}
          />
          <InputField
            label="Term (years)"
            type="number"
            value={refiFinancing.termYears}
            onChange={(v) => handleRefiChange('termYears', (v as number) || 0)}
          />
          <InputField
            label="Closing Costs"
            type="number"
            value={refiFinancing.closingCosts}
            onChange={(v) => handleRefiChange('closingCosts', (v as number) || 0)}
          />
          <InputField
            label="Seasoning (months)"
            type="number"
            value={refiFinancing.seasoningMonths}
            onChange={(v) => handleRefiChange('seasoningMonths', (v as number) || 0)}
          />
        </div>
      </SectionCard>
    </div>
  );
};

export default FinancingTab;
