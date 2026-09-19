import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTheme, toggleTheme } from './theme.mjs';

test('저장된 화면 모드는 기기 설정보다 우선한다', () => {
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('dark', false), 'dark');
});

test('저장값이 없거나 잘못되면 기기의 라이트·다크 설정을 따른다', () => {
  assert.equal(resolveTheme(null, true), 'dark');
  assert.equal(resolveTheme(null, false), 'light');
  assert.equal(resolveTheme('unexpected', true), 'dark');
});

test('토글은 현재 화면 모드를 반대로 바꾼다', () => {
  assert.equal(toggleTheme('light'), 'dark');
  assert.equal(toggleTheme('dark'), 'light');
});
