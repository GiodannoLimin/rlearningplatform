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
