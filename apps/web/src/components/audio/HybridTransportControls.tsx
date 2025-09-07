// Hybrid Transport Controls - Works with both Web Audio API and Tone.js
import React, { useState, useEffect } from 'react';
import { useHybridAudioEngine } from '../../hooks/useHybridAudioEngine';
// import { HybridAudioState } from '../../types/app'; // Not used in this component

interface HybridTransportControlsProps {
  className?: string;
  showEffects?: boolean;
  showPerformance?: boolean;
}

export const HybridTransportControls: React.FC<HybridTransportControlsProps> = ({
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
    setEffectEnabled,
    setEffectWet,
    getPerformanceMetrics
  } = useHybridAudioEngine();

  const [performanceMetrics, setPerformanceMetrics] = useState({ fps: 0, uptime: 0 });
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);

  // Update performance metrics
  useEffect(() => {
    if (showPerformance && state.isPlaying) {
      const interval = setInterval(() => {
        setPerformanceMetrics(getPerformanceMetrics());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showPerformance, state.isPlaying, getPerformanceMetrics]);

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
    const currentEnabled = state.effectsEnabled; // This would need to be more specific per effect
    setEffectEnabled(effectId, !currentEnabled);
  };

  const handleEffectWetChange = (effectId: string, wet: number) => {
    setEffectWet(effectId, wet);
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      {/* Main Transport Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Play/Pause Button */}
          <button
            onClick={handlePlayPause}
            disabled={!state.isInitialized || !!state.error}
            className={`
              w-12 h-12 rounded-full flex items-center justify-center text-xl
              transition-all duration-200
              ${state.isPlaying
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
              }
              ${!state.isInitialized || state.error
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:scale-105 active:scale-95'
              }
            `}
          >
            {state.isPlaying ? '⏸️' : '▶️'}
          </button>

          {/* Stop Button */}
          <button
            onClick={stop}
            disabled={!state.isInitialized || !!state.error}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center text-lg
              transition-all duration-200
              bg-gray-600 hover:bg-gray-700 text-white
              ${!state.isInitialized || state.error
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:scale-105 active:scale-95'
              }
            `}
          >
            ⏹️
          </button>
        </div>

        {/* Time Display */}
        <div className="text-center">
          <div className="text-2xl font-mono text-white">
            {formatTime(state.currentTime)}
          </div>
          <div className="text-sm text-gray-400">
            {state.isPlaying ? 'Playing' : state.isPaused ? 'Paused' : 'Stopped'}
          </div>
        </div>

        {/* Advanced Controls Toggle */}
        <button
          onClick={() => setShowAdvancedControls(!showAdvancedControls)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {showAdvancedControls ? '▼' : '▶'} Advanced
        </button>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded text-red-200 text-sm">
          <strong>Audio Error:</strong> {state.error}
        </div>
      )}

      {/* Advanced Controls */}
      {showAdvancedControls && (
        <div className="space-y-4 border-t border-gray-700 pt-4">
          {/* Tempo Control */}
          <div className="flex items-center space-x-3">
            <label className="text-white text-sm font-medium w-16">Tempo:</label>
            <input
              type="range"
              min="60"
              max="200"
              value={state.tempo}
              onChange={handleTempoChange}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-white text-sm font-mono w-12">
              {state.tempo} BPM
            </span>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-3">
            <label className="text-white text-sm font-medium w-16">Volume:</label>
            <input
              type="range"
              min="-60"
              max="0"
              value={state.volume}
              onChange={handleVolumeChange}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-white text-sm font-mono w-12">
              {state.volume} dB
            </span>
          </div>

          {/* Effects Controls */}
          {showEffects && (
            <div className="space-y-3">
              <h4 className="text-white text-sm font-medium">Effects</h4>

              {/* Reverb */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleEffectToggle('reverb')}
                  className={`
                    w-8 h-8 rounded flex items-center justify-center text-xs
                    ${state.effectsEnabled ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'}
                  `}
                >
                  R
                </button>
                <label className="text-white text-sm w-16">Reverb:</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  defaultValue="0.1"
                  onChange={(e) => handleEffectWetChange('reverb', parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Delay */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleEffectToggle('delay')}
                  className={`
                    w-8 h-8 rounded flex items-center justify-center text-xs
                    ${state.effectsEnabled ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'}
                  `}
                >
                  D
                </button>
                <label className="text-white text-sm w-16">Delay:</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  defaultValue="0.1"
                  onChange={(e) => handleEffectWetChange('delay', parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Compressor */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleEffectToggle('compressor')}
                  className={`
                    w-8 h-8 rounded flex items-center justify-center text-xs
                    ${state.effectsEnabled ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'}
                  `}
                >
                  C
                </button>
                <label className="text-white text-sm w-16">Comp:</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  defaultValue="0.8"
                  onChange={(e) => handleEffectWetChange('compressor', parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          {showPerformance && (
            <div className="space-y-2">
              <h4 className="text-white text-sm font-medium">Performance</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-gray-300">
                  <span className="text-gray-400">FPS:</span> {performanceMetrics.fps}
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-400">Uptime:</span> {Math.floor(performanceMetrics.uptime / 1000)}s
                </div>
              </div>
            </div>
          )}

          {/* Engine Status */}
          <div className="space-y-2">
            <h4 className="text-white text-sm font-medium">Engine Status</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-gray-300">
                <span className="text-gray-400">Initialized:</span> {state.isInitialized ? '✅' : '❌'}
              </div>
              <div className="text-gray-300">
                <span className="text-gray-400">Effects:</span> {state.effectsEnabled ? '✅' : '❌'}
              </div>
              <div className="text-gray-300">
                <span className="text-gray-400">Collaboration:</span> {state.collaborationEnabled ? '✅' : '❌'}
              </div>
              <div className="text-gray-300">
                <span className="text-gray-400">Quality:</span> {state.audioQuality}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
