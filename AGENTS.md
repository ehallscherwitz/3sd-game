# AGENTS.md — 3SD Go!

## What this project is
**3SD Go!** is an alternate version of the "Watermelon Go!" (Suika / merge-fruit) game.
You drop balls into a crate; two balls of the same tier that touch merge into the next
tier up, scoring points. Let the pile overflow the top line too long and it's game over.

The twist for 3SD: the balls are **team members' faces** (see `src/assets/ballFaces/`)
instead of generic fruit.

## Tech stack
- **Phaser 4** (WebGL renderer) with the **Matter** physics engine
- **Vite 8** for dev/build
- Plain ES modules, no framework/TypeScript

## Run it
```
npm install
npm run dev      # start Vite dev server
npm run build    # production build
npm run preview  # preview the build
```

## Architecture (where things live)
- `src/main.js` — composition root; boots `Phaser.Game(gameConfig)`.
- `src/game/config.js` — Phaser + Matter config, viewport scale, and render-quality settings (`antialias` + `mipmapFilter` for crisp scaled faces).
- `src/game/constants.js` — tuning: gravity, crate `BOX`, `playfield()`, body physics, `PALETTE`, `DROP_TIER_CAP`, cooldowns, and audio keys (`SFX_MERGE`, `SFX_BOOM`).
- `src/game/createGame.js` / `loop.js` / `states.js` — wiring and the fixed-step game loop/state machine.
- `src/scenes/GameScene.js` — the only scene; `preload()` loads face textures (`FACE_ASSETS`) and sound effects, `create()` builds the game, `update()` drives `tick`.
- `src/fruit/catalog.js` — **`FRUITS` table**: tier, id, name, radius, score, and `visual`. Source of truth for ball size/score. `createFruitNode()` builds the display object and `paintFruit()` draws/sizes each ball. Also exports `FACE_ASSETS` (texture keys + URLs) and `SIZE_SCALE`.
- `src/fruit/world.js` — `FruitWorld`: spawns ball game objects, walls, preview, merge cleanup, visual sync.
- `src/fruit/spawnTable.js` — weighted random drop tier (main range capped at `DROP_TIER_CAP`, plus a small decaying tail that rarely drops higher tiers; tune `RARE_HIGH_TIER_CHANCE` / `RARE_DECAY`).
- `src/fruit/spawner.js` — queues current/next ball and handles drops.
- `src/fruit/merge.js` / `aim.js` — merge resolution and aim/drop position.
- `src/systems/` — `input.js` (pointer/keyboard), `danger.js` (overflow/game-over).
- `src/ui/` — `hud.js`, `leaderboard.js`, `stage.js`, `widgets.js`.

## Tiers and the ball faces
There are **10 tiers (0–9)**, each a team member's face, rendered from PNGs in
`src/assets/ballFaces/`. Face order, smallest → largest (set in `catalog.js`):

`Hira → Tomiwa → Haashim → Chris → Anna → Prabhas → Andrew → Noor → Ethan → Emeka`

Emeka (tier 9) is the "winner" ball — the Suika watermelon equivalent. To reorder faces,
change which `face-<name>` key each `def(...)` uses in `FRUITS`.

## Tuning knobs
- **Ball size:** `SIZE_SCALE` in `catalog.js` (currently `1.15`) multiplies every tier's
  radius at once. The collider reads the scaled radius, so physics stays in sync — never
  resize a ball from the renderer only.
- **Drop rates:** `src/fruit/spawnTable.js`. Main range is capped at `DROP_TIER_CAP`
  (tier 4) with `(steps above)²` weights; `RARE_HIGH_TIER_CHANCE` (~`0.04`) and
  `RARE_DECAY` (`0.3`) control the small tail that rarely drops higher tiers.
- **Image quality:** `render.mipmapFilter` / `antialias` in `config.js`. Final quality is
  still capped by the source PNG resolution.

## Audio
- Keys live in `constants.js` (`SFX_MERGE`, `SFX_BOOM`, `SFX_DROP`); files in
  `src/assets/soundfx/`. `GameScene.preload()` loads them via Vite asset imports.
- **Drop pop** (`442265__crafty_juggler__pop-sound.mp3`) plays when the player drops a
  ball, in `spawner.js` `tick()`.
- **Merge pop** (`pop_.mp3`) plays once per merge flush in `merge.js` `flush()`.
- **Vine boom** (`vine-boom.mp3`) plays when a merge creates the final tier (Emeka).
- Audio needs a user gesture to unlock (Phaser handles this; the Play click/drops count).

## Conventions / guardrails
- The collider radius must always match the `radius` in `catalog.js`.
- Tiers are ordered small → large; tier 0 is the only one that can't be created by a merge drop.
- Branding: title is **"3SD Go!"**, the bottom-left card is the **"Global Leaderboard"**.
- See `.cursor/rules/token-economy.mdc` for working style (one step at a time, no extra tooling without asking).

## Status note
The game was recently moved out of a `Merge Space Digital/` subfolder up to the repo
root; those path changes are not committed yet.
