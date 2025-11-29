import React, { useMemo } from 'react';
import { CostInputField, InputField, SectionCard } from '../components/Controls';
import { AcquisitionRehab } from '../types';
import { calculateAllInCosts, calculateTotalRehab } from '../calculations';
import { useBrrrr } from '../state';

const AcquisitionRehabTab = () => {
  const { state, update } = useBrrrr();
  const { acquisitionRehab } = state;
  const rehabSummary = useMemo(() => calculateTotalRehab(acquisitionRehab), [acquisitionRehab]);
  const allIn = useMemo(() => calculateAllInCosts(state), [state]);

  const handleChange = <K extends keyof AcquisitionRehab>(key: K, value: AcquisitionRehab[K]) =>
    update('acquisitionRehab', { [key]: value });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <SectionCard title="Acquisition Costs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Purchase Price"
              type="number"
              value={acquisitionRehab.purchasePrice}
              onChange={(v) => handleChange('purchasePrice', (v as number) || 0)}
            />
            <CostInputField
              label="Earnest Money"
              mode={acquisitionRehab.earnestMoneyMode}
              percentValue={acquisitionRehab.earnestMoneyPercent}
              absoluteValue={acquisitionRehab.earnestMoneyAbsolute}
              purchasePrice={acquisitionRehab.purchasePrice}
              onModeChange={(m) => handleChange('earnestMoneyMode', m)}
              onPercentChange={(v) => handleChange('earnestMoneyPercent', v)}
              onAbsoluteChange={(v) => handleChange('earnestMoneyAbsolute', v)}
            />
            <CostInputField
              label="Inspection Cost"
              mode={acquisitionRehab.inspectionCostMode}
              percentValue={acquisitionRehab.inspectionCostPercent}
              absoluteValue={acquisitionRehab.inspectionCostAbsolute}
              purchasePrice={acquisitionRehab.purchasePrice}
              onModeChange={(m) => handleChange('inspectionCostMode', m)}
              onPercentChange={(v) => handleChange('inspectionCostPercent', v)}
              onAbsoluteChange={(v) => handleChange('inspectionCostAbsolute', v)}
            />
            <CostInputField
              label="Appraisal Cost"
              mode={acquisitionRehab.appraisalCostMode}
              percentValue={acquisitionRehab.appraisalCostPercent}
              absoluteValue={acquisitionRehab.appraisalCostAbsolute}
              purchasePrice={acquisitionRehab.purchasePrice}
              onModeChange={(m) => handleChange('appraisalCostMode', m)}
              onPercentChange={(v) => handleChange('appraisalCostPercent', v)}
              onAbsoluteChange={(v) => handleChange('appraisalCostAbsolute', v)}
            />
            <CostInputField
              label="Closing Costs"
              mode={acquisitionRehab.closingCostsMode}
              percentValue={acquisitionRehab.closingCostsPercent}
              absoluteValue={acquisitionRehab.closingCostsAbsolute}
              purchasePrice={acquisitionRehab.purchasePrice}
              onModeChange={(m) => handleChange('closingCostsMode', m)}
              onPercentChange={(v) => handleChange('closingCostsPercent', v)}
              onAbsoluteChange={(v) => handleChange('closingCostsAbsolute', v)}
            />
            <CostInputField
              label="Realtor Fees"
              mode={acquisitionRehab.realtorFeesMode}
              percentValue={acquisitionRehab.realtorFeesPercent}
              absoluteValue={acquisitionRehab.realtorFeesAbsolute}
              purchasePrice={acquisitionRehab.purchasePrice}
              onModeChange={(m) => handleChange('realtorFeesMode', m)}
              onPercentChange={(v) => handleChange('realtorFeesPercent', v)}
              onAbsoluteChange={(v) => handleChange('realtorFeesAbsolute', v)}
            />
          </div>
        </SectionCard>

        <SectionCard title="Rehab Budget">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Exterior"
              type="number"
              value={acquisitionRehab.rehabExterior}
              onChange={(v) => handleChange('rehabExterior', (v as number) || 0)}
            />
            <InputField
              label="Interior"
              type="number"
              value={acquisitionRehab.rehabInterior}
              onChange={(v) => handleChange('rehabInterior', (v as number) || 0)}
            />
            <InputField
              label="Kitchen"
              type="number"
              value={acquisitionRehab.rehabKitchen}
              onChange={(v) => handleChange('rehabKitchen', (v as number) || 0)}
            />
            <InputField
              label="Baths"
              type="number"
              value={acquisitionRehab.rehabBaths}
              onChange={(v) => handleChange('rehabBaths', (v as number) || 0)}
            />
            <InputField
              label="HVAC"
              type="number"
              value={acquisitionRehab.rehabHVAC}
              onChange={(v) => handleChange('rehabHVAC', (v as number) || 0)}
            />
            <InputField
              label="Electrical"
              type="number"
              value={acquisitionRehab.rehabElectrical}
              onChange={(v) => handleChange('rehabElectrical', (v as number) || 0)}
            />
            <InputField
              label="Plumbing"
              type="number"
              value={acquisitionRehab.rehabPlumbing}
              onChange={(v) => handleChange('rehabPlumbing', (v as number) || 0)}
            />
            <InputField
              label="Windows & Doors"
              type="number"
              value={acquisitionRehab.rehabWindowsDoors}
              onChange={(v) => handleChange('rehabWindowsDoors', (v as number) || 0)}
            />
            <InputField
              label="Appliances"
              type="number"
              value={acquisitionRehab.rehabAppliances}
              onChange={(v) => handleChange('rehabAppliances', (v as number) || 0)}
            />
            <InputField
              label="Permits"
              type="number"
              value={acquisitionRehab.rehabPermits}
              onChange={(v) => handleChange('rehabPermits', (v as number) || 0)}
            />
            <InputField
              label="Landscaping"
              type="number"
              value={acquisitionRehab.rehabLandscaping}
              onChange={(v) => handleChange('rehabLandscaping', (v as number) || 0)}
            />
            <InputField
              label="Miscellaneous"
              type="number"
              value={acquisitionRehab.rehabMisc}
              onChange={(v) => handleChange('rehabMisc', (v as number) || 0)}
            />
            <InputField
              label="Contingency (%)"
              type="number"
              value={acquisitionRehab.rehabOveragePercent}
              onChange={(v) => handleChange('rehabOveragePercent', (v as number) || 0)}
              helper="Applied to rehab subtotal"
            />
            <InputField
              label="Timeline (days)"
              type="number"
              value={acquisitionRehab.rehabTimelineDays}
              onChange={(v) => handleChange('rehabTimelineDays', (v as number) || 0)}
            />
          </div>
        </SectionCard>
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-xl shadow-lg p-4 space-y-3 border border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-200">Rehab Total</span>
            <strong>${rehabSummary.rehabTotal.toLocaleString()}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-200">Rehab + Contingency</span>
            <strong>${Math.round(rehabSummary.rehabWithContingency).toLocaleString()}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-200">Projected All-In</span>
            <strong>${Math.round(allIn).toLocaleString()}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcquisitionRehabTab;
