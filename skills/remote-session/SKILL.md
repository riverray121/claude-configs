---
name: remote-session
description: Launch a fresh Claude Code session in a new Ghostty window with --dangerously-skip-permissions and --remote-control, reliably on the first try. Use when the user asks for a new remote/phone-controllable session, a permissions-skipped session, or "open a new Claude session in Ghostty".
---

# remote-session

Launch a new Ghostty window running `claude --dangerously-skip-permissions
--remote-control`, focused on the main display, and confirm it registers with
Remote Control.

Arguments (optional): a working directory for the session, and a Remote
Control session name. Default directory is `$HOME`.

## Steps

1. Run the launcher (never improvise the launch by hand):

   ```
   bash ~/.claude/skills/remote-session/launch.sh [working-dir] [session-name]
   ```

   It prints `SESSION_PID=<pid>`. Keep that PID — every subsequent window
   action targets it.

2. The session may stop at Claude Code's bypass-permissions acceptance
   dialog (yellow warning, options "1. No, exit / 2. Yes, I accept"). Remote
   Control does not register until it is accepted. Take ONE screenshot of the
   window region to check; if the dialog is shown, accept it with a
   PID-targeted keystroke:

   ```
   osascript -e 'tell application "System Events" to tell (first process whose unix id is <pid>) to set frontmost to true' \
             -e 'delay 0.4' \
             -e 'tell application "System Events" to keystroke "2"'
   ```

   If there is no dialog, send nothing.

3. Confirm the claude process is alive (`pgrep -f remote-control`) and tell
   the user the session is up and where the window is; Remote Control entries
   can take a few seconds to appear in their app's session list.

## Hard rules (each one is a failure that has actually happened)

- Never `open -a Ghostty`: if Ghostty is already running it focuses an
  EXISTING window — possibly a live Claude session — instead of creating one.
- Never send keystrokes without verifying what window is frontmost; typed
  commands have landed inside another live session's prompt as a message.
- Never address windows by process name (`first process whose name is …`):
  with two Ghostty instances it resolves to the wrong one. PID only.
- Do not trust `pgrep` to decide whether a GUI app is running — it can
  false-negative; System Events is the authority.
- The login shell resets cwd to `$HOME`; the launcher applies the working
  directory inside the command, so pass the directory as an argument instead
  of `cd`-ing before launch.
