# Tankfall: Arcforge Assault

Tankfall is a 3D isometric browser-based tank shooter focused on responsive combat, scalable enemy pressure, and build-driven progression.

This project is structured for spec-driven, AI-assisted development.  
The goal is long-term clarity, determinism, and extensibility — not a prototype.

---

# 🎮 Game Vision

Tankfall blends arcade shooter immediacy with structured progression systems.

Core design pillars:

1. **Responsiveness**
   - Movement must feel precise.
   - Turret aim must feel immediate and readable.

2. **Clarity**
   - Enemies telegraph actions.
   - Projectiles are readable.
   - Buffs and effects are visually obvious.

3. **Build Identity**
   - Upgrades meaningfully alter playstyle.
   - Weapon scaling creates distinct builds.

4. **Controlled Escalation**
   - Enemy scaling increases pressure gradually.
   - Difficulty spikes are intentional, not accidental.

---

# 🧠 Gameplay Overview

The player controls a tank in a 3D isometric arena.

- Hull movement via keyboard.
- Turret aims independently toward cursor.
- Enemies spawn in escalating waves.
- Capture points grant permanent-in-run buffs.
- XP unlocks upgrades during the run.
- Elite enemies spawn with randomized affixes.

The objective is survival with strategic build adaptation.

---

# 🔁 Core Gameplay Loop

1. Spawn into arena
2. Engage enemy waves
3. Earn XP and pickups
4. Capture objectives
5. Select upgrades on level-up
6. Difficulty scales over time
7. Survive as long as possible

---

# 📊 Progression Systems

## In-Run Progression

- XP-based leveling
- Upgrade selection (3 choices per level)
- Capture points grant persistent-in-run bonuses
- Elites increase risk/reward

## Scaling Model

Difficulty increases based on:
- Time survived
- Player level

Scaling affects:
- Enemy HP
- Enemy damage
- Spawn density
- Elite spawn rate

Scaling must feel smooth and predictable.

---

# 🧩 Enemy Design Philosophy

Enemy roles are distinct and readable:

- Scouts pressure mobility.
- Bruisers absorb space.
- Gunners control mid-range.
- Artillery denies zones.

Elite affixes create complexity without requiring new base archetypes.

Enemy behavior must remain understandable — complexity emerges from combination, not chaos.

---

# 🏟 Map & Objective Design

Maps are modular and grid-based.

Key elements:
- Spawn zones
- Capture points
- Obstacles for pathing and positioning

Capture points:
- Provide permanent buffs
- Can be contested
- Encourage player movement across arena

Maps should reward positioning and movement, not pure stat scaling.

---

# ⚔ Combat Model

Weapons fall into two core categories:

- Projectile-based (travel time, splash)
- Hitscan-based (instant, precision)

Combat must:
- Reward movement
- Allow skill expression
- Provide consistent damage feedback
- Avoid random-feeling lethality

---

# 📦 Data-Driven Design

All gameplay values live in `/content`.

Game systems must read configuration from JSON.

No gameplay constants should be hardcoded in logic.

This ensures:
- Easier balancing
- Safer iteration
- Clear separation between logic and tuning

---

# 🔍 Deterministic Simulation

The game must support seeded randomness.

This enables:
- Repeatable tests
- Visual regression validation
- Controlled debugging

Randomness must always route through a central RNG module.

---

# 🎯 Performance Philosophy

The browser is the target platform.

Design constraints:

- Limit active entities
- Pool high-frequency objects
- Avoid heavy physics
- Keep collision simple
- Avoid per-frame memory churn

Performance optimizations should preserve clarity and maintainability.

---

# 🧪 Design for Testing

Game logic should be pure and testable:

- Systems operate on data.
- Rendering is separate from simulation.
- State transitions are deterministic.
- Side effects are minimized.

Complex logic should be extracted into small functions.

---

# 🧱 Content Extensibility

Future systems should be pluggable:

- New weapons via JSON only.
- New enemies via data definition.
- New affixes without rewriting AI.
- New maps via configuration.

Systems should scale horizontally without refactor.

---

# 📈 Long-Term Evolution

Future extensions may include:

- Meta-progression
- Procedural map generation
- Additional AI behaviors
- Multiplayer architecture
- WebGPU renderer
- Skill trees
- Advanced VFX systems

The current architecture must not block these expansions.

---

# 🧠 Design Guardrails

Avoid:

- Hidden coupling between systems
- Gameplay logic inside rendering layer
- Random difficulty spikes
- Unbounded entity growth
- Hardcoded tuning values

Prefer:

- Explicit configuration
- Simple composable systems
- Clear state transitions
- Readable gameplay over visual noise

---

# 🏁 Project Goal

Tankfall is intended to be:

- Maintainable
- Extensible
- Deterministic
- Testable
- AI-collaborative

It is not a throwaway prototype.

Every system should be written as if it will evolve for years.

---

# 🗺 Milestone Roadmap (Fun-First)

Development order is mandatory and intentionally tuned around early player retention.
Each milestone must ship a playable loop, not just technical plumbing.

## M1 — Core Feel (Moment-to-Moment Fun)

Goal: the first 60 seconds already feel good.

- Fast start into combat
- Responsive movement + precise aiming
- Satisfying cannon fire and hit confirmation
- One readable enemy that creates pressure without confusion
- Immediate retry loop after death

Exit criteria:
- New players understand controls without tutorial text
- Combat readability is high in motion
- Losing feels fair and encourages "one more run"

## M2 — Pressure + Reward Loop (Addiction Foundation)

Goal: create compulsion through escalating tension and regular reward beats.

- Director spawning with smooth difficulty curve
- Enemy role variety that changes positioning decisions
- XP and level-up choices every few minutes
- First build identity decisions appear during a run

Exit criteria:
- Runs show clear arc: stabilize → struggle → power spike
- Reward cadence prevents long "dead time"
- Difficulty increases feel earned and predictable

## M3 — Strategic Depth (Run Identity)

Goal: make choices matter beyond raw stats.

- Capture points drive movement and map decisions
- Persistent-in-run buffs create route strategy
- Elite affixes add controlled complexity
- Risk/reward opportunities are legible before commitment

Exit criteria:
- Different players can pursue distinct viable strategies
- Objective play competes with pure kiting/farming
- Complexity emerges from combinations, not chaos

## M4 — Juice + Retention + Stability

Goal: improve stickiness and production quality without breaking clarity.

- Audio and VFX strengthen feedback loops
- HUD/menu flow minimizes friction between runs
- Performance and memory behavior remain stable in late waves
- Balance pass reinforces rewarding progression across skill levels

Exit criteria:
- Re-run intent is high after both wins and losses
- Frame pacing remains stable during peak combat
- Visual/audio polish improves clarity, not noise
