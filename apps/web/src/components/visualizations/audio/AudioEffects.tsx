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

  const hasEQSettings = pattern.eqModules && Object.keys(pattern.eqModules).length > 0;

  return (
    <BaseVisualization
      className={className}
      description="Audio processing and effects applied to your pattern"
      variant="ultra-compact"
    >
      <div className="space-y-4">
        {/* EQ Settings */}
        {hasEQSettings && (
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">EQ Settings</h4>
            <EQDisplay eqModules={pattern.eqModules} />
          </div>
        )}

        {/* Placeholder for future effects */}
        {!hasEQSettings && (
          <div className="text-center py-4">
            <div className="text-foreground-muted text-sm mb-2">
              No audio effects applied
            </div>
            <div className="text-xs text-foreground-muted">
              Add EQ settings in your ASCII pattern to see them here
            </div>
          </div>
        )}

        {/* Future effects sections */}
        <div className="space-y-3">
          <div className="bg-background-secondary rounded p-3 border border-dashed border-border">
            <div className="text-sm font-medium text-foreground-muted mb-1">
              🎛️ Filters
            </div>
            <div className="text-xs text-foreground-muted">
              Low-pass, high-pass, and band-pass filters
            </div>
          </div>

          <div className="bg-background-secondary rounded p-3 border border-dashed border-border">
            <div className="text-sm font-medium text-foreground-muted mb-1">
              🎚️ Dynamics
            </div>
            <div className="text-xs text-foreground-muted">
              Compression, limiting, and gating
            </div>
          </div>

          <div className="bg-background-secondary rounded p-3 border border-dashed border-border">
            <div className="text-sm font-medium text-foreground-muted mb-1">
              🌊 Modulation
            </div>
            <div className="text-xs text-foreground-muted">
              Chorus, flanger, and phaser effects
            </div>
          </div>
        </div>
      </div>
    </BaseVisualization>
  );
};
