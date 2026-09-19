import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeNumericInput, otherUnits, resultUnits, otherUnitGroups } from './unit-input.mjs';
import { CATEGORIES } from './calculator.mjs';

test('붙여넣은 구분 기호를 제거하고 소수점을 하나만 남긴다', () => {
  assert.equal(sanitizeNumericInput(' 1,234.5 6 '), '1234.56');
  assert.equal(sanitizeNumericInput('.5'), '0.5');
  assert.equal(sanitizeNumericInput('12.3.4'), '12.34');
  assert.equal(sanitizeNumericInput(''), '');
});

test('다른 단위 목록은 연료 단위를 제외하고 항공·일반 구분을 유지한다', () => {
  const mass = CATEGORIES.find(category => category.id === 'mass');
  assert.deepEqual(otherUnitGroups(mass, 'kg', 'lb'), {
    aviation: [],
    general: ['g', 'mg', 't', 'oz', 'gr', 'US ton', 'UK ton'],
  });
  const volume = CATEGORIES.find(category => category.id === 'volume');
  assert.deepEqual(otherUnitGroups(volume, 'US gal', 'US fl oz'), {
    aviation: ['L', 'Imp gal'],
    general: ['mL', 'm³', 'cc', 'US qt', 'US pt', 'ft³', 'in³'],
  });
});

test('정수부 12자리와 소수부 6자리로 제한하고 음수는 온도 버튼 상태에서만 유지한다', () => {
  assert.equal(sanitizeNumericInput('123456789012345.123456789'), '123456789012.123456');
  assert.equal(sanitizeNumericInput('-40'), '40');
  assert.equal(sanitizeNumericInput('40', true), '-40');
  assert.equal(sanitizeNumericInput('', true), '');
});

test('결과 단위에서 입력 단위를 제외하고 다른 단위 목록에서는 입력과 주요 결과를 제외한다', () => {
  const units = ['kg', 'lb', 'g', 't', 'L'];
  assert.deepEqual(resultUnits(units, 'kg'), ['lb', 'g', 't', 'L']);
  assert.deepEqual(otherUnits(units, 'kg', 'L'), ['lb', 'g', 't']);
});
