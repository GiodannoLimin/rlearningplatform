#!/bin/sh
# Start this checkout with a normal Node/pnpm install or the Codex desktop runtime.
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
if ! command -v node >/dev/null 2>&1 || ! command -v pnpm >/dev/null 2>&1; then
  bundled_dependencies="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies"
  if [ -x "$bundled_dependencies/node/bin/node" ] && [ -x "$bundled_dependencies/bin/fallback/pnpm" ]; then
    PATH="$bundled_dependencies/node/bin:$bundled_dependencies/bin/fallback:$PATH"
    export PATH
  else
    echo 'Install Node.js 22.12+ and pnpm 11.25.0, then follow README.md.' >&2
    exit 1
  fi
fi
if [ ! -d node_modules ]; then
  echo 'Dependencies are missing. Run pnpm install --frozen-lockfile first; see README.md.' >&2
  exit 1
fi
exec pnpm dev "$@"
