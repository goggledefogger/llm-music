import React, { useState } from 'react';

export const TransportControls: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [volume, setVolume] = useState(80);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    setIsPlaying(false);
  };

  return (
    <div className="p-4 bg-background-secondary">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePlayPause}
            className={`btn ${isPlaying ? 'btn-secondary' : 'btn-primary'} btn-md`}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>

          <button
            onClick={handleStop}
            className="btn btn-secondary btn-md"
          >
            ⏹️
          </button>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-foreground-muted">Tempo:</span>
            <input
              type="number"
              value={tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
              className="input w-20 text-center"
              min="60"
              max="200"
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
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-foreground-muted w-8">{volume}%</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-foreground-muted">Time:</span>
            <span className="text-sm font-mono">0:00</span>
          </div>
        </div>
      </div>
    </div>
  );
};
