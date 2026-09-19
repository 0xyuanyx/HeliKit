import Decimal from './vendor/decimal.mjs';

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export const FUEL_DENSITY_LB_PER_US_GAL = new Decimal('6.7');
export const LB_KG = new Decimal('0.45359237');
export const US_GAL_L = new Decimal('3.785411784');
export const FUEL_DENSITY_KG_PER_L = FUEL_DENSITY_LB_PER_US_GAL.mul(LB_KG).div(US_GAL_L);

export const AIRCRAFT = [
  { id: 's92', name: 'S-92', mtowKg: '12000', basicWeightKg: '7800', icon: 's-92.svg' },
  { id: 'kuh1', name: 'KUH-1', mtowKg: '8700', basicWeightKg: '5655', icon: 'kuh-1.svg' },
  { id: 'as565', name: 'AS565', mtowKg: '4300', basicWeightKg: '2795', icon: 'as565.svg' },
  { id: 'ka32', name: 'Ka-32', mtowKg: '11000', basicWeightKg: '7150', icon: 'ka32.svg' },
  { id: 'aw139', name: 'AW139', mtowKg: '6400', basicWeightKg: '4160', icon: 'aw139.svg' },
  { id: 'aw189', name: 'AW189', mtowKg: '8300', basicWeightKg: '5395', icon: 'aw189.svg' },
];

function category(id, name, aviationUnits, generalUnits, defaults, fuelUnits = []) {
  return { id, name, aviationUnits, generalUnits, fuelUnits, units: [...aviationUnits, ...generalUnits], defaults };
}

export const CATEGORIES = [
  category('length', '길이', ['m', 'km', 'ft', 'NM', 'SM'], ['cm', 'mm', 'in', 'yd'], ['NM', 'km']),
  category('area', '면적', ['m²', 'km²', 'ft²', 'NM²'], ['cm²', 'in²', 'yd²', 'SM²', 'ha', 'ac', '평'], ['NM²', 'km²']),
  category('mass', '무게', ['kg', 'lb', 'L', 'US gal', 'Imp gal'], ['g', 'mg', 't', 'oz', 'gr', 'US ton', 'UK ton'], ['kg', 'lb'], ['L', 'US gal', 'Imp gal']),
  category('volume', '부피', ['L', 'US gal', 'Imp gal', 'kg', 'lb'], ['mL', 'm³', 'cc', 'US qt', 'US pt', 'US fl oz', 'ft³', 'in³'], ['L', 'US gal'], ['kg', 'lb']),
  category('temperature', '온도', ['°C', '°F', 'K'], [], ['°C', '°F']),
  category('time', '시간', ['h', 'min', 's'], ['ms', 'day', 'week'], ['h', 'min']),
  category('speed', '속도', ['kt', 'km/h', 'ft/min'], ['m/s', 'mph', 'ft/s'], ['kt', 'km/h']),
];

export const UNIT_NAMES = {
  m: '미터', km: '킬로미터', cm: '센티미터', mm: '밀리미터', ft: '피트', in: '인치', yd: '야드', NM: '해리', SM: '마일',
  'm²': '제곱미터', 'km²': '제곱킬로미터', 'ft²': '제곱피트', 'NM²': '제곱해리', 'cm²': '제곱센티미터', 'in²': '제곱인치', 'yd²': '제곱야드', 'SM²': '제곱마일', ha: '헥타르', ac: '에이커', 평: '평',
  kg: '킬로그램', lb: '파운드', g: '그램', mg: '밀리그램', t: '톤', oz: '온스', gr: '그레인', 'US ton': '미국 톤', 'UK ton': '영국 톤',
  L: '리터', mL: '밀리리터', 'US gal': '미국 갤런', 'Imp gal': '영국 갤런', 'US qt': '미국 쿼트', 'US pt': '미국 파인트', 'US fl oz': '미국 액량 온스', 'm³': '세제곱미터', cc: '시시', 'ft³': '세제곱피트', 'in³': '세제곱인치',
  '°C': '섭씨', '°F': '화씨', K: '켈빈', s: '초', min: '분', h: '시간', ms: '밀리초', day: '일', week: '주',
  kt: '노트', 'km/h': '시속 킬로미터', mph: '시속 마일', 'm/s': '초속 미터', 'ft/min': '분당 피트', 'ft/s': '초속 피트',
};

const FACTORS = {
  length: { m: '1', km: '1000', ft: '0.3048', NM: '1852', SM: '1609.344', cm: '0.01', mm: '0.001', in: '0.0254', yd: '0.9144' },
  area: { 'm²': '1', 'km²': '1000000', 'ft²': '0.09290304', 'NM²': '3429904', 'cm²': '0.0001', 'in²': '0.00064516', 'yd²': '0.83612736', 'SM²': '2589988.110336', ha: '10000', ac: '4046.8564224', 평: new Decimal(400).div(121) },
  mass: { kg: '1', lb: LB_KG, g: '0.001', mg: '0.000001', t: '1000', oz: '0.028349523125', gr: '0.00006479891', 'US ton': '907.18474', 'UK ton': '1016.0469088' },
  volume: { L: '1', 'US gal': US_GAL_L, 'Imp gal': '4.54609', mL: '0.001', 'm³': '1000', cc: '0.001', 'US qt': '0.946352946', 'US pt': '0.473176473', 'US fl oz': '0.0295735295625', 'ft³': '28.316846592', 'in³': '0.016387064' },
  time: { h: '3600', min: '60', s: '1', ms: '0.001', day: '86400', week: '604800' },
  speed: { kt: new Decimal(1852).div(3600), 'km/h': new Decimal(1).div('3.6'), 'ft/min': '0.00508', 'm/s': '1', mph: '0.44704', 'ft/s': '0.3048' },
};

export function isFuelCross(categoryId, from, to) {
  if (categoryId !== 'mass' && categoryId !== 'volume') return false;
  const mass = unit => Object.hasOwn(FACTORS.mass, unit);
  const volume = unit => Object.hasOwn(FACTORS.volume, unit);
  return (mass(from) && volume(to)) || (volume(from) && mass(to));
}

function temperatureToC(value, unit) {
  if (unit === '°F') return value.minus(32).mul(5).div(9);
  if (unit === 'K') return value.minus('273.15');
  return value;
}

function cToTemperature(value, unit) {
  if (unit === '°F') return value.mul(9).div(5).plus(32);
  if (unit === 'K') return value.plus('273.15');
  return value;
}

export function convert(value, categoryId, from, to) {
  const input = new Decimal(value);
  if (categoryId === 'temperature') return cToTemperature(temperatureToC(input, from), to);
  if (categoryId === 'mass' || categoryId === 'volume') {
    const fromMass = Object.hasOwn(FACTORS.mass, from);
    const toMass = Object.hasOwn(FACTORS.mass, to);
    const fromFactor = fromMass ? FACTORS.mass[from] : FACTORS.volume[from];
    const toFactor = toMass ? FACTORS.mass[to] : FACTORS.volume[to];
    if (!fromFactor || !toFactor) throw new Error('지원하지 않는 단위');
    let base = input.mul(fromFactor);
    if (fromMass && !toMass) base = base.div(FUEL_DENSITY_KG_PER_L);
    if (!fromMass && toMass) base = base.mul(FUEL_DENSITY_KG_PER_L);
    return base.div(toFactor);
  }
  const factors = FACTORS[categoryId];
  if (!factors?.[from] || !factors?.[to]) throw new Error('지원하지 않는 단위');
  return input.mul(factors[from]).div(factors[to]);
}

export function formatDecimal(value, digits = 5) {
  const fixed = new Decimal(value).toDecimalPlaces(digits).toFixed(digits);
  const [whole, fraction] = fixed.split('.');
  const significantFraction = fraction?.replace(/0+$/, '');
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${significantFraction ? `.${significantFraction}` : ''}`;
}

export function fuelToKg(value, unit) {
  if (unit === 'kg') return new Decimal(value);
  if (unit === 'lb') return new Decimal(value).mul(LB_KG);
  if (unit === 'L') return new Decimal(value).mul(FUEL_DENSITY_KG_PER_L);
  if (unit === 'US gal') return new Decimal(value).mul(FUEL_DENSITY_LB_PER_US_GAL).mul(LB_KG);
  throw new Error('지원하지 않는 연료 단위');
}

export function calculateWeight({ aircraftId, personKg, people, fuel, fuelUnit, rescue, rescueUnit, medical, medicalUnit }) {
  const aircraft = AIRCRAFT.find(item => item.id === aircraftId);
  if (!aircraft) throw new Error('기종을 선택해 주세요');
  const nonnegative = value => {
    const result = new Decimal(value || 0);
    if (result.isNegative()) throw new Error('음수는 입력할 수 없습니다');
    return result;
  };
  const personTotal = nonnegative(personKg).mul(nonnegative(people));
  const fuelTotal = fuelToKg(nonnegative(fuel), fuelUnit);
  const rescueTotal = nonnegative(rescue).mul(rescueUnit === 'lb' ? LB_KG : 1);
  const medicalTotal = nonnegative(medical).mul(medicalUnit === 'lb' ? LB_KG : 1);
  const basic = new Decimal(aircraft.basicWeightKg);
  const mtow = new Decimal(aircraft.mtowKg);
  const equipment = rescueTotal.plus(medicalTotal);
  const total = basic.plus(personTotal).plus(fuelTotal).plus(equipment);
  return { aircraft, mtow, basic, personTotal, fuelTotal, rescueTotal, medicalTotal, equipment, total, remaining: mtow.minus(total) };
}
