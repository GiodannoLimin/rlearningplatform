import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const lock = JSON.parse(await readFile(new URL('../r-packages.lock.json', import.meta.url), 'utf8'));
const images = JSON.parse(await readFile(new URL('../r-package-images.lock.json', import.meta.url), 'utf8'));
const verify = async (path, expected) => {
  const bytes = await readFile(new URL(`../${path}`, import.meta.url));
  if (createHash('sha256').update(bytes).digest('hex') !== expected) throw new Error(`Package checksum mismatch: ${path}`);
};
for (const pkg of lock.packages) await verify(`vendor/r-packages/${pkg.file}`, pkg.sha256);
for (const image of images.images) {
  await verify(`public/r-packages/${image.data}`, image.sha256);
  await verify(`public/r-packages/${image.metadata}`, image.metadataSha256);
}
console.log('Verified pinned ggplot2 package archives and browser images.');
