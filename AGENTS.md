# AGENTS.md — AI Agent Operating Contract

This file defines how AI agents (Codex, Copilot, Claude Code, etc.) must behave
when generating or modifying code in this repository.

This is a TypeScript browser game project. The stack is locked. Do not change it.

---

# 0. DESIGN PHILOSOPHY SOURCE OF TRUTH

For gameplay and game-design decisions, agents must consult `README.md` and follow its
vision, pillars, and guardrails.

Priority rule for design intent:
1. This `AGENTS.md` for operational and technical constraints
2. `README.md` for gameplay philosophy and design tradeoffs

If implementation details are unclear, choose the conservative option that remains
consistent with both files, and add `TODO(spec)` when needed.

---

# 1. OFFICIAL TECH STACK (DO NOT DEVIATE)

Frontend / Engine:
- TypeScript (strict mode enabled)
- Babylon.js (latest stable)
- WebGL2 (WebGPU optional, but not required for v1)
- Vite (build tool + dev server)

Architecture:
- ECS-style architecture (custom implementation, no heavy ECS frameworks)
- Fixed timestep simulation (60Hz)
- Object pooling for high-churn entities
- Web Worker for A* pathfinding

UI:
- React (for HUD + menus)
- DOM overlay above Babylon canvas

Testing:
- Jest (test runner)
- Chai (assertions)
- ts-jest for TypeScript support
- Playwright (E2E + visual screenshot tests)

Linting / Quality:
- ESLint
- Prettier
- TypeScript strict mode ON

Package Manager:
- npm

DO NOT:
- Replace Babylon with Three.js
- Replace Jest with Vitest
- Replace Chai with built-in expect
- Replace Vite with Webpack
- Introduce large frameworks without approval

---

# 2. GIT WORKFLOW REQUIREMENTS

All work must follow a branch workflow.

Branch naming:
- feat/<feature-name>
- fix/<bug-name>
- test/<area>
- chore/<task>

Rules before merging into `main`:

1. All merge conflicts must be resolved.
2. `npm ci` or `npm install` must succeed.
3. `npm test` must pass.
4. `npm run build` must succeed.
5. A screenshot artifact must be generated.
6. If visuals changed, Playwright snapshot tests must pass.

Never merge broken builds into main.

Commits must follow:
- feat: ...
- fix: ...
- test: ...
- chore: ...
- docs: ...

---

# 3. BUILD & TEST COMMAND CONTRACT

The following npm scripts must exist and work:

- npm run dev
- npm run build
- npm test
- npm run test:e2e
- npm run test:e2e:update
- npm run artifacts:screenshot

A branch is not valid if any of these fail.

---

# 4. ARCHITECTURE RULES

## Simulation Loop

Use fixed timestep:

updateSimulation(dtFixed)
render(interpolatedState)

Simulation must not depend on rendering layer.

## ECS

- Entities = numeric IDs
- Components = pure data
- Systems = pure logic operating on components
- No direct Babylon mesh references inside core logic

Rendering components may store Babylon handles separately.

---

# 5. TESTING POLICY (JEST + CHAI)

Use:
- Jest as runner
- Chai for assertions
- ts-jest for TS

Must test:

- Movement math
- Weapon cooldown logic
- Damage pipeline
- AI state transitions
- Capture point progress
- Pathfinding worker contract

Tests must not require WebGL context.

Keep game logic decoupled so it is testable.

---

# 6. PLAYWRIGHT VISUAL TESTING

All visual features must support deterministic test mode.

Requirements:

- Seeded RNG system
- Support URL params:
  - ?seed=123
  - ?testMode=1

When in testMode:
- Disable random spawns
- Disable camera jitter
- Use fixed map

Expose:

window.__GAME_READY__ = true

Playwright test must:
1. Start dev server
2. Load page
3. Wait for __GAME_READY__
4. Screenshot
5. Compare to baseline

Use snapshot comparison.

---

# 7. SCREENSHOT ARTIFACT REQUIREMENT

Each branch must generate at least one screenshot under:

artifacts/screenshots/<branch-or-date>/

It must show:
- Tank visible
- Camera angle correct
- HUD visible (when implemented)

Screenshot must be generated via automated script if possible.

---

# 8. CONTENT RULES

Game content must live in:

/content
  weapons.json
  enemies.json
  upgrades.json
  dropTables.json
  maps.json

No hardcoded game values allowed in systems.

All scaling numbers configurable via JSON or config file.

---

# 9. PERFORMANCE RULES

- Pool projectiles
- Avoid per-frame allocations
- Cap active enemies (configurable)
- Pathfinding in Worker only

---

# 10. DEFINITION OF DONE (PER PR)

A PR is complete when:

- Feature implemented
- Unit tests written
- Visual tests updated if necessary
- Docs updated if schema changed
- Build + tests pass
- Screenshot artifact created
- No merge conflicts remain

---

# 11. SAFETY RULES

Do NOT:

- Remove failing tests to pass CI
- Downgrade TypeScript strictness
- Change tech stack
- Merge unresolved conflicts
- Introduce hidden global state

---

# 12. MILESTONE ORDER (MANDATORY)

Milestones must optimize for a fun, addictive, and rewarding loop as early as possible.
Each milestone must produce a playable, testable slice.

M1 — Core Feel (Moment-to-Moment Fun)
- Scene loads quickly and reliably
- Tank movement feels responsive
- Turret aim is immediate and readable
- Primary cannon projectile has satisfying hit feedback
- One basic enemy archetype with clear telegraphing
- Win/lose loop exists (spawn, fight, fail/restart)

M2 — Pressure + Reward Loop (Addiction Foundation)
- Director-based spawning creates smooth escalation
- Multiple enemy archetypes with distinct roles
- XP gain + level-up choices (3 options) introduced
- First meaningful build divergence appears by mid-run
- Difficulty ramps without random spike deaths

M3 — Strategic Depth (Run Identity)
- Capture points added with contestable flow
- Buff application is clear, persistent-in-run, and impactful
- Elite enemies + affix system increase risk/reward
- Reward cadence tuned (time-to-upgrade, time-to-power spike)

M4 — Juice + Retention + Stability
- Audio feedback for fire, hit, kill, level-up, capture
- VFX pass that improves clarity (not noise)
- Menus/HUD flow supports fast re-runs
- Performance pass under high-entity pressure
- Balance pass to keep runs rewarding across skill levels

Do not skip ahead.

---

# FINAL INSTRUCTION

Generate clean, modular, testable TypeScript code that follows this file strictly.

If uncertain, implement conservatively and leave a clearly marked TODO(spec).
