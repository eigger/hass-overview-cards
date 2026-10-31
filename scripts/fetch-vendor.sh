#!/usr/bin/env bash
# The previews embed real compact-home-panel rows, so they need compact-cards.js from
# eigger/hass-compact-cards. It is downloaded to vendor/ (git-ignored) and not part of this repository.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p vendor
gh release download --repo eigger/hass-compact-cards --pattern compact-cards.js --dir vendor --clobber
echo "vendor/compact-cards.js ready"
