// Custom hook for pattern editing functionality
import { useState, useCallback, useEffect } from 'react';
import { PatternParser } from '../services/patternParser';
import { ParsedPattern, ValidationResult } from '../types/app';

export const usePatternEditor = () => {
  const [content, setContent] = useState(`TEMPO 120

seq kick: x...x...x...x...
seq snare: ....x.......x...
seq hihat: x.x.x.x.x.x.x.x.`);

  const [cursorPosition, setCursorPosition] = useState(0);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [parsedPattern, setParsedPattern] = useState<ParsedPattern | null>(null);

  // Validate and parse pattern when content changes
  useEffect(() => {
    const validateAndParse = async () => {
      try {
        const validationResult = PatternParser.validate(content);
        setValidation(validationResult);

        if (validationResult.isValid) {
          const parsed = PatternParser.parse(content);
          setParsedPattern(parsed);
        } else {
          setParsedPattern(null);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Validation error';
        setValidation({
          isValid: false,
          errors: [errorMessage],
          warnings: [],
          validInstruments: [],
          invalidInstruments: []
        });
        setParsedPattern(null);
      }
    };

    // Debounce validation to avoid excessive processing
    const timeoutId = setTimeout(validateAndParse, 300);
    return () => clearTimeout(timeoutId);
  }, [content]);

  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  const updateCursorPosition = useCallback((position: number) => {
    setCursorPosition(position);
  }, []);

  const toggleStep = useCallback((instrument: string, step: number) => {
    if (!parsedPattern || !parsedPattern.instruments[instrument]) {
      return;
    }

    const instrumentData = parsedPattern.instruments[instrument];
    if (step < instrumentData.steps.length) {
      instrumentData.steps[step] = !instrumentData.steps[step];

      // Update content from modified pattern
      let newContent = `TEMPO ${parsedPattern.tempo}\n\n`;
      Object.entries(parsedPattern.instruments).forEach(([name, inst]) => {
        const patternString = inst.steps
          .map(step => step ? 'x' : '.')
          .join('');
        newContent += `seq ${name}: ${patternString}\n`;
      });

      setContent(newContent.trim());
    }
  }, [parsedPattern]);

  return {
    content,
    cursorPosition,
    validation,
    parsedPattern,
    updateContent,
    updateCursorPosition,
    toggleStep
  };
};
