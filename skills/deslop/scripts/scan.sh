#!/usr/bin/env bash
# Deterministic candidate pre-filter for the deslop skill.
#
# Narrows the file set to those with at least one regex-detectable slop signal,
# so the analysis swarm skips clean files. Output is advisory: agents still make
# the judgment call. Regex finds candidates; the model decides.
#
# Usage:  scan.sh diff           # files changed vs main
#         scan.sh full           # all source files in the repo
#         scan.sh path <dir|file>
#
# Output: one line per candidate file -> "<path>\t<hits>\t<categories>",
# followed by a plain newline-separated list of candidate paths after "FILES:".

set -euo pipefail
MODE="${1:-diff}"
TARGET="${2:-}"
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

# Source extensions in scope; everything else is ignored. Covers application
# languages plus infrastructure-as-code (Terraform/HCL) and scripting dialects.
EXTS='ts|tsx|js|jsx|mjs|cjs|svelte|vue|py|rb|go|rs|java|kt|kts|swift|scala|c|h|cc|cpp|hpp|cs|php|sh|bash|zsh|tf|tfvars|hcl|lua|dart|ex|exs|clj|cljs|cljc|erl|hs|ml|mli|r|pl|pm|groovy|gradle|sql|proto|zig|nim|jl|ps1|psm1'
# Paths that are never deslopped: vendored, generated, build output, lockfiles.
EXCLUDE='vendor/|third_party/|node_modules/|\.git/|build/|dist/|out/|target/|\.next/|\.svelte-kit/|__pycache__/|\.venv/|/venv/|coverage/|\.min\.(js|css)$|(^|/)[^/]*lock\.(json|ya?ml)$|(^|/)[^/]*\.lock$'

# Resolve the candidate file list for the requested scope.
# diff scope = anything differing from main, working tree included. Two-dot
# `main` (not three-dot) so uncommitted edits on main itself are covered; plus
# untracked-but-not-ignored files, which are new slop candidates.
case "$MODE" in
  diff)  files=$(printf '%s\n%s' \
           "$(git diff --name-only --diff-filter=d main 2>/dev/null || true)" \
           "$(git ls-files --others --exclude-standard 2>/dev/null || true)") ;;
  full)  files=$(git ls-files) ;;
  path)  files=$(git ls-files -- "$TARGET") ;;
  *) echo "unknown mode: $MODE" >&2; exit 2 ;;
esac

# Keep only in-scope source files.
files=$(printf '%s\n' "$files" \
  | grep -E "\.($EXTS)$" 2>/dev/null \
  | grep -vE "$EXCLUDE" 2>/dev/null || true)
[ -z "$files" ] && { echo "FILES:"; exit 0; }

# Picker: ripgrep if present (fast, gitignore-aware), else grep.
have_rg=0; command -v rg >/dev/null 2>&1 && have_rg=1
hits_in() { # file pattern -> match count
  if [ "$have_rg" -eq 1 ]; then rg -c --no-messages -e "$2" -- "$1" 2>/dev/null || echo 0
  else grep -cE -- "$2" "$1" 2>/dev/null || echo 0; fi
}

# Category label -> regex. Coarse on purpose; agents refine and reject.
declare -a CATS=(
  "types|(\bas any\b|: any\b|<any>|@ts-(ignore|nocheck)|# type: ignore|eslint-disable)"
  "debug|(console\.(log|debug)|^\s*print\(|println!|dbg!)"
  "todo|(TODO|FIXME|XXX|HACK)"
  "commented-code|^\s*(//|#)\s*((if |for |while |return|const |let |var |def |class |import |from |fn |pub |console\.|print\()|[{}])|(//|#).*;\s*$"
  "external-ref|(as discussed|per (the|our)|as (mentioned|noted)|for now|previously|the (design )?doc)"
)

candidates=""
while IFS= read -r f; do
  [ -f "$f" ] || continue
  total=0; tags=""
  for entry in "${CATS[@]}"; do
    name="${entry%%|*}"; pat="${entry#*|}"
    c=$(hits_in "$f" "$pat"); c=${c:-0}
    if [ "$c" -gt 0 ]; then total=$((total + c)); tags="$tags${tags:+,}$name"; fi
  done
  if [ "$total" -gt 0 ]; then
    printf '%s\t%s\t%s\n' "$f" "$total" "$tags"
    candidates="$candidates$f"$'\n'
  fi
done <<< "$files"

# The hit report above is a prioritization hint, not a filter. Semantic slop
# (bad naming, premature abstraction) has no regex tell, so FILES: lists every
# in-scope file — agents review all of them, regex-flagged ones first. At this
# repo's scale (~50 source files) full coverage is cheap; the `candidates` var
# is intentionally unused as a filter to avoid missing tell-free slop.
: "${candidates:=}"  # referenced to keep set -u happy
echo "FILES:"
printf '%s\n' "$files"
