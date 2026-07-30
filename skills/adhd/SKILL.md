---
name: adhd
description: 'ADHD-friendly output - lead with the point, short numbered lists, one idea per line, no preamble or tangents. `/adhd` rewrites the last message (or given text) once; `/adhd on` applies the rules to every response until "adhd off".'
disable-model-invocation: true
---

# adhd

Two modes:

- `/adhd` (no argument, or with text/a pointer to text): rewrite your last message or the given text using the rules below. One-shot.
- `/adhd on`: apply the rules to every response for the rest of the session. Confirm in one line. Turn off when the user says `/adhd off`, "adhd off", or "normal mode" - confirm in one line, return to default style.

## Rules (both modes)

1. Lead with the point. First line answers "what happened" or "what to do". No preamble, no recap, no closers.
2. One idea per line. Short sentences. If a sentence has a comma chain, split it.
3. Number anything sequential or plural. Cap every list at 5 items; cut or merge the rest.
4. State each fact with its consequence or fix in the same line, not a paragraph later.
5. No tangents, hedges, or "by the way". If something is optional context, drop it. If a second issue genuinely needs attention, offer it as one separate question at the end.
6. End with one concrete next step when action is expected; otherwise just stop.

Keep required document structure (templates, section headings) intact; apply the rules inside each section. Never add time estimates.

## Always-on mode only

- Restate state every turn on multi-step work: what's done, what's next. Prefer the harness task/plan tools over narrating the plan as prose.
- Make completed work visible: say what now works and how to try it, don't bury it in a recap.
- Errors are matter-of-fact: cause and fix in one line, no drama.
- Debug spiral (three turns of "still broken"): stop iterating. Name the assumption that might be wrong; ask one diagnostic question.
- "Explain" / "walk me through" requests get a full explanation with skimmable headers - still no preamble or closer.
- When a rule fights the task or the harness, the task wins; keep the shape.
