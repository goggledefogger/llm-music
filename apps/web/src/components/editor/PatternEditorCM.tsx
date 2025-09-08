import React, { useEffect, useMemo, useRef } from 'react';
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

// Theme: keep layout stable; only use color/glow.
const editorTheme = EditorView.theme({
  '&': {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: '0.875rem',
    backgroundColor: 'transparent',
    height: '100%',
  },
  '.cm-content': {
    caretColor: 'var(--cm-caret, #22c55e)',
  },
  '.cm-scroller': {
    lineHeight: '1.5',
    overflow: 'auto',
  },
  '.cm-step-current': {
    color: '#fbbf24', // yellow-400
    textShadow: '0 0 6px rgba(251, 191, 36, 0.55)'
  },
  '.cm-step-active': {
    // keep as is; class is used for targeting
  },
  '.cm-step-rest': {
    color: '#9ca3af', // gray-400
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
    <div className={`h-full flex flex-col ${className || ''}`}>
      <div className="border-b border-border p-4">
        <h2 className="text-lg font-semibold">ASCII Pattern Editor</h2>
        <p className="text-sm text-foreground-muted">
          Live playhead highlights update inline without breaking editing.
        </p>
      </div>

      {/* Validation Status */}
      {validation && validation.errors.length > 0 && (
        <div className="border-b border-border p-4 bg-red-50">
          <h3 className="text-sm font-semibold text-red-700 mb-2">Validation Errors:</h3>
          <ul className="text-sm text-red-600 space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {validation && validation.warnings.length > 0 && (
        <div className="border-b border-border p-4 bg-yellow-50">
          <h3 className="text-sm font-semibold text-yellow-700 mb-2">Warnings:</h3>
          <ul className="text-sm text-yellow-600 space-y-1">
            {validation.warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Editor container with border/padding for consistent layout */}
      <div className="flex-1 p-4">
        <div className={`w-full h-full border rounded ${validation?.isValid ? 'border-green-300' : 'border-red-300'}`}>
          <div ref={parentRef} className="w-full h-full p-4" />
        </div>
      </div>
    </div>
  );
};
