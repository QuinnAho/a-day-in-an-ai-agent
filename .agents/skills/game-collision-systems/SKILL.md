---
name: game-collision-systems
description: Use when a spec needs explicit collision, hit detection, solid geometry, and penetration-prevention requirements.
---

# Game Collision Systems

Collision behavior must be specified early for autonomous game generation.

## Define

- what counts as solid geometry
- player collision shape or approximation
- enemy collision expectations
- attack or damage hit detection model
- boundaries, ledges, and blockers

## Failure Modes To Include

- wall penetration
- camera clipping
- enemies ignoring solids
- minimap or pathing logic derived from different geometry than collision
