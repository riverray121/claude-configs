---
name: codex
description: Consult OpenAI Codex via `codex exec` as a peer for a second opinion or as a code reviewer. Use when the user wants an outside perspective, wants to weigh trade-offs, asks to "ask codex" / "check with codex", or wants codex to review a diff. Supports multi-turn discussion.
---

# codex — second opinion & review via `codex exec`

Run `codex exec` non-interactively to get an outside perspective from OpenAI Codex. Two modes: **second opinion** (a question or design debate) and **reviewer** (a code review of changes). `--yolo` sets `approval: never`, `sandbox: danger-full-access`.

Both modes write codex's final message to a file with `-o`; read that file for the clean reply. Capture the `session id:` UUID from stdout to continue the discussion later.

## Mode 1 — second opinion / design debate

```bash
codex exec --yolo -o /tmp/codex-reply.txt "<the full question + context>" 2>&1 | tail -40
```

Then read `/tmp/codex-reply.txt`.

Codex has no visibility into this conversation. Write the prompt so it stands alone:
- State the decision or question concretely.
- Include relevant code, constraints, and what's been tried.
- Ask for a specific response: a recommendation, a critique, alternatives, or a reasoned yes/no.
- Rewrite any "you"/"this conversation" references so codex understands it's being consulted as a peer.

## Mode 2 — reviewer

Use the built-in review subcommand. Run it from inside the target git repo (pass `-C <dir>` if needed):

```bash
codex exec review --yolo -o /tmp/codex-reply.txt 2>&1 | tail -40
```

Scope flags (pick one):
- `--base <branch>` — review changes vs a base branch (default behavior reviews against the branch base).
- `--uncommitted` — review staged, unstaged, and untracked changes.
- `--commit <sha>` — review one commit.

Add custom focus by passing a prompt: `codex exec review --yolo "focus on error handling and concurrency"`.

Then read `/tmp/codex-reply.txt`.

## Follow-up turns (either mode)

Resume with the captured session id:

```bash
codex exec --yolo -o /tmp/codex-reply.txt resume <session-id> "<follow-up>" 2>&1 | tail -20
```

If the id was lost, use `resume --last`.

## Presenting the reply

- Quote codex verbatim (don't paraphrase the substance); summarize the rest if long.

  > **codex:** <reply>

- Add your own brief take: agree, disagree, or what's worth pulling from it. The user wants both perspectives.

## When NOT to use

- Trivial questions you can answer directly.
- Anything needing session state you can't faithfully restate to codex.
- Mechanical tasks (formatting, lookups). This skill is for judgment and review.
