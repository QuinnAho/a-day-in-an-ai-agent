#!/bin/bash

# AI Game Gen Workflow Experiment - Setup Script
# Sets up the Codex-first autonomous web-game workflow.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CODEX_LAUNCHER=(node "$PROJECT_ROOT/scripts/codex-cli.mjs")

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}"
echo "============================================================"
echo "           AI Game Gen Workflow Experiment - Setup Script"
echo "        Codex-First Autonomous Web Game Workflow"
echo "============================================================"
echo -e "${NC}"

detect_environment() {
    if grep -qi microsoft /proc/version 2>/dev/null; then
        echo "wsl"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "mac"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    else
        echo "unknown"
    fi
}

ENV=$(detect_environment)
echo -e "${BLUE}Detected environment: ${ENV}${NC}"
echo ""

check_prerequisites() {
    echo -e "${BOLD}Checking prerequisites...${NC}"

    local missing=()

    if ! command -v node &> /dev/null; then
        missing+=("Node.js 18+")
    else
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -lt 18 ]; then
            missing+=("Node.js 18+ (current: $(node -v))")
        else
            echo -e "${GREEN}[OK]${NC} Node.js $(node -v)"
        fi
    fi

    if ! command -v npm &> /dev/null; then
        missing+=("npm")
    else
        echo -e "${GREEN}[OK]${NC} npm $(npm -v)"
    fi

    if ! command -v git &> /dev/null; then
        missing+=("git")
    else
        echo -e "${GREEN}[OK]${NC} git $(git --version | cut -d' ' -f3)"
    fi

    if ! command -v python3 &> /dev/null; then
        echo -e "${YELLOW}[WARN]${NC} Python 3.10+ (optional)"
    else
        echo -e "${GREEN}[OK]${NC} Python $(python3 --version | cut -d' ' -f2)"
    fi

    if [[ "$ENV" == "wsl" || "$ENV" == "linux" ]]; then
        if command -v nvidia-smi &> /dev/null; then
            GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null | head -1)
            GPU_MEM=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader 2>/dev/null | head -1)
            echo -e "${GREEN}[OK]${NC} GPU: $GPU_NAME ($GPU_MEM)"
        else
            echo -e "${YELLOW}[WARN]${NC} No NVIDIA GPU detected"
        fi
    fi

    if [ ${#missing[@]} -gt 0 ]; then
        echo ""
        echo -e "${RED}Missing prerequisites:${NC}"
        for item in "${missing[@]}"; do
            echo -e "  ${RED}[ERR]${NC} $item"
        done
        echo ""
        echo "Install the missing prerequisites and run this script again."
        exit 1
    fi

    echo ""
}

install_codex() {
    echo -e "${BOLD}Step 1: OpenAI Codex CLI${NC}"

    if "${CODEX_LAUNCHER[@]}" --version &> /dev/null; then
        echo -e "${GREEN}[OK]${NC} Codex CLI already installed"
    else
        echo -e "${BLUE}Installing Codex CLI...${NC}"
        npm install -g @openai/codex
        echo -e "${GREEN}[OK]${NC} Codex CLI installed"
    fi

    if "${CODEX_LAUNCHER[@]}" login status &> /dev/null; then
        echo -e "${GREEN}[OK]${NC} Codex authenticated"
    else
        echo -e "${YELLOW}!${NC} Codex needs authentication"
        echo "  Run: node ./scripts/codex-cli.mjs login"
    fi

    echo ""
}

setup_scripts() {
    echo -e "${BOLD}Step 2: Script Permissions${NC}"

    chmod +x scripts/*.sh 2>/dev/null || true
    mkdir -p sandbox
    echo -e "${GREEN}[OK]${NC} Made scripts executable"
    echo -e "${GREEN}[OK]${NC} Ensured sandbox workspace exists"
    echo ""
}

create_env_template() {
    echo -e "${BOLD}Step 3: Environment Template${NC}"

    if [ ! -f ".env.example" ]; then
        cat > .env.example << 'EOF'
# AI Game Gen Workflow Experiment - Environment Variables

# Optional GitHub token for publishing or repo automation
GITHUB_TOKEN=your_github_personal_access_token

# Optional: document the current browser entry file for local scripts
GAME_SANDBOX_DIR=sandbox
GAME_ENTRY_FILE=sandbox/example-game/index.html
EOF
        echo -e "${GREEN}[OK]${NC} Created .env.example"
    else
        echo -e "${GREEN}[OK]${NC} .env.example already exists"
    fi

    echo ""
}

verify_installation() {
    echo -e "${BOLD}Verification${NC}"
    echo "------------"

    local all_good=true

    if "${CODEX_LAUNCHER[@]}" --version &> /dev/null; then
        echo -e "${GREEN}[OK]${NC} Codex CLI"
    else
        echo -e "${RED}[ERR]${NC} Codex CLI"
        all_good=false
    fi

    if [ -f "AGENTS.md" ] && [ -f "STATUS.md" ] && [ -f "PROJECT.md" ]; then
        echo -e "${GREEN}[OK]${NC} Core workflow files"
    else
        echo -e "${RED}[ERR]${NC} Core workflow files"
        all_good=false
    fi

    if [ -d "sandbox" ]; then
        echo -e "${GREEN}[OK]${NC} Sandbox workspace"
    else
        echo -e "${RED}[ERR]${NC} Sandbox workspace"
        all_good=false
    fi

    if [ -x "scripts/codex-coding-time.sh" ]; then
        echo -e "${GREEN}[OK]${NC} Overnight runner"
    else
        echo -e "${RED}[ERR]${NC} Overnight runner"
        all_good=false
    fi

    if [ -x "scripts/quality-gate.sh" ]; then
        echo -e "${GREEN}[OK]${NC} Quality gate"
    else
        echo -e "${RED}[ERR]${NC} Quality gate"
        all_good=false
    fi

    echo ""

    if $all_good; then
        echo -e "${GREEN}${BOLD}Setup complete.${NC}"
    else
        echo -e "${YELLOW}${BOLD}Setup partially complete - see above for issues.${NC}"
    fi
}

print_next_steps() {
    echo ""
    echo -e "${BOLD}Next Steps${NC}"
    echo "----------"
    echo ""
    echo "1. Authenticate Codex if needed:"
    echo "   node ./scripts/codex-cli.mjs login"
    echo ""
    echo "2. Start a new game brief:"
    echo "   ./scripts/generate-game.sh"
    echo ""
    echo "3. Generate a spec from a game idea:"
    echo "   # The guided prompt collects the brief and writes sandbox/<game-slug>/idea.txt"
    echo "   # Guided terminal prompt mode"
    echo "   # Or pass the idea directly: ./scripts/generate-game.sh \"A browser game idea\""
    echo "   # This creates sandbox/<game-slug>/ and saves the original brief there"
    echo ""
    echo "4. Update the task queue:"
    echo "   AGENTS.md"
    echo ""
    echo "5. Run the autonomous session:"
    echo "   ./scripts/codex-coding-time.sh"
    echo ""
    echo "6. Serve and inspect the current artifact:"
    echo "   ./scripts/run-game.sh"
    echo ""
    echo "7. Review the output log and artifact state:"
    echo "   STATUS.md"
    echo ""
    echo -e "${BLUE}Documentation: README.md${NC}"
    echo -e "${BLUE}Spec directory: specs/${NC}"
    echo -e "${BLUE}Game workspace root: sandbox/${NC}"
    echo ""
}

main() {
    check_prerequisites
    install_codex
    setup_scripts
    create_env_template
    verify_installation
    print_next_steps
}

case "${1:-}" in
    --verify-only)
        verify_installation
        ;;
    --help)
        echo "Usage: ./scripts/setup.sh [option]"
        echo ""
        echo "Options:"
        echo "  (none)         Full setup"
        echo "  --verify-only  Just verify installation"
        echo "  --help         Show this help"
        ;;
    *)
        main
        ;;
esac
