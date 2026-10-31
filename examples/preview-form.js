// Minimal stand-in for Home Assistant's <ha-form>, used only by the editor preview.
// It renders each schema entry as a plain control and emits `value-changed` like the real element.
customElements.define('ha-form', class extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  set data(value) { this._data = value; this._draw(); }
  get data() { return this._data; }
  set schema(value) { this._schema = value; this._draw(); }
  set hass(value) { this._hass = value; }
  _draw() {
    if (!this._schema || !this._data) return;
    const label = item => this.computeLabel ? this.computeLabel(item) : item.name;
    this.shadowRoot.innerHTML = `<style>:host{display:block}label{display:block;margin:0 0 10px;font-size:12px;color:var(--secondary-text-color)}
      input,select{display:block;width:100%;box-sizing:border-box;margin-top:3px;min-height:40px;padding:6px 10px;font:inherit;font-size:14px;color:var(--primary-text-color);background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:8px}</style>`;
    for (const item of this._schema) {
      const wrap = document.createElement('label'); wrap.textContent = label(item) + (item.required ? ' *' : '');
      const selector = item.selector || {};
      let control;
      if (selector.select) {
        control = document.createElement('select');
        for (const option of selector.select.options) { const o = document.createElement('option'); o.value = option.value; o.textContent = option.label; control.append(o); }
        control.value = String(this._data[item.name] ?? '');
      } else if (selector.number) { control = document.createElement('input'); control.type = 'number'; control.value = this._data[item.name] ?? ''; }
      else {
        control = document.createElement('input'); control.type = 'text';
        const value = this._data[item.name];
        control.value = Array.isArray(value) ? value.join(', ') : (value ?? '');
        if (selector.entity) { control.setAttribute('list', 'entities'); control.placeholder = selector.entity.multiple ? '엔티티, 엔티티' : 'domain.entity'; }
        if (selector.icon) control.placeholder = 'mdi:…';
      }
      control.onchange = () => {
        let value = control.value;
        if (selector.number) value = value === '' ? '' : Number(value);
        if (selector.entity?.multiple) value = value.split(',').map(v => v.trim()).filter(Boolean);
        this._data = { ...this._data, [item.name]: value };
        this.dispatchEvent(new CustomEvent('value-changed', { detail: { value: this._data }, bubbles: true, composed: true }));
      };
      wrap.append(control); this.shadowRoot.append(wrap);
    }
  }
});
