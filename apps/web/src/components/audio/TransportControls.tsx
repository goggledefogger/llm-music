import React from 'react';
import { useAudio } from '../../contexts/AppContext';

export const TransportControls: React.FC = () => {
  const { state: audioState, play, pause, stop, setTempo, setVolume, initialize } = useAudio();

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

  // Convert dB volume back to 0-100 for display
  const displayVolume = Math.round(((audioState.volume + 60) / 60) * 100);
  const displayTime = audioState.currentTime;

  return (
    <div className="p-4">
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
      <div className="flex items-center justify-between">
        {/* Playback Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePlayPause}
            className={`btn ${audioState.isPlaying ? 'btn-secondary' : 'btn-primary'} btn-md`}
            disabled={false} // Allow clicking to trigger initialization
          >
            {audioState.isPlaying ? '⏸️' : '▶️'}
          </button>

          <button
            onClick={handleStop}
            className="btn btn-secondary btn-md"
            disabled={!audioState.isInitialized}
          >
            ⏹️
          </button>

          {/* Tempo Control */}
          <div className="flex items-center space-x-2">
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
        </div>

        {/* Volume and Time */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
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

          <div className="flex items-center space-x-2">
            <span className="text-sm text-foreground-muted">Position:</span>
            <span className="text-sm font-mono">
              {Math.floor(displayTime / 60)}:{(displayTime % 60).toFixed(1).padStart(4, '0')}
            </span>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              audioState.isPlaying ? 'bg-green-500' :
              audioState.isPaused ? 'bg-yellow-500' : 'bg-gray-500'
            }`} />
            <span className="text-xs text-foreground-muted">
              {audioState.isPlaying ? 'Playing' :
               audioState.isPaused ? 'Paused' : 'Stopped'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

