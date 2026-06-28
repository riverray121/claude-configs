# Writing docs

- Be precise and concise. Write without personality; provide only the fundamental truths needed to explain.
- No fluff. Skip timelines and unnecessary added info.
- Do not add opinions unless asked.

# Code comments

- Comment frequently, but keep every comment short and concise — easy to understand at a glance.
- Emphasize the *why*: the reason the code exists or takes its shape, not a restatement of what it does.
- Each comment must stand on its own from the file alone. Never reference docs, tickets, plans, conversations, or any context outside the file.
- Precede each meaningful block with a brief comment on its purpose. State facts; no narration.

# Commits

- Follow Conventional Commits: `type(scope): subject` (`feat`, `fix`, `refactor`, `test`, `chore`, `docs`, etc.).
- The subject is a single short, descriptive phrase. No body unless asked.
- Small, focused commits — one concern each; commit as work reaches a passing or working state.
- Commits are authored by the user only — never add Claude as `Co-Authored-By`.
- Interactive sessions: ask before committing. Autonomous: commit as work completes. When to push is set per project.
