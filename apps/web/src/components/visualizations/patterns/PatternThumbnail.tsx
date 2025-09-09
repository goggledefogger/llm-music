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
      kick: 'bg-red-500',
      snare: 'bg-blue-500',
      hihat: 'bg-green-500',
      hat: 'bg-green-500',
      default: 'bg-gray-500'
    };
    return colors[instrument.toLowerCase() as keyof typeof colors] || colors.default;
  };

  const getComplexityColor = (complexity: number) => {
    if (complexity < 0.3) return 'text-green-600 bg-green-100';
    if (complexity < 0.7) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
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
      data-testid="pattern-thumbnail"
      className={`
        bg-background border border-border rounded-lg p-4 cursor-pointer
        hover:border-foreground-muted hover:shadow-md transition-all duration-200
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
          className="flex-1 bg-primary text-primary-foreground text-xs py-1 px-2 rounded hover:bg-primary/90 transition-colors"
        >
          Load
        </button>
        {onPreview && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="flex-1 bg-secondary text-secondary-foreground text-xs py-1 px-2 rounded hover:bg-secondary/90 transition-colors"
          >
            Preview
          </button>
        )}
      </div>
    </div>
  );
};
