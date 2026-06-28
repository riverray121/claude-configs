---
name: spec
description: Plan a feature or initiative into a milestone doc set through conversation — design, architecture, and implementation docs written one at a time, each discussed before it is written and approved after. Also scaffolds a new project (CLAUDE.md + docs/) on first run. Use when starting a new feature, initiative, or project, or when the user says "let's plan/spec out X".
---

# spec

Turn a feature idea into a milestone's planning docs through a guided conversation.
The output is docs, not code. One milestone = one feature or initiative, stored
under `docs/milestone-N-<slug>/`.

This skill is deliberately slow and interactive. Each doc is a **discussion first,
a file second.** Never run ahead of the user.

## The gate protocol (read this first)

Three docs are produced in order: `design.md` → `architecture.md` →
`implementation.md`. Each one passes through the same two gates:

1. **Discuss.** Talk through the doc's content with the user. Ask clarifying
   questions. Surface options and trade-offs. **Write nothing to disk.**
2. **Confirm → write.** Only when the user signals they are happy with the
   discussion, write the doc.
3. **Approve → advance.** Show the written doc. Only when the user approves it,
   move to the next doc.

**IMPORTANT — hard rules:**
- **Never write a doc before the user confirms the discussion is settled.** If you
  think the discussion is done, ask; do not assume.
- **Never advance to the next doc before the user approves the current one.**
- Hold each doc at the right altitude (below). Do not pull architecture detail
  into design, or implementation detail into architecture.
- One doc on screen at a time. Do not draft all three at once.

Use the `AskUserQuestion` tool only for crisp either/or decisions inside a
discussion (e.g. "Postgres or SQLite?"). Never use it to ask "is the doc ready" —
that is a plain conversational question.

## Step 0 — Ground

Detect whether this is a fresh project or an existing one:
- **Fresh** if `docs/index.md` does not exist.
- **Existing** if it does — read it, and read the current ACTIVE milestone's docs
  so the new milestone fits what is already there.

For an existing codebase, dispatch an `Explore` subagent to map the relevant code
("how is X structured, what patterns/conventions exist, what would this feature
touch") so the plan is grounded in reality, not invented. Keep its findings in
mind; do not paste file dumps into the conversation.

## Step 1 — Project init (fresh projects only)

Run once, before the first milestone. Interview the user on project-specific
choices, then scaffold. Ask (conversationally, or via `AskUserQuestion` for the
discrete ones):

- What is the project, in one or two sentences?
- Stack / language / package manager (if already decided).
- Commands: test, lint, typecheck, build, run/dev.
- Is there a remote repo? Name it.
- Push policy — when should commits be pushed (e.g. after the user tests a slice)?
- Any other standing rules the project needs (deploy gates, data-handling rules,
  "don't touch X", etc.).

Then write:

- **`./CLAUDE.md`** — the project guide, from the template below. Keep it minimal
  and project-specific. Generic style/comment/commit rules live in the user's
  global `~/.claude/CLAUDE.md` and must **not** be duplicated here.
- **`docs/index.md`** — from the template below, with no milestones yet.

Confirm the scaffold with the user before moving to the first milestone.

## Step 2 — design.md

The feature at a high level: **what it is, how it works, how it is used.** No
stack, no libraries, no file layout — that is architecture.

Discuss → confirm → write (template below) → approve. The milestone folder is
created now: `docs/milestone-N-<slug>/`, where N is the next integer and `<slug>`
is a short kebab-case name. Add the milestone to `docs/index.md` as `planning`.

## Step 3 — architecture.md

The technical base: **stack, tools, and the load-bearing decisions** — enough to
confirm a solid, capable foundation. Deliberately **not** over-planned: capture
the decisions that are expensive to change and the component boundaries, not every
detail. Local choices are made later, during implementation.

Discuss → confirm → write (template below) → approve.

If a single decision needs real depth (a schema, a protocol, an algorithm), put it
in a **breakout doc** (`docs/milestone-N-<slug>/<topic>.md`) and link to it from
`architecture.md` — keep the main doc scannable.

## Step 4 — implementation.md

The build, as **thin vertical slices** in order. Each slice crosses all layers it
needs and is **independently testable end-to-end** — a tracer bullet, not a
horizontal phase (don't do "all the backend, then all the frontend"). Each slice
states its goal, what it touches, testable acceptance criteria, and what it
explicitly does **not** do.

Discuss the slicing → confirm → write (template below) → approve.

## Step 5 — Seed the log and activate

- Write `docs/milestone-N-<slug>/log.md` from the template, with every slice
  listed under **Todo**.
- Flip this milestone to `active` in `docs/index.md` (and mark the previous one
  `shipped` only if the user says it is done).

Tell the user the milestone is ready and that `/slice` builds the slices one at a
time.

## Doc quality

Every doc follows the global **Writing docs** rules: precise, concise, no
personality, no fluff, no timelines. After writing each doc, run a **doc-critic**
pass — dispatch a subagent (read-only) with the doc and this instruction:

> Review this planning doc against these rules: precise and concise; no
> personality or fluff; no restatement; no references to conversations, plans, or
> anything outside the doc; every statement load-bearing. Return a short list of
> specific cuts/tightenings. Do not rewrite — list findings only.

Apply the clear cuts before showing the doc to the user. The target is a doc that
reads cleanly to someone who was not in the conversation.

---

## Templates

### `./CLAUDE.md` (project guide)

```markdown
# <Project>

<One-sentence description.>

Design and process live in `docs/`. Read them before starting work.

## Session start
Read `docs/index.md`, then the ACTIVE milestone's `log.md` → `implementation.md`,
then `design.md` / `architecture.md` as the task needs. Only the ACTIVE milestone
is current — ignore shipped ones unless asked.

## Stack
<one line per major tool>

## Commands
- Test: <cmd>
- Lint: <cmd>
- Typecheck: <cmd>
- Run: <cmd>

## Git
- Remote: <name or "none yet">
- Push: <when>

<Any project-specific standing rules. Style, comment, and commit rules are global
— do not restate them here.>
```

### `docs/index.md`

```markdown
# Docs index

Milestones in build order. Only the ACTIVE one is current.

| # | Milestone | Status | Summary |
|---|-----------|--------|---------|
| 1 | <slug>    | active | <one line> |

Status: `planning` → `active` → `shipped`.
```

### `design.md`

```markdown
# <Feature> — Design

## Summary
<2–4 sentences: what this is.>

## How it works
<The behavior and model, at a high level. No stack, no code.>

## Usage
<How it is used / invoked / experienced.>

## Scope
- In: <what this milestone covers>
- Out: <explicit exclusions>

## Open questions
<unresolved design questions, or "none">
```

### `architecture.md`

```markdown
# <Feature> — Architecture

## Stack
<tool — one-line why, per major choice>

## Key decisions
<decision — rationale. Only the load-bearing, expensive-to-change ones.>

## Structure
<main components and the boundaries between them; where code lives>

## Breakouts
<links to deeper docs, or "none">

## Risks / unknowns
<what could force a rethink, or "none">
```

### `implementation.md`

```markdown
# <Feature> — Implementation

Thin vertical slices in build order. Each is independently testable end-to-end.

## Slice 1 — <name>
- Goal: <one line>
- Touches: <files / areas / layers>
- Acceptance: <bulleted, each independently testable>
- Out of scope: <what this slice does not do>

## Slice 2 — <name>
...
```

### `log.md`

```markdown
# <Feature> — Dev Log

Development context for resuming work. Keep entries to one line. Not a changelog.

## Completed
<slice — one-line result, as slices finish>

## Todo
- [ ] Slice 1 — <name>
- [ ] Slice 2 — <name>

## Notes
<decisions and gotchas worth remembering that don't belong in the design docs>
```

## Guardrails
- Docs only. This skill writes no application code.
- Respect the altitude of each doc; push detail down, never up.
- Never skip a gate to save a round-trip. The interaction is the point.
