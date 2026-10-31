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

function live(config, states) {
  const { window, card } = setup(config, states);
  const update = next => { card.hass = { states: { ...states, ...next }, callService: () => {} }; };
  return { window, card, update };
}

test('alerts survive setConfig re-calls and follow state and name changes on the same card', () => {
  const config = { alerts: [
    { entity: 'sensor.door', name: 'A', when: { state: 'a' }, level: 'warning' },
    { entity: 'sensor.door', name: 'B', when: { state: 'b' }, level: 'warning' },
  ], tiles: [{ type: 'count', name: '조명', entities: ['light.a'] }] };
  const { card, update } = live(config, { 'sensor.door': state('sensor.door', 'a'), 'light.a': state('light.a', 'off') });
  assert.match(alerts(card)[0].textContent, /A/);
  update({ 'sensor.door': state('sensor.door', 'b') });
  assert.equal(alerts(card).length, 1); assert.match(alerts(card)[0].textContent, /B/);
  card.setConfig({ ...config, tiles: [{ type: 'count', name: '조명2', entities: ['light.a'] }] });
  assert.equal(alerts(card).length, 1);
  card.setConfig({ ...config, alerts: [{ ...config.alerts[1], name: 'Renamed' }] });
  assert.match(alerts(card)[0].textContent, /Renamed/);
});

test('YAML booleans match on/off states', () => {
  const { card } = setup({ alerts: [{ entity: 'binary_sensor.x', name: 'x', when: { state: true } }], tiles: [{ type: 'status', name: 's', items: [{ entity: 'switch.y', active: [true] }] }] },
    { 'binary_sensor.x': state('binary_sensor.x', 'on'), 'switch.y': state('switch.y', 'on') });
  assert.equal(alerts(card).length, 1);
  assert.match(tiles(card)[0].querySelector('.main').textContent, /1|switch/);
  assert.equal(tiles(card)[0].hasAttribute('data-active'), true);
});

test('thresholds are inclusive, support below, and ignore non-numeric values', () => {
  const config = { tiles: [{ type: 'value', name: 'v', entity: 'sensor.v', thresholds: [{ value: 35, direction: 'above', level: 'warning' }, { value: 20, direction: 'below', level: 'critical' }] }] };
  for (const [value, level] of [['35', 'warning'], ['34.9', ''], ['20', 'critical'], ['', ''], ['abc', '']]) {
    const { card } = setup(config, { 'sensor.v': state('sensor.v', value) });
    assert.equal(tiles(card)[0].dataset.level, level, value);
  }
});

test('climate shows standby for on-but-idle devices and omits off-only as 꺼짐', () => {
  const config = { tiles: [{ type: 'climate', name: 'c', entities: ['climate.a'] }] };
  let { card } = setup(config, { 'climate.a': state('climate.a', 'heat', { hvac_action: 'idle' }) });
  assert.match(tiles(card)[0].querySelector('.main').textContent, /대기/);
  ({ card } = setup(config, { 'climate.a': state('climate.a', 'off') }));
  assert.match(tiles(card)[0].querySelector('.main').textContent, /꺼짐/);
});

test('status reports unavailable items while another is running and taps the running entity', () => {
  const { card, window } = setup({ tiles: [{ type: 'status', name: '가전', items: [
    { entity: 'sensor.w', name: '세탁' }, { entity: 'sensor.d', name: '건조' }, { entity: 'sensor.x', name: '식세기' },
  ] }] }, { 'sensor.w': state('sensor.w', 'idle'), 'sensor.d': state('sensor.d', 'running'), 'sensor.x': state('sensor.x', 'unavailable') });
  assert.match(tiles(card)[0].querySelector('.sub').textContent, /1개 확인 불가/);
  let opened; card.addEventListener('hass-more-info', e => { opened = e.detail.entityId; });
  tiles(card)[0].click();
  assert.equal(opened, 'sensor.d');
});

test('health shows lower-level counts, taps the worst item, and the badge counts flagged tiles', () => {
  const { card } = setup({ name: 'h', alerts: [{ entity: 'sensor.a', when: { state: 'x' } }], tiles: [{ type: 'health', name: '서버', items: [
    { entity: 'sensor.ok', problem: { state: 'bad' } },
    { entity: 'sensor.w1', thresholds: [{ value: 1, direction: 'above', level: 'warning' }] },
    { entity: 'sensor.bad', problem: { state: 'bad' }, level: 'critical' },
  ] }] }, { 'sensor.a': state('sensor.a', 'y'), 'sensor.ok': state('sensor.ok', 'good'), 'sensor.w1': state('sensor.w1', '5'), 'sensor.bad': state('sensor.bad', 'bad') });
  assert.match(tiles(card)[0].querySelector('.sub').textContent, /주의 1건/);
  assert.doesNotMatch(tiles(card)[0].getAttribute('aria-label'), /위험.*위험/);
  assert.match(card.shadowRoot.querySelector('.badge').textContent, /1건 확인 필요/);
  let opened; card.addEventListener('hass-more-info', e => { opened = e.detail.entityId; });
  tiles(card)[0].click();
  assert.equal(opened, 'sensor.bad');
});

test('malformed states do not break rendering', () => {
  const { card } = setup({ tiles: [{ type: 'value', name: 'v', entity: 'sensor.v' }, { type: 'count', name: 'c', entities: ['light.a'] }] },
    { 'sensor.v': { entity_id: 'sensor.v', state: null }, 'light.a': { entity_id: 'light.a', state: 'on' } });
  assert.match(tiles(card)[0].querySelector('.main').textContent, /—/);
  assert.match(tiles(card)[1].querySelector('.main').textContent, /1\/1/);
});

test('alert clicks navigate or open more-info and unsafe alert paths are rejected', () => {
  assert.throws(() => setup({ alerts: [{ entity: 'lock.g', when: { state: 'unlocked' }, navigation_path: '//evil' }], tiles: [{ type: 'count', name: 'x', entities: ['light.a'] }] }), /navigation_path/);
  const { card } = setup({ alerts: [{ entity: 'lock.g', when: { state: 'unlocked' } }], tiles: [{ type: 'count', name: 'x', entities: ['light.a'] }] },
    { 'lock.g': state('lock.g', 'unlocked'), 'light.a': state('light.a', 'on') });
  let opened; card.addEventListener('hass-more-info', e => { opened = e.detail.entityId; });
  alerts(card)[0].click();
  assert.equal(opened, 'lock.g');
});

const panelStub = "customElements.define('compact-home-panel',class extends HTMLElement{setConfig(c){if(c.items.some(i=>i.bad))throw new Error('bad item');this.cfg=c;}set hass(h){this.h=h;}});";
function sectioned(config, states = {}, { stub = true } = {}) {
  const window = new Window({ url: 'http://localhost/' }); window.eval(source); if (stub) window.eval(panelStub);
  const card = window.document.createElement('compact-overview-card'); card.setConfig(config);
  window.document.body.append(card); card.hass = { states, callService: () => { throw new Error('overview itself must not call services'); } };
  return { window, card };
}
const sections = card => [...card.shadowRoot.querySelectorAll('.section')];

test('sections embed compact-home-panel with the configured items and pass hass through', () => {
  const items = [{ entity: 'light.a', name: 'A', tap_action: { action: 'toggle' } }, { type: 'climate', entity: 'climate.b', name: 'B' }];
  const { card } = sectioned({ sections: [{ name: '조명', icon: 'mdi:lightbulb', columns: 2, items }] }, { 'light.a': state('light.a', 'on') });
  const panel = card.shadowRoot.querySelector('compact-home-panel');
  assert.deepEqual(JSON.parse(JSON.stringify(panel.cfg)), { items, columns: 2 });
  assert.equal(panel.h.states['light.a'].state, 'on');
  assert.equal(card.hasAttribute('data-bare'), true);
});

test('section header shows summary with level, badges and navigates on tap', () => {
  const { window, card } = sectioned({ sections: [{
    name: '공기', navigation_path: '/lovelace/air', items: [{ entity: 'sensor.pm' }],
    summary: { type: 'value', entity: 'sensor.pm', thresholds: [{ value: 35, direction: 'above', level: 'warning' }] },
    badges: [{ entity: 'sensor.temp', name: '온도' }],
  }] }, { 'sensor.pm': state('sensor.pm', '48', { unit_of_measurement: 'µg/m³' }), 'sensor.temp': state('sensor.temp', '21', { unit_of_measurement: '°C' }) });
  const [section] = sections(card);
  assert.match(section.querySelector('.sec-sum').textContent, /^주의 · 48/);
  assert.equal(section.querySelector('.sec-sum').dataset.level, 'warning');
  assert.match(section.querySelector('.pill').textContent, /온도/);
  let located = 0; window.addEventListener('location-changed', () => located++);
  section.querySelector('.sec-title').click();
  assert.equal(located, 1); assert.equal(window.location.pathname, '/lovelace/air');
});

test('a missing compact-home-panel shows a note and recovers once defined', async () => {
  const { window, card } = sectioned({ sections: [{ name: 'x', items: [{ entity: 'light.a' }] }] }, { 'light.a': state('light.a', 'on') }, { stub: false });
  assert.match(card.shadowRoot.querySelector('.note').textContent, /compact-cards\.js/);
  window.eval(panelStub);
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.ok(card.shadowRoot.querySelector('compact-home-panel'));
});

test('invalid embedded items are reported inside the section instead of breaking the card', () => {
  const { card } = sectioned({ sections: [{ name: 'x', items: [{ bad: true }] }, { name: 'y', items: [{ entity: 'light.a' }] }] }, { 'light.a': state('light.a', 'on') });
  assert.match(sections(card)[0].querySelector('.note').textContent, /items 설정 오류: bad item/);
  assert.ok(sections(card)[1].querySelector('compact-home-panel'));
});

test('section configs are validated and tiles remain optional when sections exist', () => {
  for (const config of [
    { sections: [{ items: [{ entity: 'light.a' }] }] },
    { sections: [{ name: 'x', items: [] }] },
    { sections: [{ name: 'x', items: [{ entity: 'light.a' }], columns: 3 }] },
    { sections: [{ name: 'x', items: [{ entity: 'light.a' }], summary: { type: 'nope' } }] },
    { sections: [{ name: 'x', items: [{ entity: 'light.a' }], navigation_path: '//evil' }] },
    { sections: [{ name: 'x', items: [{ entity: 'light.a' }] }], section_columns: 5 },
  ]) assert.throws(() => sectioned(config));
  assert.doesNotThrow(() => sectioned({ sections: [{ name: 'x', items: [{ entity: 'light.a' }] }] }));
});
