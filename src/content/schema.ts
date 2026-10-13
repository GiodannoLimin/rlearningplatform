import { z } from 'zod';
const stableId = z.string().regex(/^[a-z][a-z0-9-]+$/);
export const chunkSchema = z.object({
  id: stableId, title: z.string().min(1), kind: z.enum(['example', 'exercise']),
  code: z.string().min(1), explanation: z.string().min(1),
  answer: z.string().min(1).optional(), plotAlt: z.string().min(1).optional(),
  checks: z.array(z.string().min(1)).min(1),
}).superRefine((c, ctx) => {
  if (c.kind === 'exercise' && !c.answer) ctx.addIssue({ code: 'custom', message: 'Exercise requires an answer' });
  if (c.kind === 'exercise' && !c.code.includes('# TODO')) ctx.addIssue({ code: 'custom', message: 'Exercise starter must mark unfinished work with # TODO' });
});
export const notebookSchema = z.object({
  id: stableId, number: z.number().int().min(0).max(12), title: z.string().min(1),
  track: z.enum(['core', 'practical']).optional(),
  packages: z.array(z.enum(['ggplot2'])).optional(),
  question: z.string().min(1), estimatedMinutes: z.string().min(1),
  prerequisites: z.array(z.string()), introduction: z.array(z.string()).min(1),
  sections: z.array(z.object({ id: stableId, title: z.string().min(1), paragraphs: z.array(z.string()), chunks: z.array(chunkSchema).min(1) })).min(1),
  closing: z.array(z.string()).min(1),
  references: z.array(z.object({ title: z.string(), url: z.url() })).optional(),
});
export type Chunk = z.infer<typeof chunkSchema>;
export type Notebook = z.infer<typeof notebookSchema>;
export function validateCourse(records: unknown[]): Notebook[] {
  // One-time content migrations must not leave internal sentinels in any field.
  // Inspect code and metadata too, not just the prose's mathematical tokens.
  function checkText(value: unknown): void {
    if (typeof value === 'string' && /[\uE000-\uF8FF\uFFFD]/u.test(value)) {
      throw new Error('Content contains a conversion placeholder or replacement character');
    }
    if (Array.isArray(value)) value.forEach(checkText);
    else if (value && typeof value === 'object') Object.values(value).forEach(checkText);
  }
  checkText(records);
  const notebooks = records.map(r => notebookSchema.parse(r));
  const ids = notebooks.flatMap(n => [n.id, ...n.sections.flatMap(s => [s.id, ...s.chunks.map(c => c.id)])]);
  if (new Set(ids).size !== ids.length) throw new Error('Content IDs must be globally unique');
  if (new Set(notebooks.map(n => n.number)).size !== notebooks.length) throw new Error('Duplicate notebook number');
  return notebooks.sort((a, b) => a.number - b.number);
}
export const chunksOf = (n: Notebook) => n.sections.flatMap(s => s.chunks);
