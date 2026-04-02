---
name: game-ui-hud-systems
description: Use when a spec needs HUD, minimap, prompt, menu, and player feedback requirements for browser games.
---

# Game UI HUD Systems

The spec should define the minimum readable interface for playtesting and shipping.

## Define

- HUD elements
- minimap or navigation aid
- interaction prompts
- pause, restart, or game over states
- damage, pickup, and success feedback

## Consistency Rule

UI state should reflect world state directly. Avoid specs that imply hand-maintained HUD or minimap data disconnected from gameplay data.
