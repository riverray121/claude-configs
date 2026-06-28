# Slop detection catalog

Single source of truth for what counts as AI slop. Every deslop agent reads this
file as input. The governing principle:

> **Slop is code that deviates from the conventions of the surrounding code.**
> Judge every candidate against its own file and module — not against an absolute
> rule. A pattern that is slop in one file may be the established idiom in another.

A finding must be defensible to a human reviewer who knows the codebase. When
unsure, lower the confidence — do not drop it, but mark it so the user can skip.

If the repo has a contributor or agent guide (`AGENTS.md`, `CLAUDE.md`,
`CONTRIBUTING.md`, etc.), its conventions override anything here.

---

## Categories

Each category lists what to **flag** and what to **keep** (false-positive guard).
Concern-specialized agents are each assigned a subset; the numbering is stable so
prompts can reference categories by number.

### 1. Comment noise
- **Flag:** comments that restate what the code plainly does (`// increment i`);
  AI narration (`// Loop through the items and process each one`); comments that
  reference the development process, conversations, or plans the reader can't see
  ("as discussed", "per the plan", "for now we…").
- **Keep:** comments that explain *why* (rationale, non-obvious constraints,
  invariants, links to a spec/ticket). These are sacred — never remove a WHY.
- Rewrite > delete when a narration comment hides a real WHY underneath.

### 2. Defensive cruft
- **Flag:** try/catch, null guards, optional chaining, and re-validation on code
  paths that are already validated or called only from trusted internal code.
- **Keep:** guards at real trust boundaries (external input, I/O, network,
  parsing untrusted data, public API surface).

### 3. Type escapes
- **Flag:** escape hatches that dodge the type system — `any`/`as any`, broad
  casts, `@ts-ignore`/`@ts-nocheck`, `# type: ignore`, `unwrap`-to-silence,
  needless `eslint-disable`, over-broad types used to avoid a real one.
- **Keep:** escapes with an adjacent WHY naming a genuine library/type-system
  limitation.

### 4. Premature abstraction
- **Flag:** single-use helpers/wrappers/factories, one-implementation interfaces,
  config/params for things that never vary, indirection with no payoff,
  speculative generality ("might need this later").
- **Keep:** abstractions with ≥2 real call sites or a documented near-term second
  user.

### 5. Bloat & dead code
- **Flag:** orphaned functions, unused imports/vars/params, commented-out code,
  unreachable branches, debug print/log statements, duplicated blocks that should
  be shared.
- **Keep:** intentional logging that uses the project's convention; public API
  surface that is unused internally but exported on purpose.

### 6. Doc & naming noise
- **Flag:** verbose docstrings on trivial functions; generic names (`data`,
  `result`, `temp`, `handleData`, `processItem`, `obj`); names inconsistent with
  the file's naming style.
- **Keep:** docstrings carrying real contract info (units, ranges, side effects);
  names that match the module's established vocabulary.

### 7. Style inconsistency
- **Flag:** idioms, control-flow shapes, or import styles that diverge from the
  rest of the same file/module (e.g. inline imports where the file imports at top;
  a manual loop where the file uses map/comprehension).
- **Keep / skip:** anything the autoformatter owns. Whitespace, quotes, and line
  wrapping are not findings.

### 8. Architecture smells (cross-file — for architecture agents)
- **Flag:** logic in the wrong layer (business logic in the presentation layer,
  presentation in the data layer); leaky boundaries; the same responsibility split
  across modules; an abstraction duplicated instead of shared; dead modules;
  coupling that crosses a boundary it shouldn't.
- **Keep:** deliberate layering the project's design intends.

### 9. AI ceremony
- **Flag:** needless logging added "to be safe"; emoji in code/comments;
  over-explained error strings; "production-ready"/"robust" theater; redundant
  status prints; defensive defaults that mask real bugs.
- **Keep:** logging/errors that match existing conventions and aid real debugging.

---

## Hard guardrails (never touch)

- Vendored or third-party code (`vendor/`, `third_party/`, `node_modules/`, and
  any directory the project marks as kept-close-to-upstream).
- Generated files, build output, and lockfiles.
- Data, fixtures, and any files the project treats as inputs the tool must not
  alter to "verify" a finding.
- Anything matched by `.gitignore`.

## Out of scope
- Formatting the autoformatter owns (see category 7).
- Behavioral rewrites that change program output — propose those as `manual`
  findings (describe, don't auto-patch). Deslop removes slop; it does not add
  features or change semantics.
