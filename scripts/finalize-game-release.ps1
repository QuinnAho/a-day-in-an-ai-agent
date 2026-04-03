$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
node (Join-Path $scriptDir 'finalize-game-release.mjs') @args
exit $LASTEXITCODE
