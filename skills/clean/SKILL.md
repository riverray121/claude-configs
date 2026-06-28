---
name: clean
description: End-of-milestone cleanup pass over the whole repo — deslop full, a high-effort code-review, full verification, and a docs reconciliation. Use after a feature/milestone's slices are all built, before considering it shipped.
---

# clean

Run the whole-repo quality and docs pass once a milestone's slices are all built.
This is the heavier counterpart to the per-slice gates in `/slice`: it looks at
the accumulated whole, not one diff.

## 1. deslop full

Invoke the `deslop` skill in **full** mode (whole repo). Present the report. Apply
what the user approves — high-confidence first; leave behavioral rewrites for a
decision. This catches cross-file slop and drift that per-slice passes miss.

## 2. code-review (high effort)

Invoke the built-in `/code-review` skill at **high** effort across the milestone's
changes. Present findings; apply the confirmed correctness fixes. Hold the line on
over-engineering — apply what affects correctness or stated behavior, not every
speculative suggestion.

## 3. Verify

Run the full project checks from `CLAUDE.md` (typecheck, lint, test). Show the
actual output as evidence.

## 4. Reconcile docs

Bring the docs back in line with what was actually built:
- Fold any decisions made during implementation back into `design.md` /
  `architecture.md`. The design docs should describe the system as it now is.
- Trim `log.md` — keep the durable Notes, drop transient chatter.
- If the feature is complete, mark the milestone `shipped` in `docs/index.md`.

Run the doc-critic pass (see the `spec` skill) on any doc edited here so it stays
minimal.

## 5. Summary

Report what changed in the cleanup, what was deferred, and the milestone's final
status. Commit per the global commit rules once the user is satisfied; push per the
project's push policy.

## Guardrails
- Apply nothing without surfacing it first — same approve-then-apply model as
  `/slice`.
- Never weaken tests or suppress errors to make checks pass.
- Docs reconciliation describes the built system; it does not invent new scope.
