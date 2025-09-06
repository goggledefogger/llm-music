import React from 'react';
import { useAudio, usePattern } from '../../contexts/AppContext';
import { PlayheadIndicator, WaveformDisplay } from '../visualizations';

export const TransportControls: React.FC = () => {
  const { state: audioState, play, pause, stop, setTempo, setVolume, initialize } = useAudio();
  const { parsedPattern } = usePattern();

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
      pause();
    } else {
      play();
    }
  };

  const handleStop = () => {
    if (audioState.isInitialized) {
      stop();
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
  const displayTime = Math.floor(audioState.currentTime);

  return (
    <div className="bg-background-secondary">
      {/* Audio Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        <PlayheadIndicator
          pattern={parsedPattern}
          currentTime={audioState.currentTime}
          isPlaying={audioState.isPlaying}
          tempo={audioState.tempo}
        />
        <WaveformDisplay
          pattern={parsedPattern}
          currentTime={audioState.currentTime}
          isPlaying={audioState.isPlaying}
          tempo={audioState.tempo}
        />
      </div>

      {/* Transport Controls */}
      <div className="p-4 border-t border-border">
        {audioState.error && (
          <div className="mb-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
            Audio Error: {audioState.error}
          </div>
        )}

        {!audioState.isInitialized && !audioState.error && (
          <div className="mb-2 p-2 bg-blue-100 border border-blue-300 rounded text-blue-700 text-sm">
            Click anywhere on the page to enable audio, or click the play button below.
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
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

            <div className="flex items-center space-x-2">
              <span className="text-sm text-foreground-muted">Tempo:</span>
              <input
                type="number"
                value={audioState.tempo}
                onChange={(e) => handleTempoChange(Number(e.target.value))}
                className="input w-20 text-center"
                min="60"
                max="200"
                disabled={!audioState.isInitialized}
              />
              <span className="text-sm text-foreground-muted">BPM</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-foreground-muted">Volume:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={displayVolume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-20"
                disabled={!audioState.isInitialized}
              />
              <span className="text-sm text-foreground-muted w-8">{displayVolume}%</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-foreground-muted">Time:</span>
              <span className="text-sm font-mono">
                {Math.floor(displayTime / 60)}:{(displayTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        {!audioState.isInitialized && (
          <div className="mt-2 text-xs text-foreground-muted">
            Click anywhere to initialize audio
          </div>
        )}
      </div>
    </div>
  );
};

