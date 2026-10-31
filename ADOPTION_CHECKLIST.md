# Selective standards review — verification record

Scope and applicability: [STANDARDS.md](STANDARDS.md). This is a card-specific reference review, not a claim of full integration standards adoption.

## Target and environment

- Date: 2026-10-31 (Asia/Seoul).
- Target: `main` of public repository `eigger/hass-overview-cards`.
- Reference: `ef7762d769a1df8a405412fb4467f87df69aaee6` of the standards repository; no central release descriptor is adopted.
- macOS, Node.js 22.22.0, npm 10.9.4, Happy DOM 21.0.4. GitHub runners use Ubuntu with Node.js 22. No HA minimum or runtime dependency was added.

## Results

| Status | Check | Evidence |
| --- | --- | --- |
| PASS | Reproducible development install | `npm install` with the committed lockfile; CI uses `npm ci`. |
| PASS | JavaScript syntax | `npm run check`. |
| PASS | Card regression suite | `npm test`: 35 passed, 0 failed. Tile summaries, thresholds, unavailable handling, alert lifecycle, YAML booleans, navigation, config validation, groups with embedded `compact-home-panel`, and quick-control chips (toggle, debounced climate steps with clamping, power, confirmation, offline handling). |
| PASS | GitHub CI | `Check` succeeded on Ubuntu/Node.js 22 for commits `c6fab62` ([run 41190794025](https://github.com/eigger/hass-overview-cards/actions/runs/41190794025)) and `a722f36` ([run 41191179038](https://github.com/eigger/hass-overview-cards/actions/runs/41191179038)). |
| PASS | Repository settings | API read-back after configuration: public, squash/rebase merge, auto-merge, branch deletion, read-only default workflow permissions, strict `test` requirement, linear history, no force push or deletion. |
| PASS | Independent review | A separate Opus review of the card, tests, README and workflows found one high and several medium/low issues. They were fixed and covered by tests in commit `a722f36`; unverified items below remain open. |
| PASS | Screenshots | Images in `images/` are real headless Chrome captures of `examples/preview.html` and `examples/showcase.html` with mocked states; see `images/README.md`. |
| PASS | Release workflow | Tag `v0.1.0` passed the release job ([run 41192520436](https://github.com/eigger/hass-overview-cards/actions/runs/41192520436)) and published `compact-overview-card.js`. `v0.2.0` follows the same path; see the release page. |
| TODO | Dependabot auto-merge path | The pinned reusable workflow has not yet processed a Dependabot PR in this repository. |
| TODO | HACS installation and live rendering | No connected HA installation was used. DOM tests and mocked previews do not verify HA compatibility, theme variables or actual devices. |
| PASS | Layout in two engines | Group placement (aligned tops, equal widths, configured order, no gaps, one column at 390px) was measured with real Compact Cards rows in Chromium and WebKit; both gave identical positions at 1500px, 1120px and 390px. Home Assistant itself was not used. |
| TODO | Visual editor in Home Assistant | The editor was exercised in Chromium and WebKit with a stand-in for `<ha-form>` and in unit tests; it has not been opened inside Home Assistant, so real `ha-form` selectors, the lazy loading of `ha-form` and the picker preview are unverified. |
| TODO | Minimum Home Assistant version | The card uses `color-mix` and container queries; no minimum version is declared or verified. |
| N/A | Integration-only checks | No Python integration, domain, manifest, BLE/payload library or integration ZIP. Central integration checker, Hassfest and HA Python fixtures do not apply. |

## Review decisions

The primary agent implemented the card and repository configuration; an independent subagent reviewed it and its findings were applied. Group actions (for example turning every light off) and the richer tile options proposed in the UX review are intentionally out of scope. Direct control is provided by quick-control chips (`controls`) that call Home Assistant services only on a tap; unavailable entities are never commanded, duplicates are blocked, and failures notify. Embedding Compact Cards `compact-home-panel` rows (`items`) remains optional. Live-device behaviour of the chips has not been verified here.

Before the first release, create a tag matching `package.json`, confirm the release job and asset, and verify installation and rendering in Home Assistant. Record those results separately; the TODO entries above are not passes.
