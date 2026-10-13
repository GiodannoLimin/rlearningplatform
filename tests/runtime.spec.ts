import { expect, test } from '@playwright/test';
import type { RRuntime } from '../src/lib/runtime';

declare global {
  interface Window { testRuntime: RRuntime }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    // Vite resolves this browser import. Keep the real worker; no runtime mocks.
    const path = '/src/lib/runtime.ts';
    const { RRuntime } = await import(path);
    window.testRuntime = new RRuntime();
    await window.testRuntime.start();
  });
});

test.afterEach(async ({ page }) => {
  await page.evaluate(() => window.testRuntime?.shutdown());
});

test('real R preserves chunk state, isolates notebooks, captures plots and readable conditions', async ({ page }, testInfo) => {
  const results = await page.evaluate(async () => {
    const r = window.testRuntime;
    const stableSnapshot = r.getSnapshot() === r.getSnapshot();
    let updates = 0;
    const unsubscribe = r.subscribe(() => { updates++; });
    const first = await r.run('state-one', 'x <- 37\nx');
    const second = await r.run('state-one', 'x + 5');
    const isolated = await r.run('state-two', 'exists("x")');
    const conventions = await r.run('state-one', 'c(TRUE, FALSE, NA)');
    const plot = await r.run('state-one', 'plot(1:3, c(1, 4, 9), xlab = "Input", ylab = "Square")');
    const condition = await r.run('state-one', 'cat("before failure\\n")\nwarning("a warning")\nstop("deliberate failure")\nprint("must not run")');
    const syntax = await r.run('state-one', 'x <- )');
    const recovered = await r.run('state-one', 'x + 1');
    unsubscribe();
    return { first, second, isolated, conventions, plot, condition, syntax, recovered, stableSnapshot, updates, snapshot: r.getSnapshot() };
  });
  expect(results.stableSnapshot).toBe(true);
  expect(results.updates).toBeGreaterThan(0);
  expect(results.first.console).toBe('[1] 37');
  expect(results.second.console).toBe('[1] 42');
  expect(results.second.execution).toBe(results.first.execution + 1);
  expect(results.isolated.console).toBe('[1] FALSE');
  expect(results.conventions.console).toMatch(/TRUE\s+FALSE\s+NA/);
  expect(results.plot.error).toBeUndefined();
  expect(results.plot.images).toHaveLength(1);
  expect(results.plot.images[0]).toMatch(/^data:image\/png;base64,iVBOR/);
  expect(results.condition.error).toBe('deliberate failure');
  expect(results.condition.console).toContain('before failure');
  expect(results.condition.console).toContain('Warning: a warning');
  expect(results.condition.console).not.toContain('must not run');
  expect(results.syntax.error).toMatch(/unexpected/);
  expect(results.recovered.console).toBe('[1] 38');
  expect(results.snapshot.status).toBe('ready');
  console.info('Measured local WebR timings (ms):', JSON.stringify({ startup: results.snapshot.startupMs, firstRun: results.first.elapsedMs, warmSmallRun: results.second.elapsedMs, plot: results.plot.elapsedMs }));
  await testInfo.attach('runtime-timings.json', {
    body: JSON.stringify({ startupMs: results.snapshot.startupMs, firstRunMs: results.first.elapsedMs, laterRunMs: results.second.elapsedMs, plotMs: results.plot.elapsedMs }, null, 2),
    contentType: 'application/json',
  });
});

test('queue is sequential, errors cancel queued work, and Stop recovers an infinite loop', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const r = window.testRuntime;
    const inOrder = await Promise.all([
      r.run('queue', 'x <- 8'), r.run('queue', 'x * 2'),
    ]);
    const failed = r.run('queue', 'stop("stop this queue")');
    const queued = r.run('queue', 'should_not_exist <- 99').then(
      () => 'unexpected success', error => error.name,
    );
    const failure = await failed;
    const queuedError = await queued;
    const untouched = await r.run('queue', 'exists("should_not_exist")');
    const generation = r.getSnapshot().generation;
    const infinite = r.run('queue', 'repeat {}').then(
      () => 'unexpected success', error => error.name,
    );
    const behindInfinite = r.run('queue', 'also_should_not_exist <- 1').then(
      () => 'unexpected success', error => error.name,
    );
    // Allow the real worker to enter the endless R loop before terminating it.
    await new Promise(resolve => setTimeout(resolve, 200));
    await r.stop();
    const canceled = await Promise.all([infinite, behindInfinite]);
    const afterStop = await r.run('queue', 'c(exists("x"), exists("also_should_not_exist"))');
    await r.restart();
    const afterRestart = await r.run('queue', '1 + 1');
    return { inOrder, failure, queuedError, untouched, canceled, afterStop, afterRestart, generation, snapshot: r.getSnapshot() };
  });
  expect(result.inOrder[1].console).toBe('[1] 16');
  expect(result.failure.error).toBe('stop this queue');
  expect(result.queuedError).toBe('RuntimeCancelledError');
  expect(result.untouched.console).toBe('[1] FALSE');
  expect(result.canceled).toEqual(['RuntimeCancelledError', 'RuntimeCancelledError']);
  expect(result.afterStop.console).toBe('[1] FALSE FALSE');
  expect(result.afterStop.execution).toBe(1);
  expect(result.afterRestart.console).toBe('[1] 2');
  expect(result.afterRestart.execution).toBe(1);
  expect(result.snapshot.generation).toBe(result.generation + 2);
});

test('the 30-second watchdog terminates runaway R and automatically recovers', async ({ page }) => {
  test.setTimeout(120_000);
  const result = await page.evaluate(async () => {
    const r = window.testRuntime;
    await r.run('timeout', 'saved_object <- 12');
    const before = r.getSnapshot().generation;
    const timeout = await r.run('timeout', 'repeat {}');
    await r.start();
    const recovered = await r.run('timeout', 'exists("saved_object")');
    return { before, timeout, recovered, snapshot: r.getSnapshot() };
  });
  expect(result.timeout.error).toContain('exceeded 30 seconds');
  expect(result.timeout.elapsedMs).toBeGreaterThanOrEqual(29_000);
  expect(result.timeout.generation).toBe(result.before);
  expect(result.snapshot.generation).toBe(result.before + 1);
  expect(result.recovered.console).toBe('[1] FALSE');
  expect(result.recovered.execution).toBe(1);
});

test('all notebooks pass worked-example, answer and starter checks in separate clean WebR environments', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const verification = await page.evaluate(async () => {
    const contentPath = '/src/content/index.ts';
    const { notebooks } = await import(contentPath);
    const r = window.testRuntime;
    const reports: { notebook: string; mode: string; chunk: string; error?: string; checkError?: string; plots: number; expectedPlot: boolean }[] = [];
    for (const notebook of notebooks) for (const mode of ['examples', 'answers', 'starters']) {
      const environment = `${notebook.id}-${mode}`;
      for (const section of notebook.sections) for (const chunk of section.chunks) {
        if (chunk.kind === 'exercise' && mode === 'examples') continue;
        const code = chunk.kind === 'exercise' && mode === 'answers' ? chunk.answer : chunk.code;
        const result = await r.run(environment, code, notebook.packages);
        const check = mode === 'starters' && chunk.kind === 'exercise'
          ? undefined : await r.run(environment, `stopifnot(${chunk.checks.join(',\n')})`);
        reports.push({ notebook: notebook.id, mode, chunk: chunk.id, error: result.error, checkError: check?.error, plots: result.images.length, expectedPlot: !!chunk.plotAlt && chunk.kind === 'example' });
        if (result.error || check?.error) return reports;
      }
    }
    return reports;
  });
  await testInfo.attach('course-verification.json', { body: JSON.stringify(verification, null, 2), contentType: 'application/json' });
  for (const row of verification) {
    expect(row.error, `${row.notebook}/${row.mode}: ${row.chunk}`).toBeUndefined();
    expect(row.checkError, `${row.notebook}/${row.mode}: ${row.chunk} checks`).toBeUndefined();
    if (row.expectedPlot) expect(row.plots, row.chunk).toBeGreaterThan(0);
  }
  expect(new Set(verification.map(row => row.notebook)).size).toBe(13);
  expect(verification.length).toBeGreaterThan(180);
});
