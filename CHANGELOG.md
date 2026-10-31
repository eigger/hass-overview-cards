# Changelog

## Unreleased

## 0.3.3 — 2026-10-31

- Restore predictable layout: groups follow the configured order (left to right, top to bottom) in equal-width columns of at least 460px instead of being packed and reordered. Cards keep their natural height. Climate rows from Compact Cards now fit on one line in a single column, so the automatic two-column span for climate groups is removed; `span` remains optional (2 from 940px, 3 from 1400px).

## 0.3.2 — 2026-10-31

- Groups that embed `type: climate` rows now span two columns on cards at least 700px wide by default, so air-conditioner mode buttons stay on one line without extra configuration; set `span: 1` to opt out.

## 0.3.1 — 2026-10-31

- Add group `span` (2 or 3 columns on wide cards) so wide rows such as climate controls stay on one line.
- Pack groups at their natural height instead of stretching them to equal row heights, so short groups no longer show blank space and columns have no gaps (a ResizeObserver assigns each group its row span).

## 0.3.0 — 2026-10-31

- Add quick-control `controls` chips to groups: toggle lights/switches/fans, step climate targets with −/+ (one debounced request, clamped to the entity range) and a power button, press buttons and run scripts/scenes with optional confirmation, and open details for sensors. Chips are dimmed and never commanded while unavailable; duplicate taps are blocked and failures are reported.
- Lay groups out as a packed grid (natural heights, no blank space) with a bold header summary; groups stack in one column on mobile. `items` (embedded `compact-home-panel` rows) are now optional.

## 0.2.0 — 2026-10-31

- Add `sections`: room sections with a one-line header summary, optional header badges and embedded `compact-home-panel` rows for direct control (toggle lights, adjust climate, open details), laid out in columns like the sections view. Add `section_columns`. `tiles` remain available for a controls-free summary grid and are now optional when `sections` are used.
- Previews and screenshots now embed real `compact-home-panel` rows (`scripts/fetch-vendor.sh`, `scripts/capture-images.sh`).

## 0.1.0 — 2026-10-31

- Initial overview card (`custom:compact-overview-card`) with count, climate, status, value and health tiles and an attention alert strip.
- Add bilingual documentation, a local HTML preview and showcase, example dashboards and real browser screenshots.
