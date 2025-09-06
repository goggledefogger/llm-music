import React, { useState, useEffect } from 'react';
import { useAudioEngine } from '../../hooks/useAudioEngine';

export const TransportControls: React.FC = () => {
  const audioEngine = useAudioEngine();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize audio engine on first user interaction
  useEffect(() => {
    const handleFirstInteraction = async () => {
      if (!isInitialized && !audioEngine.state.isInitialized) {
        try {
          await audioEngine.initialize();
          setIsInitialized(true);
        } catch (error) {
          console.error('Failed to initialize audio:', error);
        }
      }
    };

    // Add event listeners for user interaction
    const events = ['click', 'keydown', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleFirstInteraction, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleFirstInteraction);
      });
    };
  }, [audioEngine, isInitialized]);

  const handlePlayPause = () => {
    if (!audioEngine.state.isInitialized) {
      return;
    }

    if (audioEngine.state.isPlaying) {
      audioEngine.pause();
    } else {
      audioEngine.play();
    }
  };

  const handleStop = () => {
    if (audioEngine.state.isInitialized) {
      audioEngine.stop();
    }
  };

  const handleTempoChange = (newTempo: number) => {
    if (audioEngine.state.isInitialized) {
      audioEngine.setTempo(newTempo);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (audioEngine.state.isInitialized) {
      // Convert 0-100 to -60 to 0 dB
      const dbVolume = (newVolume / 100) * 60 - 60;
      audioEngine.setVolume(dbVolume);
    }
  };

  // Convert dB volume back to 0-100 for display
  const displayVolume = Math.round(((audioEngine.state.volume + 60) / 60) * 100);
  const displayTime = Math.floor(audioEngine.state.currentTime);

  return (
    <div className="p-4 bg-background-secondary">
      {audioEngine.state.error && (
        <div className="mb-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
          Audio Error: {audioEngine.state.error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePlayPause}
            className={`btn ${audioEngine.state.isPlaying ? 'btn-secondary' : 'btn-primary'} btn-md`}
            disabled={!audioEngine.state.isInitialized}
          >
            {audioEngine.state.isPlaying ? '⏸️' : '▶️'}
          </button>

          <button
            onClick={handleStop}
            className="btn btn-secondary btn-md"
            disabled={!audioEngine.state.isInitialized}
          >
            ⏹️
          </button>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-foreground-muted">Tempo:</span>
            <input
              type="number"
              value={audioEngine.state.tempo}
              onChange={(e) => handleTempoChange(Number(e.target.value))}
              className="input w-20 text-center"
              min="60"
              max="200"
              disabled={!audioEngine.state.isInitialized}
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
              disabled={!audioEngine.state.isInitialized}
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

      {!audioEngine.state.isInitialized && (
        <div className="mt-2 text-xs text-foreground-muted">
          Click anywhere to initialize audio
        </div>
      )}
    </div>
  );
};

