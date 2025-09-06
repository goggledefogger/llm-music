import React, { useMemo } from 'react';
import { ParsedPattern } from '../../../types/app';
import { BaseVisualization } from '../BaseVisualization';

interface PatternAnalysisProps {
  pattern: ParsedPattern | null;
  className?: string;
}

export const PatternAnalysis: React.FC<PatternAnalysisProps> = ({
  pattern,
  className = ''
}) => {
  const analysis = useMemo(() => {
    if (!pattern) return null;

    const instruments = Object.keys(pattern.instruments);
    const maxSteps = Math.max(...instruments.map(inst => pattern.instruments[inst].steps.length), 16);
    
    // Calculate pattern complexity
    const totalSteps = instruments.length * maxSteps;
    const activeSteps = instruments.reduce((acc, inst) => 
      acc + pattern.instruments[inst].steps.filter(Boolean).length, 0
    );
    const complexity = activeSteps / totalSteps;

    // Calculate instrument usage
    const instrumentUsage = instruments.map(inst => ({
      name: inst,
      activeSteps: pattern.instruments[inst].steps.filter(Boolean).length,
      totalSteps: pattern.instruments[inst].steps.length,
      percentage: (pattern.instruments[inst].steps.filter(Boolean).length / pattern.instruments[inst].steps.length) * 100
    }));

    // Calculate rhythm analysis
    const rhythmPatterns = instruments.map(inst => {
      const steps = pattern.instruments[inst].steps;
      const intervals: number[] = [];
      let lastActive = -1;
      
      for (let i = 0; i < steps.length; i++) {
        if (steps[i]) {
          if (lastActive >= 0) {
            intervals.push(i - lastActive);
          }
          lastActive = i;
        }
      }
      
      return {
        instrument: inst,
        intervals,
        averageInterval: intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0,
        consistency: intervals.length > 1 ? 
          1 - (Math.max(...intervals) - Math.min(...intervals)) / maxSteps : 1
      };
    });

    // Calculate pattern density
    const density = activeSteps / totalSteps;

    return {
      complexity,
      instrumentUsage,
      rhythmPatterns,
      density,
      totalSteps,
      activeSteps,
      instruments: instruments.length
    };
  }, [pattern]);

  if (!pattern || !analysis) {
    return (
      <div className={`p-4 text-center text-foreground-muted ${className}`}>
        <p>No pattern loaded</p>
        <p className="text-sm">Load a pattern to see the analysis</p>
      </div>
    );
  }

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

  const getDensityColor = (density: number) => {
    if (density < 0.3) return 'text-blue-600 bg-blue-100';
    if (density < 0.7) return 'text-purple-600 bg-purple-100';
    return 'text-pink-600 bg-pink-100';
  };

  return (
    <BaseVisualization
      className={className}
      description="Detailed breakdown of your pattern structure and characteristics"
      variant="ultra-compact"
    >

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-background rounded p-2">
          <div className="text-xs text-foreground-muted">Complexity</div>
          <div className={`text-sm font-semibold ${getComplexityColor(analysis.complexity)} px-1 py-0.5 rounded`}>
            {getComplexityLabel(analysis.complexity)}
          </div>
          <div className="text-xs text-foreground-muted">
            {Math.round(analysis.complexity * 100)}%
          </div>
        </div>

        <div className="bg-background rounded p-2">
          <div className="text-xs text-foreground-muted">Density</div>
          <div className={`text-sm font-semibold ${getDensityColor(analysis.density)} px-1 py-0.5 rounded`}>
            {Math.round(analysis.density * 100)}%
          </div>
          <div className="text-xs text-foreground-muted">
            {analysis.activeSteps}/{analysis.totalSteps} steps
          </div>
        </div>

        <div className="bg-background rounded p-2">
          <div className="text-xs text-foreground-muted">Instruments</div>
          <div className="text-sm font-semibold">{analysis.instruments}</div>
          <div className="text-xs text-foreground-muted truncate">
            {Object.keys(pattern.instruments).join(', ')}
          </div>
        </div>

        <div className="bg-background rounded p-2">
          <div className="text-xs text-foreground-muted">Tempo</div>
          <div className="text-sm font-semibold">{pattern.tempo} BPM</div>
          <div className="text-xs text-foreground-muted">
            {pattern.totalSteps} total steps
          </div>
        </div>
      </div>

      {/* Instrument Usage Chart */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold mb-2">Instrument Usage</h4>
        <div className="space-y-2">
          {analysis.instrumentUsage.map((usage) => (
            <div key={usage.name} className="bg-background rounded p-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium capitalize">{usage.name}</span>
                <span className="text-xs text-foreground-muted">
                  {usage.activeSteps}/{usage.totalSteps} ({Math.round(usage.percentage)}%)
                </span>
              </div>
              <div className="w-full bg-background-secondary rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${
                    usage.name === 'kick' ? 'bg-red-500' :
                    usage.name === 'snare' ? 'bg-blue-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${usage.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rhythm Analysis */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold mb-2">Rhythm Analysis</h4>
        <div className="space-y-2">
          {analysis.rhythmPatterns.map((rhythm) => (
            <div key={rhythm.instrument} className="bg-background rounded p-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium capitalize">{rhythm.instrument}</span>
                <span className="text-xs text-foreground-muted">
                  {rhythm.intervals.length} intervals
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-foreground-muted">Avg Interval:</span>
                  <div className="font-mono text-xs">
                    {rhythm.averageInterval > 0 ? rhythm.averageInterval.toFixed(1) : 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="text-foreground-muted">Consistency:</span>
                  <div className="font-mono text-xs">
                    {Math.round(rhythm.consistency * 100)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pattern Insights */}
      <div className="bg-background rounded p-2">
        <h4 className="text-sm font-semibold mb-2">Insights</h4>
        <div className="space-y-1 text-xs">
          {analysis.complexity < 0.3 && (
            <div className="text-green-600">
              • Simple pattern with good clarity and focus
            </div>
          )}
          {analysis.complexity > 0.7 && (
            <div className="text-yellow-600">
              • Complex pattern - consider simplifying for better impact
            </div>
          )}
          {analysis.density < 0.2 && (
            <div className="text-blue-600">
              • Sparse pattern with good use of space
            </div>
          )}
          {analysis.density > 0.8 && (
            <div className="text-purple-600">
              • Dense pattern - very energetic and busy
            </div>
          )}
          {analysis.instruments === 1 && (
            <div className="text-orange-600">
              • Single instrument pattern - consider adding more layers
            </div>
          )}
          {analysis.instruments > 4 && (
            <div className="text-pink-600">
              • Multi-layered pattern with rich texture
            </div>
          )}
        </div>
      </div>
    </BaseVisualization>
  );
};
