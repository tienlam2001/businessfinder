export function sanitizeFormValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeFormValue(item));
  }

  if (typeof value === 'object') {
    if (value instanceof Date) {
      return value;
    }

    if (typeof File !== 'undefined' && value instanceof File) {
      return value;
    }

    if (value.constructor && value.constructor !== Object) {
      return value;
    }

    return Object.entries(value).reduce((acc, [key, nestedValue]) => {
      acc[key] = sanitizeFormValue(nestedValue);
      return acc;
    }, {});
  }

  return value;
}
