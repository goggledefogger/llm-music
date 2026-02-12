import React, { useCallback } from 'react';
import { BaseVisualization } from '../BaseVisualization';
import { usePattern } from '../../../contexts/AppContext';

interface SampleLibraryProps {
  className?: string;
}

const BUILT_IN_SAMPLES = [
  { id: 'kick', label: 'Kick' },
  { id: 'snare', label: 'Snare' },
  { id: 'hihat', label: 'Hi‑Hat' },
  { id: 'clap', label: 'Clap' },
] as const;

export const SampleLibrary: React.FC<SampleLibraryProps> = ({ className = '' }) => {
  const { content, updateContent } = usePattern();

  const upsertSampleLine = useCallback((instrument: string, sample: string, gainSteps?: number) => {
    const lines = content.split('\n');
    const targetPrefix = `sample ${instrument}:`;
    const newline = `sample ${instrument}: ${sample}${typeof gainSteps === 'number' ? ` gain=${gainSteps}` : ''}`;

    // Replace if exists
    const idx = lines.findIndex(l => l.trim().toLowerCase().startsWith(targetPrefix));
    if (idx >= 0) {
      lines[idx] = newline;
      updateContent(lines.join('\n'));
      return;
    }

    // Insert after TEMPO line when present, otherwise at top
    const tempoIdx = lines.findIndex(l => /^\s*TEMPO\s+\d+/.test(l));
    if (tempoIdx >= 0) {
      // If next line is blank, insert after it to keep spacing
      const insertAt = (lines[tempoIdx + 1] || '').trim() === '' ? tempoIdx + 2 : tempoIdx + 1;
      lines.splice(insertAt, 0, newline);
    } else {
      lines.unshift(newline);
    }
    updateContent(lines.join('\n'));
  }, [content, updateContent]);

  const insertDemo = useCallback(() => {
    let lines = content.split('\n');
    const demo = [
      'sample kick: kick',
      'sample snare: snare gain=1',
      'sample hat: hihat',
    ];
    // Insert after TEMPO block
    const tempoIdx = lines.findIndex(l => /^\s*TEMPO\s+\d+/.test(l));
    const insertAt = tempoIdx >= 0 ? ((lines[tempoIdx + 1] || '').trim() === '' ? tempoIdx + 2 : tempoIdx + 1) : 0;
    lines.splice(insertAt, 0, '# Samples', ...demo, '');
    // Deduplicate any existing sample lines for same instruments
    const seen = new Set<string>();
    lines = lines.filter((l) => {
      const m = l.trim().match(/^sample\s+(\w+):/i);
      if (!m) return true;
      const key = m[1].toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    updateContent(lines.join('\n'));
  }, [content, updateContent]);

  return (
    <BaseVisualization
      className={className}
      description="Built‑in samples you can map and trigger with seq"
      variant="ultra-compact"
    >
      <div className="space-y-3">
        <div className="text-sm text-foreground-muted">
          Click “Insert” to add a mapping line to your pattern.
        </div>
        <div className="grid grid-cols-2 gap-2">
          {BUILT_IN_SAMPLES.map(s => (
            <div key={s.id} className="border border-border rounded p-2 bg-background flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{s.label}</div>
                <div className="text-xs text-foreground-muted font-mono truncate">sample {s.id}: {s.id}</div>
              </div>
              <button
                className="btn btn-primary btn-sm text-xs flex-shrink-0 whitespace-nowrap"
                onClick={() => upsertSampleLine(s.id, s.id)}
              >
                Insert
              </button>
            </div>
          ))}
        </div>
        <div className="pt-1">
          <button
            className="btn btn-secondary btn-sm text-xs"
            onClick={insertDemo}
          >
            Insert Demo Mapping
          </button>
        </div>
      </div>
    </BaseVisualization>
  );
};

