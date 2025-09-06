import React, { useState, useEffect, useCallback } from 'react';
import { useAudioEngineContext } from '../../contexts/AudioEngineContext';
import { useModuleSystemContext } from '../../contexts/ModuleSystemContext';
import { PatternParser } from '../../services/patternParser';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validInstruments: string[];
  invalidInstruments: string[];
}

export const ASCIIEditor: React.FC = () => {
  const audioEngine = useAudioEngineContext();
  const { getModuleByType, updateModuleData } = useModuleSystemContext();
  // Get content and validation state from editor module
  const editorModule = getModuleByType('editor');
  const moduleData = editorModule?.getData();
  const [content, setContent] = useState(moduleData?.content || `TEMPO 120

seq kick: x...x...x...x...
seq snare: ....x.......x...
seq hihat: x.x.x.x.x.x.x.x.`);
  const validation = moduleData?.validation || {
    isValid: true,
    errors: [],
    warnings: [],
    validInstruments: [],
    invalidInstruments: []
  };
  const [lastValidContent, setLastValidContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Update editor module when content changes
  const handleContentChange = useCallback(async (newContent: string) => {
    setContent(newContent);
    setIsLoading(true);

    try {
      // Update editor module with new content
      // The EditorModule will handle validation and audio loading
      const editorModule = getModuleByType('editor');
      if (editorModule) {
        updateModuleData(editorModule.getData().id, { content: newContent });
        setLastValidContent(newContent);
        console.log('Pattern updated in editor module');
      }
    } catch (error) {
      console.error('Failed to update editor module:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getModuleByType, updateModuleData]);

  // Debounced content change handler
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (content !== lastValidContent) {
        handleContentChange(content);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [content, handleContentChange, lastValidContent]);

  // Initial validation on mount
  useEffect(() => {
    handleContentChange(content);
  }, []); // Only run on mount

  // Load pattern when audio engine becomes initialized
  useEffect(() => {
    if (audioEngine.state.isInitialized && validation.isValid && lastValidContent) {
      // Update the editor module to trigger audio loading
      try {
        updateModuleData(editorModule.getData().id, { content: lastValidContent });
      } catch (error) {
        console.error('Failed to update editor module after audio initialization:', error);
      }
    }
  }, [audioEngine.state.isInitialized, validation.isValid, lastValidContent, updateModuleData, editorModule]);

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border p-4">
        <h2 className="text-lg font-semibold">ASCII Pattern Editor</h2>
        <p className="text-sm text-foreground-muted">
          Write your musical patterns using ASCII DSL syntax. Patterns are automatically validated and loaded as you type.
        </p>
      </div>

      {/* Validation Status */}
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

      {/* Warnings */}
      {validation.warnings.length > 0 && (
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
      {validation.validInstruments.length > 0 && (
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
          onChange={(e) => setContent(e.target.value)}
          className={`w-full h-full bg-background border rounded p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 ${
            validation.isValid
              ? 'border-green-300 focus:ring-green-500'
              : 'border-red-300 focus:ring-red-500'
          }`}
          placeholder="Enter your ASCII pattern here..."
          disabled={isLoading}
        />
      </div>

      <div className="border-t border-border p-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-foreground-muted">
            Lines: {content.split('\n').length} | Characters: {content.length}
            {isLoading && <span className="ml-2 text-blue-600">⏳ Validating...</span>}
            {!isLoading && validation.isValid && <span className="ml-2 text-green-600">✓ Valid & Loaded</span>}
            {!isLoading && !validation.isValid && <span className="ml-2 text-red-600">✗ Invalid</span>}
            {validation.validInstruments.length > 0 && (
              <span className="ml-2 text-blue-600">
                {validation.validInstruments.length} instrument{validation.validInstruments.length !== 1 ? 's' : ''} ready
              </span>
            )}
          </div>
          <div className="text-sm text-foreground-muted">
            {audioEngine.state.isInitialized ? (
              <span className="text-green-600">🎵 Audio Ready</span>
            ) : audioEngine.state.error ? (
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
