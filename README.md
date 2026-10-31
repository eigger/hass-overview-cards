# Overview Cards

**English** | [한국어](README.ko.md)

![Overview with alerts and room sections that keep their controls](images/overview-card.jpg)

*Rendered with the actual card JavaScript and mocked states. This is a local preview, not live-device verification.*

<details>
<summary>View the mobile layout, the dark theme and the summary-tile variant</summary>

![Mobile layout](images/overview-card-mobile.jpg)

![Dark theme](images/overview-card-dark.jpg)

![Summary tiles](images/overview-tiles.jpg)

</details>

An overview page for Home Assistant that keeps the familiar layout: **room sections with a summary in the header and the real controls underneath**, plus an **alert strip** for things that need attention. Controls are [Compact Cards](https://github.com/eigger/hass-compact-cards) `compact-home-panel` rows, so lights toggle, climate adjusts and sensors open their details right on the overview.

`custom:compact-overview-card` · one JavaScript file · sections require `compact-cards.js` from Compact Cards (summary tiles do not)

[Card guide](docs/compact-overview-card.md) · [Showcase](docs/showcase.md) · [Showcase configuration](examples/showcase.yaml) · [Standards reference](STANDARDS.md)

## Installation

Install through HACS **Custom repositories** (category **Dashboard**), or copy `compact-overview-card.js` to `/config/www/` and register `/local/compact-overview-card.js` as a JavaScript module in dashboard resources. This project is not in the default HACS catalog.

Sections embed `compact-home-panel`, so also install [Compact Cards](https://github.com/eigger/hass-compact-cards) and register its resource. It uses `color-mix` and container queries, so it needs a recent Home Assistant frontend.

## Example

```yaml
type: custom:compact-overview-card
name: Home
alerts:                  # shown only while the condition matches; zero height otherwise
  - entity: binary_sensor.kitchen_leak
    name: Kitchen leak
    when: { state: "on" }
    level: critical      # warning (default) | critical
    navigation_path: /lovelace/rooms
sections:
  - name: Lights
    icon: mdi:lightbulb-group
    navigation_path: /lovelace/rooms      # tapping the section title opens this view
    columns: 2                            # columns of the embedded rows: auto | 1 | 2
    summary:                              # one-line summary in the header (same options as a tile)
      type: count
      entities: [light.living, light.bedroom, switch.kitchen]
    badges:                               # optional readings next to the summary
      - { entity: sensor.living_illuminance, name: Living lux }
    items:                                # compact-home-panel items, used as they are
      - { entity: light.living, name: Living room, tap_action: { action: toggle } }
      - { entity: light.bedroom, name: Bedroom, tap_action: { action: toggle } }
      - { entity: switch.kitchen, name: Kitchen, tap_action: { action: toggle } }
  - name: Climate
    icon: mdi:thermostat
    navigation_path: /lovelace/rooms
    summary: { type: climate, entities: [climate.living_heater, climate.living_ac], value_entity: sensor.living_temperature }
    items:
      - { type: climate, entity: climate.living_heater, name: Living boiler }
      - { type: climate, entity: climate.living_ac, name: Living AC }
```

Prefer a compact at-a-glance view without controls? Use `tiles` instead of `sections`; see [the guide](docs/compact-overview-card.md).

## Sections

| Option | Required | Description |
| --- | --- | --- |
| `name` | yes | Section title. With `navigation_path` the title is a button that opens that local path |
| `items` | yes | `compact-home-panel` items (toggles, sensors, `type: climate`/`light`/`cover`/`media`, comparison, navigate…) exactly as in [that card](https://github.com/eigger/hass-compact-cards/blob/main/docs/compact-home-panel.md) |
| `icon`, `navigation_path` | no | Title icon and local path |
| `columns` | no | Columns of the embedded rows: `auto` (default), `1` or `2` |
| `summary` | no | A tile spec without `name` (`count`, `climate`, `status`, `value`, `health`); shown right-aligned in the header, coloured by level |
| `badges` | no | `[{ entity, name }]` readings next to the summary; tap opens the entity |

Top-level `section_columns` (`auto`, `1`, `2`, `3`) sets how many columns sections flow into; `auto` uses 2 columns from 640px and 3 from 960px. An invalid `items` entry is reported inside its section and does not break the others.

## Summary tile types (`tiles`, and `summary` of a section)

| type | Required | Shows |
| --- | --- | --- |
| `count` | `entities` | `on / available` |
| `climate` | `entities` (optional `value_entity`) | `N running`, or standby / off, plus a representative reading |
| `status` | `items[]` (`entity`; optional `name`, `active`, `remaining`) | Running items and remaining time, otherwise `idle_text`. `active` defaults to `[running]` |
| `value` | `entity` (optional `secondary_entity`, `thresholds`) | Value, unit and threshold level |
| `health` | `items[]` (`problem` or `thresholds` required; optional `level`) | Count at the worst level plus lower-level count, otherwise "no issues". `level` applies to `problem` only and defaults to `critical` |

Tile options: `name` (required), `icon`, `navigation_path`. Use `tiles` for a controls-free grid; `columns` (`auto`, `2`, `3`, `4`) applies to tiles.

## Rules

- `count` counts only the `on` state (not `open` covers, locks and so on).
- Thresholds are inclusive: `above 35` matches 35, `below 20` matches 20. Non-numeric values are ignored.
- Alert `level` defaults to `warning`.
- When `secondary_entity` is unavailable, the secondary line is hidden.
- In YAML-mode dashboards an unquoted `on`/`off` is read as a boolean. The card maps it back, but quoting is recommended.
- Tapping a tile follows `navigation_path`; without one it opens the entity that explains the summary (the running item or the worst item).

## Principles

- The card never guesses what is normal. Only your `thresholds`, `problem` and `when` rules apply.
- The card itself never calls services; sections call them only through the embedded `compact-home-panel` rows you configured.
- Status is conveyed by color, a `주의 ·` / `위험 ·` text prefix and an icon change together.
- Unavailable entities are counted separately, never treated as healthy.
- Tile order follows your configuration and never reshuffles with state.
- With no alerts the alert area takes no height; only a `✓ 이상 없음` badge remains beside the title.

## Development

```bash
npm install
npm run check
npm test
```
