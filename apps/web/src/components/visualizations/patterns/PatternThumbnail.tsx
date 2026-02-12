import React from 'react';
import { ParsedPattern } from '../../../types/app';

interface PatternThumbnailProps {
  pattern: ParsedPattern;
  name?: string;
  category?: string;
  complexity?: number;
  onClick?: () => void;
  onPreview?: () => void;
  className?: string;
}

export const PatternThumbnail: React.FC<PatternThumbnailProps> = ({
  pattern,
  name = 'Untitled Pattern',
  category = 'General',
  complexity = 0,
  onClick,
  onPreview,
  className = ''
}) => {
  const getInstrumentColor = (instrument: string) => {
    const colors = {
      kick: 'bg-audio-kick',
      snare: 'bg-audio-snare',
      hihat: 'bg-audio-hihat',
      hat: 'bg-audio-hihat',
      pad: 'bg-audio-pad',
      bass: 'bg-audio-bass',
      default: 'bg-foreground-muted'
    };
    return colors[instrument.toLowerCase() as keyof typeof colors] || colors.default;
  };

  const getComplexityColor = (complexity: number) => {
    if (complexity < 0.3) return 'text-green-400 bg-green-500/15';
    if (complexity < 0.7) return 'text-yellow-400 bg-yellow-500/15';
    return 'text-red-400 bg-red-500/15';
  };

  const getComplexityLabel = (complexity: number) => {
    if (complexity < 0.3) return 'Simple';
    if (complexity < 0.7) return 'Medium';
    return 'Complex';
  };

  const instruments = Object.keys(pattern.instruments);
  const maxSteps = Math.max(...instruments.map(inst => pattern.instruments[inst].steps.length), 16);

  return (
    <div
      className={`
        card p-4 cursor-pointer
        hover:border-accent/30 transition-all duration-200
        ${className}
      `}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate" title={name}>
            {name}
          </h3>
          <p className="text-xs text-foreground-muted capitalize">
            {category}
          </p>
        </div>
        <div className="flex space-x-1 ml-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(complexity)}`}>
            {getComplexityLabel(complexity)}
          </span>
        </div>
      </div>

      {/* Pattern Visualization */}
      <div className="mb-3">
        <div className="space-y-1">
          {instruments.slice(0, 3).map((instrument) => {
            const instrumentData = pattern.instruments[instrument];
            const steps = instrumentData.steps;
            
            return (
              <div key={instrument} className="flex items-center space-x-2">
                <div className="w-8 text-xs text-foreground-muted capitalize truncate">
                  {instrument}
                </div>
                <div className="flex space-x-0.5 flex-1">
                  {Array.from({ length: Math.min(maxSteps, 16) }, (_, i) => {
                    const isActive = i < steps.length ? steps[i] : false;
                    return (
                      <div
                        key={i}
                        className={`
                          w-2 h-2 rounded-sm
                          ${isActive 
                            ? getInstrumentColor(instrument)
                            : 'bg-background-secondary'
                          }
                        `}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
          {instruments.length > 3 && (
            <div className="text-xs text-foreground-muted text-center">
              +{instruments.length - 3} more instruments
            </div>
          )}
        </div>
      </div>

      {/* Pattern Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-foreground-muted">Tempo:</span>
          <span className="ml-1 font-mono">{pattern.tempo} BPM</span>
        </div>
        <div>
          <span className="text-foreground-muted">Steps:</span>
          <span className="ml-1 font-mono">{pattern.totalSteps}</span>
        </div>
        <div>
          <span className="text-foreground-muted">Instruments:</span>
          <span className="ml-1 font-mono">{instruments.length}</span>
        </div>
        <div>
          <span className="text-foreground-muted">Density:</span>
          <span className="ml-1 font-mono">
            {Math.round(
              (instruments.reduce((acc, inst) => 
                acc + pattern.instruments[inst].steps.filter(Boolean).length, 0
              ) / (instruments.length * maxSteps)) * 100
            )}%
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-3 pt-3 border-t border-border flex space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onClick) onClick();
          }}
          className="btn btn-primary btn-sm flex-1"
        >
          Load
        </button>
        {onPreview && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="btn btn-secondary btn-sm flex-1"
          >
            Preview
          </button>
        )}
      </div>
    </div>
  );
};
