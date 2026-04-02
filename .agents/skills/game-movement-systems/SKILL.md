---
name: game-movement-systems
description: Use when a spec needs high-quality movement, camera, control, and traversal requirements for browser games.
---

# Game Movement Systems

When writing or refining a spec, make movement explicit.

## Cover These Areas

- control scheme
- acceleration and stopping behavior
- jump, dash, sprint, crouch, or interact if relevant
- camera perspective and feel
- pointer lock or mouse capture if relevant
- movement speed constraints
- traversal blockers and ledges
- frame-rate independence via delta time

## Failure Modes To Call Out

- camera clipping through walls
- movement tied to frame rate
- camera and collision body desync
- floaty or unresponsive controls with no tuning target
