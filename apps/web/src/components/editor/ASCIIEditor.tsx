import React from 'react';
import { usePattern } from '../../contexts/AppContext';
import { useAudio } from '../../contexts/AppContext';

export const ASCIIEditor: React.FC = () => {
  const { content, validation, updateContent } = usePattern();
  const { state: audioState } = useAudio();

  const handleContentChange = (newContent: string) => {
    updateContent(newContent);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border p-4">
        <h2 className="text-lg font-semibold">ASCII Pattern Editor</h2>
        <p className="text-sm text-foreground-muted">
          Write your musical patterns using ASCII DSL syntax. Patterns are automatically validated and loaded as you type.
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

      <div className="flex-1 p-4">
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className={`w-full h-full bg-background border rounded p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 ${
            validation?.isValid
              ? 'border-green-300 focus:ring-green-500'
              : 'border-red-300 focus:ring-red-500'
          }`}
          placeholder="Enter your ASCII pattern here..."
        />
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
