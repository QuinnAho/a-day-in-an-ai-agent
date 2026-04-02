---
name: game-character-systems
description: Use when a spec needs detailed player, enemy, NPC, state, and behavior requirements.
---

# Game Character Systems

Define the actor model clearly enough that implementation is straightforward.

## Specify

- player abilities
- player state such as health, inventory, stamina, keys, or ammo
- enemy or NPC types
- behavior states such as idle, patrol, chase, attack, flee, or stunned
- combat or contact rules
- spawn or reset behavior

## Failure Modes To Prevent

- enemies with no clear navigation constraints
- actors with undefined state transitions
- combat rules that do not specify timing, damage, or recovery
