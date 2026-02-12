import React, { useRef, useEffect, useState } from 'react';
import { ParsedPattern } from '../../../types/app';
import { BaseVisualization } from '../BaseVisualization';

interface WaveformDisplayProps {
  pattern: ParsedPattern | null;
  currentTime: number;
  isPlaying: boolean;
  tempo: number;
  className?: string;
}

export const WaveformDisplay: React.FC<WaveformDisplayProps> = ({
  pattern,
  currentTime,
  isPlaying,
  tempo,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  // Generate synthetic waveform data based on pattern
  useEffect(() => {
    if (!pattern) {
      setWaveformData([]);
      return;
    }

    const generateWaveform = () => {
      const sampleRate = 44100;
      const duration = 4; // 4 seconds
      const samples = sampleRate * duration;
      const waveform: number[] = [];
      
      const instruments = Object.keys(pattern.instruments);
      const maxSteps = Math.max(...instruments.map(inst => pattern.instruments[inst].steps.length), 16);
      const stepDuration = duration / maxSteps;

      for (let i = 0; i < samples; i++) {
        const time = i / sampleRate;
        const stepIndex = Math.floor(time / stepDuration) % maxSteps;
        let amplitude = 0;

        // Sum up all active instruments at this time
        instruments.forEach(instrument => {
          const instrumentData = pattern.instruments[instrument];
          if (stepIndex < instrumentData.steps.length && instrumentData.steps[stepIndex]) {
            // Generate different waveforms for different instruments
            const frequency = instrument === 'kick' ? 60 : instrument === 'snare' ? 200 : 800;
            const wave = Math.sin(2 * Math.PI * frequency * time) * 0.3;
            amplitude += wave;
          }
        });

        waveform.push(amplitude);
      }

      setWaveformData(waveform);
    };

    generateWaveform();
  }, [pattern]);

  // Draw waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#111114';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = '#2a2a32';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 16; i++) {
      const x = (i / 16) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw center line
    ctx.strokeStyle = '#383842';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Draw waveform
    ctx.strokeStyle = '#00e87b';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const samplesPerPixel = waveformData.length / width;
    for (let x = 0; x < width; x++) {
      const sampleIndex = Math.floor(x * samplesPerPixel);
      const amplitude = waveformData[sampleIndex] || 0;
      const y = centerY - (amplitude * centerY * 0.8);
      
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw playhead
    if (isPlaying && pattern) {
      const maxSteps = Math.max(...Object.values(pattern.instruments).map(inst => inst.steps.length), 16);
      const stepDuration = 4 / maxSteps; // 4 seconds total
      const currentStep = Math.floor(currentTime / stepDuration);
      const playheadX = (currentStep / maxSteps) * width;

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
    }

  }, [waveformData, currentTime, isPlaying, pattern]);

  if (!pattern) {
    return (
      <div className={`p-4 text-center text-foreground-muted ${className}`}>
        <p>No pattern loaded</p>
        <p className="text-sm">Load a pattern to see the waveform visualization</p>
      </div>
    );
  }

  return (
    <BaseVisualization
      className={className}
      description={`${isPlaying ? 'Playing' : 'Stopped'} • ${tempo} BPM`}
      variant="ultra-compact"
    >

      {/* Waveform Canvas */}
      <div className="mb-3">
        <canvas
          ref={canvasRef}
          width={400}
          height={120}
          className="w-full h-24 bg-background rounded border border-border"
        />
      </div>

      {/* Waveform Info */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-foreground-muted">Duration:</span>
          <div className="font-mono text-xs">4.0s</div>
        </div>
        <div>
          <span className="text-foreground-muted">Sample Rate:</span>
          <div className="font-mono text-xs">44.1 kHz</div>
        </div>
        <div>
          <span className="text-foreground-muted">Current Time:</span>
          <div className="font-mono text-xs">
            {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(1).padStart(4, '0')}
          </div>
        </div>
      </div>

      {/* Pattern Structure Overlay */}
      <div className="mt-3 p-2 bg-background rounded">
        <h4 className="text-sm font-semibold mb-1">Pattern Structure</h4>
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.keys(pattern.instruments).map((instrument) => {
            const instrumentData = pattern.instruments[instrument];
            const activeSteps = instrumentData.steps.filter(Boolean).length;
            const totalSteps = instrumentData.steps.length;
            
            return (
              <div key={instrument} className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded ${
                  instrument === 'kick' ? 'bg-audio-kick' :
                  instrument === 'snare' ? 'bg-audio-snare' :
                  instrument === 'hihat' || instrument === 'hat' ? 'bg-audio-hihat' :
                  instrument === 'pad' ? 'bg-audio-pad' :
                  instrument === 'bass' ? 'bg-audio-bass' :
                  'bg-foreground-muted'
                }`} />
                <span className="capitalize">{instrument}</span>
                <span className="text-foreground-muted">({activeSteps}/{totalSteps})</span>
              </div>
            );
          })}
        </div>
      </div>
    </BaseVisualization>
  );
};
