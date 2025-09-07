import React, { useMemo } from 'react';
import { ParsedPattern } from '../../../types/app';
import { BaseVisualization } from '../BaseVisualization';

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
    <BaseVisualization
      className={className}
      description={`${gridData.instruments.length} instrument${gridData.instruments.length !== 1 ? 's' : ''} • ${gridData.maxSteps} steps`}
      variant="ultra-compact"
    >
        {gridData.instruments.map((instrument) => {
          const instrumentData = pattern.instruments[instrument];
          const steps = instrumentData.steps;
          
          return (
            <div key={instrument} className="flex items-center space-x-1 sm:space-x-2 min-w-0 w-full">
              {/* Instrument Label */}
              <div className="w-10 sm:w-12 md:w-14 text-xs sm:text-sm font-medium text-foreground-muted capitalize flex-shrink-0">
                {instrument}
              </div>
              
              {/* Step Grid */}
              <div className="flex space-x-0.5 sm:space-x-1 flex-1 min-w-0 overflow-hidden max-w-0">
                {gridData.steps.map((stepIndex) => {
                  const isActive = stepIndex < steps.length ? steps[stepIndex] : false;
                  const isCurrentStep = stepIndex === currentStep;
                  
                  return (
                    <button
                      key={stepIndex}
                      onClick={() => handleStepClick(instrument, stepIndex)}
                      className={`
                        w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 rounded border transition-all duration-150 flex-shrink-0
                        text-[10px] sm:text-xs font-mono leading-none
                        ${isActive 
                          ? `${getInstrumentColor(instrument)} text-white border-transparent` 
                          : 'bg-background border-border hover:border-foreground-muted'
                        }
                        ${isCurrentStep ? 'ring-1 ring-yellow-400 ring-opacity-75' : ''}
                        ${onStepToggle ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                      `}
                      title={`Step ${stepIndex + 1} - ${isActive ? 'Active' : 'Inactive'}`}
                    >
                      {stepIndex + 1}
                    </button>
                  );
                })}
              </div>
              
              {/* Step Count Indicator */}
              <div className="text-[10px] sm:text-xs text-foreground-muted ml-1 flex-shrink-0">
                {steps.filter(Boolean).length}/{steps.length}
              </div>
            </div>
          );
        })}
    </BaseVisualization>
  );
};
