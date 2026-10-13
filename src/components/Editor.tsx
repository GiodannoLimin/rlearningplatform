import { useEffect, useRef } from 'react';
import { Annotation, Compartment, EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { StreamLanguage, syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';
import { r } from '@codemirror/legacy-modes/mode/r';

const externalChange = Annotation.define<boolean>();

export function Editor({ value, label, onChange, onRun, canChange, locked = false }: { value: string; label: string; locked?: boolean; canChange: (s: string) => boolean; onChange: (s: string) => void; onRun: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const editor = useRef<EditorView | null>(null);
  const editability = useRef(new Compartment());
  const callbacks = useRef({ onChange, onRun, canChange });
  callbacks.current = { onChange, onRun, canChange };
  useEffect(() => {
    if (!host.current) return;
    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({ doc: value, extensions: [
        lineNumbers(), history(), bracketMatching(), highlightActiveLine(),
        editability.current.of([EditorState.readOnly.of(locked), EditorView.editable.of(!locked)]),
        EditorState.transactionFilter.of(transaction => !transaction.annotation(externalChange) && transaction.docChanged && !callbacks.current.canChange(transaction.newDoc.toString()) ? [] : transaction),
        StreamLanguage.define(r), syntaxHighlighting(defaultHighlightStyle),
        keymap.of([{ key: 'Mod-Enter', run: () => { callbacks.current.onRun(); return true; }, preventDefault: true }, ...defaultKeymap, ...historyKeymap]),
        EditorView.contentAttributes.of({ 'aria-label': label, 'aria-describedby': 'editor-help', 'spellcheck': 'false' }),
        EditorView.updateListener.of(update => { if (update.docChanged) callbacks.current.onChange(update.state.doc.toString()); }),
        EditorView.theme({ '&': { fontSize: '14px' }, '.cm-content': { padding: '15px 0', fontFamily: 'var(--mono)' }, '.cm-line': { padding: '0 16px 0 10px' }, '.cm-gutters': { background: '#f0f2ed', color: '#65706b', border: 'none', paddingLeft: '5px' }, '.cm-activeLine': { background: '#e8eeea70' }, '&.cm-focused': { outline: '2px solid #17645d', outlineOffset: '-2px' }, '.cm-scroller': { overflow: 'auto', fontFamily: 'var(--mono)' } }),
      ] }),
    });
    editor.current = view;
    return () => { editor.current = null; view.destroy(); };
    // The editor owns selection/history; prop edits are synchronized below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);
  useEffect(() => {
    const view = editor.current;
    if (view && view.state.doc.toString() !== value) view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value }, annotations: externalChange.of(true) });
  }, [value]);
  useEffect(() => { editor.current?.dispatch({ effects: editability.current.reconfigure([EditorState.readOnly.of(locked), EditorView.editable.of(!locked)]) }); }, [locked]);
  return <div className="code-editor" ref={host} />;
}
