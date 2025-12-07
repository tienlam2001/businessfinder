export const fmtCurrency = (value, digits = 0) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);

export const fmtPercent = (value, digits = 1) =>
  `${((Number.isFinite(value) ? value : 0) * 100).toFixed(digits)}%`;

export const fmtNumber = (value, digits = 2) =>
  Number.isFinite(value) ? value.toFixed(digits) : Number(0).toFixed(digits);