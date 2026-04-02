---
name: game-spec-generator
description: Use when turning a short game idea into a detailed implementation-ready spec for Codex to follow.
---

# Game Spec Generator

Use this skill when the input is a game idea, pitch, or rough prompt and the goal is a concrete spec.

## Required Inputs

- the game name
- the game brief
- optional browser constraints if the user already knows them

## Read First

1. `PROJECT.md`
2. `AGENTS.md`
3. `STATUS.md`
4. `specs/_template.md`
5. the combined intake file in `sandbox/<game-slug>/intake.md` when it exists
6. the original brief file in `sandbox/<game-slug>/idea.txt` when it exists

## Spec Requirements

A valid game spec must define:

- target artifact path
- local run method
- player fantasy and core loop
- controls and camera behavior
- world structure and environment rules
- player, enemies, and interactive objects
- collision expectations
- UI/HUD expectations
- performance and browser constraints
- expected failure modes
- measurable acceptance criteria
- validation approach
- thin task breakdown
- likely follow-on systems after v0
- what should be prepared now for those future systems
- what should explicitly wait instead of being overbuilt now

## Refinement Pattern

- For simple arcade or single-loop games, do not use subagents. Write the spec directly.
- For complex games, use at most one narrow refinement pass.
- Use `spec_analyst` to find ambiguity and missing constraints only when the game genuinely has multiple interacting systems.
- Use `spec_architect` to turn the design into an implementation-ready task structure only when decomposition is actually needed.
- Pull in the relevant game-domain skills before finalizing the spec.
- Make the forward plan explicit: capture the small seams to prepare now, but also state what should not be built yet.
- If the same tool, path, sandbox, or project-boundary failure happens twice, stop and return `BLOCKED` instead of retrying.

## Scope Rule

Prefer a stable, browser-playable v0 over an ambitious spec that will collapse during implementation.