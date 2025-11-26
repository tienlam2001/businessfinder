import React, { useMemo, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import PropertyForm from './components/PropertyForm';
import RentRollGrid from './components/RentRollGrid';
import ExpensesForm from './components/ExpensesForm';
import DebtForm from './components/DebtForm';
import ScenarioSelector from './components/ScenarioSelector';
import OutputSummary from './components/OutputSummary';
import CashflowTable from './components/CashflowTable';
import ValueAddForm from './components/ValueAddForm';
import StabilizedCashflowTable from './components/StabilizedCashflowTable';
import runUnderwriting from './utils/underwritingEngine';

const initialModel = {
  property: {
    name: '',
    address: '',
    glaSqft: 0,
    purchasePrice: 0,
    vacancyRatePct: 5,
    holdPeriodYears: 10,
  },

  tenants: [
    {
      id: 't-1',
      name: '',
      sqft: 0,
      baseRentPsfYear: 0,
      annualEscalationPct: 2,
      leaseTermYears: 5,
      startYear: 1,
      leaseType: 'NNN',
    },
  ],

  expenses: {
    taxes: 0,
    insurance: 0,
    repairsMaintenance: 0,
    utilities: 0,
    managementPctOfEGI: 4,
    otherExpenses: 0,
  },

  debt: {
    interestRatePct: 7,
    amortYears: 25,
    ioYears: 0,
    ltvPct: 70,
    dscrMin: 1.25,
  },

  valueAdd: {
    rehabBudget: 0,
    rehabMonths: 6,
    newRents: [],
    ownerUser: {
      useOwnerUser: false,
      sqft: 0,
      marketRentPsf: 0,
      internalRentPsf: 0,
      buildOutCost: 0,
      openMonth: 1,
    },
    exitCapRate: 7,
    refinanceMonth: 18,
    refinanceCostsPct: 3,
  },

  scenarios: {
    activeKey: 'base',
    base: { rentGrowthAdjPct: 0, expenseGrowthAdjPct: 0, vacancyAdjPct: 0 },
    downside: { rentGrowthAdjPct: -10, expenseGrowthAdjPct: 10, vacancyAdjPct: 5 },
    upside: { rentGrowthAdjPct: 5, expenseGrowthAdjPct: -5, vacancyAdjPct: -2 },
  },
};

export default function CreUnderwritingPage() {
  const [model, setModel] = useState(initialModel);
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: model.property.name ? `CRE Underwriting - ${model.property.name}` : 'CRE Underwriting',
  });

  const updateProperty = (patch) => {
    setModel((prev) => ({ ...prev, property: { ...prev.property, ...patch } }));
  };

  const updateExpenses = (patch) => {
    setModel((prev) => ({ ...prev, expenses: { ...prev.expenses, ...patch } }));
  };

  const updateDebt = (patch) => {
    setModel((prev) => ({ ...prev, debt: { ...prev.debt, ...patch } }));
  };

  const updateScenarios = (patch) => {
    setModel((prev) => ({
      ...prev,
      scenarios: {
        ...prev.scenarios,
        ...patch,
        base: { ...prev.scenarios.base, ...(patch.base || {}) },
        downside: { ...prev.scenarios.downside, ...(patch.downside || {}) },
        upside: { ...prev.scenarios.upside, ...(patch.upside || {}) },
      },
    }));
  };

  const updateTenants = (nextTenants) => {
    setModel((prev) => ({ ...prev, tenants: nextTenants }));
  };

  const updateValueAdd = (patch) => {
    setModel((prev) => ({
      ...prev,
      valueAdd: {
        ...prev.valueAdd,
        ...patch,
        newRents: patch.newRents !== undefined ? patch.newRents : prev.valueAdd.newRents,
        ownerUser: { ...prev.valueAdd.ownerUser, ...(patch.ownerUser || {}) },
      },
    }));
  };

  const results = useMemo(() => runUnderwriting(model), [model]);
  const activeScenarioKey = model.scenarios.activeKey;
  const scenarioResult = results[activeScenarioKey] || { summary: {}, cashflows: [] };
  const valueAddResult = results.valueAdd || {};

  return (
    <div className="cre-underwriting-page">
      <div className="cre-toolbar">
        <div>
          <h2 style={{ margin: 0 }}>CRE Underwriting</h2>
          <p className="section-subtitle" style={{ marginTop: 4 }}>
            Save to PDF or tweak assumptions on the fly.
          </p>
        </div>
        <button className="btn-modern" type="button" onClick={handlePrint}>
          Save as PDF
        </button>
      </div>

      <div className="print-container" ref={printRef}>
        <div className="cre-grid two-col">
          <PropertyForm property={model.property} onChange={updateProperty} />
          <DebtForm debt={model.debt} onChange={updateDebt} />
        </div>

        <ValueAddForm valueAdd={model.valueAdd} onChange={updateValueAdd} />

        <div className="glass-card">
          <RentRollGrid tenants={model.tenants} onChange={updateTenants} />
        </div>

        <div className="cre-grid two-col">
          <ExpensesForm expenses={model.expenses} onChange={updateExpenses} />
          <ScenarioSelector scenarios={model.scenarios} onChange={updateScenarios} />
        </div>

        <OutputSummary
          scenarioResult={scenarioResult}
          valueAddResult={valueAddResult}
          model={model}
          activeScenarioKey={activeScenarioKey}
        />
        <CashflowTable scenarioResult={scenarioResult} />
        <StabilizedCashflowTable valueAddResult={valueAddResult} />
      </div>
    </div>
  );
}
