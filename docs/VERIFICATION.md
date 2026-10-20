# Verification report

Verified on **12 October 2026** in this project. The confidence-interval notebook was completed and verified as a vertical slice before expanding the course. These are automated results and AI source/content review, not independent human educator review or measured learning outcomes.

## Delivered scope

Six authored notebooks contain **95 chunks: 54 worked examples and 41 exercises**, each exercise with an unfinished starter and a separate optional answer. There are **260 authored R assertions**. The eleven advanced topics are explicitly upcoming outlines, with no placeholder notebooks.

| Notebook | Worked examples | Exercises | R assertions including answers |
| --- | ---: | ---: | ---: |
| R essentials | 13 | 10 | 62 |
| Probability | 8 | 6 | 41 |
| Distributions | 8 | 7 | 51 |
| Sampling and CLT | 8 | 6 | 36 |
| Confidence intervals | 8 | 6 | 33 |
| Hypothesis tests | 9 | 6 | 37 |
| **Total** | **54** | **41** | **260** |

The application uses real WebR **0.6.0 / R 4.6.0**, React 19.3, TypeScript, Vite, CodeMirror and IndexedDB. The exact dependency graph is locked. The fixed R runtime is copied from the installed package into the static build; production browser checks blocked every third-party request and still passed.

## Final commands and results

| Command | Observed result |
| --- | --- |
| `pnpm test` | **6 passed**: runtime content validation, stable IDs, unfinished exercise policy, plot descriptions, backup validation, exact edit round-trip, ordered IndexedDB writes/deletion, and commented R export. |
| `pnpm test:course` | **18 clean native-R runs passed**: six notebooks × examples-only, all answers, and unfinished starters. Uses R 4.6.1 with `--vanilla`, warnings treated as errors. |
| `pnpm build` | Strict TypeScript check and static build passed. An informational large-JavaScript-chunk warning remains (about 793 kB raw, 243 kB gzip). |
| `pnpm test:e2e` | **14 passed in 55.6 seconds**, using real Chromium and real WebR, including the real 30-second infinite-loop watchdog. |
| `pnpm test:production` | **2 passed in 3.7 seconds**: complete static site under `/course/`, all six Run all sequences, real plots and console text, zero missing-resource or page errors, and zero third-party requests; desktop/narrow/zoom/reduced-motion layout checks. |

Thus **22 automated application/browser tests passed**, in addition to the 18 native R runs. The WebR course test independently repeats all three content modes in separate R environments: **244 chunk executions and 586 assertion evaluations** per interpreter across the three modes (assertions repeat across modes). Nothing in the R runner is replaced with mocked output.

## What was exercised

- Every worked example and every supplied exercise answer runs in its intended order from a clean environment in both native R and WebR. Safe unfinished starters also run without breaking later examples. The UI’s Run all skips exercises still containing `# TODO`.
- Assignment in one chunk is available in a later chunk of that notebook. A different notebook environment cannot accidentally find that object. Console values preserve `TRUE`, `FALSE`, and `NA`.
- Captured R plots are genuine PNGs from WebR’s canvas device; every authored plot includes descriptive text and a printed numerical alternative. Partial console output, warnings, R errors, and syntax errors remain readable. An error cancels queued execution; a later manual run can recover.
- Command+Enter runs the focused chunk on the macOS Chromium host. Ctrl+Enter is tested with a Windows platform identity in Chromium. These are keyboard dispatch checks, not evidence that computation itself became faster.
- Tab leaves the editor. Run all executes in order. Run buttons and counters refer to the originating chunk. Output never moves to another chunk, and outputs are absent after a page reload until R is actually rerun.
- Edited source and later results are marked potentially stale. A downstream rerun remains marked if its preceding examples are dirty. An upstream edit made during a later execution cannot produce a fresh-looking result. R restart marks prior outputs as belonging to an earlier session.
- Edits survive reload. JSON export/import preserves multiline code, and opening an answer preserves the exercise edit. Invalid formats, unknown chunk IDs, unsupported versions, oversized records, and malformed JSON are rejected. Imported backups replace edits only after confirmation.
- Reset cancellation keeps edits; confirmation restores starter code. Delete cancellation keeps work. During a deliberately delayed real IndexedDB deletion, editors and controls lock until deletion and restart finish; attempted intervening edits cannot reappear on reload.
- Oversized editor pastes are refused before replacing or saving current text. The accepted persistence limits match import limits, preventing a “Saved” record that the app cannot subsequently read.
- Stop terminates an actual infinite loop, clears objects, and recovers the worker. Restart and Restart & run all match their labels. The actual 30-second watchdog also recovers. A deliberately blocked worker resource produces an explanatory loading failure; Retry succeeds after the block is removed.
- The production app runs from a nested static-hosting path. All runtime JavaScript, Wasm, libraries and lazy filesystem resources used by the course load successfully. No external dataset is required; synthetic definitions and metadata are bundled.

## Statistical verification and review

Exact checks cover sample-space counts, conditional probabilities, distribution identities and quantiles, interval geometry/coverage, and exact normal-test rejection probabilities. Seeded simulation checks use tolerances documented beside the assertions; they do not require a random estimate to equal a theoretical value.

Examples of inspected results: the confidence experiment covers the fixed mean in **379/400 = 0.9475** intervals; the plotted first 30 include three misses. In the testing notebook, null rejection was **0.05667** at a 0.05 threshold, and power for the main alternative was **0.71**, compared with exact normal-model power **0.705418**. The biased-selection experiment stays centered around the selected subgroup even at larger sample sizes.

AI content review checked definitions and assumptions, syntax-first explanations, discrete mass versus density, fixed parameters versus random statistics, SD versus SE, Monte Carlo variability versus sampling variability, CLT conditions, confidence coverage, p-value interpretation, Type I/II errors, and practical significance. Simulation is consistently distinguished from proof. This review is not independent expert approval.

## Performance measurements

Measured in a fresh Chromium browser context, with files served from local loopback on this Mac, without network throttling:

| Operation | Observed time |
| --- | ---: |
| New R worker startup, including initialization | 436.8 ms |
| First small execution, including new notebook environment/capture setup | 6.6 ms |
| Subsequent small execution in the same environment | 1.2 ms |
| Simple R plot capture and PNG conversion | 10.9 ms |

These are single local observations, not WAN download or ordinary-laptop performance guarantees. OS file caching was not cleared. Startup includes fetching runtime files into a fresh browser context; later executions reuse the worker. The static deployment is about 47 MiB on disk, dominated by R and its standard libraries; slow connections or memory-limited devices will behave differently. Defaults are deliberately modest; learners can increase repetitions explicitly.

## Visual and accessibility checks

Inspected rendered home, notebook, narrow chunk, and real interval-plot images. Browser checks verify no document-wide horizontal overflow at **1280, 390 and 320 px**, and at **200% CSS zoom** in Chromium. Editors and console tables scroll internally. Reduced-motion media preferences are supported. The layout stays in one reading sequence; controls have labels, visible focus, and runtime announcements. The interval plot distinguishes misses by shape/line style as well as color.

Representative screenshots are in `docs/screenshots/`, including `home-desktop.png`, `home-narrow.png`, `chunk-narrow.png`, `interval-output.png`, and `notebook-200-percent.png`. This is not a complete WCAG audit or a manual screen-reader study.

## Known limitations and remaining review

1. **Browser coverage:** Chromium on this Mac was executed. Firefox, Safari, actual Windows/Linux installations, touch devices, and assistive technologies need independent device testing. Small viewports were tested in desktop Chromium, not on physical phones. WebAssembly memory limits may affect mobile devices.
2. **Canvas graphics:** the course’s console/table/canvas path is verified. A self-hosted default PDF-device failure was found during integration; explicitly selecting `webr::canvas` fixes required plotting and cleanup. Arbitrary device/file workflows such as learner-authored PDF export are outside the notebook UI and remain unverified.
3. **R isolation:** ordinary notebook objects are separate, but random-number state, options, package state, filesystem and explicit global assignments share the one R process. This is not a security boundary between notebooks. Restart and Stop clear all notebooks’ R objects.
4. **Persistence:** code edits are saved, not R objects, output, selection history, or plot images. Browser storage can fail or be cleared, and separate origins/tabs do not synchronize work. Use exported backups. Limits are 100,000 characters per cell and 5 MB per backup.
5. **Staleness:** warnings conservatively follow document order and edits; they are not dependency analysis. Arbitrary user changes can alter the intended statistical experiment. Plot descriptions refer to starter code; edited plot output is labeled accordingly.
6. **Resources:** the runtime is self-hosted but not installed as an offline application. Large user-written simulations or output can exhaust browser memory despite the watchdog. There is no package manager UI or guarantee for arbitrary additional packages. Core lessons use base/standard R; the ggplot2 practical lesson loads a pinned, bundled package collection.
7. **Output ordering:** console text/tables are grouped before the plots within their own chunk; interleaving text and graphics expression-by-expression is not reproduced. Tables retain R’s readable monospaced printing rather than a separate data-grid interface.
8. **Educational scope:** the six core and seven practical notebooks are implemented. Advanced theory topics remain clearly labeled upcoming. Independent human statistics-educator review and measured learning outcomes have not been obtained.

No required initial notebook or requested core application feature is left as a mockup. No public deployment was performed; the project is runnable locally and its `dist/` is ready for static hosting.

## Mathematical typography update

All six notebooks now use explicit LaTeX notation rendered by pinned KaTeX
0.19.0 with bundled fonts and MathML. R expressions in prose use inline code.
Eight unit tests pass, including exhaustive formula parsing and currency/code
separation. Three production browser tests pass: all six notebooks run their
worked examples; static subdirectory hosting requires no third-party requests;
formulas render without errors and pages do not overflow at 1280, 390, or 320px.
Existing zoom/reduced-motion coverage also passes. The probability page was
visually inspected (`screenshots/math-probability.png`). All 396 code, answer,
and check strings were compared before and after and remained identical.
Build succeeds, with Vite's existing large JavaScript bundle advisory. The
upload archive meets Cloudflare browser-upload file-count and per-file limits.
No public deployment was performed. These are automated checks and AI visual
review, not independent educator or assistive-technology validation.

### Follow-up: inline-code conversion marker

A learner screenshot exposed a private-use sentinel left in the essentials
sampling explanation by the one-time typography conversion. Formula tests did
not cover characters inside inline code. Audited the six notebooks for these
markers and inspected their math/code tokens; found one sentinel occurrence.
Restored `sample(faces, size = 12, replace = TRUE)`. Course validation now rejects
sentinels/replacement characters in every string field, and a targeted browser
check confirms the complete call is visible. Ten unit tests and four production
browser tests pass. Rebuilt the public-upload ZIP with this fix. This audit does
not establish that every explanation is free from all possible content errors.

## Practical track implementation

Added six practical notebooks (P1–P6): CSV import, preparation/summaries,
visualization, group comparisons, regression, and a reproducible report. They
contain 25 worked examples and 25 exercises with runnable optional answers.
The complete course now has 12 notebooks and 145 chunks. Dataset generation,
units, quality defects, missing values, and CC0 license are documented alongside
the downloadable CSV. The application/source license remains MIT.

Verification performed:
- Native R: all 12 notebooks in example-only, answered-exercise, and unfinished-
  starter modes, each in a clean process (36 runs); all checks passed.
- Real WebR: the same three modes in separate environments for all 12 notebooks;
  every example/answer assertion passed and expected graphics were captured.
- Ten unit tests passed, including course validation, backup integrity, safe
  saving, every authored formula, and conversion-marker rejection.
- All 17 development browser cases passed across the full run and targeted
  reruns. Two original backup tests needed labeled file-input selectors after
  adding the CSV picker; the CSV privacy test was corrected to allow read-only
  HEAD requests from WebR. No application failure was suppressed.
- Five static-production browser cases passed: all 12 Run all sequences, same-
  origin resources, downloadable CSV/metadata, formula rendering, 1280/390/320px
  layouts, zoom/reduced motion, and actual regression plots.
- CSV upload/read, 2 MiB rejection, no write requests, and reset deletion of the
  uploaded file were verified while bundled data remained available.
- Practical desktop, mobile, and regression screenshots were visually reviewed
  by the AI assistant. This is not independent human educator validation.

Build succeeds with Vite's large-bundle advisory. No new runtime package
collection or server component was added. The upload ZIP is rebuilt from dist.
Public hosting was not performed. The existing advanced theory roadmap remains
upcoming; practical regression does not imply that ANOVA/theoretical regression
lessons are complete. Local CSV files are session-only and require reopening
following refresh, Restart, or Stop; saved-work backups preserve code, not data.

## ggplot2 visualization update — 2026-10-20

Added P4, “Build visualizations with ggplot2,” between base-R plotting and
group comparisons. Its nine examples and nine exercises cover plot layers,
mapped and fixed aesthetics, histograms, boxplots, counts versus summaries,
facets, and labeled presentation. Every chart has a numerical companion.
All notebook plots now offer PNG downloads. Existing notebook and chunk IDs
are unchanged; the practical track is now P1–P7. There are 13 notebooks,
88 worked examples, and 75 exercises (163 chunks).

ggplot2 4.0.3 and 16 dependencies are pinned, bundled, and loaded on demand.
Original archive and generated filesystem-image hashes are checked during
build preparation; image hashes are checked again in the browser. WebR mounts
the verified images with WORKERFS. This avoids the archive-installation path
that failed during development. Loading can be stopped, and failed downloads
can be retried. No external package service is required by visitors.

Verification performed:

- Ten unit tests passed.
- Native R: all 13 notebooks passed in worked-example, supplied-answer, and
  unfinished-starter modes, each in a clean process (39 runs). Native R used
  ggplot2 4.0.3.
- Real WebR: all 13 notebooks passed those same three modes in separate clean
  environments, including statistical assertions and expected graphics.
- All 20 development browser cases passed across the full run and one targeted
  rerun. The initial combined run passed 19 cases; concurrent production tests
  deleted a shared trace-output folder during the last case. Separate report
  folders fixed that test-infrastructure conflict, and the affected full-course
  WebR test passed on rerun.
- Package-specific checks verified lazy loading, reuse within a session,
  actual ggplot rendering, corrupted-download rejection and retry, and Stop
  during loading followed by successful recovery.
- All six production browser cases passed, including every notebook's Run all,
  same-origin resources at a subdirectory URL, a real downloaded PNG signature,
  and desktop/narrow layouts. Existing checks cover math, zoom/reduced motion,
  local CSV use, persistence, backups, shortcuts, reset/restart, and the runaway
  code watchdog.
- The ggplot desktop and 390px screenshots were visually inspected by the AI
  assistant. Charts scale down on phones; the PNG download allows viewing at
  full resolution. This is not independent human educator, Safari, or
  assistive-technology validation.

The build succeeds with Vite's existing large-JavaScript-bundle advisory.
The static output contains 218 files, totaling 67,286,745 bytes (about 64 MiB);
the largest asset is 18,062,845 bytes. The bundled plotting packages add about
16 MiB, fetched only when needed. These are file sizes, not network-speed or
learning-outcome measurements. Package fetching needs a modern browser with
Web Crypto and gzip DecompressionStream support. The hosting ZIP is rebuilt
from this output; public deployment and independent educator review remain
unperformed.
