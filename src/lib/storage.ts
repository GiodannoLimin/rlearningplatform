import { openDB } from 'idb';
import { z } from 'zod';
import { chunksOf, type Notebook } from '../content/schema';

export type Edits = Record<string, string>;
const backupSchema = z.object({
  format: z.literal('statistics-with-r'), version: z.literal(1),
  exportedAt: z.string().datetime(), edits: z.record(z.string(), z.string().max(100_000)),
}).strict();
export const MAX_BACKUP_BYTES = 5_000_000;
export const MAX_CODE_CHARACTERS = 100_000;
export function validateWorkSize(edits: Edits): void {
  if (Object.values(edits).some(code => code.length > MAX_CODE_CHARACTERS)) throw new Error('A chunk can contain at most 100,000 characters. Your previous code was kept.');
  if (new TextEncoder().encode(serializeBackup(edits)).length > MAX_BACKUP_BYTES) throw new Error('Saved work can contain at most 5 MB. Your previous code was kept. Export and shorten some edits before adding more.');
}
export function parseBackup(text: string, notebooks: Notebook[]): Edits {
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) throw new Error('Backup is too large (maximum 5 MB).');
  const parsed = backupSchema.parse(JSON.parse(text));
  const known = new Set(notebooks.flatMap(n => chunksOf(n).map(c => c.id)));
  for (const id of Object.keys(parsed.edits)) if (!known.has(id)) throw new Error(`Unknown chunk in backup: ${id}`);
  return { ...parsed.edits };
}
export function serializeBackup(edits: Edits) {
  return JSON.stringify({ format: 'statistics-with-r', version: 1, exportedAt: new Date().toISOString(), edits }, null, 2);
}
const db = () => openDB('statistics-with-r', 1, { upgrade(db) { db.createObjectStore('work'); } });
export async function readWork(notebooks: Notebook[]) {
  const connection = await db();
  try {
    const saved: unknown = await connection.get('work', 'edits');
    return saved === undefined ? {} : parseBackup(JSON.stringify(saved), notebooks);
  } finally { connection.close(); }
}
let writes = Promise.resolve();
export function saveWork(edits: Edits) {
  try { validateWorkSize(edits); } catch (error) { return Promise.reject(error); }
  // Each immutable snapshot is written in order. An earlier failure cannot block later saves.
  const snapshot = JSON.parse(serializeBackup(edits));
  writes = writes.catch(() => {}).then(async () => {
    const connection = await db();
    try { await connection.put('work', snapshot, 'edits'); } finally { connection.close(); }
  });
  return writes;
}
export function deleteWork() {
  writes = writes.catch(() => {}).then(async () => {
    const connection = await db();
    try { await connection.delete('work', 'edits'); } finally { connection.close(); }
  });
  return writes;
}
export function notebookScript(notebook: Notebook, edits: Edits) {
  const comments = (text: string) => text.split('\n').map(l => `# ${l}`).join('\n');
  return [comments(`${notebook.number}. ${notebook.title}\n${notebook.question}\n\nExported from Statistics with R. Exercise starters may be unfinished.\nRun chunks in order; this script includes your current edits.`),
    ...notebook.introduction.map(comments),
    ...notebook.sections.flatMap(s => [comments(`\n${s.title}`), ...s.paragraphs.map(comments), ...s.chunks.flatMap(c => [comments(`${c.kind}: ${c.title}\n${c.explanation}`), edits[c.id] ?? c.code])]),
    ...notebook.closing.map(comments), ''].join('\n\n');
}
export function downloadFile(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
