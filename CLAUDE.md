# CLAUDE.md — Stickman StIMulation

> Comprehensive project documentation for AI agents and future contributors.

## Project Overview

**Stickman StIMulation** is a browser-based, real-time team battle simulator. Four colour-coded teams of entities spawn on a canvas and autonomously fight each other using simple AI (seek, attack, flee). The project is hosted on GitHub Pages at `thekoopa.com`.

**Core loop**: Entities find the nearest enemy → move toward them → attack when in range → flee if outnumbered → die and fade out.

## Architecture

- **Single-file HTML app** — everything lives in `index.html` (HTML + CSS + JS). No build step, no bundler, no framework.
- **Vanilla Canvas 2D** — all rendering uses the native `<canvas>` API.
- **No dependencies** — `package.json` is empty. The app is purely self-contained.
- **Hosted via GitHub Pages** — the `CNAME` file points to `thekoopa.com`.

## Code Structure (index.html)

The `<script>` block is organized into clearly labeled sections:

### 1. Constants
```
COLOURS          — team fill/stroke colours (mutable at runtime via settings)
SPEED, FLEE_SPEED, CONTACT_RANGE, ATTACK_RANGE, ATTACK_CD, DAMAGE, MAX_HP
SEPARATION       — minimum distance between allied entities
HEAD_R, BODY_H, LEG_H, ARM_LEN, HP_BAR_W, HP_BAR_H — stickman geometry
UI_TOP_MARGIN    — space reserved for the toolbar
DEATH_FADE_DUR   — corpse fade-out time
```

### 2. Settings State
```
shapeMode        — 'stickman' | 'circles' | 'liquid'
circleRadius     — radius for circles mode (4–20, default 8)
hexToRgb()       — convert hex colour to {r, g, b}
darkenHex()      — darken a hex colour by a percentage
isLightColour()  — determine if text should be dark on a colour
```

### 3. Canvas Setup
Standard `<canvas>` element with resize handler. The canvas fills the full viewport.

### 4. Entity Model
Each entity (stickman/circle/blob) is a plain JS object:
```js
{
  id, x, y, vx, vy,         // identity & physics
  colour,                     // team name: 'red' | 'blue' | 'green' | 'yellow'
  hp, maxHp,                  // health
  groupId,                    // union-find group root (rebuilt each frame)
  state,                      // 'idle' | 'moving' | 'attacking' | 'fleeing'
  facing,                     // 1 (right) or -1 (left)
  target,                     // reference to enemy being attacked
  attackCD, punchT,           // cooldown & animation timers
}
```
Two arrays: `stickmen` (alive) and `corpses` (dying, fading out).

### 5. Group Tracking
Union-Find algorithm rebuilds every frame. Same-colour entities within `CONTACT_RANGE * 2` are grouped. Group size determines flee behavior (flee when enemy group > 2× own group).

### 6. AI & Movement (`updateAI`)
Per-entity per-frame:
1. Find nearest enemy
2. Flee if outnumbered (enemy group > 2× own)
3. Move toward enemy if out of attack range
4. Attack if in range

**Shape-mode adjustments:**
- `circles` mode: attack range scales with `circleRadius * 2 + 2`
- `liquid` mode: separation force is reduced (0.08 vs 0.3) so blobs merge visually

Separation forces push allied entities apart to prevent stacking.

### 7. Combat (`updateCombat`)
Entities in `attacking` state deal `DAMAGE` to their target every `ATTACK_CD` seconds. Dead entities (hp ≤ 0) are moved to the `corpses` array with a fade timer.

### 8. Rendering

Three rendering paths, dispatched by `shapeMode`:

#### Stickmen (default)
`drawStickman()` — full stick figure with head, body, arms, legs, walk animation, punch animation, and HP bar (shown when damaged).

#### Circles
`drawCircleEntity()` — simple filled circle using `circleRadius`. No eyes, no HP bar.

`resolveCircleCollisions()` — iterative relaxation (3 passes) prevents circles from overlapping. Pushes overlapping pairs apart by half the overlap distance.

#### Liquid (Experimental)
Metaball-based rendering using offscreen canvases:

1. **One offscreen canvas per team** at half resolution (`LIQUID_SCALE = 0.5`)
2. **Radial gradient blobs** drawn with `globalCompositeOperation = 'lighter'` (additive blending). Each entity produces a soft white blob.
3. **Threshold pass** via `getImageData`: pixels with R-channel > `LIQUID_THRESHOLD` are recoloured to the team colour with an edge glow effect. Below threshold → transparent.
4. **Composite** each team's canvas onto the main canvas.

Key constants: `BLOB_RADIUS = 30`, `LIQUID_THRESHOLD = 120`, `LIQUID_SCALE = 0.5`.

Performance note: `willReadFrequently: true` is set on offscreen contexts. Empty teams are skipped entirely.

### 9. Game Loop
Standard `requestAnimationFrame` loop with delta-time clamped to 50ms. Calls: `rebuildGroups()` → `updateAI()` → `resolveCircleCollisions()` (circles mode only) → `updateCombat()` → `render()`.

Pause support via `paused` flag.

### 10. UI / Settings

**Toolbar** (`#ui`): Spawn buttons per team with counters, spawn count input, "Spawn All", "Pause", "Clear All", "⚙ Settings".

**Settings Panel** (slide-out from right):
- **Team Colours**: 4 colour pickers. Changes update `COLOURS` object, spawn button styles, and entity rendering in real time.
- **Shape Mode**: Dropdown — Stickmen (default), Circles, Liquid 🧪.
- **Circle Settings**: Size slider (4–20px), only visible in circles mode.
- **Liquid Settings**: Info text with "EXPERIMENTAL" badge, only visible in liquid mode.

## Conventions

### Coding Style
- **No semicolons?** Actually yes — semicolons ARE used throughout. Keep using them.
- **`const` for immutable bindings**, `let` for mutable state. No `var`.
- **Single-line braces** for short operations (e.g., `ctx.beginPath(); ctx.arc(...); ctx.fill();`).
- **Section headers** use `// ─── Section Name ───...` with em-dashes.
- **Minimal comments** — code is self-documenting. Comments only where behavior isn't obvious.

### Naming
- `camelCase` for variables and functions
- `UPPER_SNAKE_CASE` for constants
- Team names are lowercase strings: `'red'`, `'blue'`, `'green'`, `'yellow'`
- HTML IDs use kebab-case: `spawn-count`, `shape-mode`, `circle-size`

### Architecture Rules
- **Everything in `index.html`** — do not split into separate files. This is a single-page hobby project.
- **No build tools** — no webpack, no vite, no TypeScript. Pure vanilla.
- **No external dependencies** — no libraries, no CDNs. Everything is hand-written.
- **Canvas 2D only** — do not introduce WebGL unless absolutely necessary for performance.

## Instructions for Future AI Agents

### Before Making Changes
1. **Read the full `index.html`** — it's one file, ~700 lines. Understand the whole thing.
2. **Understand the game loop** — changes to physics/rendering must respect the frame-by-frame update cycle.
3. **Check `shapeMode`** — any rendering change must work correctly in all three modes (stickman, circles, liquid).

### When Adding Features
- Add new rendering modes by creating a `drawNewMode()` function and adding a branch in `render()`.
- Add new settings by extending the settings panel HTML and wiring event listeners at the bottom of the script.
- Keep the `COLOURS` object as the single source of truth for team colours.
- New entity properties go in `createStickman()` — every entity gets the same shape.

### When Fixing Bugs
- Test with all three shape modes active.
- Test with 0, 1, and 100+ entities per team.
- Check that the settings panel still opens/closes correctly.
- Verify counters update and pause/resume works.

### Performance Guidelines
- Liquid mode is the bottleneck. Any changes to `renderLiquid()` should be benchmarked.
- Offscreen canvases use half resolution — maintain this optimization.
- The collision resolution loop is O(n²) — acceptable up to ~500 entities. Beyond that, consider spatial partitioning.
- Avoid `getImageData` outside of liquid mode — it's slow.

### Don't
- Don't split the file into multiple files.
- Don't add npm dependencies.
- Don't change the stickman rendering (`drawStickman`) — it's the original and should remain untouched.
- Don't remove the "EXPERIMENTAL" label from liquid mode unless it's been thoroughly tested at scale.
