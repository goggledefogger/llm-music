// Editor Module for the ASCII Generative Sequencer
import React from 'react';
import { BaseModule } from '../core/BaseModule';
import { EditorModuleData, ParsedPattern } from '../types/module';
import { PatternParser } from '../services/patternParser';
import { moduleManager } from '../core/ModuleManager';

export class EditorModule extends BaseModule {
  private content: string = `TEMPO 120

seq kick: x...x...x...x...
seq snare: ....x.......x...
seq hihat: x.x.x.x.x.x.x.x.`;
  private cursorPosition: number = 0;
  private selection: { start: number; end: number } | null = null;
  private validation = { isValid: true, errors: [] as string[] };
  private pattern: ParsedPattern | null = null;

  constructor() {
    super('editor', 'ASCII Editor', 'Text-based pattern editor with real-time validation', {
      canVisualize: true,
      canExport: true,
      canImport: true,
      canAnalyze: true
    });

    this.metadata.visualization = {
      type: 'grid',
      component: 'StepSequencerGrid',
      props: {
        showInstruments: true,
        showSteps: true,
        showPlayhead: true,
        interactive: true
      },
      responsive: true,
      realTime: true
    };
  }

  protected getInitialData(): EditorModuleData {
    return {
      content: this.content,
      cursorPosition: this.cursorPosition,
      selection: this.selection,
      validation: this.validation,
      pattern: this.pattern
    };
  }

  protected getModuleData(): EditorModuleData {
    return {
      content: this.content,
      cursorPosition: this.cursorPosition,
      selection: this.selection,
      validation: this.validation,
      pattern: this.pattern
    };
  }

  protected async onInitialize(): Promise<void> {
    // Initialize editor-specific functionality
    this.validateContent();
    this.parsePattern();

    // If pattern is valid, update the audio module
    if (this.validation.isValid && this.pattern) {
      this.updateAudioModule();
    }
  }

  protected onDataUpdate(newData: Partial<EditorModuleData>): void {
    if (newData.content !== undefined) {
      this.content = newData.content;
      this.validateContent();
      this.parsePattern();

      // If pattern is valid, update the audio module
      if (this.validation.isValid && this.pattern) {
        this.updateAudioModule();
      }
    }

    if (newData.cursorPosition !== undefined) {
      this.cursorPosition = newData.cursorPosition;
    }

    if (newData.selection !== undefined) {
      this.selection = newData.selection;
    }
  }

  protected onVisualizationUpdate(data: any): void {
    // Handle visualization updates (e.g., step grid interactions)
    if (data.stepToggle) {
      this.toggleStep(data.stepToggle.instrument, data.stepToggle.step);
    }
  }

  renderVisualization(): React.ReactElement {
    // This will be implemented by the actual visualization component
    return React.createElement('div', {
      className: 'editor-visualization',
      'data-module': 'editor'
    }, 'Editor Visualization Placeholder');
  }

  // Editor-specific methods
  setContent(content: string): void {
    this.updateData({ content });
  }

  setCursorPosition(position: number): void {
    this.updateData({ cursorPosition: position });
  }

  setSelection(selection: { start: number; end: number } | null): void {
    this.updateData({ selection });
  }

  getContent(): string {
    return this.content;
  }

  getPattern(): ParsedPattern | null {
    return this.pattern;
  }

  getValidation() {
    return this.validation;
  }

  private validateContent(): void {
    try {
      const result = PatternParser.validate(this.content);
      this.validation = result;

      // Update module health based on validation
      if (result.isValid) {
        this.setError(null); // Clear any previous errors
      } else {
        this.setError(`Validation failed: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      const errorMessage = 'Validation error: ' + (error instanceof Error ? error.message : 'Unknown error');
      this.validation = {
        isValid: false,
        errors: [errorMessage],
        warnings: [],
        validInstruments: [],
        invalidInstruments: []
      };
      this.setError(errorMessage);
    }
  }

  private parsePattern(): void {
    try {
      if (this.validation.isValid) {
        this.pattern = PatternParser.parse(this.content);
        this.setError(null); // Clear any parsing errors
      } else {
        this.pattern = null;
        // Don't set error here as validation already handled it
      }
    } catch (error) {
      this.pattern = null;
      const errorMessage = 'Pattern parsing error: ' + (error instanceof Error ? error.message : 'Unknown error');
      this.setError(errorMessage);
      console.error('Pattern parsing error:', error);
    }
  }

  private toggleStep(instrument: string, step: number): void {
    if (!this.pattern || !this.pattern.instruments[instrument]) {
      return;
    }

    const instrumentData = this.pattern.instruments[instrument];
    if (step < instrumentData.steps.length) {
      instrumentData.steps[step] = !instrumentData.steps[step];
      this.updateContentFromPattern();

      // Update audio module if pattern is valid
      if (this.validation.isValid && this.pattern) {
        this.updateAudioModule();
      }
    }
  }

  private updateContentFromPattern(): void {
    if (!this.pattern) {
      return;
    }

    let newContent = `TEMPO ${this.pattern.tempo}\n\n`;

    Object.entries(this.pattern.instruments).forEach(([name, instrument]) => {
      const patternString = instrument.steps
        .map(step => step ? 'x' : '.')
        .join('');
      newContent += `seq ${name}: ${patternString}\n`;
    });

    this.content = newContent.trim();
    this.validateContent();
  }

  private updateAudioModule(): void {
    try {
      // Get the audio module from the module manager
      const audioModules = moduleManager.getModulesByType('audio');
      console.log('EditorModule: updateAudioModule called', {
        audioModulesCount: audioModules.length,
        hasPattern: !!this.pattern,
        pattern: this.pattern
      });

      if (audioModules.length > 0 && this.pattern) {
        const audioModule = audioModules[0];
        // Update the audio module with the new pattern
        audioModule.updateData({ pattern: this.pattern });
        console.log('EditorModule: Updated audio module with pattern');
      } else {
        console.warn('EditorModule: Cannot update audio module', {
          audioModulesCount: audioModules.length,
          hasPattern: !!this.pattern
        });
      }
    } catch (error) {
      console.error('Failed to update audio module:', error);
    }
  }
}
