// Compact overview card: category summaries and alerts, with room sections that embed
// compact-home-panel rows for direct control. The card itself reads entity states only;
// services are called by the embedded compact-home-panel rows.
(() => {
  const TILE_TYPES = ['count', 'climate', 'status', 'value', 'health'];
  const LEVELS = { warning: 1, critical: 2 };
  const ID = /^[a-z_]+\.[a-z0-9_]+$/;
  const unusable = s => !s || typeof s.state !== 'string' || s.state === 'unknown' || s.state === 'unavailable';
  // Unquoted on/off in YAML 1.1 dashboards arrive as booleans; map them back to HA state strings.
  const stateText = v => (v === true ? 'on' : v === false ? 'off' : String(v));
  const compactSet = (style, key, value) => { if (style.getPropertyValue(key) !== value) style.setProperty(key, value); };
  const text = (el, value) => { const v = String(value ?? ''); if (el.textContent !== v) el.textContent = v; };
  const attr = (el, key, value) => { const v = String(value); if (el.getAttribute(key) !== v) el.setAttribute(key, v); };
  const safePath = p => typeof p === 'string' && p.startsWith('/') && !p.startsWith('//') && !/[\\\s]/.test(p);

  // Rules are explicit: the card never guesses what "normal" means for a sensor.
  function matches(state, when) {
    if (unusable(state) || !when) return false;
    if (when.state !== undefined) return state.state === stateText(when.state);
    if (when.state_not !== undefined) return state.state !== stateText(when.state_not);
    return false;
  }
  // Thresholds are inclusive: "above 35" matches 35, "below 20" matches 20.
  function thresholdLevel(state, thresholds) {
    if (unusable(state) || !thresholds) return '';
    const value = Number(state.state);
    if (state.state.trim() === '' || !Number.isFinite(value)) return '';
    let level = '';
    for (const t of thresholds) {
      const hit = t.direction === 'above' ? value >= t.value : value <= t.value;
      if (hit && (LEVELS[t.level] || 0) > (LEVELS[level] || 0)) level = t.level;
    }
    return level;
  }
  const worse = (a, b) => ((LEVELS[b] || 0) > (LEVELS[a] || 0) ? b : a);

  function validateRule(rule, where, fail) {
    if (rule === undefined) return;
    if (!rule || typeof rule !== 'object' || (rule.state === undefined) === (rule.state_not === undefined)) fail(`${where}에는 state 또는 state_not 중 하나가 필요합니다.`);
  }
  function validateThresholds(list, where, fail) {
    if (list === undefined) return;
    if (!Array.isArray(list) || list.some(t => !t || !Number.isFinite(t.value) || !['above', 'below'].includes(t.direction) || !LEVELS[t.level])) fail(`${where}.thresholds에는 value, direction(above/below), level(warning/critical)이 필요합니다.`);
  }
  const entityList = (list, where, fail) => {
    if (!Array.isArray(list) || !list.length || list.some(id => typeof id !== 'string' || !ID.test(id))) fail(`${where}에는 엔티티 ID 목록이 필요합니다.`);
  };
  const itemList = (list, where, fail) => {
    if (!Array.isArray(list) || !list.length || list.some(i => !i || typeof i.entity !== 'string' || !ID.test(i.entity))) fail(`${where}에는 entity가 있는 항목 목록이 필요합니다.`);
  };

  function validateSpec(tile, fail) {
    for (const key of ['icon', 'idle_text']) if (tile[key] !== undefined && typeof tile[key] !== 'string') fail(`${key}는 문자열이어야 합니다.`);
    if (tile.type === 'count' || tile.type === 'climate') entityList(tile.entities, 'entities', fail);
    if (tile.type === 'climate' && tile.value_entity !== undefined && !ID.test(tile.value_entity)) fail('value_entity가 올바르지 않습니다.');
    if (tile.type === 'value') {
      if (typeof tile.entity !== 'string' || !ID.test(tile.entity)) fail('entity가 필요합니다.');
      if (tile.secondary_entity !== undefined && !ID.test(tile.secondary_entity)) fail('secondary_entity가 올바르지 않습니다.');
      validateThresholds(tile.thresholds, 'tiles', fail);
    }
    if (tile.type === 'status') {
      itemList(tile.items, 'items', fail);
      tile.items.forEach(item => {
        if (item.active !== undefined && !Array.isArray(item.active)) fail('items[].active는 목록이어야 합니다.');
        if (item.name !== undefined && typeof item.name !== 'string') fail('items[].name은 문자열이어야 합니다.');
        if (item.remaining !== undefined && !ID.test(item.remaining)) fail('items[].remaining이 올바르지 않습니다.');
      });
    }
    if (tile.type === 'health') {
      itemList(tile.items, 'items', fail);
      tile.items.forEach(item => {
        validateRule(item.problem, 'items[].problem', fail);
        validateThresholds(item.thresholds, 'items[]', fail);
        if (item.problem === undefined && item.thresholds === undefined) fail('items[]에는 problem 또는 thresholds가 필요합니다. 카드는 정상 기준을 추측하지 않습니다.');
        if (item.level !== undefined && !LEVELS[item.level]) fail('items[].level은 warning 또는 critical이어야 합니다.');
      });
    }
  }

  const ACTIONS = ['toggle', 'more-info', 'perform-action', 'navigate'];
  const KINDS = ['toggle', 'action', 'readout', 'climate'];
  function validateControls(list, fail) {
    if (!Array.isArray(list) || !list.length) fail('controls에는 항목 목록이 필요합니다.');
    list.forEach((c, i) => {
      const bad = m => fail(`controls[${i}]: ${m}`);
      if (!c || typeof c.entity !== 'string' || !ID.test(c.entity)) bad('entity가 필요합니다.');
      for (const key of ['name', 'icon']) if (c[key] !== undefined && typeof c[key] !== 'string') bad(`${key}는 문자열이어야 합니다.`);
      if (c.type !== undefined && !KINDS.includes(c.type)) bad(`type은 ${KINDS.join(', ')} 중 하나여야 합니다.`);
      if (c.type === 'climate' && !c.entity.startsWith('climate.')) bad('climate 항목에는 climate 엔티티가 필요합니다.');
      const t = c.tap_action;
      if (t !== undefined) {
        if (!t || !ACTIONS.includes(t.action)) bad(`tap_action.action은 ${ACTIONS.join(', ')} 중 하나여야 합니다.`);
        if (t.action === 'perform-action' && (typeof t.perform_action !== 'string' || !/^[a-z_]+\.[a-z0-9_]+$/.test(t.perform_action))) bad('perform-action에는 domain.service 형식의 perform_action이 필요합니다.');
        if (t.action === 'navigate' && !safePath(t.navigation_path)) bad('navigate에는 /로 시작하는 로컬 navigation_path가 필요합니다.');
      }
    });
  }

  class CompactOverviewCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._tiles = []; this._sections = [];
      this.shadowRoot.innerHTML = `<style>
        :host{display:block;container-type:inline-size;-webkit-tap-highlight-color:transparent;
          --compact-control-surface:color-mix(in srgb,var(--primary-text-color) 4%,transparent);
          --compact-icon-surface:color-mix(in srgb,var(--primary-color) 10%,transparent)}
        ha-card.shell{padding:10px;box-shadow:none;border-radius:var(--ha-card-border-radius,14px)}
        :host([data-bare]) ha-card.shell{--ha-card-background:transparent;--ha-card-border-width:0;--ha-card-box-shadow:none;padding:0}
        .grid:empty{display:none}
        header{display:flex;align-items:center;gap:8px;min-height:28px;padding:0 2px 8px}
        header[hidden]{display:none}
        h2{margin:0;font-size:15px;font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .badge{font-size:12px;border-radius:999px;background:var(--compact-control-surface);padding:2px 8px;color:var(--secondary-text-color);white-space:nowrap}
        .badge[hidden]{display:none}
        .alerts{display:grid;gap:6px;margin-bottom:8px}.alerts:empty{display:none;margin:0}
        button,.tile{font:inherit;color:var(--primary-text-color);text-align:left;border:1px solid transparent;border-radius:10px;background:var(--compact-control-surface);cursor:pointer;touch-action:manipulation;min-width:0}
        button:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px}
        .alert{display:flex;align-items:center;gap:8px;min-height:44px;padding:0 10px;font-size:13px;font-weight:500}
        .alert span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .alert[data-level=warning],.tile[data-level=warning]{border-color:color-mix(in srgb,var(--warning-color,#ffa600) 35%,transparent);background:color-mix(in srgb,var(--warning-color,#ffa600) 6%,transparent)}
        .alert[data-level=critical],.tile[data-level=critical]{border-color:color-mix(in srgb,var(--error-color,#db4437) 35%,transparent);background:color-mix(in srgb,var(--error-color,#db4437) 6%,transparent)}
        .tile[data-level=critical]{border-width:2px;padding:7px 9px}
        .alert[data-level=warning] ha-icon,.tile[data-level=warning] .icon{color:var(--warning-color,#ffa600)}
        .alert[data-level=critical] ha-icon,.tile[data-level=critical] .icon{color:var(--error-color,#db4437)}
        .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
        :host([columns="3"]) .grid{grid-template-columns:repeat(3,minmax(0,1fr))}
        :host([columns="4"]) .grid{grid-template-columns:repeat(4,minmax(0,1fr))}
        @container(min-width:421px){:host([columns=auto]) .grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
        @container(min-width:700px){:host([columns=auto]) .grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
        .tile{display:flex;flex-direction:column;justify-content:center;gap:2px;min-height:64px;padding:8px 10px}
        .tile[data-offline]{opacity:.6}
        .head{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--secondary-text-color);min-width:0}
        .head span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        ha-icon{--mdc-icon-size:18px;width:18px;height:18px;flex:none}
        .icon{display:inline-flex;color:var(--secondary-text-color)}
        .tile[data-active] .icon{color:var(--tile-color,var(--primary-color))}
        .main{font-size:19px;font-weight:600;letter-spacing:-.4px;line-height:1.2;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .main small{font-size:13px;font-weight:400;letter-spacing:0;color:var(--secondary-text-color);margin-left:3px}
        .main small:empty{display:none}.sub{font-size:12px;color:var(--secondary-text-color);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-height:15px}
        @container(max-width:360px){.sub{display:none}.tile{padding:8px}}
        /* Row-aligned grid: sections in a row share a height, so nothing ends up ragged. */
        .sections{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(320px,100%),1fr));gap:12px;margin-top:12px;align-items:stretch}.sections:empty{display:none;margin:0}
        :host([data-bare]) .sections{margin-top:0}
        :host([section-columns="1"]) .sections{grid-template-columns:minmax(0,1fr)}
        :host([section-columns="2"]) .sections{grid-template-columns:repeat(2,minmax(0,1fr))}
        :host([section-columns="3"]) .sections{grid-template-columns:repeat(3,minmax(0,1fr))}
        @container(max-width:639px){:host([section-columns="2"]) .sections,:host([section-columns="3"]) .sections{grid-template-columns:minmax(0,1fr)}}
        ha-card.section{display:flex;flex-direction:column;overflow:hidden;box-shadow:none}
        .sec-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-height:44px;padding:4px 12px 0}
        .sec-title{display:flex;align-items:center;gap:8px;flex:1 1 96px;min-width:96px;padding:4px;border:0;border-radius:6px;background:transparent;text-align:left;font:inherit;font-size:14px;font-weight:600;color:var(--primary-text-color)}
        div.sec-title{cursor:default}
        .sec-title span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .sec-title ha-icon{color:var(--secondary-text-color)}
        .sec-sum{font-size:15px;font-weight:600;color:var(--primary-text-color);white-space:nowrap;font-variant-numeric:tabular-nums}.sec-sum:empty{display:none}.sec-sum[data-active]{color:var(--primary-color)}.sec-sum[data-offline]{color:var(--secondary-text-color);font-weight:400}
        .sec-sum[data-level=warning]{color:var(--warning-color,#ffa600)}.sec-sum[data-level=critical]{color:var(--error-color,#db4437);font-weight:600}
        .pill{display:inline-flex;align-items:center;gap:4px;border:0;border-radius:999px;background:var(--compact-control-surface);padding:2px 8px;font-size:12px;min-height:28px;color:var(--primary-text-color)}
        .pill small{color:var(--secondary-text-color);font-size:12px}
        .sec-body compact-home-panel{display:block;--ha-card-background:transparent;--ha-card-border-width:0;--ha-card-box-shadow:none}
        .sec-body .note{font-size:12px;color:var(--secondary-text-color);padding:8px 12px 12px}
        .controls{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(150px,100%),1fr));gap:8px;padding:8px 12px 12px}
        .controls:empty{display:none}
        .chip{--chip-color:var(--primary-color);position:relative;display:flex;align-items:center;gap:4px;min-height:52px;min-width:0;border:1px solid transparent;border-radius:12px;background:var(--compact-control-surface);transition:background-color 150ms ease}
        .chip[data-kind=climate]{grid-column:1/-1;flex-wrap:wrap}
        .chip[data-kind=climate] .chip-main{flex:1 1 150px}
        .chip[data-kind=climate] .stepper{margin-left:auto}
        @container(max-width:339px){.chip[data-kind=climate] .stepper{width:100%;justify-content:flex-end;padding:0 8px 8px}}
        .chip[data-active]{background:color-mix(in srgb,var(--chip-color) 10%,var(--compact-control-surface))}
        .chip[data-offline]{opacity:.55}
        .chip[data-feedback=error]{box-shadow:inset 0 2px var(--error-color,#db4437)}
        .chip-main{all:unset;box-sizing:border-box;flex:1;min-width:0;display:flex;align-items:center;gap:10px;padding:6px 10px;min-height:50px;cursor:pointer;touch-action:manipulation;border-radius:12px}
        .chip-main:focus-visible,.step:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px}
        .chip-main[aria-disabled=true]{cursor:default}
        .chip-icon{display:inline-flex;align-items:center;justify-content:center;flex:none;width:32px;height:32px;border-radius:50%;background:color-mix(in srgb,var(--primary-text-color) 8%,transparent);color:var(--secondary-text-color)}
        .chip[data-active] .chip-icon{background:color-mix(in srgb,var(--chip-color) 20%,transparent);color:var(--chip-color)}
        .chip-text{display:flex;flex-direction:column;min-width:0}
        .chip-name{font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .chip-state{font-size:12px;color:var(--secondary-text-color);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-variant-numeric:tabular-nums}
        .stepper{display:flex;align-items:center;gap:2px;padding-right:8px;flex:none}
        .stepper output{min-width:44px;text-align:center;font-size:15px;font-weight:600;font-variant-numeric:tabular-nums}
        .step{all:unset;box-sizing:border-box;width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;border-radius:10px;cursor:pointer;font-size:18px;color:var(--primary-text-color);background:color-mix(in srgb,var(--primary-text-color) 6%,transparent);touch-action:manipulation}
        .step[aria-disabled=true]{opacity:.4;cursor:default}
        .chip[data-pending] .chip-main{cursor:progress}
        @media(pointer:coarse){.step{width:44px;height:44px}.chip-main{min-height:56px}}
        @media(pointer:coarse){.tile{min-height:64px}.pill{min-height:36px}}
        @media(prefers-reduced-motion:reduce){*{transition:none!important}}
      </style><ha-card class="shell"><header hidden><h2></h2><span class="badge" role="status" hidden></span></header><div class="alerts" aria-live="polite"></div><div class="grid"></div></ha-card><div class="sections"></div>`;
    }

    setConfig(config) {
      if (!config || typeof config !== 'object') throw new Error('설정이 필요합니다.');
      const tilesIn = config.tiles ?? [], sectionsIn = config.sections ?? [];
      if (!Array.isArray(tilesIn) || !Array.isArray(sectionsIn) || !(tilesIn.length || sectionsIn.length)) throw new Error('tiles 또는 sections 목록이 필요합니다.');
      if (config.columns !== undefined && !['auto', 2, 3, 4].includes(config.columns)) throw new Error('columns는 auto, 2, 3, 4 중 하나여야 합니다.');
      if (config.section_columns !== undefined && !['auto', 1, 2, 3].includes(config.section_columns)) throw new Error('section_columns는 auto, 1, 2, 3 중 하나여야 합니다.');
      if (config.alerts !== undefined && !Array.isArray(config.alerts)) throw new Error('alerts는 목록이어야 합니다.');
      (config.alerts || []).forEach((alert, i) => {
        const fail = m => { throw new Error(`alerts[${i}]: ${m}`); };
        if (!alert || typeof alert.entity !== 'string' || !ID.test(alert.entity)) fail('entity가 필요합니다.');
        if (!alert.when) fail('when이 필요합니다.');
        validateRule(alert.when, 'when', fail);
        if (alert.name !== undefined && typeof alert.name !== 'string') fail('name은 문자열이어야 합니다.');
        if (alert.level !== undefined && !LEVELS[alert.level]) fail('level은 warning 또는 critical이어야 합니다.');
        if (alert.navigation_path !== undefined && !safePath(alert.navigation_path)) fail('navigation_path는 /로 시작하는 로컬 경로여야 합니다.');
      });
      sectionsIn.forEach((section, i) => {
        const fail = m => { throw new Error(`sections[${i}]: ${m}`); };
        if (!section || typeof section !== 'object') fail('섹션은 객체여야 합니다.');
        if (typeof section.name !== 'string' || !section.name) fail('name이 필요합니다.');
        if (section.icon !== undefined && typeof section.icon !== 'string') fail('icon은 문자열이어야 합니다.');
        if (section.navigation_path !== undefined && !safePath(section.navigation_path)) fail('navigation_path는 /로 시작하는 로컬 경로여야 합니다.');
        if (section.columns !== undefined && !['auto', 1, 2].includes(section.columns)) fail('columns는 auto, 1, 2 중 하나여야 합니다.');
        const hasItems = section.items !== undefined, hasControls = section.controls !== undefined;
        if (!hasItems && !hasControls) fail('controls 또는 items가 필요합니다.');
        if (hasItems && (!Array.isArray(section.items) || !section.items.length || section.items.some(item => !item || typeof item !== 'object' || Array.isArray(item)))) fail('items에는 compact-home-panel 항목 목록이 필요합니다.');
        if (hasControls) validateControls(section.controls, fail);
        if (section.summary !== undefined) {
          if (!section.summary || !TILE_TYPES.includes(section.summary.type)) fail(`summary.type은 ${TILE_TYPES.join(', ')} 중 하나여야 합니다.`);
          validateSpec(section.summary, m => fail(`summary: ${m}`));
        }
        if (section.badges !== undefined && (!Array.isArray(section.badges) || section.badges.some(b => !b || typeof b.entity !== 'string' || !ID.test(b.entity) || (b.name !== undefined && typeof b.name !== 'string')))) fail('badges에는 entity가 있는 목록이 필요합니다.');
      });
      tilesIn.forEach((tile, i) => {
        const fail = m => { throw new Error(`tiles[${i}]: ${m}`); };
        if (!tile || typeof tile !== 'object') fail('타일은 객체여야 합니다.');
        if (!TILE_TYPES.includes(tile.type)) fail(`type은 ${TILE_TYPES.join(', ')} 중 하나여야 합니다.`);
        if (typeof tile.name !== 'string' || !tile.name) fail('name이 필요합니다.');
        if (tile.navigation_path !== undefined && !safePath(tile.navigation_path)) fail('navigation_path는 /로 시작하는 로컬 경로여야 합니다.');
        validateSpec(tile, fail);
      });
      const key = JSON.stringify(config);
      if (this._configKey === key) return;
      this._configKey = key; this._config = config;
      this.setAttribute('columns', config.columns ?? 'auto');
      this.setAttribute('section-columns', config.section_columns ?? 'auto');
      this.toggleAttribute('data-bare', !tilesIn.length);
      this._build(); this._render();
    }
    set hass(hass) { this._hass = hass; this._render(); }
    getCardSize() {
      const sections = this._config?.sections ?? [];
      const rows = sections.reduce((sum, section) => sum + 1 + ((section.controls?.length ?? 0) + (section.items?.length ?? 0)) / 2, 0);
      return Math.ceil(((this._config?.tiles ?? []).length / 2) + rows / 2) + 1 + (this._alertCount || 0) * 0.5;
    }
    getGridOptions() { return { columns: 12, min_columns: 6 }; }
    static getStubConfig(hass) {
      const light = Object.keys(hass?.states || {}).filter(id => id.startsWith('light.')).slice(0, 3);
      return { name: '우리집', tiles: [{ type: 'count', name: '조명', icon: 'mdi:lightbulb-group', entities: light.length ? light : ['light.living_room'] }] };
    }

    _more(id) {
      if (id && this._hass?.states[id]) this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: id }, bubbles: true, composed: true }));
    }
    _go(path) {
      if (!safePath(path)) return;
      history.pushState({ from: location.pathname }, '', path);
      window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: false } }));
    }
    _open(path, entityId) { if (path) this._go(path); else this._more(entityId); }
    _firstEntity(tile) { return tile.entity ?? tile.entities?.[0] ?? tile.items?.[0]?.entity; }

    _build() {
      const root = this.shadowRoot;
      this._alertKey = undefined; this._alertCount = 0;
      root.querySelector('.alerts').replaceChildren();
      const grid = root.querySelector('.grid'); grid.replaceChildren(); this._tiles = [];
      const header = root.querySelector('header');
      text(root.querySelector('h2'), this._config.name || '');
      for (const tile of this._config.tiles ?? []) {
        const el = document.createElement('button'); el.className = 'tile';
        const ref = { tile, el };
        // Tap opens the entity that explains the summary (running appliance, worst item), not just the first one.
        el.onclick = () => this._open(tile.navigation_path, ref.focus ?? this._firstEntity(tile));
        const head = document.createElement('div'); head.className = 'head';
        const iconWrap = document.createElement('span'); iconWrap.className = 'icon';
        const icon = document.createElement('ha-icon'); icon.setAttribute('aria-hidden', 'true'); iconWrap.append(icon);
        const label = document.createElement('span'); label.textContent = tile.name;
        head.append(iconWrap, label);
        const main = document.createElement('div'); main.className = 'main';
        const mainText = document.createTextNode(''), small = document.createElement('small');
        main.append(mainText, small);
        const sub = document.createElement('div'); sub.className = 'sub';
        el.append(head, main, sub); grid.append(el);
        Object.assign(ref, { icon, mainText, small, sub });
        this._tiles.push(ref);
      }
      header.hidden = !this._config.name && !(this._config.alerts || []).length;
      this._buildSections();
    }

    // ---- quick-control chips -------------------------------------------------------------
    _makeControl(control, box) {
      const domain = control.entity.split('.')[0];
      const kind = control.type || (domain === 'climate' ? 'climate'
        : ['light', 'switch', 'fan', 'input_boolean', 'humidifier', 'automation'].includes(domain) ? 'toggle'
        : ['button', 'input_button', 'script', 'scene'].includes(domain) ? 'action' : 'readout');
      const el = document.createElement('div'); el.className = 'chip'; el.dataset.kind = kind;
      const main = document.createElement('button'); main.className = 'chip-main'; main.type = 'button';
      const iconWrap = document.createElement('span'); iconWrap.className = 'chip-icon';
      const icon = document.createElement('ha-state-icon'); icon.setAttribute('aria-hidden', 'true'); iconWrap.append(icon);
      const textBox = document.createElement('span'); textBox.className = 'chip-text';
      const name = document.createElement('span'); name.className = 'chip-name';
      const stateLine = document.createElement('span'); stateLine.className = 'chip-state';
      textBox.append(name, stateLine); main.append(iconWrap, textBox); el.append(main);
      const ref = { control, kind, el, main, icon, name, stateLine, domain };
      main.onclick = () => this._chipTap(ref);
      if (kind === 'climate') {
        const stepper = document.createElement('div'); stepper.className = 'stepper';
        const mk = (label, aria, handler) => { const b = document.createElement('button'); b.className = 'step'; b.type = 'button'; b.textContent = label; b.setAttribute('aria-label', aria); b.onclick = handler; return b; };
        ref.minus = mk('−', '설정 온도 낮추기', () => this._step(ref, -1));
        ref.plus = mk('+', '설정 온도 높이기', () => this._step(ref, 1));
        ref.target = document.createElement('output');
        ref.power = mk('⏻', '켜기/끄기', () => this._climatePower(ref));
        stepper.append(ref.minus, ref.target, ref.plus, ref.power); el.append(stepper);
      }
      box.append(el);
      return ref;
    }

    _chipColor(state) {
      if (!state || unusable(state)) return 'var(--secondary-text-color)';
      const domain = state.entity_id.split('.')[0];
      if (domain === 'light') return 'var(--state-light-active-color,var(--primary-color))';
      if (domain === 'climate') {
        const action = state.attributes?.hvac_action ?? state.state;
        if (['heating', 'heat'].includes(action)) return 'var(--state-climate-heat-color,#ff8100)';
        if (['cooling', 'cool'].includes(action)) return 'var(--state-climate-cool-color,#2b9af9)';
        return 'var(--state-climate-active-color,var(--primary-color))';
      }
      return `var(--state-${domain}-active-color,var(--state-active-color,var(--primary-color)))`;
    }

    _renderControl(ref) {
      const { control, kind } = ref, state = this._hass.states[control.entity], offline = unusable(state);
      const label = control.name || state?.attributes?.friendly_name || control.entity;
      const busy = this._busy?.has(control.entity);
      const active = !offline && (kind === 'climate' ? state.state !== 'off' : kind === 'toggle' ? state.state === 'on' : kind === 'readout' && state.state === 'on');
      text(ref.name, label);
      ref.el.toggleAttribute('data-active', active); ref.el.toggleAttribute('data-offline', offline); ref.el.toggleAttribute('data-pending', Boolean(busy));
      compactSet(ref.el.style, '--chip-color', this._chipColor(state));
      if (ref.icon.hass !== this._hass) ref.icon.hass = this._hass;
      if (ref.icon.stateObj !== state) ref.icon.stateObj = state;
      const iconName = control.icon || (!state ? 'mdi:help-circle-outline' : undefined);
      if (iconName && ref.icon.icon !== iconName) ref.icon.icon = iconName;
      let line = this._format(state);
      if (kind === 'climate' && !offline) {
        const current = state.attributes?.current_temperature, target = ref.pendingTarget ?? state.attributes?.temperature;
        line = [this._format(state), current !== undefined ? `${current}°` : ''].filter(Boolean).join(' · ');
        text(ref.target, target !== undefined && target !== null ? `${target}°` : '—');
        const range = this._range(state), has = typeof target === 'number';
        for (const [button, delta] of [[ref.minus, -1], [ref.plus, 1]]) attr(button, 'aria-disabled', !has || (delta < 0 ? target <= range.min : target >= range.max));
        attr(ref.power, 'aria-disabled', false);
        attr(ref.power, 'aria-pressed', state.state !== 'off');
      } else if (kind === 'climate') {
        text(ref.target, '—'); for (const b of [ref.minus, ref.plus, ref.power]) attr(b, 'aria-disabled', true);
      }
      text(ref.stateLine, line);
      const service = this._defaultAction(ref).action !== 'more-info';
      attr(ref.main, 'aria-disabled', offline && service);
      attr(ref.main, 'aria-label', `${label} ${line}`.trim());
      attr(ref.main, 'title', `${label} ${line}`.trim());
      if (kind === 'toggle') attr(ref.main, 'aria-pressed', active);
    }

    _range(state) { return { min: state.attributes?.min_temp ?? 7, max: state.attributes?.max_temp ?? 35, step: state.attributes?.target_temp_step ?? 0.5 }; }

    _defaultAction(ref) {
      if (ref.control.tap_action) return ref.control.tap_action;
      if (ref.kind === 'toggle') return { action: 'toggle' };
      if (ref.kind === 'action') {
        const perform = { button: 'button.press', input_button: 'input_button.press', script: 'script.turn_on', scene: 'scene.turn_on' }[ref.domain];
        return perform ? { action: 'perform-action', perform_action: perform } : { action: 'more-info' };
      }
      return { action: 'more-info' };
    }

    _chipTap(ref) {
      const action = this._defaultAction(ref), id = ref.control.entity, state = this._hass?.states[id];
      if (action.action === 'more-info') return this._more(id);
      if (action.action === 'navigate') return this._go(action.navigation_path);
      if (unusable(state) || this._busy?.has(id)) return undefined;
      if (action.confirmation && !window.confirm(action.confirmation.text || '실행할까요?')) return undefined;
      if (action.action === 'toggle') return this._service(ref, 'homeassistant', 'toggle', { entity_id: id });
      const [domain, service] = action.perform_action.split('.');
      return this._service(ref, domain, service, action.data || {}, action.target || { entity_id: id });
    }

    _climatePower(ref) {
      const state = this._hass?.states[ref.control.entity];
      if (unusable(state)) return undefined;
      return this._service(ref, 'climate', state.state === 'off' ? 'turn_on' : 'turn_off', { entity_id: ref.control.entity });
    }

    _step(ref, direction) {
      const id = ref.control.entity, state = this._hass?.states[id];
      if (unusable(state) || state.state === 'off') return;
      const range = this._range(state), base = ref.pendingTarget ?? state.attributes?.temperature;
      if (typeof base !== 'number') return;
      const next = Math.min(range.max, Math.max(range.min, Math.round((base + direction * range.step) / range.step) * range.step));
      if (next === base) return;
      ref.pendingTarget = Number(next.toFixed(2)); this._render();
      // Commit once after the last tap so rapid presses send one request.
      clearTimeout(ref.stepTimer);
      ref.stepTimer = setTimeout(async () => {
        const value = ref.pendingTarget;
        await this._service(ref, 'climate', 'set_temperature', { entity_id: id, temperature: value });
        ref.pendingTarget = undefined; this._render();
      }, 450);
    }

    async _service(ref, domain, service, data, target) {
      const id = ref.control.entity;
      this._busy = this._busy || new Set(); this._busy.add(id); this._render();
      try {
        await (target ? this._hass.callService(domain, service, data, target) : this._hass.callService(domain, service, data));
      } catch (error) {
        ref.el.dataset.feedback = 'error'; setTimeout(() => { delete ref.el.dataset.feedback; }, 1800);
        this.dispatchEvent(new CustomEvent('hass-notification', { detail: { message: `변경 실패: ${error?.message || error}` }, bubbles: true, composed: true }));
      } finally {
        this._busy.delete(id); this._render();
      }
    }

    _buildSections() {
      const box = this.shadowRoot.querySelector('.sections'); box.replaceChildren(); this._sections = [];
      for (const section of this._config.sections ?? []) {
        const card = document.createElement('ha-card'); card.className = 'section';
        const head = document.createElement('div'); head.className = 'sec-head';
        const title = document.createElement(section.navigation_path ? 'button' : 'div'); title.className = 'sec-title';
        if (section.navigation_path) { title.onclick = () => this._go(section.navigation_path); title.setAttribute('aria-label', `${section.name} 열기`); }
        const icon = document.createElement('ha-icon'); icon.setAttribute('aria-hidden', 'true'); icon.icon = section.icon || 'mdi:circle-outline';
        const name = document.createElement('span'); name.textContent = section.name;
        title.append(icon, name);
        const sum = document.createElement('span'); sum.className = 'sec-sum';
        head.append(title, sum);
        const badges = (section.badges || []).map(badge => {
          const button = document.createElement('button'); button.className = 'pill';
          const label = document.createElement('small'), value = document.createElement('span');
          button.append(label, value); button.onclick = () => this._more(badge.entity); head.append(button);
          return { badge, label, value, button };
        });
        const controls = document.createElement('div'); controls.className = 'controls';
        const chips = (section.controls || []).map(control => this._makeControl(control, controls));
        const body = document.createElement('div'); body.className = 'sec-body';
        card.append(head, controls, body); box.append(card);
        this._sections.push({ section, card, sum, badges, body, chips });
      }
    }

    _sectionSummary(section) {
      if (!section.summary) return null;
      const s = this._summarise({ ...section.summary, name: section.name });
      const level = s.level || '', prefix = level === 'critical' ? '위험 · ' : level === 'warning' ? '주의 · ' : '';
      return { level, active: Boolean(s.active), offline: Boolean(s.offline), text: [prefix + (s.number ?? ''), s.unit, s.label].filter(Boolean).join(' ') };
    }

    _renderSections(summaries) {
      for (const [index, ref] of this._sections.entries()) {
        const summary = summaries[index];
        text(ref.sum, summary?.text ?? ''); attr(ref.sum, 'data-level', summary?.level ?? '');
        ref.sum.toggleAttribute('data-active', Boolean(summary?.active)); ref.sum.toggleAttribute('data-offline', Boolean(summary?.offline));
        for (const chip of ref.chips) this._renderControl(chip);
        for (const item of ref.badges) {
          const state = this._hass.states[item.badge.entity];
          text(item.label, item.badge.name || state?.attributes?.friendly_name || item.badge.entity);
          text(item.value, this._format(state));
          attr(item.button, 'title', `${item.label.textContent} ${item.value.textContent}`);
        }
        if (ref.section.items && !ref.panel && !ref.failed) {
          if (!customElements.get('compact-home-panel')) {
            if (!ref.waiting) { ref.waiting = true; customElements.whenDefined('compact-home-panel').then(() => this._render()); }
            const note = ref.body.querySelector('.note') || ref.body.appendChild(Object.assign(document.createElement('div'), { className: 'note' }));
            text(note, 'compact-cards.js 리소스(compact-home-panel)가 필요합니다.');
          } else {
            try {
              const panel = document.createElement('compact-home-panel');
              panel.setConfig({ items: ref.section.items, columns: ref.section.columns ?? 'auto' });
              ref.body.replaceChildren(panel); ref.panel = panel;
            } catch (error) {
              ref.failed = true;
              ref.body.replaceChildren(Object.assign(document.createElement('div'), { className: 'note', textContent: `items 설정 오류: ${error.message}` }));
            }
          }
        }
        if (ref.panel) ref.panel.hass = this._hass;
      }
    }

    _format(state) {
      if (unusable(state)) return '확인 불가';
      return this._hass.formatEntityState?.(state) ?? `${state.state} ${state.attributes?.unit_of_measurement || ''}`.trim();
    }
    _split(state) {
      const formatted = this._format(state), unit = state?.attributes?.unit_of_measurement || '';
      if (unit && formatted.endsWith(unit)) return { number: formatted.slice(0, -unit.length).trimEnd(), unit };
      return { number: formatted, unit: '' };
    }

    // Each summary returns { number, unit, label, sub, level, active, offline, count }.
    _summarise(tile) {
      const states = id => this._hass.states[id];
      if (tile.type === 'count') {
        const all = tile.entities.map(states), usable = all.filter(s => !unusable(s));
        if (!usable.length) return { number: '—', label: '확인 불가', offline: true };
        const on = usable.filter(s => s.state === 'on').length, down = all.length - usable.length;
        return { number: `${on}/${usable.length}`, label: '켜짐', sub: down ? `${down}개 확인 불가` : '', active: on > 0 };
      }
      if (tile.type === 'climate') {
        const all = tile.entities.map(states), usable = all.filter(s => !unusable(s));
        if (!usable.length) return { number: '—', label: '확인 불가', offline: true };
        const on = usable.filter(s => s.state !== 'off');
        const running = on.filter(s => !['idle', 'off'].includes(s.attributes?.hvac_action)).length;
        const temp = tile.value_entity ? states(tile.value_entity) : undefined;
        const down = all.length - usable.length;
        return {
          number: running ? `${running}대` : on.length ? '대기' : '꺼짐', label: running ? '가동' : '',
          sub: [temp && !unusable(temp) ? this._format(temp) : '', down ? `${down}대 확인 불가` : ''].filter(Boolean).join(' · '), active: running > 0,
        };
      }
      if (tile.type === 'status') {
        const all = tile.items.map(item => ({ item, state: states(item.entity) }));
        if (all.every(r => unusable(r.state))) return { number: '—', label: '확인 불가', offline: true };
        const active = all.filter(r => !unusable(r.state) && (r.item.active || ['running']).map(stateText).includes(r.state.state));
        const downCount = all.filter(r => unusable(r.state)).length, down = downCount ? `${downCount}개 확인 불가` : '';
        if (!active.length) return { number: tile.idle_text || '모두 대기', sub: down };
        const first = active[0], remaining = first.item.remaining ? states(first.item.remaining) : undefined;
        const detail = remaining && !unusable(remaining) ? this._format(remaining) : '';
        return {
          number: active.length > 1 ? `${active.length}대` : (first.item.name || first.state.attributes?.friendly_name || first.item.entity), label: '동작 중',
          sub: [active.length > 1 ? first.item.name : '', detail, down].filter(Boolean).join(' · '), active: true, focus: first.item.entity,
        };
      }
      if (tile.type === 'value') {
        const state = states(tile.entity);
        if (unusable(state)) return { number: '—', label: '확인 불가', offline: true };
        const { number, unit } = this._split(state), second = tile.secondary_entity ? states(tile.secondary_entity) : undefined;
        const level = thresholdLevel(state, tile.thresholds);
        return { number, unit, sub: second && !unusable(second) ? this._format(second) : '', level, active: false };
      }
      // health: worst configured level wins. Unavailable items are reported, never treated as healthy.
      const results = tile.items.map(item => {
        const state = states(item.entity);
        if (unusable(state)) return { down: true };
        let level = '';
        if (item.problem && matches(state, item.problem)) level = item.level || 'critical';
        level = worse(level, thresholdLevel(state, item.thresholds));
        return { level, entity: item.entity };
      });
      const down = results.filter(r => r.down).length, known = results.filter(r => !r.down);
      if (!known.length) return { number: '—', label: '확인 불가', offline: true };
      const level = known.reduce((acc, r) => worse(acc, r.level), '');
      const count = known.filter(r => r.level === level).length;
      const lower = level === 'critical' ? known.filter(r => r.level === 'warning').length : 0;
      const sub = [lower ? `주의 ${lower}건` : '', down ? `${down}개 확인 불가` : ''].filter(Boolean).join(' · ');
      if (!level) return { number: '이상 없음', sub };
      return { number: `${count}건`, sub, level, focus: known.find(r => r.level === level).entity };
    }

    _render() {
      if (!this._hass || !this._config) return;
      let unavailableAlerts = 0;
      const hits = [];
      for (const [index, alert] of (this._config.alerts || []).entries()) {
        const state = this._hass.states[alert.entity];
        if (unusable(state)) { unavailableAlerts++; continue; }
        if (matches(state, alert.when)) hits.push({ alert, state, index });
      }
      hits.sort((a, b) => (LEVELS[b.alert.level || 'warning']) - (LEVELS[a.alert.level || 'warning']));
      this._renderAlerts(hits);
      const summaries = this._tiles.map(ref => this._summarise(ref.tile));
      const sectionSummaries = this._sections.map(ref => this._sectionSummary(ref.section));
      const flagged = hits.length + summaries.filter(s => s.level).length + sectionSummaries.filter(s => s?.level).length;
      const badge = this.shadowRoot.querySelector('.badge'), header = this.shadowRoot.querySelector('header');
      const hasAlerts = Boolean((this._config.alerts || []).length);
      badge.hidden = !hasAlerts;
      if (hasAlerts) text(badge, [flagged ? `${flagged}건 확인 필요` : '', unavailableAlerts ? `${unavailableAlerts}개 확인 불가` : ''].filter(Boolean).join(' · ') || '✓ 이상 없음');
      header.hidden = !this._config.name && !hasAlerts;

      this._renderSections(sectionSummaries);
      for (const [index, ref] of this._tiles.entries()) {
        const s = summaries[index];
        ref.focus = s.focus;
        const level = s.level || '';
        attr(ref.el, 'data-level', level);
        if (s.active) attr(ref.el, 'data-active', ''); else ref.el.removeAttribute('data-active');
        if (s.offline) attr(ref.el, 'data-offline', ''); else ref.el.removeAttribute('data-offline');
        const icon = level === 'critical' ? 'mdi:alert-circle' : level === 'warning' ? 'mdi:alert' : (s.offline ? 'mdi:help-circle-outline' : (ref.tile.icon || 'mdi:circle-outline'));
        if (ref.icon.icon !== icon) ref.icon.icon = icon;
        const prefix = level === 'critical' ? '위험 · ' : level === 'warning' ? '주의 · ' : '';
        const main = prefix + (s.number ?? ''), small = [s.unit, s.label].filter(Boolean).join(' ');
        if (ref.mainText.data !== main) ref.mainText.data = main;
        text(ref.small, small);
        text(ref.sub, s.sub || '');
        const summary = [ref.tile.name, main, small, s.sub].filter(Boolean).join(' ');
        attr(ref.el, 'title', summary);
        attr(ref.el, 'aria-label', summary);
      }
    }

    _renderAlerts(hits) {
      const box = this.shadowRoot.querySelector('.alerts');
      const named = hits.map(({ alert, index }) => ({
        alert, level: alert.level || 'warning',
        name: alert.name || this._hass.states[alert.entity]?.attributes?.friendly_name || alert.entity,
        index,
      }));
      const key = named.map(h => `${h.index}|${h.level}|${h.name}`).join(',');
      this._alertCount = named.length;
      if (this._alertKey !== key) {
        this._alertKey = key; box.replaceChildren();
        for (const { alert, level, name } of named) {
          const btn = document.createElement('button'); btn.className = 'alert'; btn.dataset.level = level;
          const icon = document.createElement('ha-icon'); icon.icon = level === 'critical' ? 'mdi:alert-circle' : 'mdi:alert'; icon.setAttribute('aria-hidden', 'true');
          const label = document.createElement('span');
          label.textContent = `${level === 'critical' ? '위험' : '주의'} · ${name}`;
          btn.title = label.textContent; btn.setAttribute('aria-label', label.textContent);
          btn.append(icon, label);
          btn.onclick = () => this._open(alert.navigation_path, alert.entity);
          box.append(btn);
        }
      }
    }
  }

  if (!customElements.get('compact-overview-card')) customElements.define('compact-overview-card', CompactOverviewCard);
  window.customCards = window.customCards || [];
  if (!window.customCards.some(c => c.type === 'compact-overview-card')) {
    window.customCards.push({ type: 'compact-overview-card', name: 'Compact overview card', description: '카테고리별 요약 타일과 이상 알림' });
  }
})();
