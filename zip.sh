#!/bin/bash
set -Eeuo pipefail

msg() { echo >&2 -e "${1-}"; }
die() { msg "$@"; exit 1; }

test -z "$(git status --porcelain)" || die "Git working directory not clean"

bun run lint

bun run build
bun run test
zip -jv chrome-extension.zip dist/*

export FIREFOX_BUILD=1
bun run build
bun run test
zip -jv firefox-extension.zip dist/*

msg "All done! 🚀"
