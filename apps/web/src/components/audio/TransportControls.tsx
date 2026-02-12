import React from 'react';
import { useAudio } from '../../contexts/AppContext';

export const TransportControls: React.FC = () => {
  const { state: audioState, play, pause, stop, setTempo, setVolume, initialize, setOverflowMode } = useAudio();

  const handlePlayPause = async () => {
    // If not initialized, try to initialize first
    if (!audioState.isInitialized) {
      try {
        await initialize();
      } catch (error) {
        console.error('Failed to initialize audio:', error);
        return;
      }
    }

    if (audioState.isPlaying) {
      pause(); // Immediate response
    } else {
      play(); // Immediate response
    }
  };

  const handleStop = () => {
    if (audioState.isInitialized) {
      stop(); // Immediate response
    }
  };

  const handleTempoChange = (newTempo: number) => {
    if (audioState.isInitialized) {
      setTempo(newTempo);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (audioState.isInitialized) {
      // Convert 0-100 to -60 to 0 dB
      const dbVolume = (newVolume / 100) * 60 - 60;
      setVolume(dbVolume);
    }
  };

  const handleOverflowToggle = (mode: 'loop' | 'rest') => {
    if (audioState.isInitialized && setOverflowMode) {
      setOverflowMode(mode);
    }
  };

  // Convert dB volume back to 0-100 for display
  const displayVolume = Math.round(((audioState.volume + 60) / 60) * 100);
  const displayTime = audioState.currentTime;

  return (
    <div className="p-3 sm:p-4">
      {/* Status Messages */}
      {audioState.error && (
        <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
          Audio Error: {audioState.error}
        </div>
      )}

      {!audioState.isInitialized && !audioState.error && (
        <div className="mb-3 p-2 bg-blue-100 border border-blue-300 rounded text-blue-700 text-sm">
          Click anywhere to enable audio
        </div>
      )}

      {/* Main Controls */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayPause}
            className={`btn ${audioState.isPlaying ? 'btn-secondary' : 'btn-primary'} w-12 h-12 text-lg`}
            disabled={false}
            title={audioState.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {audioState.isPlaying ? '⏸️' : '▶️'}
          </button>

          <button
            onClick={handleStop}
            className="btn btn-secondary btn-md"
            disabled={!audioState.isInitialized}
            title="Stop (Escape)"
          >
            ⏹️
          </button>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${
            audioState.isPlaying ? 'bg-green-500' :
            audioState.isPaused ? 'bg-yellow-500' : 'bg-gray-500'
          }`} />
          <span className="text-xs text-foreground-muted">
            {audioState.isPlaying ? 'Playing' :
             audioState.isPaused ? 'Paused' : 'Stopped'}
          </span>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 bg-border" />

        {/* Tempo Control */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-foreground-muted">Tempo:</span>
          <input
            type="number"
            value={audioState.tempo}
            onChange={(e) => handleTempoChange(Number(e.target.value))}
            className="input w-16 text-center text-sm"
            min="60"
            max="200"
            disabled={!audioState.isInitialized}
          />
          <span className="text-xs text-foreground-muted">BPM</span>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 bg-border" />

        {/* Volume */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-foreground-muted">Vol:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={displayVolume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="w-16"
            disabled={!audioState.isInitialized}
          />
          <span className="text-xs text-foreground-muted w-6">{displayVolume}%</span>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 bg-border" />

        {/* Overflow Mode */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-foreground-muted">Steps:</span>
          <div className="inline-flex rounded border border-border overflow-hidden">
            <button
              className={`px-2 py-1 text-xs ${audioState.overflowMode === 'loop' ? 'bg-background-secondary' : ''}`}
              onClick={() => handleOverflowToggle('loop')}
              disabled={!audioState.isInitialized}
              title="Shorter tracks wrap to the start"
            >
              Loop
            </button>
            <button
              className={`px-2 py-1 text-xs border-l border-border ${audioState.overflowMode === 'rest' ? 'bg-background-secondary' : ''}`}
              onClick={() => handleOverflowToggle('rest')}
              disabled={!audioState.isInitialized}
              title="Shorter tracks remain silent beyond their length"
            >
              Rest
            </button>
          </div>
        </div>

        {/* Position */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-sm text-foreground-muted">Position:</span>
          <span className="text-sm font-mono">
            {Math.floor(displayTime / 60)}:{(displayTime % 60).toFixed(1).padStart(4, '0')}
          </span>
        </div>
      </div>
    </div>
  );
};
