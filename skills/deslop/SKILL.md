---
name: deslop
description: Clean AI slop out of a codebase in five sequential passes: architecture, DRY, per-file Opus review, comments, and security/bugs. `/deslop` covers the working tree plus commits vs main; `/deslop full` covers the whole repo; add `--codex` for an extra outside review by codex. Fixes are applied directly, then every change and every unfixed issue is reported. Use after AI-assisted coding, before review, or for a whole-repo cleanup.
---

# deslop

Find and fix AI slop. Apply fixes as each pass finds them, then report everything at the end.

## Modes

| Invocation | Scope |
|---|---|
| `/deslop` | working tree + commits vs `main` |
| `/deslop full` | whole repo |

Add `--codex` to append an outside review by codex.

## Setup

1. Read the repo's contributor and agent guides (`CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`). Project conventions win over anything here.
2. Resolve scope. Default mode: `git diff --name-only main` plus untracked files. Full mode: `git ls-files`. Keep only source files. Never touch vendored or generated code, lockfiles, fixtures, or build output.

## Passes

Run in order. Each pass applies its fixes before the next starts. Record every change (what and why) and every issue seen but not fixed; the report needs both.

### 1. Architecture
Review structure across the in-scope files: layering, module boundaries, misplaced responsibility, needless indirection, premature abstraction. Fix what has a clear mechanical resolution. Larger restructures go in the report as not acted on.

### 2. DRY
Find duplicated and near-duplicated logic. Consolidate into the existing shared location, or create one if the codebase has an obvious spot. Do not invent abstractions for two-line coincidences.

### 3. Per-file review
Fan out one Opus 5 agent per in-scope file (Agent tool, `model: "opus"`). Each agent reads its file in full, judges it against the conventions of the surrounding code, and fixes slop: dead code, defensive cruft on trusted internal paths, type escapes, naming noise, idioms that diverge from the rest of the file. Run agents in parallel; batch several small files per agent when the file count is large.

### 4. Comments
Review every comment in scope. Delete comments that restate the code. Keep comments that explain why, rewriting them where needed. Every comment that remains must follow these rules:

- Never reference external conversations.
- Never reference design documentation or similar.
- Lead with the point. No preamble, no recap, no closers.
- One idea per line. Short sentences. If a sentence has a comma chain, split it.
- Number anything sequential or plural.
- State each fact with its consequence or fix in the same line.
- No tangents, hedges, or "by the way". If something is optional context, drop it.
- Avoid jargon. Speak coherently.

### 5. Security, bugs, issues
Traditional review pass: real bugs, security problems, broken edge cases, error handling that swallows failures. Fix what is safe to fix. Anything risky or behavior-changing you are unsure about goes in the report instead of being patched.

### 6. Codex (only with `--codex`)
Invoke the `codex` skill and ask codex to review the PR (the in-scope diff; the whole repo in full mode). Evaluate each finding. Fix the valid ones. Note rejected findings and the reason in the report.

## Finish

1. Run the project's formatter on touched files, if one is configured.
2. Run the relevant tests and typecheck. Report failures honestly.
3. Do not commit.

## Report

Write the report without jargon, simply and concisely, like one human talking to another.

In chat, for each change:

- what was changed
- the problem, and why the change fixes it

Then list identified issues that were not acted on, each with the reason (risky, needs a decision, out of scope).
