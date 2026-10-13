import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
const require = createRequire(import.meta.url);
const source = dirname(require.resolve('webr'));
const destination = resolve('public/webr/v0.6.0');
const packageInfo = JSON.parse(await readFile(resolve(source, '../package.json'), 'utf8'));
if (packageInfo.version !== '0.6.0') throw new Error('The copied WebR runtime must match the pinned version 0.6.0.');
await mkdir(destination, { recursive: true });
for (const file of ['R.js', 'R.wasm', 'libRblas.so', 'libRlapack.so', 'webr-worker.js', 'webr.mjs', 'webr.js', 'vfs']) {
  await cp(resolve(source, file), resolve(destination, file), { recursive: true });
}
await writeFile(resolve(destination, 'NOTICE.txt'), 'WebR 0.6.0 / R 4.6.0. Unmodified runtime from the pinned npm webr package.\nSource and license notices: https://github.com/r-wasm/webr/tree/v0.6.0\nR source and license: https://www.r-project.org/\n');
console.log('Prepared the pinned WebR 0.6.0 runtime for static hosting.');
