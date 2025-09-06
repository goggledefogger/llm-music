// Audio Module for the ASCII Generative Sequencer
import React from 'react';
import { BaseModule } from '../core/BaseModule';
import { AudioModuleData, ParsedPattern } from '../types/module';
import { AudioEngine } from '../services/audioEngine';

export class AudioModule extends BaseModule {
  private audioEngine: AudioEngine;
  private isPlaying: boolean = false;
  private tempo: number = 120;
  private volume: number = -6;
  private currentTime: number = 0;
  private pattern: ParsedPattern | null = null;
  private waveform: number[] = [];

  constructor() {
    super('audio', 'Audio Engine', 'Real-time audio playback and synthesis', {
      canVisualize: true,
      canExport: true,
      canAnalyze: true
    });

    this.audioEngine = new AudioEngine();

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
    return {
      isPlaying: this.isPlaying,
      tempo: this.tempo,
      volume: this.volume,
      currentTime: this.currentTime,
      pattern: this.pattern,
      waveform: this.waveform
    };
  }

  protected getModuleData(): AudioModuleData {
    return {
      isPlaying: this.isPlaying,
      tempo: this.tempo,
      volume: this.volume,
      currentTime: this.currentTime,
      pattern: this.pattern,
      waveform: this.waveform
    };
  }

  protected async onInitialize(): Promise<void> {
    try {
      await this.audioEngine.initialize();
      this.startStateUpdates();
    } catch (error) {
      throw new Error(`Failed to initialize audio engine: ${error}`);
    }
  }

  protected onDestroy(): void {
    if (this.audioEngine) {
      this.audioEngine.dispose();
    }
  }

  protected onDataUpdate(newData: Partial<AudioModuleData>): void {
    if (newData.tempo !== undefined) {
      this.tempo = newData.tempo;
      this.audioEngine.setTempo(this.tempo);
    }

    if (newData.volume !== undefined) {
      this.volume = newData.volume;
      this.audioEngine.setVolume(this.volume);
    }

    if (newData.pattern !== undefined) {
      this.pattern = newData.pattern;
      if (this.pattern) {
        // Convert pattern to string for audio engine
        const patternString = this.patternToString(this.pattern);
        this.audioEngine.loadPattern(patternString);
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
      this.audioEngine.play();
      this.isPlaying = true;
      this.setState({ lastUpdated: new Date() });
    } catch (error) {
      this.setError(`Play failed: ${error}`);
    }
  }

  pause(): void {
    try {
      this.audioEngine.pause();
      this.isPlaying = false;
      this.setState({ lastUpdated: new Date() });
    } catch (error) {
      this.setError(`Pause failed: ${error}`);
    }
  }

  stop(): void {
    try {
      this.audioEngine.stop();
      this.isPlaying = false;
      this.currentTime = 0;
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

  getAudioEngine(): AudioEngine {
    return this.audioEngine;
  }

  private startStateUpdates(): void {
    // Update state from audio engine periodically
    const updateInterval = setInterval(() => {
      if (this.isDestroyed) {
        clearInterval(updateInterval);
        return;
      }

      try {
        const engineState = this.audioEngine.getState();
        this.isPlaying = engineState.isPlaying;
        this.tempo = engineState.tempo;
        this.currentTime = engineState.currentTime;
        this.volume = engineState.volume;

        this.setState({ lastUpdated: new Date() });
      } catch (error) {
        console.error('Error updating audio state:', error);
      }
    }, 100);
  }

  private patternToString(pattern: ParsedPattern): string {
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
