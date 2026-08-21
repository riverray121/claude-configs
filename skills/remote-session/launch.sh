#!/bin/bash
# Launch a fresh Ghostty window running a Claude Code session with permission
# prompts bypassed and Remote Control enabled. Prints SESSION_PID on success.
#
# Usage: launch.sh [working-dir] [session-name]
#
# Launches Ghostty's raw binary as a NEW instance (never `open -a`, which
# focuses an existing window) and addresses the window by unix PID (never by
# process name — duplicate instances make name-targeting grab the wrong one).
set -euo pipefail

DIR="${1:-$HOME}"
NAME="${2:-}"

CLAUDE_CMD="claude --dangerously-skip-permissions --remote-control"
if [ -n "$NAME" ]; then
  CLAUDE_CMD="$CLAUDE_CMD \"$NAME\""
fi

# ghostty -e wraps the command in a login shell that resets cwd to $HOME, so
# the working directory must be applied inside the command itself.
nohup /Applications/Ghostty.app/Contents/MacOS/ghostty \
  -e zsh -lc "cd \"$DIR\" && exec $CLAUDE_CMD" >/dev/null 2>&1 &
GPID=$!
disown

sleep 3
if ! kill -0 "$GPID" 2>/dev/null; then
  echo "LAUNCH_FAILED" >&2
  exit 1
fi

# Focus and place on the main display, addressed by exact PID.
osascript \
  -e "tell application \"System Events\" to tell (first process whose unix id is $GPID) to set frontmost to true" \
  -e "tell application \"System Events\" to tell (first process whose unix id is $GPID) to set position of window 1 to {200, 100}" \
  >/dev/null 2>&1 || true

echo "SESSION_PID=$GPID"
