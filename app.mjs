import { AIRCRAFT, CATEGORIES, UNIT_NAMES, LB_KG, convert, formatDecimal, isFuelCross, calculateWeight } from './calculator.mjs';
import { sanitizeNumericInput, resultUnits, otherUnitGroups } from './unit-input.mjs';
import { resolveTheme, toggleTheme } from './theme.mjs';

const $ = id => document.getElementById(id);
const state = { tab: 'units', category: null, value: '', negative: false, from: '', to: '', aircraftId: null, overlay: null, returnView: null };
const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
let savedTheme = null;
try { savedTheme = localStorage.getItem('helikit:theme'); } catch { /* Storage can be unavailable. */ }
let activeTheme = resolveTheme(savedTheme, themeMedia.matches);
let themeOverridden = savedTheme === 'light' || savedTheme === 'dark';
// In the Android app, match status bar icon colors to the in-app theme.
const systemBars = window.Capacitor?.isNativePlatform?.() ? window.Capacitor.registerPlugin('SystemBars') : null;

function applyTheme(theme) {
  activeTheme = theme;
  document.documentElement.dataset.theme = theme;
  $('theme-toggle').checked = theme === 'dark';
  $('theme-color').content = theme === 'dark' ? '#1C1F24' : '#E4E1DA';
  systemBars?.setStyle({ style: theme === 'dark' ? 'DARK' : 'LIGHT' }).catch(() => {});
}

function overlayBaseState() {
  const { helikitOverlay, ...base } = history.state || {};
  return base;
}

function hideSettings() {
  $('settings-panel').hidden = true;
  $('menu-button').setAttribute('aria-expanded', 'false');
}

function closeSettings(useHistory = true) {
  const wasOpen = !$('settings-panel').hidden;
  hideSettings();
  if (wasOpen && useHistory && history.state?.helikitOverlay === 'settings') history.back();
}

function toggleSettings() {
  if (!$('settings-panel').hidden) {
    closeSettings();
    return;
  }
  closeMenus();
  $('converter-input').blur();
  history.pushState({ ...overlayBaseState(), helikitOverlay: 'settings' }, '');
  $('settings-panel').hidden = false;
  $('menu-button').setAttribute('aria-expanded', 'true');
}

function captureMainView() {
  return {
    tab: state.tab,
    categoryId: state.category?.id || null,
    aircraftId: state.aircraftId,
    weightStep: $('weight-form-view').hidden ? 'aircraft' : 'form',
  };
}

function showOverlay(view) {
  state.overlay = view;
  $('app-info-view').hidden = view !== 'appInfo';
  $('license-view').hidden = view !== 'license';
  hideSettings();
  closeMenus();
  $('converter-input').blur();
  window.scrollTo(0, 0);
}

function restoreMainView(view = state.returnView) {
  showOverlay(null);
  state.returnView = null;
  if (!view) return;
  showTab(view.tab);
  if (view.tab === 'units') {
    state.category = view.categoryId ? CATEGORIES.find(item => item.id === view.categoryId) || null : null;
    showUnitView();
  } else {
    state.aircraftId = view.aircraftId;
    showWeightStep(view.weightStep || 'aircraft');
  }
}

function openAppInfo() {
  state.returnView = captureMainView();
  const base = overlayBaseState();
  history.replaceState({ ...base, helikitOverlay: 'appInfo' }, '');
  showOverlay('appInfo');
}

function leaveAppInfo() {
  if (history.state?.helikitOverlay === 'appInfo') history.back();
  else restoreMainView();
}

function openLicense() {
  history.pushState({ ...overlayBaseState(), helikitOverlay: 'license' }, '');
  showOverlay('license');
}

function leaveLicense() {
  if (history.state?.helikitOverlay === 'license') history.back();
  else showOverlay('appInfo');
}

function isFuelUnit(categoryId, unit) {
  return CATEGORIES.find(category => category.id === categoryId)?.fuelUnits.includes(unit) || false;
}

function badge() { return '<span class="fuel-badge">연료</span>'; }

function unitLabel(categoryId, unit, full = true) {
  return `${isFuelUnit(categoryId, unit) ? badge() : ''}<span class="unit-symbol">${unit}</span>${full ? `<span class="unit-korean">(${UNIT_NAMES[unit]})</span>` : ''}`;
}

function resultUnitLabel(categoryId, unit) {
  return `<span class="unit-symbol">${unit}</span><span class="unit-korean">(${UNIT_NAMES[unit]})</span>${isFuelUnit(categoryId, unit) ? badge() : ''}`;
}

function unitDivider() { return '<div class="unit-divider" role="separator"><span>일반 단위</span></div>'; }

function showTab(tab) {
  state.tab = tab;
  closeSettings();
  $('panel-units').hidden = tab !== 'units';
  $('panel-weight').hidden = tab !== 'weight';
  for (const name of ['units', 'weight']) {
    const selected = name === tab;
    $(`tab-${name}`).classList.toggle('active', selected);
    $(`tab-${name}`).setAttribute('aria-selected', String(selected));
  }
  closeMenus();
  if (tab === 'weight') $('converter-input').blur();
}

function readSavedUnit(categoryId, side, fallback) {
  try { return localStorage.getItem(`helikit:${categoryId}:${side}`) || fallback; } catch { return fallback; }
}

function saveUnit(categoryId, side, unit) {
  try { localStorage.setItem(`helikit:${categoryId}:${side}`, unit); } catch { /* Private browsing may block storage. */ }
}

function showUnitView() {
  $('category-view').hidden = !!state.category;
  $('converter-view').hidden = !state.category;
  if (state.category) renderConverter();
}

function chooseCategory(categoryId) {
  const category = CATEGORIES.find(item => item.id === categoryId);
  if (!category) return;
  state.category = category;
  state.value = '';
  state.negative = false;
  state.from = readSavedUnit(categoryId, 'from', category.defaults[0]);
  state.to = readSavedUnit(categoryId, 'to', category.defaults[1]);
  if (!category.units.includes(state.from)) state.from = category.defaults[0];
  if (!category.units.includes(state.to) || state.to === state.from) state.to = resultUnits(category.units, state.from)[0];
  history.pushState({ helikitCategory: categoryId }, '');
  showUnitView();
  window.scrollTo(0, 0);
  $('converter-input').focus({ preventScroll: true });
}

function leaveCategory() {
  $('converter-input').blur();
  closeMenus();
  if (history.state?.helikitCategory) history.back();
  else { state.category = null; showUnitView(); }
}

function optionMarkup(side, unit) {
  const selected = state[side] === unit;
  return `<button class="unit-option" type="button" role="option" aria-selected="${selected}" data-side="${side}" data-unit="${unit}">${unitLabel(state.category.id, unit)}</button>`;
}

function renderPicker(side) {
  const category = state.category;
  const eligible = unit => side !== 'to' || unit !== state.from;
  $(`${side}-trigger`).innerHTML = `<span class="trigger-label">${unitLabel(category.id, state[side])}</span><span class="chevron" aria-hidden="true">⌄</span>`;
  $(`${side}-menu`).innerHTML = [
    ...category.aviationUnits.filter(eligible).map(unit => optionMarkup(side, unit)),
    ...(category.generalUnits.length ? [unitDivider()] : []),
    ...category.generalUnits.filter(eligible).map(unit => optionMarkup(side, unit)),
  ].join('');
}

function closeMenus() {
  for (const side of ['from', 'to']) {
    $(`${side}-menu`).hidden = true;
    $(`${side}-trigger`).setAttribute('aria-expanded', 'false');
  }
}

function toggleMenu(side) {
  const menu = $(`${side}-menu`);
  const opening = menu.hidden;
  closeMenus();
  if (opening) {
    closeSettings();
    $('converter-input').blur();
    menu.hidden = false;
    $(`${side}-trigger`).setAttribute('aria-expanded', 'true');
  }
}

function selectUnit(side, unit) {
  if (!state.category.units.includes(unit) || (side === 'to' && unit === state.from)) return;
  state[side] = unit;
  if (side === 'from' && state.to === unit) state.to = resultUnits(state.category.units, unit)[0];
  saveUnit(state.category.id, 'from', state.from);
  saveUnit(state.category.id, 'to', state.to);
  renderPicker('from');
  renderPicker('to');
  closeMenus();
  updateConversion();
}

function renderConverter() {
  $('converter-title').textContent = state.category.name;
  $('converter-title-icon').style.setProperty('--icon', `url('measurement-icons/${state.category.id === 'mass' ? 'weight' : state.category.id}.svg')`);
  $('converter-input').value = state.value;
  $('sign-key').hidden = state.category.id !== 'temperature';
  renderPicker('from');
  renderPicker('to');
  updateConversion();
}

function formattedResult(unit) {
  if (state.value === '') return '—';
  return formatDecimal(convert(state.value, state.category.id, state.from, unit));
}

function updateConversion() {
  if (!state.category) return;
  const { category, from, to } = state;
  $('converter-result').textContent = formattedResult(to);
  $('converter-result-unit').innerHTML = resultUnitLabel(category.id, to);
  const groups = otherUnitGroups(category, from, to);
  const rows = units => units.map(unit => {
    const value = formattedResult(unit);
    return `<div class="other-row${value.length > 14 ? ' stacked' : ''}"><span class="other-unit">${unitLabel(category.id, unit)}</span><output>${value}</output></div>`;
  });
  $('other-results-list').innerHTML = [
    ...rows(groups.aviation),
    ...(category.generalUnits.length ? [unitDivider()] : []),
    ...rows(groups.general),
  ].join('');
  $('fuel-density').hidden = !isFuelCross(category.id, from, to);
  const result = state.value === '' ? null : convert(state.value, category.id, from, to);
  const nearZero = result && !result.isZero() && result.abs().lt('0.000005');
  $('converter-note').hidden = !nearZero;
  $('converter-note').textContent = nearZero ? '0에 가까움 — 더 작은 단위를 선택해 주세요.' : '';
}

function renderCategories() {
  $('category-list').innerHTML = CATEGORIES.map(item => `<button class="category-tile" type="button" data-category="${item.id}"><span class="tile-icon" style="--icon:url('measurement-icons/${item.id === 'mass' ? 'weight' : item.id}.svg')" aria-hidden="true"></span><span class="tile-name">${item.name}</span></button>`).join('');
}

function renderAircraft() {
  $('aircraft-list').innerHTML = AIRCRAFT.map(item => `<button class="aircraft-button" type="button" data-aircraft="${item.id}"><span class="aircraft-icon" style="--icon:url('helicopter-icons/${item.icon}')" aria-hidden="true"></span><span class="aircraft-name">${item.name}</span></button>`).join('');
}

function showWeightStep(step) {
  $('aircraft-view').hidden = step !== 'aircraft';
  $('weight-form-view').hidden = step !== 'form';
  window.scrollTo(0, 0);
}

function resetWeightResult() {
  $('weight-result-card').classList.remove('over', 'under');
  $('weight-status').textContent = '여유중량';
  $('weight-remaining').textContent = '— kg';
  $('weight-remaining-lb').hidden = true;
  $('weight-breakdown-section').hidden = true;
}

function chooseAircraft(id) {
  const aircraft = AIRCRAFT.find(item => item.id === id);
  if (!aircraft) return;
  state.aircraftId = id;
  $('selected-aircraft-title').textContent = aircraft.name;
  $('selected-aircraft-icon').style.setProperty('--icon', `url('helicopter-icons/${aircraft.icon}')`);
  $('weight-error').hidden = true;
  resetWeightResult();
  showWeightStep('form');
}

function nonnegativeValue(id, name, integer = false) {
  const raw = $(id).value.trim();
  const value = raw === '' ? 0 : Number(raw);
  if (!Number.isFinite(value) || value < 0 || (integer && !Number.isInteger(value))) throw new Error(`${name}: 0 이상의 ${integer ? '정수' : '숫자'}를 입력해 주세요.`);
  return raw === '' ? '0' : raw;
}

function readWeightForm() {
  return {
    aircraftId: state.aircraftId,
    personKg: nonnegativeValue('person-weight', '1인 중량'),
    people: nonnegativeValue('people-count', '인원 수', true),
    fuel: nonnegativeValue('fuel-value', '연료량'), fuelUnit: $('fuel-unit').value,
    rescue: nonnegativeValue('rescue-value', '구조장비'), rescueUnit: $('rescue-unit').value,
    medical: nonnegativeValue('medical-value', '구급장비'), medicalUnit: $('medical-unit').value,
  };
}

function breakdownLine(label, value, className = '') {
  return `<div class="${className}"><dt>${label}</dt><dd>${formatDecimal(value, 1)} kg</dd></div>`;
}

function renderWeightResult(result) {
  const over = result.remaining.isNegative();
  const absolute = result.remaining.abs();
  $('weight-result-card').classList.toggle('over', over);
  $('weight-result-card').classList.toggle('under', !over);
  $('weight-status').textContent = over ? '초과' : '여유';
  $('weight-remaining').textContent = `${formatDecimal(absolute, 1)} kg`;
  $('weight-remaining-lb').textContent = `${formatDecimal(absolute.div(LB_KG), 1)} lb`;
  $('weight-remaining-lb').hidden = false;
  $('weight-breakdown').innerHTML = [
    breakdownLine('MTOW', result.mtow), breakdownLine('기본중량', result.basic),
    breakdownLine('인원', result.personTotal), breakdownLine('연료', result.fuelTotal),
    breakdownLine('구조장비', result.rescueTotal), breakdownLine('구급장비', result.medicalTotal),
    breakdownLine('탑재 합계', result.total, 'total'),
  ].join('');
  $('weight-breakdown-section').hidden = false;
  document.activeElement?.blur();
  $('weight-result-card').scrollIntoView({ block: 'start' });
}

applyTheme(activeTheme);
themeMedia.addEventListener('change', event => {
  if (!themeOverridden) applyTheme(resolveTheme(null, event.matches));
});
history.replaceState({ helikitHome: true }, '');
renderCategories();
renderAircraft();
showTab('units');
showWeightStep('aircraft');

$('tab-units').addEventListener('click', () => showTab('units'));
$('tab-weight').addEventListener('click', () => showTab('weight'));
$('menu-button').addEventListener('click', toggleSettings);
$('theme-toggle').addEventListener('change', () => {
  const theme = toggleTheme(activeTheme);
  themeOverridden = true;
  try { localStorage.setItem('helikit:theme', theme); } catch { /* The choice still applies until reload. */ }
  applyTheme(theme);
});
$('category-list').addEventListener('click', event => { const tile = event.target.closest('[data-category]'); if (tile) chooseCategory(tile.dataset.category); });
$('back-categories').addEventListener('click', leaveCategory);
$('open-app-info').addEventListener('click', openAppInfo);
$('back-app-info').addEventListener('click', leaveAppInfo);
$('open-license').addEventListener('click', openLicense);
$('back-license').addEventListener('click', leaveLicense);
window.addEventListener('popstate', event => {
  const overlay = event.state?.helikitOverlay || null;
  if (overlay === 'appInfo') { showOverlay('appInfo'); return; }
  if (overlay === 'license') { showOverlay('license'); return; }
  hideSettings();
  if (state.overlay) { restoreMainView(); return; }
  state.category = event.state?.helikitCategory ? CATEGORIES.find(item => item.id === event.state.helikitCategory) || null : null;
  showTab('units');
  showUnitView();
});
for (const side of ['from', 'to']) {
  $(`${side}-trigger`).addEventListener('click', () => toggleMenu(side));
  $(`${side}-menu`).addEventListener('click', event => { const option = event.target.closest('[data-unit]'); if (option) selectUnit(side, option.dataset.unit); });
}
document.addEventListener('click', event => {
  if (!event.target.closest('.unit-picker')) closeMenus();
  if (!event.target.closest('.app-header')) closeSettings();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeMenus();
    if (!$('settings-panel').hidden) { closeSettings(); $('menu-button').focus(); }
  }
});
$('swap-units').addEventListener('click', () => { [state.from, state.to] = [state.to, state.from]; saveUnit(state.category.id, 'from', state.from); saveUnit(state.category.id, 'to', state.to); renderConverter(); });
$('converter-input').addEventListener('input', event => {
  state.value = sanitizeNumericInput(event.target.value, state.negative);
  event.target.value = state.value;
  updateConversion();
});
$('sign-key').addEventListener('click', () => {
  state.negative = !state.negative;
  state.value = sanitizeNumericInput(state.value, state.negative);
  $('converter-input').value = state.value;
  updateConversion();
  $('converter-input').focus({ preventScroll: true });
});
$('aircraft-list').addEventListener('click', event => { const button = event.target.closest('[data-aircraft]'); if (button) chooseAircraft(button.dataset.aircraft); });
$('back-aircraft').addEventListener('click', () => showWeightStep('aircraft'));
$('weight-form').addEventListener('input', resetWeightResult);
$('weight-form').addEventListener('change', resetWeightResult);
$('weight-form').addEventListener('submit', event => {
  event.preventDefault();
  try { $('weight-error').hidden = true; renderWeightResult(calculateWeight(readWeightForm())); }
  catch (error) { $('weight-error').textContent = error.message; $('weight-error').hidden = false; }
});
