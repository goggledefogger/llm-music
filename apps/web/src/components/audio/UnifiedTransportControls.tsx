// Transport Controls - Uses Unified Audio Engine
import React, { useState, useEffect } from 'react';
import { useUnifiedAudioEngine } from '../../hooks/useUnifiedAudioEngine';

interface TransportControlsProps {
  className?: string;
  showEffects?: boolean;
  showPerformance?: boolean;
}

export const UnifiedTransportControls: React.FC<TransportControlsProps> = ({
  className = '',
  showEffects = true,
  showPerformance = false
}) => {
  const {
    state,
    initialize,
    play,
    pause,
    stop,
    setTempo,
    setVolume,
    updateParameter,
    // getParameterHistory
  } = useUnifiedAudioEngine();

  const [performanceMetrics, setPerformanceMetrics] = useState({ fps: 0, uptime: 0 });
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);

  // Update performance metrics (simplified for unified engine)
  useEffect(() => {
    if (showPerformance && state.isPlaying) {
      const interval = setInterval(() => {
        // Unified engine doesn't have performance metrics yet
        setPerformanceMetrics({ fps: 60, uptime: Date.now() });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showPerformance, state.isPlaying]);

  // Auto-initialize on mount
  useEffect(() => {
    if (!state.isInitialized && !state.error) {
      initialize();
    }
  }, [state.isInitialized, state.error, initialize]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleTempoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const tempo = parseInt(event.target.value);
    setTempo(tempo);
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseInt(event.target.value);
    setVolume(volume);
  };

  const handleEffectToggle = (effectId: string) => {
    const currentEnabled = state.effectsEnabled;
    updateParameter('effects', { [effectId]: { enabled: !currentEnabled } });
  };

  const handleEffectWetChange = (effectId: string, wet: number) => {
    updateParameter('effects', { [effectId]: { wet } });
  };

  return (
    <div className={`transport-bar rounded-lg p-4 ${className}`}>
      {/* Main Transport Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Play/Pause Button */}
          <button
            onClick={handlePlayPause}
            disabled={!state.isInitialized || !!state.error}
            className={`
              w-12 h-12 rounded-full flex items-center justify-center text-xl
              transition-all duration-150
              ${state.isPlaying
                ? 'bg-foreground/10 text-foreground hover:bg-foreground/15'
                : 'bg-accent text-background hover:bg-accent-secondary hover:shadow-lg hover:shadow-accent/25'
              }
              ${!state.isInitialized || state.error
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:scale-105 active:scale-95'
              }
            `}
          >
            {state.isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="3" y="2" width="4" height="12" rx="1" />
                <rect x="9" y="2" width="4" height="12" rx="1" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="ml-0.5">
                <path d="M4 2.5v11l10-5.5z" />
              </svg>
            )}
          </button>

          {/* Stop Button */}
          <button
            onClick={stop}
            disabled={!state.isInitialized || !!state.error}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center
              transition-all duration-150
              bg-background-tertiary text-foreground-secondary border border-border hover:bg-background-elevated hover:text-foreground
              ${!state.isInitialized || state.error
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:scale-105 active:scale-95'
              }
            `}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="1" y="1" width="10" height="10" rx="1.5" />
            </svg>
          </button>
        </div>

        {/* Time Display */}
        <div className="text-center">
          <div className="text-2xl font-mono text-foreground tabular-nums">
            {formatTime(state.currentTime)}
          </div>
          <div className="text-sm text-foreground-muted">
            {state.isPlaying ? 'Playing' : state.isPaused ? 'Paused' : 'Stopped'}
          </div>
        </div>

        {/* Advanced Controls Toggle */}
        <button
          onClick={() => setShowAdvancedControls(!showAdvancedControls)}
          className="text-foreground-muted hover:text-foreground transition-colors text-sm"
        >
          {showAdvancedControls ? '▼' : '▶'} Advanced
        </button>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded text-error text-sm">
          <strong>Audio Error:</strong> {state.error}
        </div>
      )}

      {/* Advanced Controls */}
      {showAdvancedControls && (
        <div className="space-y-4 border-t border-border pt-4">
          {/* Tempo Control */}
          <div className="flex items-center space-x-3">
            <label className="text-foreground text-sm font-medium w-16">Tempo:</label>
            <input
              type="range"
              min="60"
              max="200"
              value={state.tempo}
              onChange={handleTempoChange}
              className="flex-1"
            />
            <span className="text-foreground text-sm font-mono w-16 text-right">
              {state.tempo} BPM
            </span>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-3">
            <label className="text-foreground text-sm font-medium w-16">Volume:</label>
            <input
              type="range"
              min="-60"
              max="0"
              value={state.volume}
              onChange={handleVolumeChange}
              className="flex-1"
            />
            <span className="text-foreground text-sm font-mono w-16 text-right">
              {state.volume} dB
            </span>
          </div>

          {/* Effects Controls */}
          {showEffects && (
            <div className="space-y-3">
              <h4 className="text-foreground text-sm font-medium">Effects</h4>

              {/* Reverb */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleEffectToggle('reverb')}
                  className={`
                    w-8 h-8 rounded flex items-center justify-center text-xs font-medium
                    ${state.effectsEnabled ? 'bg-accent/15 text-accent border border-accent/20' : 'bg-background-tertiary text-foreground-muted border border-border'}
                  `}
                >
                  R
                </button>
                <label className="text-foreground text-sm w-16">Reverb:</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  defaultValue="0.1"
                  onChange={(e) => handleEffectWetChange('reverb', parseFloat(e.target.value))}
                  className="flex-1"
                />
              </div>

              {/* Delay */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleEffectToggle('delay')}
                  className={`
                    w-8 h-8 rounded flex items-center justify-center text-xs font-medium
                    ${state.effectsEnabled ? 'bg-accent/15 text-accent border border-accent/20' : 'bg-background-tertiary text-foreground-muted border border-border'}
                  `}
                >
                  D
                </button>
                <label className="text-foreground text-sm w-16">Delay:</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  defaultValue="0.1"
                  onChange={(e) => handleEffectWetChange('delay', parseFloat(e.target.value))}
                  className="flex-1"
                />
              </div>

              {/* Compressor */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleEffectToggle('compressor')}
                  className={`
                    w-8 h-8 rounded flex items-center justify-center text-xs font-medium
                    ${state.effectsEnabled ? 'bg-accent/15 text-accent border border-accent/20' : 'bg-background-tertiary text-foreground-muted border border-border'}
                  `}
                >
                  C
                </button>
                <label className="text-foreground text-sm w-16">Comp:</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  defaultValue="0.8"
                  onChange={(e) => handleEffectWetChange('compressor', parseFloat(e.target.value))}
                  className="flex-1"
                />
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          {showPerformance && (
            <div className="space-y-2">
              <h4 className="text-foreground text-sm font-medium">Performance</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-foreground-secondary">
                  <span className="text-foreground-muted">FPS:</span> {performanceMetrics.fps}
                </div>
                <div className="text-foreground-secondary">
                  <span className="text-foreground-muted">Uptime:</span> {Math.floor(performanceMetrics.uptime / 1000)}s
                </div>
              </div>
            </div>
          )}

          {/* Engine Status */}
          <div className="space-y-2">
            <h4 className="text-foreground text-sm font-medium">Engine Status</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-foreground-secondary">
                <span className="text-foreground-muted">Initialized:</span> {state.isInitialized ? 'Yes' : 'No'}
              </div>
              <div className="text-foreground-secondary">
                <span className="text-foreground-muted">Effects:</span> {state.effectsEnabled ? 'On' : 'Off'}
              </div>
              <div className="text-foreground-secondary">
                <span className="text-foreground-muted">Collaboration:</span> Off
              </div>
              <div className="text-foreground-secondary">
                <span className="text-foreground-muted">Quality:</span> {state.audioQuality}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
