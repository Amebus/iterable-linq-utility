# Builds the image used by devcontainer.json. Run it once, and again after changing the Dockerfile.
$ErrorActionPreference = 'Stop'
docker build -t node-alpine:24.20.0 $PSScriptRoot
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
