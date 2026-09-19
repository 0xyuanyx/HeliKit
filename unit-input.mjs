export function sanitizeNumericInput(raw, negative = false) {
  const cleaned = String(raw).replace(/[^\d.]/g, '');
  if (!cleaned) return '';
  const dot = cleaned.indexOf('.');
  const whole = (dot < 0 ? cleaned : cleaned.slice(0, dot)).slice(0, 12);
  const fraction = dot < 0 ? '' : cleaned.slice(dot + 1).replace(/\./g, '').slice(0, 6);
  const value = `${whole || '0'}${dot < 0 ? '' : `.${fraction}`}`;
  return negative ? `-${value}` : value;
}

export function resultUnits(units, from) {
  return units.filter(unit => unit !== from);
}

export function otherUnits(units, from, to) {
  return units.filter(unit => unit !== from && unit !== to);
}

export function otherUnitGroups(category, from, to) {
  const visible = unit => unit !== from && unit !== to && !category.fuelUnits.includes(unit);
  return {
    aviation: category.aviationUnits.filter(visible),
    general: category.generalUnits.filter(visible),
  };
}
