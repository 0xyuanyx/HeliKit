import test from 'node:test';
import assert from 'node:assert/strict';
import { convert, formatDecimal, FUEL_DENSITY_KG_PER_L, calculateWeight, CATEGORIES, UNIT_NAMES } from './calculator.mjs';

test('표시 숫자는 최대 다섯 자리까지만 반올림하고 끝의 0을 숨긴다', () => {
  assert.equal(formatDecimal('5'), '5');
  assert.equal(formatDecimal('4.03000'), '4.03');
  assert.equal(formatDecimal('1000.50000'), '1,000.5');
  assert.equal(formatDecimal('1.234567'), '1.23457');
  assert.equal(formatDecimal('0.000001'), '0');
});

test('항공 단위 변환의 기준값', () => {
  const examples = [
    ['volume', 'US gal', 'L', '1', '3.78541'],
    ['volume', 'Imp gal', 'US gal', '1', '1.20095'],
    ['mass', 'lb', 'kg', '1000', '453.59237'],
    ['length', 'NM', 'ft', '1', '6,076.11549'],
    ['length', 'NM', 'SM', '1', '1.15078'],
    ['speed', 'kt', 'km/h', '1', '1.852'],
    ['speed', 'kt', 'mph', '1', '1.15078'],
    ['speed', 'kt', 'm/s', '100', '51.44444'],
    ['speed', 'ft/min', 'kt', '1000', '9.87473'],
    ['temperature', '°C', '°F', '-40', '-40'],
    ['temperature', '°C', '°F', '15', '59'],
    ['area', 'NM²', 'km²', '1', '3.4299'],
    ['mass', 'lb', 'US gal', '1000', '149.25373'],
    ['mass', 'lb', 'L', '1000', '564.98683'],
  ];
  for (const [category, from, to, value, expected] of examples) {
    assert.equal(formatDecimal(convert(value, category, from, to)), expected, `${value} ${from} → ${to}`);
  }
});

test('연료 환산은 두 계산기에서 같은 고정 밀도를 사용한다', () => {
  assert.equal(formatDecimal(FUEL_DENSITY_KG_PER_L), '0.80284');
  assert.equal(formatDecimal(convert('1000', 'volume', 'L', 'kg')), '802.83706');
  const result = calculateWeight({ aircraftId: 's92', personKg: '80', people: '0', fuel: '1000', fuelUnit: 'L', rescue: '0', rescueUnit: 'kg', medical: '0', medicalUnit: 'kg' });
  assert.equal(formatDecimal(result.fuelTotal), '802.83706');
});

test('여유중량 결과와 음수 입력 검증', () => {
  const input = { aircraftId: 's92', personKg: '80', people: '2', fuel: '500', fuelUnit: 'kg', rescue: '100', rescueUnit: 'kg', medical: '0', medicalUnit: 'kg' };
  const result = calculateWeight(input);
  assert.equal(formatDecimal(result.total, 1), '8,560');
  assert.equal(formatDecimal(result.remaining, 1), '3,440');
  assert.throws(() => calculateWeight({ ...input, fuel: '-1' }), /음수/);
});

test('개정 단위 목록의 순서와 연료 단위 그룹', () => {
  const expected = {
    length: [['m', 'km', 'ft', 'NM', 'SM'], ['cm', 'mm', 'in', 'yd'], []],
    area: [['m²', 'km²', 'ft²', 'NM²'], ['cm²', 'in²', 'yd²', 'SM²', 'ha', 'ac', '평'], []],
    mass: [['kg', 'lb', 'L', 'US gal', 'Imp gal'], ['g', 'mg', 't', 'oz', 'gr', 'US ton', 'UK ton'], ['L', 'US gal', 'Imp gal']],
    volume: [['L', 'US gal', 'Imp gal', 'kg', 'lb'], ['mL', 'm³', 'cc', 'US qt', 'US pt', 'US fl oz', 'ft³', 'in³'], ['kg', 'lb']],
    temperature: [['°C', '°F', 'K'], [], []],
    time: [['h', 'min', 's'], ['ms', 'day', 'week'], []],
    speed: [['kt', 'km/h', 'ft/min'], ['m/s', 'mph', 'ft/s'], []],
  };
  for (const category of CATEGORIES) {
    const [aviation, general, fuel] = expected[category.id];
    assert.deepEqual(category.aviationUnits, aviation, category.id);
    assert.deepEqual(category.generalUnits, general, category.id);
    assert.deepEqual(category.fuelUnits, fuel, category.id);
    assert.deepEqual(category.units, [...aviation, ...general], category.id);
    for (const unit of category.units) assert.ok(UNIT_NAMES[unit], `${category.id}: ${unit}`);
  }
});

test('추가 단위 변환 시나리오 S19-S22와 큰 값', () => {
  const examples = [
    ['mass', 'kg', 'gr', '1', '15,432.35835'],
    ['mass', 'kg', 'oz', '1', '35.27396'],
    ['volume', 'US gal', 'US fl oz', '1', '128'],
    ['volume', 'ft³', 'L', '1', '28.31685'],
    ['mass', 'kg', 'mg', '50', '50,000,000'],
    ['area', '평', 'm²', '1', '3.30579'],
  ];
  for (const [category, from, to, value, expected] of examples) {
    assert.equal(formatDecimal(convert(value, category, from, to)), expected, `${value} ${from} → ${to}`);
  }
});
