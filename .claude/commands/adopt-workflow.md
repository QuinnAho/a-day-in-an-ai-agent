---
description: Integrate this workflow into an existing repository
---

Integrate **A Day in an AI Agent** into an existing codebase using the `workflow-integrator` subagent.

## Arguments
- `$ARGUMENTS`: Optional context path such as `docs/idea.md`, `docs/architecture.md`, or another onboarding document

## Workflow

### Phase 1: Inventory the Existing Repo
1. Inspect the current codebase structure
2. Read package manifests, build files, test setup, and CI config
3. Read docs, architecture notes, and any existing workflow files
4. Identify existing `CLAUDE.md`, `AGENTS.md`, `STATUS.md`, `.claude/`, or equivalent files

### Phase 2: Launch the Integrator
1. Launch the `workflow-integrator` subagent
2. Ask it to merge this workflow into the repo without overwriting project-specific rules
3. Preserve existing conventions, scripts, and safety rails

### Phase 3: Draft the First Cycle
1. Create or update `CLAUDE.md` so it reflects the actual stack and constraints
2. Create 1-3 thin specs in `.claude/specs/`
3. Create or update `AGENTS.md` with only the next 1-3 executable night-shift tasks
4. Create or update `STATUS.md` only if needed for the morning handoff format

### Phase 4: Validate the Integration
1. Check for duplicate workflows or conflicting rules
2. Confirm the proposed queue is small, concrete, and testable
3. Surface open questions instead of guessing through architectural ambiguity

## Constraints

- Do not overwrite existing `CLAUDE.md` or `AGENTS.md` blindly
- Do not invent a parallel process if the repo already has equivalent automation
- Do not implement product code unless explicitly asked
- Reuse existing scripts, checks, and conventions wherever possible

## Completion

Report:
- The current workflow already present in the repo
- The integration plan
- Files created or updated
- The first specs drafted
- The first night-shift queue
- Open questions needing human judgment

If spec files are created, recommend running:

```text
/analyze-spec .claude/specs/<spec-name>.md
```
