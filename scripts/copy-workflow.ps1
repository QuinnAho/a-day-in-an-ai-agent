# PowerShell script to copy workflow files to project root
# Run from within the cloned .ai-workflow directory

Write-Host "Copying workflow files to project root..." -ForegroundColor Green

# Copy core files
Copy-Item -Path ".claude" -Destination ".." -Recurse -Force
Copy-Item -Path "CLAUDE.md" -Destination ".." -Force
Copy-Item -Path "AGENTS.md" -Destination ".." -Force
Copy-Item -Path "STATUS.md" -Destination ".." -Force
Copy-Item -Path "scripts" -Destination ".." -Recurse -Force

# Copy docs if they exist
if (Test-Path "docs") {
    Copy-Item -Path "docs" -Destination ".." -Recurse -Force
}

# Append to .gitignore (don't overwrite)
if (Test-Path ".gitignore") {
    Write-Host "Appending to existing .gitignore..." -ForegroundColor Yellow
    Get-Content ".gitignore" | Add-Content "../.gitignore"
} else {
    Write-Host "No .gitignore found in workflow, skipping..." -ForegroundColor Yellow
}

Write-Host "Workflow files copied successfully!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. cd .." -ForegroundColor White
Write-Host "2. Remove-Item -Path '.ai-workflow' -Recurse -Force" -ForegroundColor White
Write-Host "3. ./scripts/setup.sh --cloud-only" -ForegroundColor White