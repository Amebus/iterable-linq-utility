#!/bin/sh
# Builds the image used by devcontainer.json. Run it once, and again after changing the Dockerfile.
set -e
docker build -t node-alpine:24.20.0 "$(dirname "$0")"
