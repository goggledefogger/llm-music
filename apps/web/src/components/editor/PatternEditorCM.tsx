import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EditorState, StateEffect, StateField } from '@codemirror/state';
import { EditorView, Decoration, DecorationSet, keymap, placeholder } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { useAudio, usePattern } from '../../contexts/AppContext';
import { AUDIO_CONSTANTS } from '@ascii-sequencer/shared';

type StepToken = {
  from: number;
  to: number; // from + 1
  lineIndex: number;
  stepIndex: number; // 0-based within its line's pattern
  isActive: boolean; // x/X
  patternLength: number; // total steps for its line
  symbol: string; // raw character (x, X, ., o, f, r, ...)
};

// Parse the document to find all step characters across all sequence lines.
function indexSteps(doc: EditorState['doc']): StepToken[] {
  const steps: StepToken[] = [];
  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const text = line.text;
    const trimmed = text.trim();
    if (!trimmed.startsWith('seq ')) continue;

    const match = trimmed.match(/seq\s+(\w+):\s*(.+)/);
    if (!match) continue;
    const patternString = match[2];
    if (!patternString) continue;

    // Find the starting column of the pattern string in the original line
    const startCol = text.indexOf(patternString);
    if (startCol < 0) continue;

    const patternLen = patternString.length;
    for (let c = 0; c < patternLen; c++) {
      const ch = patternString[c];
      const from = line.from + startCol + c;
      const to = from + 1;
      steps.push({
        from,
        to,
        lineIndex: i - 1,
        stepIndex: c,
        isActive: ch === 'x' || ch === 'X',
        patternLength: patternLen,
        symbol: ch,
      });
    }
  }
  return steps;
}

// Holds the step index for the global playhead and exposes decorations.
const setCurrentStep = StateEffect.define<number>();

const stepsIndexField = StateField.define<StepToken[]>({
  create(state) {
    return indexSteps(state.doc);
  },
  update(value, tr) {
    if (tr.docChanged) {
      return indexSteps(tr.state.doc);
    }
    return value;
  },
});

const currentStepField = StateField.define<{ step: number; deco: DecorationSet }>({
  create(state) {
    const step = 0;
    const deco = computeCurrentStepDecorations(state, 0);
    return { step, deco };
  },
  update(value, tr) {
    let step = value.step;
    let needsRecompute = tr.docChanged;
    for (const e of tr.effects) {
      if (e.is(setCurrentStep)) {
        step = e.value;
        needsRecompute = true;
      }
    }
    if (needsRecompute) {
      const deco = computeCurrentStepDecorations(tr.state, step);
      return { step, deco };
    }
    return value;
  },
  provide: f => EditorView.decorations.from(f, v => v.deco),
});

function computeCurrentStepDecorations(state: EditorState, currentStep: number): DecorationSet {
  const steps = state.field(stepsIndexField, false) || [];
  if (!steps.length) return Decoration.none;

  // Group steps by line for proper modulo
  const byLine = new Map<number, StepToken[]>();
  for (const s of steps) {
    const arr = byLine.get(s.lineIndex) || [];
    arr.push(s);
    byLine.set(s.lineIndex, arr);
  }

  const marks: any[] = [];
  byLine.forEach(tokens => {
    if (!tokens.length) return;
    const len = tokens[0].patternLength;
    if (len <= 0) return;
    const idx = ((currentStep % len) + len) % len; // safe modulo
    // Find the token with stepIndex == idx
    const token = tokens.find(t => t.stepIndex === idx);
    if (!token) return;

    const classList = 'cm-step-current ' + (token.isActive ? 'cm-step-active' : 'cm-step-rest');
    marks.push(Decoration.mark({ class: classList }).range(token.from, token.to));
  });

  return Decoration.set(marks, true);
}

// Base step coloring (stable, non-animated)
const stepBaseField = StateField.define<DecorationSet>({
  create(state) {
    return computeStepBaseDecorations(state);
  },
  update(value, tr) {
    if (tr.docChanged) {
      return computeStepBaseDecorations(tr.state);
    }
    return value;
  },
  provide: f => EditorView.decorations.from(f),
});

function computeStepBaseDecorations(state: EditorState): DecorationSet {
  const steps: StepToken[] = state.field(stepsIndexField, false) || [];
  if (!steps.length) return Decoration.none;
  const marks: any[] = [];
  for (const t of steps) {
    let cls = '';
    if (t.symbol === 'x' || t.symbol === 'X') cls = 'cm-step-hit';
    else if (t.symbol === '.') cls = 'cm-step-dot';
    else if (t.symbol === 'o') cls = 'cm-step-ghost';
    else if (t.symbol === 'f') cls = 'cm-step-flam';
    else if (t.symbol === 'r') cls = 'cm-step-roll';
    else continue;
    marks.push(Decoration.mark({ class: cls }).range(t.from, t.to));
  }
  return Decoration.set(marks, true);
}

// Simple DSL highlighting (keywords, identifiers, numbers, attributes, comments)
const dslHighlightField = StateField.define<DecorationSet>({
  create(state) {
    return computeDSLDecorations(state);
  },
  update(value, tr) {
    if (tr.docChanged) {
      return computeDSLDecorations(tr.state);
    }
    return value;
  },
  provide: f => EditorView.decorations.from(f),
});

function computeDSLDecorations(state: EditorState): DecorationSet {
  const ranges: any[] = [];
  for (let i = 1; i <= state.doc.lines; i++) {
    const line = state.doc.line(i);
    const text = line.text;
    const trimmed = text.trim();

    // Comments
    if (trimmed.startsWith('#')) {
      ranges.push(Decoration.mark({ class: 'cm-comment' }).range(line.from, line.to));
      continue;
    }

    // TEMPO, SWING, SCALE lines
    const kwMatch = trimmed.match(/^(TEMPO|SWING|SCALE)\b/);
    if (kwMatch) {
      const kw = kwMatch[1];
      const kwIndex = text.indexOf(kw);
      if (kwIndex >= 0) {
        ranges.push(Decoration.mark({ class: 'cm-kw' }).range(line.from + kwIndex, line.from + kwIndex + kw.length));
      }
      // Numbers / percentages
      const numRegex = /-?\d+%?/g;
      let m: RegExpExecArray | null;
      while ((m = numRegex.exec(text))) {
        ranges.push(Decoration.mark({ class: 'cm-number' }).range(line.from + m.index, line.from + m.index + m[0].length));
      }
      continue;
    }

    // sample lines: sample <instrument>: <sampleName> [gain=X]
    const sampleIdx = text.indexOf('sample ');
    if (sampleIdx >= 0) {
      ranges.push(Decoration.mark({ class: 'cm-kw' }).range(line.from + sampleIdx, line.from + sampleIdx + 6)); // 'sample'
      const post = text.slice(sampleIdx + 7);
      const nameMatch = post.match(/^(\w+)/);
      if (nameMatch) {
        const nameStart = sampleIdx + 7 + (nameMatch.index || 0);
        ranges.push(Decoration.mark({ class: 'cm-ident' }).range(line.from + nameStart, line.from + nameStart + nameMatch[0].length));
      }
      const colonIdx = text.indexOf(':', sampleIdx);
      if (colonIdx >= 0) {
        ranges.push(Decoration.mark({ class: 'cm-punc' }).range(line.from + colonIdx, line.from + colonIdx + 1));
      }
      // Sample name (first token after colon)
      if (colonIdx >= 0) {
        const after = text.slice(colonIdx + 1);
        const sm = after.match(/\s*(\w+)/);
        if (sm) {
          const start = colonIdx + 1 + (sm.index || 0);
          ranges.push(Decoration.mark({ class: 'cm-ident' }).range(line.from + start, line.from + start + sm[1].length));
        }
      }
      // attributes like gain=2
      const attrRegex = /(gain)(=)(-?\d+)/g;
      let a: RegExpExecArray | null;
      while ((a = attrRegex.exec(text))) {
        const [full, key] = a;
        const base = a.index;
        ranges.push(Decoration.mark({ class: 'cm-attr' }).range(line.from + base, line.from + base + key.length));
        ranges.push(Decoration.mark({ class: 'cm-punc' }).range(line.from + base + key.length, line.from + base + key.length + 1));
        ranges.push(Decoration.mark({ class: 'cm-number' }).range(line.from + base + key.length + 1, line.from + base + full.length));
      }
      continue;
    }

    // eq lines: eq name: low=0 mid=0 high=0
    const eqIdx = text.indexOf('eq ');
    if (eqIdx >= 0) {
      ranges.push(Decoration.mark({ class: 'cm-kw' }).range(line.from + eqIdx, line.from + eqIdx + 2)); // 'eq'
      const post = text.slice(eqIdx + 3);
      const nameMatch = post.match(/^(\w+)/);
      if (nameMatch) {
        const nameStart = eqIdx + 3 + nameMatch.index!;
        ranges.push(Decoration.mark({ class: 'cm-ident' }).range(line.from + nameStart, line.from + nameStart + nameMatch[0].length));
      }
      // attributes and numbers
      const attrRegex = /(low|mid|high)(=)(-?\d+)/g;
      let a: RegExpExecArray | null;
      while ((a = attrRegex.exec(text))) {
        const [full, key] = a;
        const base = a.index;
        ranges.push(Decoration.mark({ class: 'cm-attr' }).range(line.from + base, line.from + base + key.length));
        ranges.push(Decoration.mark({ class: 'cm-punc' }).range(line.from + base + key.length, line.from + base + key.length + 1));
        ranges.push(Decoration.mark({ class: 'cm-number' }).range(line.from + base + key.length + 1, line.from + base + full.length));
      }
      continue;
    }

    // seq lines: seq name: pattern
    const seqIdx = text.indexOf('seq ');
    if (seqIdx >= 0) {
      ranges.push(Decoration.mark({ class: 'cm-kw' }).range(line.from + seqIdx, line.from + seqIdx + 3)); // 'seq'
      const post = text.slice(seqIdx + 4);
      const nameMatch = post.match(/^(\w+)/);
      if (nameMatch) {
        const nameStart = seqIdx + 4 + (nameMatch.index || 0);
        ranges.push(Decoration.mark({ class: 'cm-ident' }).range(line.from + nameStart, line.from + nameStart + nameMatch[0].length));
      }
      // colon punctuation
      const colonIdx = text.indexOf(':', seqIdx);
      if (colonIdx >= 0) {
        ranges.push(Decoration.mark({ class: 'cm-punc' }).range(line.from + colonIdx, line.from + colonIdx + 1));
      }
      continue;
    }
  }
  return Decoration.set(ranges, true);
}

// Theme: professional code editor feel with DAW-like coloring
const editorTheme = EditorView.theme({
  '&': {
    fontFamily: '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '0.875rem',
    backgroundColor: '#0d0d0f',
    height: '100%',
  },
  '.cm-content': {
    caretColor: '#00e87b',
    padding: '16px',
  },
  '.cm-scroller': {
    lineHeight: '1.65',
    overflow: 'auto',
  },
  '.cm-gutters': {
    backgroundColor: '#0d0d0f',
    borderRight: '1px solid #1c1c21',
    color: '#5c5c6b',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#141417',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(0, 232, 123, 0.12) !important',
  },
  '.cm-cursor': {
    borderLeftColor: '#00e87b',
    borderLeftWidth: '2px',
  },
  // DSL tokens - refined palette
  '.cm-kw': { color: '#60a5fa', fontWeight: '600' },
  '.cm-number': { color: '#c4b5fd' },
  '.cm-attr': { color: '#34d399' },
  '.cm-ident': { color: '#f0abfc' },
  '.cm-punc': { color: '#6b7280' },
  '.cm-comment': { color: '#4b5563', fontStyle: 'italic' },

  // Base steps
  '.cm-step-hit': { color: '#00e87b', fontWeight: '500' },
  '.cm-step-dot': { color: '#3f3f4a' },
  '.cm-step-ghost': { color: '#93c5fd' },
  '.cm-step-flam': { color: '#fca5a5' },
  '.cm-step-roll': { color: '#fde68a' },

  // Current step overlay (playhead)
  '.cm-step-current': {
    color: '#0d0d0f',
    backgroundColor: 'var(--cm-playhead-bg, rgba(251, 191, 36, 0.4))',
    borderRadius: '2px',
    textShadow: 'var(--cm-glow, 0 0 6px rgba(251, 191, 36, 0.55))',
  },
  '.cm-step-active': {},
  '.cm-step-rest': {
    color: '#0d0d0f',
  },
  // Placeholder
  '.cm-placeholder': {
    color: '#5c5c6b',
    fontStyle: 'italic',
  },
});

// Handle clicking on a step to toggle x<->. without disturbing IME.
const clickToToggleSteps = EditorView.domEventHandlers({
  mousedown(event, view) {
    const coords = { x: event.clientX, y: event.clientY };
    const pos = view.posAtCoords(coords);
    if (pos == null) return false;

    const steps = view.state.field(stepsIndexField, false) || [];
    const token = steps.find(s => pos >= s.from && pos < s.to);
    if (!token) return false;

    const doc = view.state.doc;
    const currentChar = doc.sliceString(token.from, token.to);
    let nextChar = currentChar;
    if (currentChar === 'x' || currentChar === 'X') {
      nextChar = '.';
    } else if (currentChar === '.') {
      nextChar = 'x';
    } else {
      return false; // not a toggleable char
    }

    view.dispatch({ changes: { from: token.from, to: token.to, insert: nextChar } });
    return true;
  },
});

interface PatternEditorCMProps {
  className?: string;
}

export const PatternEditorCM: React.FC<PatternEditorCMProps> = ({ className }) => {
  const { content, validation, updateContent } = usePattern();
  const { state: audioState } = useAudio();

  const parentRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const lastExternalContentRef = useRef<string>('');
  const ignoreNextExternalSync = useRef(false);

  const [reduceMotion, setReduceMotion] = useState<boolean>(false);

  const placeholderText = 'Enter your ASCII pattern here...';

  // Create the editor view once
  useEffect(() => {
    if (!parentRef.current) return;
    if (viewRef.current) return;

    const state = EditorState.create({
      doc: content,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        stepsIndexField,
        stepBaseField,
        dslHighlightField,
        currentStepField,
        clickToToggleSteps,
        editorTheme,
        placeholder(placeholderText),
        EditorView.updateListener.of((v) => {
          if (v.docChanged) {
            const newDoc = v.state.doc.toString();
            // Push updates to app state
            ignoreNextExternalSync.current = true;
            updateContent(newDoc);
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent: parentRef.current });
    viewRef.current = view;
    lastExternalContentRef.current = content;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external content changes (e.g., load pattern) into CM, avoid loops
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (ignoreNextExternalSync.current) {
      ignoreNextExternalSync.current = false;
      lastExternalContentRef.current = content;
      return;
    }
    if (content !== currentDoc) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: content },
      });
      lastExternalContentRef.current = content;
    }
  }, [content]);

  // Compute current step from audio state and dispatch into CM decorations
  const currentStep = useMemo(() => {
    if (!validation) return 0;
    // Use 16th-note resolution as in other parts of the app
    const stepsPerSecond = (audioState.tempo / 60) * AUDIO_CONSTANTS.STEPS_PER_BEAT;
    const step = Math.floor(audioState.currentTime * stepsPerSecond);
    return step;
  }, [audioState.currentTime, audioState.tempo, validation]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({ effects: setCurrentStep.of(currentStep) });
  }, [currentStep]);

  return (
    <div className={`h-full flex flex-col ${className || ''}`} style={{
      // Control glow and playhead background via CSS vars
      // When reduceMotion is on, disable glow and use subtler background
      // Note: CM theme reads these vars
      ['--cm-glow' as any]: reduceMotion ? 'none' : '0 0 6px rgba(251, 191, 36, 0.55)',
      ['--cm-playhead-bg' as any]: reduceMotion ? 'rgba(251, 191, 36, 0.25)' : 'rgba(251, 191, 36, 0.35)'
    }}>
      <div className="border-b border-border px-4 py-3 flex items-center justify-between" style={{ background: 'linear-gradient(to bottom, #111114, #0d0d0f)' }}>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Pattern Editor</h2>
          <p className="text-xs text-foreground-muted">
            Click steps to toggle. Playhead highlights update live.
          </p>
        </div>
        <label className="text-xs text-foreground-muted flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={reduceMotion}
            onChange={(e) => setReduceMotion(e.target.checked)}
            className="accent-accent"
          />
          Reduce motion
        </label>
      </div>

      {/* Validation Status */}
      {validation && validation.errors.length > 0 && (
        <div className="border-b border-border p-4 bg-error/10">
          <h3 className="text-sm font-semibold text-error mb-2">Validation Errors:</h3>
          <ul className="text-sm text-error/80 space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {validation && validation.warnings.length > 0 && (
        <div className="border-b border-border p-4 bg-warning/10">
          <h3 className="text-sm font-semibold text-warning mb-2">Warnings:</h3>
          <ul className="text-sm text-warning/80 space-y-1">
            {validation.warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Editor container */}
      <div className="flex-1 min-h-0">
        <div ref={parentRef} className="w-full h-full" />
      </div>
    </div>
  );
};
