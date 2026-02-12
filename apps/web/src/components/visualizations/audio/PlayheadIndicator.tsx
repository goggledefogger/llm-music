import React, { useEffect, useState } from 'react';
import { ParsedPattern } from '../../../types/app';
import { BaseVisualization } from '../BaseVisualization';
import { AUDIO_CONSTANTS } from '@ascii-sequencer/shared';

interface PlayheadIndicatorProps {
  pattern: ParsedPattern | null;
  currentTime: number;
  isPlaying: boolean;
  tempo: number;
  className?: string;
}

export const PlayheadIndicator: React.FC<PlayheadIndicatorProps> = ({
  pattern,
  currentTime,
  isPlaying,
  tempo,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [beatPosition, setBeatPosition] = useState(0);

  useEffect(() => {
    if (!pattern || !isPlaying) return;

    // Calculate current step based on tempo and steps-per-beat (real-time)
    const stepsPerSecond = (tempo / 60) * AUDIO_CONSTANTS.STEPS_PER_BEAT;
    const totalStepsProgress = currentTime * stepsPerSecond; // fractional steps
    const maxSteps = Math.max(
      ...Object.values(pattern.instruments).map(inst => inst.steps.length),
      16
    );
    const step = Math.floor(totalStepsProgress) % maxSteps;
    const stepFraction = totalStepsProgress % 1;

    setCurrentStep(step);
    setBeatPosition(stepFraction);
  }, [currentTime, tempo, pattern, isPlaying]);

  if (!pattern) {
    return (
      <div className={`p-4 text-center text-foreground-muted ${className}`}>
        <p>No pattern loaded</p>
      </div>
    );
  }

  const maxSteps = Math.max(...Object.values(pattern.instruments).map(inst => inst.steps.length), 16);
  const stepWidth = 100 / maxSteps;
  const stepsPerBeat = AUDIO_CONSTANTS.STEPS_PER_BEAT;
  const totalSegments = Math.max(1, Math.ceil(maxSteps / stepsPerBeat));

  return (
    <BaseVisualization
      className={className}
      description={`${isPlaying ? 'Playing' : 'Stopped'} • ${tempo} BPM`}
      variant="ultra-compact"
    >

      {/* Timeline Visualization */}
      <div className="relative mb-4">
        <div className="flex items-center space-x-0.5 bg-background rounded p-1 overflow-x-auto">
          {Array.from({ length: maxSteps }, (_, i) => (
            <div
              key={i}
              className={`
                h-6 w-6 rounded-sm border transition-all duration-75 flex-shrink-0
                ${i === currentStep
                  ? 'bg-warning/80 border-warning text-background'
                  : 'bg-background-tertiary border-border'
                }
              `}
            >
              <span className="text-xs font-mono text-center block leading-6">
                {i + 1}
              </span>
            </div>
          ))}
        </div>
        
        {/* Playhead Line */}
        {isPlaying && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-warning transition-all duration-75"
            style={{
              left: `${(currentStep + beatPosition) * stepWidth}%`,
              transform: 'translateX(-50%)'
            }}
          />
        )}
      </div>

      {/* Position Information */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-foreground-muted">Current Step:</span>
          <div className="font-mono text-lg">{currentStep + 1}</div>
        </div>
        <div>
          <span className="text-foreground-muted">Time:</span>
          <div className="font-mono text-lg">
            {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(1).padStart(4, '0')}
          </div>
        </div>
        <div>
          <span className="text-foreground-muted">Beat:</span>
          <div className="font-mono text-lg">
            {beatPosition.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-foreground-muted mb-1">
          <span>0</span>
          <span>{maxSteps} steps</span>
        </div>
        <div className="w-full bg-background rounded-full h-2">
          <div
            className="bg-accent h-2 rounded-full transition-all duration-75"
            style={{ width: `${((currentStep + beatPosition) / maxSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Pattern Loop Indicator */}
      <div className="mt-4 p-2 bg-info/10 border border-info/20 rounded text-sm">
        <div className="flex justify-between items-center">
          <span className="text-info">
            Pattern Loop: {currentStep + 1}/{maxSteps}
          </span>
          <div className="flex space-x-1">
            {Array.from({ length: totalSegments }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  Math.floor(currentStep / stepsPerBeat) === i
                    ? 'bg-info'
                    : 'bg-info/25'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </BaseVisualization>
  );
};
