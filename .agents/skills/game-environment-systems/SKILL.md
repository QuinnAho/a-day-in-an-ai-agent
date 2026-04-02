---
name: game-environment-systems
description: Use when a spec needs level layout, hazards, pickups, lighting, and environment interaction requirements.
---

# Game Environment Systems

The spec should treat the environment as a system, not just scenery.

## Define

- world layout model
- hand-authored versus procedural generation
- doors, keys, switches, hazards, pickups, and checkpoints
- lighting expectations
- interactive props
- environmental limits on movement and AI

## Source Of Truth Rule

Prefer one canonical representation for:

- world geometry
- collision
- minimap or navigation overlays

This avoids drift between the visible world and gameplay logic.
