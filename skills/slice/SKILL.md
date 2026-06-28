---
name: slice
description: Build one vertical slice of the active milestone end to end — implement, write and run tests, deslop, code-review, apply fixes, then hand off to the user to test. Use to implement the next slice from a milestone's implementation.md, or a named slice. Run once per slice in a fresh context.
---

# slice

Implement a single slice from the active milestone, all the way through the
quality gates, and stop for the user to test it. One slice per run, in a fresh
context — do not batch slices.

Argument (optional): a slice name or number. If omitted, take the next unchecked
slice from the active milestone's `log.md` Todo.

## 1. Ground

- Read `docs/index.md` → the ACTIVE milestone's `log.md` → the target slice in
  `implementation.md`. Read `design.md` / `architecture.md` only as the slice
  needs.
- For unfamiliar code the slice touches, dispatch an `Explore` subagent to find
  the relevant files and conventions rather than reading widely in the main
  context.
- Restate the slice's goal, acceptance criteria, and out-of-scope back to the
  user in 2–3 lines before starting. If the slice is ambiguous or under-specified,
  stop and resolve it with the user — do not guess.

## 2. Implement

Write the code for **this slice only**. Stay inside its stated scope; do not
build ahead into later slices.

- Match the surrounding code — its patterns, naming, and idioms.
- Comments follow the global rules: frequent but short, the *why*, understandable
  from the file alone, no references to docs/plans/conversations.
- Reuse what exists. Do not add abstraction a single caller doesn't need.

## 3. Tests

Add tests covering each acceptance criterion (one behavior per test). Use the
project's test framework and conventions. Run them; iterate until green. Tests are
the slice's verification check — the slice is not done until they pass.

## 4. Verify the build

Run the project's configured checks from `CLAUDE.md` (typecheck, lint, test).
Show the user the actual output as evidence — do not assert success.

## 5. deslop (diff scope)

Invoke the `deslop` skill on the working diff. Present its report. Apply the
findings the user approves (default: apply high-confidence; surface anything
ambiguous or behavioral for a decision). Re-run the checks from step 4 after
applying.

## 6. code-review

Invoke the built-in `/code-review` skill on the diff (correctness focus). Present
the findings, apply the confirmed fixes, and re-run the checks. A reviewer always
finds *something* — apply what affects correctness or the slice's acceptance
criteria; treat pure style/over-engineering suggestions as optional.

## 7. Update the log

In the active milestone's `log.md`: move the slice from **Todo** to **Completed**
as a single line summarizing the result, and append any decision or gotcha to
**Notes**. Keep it terse — this is resume-context, not a changelog.

## 8. Hand off

Stop here. Summarize for the user:
- What the slice now does, and the exact thing(s) for them to test manually.
- Any follow-ups or deferred items.

**Do not commit yet.** After the user confirms the slice works, commit per the
global commit rules (Conventional Commits, short subject, user-authored). Push
only per the project's push policy.

## Guardrails
- One slice per run. If you finish early, stop — do not start the next slice.
- Stay within the slice's scope; defer anything else to its own slice (note it).
- Never weaken a test or suppress an error to make a check pass — fix the cause.
