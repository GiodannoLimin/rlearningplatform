import { test, expect, type Page } from '@playwright/test';
async function openConfidence(page: Page) {
  await page.goto('/#confidence-intervals');
  await expect(page.getByRole('button', { name: 'Run all', exact: false }).first()).toBeEnabled({ timeout: 100_000 });
}
async function replaceCode(page: Page, id: string, text: string) {
  const editor = page.locator(`[data-chunk-id="${id}"] .cm-content`);
  await editor.fill(text); return editor;
}
test('confidence vertical slice runs real examples, plots, keyboard, saving and backups', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await openConfidence(page);
  const first = page.locator('[data-chunk-id="ci-settings"]');
  const editor = first.locator('.cm-content');
  await editor.click(); await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Enter' : 'Control+Enter');
  await expect(first.locator('.output')).toContainText('3.919');
  await expect(first.locator('.execution')).toContainText('1');
  await page.getByRole('button', { name: 'Run all', exact: false }).first().click();
  await expect(page.getByRole('button', { name: 'Run all', exact: false }).first()).toBeEnabled({ timeout: 100_000 });
  await expect(page.locator('.output img')).toHaveCount(1);
  await expect(page.locator('.error-output')).toHaveCount(0);
  await expect(page.locator('.notice')).toContainText('skipped 6 unfinished');
  const code = 'saved_number <- 123\nsaved_number';
  await replaceCode(page, 'ci-confidence-cutoff', code);
  await expect(page.locator('.saving')).toHaveText('Saved on this device');
  await page.locator('[data-chunk-id="ci-confidence-cutoff"] summary').click();
  await expect(page.locator('[data-chunk-id="ci-confidence-cutoff"] .cm-content')).toHaveText(code, { useInnerText: true });
  await page.getByText('Save & download', { exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export all saved work' }).click();
  const savedPath = await (await download).path();
  await page.reload(); await expect(page.locator('[data-chunk-id="ci-confidence-cutoff"] .cm-content')).toHaveText(code, { useInnerText: true });
  await expect(page.locator('.output')).toHaveCount(0);
  await replaceCode(page, 'ci-confidence-cutoff', 'changed <- 456');
  await page.getByText('Save & download', { exact: true }).click();
  page.once('dialog', d => d.accept());
  await page.getByLabel('Import saved work file', { exact: true }).setInputFiles(savedPath!);
  await expect(page.locator('[data-chunk-id="ci-confidence-cutoff"] .cm-content')).toHaveText(code, { useInnerText: true });
  await expect(page.locator('.notice')).toContainText('Backup imported', { timeout: 100_000 });
  page.once('dialog', d => d.dismiss());
  await page.locator('[data-chunk-id="ci-confidence-cutoff"]').getByRole('button', { name: 'Reset' }).click();
  await expect(page.locator('[data-chunk-id="ci-confidence-cutoff"] .cm-content')).toHaveText(code, { useInnerText: true });
  page.once('dialog', d => d.accept());
  await page.locator('[data-chunk-id="ci-confidence-cutoff"]').getByRole('button', { name: 'Reset' }).click();
  await expect(page.locator('[data-chunk-id="ci-confidence-cutoff"] .cm-content')).toContainText('# TODO');
  expect(errors).toEqual([]);
});
test('errors stop Run all; staleness, Tab exit and restart are visible', async ({ page }) => {
  await openConfidence(page);
  const editor = await replaceCode(page, 'ci-settings', 'stop("intentional test error")');
  await page.getByRole('button', { name: 'Run all', exact: false }).first().click();
  await expect(page.locator('.error-output')).toContainText('intentional test error');
  await expect(page.locator('[data-chunk-id="ci-one-sample"] .output')).toHaveCount(0);
  await editor.fill('x <- 3\nx');
  await expect(page.locator('[data-chunk-id="ci-settings"] .stale')).toContainText('Code changed');
  await editor.click(); await page.keyboard.press('Tab');
  await expect(editor).not.toBeFocused();
  page.once('dialog', d => d.accept());
  await page.getByRole('button', { name: 'Restart R', exact: true }).click();
  await expect(page.locator('[data-chunk-id="ci-settings"] .stale')).toContainText('Earlier R session');
  await expect(page.locator('.runtime-line')).toContainText('ready', { timeout: 100_000 });
});

test('Ctrl+Enter on Windows runs only the focused chunk; edited output stays associated and downstream goes stale', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'platform', { get: () => 'Win32' }));
  await openConfidence(page);
  const firstEditor = await replaceCode(page, 'ci-settings', 'x <- 10\nx');
  await firstEditor.press('Control+Enter');
  await expect(page.locator('[data-chunk-id="ci-settings"] .output')).toContainText('[1] 10');
  const secondEditor = await replaceCode(page, 'ci-one-sample', 'x + 7');
  await secondEditor.press('Control+Enter');
  await expect(page.locator('[data-chunk-id="ci-one-sample"] .output')).toContainText('[1] 17');
  await expect(page.locator('[data-chunk-id="ci-settings"] .output')).toContainText('[1] 10');
  await firstEditor.fill('x <- 30\nx');
  await expect(page.locator('[data-chunk-id="ci-one-sample"] .stale')).toContainText('Code changed');
  await firstEditor.press('Control+Enter');
  await expect(page.locator('[data-chunk-id="ci-one-sample"] .stale')).toContainText('earlier chunk ran again');
  await expect(page.locator('[data-chunk-id="ci-settings"] .output')).toContainText('[1] 30');
  await expect(page.locator('[data-chunk-id="ci-confidence-cutoff"] .output')).toHaveCount(0);
});

test('Stop cancels an infinite chunk and Restart & run all restores clean worked examples', async ({ page }) => {
  await openConfidence(page);
  await replaceCode(page, 'ci-settings', 'x <- 777\nrepeat {}');
  await page.locator('[data-chunk-id="ci-settings"]').getByRole('button', {name:'Run A 95% interval recipe',exact:true}).click();
  await expect(page.locator('.output-status')).toContainText('Running');
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  await expect(page.locator('.notice')).toContainText('R restarted', { timeout:90_000 });
  const e = await replaceCode(page, 'ci-settings', 'exists("x")');
  await e.press(process.platform === 'darwin' ? 'Meta+Enter' : 'Control+Enter');
  await expect(page.locator('[data-chunk-id="ci-settings"] .output')).toContainText('FALSE');
  page.once('dialog', d => d.accept());
  await page.locator('[data-chunk-id="ci-settings"]').getByRole('button',{name:'Reset',exact:true}).click();
  page.once('dialog', d => d.accept());
  await page.getByRole('button',{name:'Restart & run all',exact:true}).click();
  await expect(page.locator('.notice')).toContainText('skipped 6 unfinished', {timeout:90_000});
  await expect(page.locator('.error-output')).toHaveCount(0);
  await expect(page.locator('[data-chunk-id="ci-settings"] .execution')).toContainText('1');
  await expect(page.locator('.output img')).toHaveCount(1);
});

test('invalid imports preserve edits; deleting work requires confirmation', async ({ page }) => {
  await openConfidence(page);
  await replaceCode(page, 'ci-settings', 'keep_me <- 88');
  await page.getByText('Save & download',{exact:true}).click();
  await page.getByLabel('Import saved work file', { exact: true }).setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{"format":"wrong"}')});
  await expect(page.locator('.notice')).toContainText('Import failed');
  await expect(page.locator('[data-chunk-id="ci-settings"] .cm-content')).toHaveText('keep_me <- 88');
  page.once('dialog', d => d.dismiss());
  await page.getByRole('button',{name:'Delete saved work',exact:true}).click();
  await expect(page.locator('[data-chunk-id="ci-settings"] .cm-content')).toHaveText('keep_me <- 88');
  page.once('dialog', d => d.accept());
  await page.getByRole('button',{name:'Delete saved work',exact:true}).click();
  await expect(page.locator('.notice')).toContainText('Saved edits deleted', {timeout:90_000});
  await page.reload();
  await expect(page.locator('[data-chunk-id="ci-settings"] .cm-content')).toContainText('mu <- 50');
});

test('R startup failure is explained and retry recovers', async ({ page }) => {
  await page.route('**/webr/v0.6.0/webr-worker.js', route => route.abort());
  await page.goto('/#confidence-intervals');
  // Worker loading errors may take the bounded startup timeout to be reported.
  await expect(page.locator('.runtime-line')).toContainText('Could not start R', {timeout:100_000});
  await page.unroute('**/webr/v0.6.0/webr-worker.js');
  await page.getByRole('button',{name:'Retry loading R',exact:true}).click();
  await expect(page.locator('.runtime-line')).toContainText('R is ready', {timeout:90_000});
});
