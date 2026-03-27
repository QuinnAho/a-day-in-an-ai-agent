#!/bin/bash
# Bash script to copy workflow files to project root
# Run from within the cloned .ai-workflow directory

echo -e "\033[32mCopying workflow files to project root...\033[0m"

# Copy core files
cp -r .claude ../
cp CLAUDE.md ../
cp AGENTS.md ../
cp STATUS.md ../
cp -r scripts ../

# Copy docs if they exist
if [ -d "docs" ]; then
    cp -r docs ../
fi

# Append to .gitignore (don't overwrite)
if [ -f ".gitignore" ]; then
    echo -e "\033[33mAppending to existing .gitignore...\033[0m"
    cat .gitignore >> ../.gitignore
else
    echo -e "\033[33mNo .gitignore found in workflow, skipping...\033[0m"
fi

echo -e "\033[32mWorkflow files copied successfully!\033[0m"
echo -e "\033[36mNext steps:\033[0m"
echo -e "\033[37m1. cd ..\033[0m"
echo -e "\033[37m2. rm -rf .ai-workflow\033[0m"
echo -e "\033[37m3. ./scripts/setup.sh --cloud-only\033[0m"