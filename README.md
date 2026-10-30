# Market God Engine — Standalone Edition

A browser-native market simulation built with **HTML, CSS and vanilla JavaScript**.

## Run it

1. Download or clone this repository.
2. Open `index.html` in a modern browser.
3. Play — no Node.js, npm, React, Vite, bundler, server, or installation is required.

The game uses browser Canvas for its chart and Local Storage for saves. If browser storage is disabled, the simulation remains playable for the current session.

## Gameplay

- Four market events: Bull, Bear, Liquidity Raid and Black Swan
- Five market zones with distinct multipliers
- Three trader builds: Scalper, Swing Trader and Whale
- Four analysts with memory-driven dialogue
- Live price chart rendered with the Canvas API
- Boss encounters, five achievements and dynamic endings
- Autosave with validation and recovery from invalid save data
- Responsive layout for desktop, tablet and mobile

## Technology

- `index.html` — semantic page structure
- `styles.css` — responsive visual system, effects and motion
- `game.js` — game state, market engine, rendering and persistence

No third-party libraries, remote fonts, CDNs or network requests are required.

## GitHub Pages

GitHub Actions copies only the three standalone runtime files into the Pages artifact. Pull requests run the packaging check without deploying; pushes to `main` deploy the site.

## Legacy implementation

The original React/Vite source remains under `src/` as a reference. It is not loaded by the standalone game.

## Save compatibility

The standalone edition uses the existing `market-god-engine-save` Local Storage key and understands the earlier save structure, so existing browser progress can be carried over when opened on the same origin.

## License

MIT
