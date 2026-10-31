# Representative card images

These JPEG screenshots were captured from `examples/preview.html` and `examples/showcase.html` in headless Chrome. They render the actual `compact-overview-card.js` using mocked HA states and minimal local `ha-card`/`ha-icon` primitives. They are representative previews, not live Home Assistant device verification. Regenerate them after changing the card layout.

Run `python3 -m http.server 8131 --bind 127.0.0.1` in the repository root and open `/examples/preview.html`. `?scenario=alert|normal|offline` selects the mocked state set, `&variant=tiles` the summary-tile configuration, `&theme=dark` the dark theme, `&width=320|390|760|1120` the card width, and `&capture=true` hides the preview chrome. A 422px viewport leaves room for the 390px card and screenshot margins. Service calls only change the mocked state in memory; no real device commands are sent.

| Image | Source page | Viewport |
| --- | --- | --- |
| `overview-card.jpg` | `preview.html?scenario=alert&width=1120&capture=true` | 1136 × 700 |
| `overview-card-clear.jpg` | `preview.html?scenario=normal&width=1120&capture=true` | 1136 × 640 |
| `overview-card-dark.jpg` | `preview.html?scenario=alert&width=1120&theme=dark&capture=true` | 1136 × 700 |
| `overview-card-mobile.jpg` | `preview.html?scenario=alert&width=390&capture=true` in a 390px frame | 390 × 1650 |
| `overview-tiles.jpg`, `overview-tiles-clear.jpg`, `overview-tiles-offline.jpg` | `preview.html?variant=tiles&scenario=alert\|normal\|offline&capture=true` | 422 × 432 / 336 / 336 |
| `showcase-light.jpg`, `showcase-dark.jpg` | `showcase.html?capture=true` (`&theme=dark`) | 1200 × 1320 |

`./scripts/capture-images.sh` regenerates every image (macOS, Google Chrome and `sips`).

Headless Chrome does not render pages narrower than 500px, so the mobile image loads the showcase in a 390px iframe inside a 500px window and crops to the iframe.

`examples/preview-icons.js` contains Material Design Icon paths from Pictogrammers/MaterialDesign, used only by the previews. Source: https://github.com/Templarian/MaterialDesign/tree/master/svg . The upstream Apache-2.0 license is included as `MDI-LICENSE`. The runtime bundle has no icon dependency.

## Languages

Images without a suffix are English and are used by `README.md` and the English sections of the guides. `*-ko.jpg` are the Korean versions used by `README.ko.md` and the Korean sections. The preview pages render English by default; add `lang=ko` to the URL for the Korean captures.

The card's own labels are Korean-only in the bundle, so English captures swap the Korean sample text and card-rendered labels in the page's DOM through `examples/preview-locale.js` (preview only; the bundle is unchanged). The shared mocked states and card configuration live in `examples/states.js`.
