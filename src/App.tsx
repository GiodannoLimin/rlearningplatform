import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { notebooks } from './content';
import { roadmap } from './content/roadmap';
import { chunksOf, type Chunk, type Notebook } from './content/schema';
import { Prose } from './components/Prose';
import { Editor } from './components/Editor';
import { runtime, type RunResult } from './lib/runtime';
import { deleteWork, downloadFile, notebookScript, parseBackup, readWork, saveWork, serializeBackup, MAX_BACKUP_BYTES, validateWorkSize, type Edits } from './lib/storage';

type Output = RunResult & { source: string; stale?: string };
const fromHash = () => { try { return decodeURIComponent(location.hash.slice(1).split('/')[0] || 'home'); } catch { return 'home'; } };
export function App() {
  const [route, setRoute] = useState(fromHash);
  const [edits, setEdits] = useState<Edits>({});
  const editsRef = useRef<Edits>({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState('Opening saved work…');
  const saveRevision = useRef(0);
  const [outputs, setOutputs] = useState<Record<string, Output>>({});
  const [busy, setBusy] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const maintenanceRef = useRef(false);
  const dirtyExamples = useRef(new Set(notebooks.flatMap(n => chunksOf(n).filter(c => c.kind === 'example').map(c => c.id))));
  const dirtyGeneration = useRef(runtime.getSnapshot().generation);
  const codeRevisions = useRef<Record<string, number>>({});
  const busyRef = useRef(false);
  const [activeChunk, setActiveChunk] = useState<string>();
  const [notice, setNotice] = useState('');
  const runToken = useRef(0);
  const inputFile = useRef<HTMLInputElement>(null);
  const csvFile = useRef<HTMLInputElement>(null);
  const state = useSyncExternalStore(runtime.subscribe, runtime.getSnapshot);
  const notebook = notebooks.find(n => n.id === route);
  const nextNotebook = notebook && notebooks.find(n => n.number === notebook.number + 1 && n.track === notebook.track);
  const allChunks = notebook ? chunksOf(notebook) : [];

  useEffect(() => { const fn = () => { setRoute(fromHash()); window.scrollTo(0, 0); }; window.addEventListener('hashchange', fn); return () => window.removeEventListener('hashchange', fn); }, []);
  useEffect(() => {
    readWork(notebooks).then(saved => { editsRef.current = saved; setEdits(saved); setSaving('Saved on this device'); }).catch(() => setSaving('Local saving unavailable or saved data invalid. Export a backup to keep your edits.')).finally(() => setLoaded(true));
  }, []);
  useEffect(() => { if (notebook) void runtime.start().catch(() => {}); }, [notebook]);
  useEffect(() => {
    const listener = (event: BeforeUnloadEvent) => { if (saving === 'Saving…') { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', listener); return () => window.removeEventListener('beforeunload', listener);
  }, [saving]);

  function persist(next: Edits) {
    editsRef.current = next; setEdits(next); setSaving('Saving…');
    const revision = ++saveRevision.current;
    void saveWork(next).then(() => { if (revision === saveRevision.current) setSaving('Saved on this device'); }).catch(() => { if (revision === saveRevision.current) setSaving('Could not save locally. Export a backup to keep your edits.'); });
  }
  function invalidateFrom(n: Notebook, chunkId: string, include: boolean, reason: string) {
    const cells = chunksOf(n); const index = cells.findIndex(c => c.id === chunkId);
    for (const c of cells.slice(index + (include ? 0 : 1))) if (c.kind === 'example') dirtyExamples.current.add(c.id);
    setOutputs(prev => { const next = { ...prev }; for (const c of cells.slice(index + (include ? 0 : 1))) if (next[c.id]) next[c.id] = { ...next[c.id], stale: reason }; return next; });
  }
  function change(n: Notebook, c: Chunk, code: string) {
    if ((editsRef.current[c.id] ?? c.code) === code) return;
    const next = { ...editsRef.current };
    if (code === c.code) delete next[c.id]; else next[c.id] = code;
    codeRevisions.current[n.id] = (codeRevisions.current[n.id] ?? 0) + 1;
    persist(next); invalidateFrom(n, c.id, true, 'Code changed here or earlier. Run in order to refresh.');
  }
  function canChange(c: Chunk, code: string): boolean {
    if (maintenanceRef.current) return false;
    try { const next = { ...editsRef.current }; if (code === c.code) delete next[c.id]; else next[c.id] = code; validateWorkSize(next); return true; }
    catch (error) { setNotice(error instanceof Error ? error.message : String(error)); return false; }
  }
  async function execute(n: Notebook, cells: Chunk[], runAll = false) {
    if (!loaded || busyRef.current || state.status === 'loading') return;
    if (dirtyGeneration.current !== runtime.getSnapshot().generation) {
      dirtyExamples.current = new Set(notebooks.flatMap(item => chunksOf(item).filter(c => c.kind === 'example').map(c => c.id)));
      dirtyGeneration.current = runtime.getSnapshot().generation;
    }
    busyRef.current = true; setBusy(true); setNotice('');
    const token = ++runToken.current;
    const queue = cells.map(c => ({ c, code: editsRef.current[c.id] ?? c.code }));
    let skipped = 0;
    let failed = false;
    try {
      for (const { c, code } of queue) {
        if (token !== runToken.current) break;
        if (runAll && c.kind === 'exercise' && /#\s*TODO\b/.test(code)) { skipped++; continue; }
        setActiveChunk(c.id);
        invalidateFrom(n, c.id, false, 'An earlier chunk ran again. This later output may be outdated.');
        const revision = codeRevisions.current[n.id] ?? 0;
        const result = await runtime.run(n.id, code, n.packages);
        if (token !== runToken.current) break;
        const previousExamples = chunksOf(n).slice(0, chunksOf(n).findIndex(item => item.id === c.id)).filter(item => item.kind === 'example');
        const stale = (editsRef.current[c.id] ?? c.code) !== code ? 'Edited while running. This output belongs to the earlier code.'
          : revision !== (codeRevisions.current[n.id] ?? 0) ? 'Code changed in this notebook while running. Run in order to refresh.'
          : previousExamples.some(item => dirtyExamples.current.has(item.id)) ? 'Earlier examples have not run with current code in this session. Run all to refresh.' : undefined;
        if (!result.error && !stale) dirtyExamples.current.delete(c.id);
        else if (c.kind === 'example') dirtyExamples.current.add(c.id);
        setOutputs(prev => ({ ...prev, [c.id]: { ...result, source: code, stale } }));
        if (result.error) { failed = true; setNotice(`Stopped at “${c.title}”. Read its error below; later chunks did not run.`); break; }
      }
      if (skipped && !failed && token === runToken.current) setNotice(`Run all skipped ${skipped} unfinished exercise${skipped === 1 ? '' : 's'}. Edit an exercise and remove its # TODO line to include it next time.`);
    } catch (error) { if (token === runToken.current) setNotice(error instanceof Error ? error.message : String(error)); }
    finally { if (token === runToken.current) { busyRef.current = false; setBusy(false); setActiveChunk(undefined); } }
  }
  async function restart(runAfter = false, stop = false) {
    if (!stop && !window.confirm('Restart R? All notebooks’ R objects and uploaded CSV files will be cleared. Your code stays saved; existing outputs will be marked as from an earlier session.')) return;
    ++runToken.current; busyRef.current = true; setBusy(true); setActiveChunk(undefined);
    setNotice(stop ? 'Stopped. R is restarting; editor contents are preserved.' : 'Restarting R. Editor contents are preserved.');
    try {
      await (stop ? runtime.stop() : runtime.restart());
      setNotice('R restarted. All R objects were cleared; previous outputs are from an earlier session.');
      busyRef.current = false; setBusy(false);
      if (runAfter && notebook) await execute(notebook, chunksOf(notebook), true);
    } catch (e) { setNotice(String(e)); busyRef.current = false; setBusy(false); }
  }
  function lockWork(locked: boolean) {
    maintenanceRef.current = locked; setMaintenance(locked); busyRef.current = locked; setBusy(locked);
  }
  async function importWork(file?: File) {
    if (!file || busyRef.current) return;
    lockWork(true);
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error('Backup is too large (maximum 5 MB).');
      const imported = parseBackup(await file.text(), notebooks);
      if (!window.confirm('Import this backup and replace saved edits in all notebooks? Export your current work first if you want to keep it. R will restart.')) return;
      ++runToken.current;
      persist(imported); setOutputs({}); await runtime.restart(); setNotice('Backup imported. Code is restored; run chunks to create fresh R objects and output.');
    } catch (e) { setNotice(`Import failed: ${e instanceof Error ? e.message : String(e)}`); }
    finally { lockWork(false); if (inputFile.current) inputFile.current.value = ''; }
  }
  async function forgetWork() {
    if (busyRef.current || !window.confirm('Delete all saved edits on this device and restore every starter? This cannot be undone unless you exported a backup. R will restart.')) return;
    lockWork(true); ++runToken.current; ++saveRevision.current; setSaving('Deleting saved work…');
    try { await deleteWork(); editsRef.current = {}; setEdits({}); setOutputs({}); setSaving('Saved work deleted'); await runtime.restart(); setNotice('Saved edits deleted. Every chunk has its original starter.'); }
    catch (e) { setNotice(`Could not finish deleting saved work: ${String(e)}`); setSaving('Deletion could not finish. Export a backup of your current work.'); }
    finally { lockWork(false); }
  }
  async function importCSV(file?: File) {
    if (!file || busyRef.current || maintenanceRef.current) return;
    maintenanceRef.current = true; setMaintenance(true);
    try {
      if (!file.name.toLowerCase().endsWith('.csv')) throw new Error('Choose a CSV file.');
      if (file.size > 2 * 1024 * 1024) throw new Error('Choose a CSV smaller than 2 MiB.');
      await runtime.uploadCSV(new Uint8Array(await file.arrayBuffer()));
      setNotice('CSV available as data/uploaded.csv for this R session. Read it with read.csv("data/uploaded.csv"). Uploading another CSV replaces that file; restart removes it. Your original course dataset is unchanged.');
      setOutputs(prev => Object.fromEntries(Object.entries(prev).map(([id, output]) => [id, { ...output, stale: 'A CSV was uploaded. Results using data/uploaded.csv may be outdated; rerun those chunks.' }])));
    } catch (error) { setNotice(error instanceof Error ? error.message : String(error)); }
    finally { maintenanceRef.current = false; setMaintenance(false); if (csvFile.current) csvFile.current.value = ''; }
  }
  const disabled = !loaded || busy || maintenance || state.status === 'loading';
  return <>
    <a className="skip-link" href="#main-content" onClick={e => { e.preventDefault(); document.getElementById('main-content')?.focus(); }}>Skip to notebook</a>
    <header className="site-header"><a className="brand" href="#home"><span className="brand-icon" aria-hidden="true">R</span> Statistics with R</a><span className="header-note">A course in experiments</span></header>
    <main id="main-content" tabIndex={-1}>
      {notebook ? <>
        <nav className="breadcrumb" aria-label="Course"><a href="#home">The notebooks</a><span aria-hidden="true">/</span><span>{notebook.track === 'practical' ? 'Practical' : 'Notebook'} {notebook.track === 'practical' ? notebook.number - 5 : notebook.number.toString().padStart(2, '0')}</span></nav>
        <div className="eyebrow">{notebook.track === 'practical' ? 'PRACTICAL' : 'NOTEBOOK'} {notebook.track === 'practical' ? notebook.number - 5 : notebook.number.toString().padStart(2, '0')} <span>·</span> {notebook.estimatedMinutes} MINUTES, ESTIMATED</div>
        <h1>{notebook.title}</h1><p className="question">{notebook.question}</p>
        <p className="prerequisites"><strong>Before you begin</strong> <Prose text={notebook.prerequisites.join(' · ')} /></p>
        {notebook.introduction.map((p, i) => <p key={i}><Prose text={p} /></p>)}
        {notebook.packages?.includes('ggplot2') && <p className="notebook-note">This notebook uses ggplot2 4.0.3. Its bundled packages load on your first Run, with a visible loading message. Later chunks reuse them; Restart R clears loaded packages. Other notebooks do not need this download.</p>}
        <details className="contents"><summary>In this notebook <span>{notebook.sections.length} sections</span></summary><ol>{notebook.sections.map(s => <li key={s.id}><a href={`#${notebook.id}/${s.id}`} onClick={e => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: 'instant' }); document.getElementById(s.id)?.focus(); }}>{s.title}</a></li>)}</ol></details>
        <div className="notebook-controls" aria-label="Notebook controls">
          <div className="main-controls"><button className="primary" disabled={disabled} onClick={() => void execute(notebook, allChunks, true)}>Run all <span aria-hidden="true">↗</span></button><button disabled={maintenance || state.status !== 'running'} onClick={() => void restart(false, true)}>Stop</button><button disabled={busy || state.status === 'loading'} onClick={() => void restart()}>Restart R</button><button disabled={disabled} onClick={() => void restart(true)}>Restart &amp; run all</button></div>
          <div className="runtime-line" role="status" aria-live="polite"><span className={`status-dot ${state.status}`} aria-hidden="true"/>{state.message}{state.startupMs !== undefined && <span className="timing">Startup {(state.startupMs / 1000).toFixed(1)}s</span>}</div>
          {state.status === 'error' && <button onClick={() => void runtime.start().catch(() => {})}>Retry loading R</button>}
          <details className="work-menu"><summary>Save &amp; download</summary><div className="work-actions"><button disabled={!loaded || maintenance} onClick={() => downloadFile(`${notebook.id}.R`, notebookScript(notebook, editsRef.current), 'text/plain')}>Download .R script</button><button disabled={!loaded || maintenance} onClick={() => downloadFile('statistics-with-r-backup.json', serializeBackup(editsRef.current), 'application/json')}>Export all saved work</button><button disabled={disabled} onClick={() => inputFile.current?.click()}>Import saved work</button><button className="danger" disabled={disabled} onClick={() => void forgetWork()}>Delete saved work</button></div><p>Edits are saved in this browser’s IndexedDB. Clearing browser storage can remove them. Export a backup to move or keep your work. R objects and outputs are not saved.</p></details>
          <div className="saving" role="status">{saving}</div>
        </div>
        {notebook.track === 'practical' && <details className="dataset-note"><summary>Dataset &amp; your own CSV</summary><p>The teaching dataset is synthetic, with 122 imported rows and 120 valid orders. <a href="./data/orders.csv" download>Download orders.csv</a> · <a href="./data/README.md" target="_blank" rel="noreferrer">Column definitions, provenance, and license</a>.</p><p>In desktop R, put orders.csv in a folder named data inside your working directory. In this website, it is already available as <code>data/orders.csv</code>.</p><button disabled={disabled} onClick={() => csvFile.current?.click()}>Open your own CSV</button><p>Your file stays in this browser’s R worker, with no server upload. Limit: 2 MiB. Read it using <code>read.csv("data/uploaded.csv")</code> and adapt the column names. It is shared across notebook environments, replaced by the next upload, and removed by Restart or Stop. File contents are not included in saved-work backups; keep the original file.</p></details>}
        <aside className="notebook-note"><p id="editor-help"><strong>Read → run → experiment.</strong> Press <kbd>⌘ Enter</kbd> on Mac or <kbd>Ctrl Enter</kbd> on Windows/Linux in a chunk to run it. Tab leaves the editor.</p><p>Chunks share objects within this notebook; usually run from top to bottom. Run all skips exercises containing <code># TODO</code>. Worked examples never require an exercise answer.</p><details><summary>About R sessions and output</summary><p>Stop terminates the worker and restarts R. Restart clears objects in every notebook and removes uploaded CSV files, while preserving your code. A 30-second limit also recovers from runaway code. Output from a previous session is marked below. Changes mark later results as potentially outdated; this is a precaution, not dependency analysis.</p><p>Notebook objects are separate, but R options, random-number state, and explicitly global assignments share one runtime. Reproducible examples set a seed. Avoid using several browser tabs to edit the same work.</p></details></aside>
        {notice && <p className="notice" role="status">{notice}</p>}
        {!loaded ? <p>Loading your saved code…</p> : notebook.sections.map((s, i) => <section className="lesson-section" id={s.id} key={s.id} tabIndex={-1}><div className="section-number">{(i + 1).toString().padStart(2, '0')}</div><h2>{s.title}</h2>{s.paragraphs.map((p, j) => <p key={j}><Prose text={p} /></p>)}{s.chunks.map(c => {
          const output = outputs[c.id];
          const stale = output && (output.generation !== state.generation ? 'Earlier R session. Re-run to create current objects and output.' : output.stale);
          return <article className={`chunk ${c.kind}`} key={c.id} data-chunk-id={c.id} aria-label={c.title}>
            <h3><span className="chunk-kind">{c.kind === 'exercise' ? 'YOUR TURN' : 'R EXPERIMENT'}</span>{c.title}</h3><p><Prose text={c.explanation} /></p>
            <div className="cell"><div className="cell-toolbar"><span className="execution" aria-label={output ? `Execution ${output.execution}` : 'Not executed'}>[{activeChunk === c.id ? '*' : output?.execution ?? ' '}] <span>R</span></span><div><button disabled={disabled} onClick={() => { if ((editsRef.current[c.id] ?? c.code) !== c.code && window.confirm('Reset this chunk to its starter code? Your edits to this chunk will be discarded.')) change(notebook, c, c.code); }}>Reset</button><button className="run" aria-label={`Run ${c.title}`} disabled={disabled} onClick={() => void execute(notebook, [c])}>{activeChunk === c.id ? 'Running…' : 'Run'} <span aria-hidden="true">▷</span></button></div></div>
            <Editor locked={maintenance} canChange={code => canChange(c, code)} label={`${c.title} R code`} value={edits[c.id] ?? c.code} onChange={value => change(notebook, c, value)} onRun={() => void execute(notebook, [c])}/>
            {activeChunk === c.id && <div className="output-status" role="status">Running in R…</div>}
            {output && <div className={`output ${output.error ? 'error-output' : ''}`} aria-label={`Output for ${c.title}`}><div className="output-label">OUTPUT <span>{output.elapsedMs < 1000 ? `${Math.round(output.elapsedMs)} ms` : `${(output.elapsedMs / 1000).toFixed(2)} s`}</span></div>{stale && <p className="stale" role="status">{stale}</p>}{output.console && <pre tabIndex={0}>{output.console}</pre>}{output.error && !output.console.includes(output.error) && <pre className="error-text">{output.error}</pre>}{output.images.map((src, imageIndex) => <figure key={imageIndex}><img src={src} alt={output.source === c.code ? c.plotAlt ?? 'R plot. Print a numerical summary for an accessible alternative.' : 'Plot generated by edited R code. Print the plotted values for an accessible numerical alternative.'}/><figcaption>{output.source === c.code ? c.plotAlt ?? 'Plot generated by your R code.' : 'Plot from edited code. The original description may no longer apply; print the plotted values as a numerical alternative.'}</figcaption><a className="plot-download" href={src} download={`${notebook.id}-${c.id}-${imageIndex + 1}.png`}>Download plot PNG</a></figure>)}{!output.console && !output.images.length && !output.error && <p className="quiet-output">Finished. Assignment stores an object without printing it.</p>}</div>}
            </div>
            {c.answer && <details className="answer"><summary>Show answer</summary><pre tabIndex={0}>{c.answer}</pre><p>Compare this with your code. Showing an answer never replaces your edits.</p></details>}
          </article>;
        })}</section>)}
        <section className="closing"><div className="eyebrow">TAKE THE IDEA WITH YOU</div><h2>What the experiments show</h2>{notebook.closing.map((p, i) => <p key={i}><Prose text={p} /></p>)}<details className="references"><summary>R reference documentation</summary><ul>{notebook.references?.map(r => <li key={r.url}><a href={r.url} target="_blank" rel="noreferrer">{r.title}</a></li>)}</ul></details><nav className="next-notebook">{nextNotebook ? <a href={`#${nextNotebook.id}`}>Next notebook: {nextNotebook.title} →</a> : <a href="#home">Back to the course →</a>}</nav></section>
      </> : <Home />}
      <input ref={csvFile} type="file" accept=".csv,text/csv" hidden aria-label="Open your own CSV file" onChange={e => void importCSV(e.target.files?.[0])}/>
      <input ref={inputFile} type="file" accept=".json,application/json" hidden aria-label="Import saved work file" onChange={e => void importWork(e.target.files?.[0])}/>
    </main>
    <footer><span>Statistics with R · <a href="./notices/webr-license.txt">R runtime licenses</a> · <a href="./notices/plot-packages.txt">Plotting package licenses</a></span><span>Real R. Your browser. Room to experiment.</span><p className="author-credit">Created by Giodanno Limin with AI assistance from OpenAI Codex. <span>Course content has not yet been independently reviewed for accuracy.</span></p></footer>
  </>;
}
function Home() {
  return <><div className="home-intro"><div className="eyebrow">AN OPEN NOTEBOOK COURSE</div><h1>Make statistics<br/><em>an experiment.</em></h1><p className="question">Ask a question. Run real R. See what changes.</p><p>Learn probability and statistics through small experiments you can read, run, and make your own. Everything runs in your browser, with no account or R installation.</p><a className="button primary" href={`#${notebooks[0].id}`}>Open the first notebook <span aria-hidden="true">↗</span></a></div><section className="course-list"><div className="eyebrow">CORE STATISTICS</div><h2>One idea, one experiment at a time.</h2>{notebooks.filter(n => n.track !== 'practical').map(n => <a className="course-row" key={n.id} href={`#${n.id}`}><span className="course-number">{n.number.toString().padStart(2, '0')}</span><span><h3>{n.title}</h3><p>{n.question}</p><small>{n.estimatedMinutes} minutes · estimate</small></span><span aria-hidden="true">↗</span></a>)}</section><section className="course-list practical-track"><div className="eyebrow">PRACTICAL TRACK</div><h2>Working with data in R</h2><p>Start importing, preparing, and plotting data after R essentials. For group comparisons and regression, first complete the core confidence-interval and hypothesis-test notebooks. Advanced theory is not required.</p>{notebooks.filter(n => n.track === 'practical').map(n => <a className="course-row" key={n.id} href={`#${n.id}`}><span className="course-number">P{n.number - 5}</span><span><h3>{n.title}</h3><p>{n.question}</p><small>{n.estimatedMinutes} minutes · estimate</small></span><span aria-hidden="true">↗</span></a>)}</section><section className="home-about"><h2>A notebook, not a checklist.</h2><p>Explanations, editable R code, and its output stay together. Exercises follow the idea they explore; optional answers stay folded away. Start with R essentials if you have never programmed.</p><p>Your edits are saved on this device. Download an R script or export a backup whenever you like. The first notebook you open downloads the R runtime; later chunks reuse it. An internet connection is required for that initial download.</p></section><section className="roadmap"><div className="eyebrow">FURTHER ALONG</div><h2>The advanced roadmap</h2><p>These topics are upcoming outlines. Their notebooks and exercises are not implemented.</p><ul>{roadmap.map(item => <li key={item.title}><strong><span>UPCOMING</span>{item.title}</strong>{item.outline}</li>)}</ul></section></>;
}
