import React, { useMemo } from 'react';
import { ParsedPattern } from '../../../types/app';

interface StepSequencerGridProps {
  pattern: ParsedPattern | null;
  currentStep?: number;
  onStepToggle?: (instrument: string, step: number) => void;
  className?: string;
}

export const StepSequencerGrid: React.FC<StepSequencerGridProps> = ({
  pattern,
  currentStep = -1,
  onStepToggle,
  className = ''
}) => {
  const gridData = useMemo(() => {
    if (!pattern) return null;

    const instruments = Object.keys(pattern.instruments);
    const maxSteps = Math.max(...instruments.map(inst => pattern.instruments[inst].steps.length), 16);
    
    return {
      instruments,
      maxSteps,
      steps: Array.from({ length: maxSteps }, (_, i) => i)
    };
  }, [pattern]);

  if (!pattern || !gridData) {
    return (
      <div className={`p-4 text-center text-foreground-muted ${className}`}>
        <p>No pattern loaded</p>
        <p className="text-sm">Create a pattern in the ASCII editor to see the step sequencer</p>
      </div>
    );
  }

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

  const handleStepClick = (instrument: string, step: number) => {
    if (onStepToggle) {
      onStepToggle(instrument, step);
    }
  };

  return (
    <div className={`bg-background-secondary rounded-lg p-4 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Step Sequencer</h3>
        <div className="text-sm text-foreground-muted">
          {gridData.instruments.length} instrument{gridData.instruments.length !== 1 ? 's' : ''} • {gridData.maxSteps} steps
        </div>
      </div>

      <div className="space-y-2">
        {gridData.instruments.map((instrument) => {
          const instrumentData = pattern.instruments[instrument];
          const steps = instrumentData.steps;
          
          return (
            <div key={instrument} className="flex items-center space-x-2 min-w-0">
              {/* Instrument Label */}
              <div className="w-12 text-xs font-medium text-foreground-muted capitalize flex-shrink-0">
                {instrument}
              </div>
              
              {/* Step Grid */}
              <div className="flex space-x-0.5 flex-1 min-w-0 overflow-hidden">
                {gridData.steps.map((stepIndex) => {
                  const isActive = stepIndex < steps.length ? steps[stepIndex] : false;
                  const isCurrentStep = stepIndex === currentStep;
                  
                  return (
                    <button
                      key={stepIndex}
                      onClick={() => handleStepClick(instrument, stepIndex)}
                      className={`
                        w-6 h-6 rounded border transition-all duration-150 flex-shrink-0
                        ${isActive 
                          ? `${getInstrumentColor(instrument)} text-white border-transparent` 
                          : 'bg-background border-border hover:border-foreground-muted'
                        }
                        ${isCurrentStep ? 'ring-1 ring-yellow-400 ring-opacity-75' : ''}
                        ${onStepToggle ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                      `}
                      title={`Step ${stepIndex + 1} - ${isActive ? 'Active' : 'Inactive'}`}
                    >
                      <span className="text-xs font-mono leading-none">
                        {stepIndex + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
              
              {/* Step Count Indicator */}
              <div className="text-xs text-foreground-muted ml-1 flex-shrink-0">
                {steps.filter(Boolean).length}/{steps.length}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Step Indicator */}
      {currentStep >= 0 && (
        <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <span className="font-medium">Current Step:</span> {currentStep + 1}
        </div>
      )}

      {/* Pattern Info */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-foreground-muted">Tempo:</span>
            <span className="ml-2 font-mono">{pattern.tempo} BPM</span>
          </div>
          <div>
            <span className="text-foreground-muted">Total Steps:</span>
            <span className="ml-2 font-mono">{pattern.totalSteps}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
