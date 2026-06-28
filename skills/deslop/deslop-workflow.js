export const meta = {
  name: 'deslop-swarm',
  description: 'Fan out concern-specialized lens agents over file shards plus cross-cutting architecture agents; return merged findings',
  phases: [
    { title: 'Lens review', detail: 'one specialist agent per concern per file shard' },
    { title: 'Architecture', detail: 'cross-cutting agents by module and seam' },
  ],
}

// Inputs (from the orchestrating skill):
//   root      - repo root absolute path
//   files     - array of in-scope file paths, relative to root
//   shardSize - files per lens agent (optional; scales context vs. agent count)
// Returns { lineFindings, archFindings, stats }. The skill assigns IDs, merges
// codex findings, writes the report, and applies approved edits.

const root = args.root
const files = (args.files || []).filter(Boolean)
const shardSize = args.shardSize || 8
// Catalog lives with the (global) skill, not in the target repo. The skill must
// pass its absolute path, resolved from $HOME so it is portable across machines
// (subagents read it with absolute paths, so a "~"-prefixed path won't work).
const catalog = args.catalog
if (!catalog) throw new Error('deslop-workflow: args.catalog (absolute path to catalog.md) is required')

const chunk = (arr, n) => {
  const out = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

// Line-level finding. `file` is required because a shard spans several files.
// before/after are literal code; after === "" means delete.
const LINE_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          file: { type: 'string' },
          line: { type: 'number' },
          endLine: { type: 'number' },
          category: { type: 'string' },
          severity: { type: 'string', enum: ['high', 'med', 'low'] },
          confidence: { type: 'string', enum: ['high', 'med', 'low'] },
          why: { type: 'string' },
          before: { type: 'string' },
          after: { type: 'string' },
        },
        required: ['file', 'line', 'category', 'severity', 'confidence', 'why', 'before', 'after'],
      },
    },
  },
  required: ['findings'],
}

// Cross-file finding. `fix` is a description; cross-cutting refactors are rarely a
// clean patch, so `actionable` flags whether the skill can auto-apply it.
const ARCH_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          title: { type: 'string' },
          files: { type: 'array', items: { type: 'string' } },
          category: { type: 'string' },
          severity: { type: 'string', enum: ['high', 'med', 'low'] },
          confidence: { type: 'string', enum: ['high', 'med', 'low'] },
          why: { type: 'string' },
          fix: { type: 'string' },
          actionable: { type: 'string', enum: ['auto', 'manual'] },
        },
        required: ['title', 'files', 'category', 'severity', 'confidence', 'why', 'fix', 'actionable'],
      },
    },
  },
  required: ['findings'],
}

// Concern lenses: each agent specializes in one slop family and ignores the rest,
// so every file is examined by a focused expert instead of one generalist pass.
const LENSES = [
  {
    key: 'comments',
    cats: 'categories 1 (comment noise) and 6 (doc & naming noise)',
    focus: 'comments that restate the obvious, narrate, or reference the dev process/conversations; verbose docstrings on trivial code; generic or inconsistent names. Never flag a WHY comment.',
  },
  {
    key: 'defensive',
    cats: 'categories 2 (defensive cruft) and 3 (type escapes)',
    focus: 'try/catch, null guards, and re-validation on already-trusted paths; any-casts, ts-ignore, type:ignore, and other escape hatches that dodge the type system.',
  },
  {
    key: 'antipattern',
    cats: 'categories 4 (premature abstraction) and 9 (AI ceremony)',
    focus: 'single-use helpers/wrappers, one-implementation interfaces, speculative generality; needless logging, theatrical error strings, defensive defaults that mask bugs.',
  },
  {
    key: 'deadcode',
    cats: 'categories 5 (bloat & dead code) and 7 (style inconsistency)',
    focus: 'orphaned/unused/duplicated code, commented-out code, debug prints; idioms that diverge from the surrounding file. Skip whatever the autoformatter owns.',
  },
]

const lensPrompt = (lens, shard) =>
  `You are a fresh reviewer specialized in ONE concern: ${lens.cats}. You did not ` +
  `write this code. Read ${catalog} for the definitions and guardrails, then read ` +
  `these files in full:\n${shard.map((f) => `- ${root}/${f}`).join('\n')}\n\n` +
  `Report ONLY ${lens.key} slop — ${lens.focus} Ignore every other category; ` +
  `separate agents cover those. Judge each candidate against the conventions of ` +
  `its own file — slop is deviation from the surrounding code, not an absolute ` +
  `rule. For each finding give the exact before and after (after "" = delete), and ` +
  `the file it is in. Lower confidence when unsure rather than dropping the finding.`

// Phase 1: lens swarm — every lens sweeps every shard on the newest Opus for
// strongest judgment. Concurrency is capped by the runtime; excess jobs queue.
phase('Lens review')
const shards = chunk(files, shardSize)
const lineJobs = []
for (const lens of LENSES)
  for (const shard of shards)
    lineJobs.push(() =>
      agent(lensPrompt(lens, shard), {
        label: `${lens.key}:${shard.length}f`,
        phase: 'Lens review',
        schema: LINE_SCHEMA,
        model: 'opus',
      }).then((r) => (r?.findings || []).map((f) => ({ ...f, lens: lens.key })))
    )
const lineFindings = (await parallel(lineJobs)).filter(Boolean).flat()

// Phase 2: architecture — generic. Group in-scope files by top-level directory,
// review the largest groups, and add one agent on the seams between them.
phase('Architecture')
const topDir = (f) => (f.includes('/') ? f.slice(0, f.indexOf('/')) : '(root)')
const counts = {}
for (const f of files) counts[topDir(f)] = (counts[topDir(f)] || 0) + 1
const groups = Object.keys(counts)
  .sort((a, b) => counts[b] - counts[a])
  .slice(0, 5) // cap module agents so wide trees don't explode the swarm

const archJobs = groups.map((g) => () =>
  agent(
    `Fresh architecture reviewer. Read ${catalog} (category 8 and the guardrails). ` +
    `Survey the "${g}" module of the repo at ${root} (files under ${g}/). Report only ` +
    `cross-file structural slop within it: misplaced responsibility, leaky boundaries, ` +
    `duplicated responsibility, dead modules. Do not repeat line-level nits.`,
    { label: `arch:${g}`, phase: 'Architecture', schema: ARCH_SCHEMA }
  ).then((r) => r?.findings || [])
)
// Seam agent: how the top-level modules depend on each other.
archJobs.push(() =>
  agent(
    `Fresh architecture reviewer. Read ${catalog} (category 8). The repo at ${root} ` +
    `has these top-level modules: ${groups.join(', ')}. Examine the boundaries ` +
    `BETWEEN them: logic living in the wrong module, leaky coupling, a single ` +
    `responsibility split across modules. Report only cross-module structural slop.`,
    { label: 'arch:seams', phase: 'Architecture', schema: ARCH_SCHEMA }
  ).then((r) => r?.findings || [])
)
const archFindings = (await parallel(archJobs)).filter(Boolean).flat()

return {
  lineFindings,
  archFindings,
  stats: {
    files: files.length,
    lenses: LENSES.length,
    shards: shards.length,
    lineCount: lineFindings.length,
    archCount: archFindings.length,
  },
}
