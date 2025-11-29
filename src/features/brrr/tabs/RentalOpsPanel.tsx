import React from 'react';
import { InputField, SectionCard } from '../components/Controls';
import { RentalOps } from '../types';
import { useBrrrr } from '../state';

const RentalOpsPanel = () => {
  const { state, update } = useBrrrr();
  const { rentalOps } = state;
  const handleChange = <K extends keyof RentalOps>(key: K, value: RentalOps[K]) => update('rentalOps', { [key]: value });

  return (
    <SectionCard title="Rental & Operations">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InputField
          label="Market Rent"
          type="number"
          value={rentalOps.marketRent}
          onChange={(v) => handleChange('marketRent', (v as number) || 0)}
        />
        <InputField
          label="Vacancy (%)"
          type="number"
          value={rentalOps.vacancyRate}
          onChange={(v) => handleChange('vacancyRate', (v as number) || 0)}
        />
        <InputField
          label="Taxes (annual)"
          type="number"
          value={rentalOps.taxesAnnual}
          onChange={(v) => handleChange('taxesAnnual', (v as number) || 0)}
        />
        <InputField
          label="Insurance (annual)"
          type="number"
          value={rentalOps.insuranceAnnual}
          onChange={(v) => handleChange('insuranceAnnual', (v as number) || 0)}
        />
        <InputField
          label="Maintenance (% rent)"
          type="number"
          value={rentalOps.maintenancePercent}
          onChange={(v) => handleChange('maintenancePercent', (v as number) || 0)}
        />
        <InputField
          label="CapEx (% rent)"
          type="number"
          value={rentalOps.capexPercent}
          onChange={(v) => handleChange('capexPercent', (v as number) || 0)}
        />
        <InputField
          label="Management (% rent)"
          type="number"
          value={rentalOps.managementPercent}
          onChange={(v) => handleChange('managementPercent', (v as number) || 0)}
        />
        <InputField
          label="HOA (monthly)"
          type="number"
          value={rentalOps.hoaMonthly}
          onChange={(v) => handleChange('hoaMonthly', (v as number) || 0)}
        />
        <InputField
          label="Owner Paid Utilities (monthly)"
          type="number"
          value={rentalOps.utilitiesMonthlyOwnerPaid}
          onChange={(v) => handleChange('utilitiesMonthlyOwnerPaid', (v as number) || 0)}
        />
      </div>
    </SectionCard>
  );
};

export default RentalOpsPanel;
