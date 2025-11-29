import React, { useState } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import HardMoneyToDscrAnalyzer from './components/HardMoneyToDscrAnalyzer';
import AcquisitionRehabTab from './features/brrr/tabs/AcquisitionRehabTab';
import FinancingTab from './features/brrr/tabs/FinancingTab';
import PropertyOwnerTab from './features/brrr/tabs/PropertyOwnerTab';
import ResultsTab from './features/brrr/tabs/ResultsTab';
import RentalOpsPanel from './features/brrr/tabs/RentalOpsPanel';
import { BrrrrProvider, useBrrrr } from './features/brrr/state';
import { TabButton } from './features/brrr/components/Controls';
import { db } from './firebase.js';
import './BrrrApp.css';

type TabKey = 'property' | 'acquisition' | 'financing' | 'results' | 'quickScreen';
type BrrrAppProps = { residence?: { id: string } };

const tabs: { key: TabKey; label: string }[] = [
  { key: 'property', label: 'Property & Owner' },
  { key: 'acquisition', label: 'Acquisition & Rehab' },
  { key: 'financing', label: 'Financing' },
  { key: 'results', label: 'Results' },
  { key: 'quickScreen', label: 'BRRRR Quick Screen' },
];

const BrrrShell = ({ residence }: BrrrAppProps) => {
  const [tab, setTab] = useState<TabKey>('property');
  const [isSaving, setIsSaving] = useState(false);
  const { state } = useBrrrr();

  const handleSave = async () => {
    setIsSaving(true);
    if (!residence?.id) {
      alert('No residence profile is being edited. Cannot save.');
      setIsSaving(false);
      return;
    }

    try {
      const residenceRef = doc(db, 'residences', residence.id);
      const dataToSave = { brrrAnalysis: state, updatedAt: serverTimestamp() };
      await updateDoc(residenceRef, dataToSave);
      alert('BRRR analysis saved to the residence profile!');
    } catch (error) {
      console.error('Error saving BRRR profile:', error);
      alert(`Error saving profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="brrr-shell min-h-screen text-slate-50">
      <header className="bg-slate-900/60 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="text-sm font-semibold text-brrr-cyan uppercase tracking-wide mb-1">BRRR Analyzer</p>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Buy · Rehab · Rent · Refinance · Repeat</h1>
              <p className="text-sm text-slate-300 mt-1">Typed, tabbed, and ready for quick scenario work.</p>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving || !residence}
              className="ml-4 whitespace-nowrap rounded-lg bg-brrr-cyan px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brrr-cyan/90 disabled:bg-slate-700 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {tabs.map((t) => (
              <TabButton key={t.key} label={t.label} active={tab === t.key} onClick={() => setTab(t.key)} />
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {tab === 'property' && <PropertyOwnerTab />}
        {tab === 'acquisition' && (
          <>
            <AcquisitionRehabTab />
            <RentalOpsPanel />
          </>
        )}
        {tab === 'financing' && <FinancingTab />}
        {tab === 'results' && (
          <>
            <ResultsTab />
            <RentalOpsPanel />
          </>
        )}
        {tab === 'quickScreen' && (
          <div className="-mx-4 sm:-mx-6 lg:-mx-8">
            <HardMoneyToDscrAnalyzer />
          </div>
        )}

        {tab !== 'quickScreen' && (
          <div className="rounded-xl brrr-summary bg-white/5 p-4 text-sm text-slate-200">
            <p className="font-semibold text-white">Current summary</p>
            <p>
              Property: {state.propertyProfile.address} · Purchase ${' '}
              {state.acquisitionRehab.purchasePrice.toLocaleString()} · ARV ${' '}
              {state.refiFinancing.arv.toLocaleString()}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default function BrrrAppWrapped({ residence }: BrrrAppProps) {
  return (
    <BrrrrProvider residence={residence}>
      <BrrrShell residence={residence} />
    </BrrrrProvider>
  );
}
