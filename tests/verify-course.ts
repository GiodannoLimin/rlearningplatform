import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { notebooks } from '../src/content';
import { chunksOf } from '../src/content/schema';
const temp = mkdtempSync(join(tmpdir(), 'statistics-r-verification-'));
const runner = process.env.RSCRIPT ?? 'Rscript';
const reports: {notebook:string, mode:string, chunks:number, checks:number}[] = [];
try {
  for (const notebook of notebooks) for (const mode of ['examples', 'answers', 'starters'] as const) {
    const chunks = chunksOf(notebook).filter(c => mode !== 'examples' || c.kind === 'example');
    let checks = 0;
    const source = [
      'options(warn = 2)',
      `setwd(${JSON.stringify(resolve('public'))})`,
      `pdf(${JSON.stringify(join(temp, 'plots.pdf'))})`,
      ...chunks.flatMap(c => {
        const verify = c.kind === 'example' || mode === 'answers';
        if (verify) checks += c.checks.length;
        return [`cat(${JSON.stringify(`\nCHUNK ${c.id}\n`)})`, c.kind === 'exercise' && mode === 'answers' ? c.answer! : c.code, ...(verify ? [`stopifnot(${c.checks.join(',\n')})`] : [])];
      }), 'dev.off()',
    ].join('\n\n');
    const path = join(temp, `${notebook.id}-${mode}.R`); writeFileSync(path, source);
    const run = spawnSync(runner, ['--vanilla', path], {encoding:'utf8', timeout:60_000});
    if (run.status !== 0) throw new Error(`${notebook.id} / ${mode}: ${run.error ?? ''}\n${run.stdout}\n${run.stderr}`);
    reports.push({ notebook: notebook.id, mode, chunks: chunks.length, checks });
  }
  console.table(reports);
  console.log('Native R checks passed. Real WebR browser verification is a separate test suite.');
} finally { rmSync(temp, {recursive:true, force:true}); }
