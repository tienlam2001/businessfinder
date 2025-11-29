import React from 'react';
import { InputField, SectionCard } from '../components/Controls';
import { PropertyProfile, OwnerProfile } from '../types';
import { useBrrrr } from '../state';

const PropertyOwnerTab = () => {
  const { state, update } = useBrrrr();
  const { propertyProfile, ownerProfile } = state;

  const handlePropertyChange = <K extends keyof PropertyProfile>(key: K, value: PropertyProfile[K]) =>
    update('propertyProfile', { [key]: value });
  const handleOwnerChange = <K extends keyof OwnerProfile>(key: K, value: OwnerProfile[K]) =>
    update('ownerProfile', { [key]: value });

  return (
    <div className="space-y-6">
      <SectionCard title="Property Info">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Address" value={propertyProfile.address} onChange={(v) => handlePropertyChange('address', v as string)} />
          <label className="block">
            <span className="text-sm font-medium text-slate-200">Property Type</span>
            <select
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm shadow-sm focus:border-brrr-cyan focus:outline-none focus:ring-2 focus:ring-brrr-cyan/30 text-slate-100"
              value={propertyProfile.propertyType}
              onChange={(e) => handlePropertyChange('propertyType', e.target.value as PropertyProfile['propertyType'])}
            >
              <option value="SFH">SFH</option>
              <option value="Duplex">Duplex</option>
              <option value="Triplex">Triplex</option>
              <option value="Fourplex">Fourplex</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <InputField
            label="Year Built"
            type="number"
            value={propertyProfile.yearBuilt}
            onChange={(v) => handlePropertyChange('yearBuilt', v === '' ? undefined : (v as number))}
          />
          <InputField
            label="Square Feet"
            type="number"
            value={propertyProfile.squareFeet}
            onChange={(v) => handlePropertyChange('squareFeet', v === '' ? undefined : (v as number))}
          />
          <InputField
            label="Lot Size (sq ft)"
            type="number"
            value={propertyProfile.lotSizeSqFt}
            onChange={(v) => handlePropertyChange('lotSizeSqFt', v === '' ? undefined : (v as number))}
          />
          <InputField
            label="Beds"
            type="number"
            value={propertyProfile.beds}
            onChange={(v) => handlePropertyChange('beds', v === '' ? undefined : (v as number))}
          />
          <InputField
            label="Baths"
            type="number"
            value={propertyProfile.baths}
            onChange={(v) => handlePropertyChange('baths', v === '' ? undefined : (v as number))}
          />
          <InputField
            label="ARV Estimate"
            type="number"
            value={propertyProfile.arvEstimate}
            onChange={(v) => handlePropertyChange('arvEstimate', v === '' ? undefined : (v as number))}
          />
        </div>
      </SectionCard>

      <SectionCard title="Owner Info">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Owner Name" value={ownerProfile.ownerName} onChange={(v) => handleOwnerChange('ownerName', v as string)} />
          <InputField label="LLC Name" value={ownerProfile.ownerLLCName} onChange={(v) => handleOwnerChange('ownerLLCName', v as string)} />
          <InputField
            label="Mailing Address"
            value={ownerProfile.ownerMailingAddress}
            onChange={(v) => handleOwnerChange('ownerMailingAddress', v as string)}
          />
          <InputField label="Phone" value={ownerProfile.ownerPhone} onChange={(v) => handleOwnerChange('ownerPhone', v as string)} />
          <InputField label="Email" value={ownerProfile.ownerEmail} onChange={(v) => handleOwnerChange('ownerEmail', v as string)} type="text" />
          <InputField
            label="Info Source"
            value={ownerProfile.infoSource}
            onChange={(v) => handleOwnerChange('infoSource', v as string)}
            placeholder="public record, skip tracing, etc."
          />
        </div>
      </SectionCard>
    </div>
  );
};

export default PropertyOwnerTab;
