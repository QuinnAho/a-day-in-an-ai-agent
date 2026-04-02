# Game Specification: [Game Name]

## Overview

**Spec ID**: GAME-XXX
**Status**: Draft / Refined / Approved / Implemented
**Game Workspace**: `sandbox/<game-slug>/`
**Target Artifact**: `sandbox/<game-slug>/index.html` / `sandbox/<game-slug>/game/index.html` / `sandbox/<game-slug>/public/index.html` / other
**Default Test Harness**: `sandbox/<game-slug>/tests/`
**Run Method**: [How to launch locally]

### Game Concept
[One-paragraph description of the game and the intended player fantasy.]

### Success Condition
[What "playable" means for the first shippable version.]

---

## Design Goals

- [Primary gameplay goal]
- [Primary technical goal]
- [Primary feel or polish goal]

## Non-Goals

- [What this version should explicitly avoid]
- [Systems that are out of scope for v0]

## Forward Plan

### Likely Follow-On Systems
- [Future system already expected after v0]
- [Another planned follow-on system]

### Prepare Now
- [Small data model or file boundary decision to make later work easier]
- [Interface or source-of-truth decision to avoid a rewrite]

### Avoid For Now
- [Architecture that would be premature in v0]
- [System depth that should wait for a later phase]

---

## Player Experience

### Camera And Controls
- **Perspective**: [First-person / third-person / top-down / side-view]
- **Input Scheme**: [Keyboard, mouse, gamepad]
- **Expected Feel**: [Responsive, heavy, slippery, arcade-like, etc.]
- **Pointer Lock / Mouse Capture**: [Required / Not required]

### Core Loop
1. [Primary action]
2. [Player decision]
3. [Reward or risk]
4. [Progression or fail state]

### Win / Lose Conditions
- **Win**: [Condition]
- **Lose**: [Condition]
- **Retry Flow**: [What happens on failure]

---

## World And Environment

### World Structure
- **Layout Model**: [Rooms, tilemap, arena, endless runner, overworld, etc.]
- **Generation Model**: [Hand-authored / procedural / hybrid]
- **Traversal Constraints**: [Doors, keys, jumps, hazards, walls]

### Environment Systems
- [Lighting expectations]
- [Interactive objects]
- [Hazards]
- [Pickups]

### Source Of Truth
- Define the canonical data source for:
  - world layout
  - collision
  - minimap or navigation overlays

---

## Entities

### Player
- **Abilities**: [Movement, attack, interact, jump, dash, etc.]
- **State**: [Health, inventory, keys, stamina, etc.]
- **Failure Modes To Avoid**:
  - frame-rate dependent movement
  - clipping through walls
  - camera desync from collision body

### Enemies / NPCs
- **Types**: [List]
- **Behaviors**: [Patrol, chase, attack, flee, idle]
- **Navigation Rules**: [Waypoints, simple steering, grid, navmesh, etc.]
- **Failure Modes To Avoid**:
  - walking through walls
  - getting permanently stuck
  - ignoring line-of-sight or range assumptions

---

## Gameplay Systems

### Required Systems
- [Combat / avoidance]
- [Inventory / keys / doors]
- [Health / damage]
- [Scoring / progression]
- [Checkpoints / restart]

### Interaction Rules
- [How the player interacts with the world]
- [How pickups and triggers behave]
- [How combat or enemy contact resolves]

---

## UI And Feedback

### Required UI
- [HUD elements]
- [Minimap or navigation aid]
- [Prompts]
- [Menus or restart flow]

### Feedback
- [Audio/visual feedback expectations]
- [Damage feedback]
- [Pickup feedback]
- [Success/failure feedback]

---

## Technical Architecture

### Rendering
- [Three.js / Canvas / DOM / other]

### Update Model
- Require a delta-time-based update loop
- Keep input, simulation, AI, and rendering logically separated

### Performance Constraints
- [Frame rate target]
- [Object allocation constraints]
- [Expected scope limits]

### Browser Constraints
- [Single HTML file, CDN use, no build step, or other constraints]

---

## Validation And Failure Inventory

### Acceptance Criteria

#### AC1: [Artifact Loads]
**Given** [launch method]
**When** the artifact is opened
**Then** the game loads without immediate crash or fatal console errors

#### AC2: [Core Loop Works]
**Given** the player starts a run
**When** they perform the main intended actions
**Then** the primary loop is functional

#### AC3: [Movement And Collision Behave]
**Given** the player navigates the world
**When** they move against solid geometry
**Then** collision prevents penetration and control remains responsive

#### AC4: [UI Matches World State]
**Given** the game state changes
**When** the HUD or minimap updates
**Then** the UI remains synchronized with the world

### Expected Failure Modes To Watch For
- [Camera clipping]
- [Delta-time bugs]
- [Enemy pathing failures]
- [Minimap drift]
- [Lighting problems]
- [Per-frame allocation or leaks]

### Verification Method
- [Automated tests in `sandbox/<game-slug>/tests/`]
- [Smoke checks]
- [Manual playtest steps]

---

## Task Breakdown

1. [ ] Draft or refine the implementation plan
2. [ ] Generate the first playable artifact
3. [ ] Add smoke checks or tests where practical
4. [ ] Playtest and record failures in `STATUS.md`
5. [ ] Queue thin repair tasks in `AGENTS.md`
6. [ ] Repeat until the target result succeeds
