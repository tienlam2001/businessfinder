import React, { useMemo } from 'react';
import { useMultifamilyDeal } from '../../store/multifamilyStore';
import { calculateMultifamily } from '../../utils/calculations/multifamily';
import { validateDeal } from '../../utils/validation/multifamilyValidation';
import PropertyForm from './components/PropertyForm';
import UnitMixTable from './components/UnitMixTable';
import ExpenseForm from './components/ExpenseForm';
import LoanForm from './components/LoanForm';
import RefinanceForm from './components/RefinanceForm';
import NOIResults from './components/NOIResults';
import ValuationResults from './components/ValuationResults';
import DSCRCard from './components/DSCRCard';
import BRRRSummary from './components/BRRRSummary';
import DealGradeBox from './components/DealGradeBox';

export default function MultifamilyTab() {
  const {
    deal,
    updateRoot,
    updateExpenses,
    updateLoan,
    updateRefinance,
    updateUnitMix,
    reset,
  } = useMultifamilyDeal();

  const validation = useMemo(() => validateDeal(deal), [deal]);
  const calc = useMemo(() => calculateMultifamily(deal), [deal]);

  return (
    <div className="cre-underwriting-page">
      <div className="cre-toolbar">
        <div>
          <h2 style={{ margin: 0 }}>Multifamily Underwriting</h2>
          <p className="section-subtitle" style={{ marginTop: 4 }}>
            2–20 unit BRRRR &amp; value-add calculator with live metrics.
          </p>
        </div>
        <div className="scenario-tabs">
          <button className="btn-modern-subtle" type="button" onClick={reset}>
            Reset to Defaults
          </button>
        </div>
      </div>

      {(validation.hasErrors || calc.warnings.length > 0) && (
        <div className="alert warning">
          {Object.values(validation.errors).map((err, idx) => (
            <div key={idx}>{err}</div>
          ))}
          {calc.warnings.map((w, idx) => (
            <div key={`warn-${idx}`}>{w}</div>
          ))}
        </div>
      )}

      <div className="cre-grid two-col">
        <PropertyForm deal={deal} onChange={updateRoot} />
        <LoanForm loan={deal.loan} onChange={updateLoan} />
      </div>

      <UnitMixTable unitMix={deal.unitMix} onChange={updateUnitMix} />

      <div className="cre-grid two-col">
        <ExpenseForm expenses={deal.expenses} onChange={updateExpenses} totalUnits={calc.totalUnits} />
        <RefinanceForm refinance={deal.refinance} onChange={updateRefinance} />
      </div>

      <NOIResults
        grossPotentialRent={calc.grossPotentialRent}
        effectiveGrossIncome={calc.effectiveGrossIncome}
        vacancyRate={calc.vacancyRate}
        expenses={calc.expenses}
        noi={calc.noi}
      />

      <div className="cre-grid two-col">
        <ValuationResults
          valuation={calc.valuation}
          acquisitionLoan={calc.acquisitionLoan}
          refinanceLoan={calc.refinanceLoan}
        />
        <DSCRCard
          dscr={calc.dscr}
          annualDebtService={calc.annualDebtService}
          loanAmount={calc.acquisitionLoan}
        />
      </div>

      <div className="cre-grid two-col">
        <BRRRSummary
          purchasePrice={deal.purchasePrice}
          rehabBudget={deal.rehabBudget}
          closingCosts={deal.closingCosts}
          totalCost={calc.totalCost}
          refinanceLoan={calc.refinanceLoan}
          cashLeftIn={calc.cashLeftIn}
          equityCreated={calc.equityCreated}
        />
        <DealGradeBox dscr={calc.dscr} cashLeftIn={calc.cashLeftIn} totalCost={calc.totalCost} />
      </div>
    </div>
  );
}
