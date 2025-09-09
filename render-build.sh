#!/usr/bin/env bash
set -e  # Exit on error

# Install dependencies (triggers postinstall)
npm install

# Set and create cache dir
PUPPETEER_CACHE_DIR="/opt/render/.cache/puppeteer"
mkdir -p "$PUPPETEER_CACHE_DIR"

# Install Chrome if not already (redundant but safe)
npx puppeteer browsers install chrome

# Copy from build-time cache to runtime path (adjust if your logs show a different source path)
if [ -d "/opt/render/project/src/.cache/puppeteer/chrome" ]; then
  cp -R /opt/render/project/src/.cache/puppeteer/chrome "$PUPPETEER_CACHE_DIR"
  echo "Copied Puppeteer Chrome from build cache"
else
  echo "Chrome already in place or path mismatch—check logs"
fi