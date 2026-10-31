# Changelog

## Unreleased

## 0.3.0 — 2026-10-31

- Add quick-control `controls` chips to groups: toggle lights/switches/fans, step climate targets with −/+ (one debounced request, clamped to the entity range) and a power button, press buttons and run scripts/scenes with optional confirmation, and open details for sensors. Chips are dimmed and never commanded while unavailable; duplicate taps are blocked and failures are reported.
- Lay groups out as row-aligned grid cells (heights match) with a bold header summary; groups stack in one column on mobile. `items` (embedded `compact-home-panel` rows) are now optional.

## 0.2.0 — 2026-10-31

- Add `sections`: room sections with a one-line header summary, optional header badges and embedded `compact-home-panel` rows for direct control (toggle lights, adjust climate, open details), laid out in columns like the sections view. Add `section_columns`. `tiles` remain available for a controls-free summary grid and are now optional when `sections` are used.
- Previews and screenshots now embed real `compact-home-panel` rows (`scripts/fetch-vendor.sh`, `scripts/capture-images.sh`).

## 0.1.0 — 2026-10-31

- Initial overview card (`custom:compact-overview-card`) with count, climate, status, value and health tiles and an attention alert strip.
- Add bilingual documentation, a local HTML preview and showcase, example dashboards and real browser screenshots.
