#!/bin/bash

# Serve the current browser artifact locally.
#
# Usage:
#   ./scripts/run-game.sh
#   ./scripts/run-game.sh sandbox/my-game/index.html
#   PORT=8080 ./scripts/run-game.sh sandbox/my-game/dist/index.html

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PORT="${PORT:-8000}"
SANDBOX_ROOT_REL="${GAME_SANDBOX_DIR:-sandbox}"

find_latest_candidate() {
    local candidates=("$@")
    if [ ${#candidates[@]} -eq 0 ]; then
        return 1
    fi

    local latest
    latest=$(ls -1t "${candidates[@]}" 2>/dev/null | head -1)
    if [ -z "$latest" ]; then
        return 1
    fi

    echo "${latest#$PROJECT_ROOT/}"
}

find_default_entry_file() {
    local candidates=()
    local path

    shopt -s nullglob
    for path in \
        "$PROJECT_ROOT/$SANDBOX_ROOT_REL"/*/index.html \
        "$PROJECT_ROOT/$SANDBOX_ROOT_REL"/*/game/index.html \
        "$PROJECT_ROOT/$SANDBOX_ROOT_REL"/*/public/index.html \
        "$PROJECT_ROOT/$SANDBOX_ROOT_REL"/*/dist/index.html \
        "$PROJECT_ROOT/index.html" \
        "$PROJECT_ROOT/game/index.html" \
        "$PROJECT_ROOT/public/index.html" \
        "$PROJECT_ROOT/dist/index.html"; do
        if [ -f "$path" ]; then
            candidates+=("$path")
        fi
    done
    shopt -u nullglob

    find_latest_candidate "${candidates[@]}"
}

find_entry_file() {
    if [ $# -gt 0 ] && [ -n "${1:-}" ]; then
        echo "$1"
        return 0
    fi

    if [ -n "${GAME_ENTRY_FILE:-}" ]; then
        echo "$GAME_ENTRY_FILE"
        return 0
    fi

    if [ -f "$PROJECT_ROOT/STATUS.md" ]; then
        local status_entry
        status_entry=$(sed -n 's/^- \*\*Entry file\*\*: //p' "$PROJECT_ROOT/STATUS.md" | head -1)
        if [ -n "$status_entry" ] && [ "$status_entry" != "Not yet defined" ]; then
            echo "$status_entry"
            return 0
        fi
    fi

    find_default_entry_file
}

ENTRY_FILE="$(find_entry_file "${1:-}")" || {
    echo "Error: could not find a browser entry file."
    echo "Pass one explicitly, set GAME_ENTRY_FILE, or create an artifact under sandbox/<game-slug>/."
    exit 1
}

if [ ! -f "$PROJECT_ROOT/$ENTRY_FILE" ]; then
    echo "Error: entry file not found: $ENTRY_FILE"
    exit 1
fi

ROOT_DIR="$(cd "$PROJECT_ROOT/$(dirname "$ENTRY_FILE")" && pwd)"
ENTRY_NAME="$(basename "$ENTRY_FILE")"
URL="http://127.0.0.1:$PORT/$ENTRY_NAME"

echo "Serving: $ENTRY_FILE"
echo "Root: $ROOT_DIR"
echo "Open: $URL"

if command -v python3 >/dev/null 2>&1; then
    cd "$ROOT_DIR"
    python3 -m http.server "$PORT"
elif command -v python >/dev/null 2>&1; then
    cd "$ROOT_DIR"
    python -m http.server "$PORT"
else
    echo "Error: python or python3 is required to serve the game locally."
    exit 1
fi
