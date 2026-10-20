import { test, expect } from '@playwright/test';

test('ggplot2 loads only on demand from pinned same-origin packages and renders real R graphics', async ({page}) => {
  const packageRequests: string[] = [];
  const external: string[] = [];
  page.on('request', req => {
    if (req.url().includes('/r-packages/')) packageRequests.push(req.url());
    if (!req.url().startsWith('http://127.0.0.1:5182/') && !req.url().startsWith('data:') && !req.url().startsWith('blob:')) external.push(req.url());
  });
  await page.goto('/');
  await page.evaluate(async () => {
    const path = '/src/lib/runtime.ts';
    const {RRuntime} = await import(path);
    window.testRuntime = new RRuntime();
    await window.testRuntime.start();
  });
  expect(packageRequests).toEqual([]);
  const output = await page.evaluate(() => window.testRuntime.run('gg-proof', 'p <- ggplot2::ggplot(data.frame(x=1:3,y=c(2,4,3)), ggplot2::aes(x,y)) + ggplot2::geom_point()\nprint(p)\npackageVersion("ggplot2")', ['ggplot2']));
  expect(output.error, output.console).toBeUndefined();
  expect(output.console).toContain('4.0.3');
  expect(output.images).toHaveLength(1);
  expect(packageRequests.length).toBeGreaterThan(1);
  const previous = packageRequests.length;
  const second = await page.evaluate(() => window.testRuntime.run('gg-proof', 'print(p)', ['ggplot2']));
  expect(second.images).toHaveLength(1);
  expect(packageRequests.length).toBe(previous);
  expect(external).toEqual([]);
  await page.evaluate(() => window.testRuntime.shutdown());
});

test('a damaged package has a readable error and retry succeeds without a restart', async ({page}) => {
  await page.goto('/#data-ggplot');
  const run = page.getByRole('button', {name:'Run all',exact:false}).first();
  await expect(run).toBeEnabled({timeout:90000});
  await page.route('**/r-packages/ggplot2-*.data.bin', route => route.fulfill({body:'damaged',contentType:'application/octet-stream'}));
  await run.click();
  await expect(page.locator('.error-output')).toContainText('integrity check');
  await expect(page.locator('.output')).toHaveCount(1);
  await page.unroute('**/r-packages/ggplot2-*.data.bin');
  await run.click();
  await expect(run).toBeEnabled({timeout:120000});
  await expect(page.locator('.error-output')).toHaveCount(0);
  await expect(page.locator('.output img')).toHaveCount(8);
});

test('Stop cancels an in-flight plotting download and restart can load a clean library', async ({page}) => {
  await page.goto('/#data-ggplot');
  const run = page.getByRole('button', {name:'Run all',exact:false}).first();
  await expect(run).toBeEnabled({timeout:90000});
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/r-packages/ggplot2-*.data.bin', async route => { await gate; await route.abort().catch(() => {}); });
  const request = page.waitForRequest('**/r-packages/ggplot2-*.data.bin');
  await run.click(); await request;
  await expect(page.locator('.runtime-line')).toContainText('Loading ggplot2');
  await page.getByRole('button', {name:'Stop',exact:true}).click();
  release();
  await page.unroute('**/r-packages/ggplot2-*.data.bin');
  await expect(run).toBeEnabled({timeout:90000});
  await run.click();
  await expect(run).toBeEnabled({timeout:120000});
  await expect(page.locator('.error-output')).toHaveCount(0);
  await expect(page.locator('.output img')).toHaveCount(8);
});
