import React from 'react';
import { ParsedPattern } from '../../../types/app';
import { BaseVisualization } from '../BaseVisualization';
import { EQDisplay } from './EQDisplay';

interface AudioEffectsProps {
  pattern: ParsedPattern | null;
  className?: string;
}

export const AudioEffects: React.FC<AudioEffectsProps> = ({
  pattern,
  className = ''
}) => {
  if (!pattern) {
    return (
      <div className={`p-4 text-center text-foreground-muted ${className}`}>
        <p>No pattern loaded</p>
        <p className="text-sm">Load a pattern to see audio effects</p>
      </div>
    );
  }

  const hasEQ = pattern.eqModules && Object.keys(pattern.eqModules).length > 0;
  const hasFilters = pattern.filterModules && Object.keys(pattern.filterModules).length > 0;
  const hasLFOs = pattern.lfoModules && Object.keys(pattern.lfoModules).length > 0;
  const hasDelay = pattern.delayModules && Object.keys(pattern.delayModules).length > 0;
  const hasReverb = pattern.reverbModules && Object.keys(pattern.reverbModules).length > 0;
  const hasPan = pattern.panModules && Object.keys(pattern.panModules).length > 0;
  const hasDistort = pattern.distortModules && Object.keys(pattern.distortModules).length > 0;
  const hasAny = hasEQ || hasFilters || hasLFOs || hasDelay || hasReverb || hasPan || hasDistort;

  return (
    <BaseVisualization
      className={className}
      description="Audio processing and effects applied to your pattern"
      variant="ultra-compact"
    >
      <div className="space-y-4">
        {/* EQ Settings */}
        {hasEQ && (
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">EQ Settings</h4>
            <EQDisplay eqModules={pattern.eqModules} />
          </div>
        )}

        {/* Filters */}
        {hasFilters && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-foreground">Filters</h4>
            <div className="space-y-1">
              {Object.entries(pattern.filterModules!).map(([name, f]) => (
                <div key={name} className="flex items-center gap-2 text-xs">
                  <span className="text-accent font-medium w-16 truncate">{name}</span>
                  <span className="text-foreground-muted">{f.type}</span>
                  <span className="text-foreground">{f.freq}Hz</span>
                  <span className="text-foreground-muted">Q={f.Q}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LFO Modulation */}
        {hasLFOs && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-foreground">LFO Modulation</h4>
            <div className="space-y-1.5">
              {Object.entries(pattern.lfoModules!).map(([key, lfo]) => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <span className="text-accent font-medium w-24 truncate">{key}</span>
                  <span className="text-foreground">{lfo.rateHz}Hz</span>
                  <span className="text-foreground-muted">{lfo.wave}</span>
                  <div className="flex-1 max-w-20 h-1.5 bg-background-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${lfo.depth * 100}%` }}
                    />
                  </div>
                  <span className="text-foreground-muted w-8 text-right">{Math.round(lfo.depth * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delay */}
        {hasDelay && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-foreground">Delay</h4>
            <div className="space-y-1">
              {Object.entries(pattern.delayModules!).map(([name, d]) => (
                <div key={name} className="flex items-center gap-2 text-xs">
                  <span className="text-accent font-medium w-16 truncate">{name}</span>
                  <span className="text-foreground">{d.time}s</span>
                  <span className="text-foreground-muted">fb={d.feedback}</span>
                  <span className="text-foreground-muted">mix={d.mix}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reverb */}
        {hasReverb && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-foreground">Reverb</h4>
            <div className="space-y-1">
              {Object.entries(pattern.reverbModules!).map(([name, r]) => (
                <div key={name} className="flex items-center gap-2 text-xs">
                  <span className="text-accent font-medium w-16 truncate">{name}</span>
                  <span className="text-foreground">decay={r.decay}s</span>
                  <span className="text-foreground-muted">mix={r.mix}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pan */}
        {hasPan && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-foreground">Pan</h4>
            <div className="space-y-1">
              {Object.entries(pattern.panModules!).map(([name, p]) => (
                <div key={name} className="flex items-center gap-2 text-xs">
                  <span className="text-accent font-medium w-16 truncate">{name}</span>
                  <span className="text-foreground-muted">L</span>
                  <div className="flex-1 max-w-20 h-1.5 bg-background-secondary rounded-full relative">
                    <div
                      className="absolute top-0 h-full w-1.5 bg-accent rounded-full"
                      style={{ left: `${((p.value + 1) / 2) * 100}%`, transform: 'translateX(-50%)' }}
                    />
                  </div>
                  <span className="text-foreground-muted">R</span>
                  <span className="text-foreground w-8 text-right">{p.value.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Distortion */}
        {hasDistort && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-foreground">Distortion</h4>
            <div className="space-y-1">
              {Object.entries(pattern.distortModules!).map(([name, d]) => (
                <div key={name} className="flex items-center gap-2 text-xs">
                  <span className="text-accent font-medium w-16 truncate">{name}</span>
                  <span className="text-foreground">amount={d.amount}</span>
                  <span className="text-foreground-muted">mix={d.mix}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No effects fallback */}
        {!hasAny && (
          <div className="text-center py-4">
            <div className="text-foreground-muted text-sm mb-2">
              No audio effects applied
            </div>
            <div className="text-xs text-foreground-muted">
              Add EQ, filter, LFO, delay, reverb, pan, or distort commands to see them here
            </div>
          </div>
        )}
      </div>
    </BaseVisualization>
  );
};
