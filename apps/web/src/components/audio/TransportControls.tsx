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
    <div className="transport-bar p-3 sm:p-4">
      {/* Status Messages */}
      {audioState.error && (
        <div className="mb-3 px-3 py-2 bg-error/10 border border-error/30 rounded-md text-error text-sm">
          Audio Error: {audioState.error}
        </div>
      )}

      {!audioState.isInitialized && !audioState.error && (
        <div className="mb-3 px-3 py-2 bg-info/10 border border-info/30 rounded-md text-info text-sm">
          Click anywhere to enable audio
        </div>
      )}

      {/* Main Controls */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Playback Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePlayPause}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-150 ${
              audioState.isPlaying
                ? 'bg-foreground/10 text-foreground hover:bg-foreground/15'
                : 'bg-accent text-background hover:bg-accent-secondary hover:shadow-lg hover:shadow-accent/25'
            }`}
            disabled={false}
            title={audioState.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {audioState.isPlaying ? (
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

          <button
            onClick={handleStop}
            className="w-8 h-8 rounded-md flex items-center justify-center bg-background-tertiary text-foreground-secondary border border-border hover:bg-background-elevated hover:text-foreground transition-all duration-150 disabled:opacity-40"
            disabled={!audioState.isInitialized}
            title="Stop (Escape)"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="1" y="1" width="10" height="10" rx="1.5" />
            </svg>
          </button>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full transition-colors ${
            audioState.isPlaying ? 'bg-accent shadow-sm shadow-accent/50 status-dot-playing' :
            audioState.isPaused ? 'bg-warning' : 'bg-foreground-muted'
          }`} />
          <span className="text-xs text-foreground-muted font-medium">
            {audioState.isPlaying ? 'Playing' :
             audioState.isPaused ? 'Paused' : 'Stopped'}
          </span>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 bg-border" />

        {/* Tempo Control */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-foreground-muted font-medium uppercase tracking-wide">BPM</span>
          <input
            type="number"
            value={audioState.tempo}
            onChange={(e) => handleTempoChange(Number(e.target.value))}
            className="input w-16 h-7 text-center text-sm font-mono bg-background border-border"
            min="60"
            max="200"
            disabled={!audioState.isInitialized}
          />
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 bg-border" />

        {/* Volume */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-foreground-muted font-medium uppercase tracking-wide">Vol</span>
          <input
            type="range"
            min="0"
            max="100"
            value={displayVolume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="w-20"
            disabled={!audioState.isInitialized}
          />
          <span className="text-xs text-foreground-muted font-mono w-8 text-right">{displayVolume}%</span>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 bg-border" />

        {/* Overflow Mode */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-foreground-muted font-medium uppercase tracking-wide">Mode</span>
          <div className="inline-flex rounded-md border border-border overflow-hidden">
            <button
              className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                audioState.overflowMode === 'loop'
                  ? 'bg-accent/15 text-accent border-accent/20'
                  : 'text-foreground-muted hover:text-foreground hover:bg-background-tertiary'
              }`}
              onClick={() => handleOverflowToggle('loop')}
              disabled={!audioState.isInitialized}
              title="Shorter tracks wrap to the start"
            >
              Loop
            </button>
            <button
              className={`px-2.5 py-1 text-xs font-medium border-l border-border transition-colors ${
                audioState.overflowMode === 'rest'
                  ? 'bg-accent/15 text-accent border-accent/20'
                  : 'text-foreground-muted hover:text-foreground hover:bg-background-tertiary'
              }`}
              onClick={() => handleOverflowToggle('rest')}
              disabled={!audioState.isInitialized}
              title="Shorter tracks remain silent beyond their length"
            >
              Rest
            </button>
          </div>
        </div>

        {/* Position Display */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-sm font-mono text-foreground tabular-nums bg-background px-2.5 py-1 rounded-md border border-border">
            {Math.floor(displayTime / 60)}:{(displayTime % 60).toFixed(1).padStart(4, '0')}
          </span>
        </div>
      </div>
    </div>
  );
};
