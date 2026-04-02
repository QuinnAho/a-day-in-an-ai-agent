#!/bin/bash

# Follow-Up Quality Gate Script
# Run manually between Codex sessions to decide whether the next run should
# continue generation, focus on repairs, or stop for human intervention.
#
# Exit codes: 0 = ready for next run, 1 = needs attention, 2 = blocked

set +e

echo "========================================="
echo "    FOLLOW-UP QUALITY GATES (Manual)    "
echo "========================================="

CONCERNS=0
BLOCKERS=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

pass() {
    echo -e "${GREEN}[OK]${NC} $1"
}

concern() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((CONCERNS++))
}

block() {
    echo -e "${RED}[BLOCK]${NC} $1"
    ((BLOCKERS++))
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo ""
echo "Gate 1: Blocked Tasks"
echo "---------------------"
if [ -f "AGENTS.md" ]; then
    BLOCKED_TASKS=$(grep -c "\[B\]" AGENTS.md 2>/dev/null || echo "0")
    if [ "$BLOCKED_TASKS" -gt 0 ]; then
        concern "Found $BLOCKED_TASKS blocked tasks in AGENTS.md"
        info "Review STATUS.md and decide whether to re-scope or unblock them"
    else
        pass "No blocked tasks recorded"
    fi
else
    block "AGENTS.md not found"
fi

echo ""
echo "Gate 2: Browser Artifact Presence"
echo "---------------------------------"
ARTIFACT=""
shopt -s nullglob
for candidate in \
    sandbox/*/index.html \
    sandbox/*/game/index.html \
    sandbox/*/public/index.html \
    sandbox/*/dist/index.html \
    index.html \
    game/index.html \
    public/index.html \
    dist/index.html; do
    if [ -f "$candidate" ]; then
        ARTIFACT="$candidate"
        break
    fi
done
shopt -u nullglob

if [ -n "$ARTIFACT" ]; then
    pass "Found browser artifact candidate: $ARTIFACT"
else
    concern "No browser entry file found in sandbox or common fallback locations"
    info "This is acceptable early on, but the next run should converge on a concrete artifact path"
fi

echo ""
echo "Gate 3: Recent Drift Signals"
echo "----------------------------"
if git rev-parse --verify HEAD~1 >/dev/null 2>&1; then
    NEW_TODOS=$(git diff HEAD~1 --unified=0 2>/dev/null | grep -c "^\+.*TODO\|^\+.*FIXME\|^\+.*HACK" || echo "0")
    if [ "$NEW_TODOS" -gt 3 ]; then
        concern "Found $NEW_TODOS new TODO/FIXME/HACK comments"
    elif [ "$NEW_TODOS" -gt 0 ]; then
        info "$NEW_TODOS new TODO-style comments added"
    else
        pass "No new TODO/FIXME/HACK comments in the latest diff"
    fi
else
    info "Not enough git history to evaluate recent drift"
fi

echo ""
echo "Gate 4: File Size And Complexity"
echo "--------------------------------"
LARGE_FILES=$(find . \( -name "*.js" -o -name "*.ts" -o -name "*.html" \) 2>/dev/null | \
    grep -v node_modules | \
    xargs wc -l 2>/dev/null | \
    awk '$1 > 800 {print $2}' | \
    head -5)
if [ -n "$LARGE_FILES" ]; then
    concern "Large source files detected (>800 lines)"
    echo "$LARGE_FILES" | while read file; do
        info "  $file"
    done
else
    pass "No oversized JS/TS/HTML files detected"
fi

echo ""
echo "Gate 5: Playtest Readiness"
echo "--------------------------"
if [ -f "STATUS.md" ]; then
    if grep -q "No playable artifact yet" STATUS.md 2>/dev/null; then
        concern "STATUS.md still reports no playable artifact"
    else
        pass "STATUS.md contains artifact checkpoint data"
    fi
else
    block "STATUS.md not found"
fi

echo ""
echo "Gate 6: Manual Check"
echo "--------------------"
info "Before the next run, answer these manually:"
info "  - Does the current artifact load?"
info "  - Is movement or camera behavior worse than the previous run?"
info "  - Are the next tasks focused on visible failures rather than generic cleanup?"

echo ""
echo "========================================="
echo "              SUMMARY                    "
echo "========================================="
echo "Concerns: $CONCERNS"
echo "Blockers: $BLOCKERS"
echo ""

if [ "$BLOCKERS" -gt 0 ]; then
    echo -e "${RED}FOLLOW-UP GATE: BLOCKED${NC}"
    exit 2
elif [ "$CONCERNS" -gt 2 ]; then
    echo -e "${YELLOW}FOLLOW-UP GATE: NEEDS ATTENTION${NC}"
    exit 1
else
    echo -e "${GREEN}FOLLOW-UP GATE: READY${NC}"
    exit 0
fi
