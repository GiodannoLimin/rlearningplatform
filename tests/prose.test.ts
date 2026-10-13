import { describe, it, expect } from 'vitest';
import katex from 'katex';
import { notebooks } from '../src/content';
import { validateCourse } from '../src/content/schema';
import { proseTokens } from '../src/components/Prose';

describe('course mathematical typography', () => {
  it('typesets every authored formula with accessible MathML', () => {
    let count = 0;
    for (const n of notebooks) {
      const prose = [...n.prerequisites, ...n.introduction, ...n.closing, ...n.sections.flatMap(s => [...s.paragraphs, ...s.chunks.map(c => c.explanation)])];
      for (const text of prose) for (const token of proseTokens(text)) {
        if (token.kind === 'math') {
          count++;
          expect(token.value.trim()).not.toBe('');
          expect(katex.renderToString(token.value, { throwOnError: true, strict: 'error', trust: false, output: 'htmlAndMathml' })).toContain('<math');
        } else if (token.kind === 'text') expect(token.value).not.toMatch(/\\[()[\]]|[μσλδβ]|[₀₁ₙ]/);
      }
    }
    expect(count).toBeGreaterThan(100);
  });
  it('rejects conversion placeholders anywhere in course content, including inline code', () => {
    const damaged = structuredClone(notebooks[0]);
    damaged.sections[0].paragraphs[0] = 'Example: `sample(faces, size = 12, \uE00010\uE001)`';
    expect(() => validateCourse([damaged])).toThrow(/conversion placeholder/);
    expect(JSON.stringify(notebooks)).not.toMatch(/[\uE000-\uF8FF\uFFFD]/u);
  });
  it('preserves the complete sampling call in the beginner explanation', () => {
    const texts = notebooks[0].sections.flatMap(s => s.paragraphs);
    const tokens = texts.flatMap(proseTokens);
    expect(tokens).toContainEqual({ kind: 'code', value: 'sample(faces, size = 12, replace = TRUE)' });
  });
  it('keeps currency and R code separate from mathematics', () => {
    expect(proseTokens('$1.50 and `x <- 2` then \\(P(A)\\)')).toEqual([
      {kind:'text',value:'$1.50 and '}, {kind:'code',value:'x <- 2'}, {kind:'text',value:' then '}, {kind:'math',value:'P(A)',display:false},
    ]);
  });
});
