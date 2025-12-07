const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export function validateDeal(deal = {}) {
  const errors = {};

  if (!deal.unitMix || deal.unitMix.length === 0) {
    errors.unitMix = 'Add at least one unit.';
  } else {
    const invalidUnit = deal.unitMix.find(
      (u) => toNumber(u.count) <= 0 || toNumber(u.currentRent) < 0 || toNumber(u.marketRent) < 0
    );
    if (invalidUnit) errors.unitMix = 'Unit counts must be positive; rents cannot be negative.';
  }

  if (!deal.purchasePrice || toNumber(deal.purchasePrice) <= 0) {
    errors.purchasePrice = 'Purchase price is required.';
  }

  if (!deal.refinance?.capRate || toNumber(deal.refinance.capRate) <= 0) {
    errors.capRate = 'Cap rate must be greater than 0.';
  }

  const numericFields = [
    ['rehabBudget', deal.rehabBudget],
    ['closingCosts', deal.closingCosts],
    ['loan.ltv', deal.loan?.ltv],
    ['loan.interestRate', deal.loan?.interestRate],
    ['loan.amortYears', deal.loan?.amortYears],
    ['refinance.refiLTV', deal.refinance?.refiLTV],
    ['refinance.refiInterestRate', deal.refinance?.refiInterestRate],
    ['refinance.amortYears', deal.refinance?.amortYears],
    ['expenses.vacancyRate', deal.expenses?.vacancyRate],
    ['expenses.taxes', deal.expenses?.taxes],
    ['expenses.insurance', deal.expenses?.insurance],
    ['expenses.repairs', deal.expenses?.repairs],
    ['expenses.capEx', deal.expenses?.capEx],
    ['expenses.management', deal.expenses?.management],
    ['expenses.utilities', deal.expenses?.utilities],
    ['expenses.payroll', deal.expenses?.payroll],
    ['expenses.other', deal.expenses?.other],
  ];

  const negativeFields = numericFields.filter(
    ([, value]) => value !== '' && value !== undefined && value !== null && toNumber(value) < 0
  );
  if (negativeFields.length) {
    errors.negatives = `The following fields cannot be negative: ${negativeFields
      .map(([name]) => name)
      .join(', ')}`;
  }

  if (deal.expenses?.vacancyRate && toNumber(deal.expenses.vacancyRate) > 100) {
    errors.vacancyRate = 'Vacancy cannot exceed 100%.';
  }

  return { errors, hasErrors: Object.keys(errors).length > 0 };
}
