# 3SD Go!

A browser merge game (Suika / "Watermelon Go!" style) where the balls are 3rd Space
team members' faces. Drop a face; two of the same face that touch merge into the next
member up, scoring points. Let the pile overflow the top line too long and it's game
over. Built with **Phaser 4** + **Matter** physics, as plain ES modules.

This README is the single source of truth for the game — both for the agent
**integrating it into the Third Space website** (an existing Vite app) and for anyone
working on the game internals.

---

## Tech stack

- **Phaser 4** (WebGL renderer) with the **Matter** physics engine
- **Vite** for dev/build
- Plain ES modules, no framework / no TypeScript

---

## Integrating into the Third Space site (as a page)

### What you're integrating

Everything under `src/` plus the assets in `src/assets/`:

- `src/embed.js` — the integration entry point. Exports `mountThreeSdGame(parent)`.
- `src/game/`, `src/fruit/`, `src/systems/`, `src/ui/`, `src/scenes/` — the game.
- `src/assets/ballFaces/*.png` — the 10 member faces.
- `src/assets/soundfx/*.mp3` — drop pop, merge pop, vine boom.

All assets are imported through ES module `import` statements, so **Vite bundles them
automatically** — no extra loader config needed in the host app.

### Requirements in the host app

- It's already a Vite project (✅ per the task).
- Install the one runtime dependency:

  ```bash
  npm install phaser@^4.2.1
  ```

### Steps

1. **Copy the game in.** Drop `src/` into the host repo somewhere self-contained, e.g.
   `src/games/3sd-go/` (keep the `assets/` folder alongside the code so the relative
   asset imports resolve).
2. **Add a container with a size.** The canvas scales to FIT a 1280×720 aspect ratio
   inside whatever element you give it, so the container needs real dimensions:

   ```html
   <div id="three-sd-go" style="width: 100%; max-width: 1280px; aspect-ratio: 16 / 9; margin: 0 auto;"></div>
   ```
3. **Mount it**, passing the element id or the element itself. Always destroy on unmount.

   Plain JS / static page:

   ```js
   import { mountThreeSdGame } from '@/games/3sd-go/embed.js';

   const game = mountThreeSdGame('three-sd-go');
   // when leaving the page:
   // game.destroy(true);
   ```

   React page/component:

   ```jsx
   import { useEffect, useRef } from 'react';
   import { mountThreeSdGame } from '@/games/3sd-go/embed.js';

   export function ThreeSdGoPage() {
     const ref = useRef(null);
     useEffect(() => {
       const game = mountThreeSdGame(ref.current);
       return () => game.destroy(true); // release WebGL + audio on unmount
     }, []);
     return <div ref={ref} style={{ width: '100%', maxWidth: 1280, aspectRatio: '16 / 9', margin: '0 auto' }} />;
   }
   ```

   Vue (Composition API):

   ```vue
   <script setup>
   import { onMounted, onBeforeUnmount, ref } from 'vue';
   import { mountThreeSdGame } from '@/games/3sd-go/embed.js';

   const el = ref(null);
   let game;
   onMounted(() => { game = mountThreeSdGame(el.value); });
   onBeforeUnmount(() => { game && game.destroy(true); });
   </script>

   <template>
     <div ref="el" style="width:100%; max-width:1280px; aspect-ratio:16/9; margin:0 auto;" />
   </template>
   ```

### Notes / gotchas

- **One instance at a time per container.** Mounting returns a `Phaser.Game`; don't mount
  twice without destroying first (hot-reload especially — the cleanup return handles it).
- **Audio needs a user gesture.** Browsers unlock audio on first click/tap; the in-game
  Play button and dropping satisfy this, so no extra work needed.
- **High score** is stored in `localStorage` under `merge-space-digital.highScore`. Rename
  the `HIGH_SCORE_KEY` in `src/game/constants.js` if you want to namespace it to the site.
- **Fonts:** uses system `Trebuchet MS`/`Verdana` fallbacks — no web font to load.
- The standalone `src/main.js` + root `index.html` are only for local dev
  (`npm run dev`) and are **not** needed by the host app — use `embed.js` instead.

### Local dev / sanity check (in this repo)

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build (standalone)
npm run preview  # preview the build
```

---

## How the game works (internals)

### Architecture (where things live)

- `src/main.js` — standalone dev entry; boots `Phaser.Game(gameConfig)` into `#game`.
- `src/embed.js` — integration entry for embedding in another site; exports `mountThreeSdGame(parent)`.
- `src/game/config.js` — Phaser + Matter config, viewport scale, and render-quality settings (`antialias` + `mipmapFilter` for crisp scaled faces).
- `src/game/constants.js` — tuning: gravity, crate `BOX`, `playfield()`, body physics, `PALETTE`, `DROP_TIER_CAP`, cooldowns, and audio keys (`SFX_MERGE`, `SFX_BOOM`, `SFX_DROP`).
- `src/game/createGame.js` / `loop.js` / `states.js` — wiring and the fixed-step game loop/state machine.
- `src/scenes/GameScene.js` — the only scene; `preload()` loads face textures (`FACE_ASSETS`) and sound effects, `create()` builds the game, `update()` drives `tick`.
- `src/fruit/catalog.js` — **`FRUITS` table**: tier, id, name, radius, score, and `visual`. Source of truth for ball size/score. `createFruitNode()` builds the display object and `paintFruit()` draws/sizes each ball. Also exports `FACE_ASSETS` (texture keys + URLs) and `SIZE_SCALE`.
- `src/fruit/world.js` — `FruitWorld`: spawns ball game objects, walls, preview, merge cleanup, visual sync.
- `src/fruit/spawnTable.js` — weighted random drop tier (main range capped at `DROP_TIER_CAP`, plus a small decaying tail that rarely drops higher tiers; tune `RARE_HIGH_TIER_CHANCE` / `RARE_DECAY`).
- `src/fruit/spawner.js` — queues current/next ball and handles drops.
- `src/fruit/merge.js` / `aim.js` — merge resolution and aim/drop position.
- `src/systems/` — `input.js` (pointer/keyboard), `danger.js` (overflow/game-over).
- `src/ui/` — `hud.js`, `leaderboard.js`, `stage.js`, `widgets.js`.

### Tiers and the ball faces

There are **10 tiers (0–9)**, each a team member's face, rendered from PNGs in
`src/assets/ballFaces/`. Face order, smallest → largest (set in `catalog.js`):

`Hira → Tomiwa → Haashim → Chris → Anna → Prabhas → Andrew → Noor → Ethan → Emeka`

Emeka (tier 9) is the "winner" ball — the Suika watermelon equivalent. To reorder faces,
change which `face-<name>` key each `def(...)` uses in `FRUITS`. The evolution ring in the
HUD shows a white `?` for each tier until the player first creates it.

### Tuning knobs

- **Ball size:** `SIZE_SCALE` in `catalog.js` (currently `1.15`) multiplies every tier's
  radius at once. The collider reads the scaled radius, so physics stays in sync — never
  resize a ball from the renderer only.
- **Drop rates:** `src/fruit/spawnTable.js`. Main range is capped at `DROP_TIER_CAP`
  (tier 4) with `(steps above)²` weights; `RARE_HIGH_TIER_CHANCE` (~`0.04`) and
  `RARE_DECAY` (`0.3`) control the small tail that rarely drops higher tiers. A tier can
  never drop before it has been reached naturally.
- **Image quality:** `render.mipmapFilter` / `antialias` in `config.js`. Final quality is
  still capped by the source PNG resolution.

### Audio

- Keys live in `constants.js` (`SFX_MERGE`, `SFX_BOOM`, `SFX_DROP`); files in
  `src/assets/soundfx/`. `GameScene.preload()` loads them via Vite asset imports.
- **Drop pop** (`442265__crafty_juggler__pop-sound.mp3`) plays when the player drops a
  ball, in `spawner.js` `tick()`.
- **Merge pop** (`pop_.mp3`) plays once per merge flush in `merge.js` `flush()`.
- **Vine boom** (`vine-boom.mp3`) plays when a merge creates the final tier (Emeka).
- Audio needs a user gesture to unlock (Phaser handles this; the Play click / drops count).

### Conventions / guardrails

- The collider radius must always match the `radius` in `catalog.js`.
- Tiers are ordered small → large; tier 0 is the only one that can't be created by a merge drop.
- Branding: title is **"3SD Go!"**, the bottom-left card is the **"Global Leaderboard"**.
