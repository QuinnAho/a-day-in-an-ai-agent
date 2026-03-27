---
description: Set up the AI workflow in your project
---

Set up **A Day in an AI Agent** workflow files and dependencies in your project.

## Arguments
- `$ARGUMENTS`: Optional - "from-doc" to start from a project document, or path to your idea doc

## Workflow

### Phase 1: Copy Workflow Files
1. Guide user through cloning the workflow repository
2. Execute the copy-workflow script to move files to project root
3. Clean up the temporary clone directory

### Phase 2: Install Dependencies
1. Run `./scripts/setup.sh --cloud-only` for Codex + Claude setup
2. Verify installations (codex, claude, MCP servers)
3. Handle any platform-specific issues

### Phase 3: Initial Configuration

#### If starting from a doc:
1. Read the provided document (or `docs/idea.md` by default)
2. Create a project-specific `CLAUDE.md` with stack and patterns
3. Generate 2-3 feature specs in `.claude/specs/`
4. Create initial tasks in `AGENTS.md` (1-3 thin, testable tasks)
5. Recommend running `/analyze-spec` on each spec

#### If adding to existing project:
1. Recommend using `/adopt-workflow` instead
2. Or proceed with minimal integration

### Phase 4: Verify Setup
1. Check all required files are in place
2. Verify scripts are executable
3. Test that claude and codex commands work
4. Show the daily workflow commands

## Output

Display:
```
✅ Workflow files copied
✅ Dependencies installed
✅ Initial configuration complete

Next steps:
1. Review CLAUDE.md and customize for your project
2. Check .claude/specs/ for your feature specifications
3. Run: /analyze-spec .claude/specs/<name>.md
4. Tonight: ./scripts/overnight-codex.sh

Daily workflow:
- Evening: vim AGENTS.md && ./scripts/overnight-codex.sh
- Morning: claude && /review
```

## Examples

```text
/setup-workflow
/setup-workflow from-doc
/setup-workflow docs/project-brief.md
```