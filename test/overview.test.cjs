const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { Window } = require('happy-dom');
const source = readFileSync('compact-overview-card.js', 'utf8');
const state = (entity_id, value, attributes = {}) => ({ entity_id, state: value, attributes });
function setup(config, states = {}) {
  const window = new Window({ url: 'http://localhost/' }); window.eval(source);
  const card = window.document.createElement('compact-overview-card');
  card.setConfig(config);
  window.document.body.append(card);
  card.hass = { states, callService: () => { throw new Error('overview must not call services'); } };
  return { window, card };
}
const tiles = card => [...card.shadowRoot.querySelectorAll('.tile')];
const alerts = card => [...card.shadowRoot.querySelectorAll('.alert')];

test('count tile reports on/usable and separates unavailable entities', () => {
  const { card } = setup({ tiles: [{ type: 'count', name: '조명', entities: ['light.a', 'light.b', 'switch.c', 'light.d'] }] }, {
    'light.a': state('light.a', 'on'), 'light.b': state('light.b', 'off'),
    'switch.c': state('switch.c', 'on'), 'light.d': state('light.d', 'unavailable'),
  });
  const [tile] = tiles(card);
  assert.match(tile.querySelector('.main').textContent, /2\/3/);
  assert.match(tile.querySelector('.sub').textContent, /1개 확인 불가/);
  assert.equal(tile.hasAttribute('data-active'), true);
});

test('count tile is offline when every entity is unavailable', () => {
  const { card } = setup({ tiles: [{ type: 'count', name: '조명', entities: ['light.a'] }] }, { 'light.a': state('light.a', 'unavailable') });
  const [tile] = tiles(card);
  assert.match(tile.querySelector('.main').textContent, /—/);
  assert.equal(tile.hasAttribute('data-offline'), true);
});

test('value tile uses user thresholds only and prefixes the level in text', () => {
  const config = { tiles: [{ type: 'value', name: '공기', entity: 'sensor.pm', thresholds: [{ value: 35, direction: 'above', level: 'warning' }, { value: 75, direction: 'above', level: 'critical' }] }] };
  let { card } = setup(config, { 'sensor.pm': state('sensor.pm', '80', { unit_of_measurement: 'µg/m³' }) });
  assert.equal(tiles(card)[0].dataset.level, 'critical');
  assert.match(tiles(card)[0].querySelector('.main').textContent, /^위험 · 80/);
  ({ card } = setup(config, { 'sensor.pm': state('sensor.pm', '10') }));
  assert.equal(tiles(card)[0].dataset.level, '');
  const noThresholds = setup({ tiles: [{ type: 'value', name: '공기', entity: 'sensor.pm' }] }, { 'sensor.pm': state('sensor.pm', '999') });
  assert.equal(tiles(noThresholds.card)[0].dataset.level, '');
});

test('health tile requires explicit rules and does not treat unavailable as healthy', () => {
  assert.throws(() => setup({ tiles: [{ type: 'health', name: '서버', items: [{ entity: 'sensor.x' }] }] }), /추측하지 않습니다/);
  const config = { tiles: [{ type: 'health', name: '서버', items: [
    { entity: 'sensor.smart', problem: { state_not: 'PASSED' }, level: 'critical' },
    { entity: 'sensor.cpu', thresholds: [{ value: 75, direction: 'above', level: 'warning' }] },
  ] }] };
  let { card } = setup(config, { 'sensor.smart': state('sensor.smart', 'PASSED'), 'sensor.cpu': state('sensor.cpu', '50') });
  assert.match(tiles(card)[0].querySelector('.main').textContent, /이상 없음/);
  ({ card } = setup(config, { 'sensor.smart': state('sensor.smart', 'FAILED'), 'sensor.cpu': state('sensor.cpu', '80') }));
  assert.equal(tiles(card)[0].dataset.level, 'critical');
  ({ card } = setup(config, { 'sensor.smart': state('sensor.smart', 'unavailable'), 'sensor.cpu': state('sensor.cpu', '50') }));
  assert.match(tiles(card)[0].querySelector('.sub').textContent, /1개 확인 불가/);
});

test('status tile summarises active appliances with remaining time', () => {
  const config = { tiles: [{ type: 'status', name: '가전', items: [
    { entity: 'sensor.washer', name: '세탁', active: ['running'], remaining: 'sensor.washer_left' },
    { entity: 'sensor.dryer', name: '건조', active: ['running'] },
  ] }] };
  let { card } = setup(config, { 'sensor.washer': state('sensor.washer', 'running'), 'sensor.dryer': state('sensor.dryer', 'idle'), 'sensor.washer_left': state('sensor.washer_left', '25', { unit_of_measurement: 'min' }) });
  assert.match(tiles(card)[0].querySelector('.main').textContent, /세탁/);
  assert.match(tiles(card)[0].querySelector('.sub').textContent, /25/);
  ({ card } = setup(config, { 'sensor.washer': state('sensor.washer', 'idle'), 'sensor.dryer': state('sensor.dryer', 'idle') }));
  assert.match(tiles(card)[0].querySelector('.main').textContent, /모두 대기/);
});

test('climate tile counts running devices and shows the value entity', () => {
  const { card } = setup({ tiles: [{ type: 'climate', name: '냉난방', entities: ['climate.a', 'climate.b'], value_entity: 'sensor.t' }] }, {
    'climate.a': state('climate.a', 'heat', { hvac_action: 'heating' }),
    'climate.b': state('climate.b', 'heat', { hvac_action: 'idle' }),
    'sensor.t': state('sensor.t', '24.5', { unit_of_measurement: '°C' }),
  });
  assert.match(tiles(card)[0].querySelector('.main').textContent, /1대/);
  assert.match(tiles(card)[0].querySelector('.sub').textContent, /24\.5/);
});

test('alerts show only matching entities, critical first, and collapse when empty', () => {
  const config = { name: '우리집', alerts: [
    { entity: 'lock.gas', name: '가스 밸브 열림', when: { state: 'unlocked' }, level: 'warning' },
    { entity: 'binary_sensor.leak', name: '누수 · 주방', when: { state: 'on' }, level: 'critical' },
  ], tiles: [{ type: 'count', name: '조명', entities: ['light.a'] }] };
  let { card } = setup(config, { 'lock.gas': state('lock.gas', 'unlocked'), 'binary_sensor.leak': state('binary_sensor.leak', 'on'), 'light.a': state('light.a', 'off') });
  assert.equal(alerts(card).length, 2);
  assert.match(alerts(card)[0].textContent, /위험 · 누수/);
  assert.match(card.shadowRoot.querySelector('.badge').textContent, /2건/);
  ({ card } = setup(config, { 'lock.gas': state('lock.gas', 'locked'), 'binary_sensor.leak': state('binary_sensor.leak', 'off'), 'light.a': state('light.a', 'off') }));
  assert.equal(alerts(card).length, 0);
  assert.match(card.shadowRoot.querySelector('.badge').textContent, /이상 없음/);
  ({ card } = setup(config, { 'lock.gas': state('lock.gas', 'locked'), 'binary_sensor.leak': state('binary_sensor.leak', 'unavailable'), 'light.a': state('light.a', 'off') }));
  assert.match(card.shadowRoot.querySelector('.badge').textContent, /확인 불가/);
});

test('tile tap navigates to a local path, falls back to more-info, and rejects unsafe paths', () => {
  assert.throws(() => setup({ tiles: [{ type: 'count', name: 'x', entities: ['light.a'], navigation_path: '//evil.example' }] }), /navigation_path/);
  const { window, card } = setup({ tiles: [
    { type: 'count', name: '조명', entities: ['light.a'], navigation_path: '/lovelace/rooms' },
    { type: 'count', name: '조명2', entities: ['light.a'] },
  ] }, { 'light.a': state('light.a', 'on') });
  let located = 0, more = null;
  window.addEventListener('location-changed', () => located++);
  card.addEventListener('hass-more-info', e => { more = e.detail.entityId; });
  const [nav, info] = tiles(card);
  nav.click(); info.click();
  assert.equal(located, 1); assert.equal(window.location.pathname, '/lovelace/rooms');
  assert.equal(more, 'light.a');
});

test('setConfig rejects invalid configs', () => {
  for (const config of [{}, { tiles: [] }, { tiles: [{ type: 'nope', name: 'x' }] }, { tiles: [{ type: 'count', name: 'x', entities: [] }] }, { tiles: [{ type: 'count', name: 'x', entities: ['light.a'] }], columns: 5 }, { tiles: [{ type: 'count', name: 'x', entities: ['light.a'] }], alerts: [{ entity: 'lock.g' }] }]) {
    assert.throws(() => setup(config));
  }
});
