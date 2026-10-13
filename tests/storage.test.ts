import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { notebooks } from '../src/content';
import { chunksOf, validateCourse } from '../src/content/schema';
import { deleteWork, notebookScript, parseBackup, readWork, saveWork, serializeBackup } from '../src/lib/storage';
const chunk = chunksOf(notebooks[0])[0];
describe('local work and portable backups', () => {
  it('round trips exact R code including Unicode and newlines', () => {
    const edits = { [chunk.id]: '# μ\nx <- c(1, NA)\nprint(x)' };
    expect(parseBackup(serializeBackup(edits), notebooks)).toEqual(edits);
  });
  it('rejects unknown IDs, versions, oversized cells and invalid structures', () => {
    expect(() => parseBackup(serializeBackup({ unknown: 'x' }), notebooks)).toThrow();
    expect(() => parseBackup(serializeBackup({}).replace('"version": 1', '"version": 2'), notebooks)).toThrow();
    expect(() => parseBackup(serializeBackup({ [chunk.id]: 'x'.repeat(100_001) }), notebooks)).toThrow();
    expect(() => parseBackup('{"edits":null}', notebooks)).toThrow();
    expect(() => parseBackup('{bad}', notebooks)).toThrow();
  });
  it('persists writes in order and supports confirmed-operation deletion', async () => {
    await Promise.all([saveWork({ [chunk.id]: 'first' }), saveWork({ [chunk.id]: 'last' })]);
    expect(await readWork(notebooks)).toEqual({ [chunk.id]: 'last' });
    await deleteWork(); expect(await readWork(notebooks)).toEqual({});
  });
  it('exports explanations as R comments and uses the current edits', () => {
    const script = notebookScript(notebooks[0], { [chunk.id]: 'custom <- 123' });
    expect(script).toContain(`# ${notebooks[0].question}`);
    expect(script).toContain('custom <- 123');
    expect(script).not.toContain(chunk.code);
  });
});
describe('course integrity', () => {
  it('validates stable IDs and rejects duplicate records', () => {
    expect(validateCourse(notebooks)).toHaveLength(notebooks.length);
    expect(() => validateCourse([notebooks[0], notebooks[0]])).toThrow();
  });
  it('provides unfinished exercises, answers and verifiable expectations', () => {
    for (const notebook of notebooks) for (const c of chunksOf(notebook)) {
      expect(c.checks.length).toBeGreaterThan(0);
      if (c.kind === 'exercise') { expect(c.code).toContain('# TODO'); expect(c.answer).toBeTruthy(); expect(c.code).not.toBe(c.answer); }
      if (/\b(plot|hist|barplot|boxplot)\s*\(/.test(c.code)) expect(c.plotAlt).toBeTruthy();
    }
  });
});
