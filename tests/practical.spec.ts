import { test, expect } from '@playwright/test';

test('home separates practical lessons and keeps next navigation within each track', async ({page}) => {
  await page.goto('/');
  await expect(page.locator('.practical-track .course-row')).toHaveCount(7);
  await page.goto('/#hypothesis-tests');
  await expect(page.locator('.next-notebook')).toHaveText('Back to the course →');
  await page.goto('/#data-import');
  await expect(page.locator('.next-notebook a')).toHaveAttribute('href', '#data-prepare');
});

test('a local CSV can be read in R, stays off the network and is cleared by restart', async ({page}) => {
  await page.goto('/#data-import');
  await expect(page.getByRole('button', {name:'Run all',exact:false}).first()).toBeEnabled({timeout:90000});
  const requests: string[] = [];
  page.on('request', req => { if (!['GET', 'HEAD'].includes(req.method())) requests.push(req.url()); });
  await page.getByText('Dataset & your own CSV', {exact:true}).click();
  await page.getByLabel('Open your own CSV file', {exact:true}).setInputFiles({name:'my.csv',mimeType:'text/csv',buffer:Buffer.from('value,label\n41,alpha\n42,beta\n')});
  await expect(page.locator('.notice')).toContainText('CSV available');
  const cell = page.locator('[data-chunk-id="import-read"]');
  await cell.locator('.cm-content').fill('mine <- read.csv("data/uploaded.csv")\nsum(mine$value)');
  await cell.getByRole('button', {name:'Run Read the bundled CSV',exact:true}).click();
  await expect(cell.locator('.output')).toContainText('[1] 83');
  await expect(page.locator('.saving')).toHaveText('Saved on this device');
  page.once('dialog', d => d.accept());
  await page.getByRole('button', {name:'Restart R',exact:true}).click();
  await expect(page.getByRole('button', {name:'Run all',exact:false}).first()).toBeEnabled({timeout:90000});
  await cell.locator('.cm-content').fill('file.exists("data/uploaded.csv")\nfile.exists("data/orders.csv")');
  await cell.getByRole('button', {name:'Run Read the bundled CSV',exact:true}).click();
  await expect(cell.locator('.output pre')).toContainText('[1] FALSE');
  await expect(cell.locator('.output pre')).toContainText('[1] TRUE');
  expect(requests).toEqual([]);
});

test('oversize CSV is rejected before entering the worker', async ({page}) => {
  await page.goto('/#data-import');
  await expect(page.getByRole('button', {name:'Run all',exact:false}).first()).toBeEnabled({timeout:90000});
  await page.getByLabel('Open your own CSV file', {exact:true}).setInputFiles({name:'large.csv',mimeType:'text/csv',buffer:Buffer.alloc(2*1024*1024+1,65)});
  await expect(page.locator('.notice')).toContainText('smaller than 2 MiB');
});
