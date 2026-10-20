import { test, expect } from '@playwright/test';
import { notebooks } from '../../src/content';
import { chunksOf } from '../../src/content/schema';

test('static subdirectory deployment loads all runtime resources and every notebook without third-party requests', async ({ page }, testInfo) => {
  const failed: string[] = []; const errors: string[] = []; const external: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', response => { if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`); });
  await page.context().route('**/*', route => {
    const url = route.request().url();
    if (!url.startsWith('http://127.0.0.1:4174/') && !url.startsWith('data:') && !url.startsWith('blob:')) { external.push(url); return route.abort(); }
    return route.continue();
  });
  const timing: { notebook: string, startup: string | null }[] = [];
  for (const n of notebooks) {
    await page.goto(`./#${n.id}`);
    const runAll = page.getByRole('button', { name: 'Run all', exact: false }).first();
    await expect(runAll).toBeEnabled({ timeout: 90_000 });
    timing.push({ notebook: n.id, startup: await page.locator('.timing').textContent() });
    await runAll.click();
    await expect(runAll).toBeEnabled({ timeout: 60_000 });
    await expect(page.locator('.error-output')).toHaveCount(0);
    await expect(page.locator('.output pre').first()).not.toHaveText('');
    await expect(page.locator('.output')).toHaveCount(chunksOf(n).filter(c => c.kind === 'example').length);
    for (const c of chunksOf(n).filter(c => c.plotAlt && c.kind === 'example')) {
      await expect(page.locator(`[data-chunk-id="${c.id}"] img`)).toHaveCount(1);
    }
  }
  expect(failed).toEqual([]); expect(errors).toEqual([]); expect(external).toEqual([]);
  await testInfo.attach('production-startup.json', {body:JSON.stringify(timing,null,2),contentType:'application/json'});
});

test('desktop, narrow, zoom-equivalent and reduced-motion layouts keep notebook order', async ({ page }) => {
  await page.goto('./#confidence-intervals');
  await expect(page.locator('.cm-editor').first()).toBeVisible();
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({width, height:900});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.locator('.main-controls')).toBeVisible();
    await page.screenshot({ path: `docs/screenshots/notebook-${width}.png`, fullPage: false });
  }
  await page.setViewportSize({width:1280,height:900});
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({path:'docs/screenshots/notebook-200-percent.png'});
  await page.evaluate(() => { document.documentElement.style.zoom = ''; });
  const runAll = page.getByRole('button', {name:'Run all',exact:false}).first();
  await expect(runAll).toBeEnabled({timeout:90_000}); await runAll.click(); await expect(runAll).toBeEnabled({timeout:60_000});
  await page.locator('[data-chunk-id="ci-interval-plot"] .output').screenshot({path:'docs/screenshots/interval-output.png'});
  await page.setViewportSize({width:390,height:844});
  await page.locator('[data-chunk-id="ci-one-sample"]').screenshot({path:'docs/screenshots/chunk-narrow.png'});
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  await page.setViewportSize({width:1280,height:900});
  await page.goto('./');
  await page.screenshot({path:'docs/screenshots/home-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'docs/screenshots/home-narrow.png'});
});

test('all notebooks render mathematics and local fonts without mobile overflow', async ({ page }) => {
  for (const n of notebooks) {
    await page.goto(`./#${n.id}`);
    const hasMath = JSON.stringify(n).includes('\\\\(');
    if (hasMath) await expect(page.locator('.katex').first()).toBeVisible();
    await expect(page.locator('.katex-error')).toHaveCount(0);
    if (hasMath) await expect(page.locator('.katex-mathml math').first()).toBeAttached();
    await page.evaluate(() => document.fonts.ready);
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({width,height:900});
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
  await page.setViewportSize({width:1100,height:900});
  await page.goto('./#probability');
  await page.locator('#prob-outcomes').scrollIntoViewIfNeeded();
  await page.screenshot({path:'docs/screenshots/math-probability.png'});
});

test('beginner sampling explanation displays the full R call without conversion artifacts', async ({ page }) => {
  await page.goto('./#r-essentials');
  const call = page.locator('.inline-r').filter({hasText: /^sample\(faces, size = 12, replace = TRUE\)$/});
  await expect(call).toHaveCount(1);
  await call.scrollIntoViewIfNeeded();
  await expect(call).toBeVisible();
  expect(await page.locator('main').innerText()).not.toMatch(/[\uE000-\uF8FF\uFFFD]/u);
  await page.screenshot({path:'docs/screenshots/essentials-sampling-text.png'});
});

test('practical track, downloadable data and regression figures work from the deployed subdirectory', async ({page, request}) => {
  const csv = await request.get('./data/orders.csv');
  expect(csv.status()).toBe(200);
  expect((await csv.text()).split('\n').filter(Boolean)).toHaveLength(123);
  const metadata = await request.get('./data/README.md');
  expect(await metadata.text()).toContain('CC0');
  await page.goto('./#home');
  await expect(page.locator('.practical-track .course-row')).toHaveCount(7);
  await page.locator('.practical-track').scrollIntoViewIfNeeded();
  await page.screenshot({path:'docs/screenshots/practical-home.png'});
  await page.goto('./#data-regression');
  const run = page.getByRole('button', {name:'Run all',exact:false}).first();
  await expect(run).toBeEnabled({timeout:90000});
  await run.click();
  await expect(run).toBeEnabled();
  await expect(page.locator('.error-output')).toHaveCount(0);
  await page.locator('[data-chunk-id="regression-diagnostics"] .output').scrollIntoViewIfNeeded();
  await page.screenshot({path:'docs/screenshots/practical-regression.png'});
  await page.setViewportSize({width:390,height:844});
  await page.goto('./#data-import');
  await page.getByText('Dataset & your own CSV', {exact:true}).click();
  await page.locator('.dataset-note').scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path:'docs/screenshots/practical-mobile.png'});
});

test('ggplot lesson runs from static hosting and its PNG export contains the actual chart', async ({page}) => {
  await page.goto('./#data-ggplot');
  const run = page.getByRole('button', {name:'Run all',exact:false}).first();
  await expect(run).toBeEnabled({timeout:90000});
  await run.click();
  await expect(run).toBeEnabled({timeout:120000});
  await expect(page.locator('.error-output')).toHaveCount(0);
  await expect(page.locator('.output')).toHaveCount(9);
  await expect(page.locator('.notice')).toContainText('9 unfinished');
  const final = page.locator('[data-chunk-id="gg-final"]');
  await expect(final.locator('.output img')).toBeVisible();
  await final.locator('figure').scrollIntoViewIfNeeded();
  await page.screenshot({path:'docs/screenshots/ggplot-desktop.png'});
  const downloadEvent = page.waitForEvent('download');
  await final.getByRole('link', {name:'Download plot PNG'}).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('data-ggplot-gg-final-1.png');
  const {readFile} = await import('node:fs/promises');
  const file = await readFile((await download.path())!);
  expect(file.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(file.length).toBeGreaterThan(1000);
  await page.setViewportSize({width:390,height:844});
  await final.locator('figure').scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path:'docs/screenshots/ggplot-mobile.png'});
});
