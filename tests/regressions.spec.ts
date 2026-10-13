import { expect, test, type Locator, type Page } from '@playwright/test';

async function openNotebook(page: Page) {
  await page.goto('/#confidence-intervals');
  await expect(page.getByRole('button', { name: 'Run all', exact: false }).first()).toBeEnabled({ timeout: 100_000 });
}

function chunk(page: Page, id: string) {
  return page.locator(`[data-chunk-id="${id}"]`);
}

async function run(cell: Locator) {
  const button = cell.getByRole('button', { name: /^Run / });
  await button.click();
  await expect(button).toBeEnabled({ timeout: 90_000 });
}

test('an oversized paste is rejected before changing or saving any learner work', async ({ page }) => {
  await openNotebook(page);
  const first = chunk(page, 'ci-settings').locator('.cm-content');
  const exercise = chunk(page, 'ci-confidence-cutoff').locator('.cm-content');
  const original = 'kept_value <- 10\nkept_value';
  const otherSaved = 'another_saved_value <- 42';
  await first.fill(original);
  await exercise.fill(otherSaved);
  await expect(page.locator('.saving')).toHaveText('Saved on this device');

  await first.fill('#' + 'x'.repeat(100_000));
  await expect(first).toHaveText(original, { useInnerText: true });
  await expect(page.locator('.notice')).toContainText(/limit|large|100[,.]?000|maximum/i);
  await expect(exercise).toHaveText(otherSaved);

  await page.reload();
  await expect(chunk(page, 'ci-settings').locator('.cm-content')).toHaveText(original, { useInnerText: true });
  await expect(chunk(page, 'ci-confidence-cutoff').locator('.cm-content')).toHaveText(otherSaved);
  await expect(page.locator('.saving')).toHaveText('Saved on this device');
});

test('rerunning a downstream cell keeps its warning until its edited dependency is rerun', async ({ page }) => {
  await openNotebook(page);
  const first = chunk(page, 'ci-settings');
  const second = chunk(page, 'ci-one-sample');
  await first.locator('.cm-content').fill('x <- 10\nx');
  await run(first);
  await second.locator('.cm-content').fill('x + 7');
  await run(second);
  await expect(second.locator('.output pre')).toHaveText('[1] 17');

  await first.locator('.cm-content').fill('x <- 30\nx');
  await expect(second.locator('.stale')).toHaveCount(1);
  await run(second);
  await expect(second.locator('.output pre')).toHaveText('[1] 17');
  await expect(second.locator('.stale')).toHaveCount(1);

  await run(first);
  await run(second);
  await expect(second.locator('.output pre')).toHaveText('[1] 37');
  await expect(second.locator('.stale')).toHaveCount(0);
});

test('an upstream edit made while a later chunk runs cannot produce a fresh-looking result', async ({ page }) => {
  await openNotebook(page);
  const first = chunk(page, 'ci-settings');
  const second = chunk(page, 'ci-one-sample');
  await first.locator('.cm-content').fill('x <- 10\nx');
  await run(first);
  await second.locator('.cm-content').fill('Sys.sleep(0.3)\nx + 7');
  const button = second.getByRole('button', { name: /^Run / });
  await button.click();
  await expect(second.locator('.output-status')).toBeVisible();
  await first.locator('.cm-content').fill('x <- 30\nx');
  await expect(button).toBeEnabled({ timeout: 90_000 });
  await expect(second.locator('.output pre')).toHaveText('[1] 17');
  await expect(second.locator('.stale')).toHaveCount(1);
});

test('deleting saved work locks editors until deletion and restart finish', async ({ page }) => {
  await openNotebook(page);
  const first = chunk(page, 'ci-settings').locator('.cm-content');
  const original = 'value_before_deletion <- 42';
  await first.fill(original);
  await expect(page.locator('.saving')).toHaveText('Saved on this device');

  // Hold an actual IndexedDB transaction to make the asynchronous deletion
  // window deterministic. No application function or persistence API is mocked.
  await page.evaluate(async () => {
    const request = indexedDB.open('statistics-with-r', 1);
    const connection = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const testWindow = window as Window & { releaseReviewLock?: boolean };
    testWindow.releaseReviewLock = false;
    const transaction = connection.transaction('work', 'readwrite');
    const keepAlive = () => {
      if (testWindow.releaseReviewLock) return;
      transaction.objectStore('work').get('edits').onsuccess = keepAlive;
    };
    keepAlive();
    transaction.oncomplete = () => connection.close();
  });
  try {
    await page.getByText('Save & download', { exact: true }).click();
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Delete saved work', exact: true }).click();
    await expect(first).toHaveAttribute('contenteditable', 'false');
    await expect(page.getByRole('button', { name: 'Run all', exact: false }).first()).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Stop', exact: true })).toBeDisabled();
    await first.click();
    await page.keyboard.type('typed_during_delete <- 99');
    await expect(first).toHaveText(original);
  } finally {
    await page.evaluate(() => { (window as Window & { releaseReviewLock?: boolean }).releaseReviewLock = true; });
  }
  await expect(page.locator('.notice')).toContainText('Saved edits deleted', { timeout: 90_000 });
  await expect(first).toContainText('mu <- 50');
  await expect(first).toHaveAttribute('contenteditable', 'true');
  await page.reload();
  await expect(chunk(page, 'ci-settings').locator('.cm-content')).toContainText('mu <- 50');
  await expect(chunk(page, 'ci-settings').locator('.cm-content')).not.toContainText('typed_during_delete');
});
