import { memo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/** Explicit author markup only. Never interpret editor contents or R output. */
export function proseTokens(text: string) {
  return text.split(/(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|`[^`]+`)/g).filter(Boolean).map(value => {
    if (value.startsWith('`')) return { kind: 'code' as const, value: value.slice(1, -1) };
    if (value.startsWith('\\(') || value.startsWith('\\[')) return { kind: 'math' as const, value: value.slice(2, -2), display: value.startsWith('\\[') };
    return { kind: 'text' as const, value };
  });
}
export const Prose = memo(function Prose({ text }: { text: string }) {
  return <>{proseTokens(text).map((token, i) => token.kind === 'code' ? <code className="inline-r" key={i}>{token.value}</code> : token.kind === 'math' ?
    <span key={i} className={token.display ? 'lesson-math display-math' : 'lesson-math'} dangerouslySetInnerHTML={{ __html: katex.renderToString(token.value, { displayMode: token.display, output: 'htmlAndMathml', trust: false, throwOnError: false, strict: 'error' }) }} /> : token.value)}</>;
});
