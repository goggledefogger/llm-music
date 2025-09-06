import React from 'react';
import { ParsedPattern } from '../../../types/app';

interface SuggestionPreviewProps {
  originalPattern: ParsedPattern;
  suggestedPattern: ParsedPattern;
  confidence: number;
  changes: Array<{
    instrument: string;
    step: number;
    original: boolean;
    suggested: boolean;
  }>;
  onAccept?: () => void;
  onReject?: () => void;
  className?: string;
}

export const SuggestionPreview: React.FC<SuggestionPreviewProps> = ({
  originalPattern,
  suggestedPattern,
  confidence,
  changes,
  onAccept,
  onReject,
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const renderPatternGrid = (pattern: ParsedPattern, showChanges: boolean = false) => {
    const instruments = Object.keys(pattern.instruments);
    const maxSteps = Math.max(...instruments.map(inst => pattern.instruments[inst].steps.length), 16);

    return (
      <div className="space-y-2">
        {instruments.map((instrument) => {
          const instrumentData = pattern.instruments[instrument];
          const steps = instrumentData.steps;
          
          return (
            <div key={instrument} className="flex items-center space-x-3">
              <div className="w-16 text-sm font-medium text-foreground-muted capitalize">
                {instrument}
              </div>
              <div className="flex space-x-1">
                {Array.from({ length: maxSteps }, (_, i) => {
                  const isActive = i < steps.length ? steps[i] : false;
                  const hasChange = showChanges && changes.some(
                    change => change.instrument === instrument && change.step === i
                  );
                  
                  return (
                    <div
                      key={i}
                      className={`
                        w-6 h-6 rounded border-2 flex items-center justify-center text-xs
                        ${isActive 
                          ? `${getInstrumentColor(instrument)} text-white border-transparent` 
                          : 'bg-background border-border'
                        }
                        ${hasChange ? 'ring-2 ring-yellow-400 ring-opacity-75' : ''}
                      `}
                    >
                      {i + 1}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`bg-background-secondary rounded-lg p-4 ${className}`}>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">AI Suggestion</h3>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(confidence)}`}>
              {getConfidenceLabel(confidence)} Confidence
            </span>
            <span className="text-sm text-foreground-muted">
              {Math.round(confidence * 100)}%
            </span>
          </div>
        </div>
        <p className="text-sm text-foreground-muted">
          {changes.length} change{changes.length !== 1 ? 's' : ''} suggested
        </p>
      </div>

      {/* Comparison View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
        {/* Original Pattern */}
        <div>
          <h4 className="text-sm font-semibold mb-3 text-foreground-muted">Original</h4>
          <div className="bg-background rounded p-3">
            {renderPatternGrid(originalPattern)}
          </div>
        </div>

        {/* Suggested Pattern */}
        <div>
          <h4 className="text-sm font-semibold mb-3 text-foreground-muted">Suggested</h4>
          <div className="bg-background rounded p-3">
            {renderPatternGrid(suggestedPattern, true)}
          </div>
        </div>
      </div>

      {/* Changes Summary */}
      {changes.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2">Changes Summary</h4>
          <div className="bg-background rounded p-3">
            <div className="space-y-2">
              {changes.map((change, index) => (
                <div key={index} className="flex items-center space-x-3 text-sm">
                  <div className="w-20 text-foreground-muted capitalize">
                    {change.instrument}
                  </div>
                  <div className="w-8 text-center">
                    Step {change.step + 1}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      change.original ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {change.original ? 'ON' : 'OFF'}
                    </span>
                    <span className="text-foreground-muted">→</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      change.suggested ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {change.suggested ? 'ON' : 'OFF'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pattern Stats Comparison */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold mb-2">Pattern Comparison</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-foreground-muted">Tempo:</span>
            <div className="font-mono">
              {originalPattern.tempo} → {suggestedPattern.tempo} BPM
            </div>
          </div>
          <div>
            <span className="text-foreground-muted">Total Steps:</span>
            <div className="font-mono">
              {originalPattern.totalSteps} → {suggestedPattern.totalSteps}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={onAccept}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
        >
          Accept Suggestion
        </button>
        <button
          onClick={onReject}
          className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
        >
          Reject Suggestion
        </button>
      </div>
    </div>
  );
};
