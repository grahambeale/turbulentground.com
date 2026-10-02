#!/bin/sh
# Installs the committed git hooks for this clone (and every worktree of it).
set -eu
root=$(git rev-parse --show-toplevel)
chmod +x "$root/scripts/hooks/pre-push"
git -C "$root" config core.hooksPath scripts/hooks
echo "git hooks installed: core.hooksPath = $(git -C "$root" config core.hooksPath)"
echo "pre-push now runs the build, npm test and the smoke suite before every push."
