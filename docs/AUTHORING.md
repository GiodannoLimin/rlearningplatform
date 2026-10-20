# Content-authoring guide

## Where content lives

Notebook records live in `src/content/`, independently of React components. `src/content/schema.ts` defines their TypeScript types and Zod runtime schemas. Register a notebook in `src/content/index.ts` and pass the collection through `validateCourse()`.

The schema supports core notebook numbers 0–5 and practical records 6–12, displayed as P1–P7. Practical records set track to practical; original records leave track absent. Next links stay within a track. Further expansion requires a schema change; upcoming outlines are not notebook records.

| Record | Required content |
| --- | --- |
| Notebook | `id`, `number`, `title`, `question`, `estimatedMinutes`, `prerequisites`, `introduction`, `sections`, `closing`; optional `references` containing `title` and `url` |
| Section | `id`, `title`, explanatory `paragraphs`, and `chunks` |
| Chunk | `id`, `title`, `kind` (`example` or `exercise`), `code`, `explanation`, and nonempty `checks`; exercises also require `answer`; plots need `plotAlt` |

Keep `estimatedMinutes` to a plain range such as `50–65`; the UI supplies “minutes” and the estimate label. Do not prefix section titles with numbers because the UI supplies them. Prose supports explicit LaTeX delimiters and backtick-delimited inline R code (see Mathematical typography below). Define every symbol. Never apply heuristic text replacement to code or formulas.

All notebook, section, and chunk IDs must be globally unique and match `^[a-z][a-z0-9-]+$`. For example, `ci-one-sample` is a durable chunk ID. IDs identify saved edits and backup records, so preserve them when revising prose or code; renaming or deleting one requires a migration decision. The current importer rejects unknown chunk IDs rather than silently dropping work.

## Write a small experiment

Start with a question about probability or statistics. Introduce necessary notation, assumptions, and unfamiliar R syntax before the code that uses them; `explanation` is displayed before its editor. Aim for one main idea per chunk and short paragraphs of one to three sentences.

Explain what the output means when a novice would otherwise struggle. An output interpretation may state the expected pattern, but the displayed numeric output must always come from real R execution. Never insert fabricated console output or plot images as a substitute for running the experiment.

Use base R and its standard statistical/graphics functions when sufficient. Keep default repetitions modest, explain `set.seed()`, and place seeds before whole experiments rather than inside their repeated steps. Keep population parameters, observations per sample, and number of repetitions distinct.

Show enough of a calculation for the learner to understand it. Introduce loops before compact repetition helpers, and introduce a custom function as a way to reuse already understood steps. State whether a comparison is an exact result, a mathematical result under assumptions, or numerical evidence from a finite simulation.

Write original prose and exercises. Add precise sources in `references` when they support a method or API; a source is not an endorsement or independent review of this course. If adding a dataset, bundle it locally and document provenance, permission/license, columns, units, and missing-value conventions. Label synthetic data explicitly.

## Exercises and shared state

- Put an exercise directly after the relevant experiment or closely related group of experiments.
- A starter must contain `# TODO` and must leave real work unfinished. Use comments plus safe setup, not undefined placeholders, intentional errors, or a complete answer disguised as a starter.
- Run all skips any exercise whose current code still contains a `# TODO` comment. Learners remove those comments when they want their completed exercise included. Individual Run still executes the starter, so it must be safe to run as written.
- Give every exercise an `answer` string. The closed disclosure displays it without replacing the learner’s edit.
- Prefer separate exercise object names such as `exercise_lower`. Worked examples must run without any exercise answer and must not depend on an exercise’s objects.
- Chunks within a notebook share an R environment. Make worked-example dependencies explicit and verify document order from a clean environment. Each notebook must also work independently of the others.

R objects are separate between notebooks, but options, random-number state, graphics settings, and explicitly global assignments can affect the shared runtime. Avoid `<<-`, global assignments, unnecessary option changes, filesystem writes, package downloads, and external network dependencies in lesson code. Use deterministic seeds when a later comparison depends on a particular random experiment.

## Output and accessible graphics

Print useful values, named vectors, or small `data.frame()` tables. Preserve R conventions such as TRUE, FALSE, and NA. A final assignment alone is valid R, but if learners need to inspect a result, add its name or a `print()` call afterward.

Every plotting chunk needs a descriptive `plotAlt` and an actual printed numerical or text alternative in the same chunk. Explain what is plotted, label axes and units, and distinguish important groups by something besides color, such as line style or point shape. Keep plots readable at narrow viewport sizes; inspect them in the application rather than trusting source code alone.

The runtime captures plots generated by R. The UI associates each output with its chunk, marks potentially stale downstream output, and marks outputs from earlier sessions. This is conservative warning behavior, not automatic dependency analysis. Never write lesson claims that assume perfect dependency tracking or restored live R objects.

## Verification checks

Each `checks` entry is an R expression that should evaluate to a single TRUE after the worked example or supplied exercise answer. Use `all()` when testing a vector condition. The course verifier wraps checks in `stopifnot()` and stops on failures. Checks are maintainer verification, not learner grading, progress scores, or hidden requirements for an exercise edit.

Prefer exact assertions for exact identities, object lengths, bounds, and deterministic constructions. Use numeric tolerances for floating-point comparisons. For simulated estimates, set a deterministic seed and justify an appropriate tolerance in a source comment: do not require a finite simulation to exactly equal its theoretical target. For a simulated proportion with target probability p and B independent repetitions, its Monte Carlo standard error is √(p(1 − p)/B); define p and B in the lesson if using that formula there.

Each notebook must pass these clean-run modes:

1. **Examples:** all worked examples in order, with exercise chunks omitted.
2. **Answers:** all worked examples and every supplied exercise answer in order.
3. **Starters:** all worked examples and unfinished starter code in order, checking only the examples. This checks that manually running an unfinished starter is harmless.

Do not use an earlier run’s objects to rescue a failed mode. Inspect statistical interpretations as well as successful execution; a calculation can run correctly while answering the wrong question.

## Commands

From the repository root, after installing the pinned dependencies:

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm test
pnpm test:course
pnpm test:e2e
pnpm build
pnpm test:production
```

- `pnpm test` runs schema, course-structure, and storage unit checks.
- `pnpm test:course` runs the three clean modes for every registered notebook in native R, including all checks. It requires `Rscript` on PATH; set `RSCRIPT` to its full executable path if needed. The verifier uses `--vanilla`, treats R warnings as errors, captures plots to a temporary device, and removes temporary files afterward.
- `pnpm test:e2e` runs Chromium against the development server with the real WebR worker. Its runtime and UI checks cover execution, state, graphics, controls, saving, and recovery; the registered notebooks are each run in three separate WebR environments for worked examples, supplied answers, and safe starters.
- `pnpm build` validates TypeScript and prepares the static application, including the fixed WebR runtime resources.
- `pnpm test:production` serves the built application under `/course/` and runs each registered notebook’s worked examples with third-party requests blocked. It also checks the supported layouts. Run the build first.

Native R tests do not replace browser/WebR verification. When adding or changing a notebook, ensure its worked examples, answers, and starters are covered by real-WebR content checks, in addition to the production Run all checks. Keep assertions tied to the statistical intent and behavior, and visually inspect changed plots and long chunks on desktop and narrow screens.

Record what was actually run and any limitations in the verification report. Distinguish automated checks, AI content review, and independent human educator review; do not describe the first two as independent expert validation or evidence of learning outcomes.

## Mathematical typography

Lesson prose supports explicit LaTeX delimiters `\( ... \)` (inline) and
`\[ ... \]` (display), plus backticks for inline R expressions. In ordinary
TypeScript string literals, double each backslash: `"The mean is \\(\\mu\\)."`.
Use `\\frac{a}{b}`, `\\bar{x}`, and `\\sigma^2` for fractions, sample means,
and powers. Keep definitions beside formulas. Use backticks for actual R
syntax and object names; keep code, answers, checks, and plot alt text plain.
Dollar signs are literal currency, not math delimiters. KaTeX renders local
fonts and accessible MathML; arbitrary HTML and trusted LaTeX commands are
not enabled. `pnpm test` checks every course formula. R script downloads
retain the readable LaTeX source in comments; executable code is unchanged.


## Optional plotting packages

Declare `packages: ['ggplot2']` only on notebooks that need it. The runtime loads
the pinned library before that notebook's first chunk, with a cancellable loading
state. Use `ggplot2::` names explicitly: notebook environments intentionally skip
the mutable global package search path. Keep all package content separate from
learner edits. Every plotted example needs plotAlt and a numerical alternative;
choose assertions on counts, coordinates, summaries, and mappings rather than
brittle pixel snapshots. Maintain stable chunk IDs when inserting a notebook so
saved edits remain usable. Native R must have the same ggplot2 version for tests.
