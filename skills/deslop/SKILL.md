---
name: deslop
description: Find and remove AI slop from a codebase — redundant comments, defensive cruft, type escapes, premature abstraction, dead code, naming noise, and architecture smells. Both modes run the same swarm of concern-specialized agents plus two independent codex passes; the only difference is scope — `/deslop` reviews the diff against main, `/deslop full` reviews the whole repo. Presents findings as a report to approve or reject before anything is applied. Use after AI-assisted coding, before review, or for a whole-repo cleanup pass.
---

# deslop

Identify AI slop, propose a fix for each instance, and apply only what the user
approves. What counts as slop is defined in `catalog.md` — the single source of
truth. This file is the **how**; the catalog is the **what**.

The skill is stack-agnostic: it discovers the file set, layers, and formatter from
the repo rather than assuming any language or framework.

Every mode runs the identical pipeline — the swarm plus two codex passes. Mode
only changes which files are in scope.

## Modes

| Invocation | Scope | Pipeline |
|---|---|---|
| `/deslop` | working tree + commits vs `main` | swarm + codex |
| `/deslop full` | whole repo | swarm + codex |
| `/deslop <path>` | a file or directory | swarm + codex |
| add `--no-codex` | — | skip the codex passes (faster) |

Parse the argument for a mode word (`full`), a path, and the `--no-codex` flag.
Default mode is `diff`.

## Workflow

### 0. Ground in the repo's own rules
Read any contributor/agent guide (`AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`) and
fold its conventions into the catalog's relativity rule. Project rules win.

### 1. Scope
Run the pre-filter to get the in-scope file list and regex hint report:
```
bash ~/.claude/skills/deslop/scripts/scan.sh <diff|full|path> [path]
```
Lines before `FILES:` are prioritization hints (file → hit count → categories).
The list after `FILES:` is the files to review. Empty list → report "no slop
candidates in scope" and stop.

### 2. Run the swarm
Always fan out via the Workflow tool — every mode uses it; only the `files` set
from step 1 differs. This skill is global, so resolve its directory to an absolute
path from your home dir first (subagents read the catalog with absolute paths — a
`~`-prefixed path won't work): `SKILL_DIR="$HOME/.claude/skills/deslop"`.
```
Workflow({ scriptPath: "<SKILL_DIR>/deslop-workflow.js",
           args: { root: "<repo abs path>", files: [<the FILES: list>],
                   catalog: "<SKILL_DIR>/catalog.md" } })
```
Substitute `<SKILL_DIR>` with the resolved absolute path (e.g.
`/Users/alice/.claude/skills/deslop`) — never a literal `~` or `$HOME`.
It returns `{ lineFindings, archFindings, stats }`. The swarm separates concerns:
specialized **lens agents** (comments, defensive/types, anti-patterns, dead code)
each sweep file shards for their family only, while **architecture agents** review
each module and the seams between modules for cross-file smells.

### 3. Codex passes (always, unless `--no-codex`)
Codex is slow — run it as two independent agents, batched, never per file:
- **Architecture pass** — ask codex to evaluate the codebase's architecture for
  structural slop and report findings.
- **Code pass** — ask codex for one review pass over the in-scope code for slop
  and anti-patterns.

Scope codex to match the mode: the changed files for `diff`/`path`, the whole repo
for `full`. Invoke both via the `codex` skill. Treat codex as an independent
reviewer: where a codex finding corroborates a Claude finding, tag it
`corroborated`; codex-only findings get source `codex` and are listed prominently.

### 4. Write the report
Assign each finding a short ID (`L1`, `L2`… line; `A1`… architecture; `C1`… codex).
Write `deslop-report.md` to `docs/` if that directory exists, otherwise to the repo
root. The report is a scratch artifact, not a kept doc — note its path so step 6
can remove it.

```
# Deslop report — <mode>
<N> line findings, <M> architecture findings across <K> files. Codex: <on|off>.
Approve with: all · high-confidence · <ids> · none. Nothing is applied until you choose.

## Architecture
### A1 · <category> · sev <s>/conf <c> · source <claude|codex|corroborated>
Files: <files>
Why: <one line>
Fix: <description>  (auto|manual)

## Line findings — <file>
### L3 · <category> · sev <s>/conf <c> · L<line> · source <claude|codex|corroborated>
Why: <one line>
```diff
- <before>
+ <after>
```
```
Sort within each section high-confidence first. Show `source` whenever codex ran;
omit it only under `--no-codex`.

### 5. Present & approve
Show a compact summary: counts by category and confidence, the headline
architecture findings, and any codex-only or contested findings. Ask the user to
approve by ID, by bucket (`all`, `high-confidence`), or reject. **Apply nothing
before approval.**

### 6. Apply
For each approved finding, apply the `before`→`after` edit. Then run the project's
configured formatter on touched files (detect it: Prettier/ESLint, Ruff/Black,
gofmt, rustfmt, etc.; skip if none) so edits match house style. `manual`
findings are not auto-applied — leave them for the user. Do **not** commit. End
with a 1–3 sentence summary of what changed and what was deferred.

### 7. Clean up the report
Once the approved findings are applied and any `manual` ones have been surfaced to
the user, **delete `deslop-report.md`** — it is a transient artifact and should not
be left in `docs/` or committed. If `manual` findings remain that the user wants to
keep for later, ask before deleting; otherwise remove it.

## Guardrails
- Honor every hard guardrail in `catalog.md`: never touch vendored/third-party
  code, generated files, lockfiles, data/fixtures, or anything `.gitignore`d.
- Never remove a WHY comment. Flag comments that reference conversations or the
  dev process, and rewrite or delete them.
- Propose, never silently apply. Semantic/behavioral rewrites are `manual`.
- Leave formatting to the autoformatter; never raise formatting-only findings.
