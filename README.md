# Statistics with R

A complete browser notebook course in probability and statistics. Six core and seven practical notebooks combine short explanations, editable R, real output, and optional exercises. No login, paid API, server-side R, analytics, tracking, or AI endpoint.

## Open locally

Prerequisites: Node.js **22.12 or later** (Node 24 recommended) and **pnpm 11.25.0**. No native R installation is needed to use the app or run the WebR browser tests.

```sh
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm dev
```

In this already-installed checkout, `./start.sh` also starts the app. It uses a normal Node/pnpm installation when available, or the bundled Codex desktop runtime on this Mac; it does not install anything. Stop it with Ctrl+C.

Open the Local URL printed by Vite (normally `http://127.0.0.1:5173/`). Select **R essentials for statistical experiments**, or open `http://127.0.0.1:5173/#r-essentials`. The first completed vertical slice is `/#confidence-intervals`.

## Use the notebook

- A small **Run** button executes one chunk. **Command+Enter** on Mac or **Ctrl+Enter** on Windows/Linux runs the focused editor. **Tab** leaves the editor.
- Chunks share objects within a notebook. Run them in order. Other notebooks have separate object environments.
- **Run all** runs sequentially. It skips an exercise while its code contains `# TODO`; remove that marker when the exercise is ready. A direct Run executes its current starter. Examples do not depend on exercise answers.
- R errors stop the sequence. Warnings are printed and execution continues. Results remain underneath their originating chunks with execution numbers and measured durations.
- **Stop** terminates the worker and starts a fresh R session. **Restart R** does the same after confirmation. Both clear objects in **all notebooks**, keeping your editor text. **Restart & run all** starts the current notebook again from a clean runtime.
- A 30-second watchdog stops runaway chunks and restarts R. Startup has a 90-second timeout with a retry control. Reduce repetitions if a calculation reaches the limit.
- Reset asks before discarding edits. Showing an answer never replaces your work.

## Save and back up

Edits save automatically to IndexedDB on this browser and origin. The saving status is visible; a failure recommends exporting. R objects and output are deliberately not persisted, so restored work cannot be mistaken for execution in a current session. Edits mark their own and later output potentially stale; rerunning an earlier chunk also marks downstream output. A later chunk also remains marked if earlier worked examples have not run with their current code. This is conservative invalidation, not dependency tracking.

Use **Save & download** to download the current notebook as `.R` (explanations become comments), export all edits as JSON, import a validated backup, or delete local work after confirmation. Import replaces saved edits across the course, asks for confirmation, and restarts R. Invalid backups are rejected before modification. Limit: 5 MB per backup and 100,000 characters per cell; edits exceeding these limits are rejected before replacing your existing code. Editors are temporarily locked while importing or deleting work. Clearing browser storage, changing the host/port, or private browsing can make saved work unavailable. Export backups; simultaneous editing across tabs is not synchronized.

## Verification commands

```sh
pnpm test                         # content validation, backup validation, IndexedDB, R export
pnpm exec playwright install chromium
pnpm test:e2e                     # real WebR worker, complete course, editor and saving tests
pnpm build                        # strict TypeScript check and static build
pnpm test:production              # serve dist under /course/; run UI and layout checks
```

The development tests start/reuse port 5182. The production tests start/reuse port 4174 and require a current `dist/`. Browser tests use real R, including an actual infinite loop and the real 30-second watchdog; allow several minutes. Run with `CI=1` to require newly started test servers.

Optional additional native R verification:

```sh
pnpm test:course
# If Rscript is not on PATH:
RSCRIPT=/absolute/path/to/Rscript pnpm test:course
```

This executes worked examples, complete answers, and safe unfinished starters in distinct clean native R processes. Native R checks supplement the separate WebR tests; they do not establish browser compatibility on their own. See [verification evidence and limitations](docs/VERIFICATION.md).

## Static build and deployment

```sh
pnpm build
pnpm preview --port 4173
```

The dev/build scripts copy the pinned `webr@0.6.0` runtime into `public/webr/v0.6.0/` from the installed package, then include it in `dist/`. No CDN is needed at lesson runtime; all course requests go to the same host. The generated runtime folder is ignored in source control and recreated automatically. The complete static build is about 64 MiB on disk; R lazily loads the files it needs. A network connection is required to initially fetch the site from its host, but calculations and learner edits stay in the browser.

Deploy the **contents of `dist/`** to an ordinary static host. Serve via HTTP for localhost or HTTPS on the web, not `file://`. Preserve subdirectories and filenames. Vite uses relative asset paths; navigation uses URL hashes, so no server-side route rewrites are required. Both a domain root and a directory such as `/statistics/` are supported. The automated production suite tests `/course/`.

Do not set `Content-Encoding: gzip` merely because a bundled VFS file ends in `.data.gz`: WebR decompresses those payloads itself. Keep every `vfs/` resource and `.js.metadata` file intact.

Use JavaScript, CSS, and WebAssembly MIME types correctly (`application/javascript`, `text/css`, `application/wasm`). WebR uses its PostMessage worker channel, which needs no COOP/COEP isolation headers. It requires workers, WebAssembly, and OffscreenCanvas for the course graphics. Modern desktop Chromium is the verified browser; see the report for untested browsers and mobile limits. There is no service worker and no promise of offline operation.

## Source map

- `src/content/`: runtime-validated notebook records and upcoming roadmap.
- `src/components/Editor.tsx`: accessible R CodeMirror editor and keyboard execution.
- `src/lib/runtime.ts`: fixed WebR 0.6.0 / R 4.6.0 worker, environments, capture, queue and cancellation.
- `src/lib/storage.ts`: IndexedDB and versioned, validated backup/script export.
- `src/App.tsx`, `src/styles.css`: restrained single-column notebook and home page.
- `tests/`: unit, native R, real-worker and production-browser checks.
- `docs/`: [curriculum map](docs/CURRICULUM.md), [authoring guide](docs/AUTHORING.md), [data provenance](docs/DATA.md), [verification](docs/VERIFICATION.md).

## Design and statistical scope

The confidence interval notebook was built and verified first. It uses independent normal observations with known population standard deviation, making its z interval exact under the stated assumptions. Hypothesis testing uses the same model. Other notebooks investigate dice, counts, normal measurements, and skewed waiting times. Simulation is evidence about behavior, not a proof of a theorem. No exercises require written reflection, predictions, or scoring.

The advanced topics on the home page are explicitly **upcoming outlines**, not implemented lessons. Explanations and exercises are original. Automated checks and AI content review do not constitute independent human educator review or evidence of learning outcomes.

## Dependency choices and references

Exact dependencies are recorded in `package.json` and `pnpm-lock.yaml`. CodeMirror packages are deduplicated to ensure compatible editor extensions. The WebR npm package includes its own REPL dependencies; an upstream React peer warning can appear for that unused REPL dependency tree. The application uses React 19.3 and imports only WebR's runtime API.

Compatibility was checked against official sources: [WebR 0.6.0](https://github.com/r-wasm/webr/releases/tag/v0.6.0), [WebR serving](https://docs.r-wasm.org/webr/v0.6.0/serving.html), [WebR plotting](https://docs.r-wasm.org/webr/v0.6.0/plotting.html), [React versions](https://react.dev/versions), [Vite requirements](https://vite.dev/guide/), and [CodeMirror Tab accessibility](https://codemirror.net/examples/tab/).

Original code, prose, and synthetic experiment definitions use the repository MIT license. Dependencies retain their licenses; WebR distribution binaries use GPL-3.0 and their accompanying components have further notices, included in `public/notices/webr-license.txt` with upstream source links. The app makes these runtime notices available in its footer.

For a public link that works while your computer is off, follow
[the public-hosting guide](docs/HOSTING.md). Upload the built `dist` folder,
not the source project or local `127.0.0.1` address.


## Practical track: Working with data in R

The home page separates six core statistics notebooks from seven implemented
practical notebooks, P1–P7. Open `/#data-import` to start. The track covers CSV
import, cleaning and summaries, base-R plots, ggplot2 visualization, group comparisons, regression, and a
reproducible analysis report. Advanced regression theory/ANOVA remain upcoming.

The bundled `public/data/orders.csv` is original synthetic CC0 teaching data.
See `public/data/README.md` for units, generation and deliberate quality issues.
The worker loads this CSV into `data/orders.csv` at startup; production hosting
must include the data folder. Download the CSV into a `data` folder in your R
working directory to run exported scripts outside the browser. Native course
tests set their working directory to `public` automatically.

“Dataset & your own CSV” lets learners open a local CSV up to 2 MiB as
`data/uploaded.csv`. Contents stay in the R worker, are shared across notebook
environments, and disappear on Restart/Stop or reload. They are not in IndexedDB
or backup JSON; keep the original CSV and reopen it. Uploaded columns are not
automatically mapped to course examples: inspect and adapt the code yourself.
The sample notebooks remain reproducible from the bundled file.


## ggplot2 visualization

Open `/#data-ggplot` (P4) after the base-R plotting notebook. It contains nine
worked examples and nine exercises on mappings/layers, grouped scatterplots,
histograms, boxplots, counts versus summary bars, facets, labels, and themes.
Every worked chart has a numerical alternative; the Download plot PNG link
exports its actual R-generated image.

WebR ggplot2 **4.0.3** and its dependencies are pinned in `r-packages.lock.json`.
Original archives are retained in `vendor/r-packages`; their verified browser
filesystem images are in `public/r-packages` with a separate image lockfile.
Normal dev/build verifies all hashes without network access. Only a notebook
with `packages: ['ggplot2']` loads the images, on its first Run in an R session.
The additional compressed download is about 16 MiB. Package loading has a
visible status and a two-minute timeout; Stop also cancels loading. Restart
clears loaded packages and the next plotting run reloads them (browser HTTP
caching may avoid another transfer). The existing 30-second limit applies to
subsequent R code execution. Package initialization time is included in the
first chunk's elapsed time, separately from the displayed R startup time.

The complete static bundle is now about 64 MiB. Host the full r-packages folder.
The compressed image files intentionally end in `.data.bin` to prevent hosts
from treating `.gz` as HTTP content encoding; the browser verifies their hashes,
decompresses them, and mounts one read-only plotting library. Package source and
license notices are linked from the footer and included in the archives/images.

To regenerate the browser images after an intentional package-lock update,
run `python3 scripts/prepare-package-images.py` (Python standard library only),
then run the full verification suite. Ordinary use/build does not require Python.
For native R verification or exported ggplot scripts, install ggplot2 4.0.3 in
native R separately; WebR binaries cannot be used by desktop R. An existing
matching installation was used for this project's native verification.
