---
name: codex-game-workflow
description: Use when working on this repository's autonomous web-game generation workflow, especially for spec drafting, AGENTS queue updates, coding runs, failure inventories, and Codex-native workflow evolution.
---

# Codex Game Workflow

Use this skill when the task touches the repo's autonomous workflow rather than just product code.

## Load Minimal Context First

Read only what you need, in this order:

1. `AGENTS.md`
2. `STATUS.md`
3. `PROJECT.md`
4. the specific spec or script files related to the request
5. the relevant `sandbox/<game-slug>/idea.txt` brief when the task concerns a specific game

## Custom Agent Map

Use the project-scoped Codex agents in `.codex/agents`.

- `workflow_integrator`
  Use for workflow cleanup, migration, and active-path simplification.
- `spec_analyst`
  Use before implementation to check spec quality and acceptance criteria.
- `spec_architect`
  Use when a task needs system design or decomposition into thin steps.
- `spec_developer`
  Use for implementation when the task is bounded and writable.
- `spec_tester`
  Use for tests, smoke checks, and validation harnesses.
- `spec_validator`
  Use after implementation to trace the result back to the spec and artifact expectations.
- `code_reviewer`
  Use for read-only review of correctness, regression risk, and game-specific quality.

## Recommended Orchestration Patterns

### Spec creation or refinement

1. Spawn `spec_analyst` to identify gaps.
2. Spawn `spec_architect` if the spec needs decomposition or file layout planning.
3. Make the forward plan explicit: what future systems are already expected, what should be prepared now, and what should wait.
4. Merge the results into the target spec and then update `AGENTS.md`.

### Implementation loop

1. Use `spec_developer` for the bounded code change.
2. In parallel, use `spec_tester` when tests or smoke checks can be written independently.
3. Leave light-weight seams for known follow-on systems, but do not overbuild them early.
4. Before calling the task complete, spawn `code_reviewer` and `spec_validator` to self-review the result.
5. Update `STATUS.md` with artifact path, launch method, known failures, and any deferred review findings.

### Review loop

1. Spawn `code_reviewer` and `spec_validator` in parallel.
2. Convert findings into the next thin repair tasks instead of broad cleanup.

### Workflow migration

1. Use `workflow_integrator` to map active workflow surfaces.
2. Replace duplicate or obsolete paths first.
3. Keep only one authoritative path for any given workflow concept.

## Game-Specific Rules

- Prefer browser-playable increments over abstract refactors.
- Treat movement, collision, minimap accuracy, AI navigation, and delta-time behavior as first-class acceptance criteria.
- Keep artifact paths explicit in `STATUS.md`.
- Keep game-specific files inside `sandbox/<game-slug>/` unless the task is editing shared workflow files.
- Do not claim a gameplay fix is complete without either a check or an explicit manual verification note.
- Do not mark non-trivial implementation work complete until a self-review pass has happened.

## Done Criteria

A workflow task is not complete until:

- the active Codex path is clearer than before
- new Codex-native config, agents, or skills are discoverable in-repo
- `README.md`, `AGENTS.md`, `STATUS.md`, or `PROJECT.md` reflect the new behavior when relevant
- obsolete workflow files are either removed or clearly marked as compatibility-only