import { describe, it, expect } from 'vitest';
import {
  buildBrrrModel,
  createDefaultBrrrInputs,
  mergeBrrrInputs,
  solveMaxOfferPrice,
} from './calculations';

describe('BRRR calculations', () => {
  it('Hard Money path: DSCR constraint drives proceeds and DSCR meets target', () => {
    const model = buildBrrrModel(createDefaultBrrrInputs());
    const hardMoney = model.scenarios.hardMoney;
    expect(hardMoney.maxLoanByDscr).toBeLessThan(hardMoney.maxLoanByLtv);
    expect(hardMoney.refiProceeds).toBeCloseTo(hardMoney.maxLoanByDscr, -2);
    expect(hardMoney.actualDscr).toBeGreaterThanOrEqual(hardMoney.dscrTarget);
  });

  it('Investor Debt path: points and draw fees roll into project cost and payoff', () => {
    const base = createDefaultBrrrInputs();
    const withoutFees = buildBrrrModel(
      mergeBrrrInputs(
        {
          investor: {
            debt: { pointsPercent: 0, upfrontFees: 0, exitFeePercent: 0 },
            drawFeePerDraw: 0,
            drawCount: 0,
            otherFees: 0,
          },
        },
        base,
      ),
    ).scenarios.investorDebt;

    const withFeesModel = mergeBrrrInputs(
      {
        investor: {
          debt: { pointsPercent: 2, upfrontFees: 1500, exitFeePercent: 1.5, exitFeeBasis: 'loan' },
          drawFeePerDraw: 200,
          drawCount: 4,
          otherFees: 750,
        },
      },
      base,
    );
    const withFees = buildBrrrModel(withFeesModel).scenarios.investorDebt;

    const principal = withFeesModel.shared.purchasePrice * (withFeesModel.investor.debt.advancePercent / 100);
    const expectedAdders = principal * 0.02 + 200 * 4 + 1500 + 750;
    expect(withFees.totalProjectCost - withoutFees.totalProjectCost).toBeCloseTo(expectedAdders, -2);
    const expectedPayoff = principal + principal * 0.015;
    expect(withFees.bridgePayoff).toBeCloseTo(expectedPayoff, -2);
  });

  it('Investor Equity path: no bridge interest, pref accrual tracked, cash kept at project level', () => {
    const inputs = mergeBrrrInputs(
      {
        investor: {
          fundingType: 'equity',
          equity: { equityPercent: 40, prefPercent: 8, capitalContributed: 120000 },
        },
      },
      createDefaultBrrrInputs(),
    );
    const model = buildBrrrModel(inputs);
    const result = model.scenarios.investorEquity;
    const holdingSum =
      (inputs.shared.holdingCosts.taxes +
        inputs.shared.holdingCosts.insurance +
        inputs.shared.holdingCosts.utilities +
        inputs.shared.holdingCosts.hoa) *
      inputs.shared.rehabDurationMonths;
    const closing =
      inputs.shared.purchasePrice * (inputs.shared.purchaseClosingPercent / 100) +
      inputs.shared.purchaseClosingFixed;
    const rehab = inputs.shared.rehabBudget * (1 + inputs.shared.contingencyPercent / 100);
    const expectedTPC = inputs.shared.purchasePrice + closing + rehab + holdingSum;
    expect(result.totalProjectCost).toBeCloseTo(expectedTPC, -2);
    const expectedPref =
      inputs.investor.equity.capitalContributed *
      (inputs.investor.equity.prefPercent / 100) *
      (inputs.shared.rehabDurationMonths / 12);
    expect(result.prefAccrual).toBeCloseTo(expectedPref, -2);
    expect(result.cashOutToSponsor).toBe(0);
    expect(result.cashAvailableToDistribute).toBeGreaterThanOrEqual(0);
  });

  it('All-cash scenario keeps sponsor cash equal to project cost when refi disabled', () => {
    const inputs = mergeBrrrInputs(
      { allCash: { takeRefi: false } },
      createDefaultBrrrInputs(),
    );
    const allCash = buildBrrrModel(inputs).scenarios.allCash;
    expect(allCash.sponsorCashIn).toBeCloseTo(allCash.totalProjectCost, -2);
    expect(allCash.refiProceeds).toBe(0);
    expect(allCash.cashLeftIn).toBe(allCash.sponsorCashIn);
  });

  it('Sensitivity: boosting ARV increases proceeds until LTV binds', () => {
    const inputs = mergeBrrrInputs(
      {
        shared: { marketRent: 4500 },
        dscrRefi: { dscrTarget: 1.0 },
      },
      createDefaultBrrrInputs(),
    );
    const base = buildBrrrModel(inputs);
    expect(base.scenarios.hardMoney.refiConstraint).toBe('LTV');
    const higher = buildBrrrModel(inputs, { arvPercent: 10, rentPercent: 0, bridgeRateDelta: 0, refiRateDelta: 0, expensePercentDelta: 0 });
    expect(higher.scenarios.hardMoney.refiProceeds).toBeGreaterThan(base.scenarios.hardMoney.refiProceeds);
    expect(higher.scenarios.hardMoney.refiProceeds).toBeCloseTo(higher.scenarios.hardMoney.maxLoanByLtv, -2);
  });

  it('Max Offer solver backs into purchase price target', () => {
    const inputs = createDefaultBrrrInputs();
    const offer = solveMaxOfferPrice(inputs, 'hardMoney', 5000);
    expect(offer).toBeGreaterThan(0);
    if (offer) {
      const recalculated = buildBrrrModel(
        mergeBrrrInputs({ shared: { purchasePrice: offer } }, inputs),
      ).scenarios.hardMoney;
      expect(recalculated.cashLeftIn).toBeLessThanOrEqual(6000);
    }
  });
});
