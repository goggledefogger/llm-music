import React, { useState, useCallback, useMemo } from 'react';
import { usePattern, useAudio } from '../../contexts/AppContext';
import { AUDIO_CONSTANTS } from '@ascii-sequencer/shared';

interface InlineTextAnimationEditorProps {
  className?: string;
}

interface StepPosition {
  charIndex: number;
  stepIndex: number;
  isActive: boolean;
}

export const InlineTextAnimationEditor: React.FC<InlineTextAnimationEditorProps> = ({ className }) => {
  const { content, validation, updateContent } = usePattern();
  const { state: audioState } = useAudio();
  const [isComposing, setIsComposing] = useState(false);

  // Calculate current step based on audio state
  const currentStep = useMemo(() =>
    Math.floor(
      audioState.currentTime * ((audioState.tempo / 60) * AUDIO_CONSTANTS.STEPS_PER_BEAT)
    ) % (validation?.validInstruments.length ? 16 : 16),
    [audioState.currentTime, audioState.tempo, validation?.validInstruments.length]
  );

  // Parse sequences with memoization for performance
  const sequences = useMemo(() => {
    const lines = content.split('\n');
    const result: Array<{
      lineIndex: number;
      stepPositions: StepPosition[];
    }> = [];

    lines.forEach((line, lineIndex) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('seq ')) {
        const seqMatch = trimmed.match(/seq\s+(\w+):\s*(.+)/);
        if (seqMatch) {
          const [, , patternString] = seqMatch;
          const stepPositions: StepPosition[] = [];

          // Find the position of each character in the pattern
          const charIndex = line.indexOf(patternString);
          if (charIndex !== -1) {
            for (let i = 0; i < patternString.length; i++) {
              const char = patternString[i];
              stepPositions.push({
                charIndex: charIndex + i,
                stepIndex: i,
                isActive: char === 'x' || char === 'X'
              });
            }
          }

          result.push({ lineIndex, stepPositions });
        }
      }
    });

    return result;
  }, [content]);

  // Render animated content with memoization
  const animatedContent = useMemo(() => {
    const lines = content.split('\n');

    return lines.map((line, lineIndex) => {
      const sequence = sequences.find(seq => seq.lineIndex === lineIndex);

      if (!sequence) {
        return <div key={lineIndex} className="font-mono text-sm">{line}</div>;
      }

      return (
        <div key={lineIndex} className="font-mono text-sm">
          {line.split('').map((char, charIndex) => {
            const stepData = sequence.stepPositions.find(step => step.charIndex === charIndex);

            if (!stepData) {
              return <span key={charIndex}>{char}</span>;
            }

            const isCurrentStep = stepData.stepIndex === (currentStep % sequence.stepPositions.length);
            const isPlaying = audioState.isPlaying;
            const isActive = stepData.isActive;

            return (
              <span
                key={charIndex}
                className={`inline-block transition-all duration-150 ${
                  isCurrentStep && isPlaying
                    ? isActive
                      ? 'text-yellow-400 scale-125 font-bold'
                      : 'text-gray-400 scale-110'
                    : isActive
                    ? 'text-green-500'
                    : 'text-gray-500'
                }`}
                style={{
                  textShadow: isCurrentStep && isPlaying && isActive
                    ? '0 0 8px rgba(251, 191, 36, 0.8)'
                    : 'none',
                  minWidth: '1ch'
                }}
              >
                {char}
              </span>
            );
          })}
        </div>
      );
    });
  }, [content, sequences, currentStep, audioState.isPlaying]);

  // Handle input events
  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isComposing) {
      updateContent(e.target.value);
    }
  }, [isComposing, updateContent]);

  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLTextAreaElement>) => {
    setIsComposing(false);
    updateContent(e.currentTarget.value);
  }, [updateContent]);

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="border-b border-border p-4">
        <h2 className="text-lg font-semibold">ASCII Pattern Editor with In-Line Text Animation</h2>
        <p className="text-sm text-foreground-muted">
          The actual X's and periods in your sequencer patterns animate directly in the text as they play.
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

      {/* Warnings */}
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

      {/* Valid Instruments Status */}
      {validation && validation.validInstruments.length > 0 && (
        <div className="border-b border-border p-4 bg-green-50">
          <h3 className="text-sm font-semibold text-green-700 mb-2">Valid Instruments:</h3>
          <div className="flex flex-wrap gap-2">
            {validation.validInstruments.map((instrument, index) => (
              <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                {instrument}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Editor with Inline Animation */}
      <div className="flex-1 p-4">
        <div className="relative">
          {/* Hidden textarea for input */}
          <textarea
            value={content}
            onChange={handleInput}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            className="w-full h-full bg-transparent border-0 p-4 font-mono text-sm resize-none focus:outline-none absolute inset-0 opacity-0 cursor-text"
            placeholder="Enter your ASCII pattern here..."
            style={{
              lineHeight: '1.5',
              zIndex: 2
            }}
          />

          {/* Visible animated content */}
          <div
            className={`w-full h-full p-4 font-mono text-sm border rounded resize-none ${
              validation?.isValid
                ? 'border-green-300'
                : 'border-red-300'
            }`}
            style={{
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              minHeight: '200px'
            }}
          >
            {animatedContent}
          </div>
        </div>
      </div>

      <div className="border-t border-border p-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-foreground-muted">
            Lines: {content.split('\n').length} | Characters: {content.length}
            {validation?.isValid && <span className="ml-2 text-green-600">✓ Valid & Loaded</span>}
            {validation && !validation.isValid && <span className="ml-2 text-red-600">✗ Invalid</span>}
            {validation && validation.validInstruments.length > 0 && (
              <span className="ml-2 text-blue-600">
                {validation.validInstruments.length} instrument{validation.validInstruments.length !== 1 ? 's' : ''} ready
              </span>
            )}
          </div>
          <div className="text-sm text-foreground-muted">
            {audioState.isInitialized ? (
              <span className="text-green-600">🎵 Audio Ready</span>
            ) : audioState.error ? (
              <span className="text-red-600">❌ Audio Error</span>
            ) : (
              <span className="text-blue-600">👆 Click to Enable Audio</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
