---
name: game-ai-systems
description: Use when a spec needs enemy navigation, sensing, state transitions, and obstacle-aware behavior requirements.
---

# Game AI Systems

Make enemy behavior simple but explicit.

## Define

- sensing rules such as range or line of sight
- state transitions such as patrol to chase to attack
- navigation model such as waypoints, steering, or grid
- recovery when an agent is blocked
- leash or reset behavior

## Failure Modes To Include

- move-toward-player behavior that walks through walls
- agents stuck forever on corners
- undefined behavior after losing sight of the player
