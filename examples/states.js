// Shared mocked Home Assistant states and card configuration for the overview previews.
// Preview only: the card itself is loaded from ../compact-overview-card.js unchanged.
(() => {
  const entity = (id, state, attributes = {}) => ({ entity_id: id, state, attributes });
  const lights = ['light.living_1', 'light.living_2', 'light.living_accent', 'light.bedroom_night', 'light.bedroom_accent', 'switch.kitchen', 'switch.dining', 'switch.hall'];
  const lightNames = ['거실등 1', '거실등 2', '거실 간접등', '안방 취침등', '안방 간접등', '주방등', '식탁등', '복도등'];
  const climate = (id, name, mode, action, current, target, modes) => entity(id, mode, { friendly_name: name, hvac_action: action, current_temperature: current, temperature: target, min_temp: 16, max_temp: 30, target_temp_step: 0.5, supported_features: 1, hvac_modes: modes });
  const states = () => ({
    ...Object.fromEntries(lights.map((id, i) => [id, entity(id, [1, 0, 1, 0, 0, 1, 0, 0][i] ? 'on' : 'off', { friendly_name: lightNames[i] })])),
    'climate.living_heater': climate('climate.living_heater', '거실 보일러', 'heat', 'heating', 24.5, 25, ['off', 'heat']),
    'climate.bedroom_heater': climate('climate.bedroom_heater', '안방 보일러', 'heat', 'idle', 23.5, 23, ['off', 'heat']),
    'climate.living_ac': climate('climate.living_ac', '거실 에어컨', 'off', 'off', 24.8, 24, ['off', 'cool', 'dry', 'fan_only', 'auto']),
    'climate.bedroom_ac': climate('climate.bedroom_ac', '안방 에어컨', 'off', 'off', 24.1, 24, ['off', 'cool', 'dry', 'fan_only', 'auto']),
    'switch.purifier': entity('switch.purifier', 'on', { friendly_name: '공기청정기' }),
    'switch.dehumidifier': entity('switch.dehumidifier', 'off', { friendly_name: '제습기' }),
    'sensor.humidity': entity('sensor.humidity', '51', { friendly_name: '거실 습도', unit_of_measurement: '%', device_class: 'humidity' }),
    'sensor.illuminance': entity('sensor.illuminance', '320', { friendly_name: '거실 조도', unit_of_measurement: 'lx', device_class: 'illuminance' }),
    'sensor.bedroom_temperature': entity('sensor.bedroom_temperature', '23.5', { friendly_name: '안방 온도', unit_of_measurement: '°C', device_class: 'temperature' }),
    'sensor.cpu_usage': entity('sensor.cpu_usage', '31', { friendly_name: 'CPU 사용률', unit_of_measurement: '%' }),
    'sensor.memory_usage': entity('sensor.memory_usage', '62', { friendly_name: '메모리 사용률', unit_of_measurement: '%' }),
    'sensor.ssd_temp': entity('sensor.ssd_temp', '41', { friendly_name: 'SSD 온도', unit_of_measurement: '°C', device_class: 'temperature' }),
    'sensor.gas_month': entity('sensor.gas_month', '12.4', { friendly_name: '이번 달 가스', unit_of_measurement: 'm³' }),
    'sensor.water_month': entity('sensor.water_month', '8.1', { friendly_name: '이번 달 수도', unit_of_measurement: 'm³' }),
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
  const tilesConfig = () => ({
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
  const toggle = (entity, name) => ({ entity, name, tap_action: { action: 'toggle' } });
  const info = (entity, name) => ({ entity, name, tap_action: { action: 'more-info' } });
  const sectionsConfig = () => ({
    type: 'custom:compact-overview-card', name: '우리집 요약', section_columns: 'auto',
    alerts: [
      { entity: 'binary_sensor.kitchen_leak', name: '누수 · 주방', when: { state: 'on' }, level: 'critical', navigation_path: '/lovelace/rooms' },
      { entity: 'binary_sensor.mech_leak', name: '누수 · 실외기실', when: { state: 'on' }, level: 'critical', navigation_path: '/lovelace/rooms' },
      { entity: 'lock.gas_valve', name: '가스 밸브 열림', when: { state: 'unlocked' }, level: 'warning' },
    ],
    sections: [
      { name: '조명', icon: 'mdi:lightbulb-group', navigation_path: '/lovelace/rooms', columns: 2,
        summary: { type: 'count', entities: lights }, badges: [{ entity: 'sensor.illuminance', name: '거실 조도' }],
        items: lights.map((id, i) => toggle(id, lightNames[i])) },
      { name: '냉난방', icon: 'mdi:thermostat', navigation_path: '/lovelace/rooms', columns: 2,
        summary: { type: 'climate', entities: ['climate.living_heater', 'climate.bedroom_heater', 'climate.living_ac', 'climate.bedroom_ac'], value_entity: 'sensor.living_temperature' },
        badges: [{ entity: 'sensor.living_temperature', name: '거실' }, { entity: 'sensor.bedroom_temperature', name: '안방' }],
        items: [{ type: 'climate', entity: 'climate.living_heater', name: '거실 보일러' }, { type: 'climate', entity: 'climate.bedroom_heater', name: '안방 보일러' }, { type: 'climate', entity: 'climate.living_ac', name: '거실 에어컨' }, { type: 'climate', entity: 'climate.bedroom_ac', name: '안방 에어컨' }] },
      { name: '공기', icon: 'mdi:air-filter', navigation_path: '/lovelace/air', columns: 2,
        summary: { type: 'value', entity: 'sensor.pm2_5', thresholds: [{ value: 36, direction: 'above', level: 'warning' }, { value: 76, direction: 'above', level: 'critical' }] },
        items: [toggle('switch.purifier', '공기청정기'), toggle('switch.dehumidifier', '제습기'), info('sensor.pm2_5', '거실 PM2.5'), info('sensor.humidity', '거실 습도')] },
      { name: '가전', icon: 'mdi:washing-machine', navigation_path: '/lovelace/appliances', columns: 1,
        summary: { type: 'status', idle_text: '모두 대기', items: [
          { entity: 'sensor.washer_state', name: '세탁', active: ['running'], remaining: 'sensor.washer_remaining' },
          { entity: 'sensor.dryer_state', name: '건조', active: ['running'] },
          { entity: 'sensor.dishwasher_state', name: '식세기', active: ['running'] },
        ] },
        items: [info('sensor.washer_state', '세탁기'), info('sensor.dryer_state', '건조기'), info('sensor.dishwasher_state', '식기세척기')] },
      { name: '에너지', icon: 'mdi:flash', navigation_path: '/lovelace/manage', columns: 2,
        summary: { type: 'value', entity: 'sensor.power', secondary_entity: 'sensor.bill' },
        items: [info('sensor.power', '현재 전력'), info('sensor.bill', '예상 전기요금'), info('sensor.gas_month', '이번 달 가스'), info('sensor.water_month', '이번 달 수도')] },
      { name: '서버', icon: 'mdi:server', navigation_path: '/lovelace/proxmox', columns: 2,
        summary: { type: 'health', items: [
          { entity: 'sensor.ssd_smart', problem: { state_not: 'PASSED' }, level: 'critical' },
          { entity: 'sensor.cpu_temp', thresholds: [{ value: 75, direction: 'above', level: 'warning' }] },
        ] },
        items: [info('sensor.ssd_smart', 'SSD SMART'), info('sensor.ssd_temp', 'SSD 온도'), info('sensor.cpu_usage', 'CPU 사용률'), info('sensor.memory_usage', '메모리 사용률'), info('sensor.cpu_temp', 'CPU 온도')] },
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
  window.overviewPreview = { states, config: sectionsConfig, sectionsConfig, tilesConfig, scenarios, format };
})();
