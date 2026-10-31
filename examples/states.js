// Shared mocked Home Assistant states and card configuration for the overview previews.
// Preview only: the card itself is loaded from ../compact-overview-card.js unchanged.
(() => {
  const entity = (id, state, attributes = {}) => ({ entity_id: id, state, attributes });
  const lights = ['light.living_1', 'light.living_2', 'light.living_accent', 'light.bedroom_night', 'light.bedroom_accent', 'switch.kitchen', 'switch.dining', 'switch.hall'];
  const states = () => ({
    ...Object.fromEntries(lights.map((id, i) => [id, entity(id, [1, 0, 1, 0, 0, 1, 0, 0][i] ? 'on' : 'off', { friendly_name: id })])),
    'climate.living_heater': entity('climate.living_heater', 'heat', { friendly_name: '거실 보일러', hvac_action: 'heating' }),
    'climate.bedroom_heater': entity('climate.bedroom_heater', 'heat', { friendly_name: '안방 보일러', hvac_action: 'idle' }),
    'climate.living_ac': entity('climate.living_ac', 'off', { friendly_name: '거실 에어컨', hvac_action: 'off' }),
    'climate.bedroom_ac': entity('climate.bedroom_ac', 'off', { friendly_name: '안방 에어컨', hvac_action: 'off' }),
    'sensor.living_temperature': entity('sensor.living_temperature', '24.5', { friendly_name: '거실 온도', unit_of_measurement: '°C', device_class: 'temperature' }),
    'sensor.washer_state': entity('sensor.washer_state', 'running', { friendly_name: '세탁기' }),
    'sensor.washer_remaining': entity('sensor.washer_remaining', '25', { friendly_name: '세탁 남은 시간', unit_of_measurement: 'min' }),
    'sensor.dryer_state': entity('sensor.dryer_state', 'idle', { friendly_name: '건조기' }),
    'sensor.dishwasher_state': entity('sensor.dishwasher_state', 'idle', { friendly_name: '식기세척기' }),
    'sensor.pm2_5': entity('sensor.pm2_5', '12', { friendly_name: 'PM2.5', unit_of_measurement: 'µg/m³', device_class: 'pm25' }),
    'sensor.power': entity('sensor.power', '412', { friendly_name: '현재 전력', unit_of_measurement: 'W', device_class: 'power' }),
    'sensor.bill': entity('sensor.bill', '32,000', { friendly_name: '예상 요금', unit_of_measurement: '원' }),
    'sensor.ssd_smart': entity('sensor.ssd_smart', 'PASSED', { friendly_name: 'SSD SMART' }),
    'sensor.cpu_temp': entity('sensor.cpu_temp', '54', { friendly_name: 'CPU 온도', unit_of_measurement: '°C', device_class: 'temperature' }),
    'binary_sensor.kitchen_leak': entity('binary_sensor.kitchen_leak', 'off', { friendly_name: '주방 누수', device_class: 'moisture' }),
    'binary_sensor.mech_leak': entity('binary_sensor.mech_leak', 'off', { friendly_name: '실외기실 누수', device_class: 'moisture' }),
    'lock.gas_valve': entity('lock.gas_valve', 'locked', { friendly_name: '가스 밸브' }),
  });
  const config = () => ({
    type: 'custom:compact-overview-card', name: '우리집 요약', columns: 'auto',
    alerts: [
      { entity: 'binary_sensor.kitchen_leak', name: '누수 · 주방', when: { state: 'on' }, level: 'critical', navigation_path: '/lovelace/rooms' },
      { entity: 'binary_sensor.mech_leak', name: '누수 · 실외기실', when: { state: 'on' }, level: 'critical', navigation_path: '/lovelace/rooms' },
      { entity: 'lock.gas_valve', name: '가스 밸브 열림', when: { state: 'unlocked' }, level: 'warning' },
    ],
    tiles: [
      { type: 'count', name: '조명', icon: 'mdi:lightbulb-group', entities: lights, navigation_path: '/lovelace/rooms' },
      { type: 'climate', name: '냉난방', icon: 'mdi:thermostat', entities: ['climate.living_heater', 'climate.bedroom_heater', 'climate.living_ac', 'climate.bedroom_ac'], value_entity: 'sensor.living_temperature', navigation_path: '/lovelace/rooms' },
      { type: 'status', name: '가전', icon: 'mdi:washing-machine', idle_text: '모두 대기', items: [
        { entity: 'sensor.washer_state', name: '세탁', active: ['running'], remaining: 'sensor.washer_remaining' },
        { entity: 'sensor.dryer_state', name: '건조', active: ['running'] },
        { entity: 'sensor.dishwasher_state', name: '식세기', active: ['running'] },
      ], navigation_path: '/lovelace/appliances' },
      { type: 'value', name: '공기', icon: 'mdi:air-filter', entity: 'sensor.pm2_5', thresholds: [{ value: 35, direction: 'above', level: 'warning' }, { value: 75, direction: 'above', level: 'critical' }], navigation_path: '/lovelace/air' },
      { type: 'value', name: '에너지', icon: 'mdi:flash', entity: 'sensor.power', secondary_entity: 'sensor.bill', navigation_path: '/lovelace/manage' },
      { type: 'health', name: '서버', icon: 'mdi:server', items: [
        { entity: 'sensor.ssd_smart', problem: { state_not: 'PASSED' }, level: 'critical' },
        { entity: 'sensor.cpu_temp', thresholds: [{ value: 75, direction: 'above', level: 'warning' }] },
      ], navigation_path: '/lovelace/proxmox' },
    ],
  });
  // Scenarios change mocked states only, never the card.
  const scenarios = {
    normal: () => {},
    alert: s => { s['binary_sensor.kitchen_leak'].state = 'on'; s['lock.gas_valve'].state = 'unlocked'; s['sensor.pm2_5'].state = '48'; s['sensor.ssd_smart'].state = 'FAILED'; },
    offline: s => { for (const id of ['light.living_2', 'sensor.ssd_smart', 'sensor.cpu_temp', 'lock.gas_valve', 'sensor.pm2_5']) s[id].state = 'unavailable'; s['binary_sensor.mech_leak'].state = 'unavailable'; },
  };
  const format = s => {
    const unit = s.attributes.unit_of_measurement;
    const named = { on: '켜짐', off: '꺼짐', locked: '잠김', unlocked: '열림' }[s.state];
    return named ?? (unit ? `${s.state} ${unit}` : s.state);
  };
  window.overviewPreview = { states, config, scenarios, format };
})();
