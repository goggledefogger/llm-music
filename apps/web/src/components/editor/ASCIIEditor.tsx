import React, { useState, useEffect } from 'react';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { PatternParser } from '../../services/patternParser';

export const ASCIIEditor: React.FC = () => {
  const audioEngine = useAudioEngine();
  const [content, setContent] = useState(`TEMPO 120

seq kick: x...x...x...x...
seq snare: ....x.......x...
seq hihat: x.x.x.x.x.x.x.x.`);
  const [validation, setValidation] = useState<{ isValid: boolean; errors: string[] }>({ isValid: true, errors: [] });

  // Validate pattern when content changes
  useEffect(() => {
    const validationResult = PatternParser.validate(content);
    setValidation(validationResult);

    // Load pattern into audio engine if valid and audio is initialized
    if (validationResult.isValid && audioEngine.state.isInitialized) {
      try {
        audioEngine.loadPattern(content);
      } catch (error) {
        console.error('Failed to load pattern:', error);
      }
    }
  }, [content, audioEngine]);

  const handleValidate = () => {
    const validationResult = PatternParser.validate(content);
    setValidation(validationResult);
  };

  const handleLoadPattern = () => {
    if (validation.isValid && audioEngine.state.isInitialized) {
      try {
        audioEngine.loadPattern(content);
        console.log('Pattern loaded successfully');
      } catch (error) {
        console.error('Failed to load pattern:', error);
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border p-4">
        <h2 className="text-lg font-semibold">ASCII Pattern Editor</h2>
        <p className="text-sm text-foreground-muted">
          Write your musical patterns using ASCII DSL syntax
        </p>
      </div>

      {validation.errors.length > 0 && (
        <div className="border-b border-border p-4 bg-red-50">
          <h3 className="text-sm font-semibold text-red-700 mb-2">Validation Errors:</h3>
          <ul className="text-sm text-red-600 space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex-1 p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={`w-full h-full bg-background border rounded p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 ${
            validation.isValid
              ? 'border-border focus:ring-accent'
              : 'border-red-300 focus:ring-red-500'
          }`}
          placeholder="Enter your ASCII pattern here..."
        />
      </div>

      <div className="border-t border-border p-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-foreground-muted">
            Lines: {content.split('\n').length} | Characters: {content.length}
            {validation.isValid && <span className="ml-2 text-green-600">✓ Valid</span>}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleValidate}
              className="btn btn-ghost btn-sm"
            >
              Validate
            </button>
            <button
              onClick={handleLoadPattern}
              className="btn btn-primary btn-sm"
              disabled={!validation.isValid || !audioEngine.state.isInitialized}
            >
              Load Pattern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
