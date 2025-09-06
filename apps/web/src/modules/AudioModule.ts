// Audio Module for the ASCII Generative Sequencer
import React from 'react';
import { BaseModule } from '../core/BaseModule';
import { AudioModuleData, ParsedPattern } from '../types/module';
import { audioEngine } from '../services/audioEngine';

export class AudioModule extends BaseModule {
  private pattern: ParsedPattern | null = null;
  private waveform: number[] = [];

  constructor() {
    super('audio', 'Audio Engine', 'Real-time audio playback and synthesis', {
      canVisualize: true,
      canExport: true,
      canAnalyze: true
    });

    this.metadata.visualization = {
      type: 'waveform',
      component: 'AudioVisualization',
      props: {
        showWaveform: true,
        showPlayhead: true,
        showLoop: true,
        showVolume: true
      },
      responsive: true,
      realTime: true
    };
  }

  protected getInitialData(): AudioModuleData {
    // Get initial state from the audio engine
    const engineState = audioEngine.getState();

    return {
      isPlaying: engineState.isPlaying,
      tempo: engineState.tempo,
      volume: engineState.volume,
      currentTime: engineState.currentTime,
      pattern: this.pattern,
      waveform: this.waveform
    };
  }

  protected getModuleData(): AudioModuleData {
    // Get current state from the audio engine
    const engineState = audioEngine.getState();

    return {
      isPlaying: engineState.isPlaying,
      tempo: engineState.tempo,
      volume: engineState.volume,
      currentTime: engineState.currentTime,
      pattern: this.pattern,
      waveform: this.waveform
    };
  }

  protected async onInitialize(): Promise<void> {
    try {
      await audioEngine.initialize();
      // Don't start state updates here - let useAudioEngine hook handle it
    } catch (error) {
      throw new Error(`Failed to initialize audio engine: ${error}`);
    }
  }

  protected onDestroy(): void {
    // Don't dispose the singleton audio engine here
    // Let the useAudioEngine hook handle cleanup
  }

  protected onDataUpdate(newData: Partial<AudioModuleData>): void {
    if (newData.tempo !== undefined) {
      audioEngine.setTempo(newData.tempo);
    }

    if (newData.volume !== undefined) {
      audioEngine.setVolume(newData.volume);
    }

    if (newData.pattern !== undefined) {
      this.pattern = newData.pattern;
      console.log('AudioModule: Received pattern update', {
        hasPattern: !!this.pattern,
        pattern: this.pattern
      });

      if (this.pattern) {
        // Convert pattern to string for audio engine
        const patternString = this.convertPatternToString(this.pattern);
        console.log('AudioModule: Loading pattern to audio engine', patternString);
        audioEngine.loadPattern(patternString);
      }
    }
  }

  protected onVisualizationUpdate(data: any): void {
    // Handle visualization updates (e.g., seeking, loop changes)
    if (data.seek !== undefined) {
      this.seekTo(data.seek);
    }

    if (data.loop !== undefined) {
      this.setLoop(data.loop.start, data.loop.end);
    }
  }

  renderVisualization(): React.ReactElement {
    return React.createElement('div', {
      className: 'audio-visualization',
      'data-module': 'audio'
    }, 'Audio Visualization Placeholder');
  }

  // Audio-specific methods
  async play(): Promise<void> {
    try {
      audioEngine.play();
      this.setState({ lastUpdated: new Date() });
    } catch (error) {
      this.setError(`Play failed: ${error}`);
    }
  }

  pause(): void {
    try {
      audioEngine.pause();
      this.setState({ lastUpdated: new Date() });
    } catch (error) {
      this.setError(`Pause failed: ${error}`);
    }
  }

  stop(): void {
    try {
      audioEngine.stop();
      this.setState({ lastUpdated: new Date() });
    } catch (error) {
      this.setError(`Stop failed: ${error}`);
    }
  }

  setTempo(tempo: number): void {
    this.updateData({ tempo });
  }

  setVolume(volume: number): void {
    this.updateData({ volume });
  }

  loadPattern(pattern: ParsedPattern): void {
    this.updateData({ pattern });
  }

  seekTo(time: number): void {
    // Implementation depends on audio engine capabilities
    this.currentTime = time;
    this.setState({ lastUpdated: new Date() });
  }

  setLoop(_start: number, _end: number): void {
    // Implementation depends on audio engine capabilities
    this.setState({ lastUpdated: new Date() });
  }

  getAudioEngine() {
    return audioEngine;
  }


  private convertPatternToString(pattern: ParsedPattern): string {
    let content = `TEMPO ${pattern.tempo}\n\n`;

    Object.entries(pattern.instruments).forEach(([name, instrument]) => {
      const patternString = instrument.steps
        .map(step => step ? 'x' : '.')
        .join('');
      content += `seq ${name}: ${patternString}\n`;
    });

    return content.trim();
  }
}
