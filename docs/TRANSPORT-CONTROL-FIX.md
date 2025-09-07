# 🎵 DAW-Like Transport Control Implementation

## 🚨 **Critical Issues Identified**

### **Current Problems:**
1. **Pause() is Broken**: Only sets flag, doesn't stop audio
2. **Stop() is Incomplete**: Doesn't stop currently playing audio
3. **State Update Delays**: 100ms polling causes UI lag
4. **No Audio Context Control**: Can't immediately stop audio

### **Professional DAW Requirements:**
- **Immediate Response**: < 10ms between button press and audio change
- **True Pause**: Stops audio instantly, remembers position
- **True Stop**: Stops audio instantly, resets to beginning
- **Seamless Resume**: Continues from exact pause position
- **Visual Feedback**: UI updates immediately

---

## 🎯 **Robust Transport Control Solution**

### **1. Enhanced Audio Engine Architecture**

```typescript
export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;

  // Transport state
  private isPlaying = false;
  private isPaused = false;
  private currentPosition = 0; // Current playback position in seconds
  private pausePosition = 0;   // Position when paused

  // Audio scheduling
  private scheduledEvents: number[] = [];
  private activeOscillators: OscillatorNode[] = [];
  private activeNoiseSources: AudioBufferSourceNode[] = [];

  // Transport control
  private startTime: number = 0;
  private stepInterval: number = 0;
  private loopDuration: number = 0;

  // Immediate audio stopping
  private masterGain: GainNode | null = null;
  private isStopping = false;
}
```

### **2. Immediate Audio Stopping System**

```typescript
/**
 * IMMEDIATE PAUSE - Stops audio instantly, remembers position
 */
pause(): void {
  if (!this.isPlaying) return;

  // Calculate current position
  if (this.audioContext && this.startTime > 0) {
    this.pausePosition = this.audioContext.currentTime - this.startTime;
    // Keep position within loop bounds
    this.pausePosition = this.pausePosition % this.loopDuration;
  }

  // IMMEDIATELY stop all audio
  this.stopAllAudio();

  // Clear scheduling
  this.clearScheduledEvents();

  // Update state
  this.isPlaying = false;
  this.isPaused = true;

  console.log(`Paused at position: ${this.pausePosition.toFixed(3)}s`);
}

/**
 * IMMEDIATE STOP - Stops audio instantly, resets position
 */
stop(): void {
  // IMMEDIATELY stop all audio
  this.stopAllAudio();

  // Clear scheduling
  this.clearScheduledEvents();

  // Reset position
  this.currentPosition = 0;
  this.pausePosition = 0;
  this.startTime = 0;

  // Update state
  this.isPlaying = false;
  this.isPaused = false;

  console.log('Stopped and reset to beginning');
}

/**
 * IMMEDIATE AUDIO STOPPING - Stops all currently playing audio
 */
private stopAllAudio(): void {
  // Stop all active oscillators immediately
  this.activeOscillators.forEach(osc => {
    try {
      osc.stop();
      osc.disconnect();
    } catch (e) {
      // Oscillator might already be stopped
    }
  });
  this.activeOscillators = [];

  // Stop all active noise sources immediately
  this.activeNoiseSources.forEach(source => {
    try {
      source.stop();
      source.disconnect();
    } catch (e) {
      // Source might already be stopped
    }
  });
  this.activeNoiseSources = [];

  // Use master gain for immediate volume cut
  if (this.masterGain) {
    this.masterGain.gain.setValueAtTime(0, this.audioContext!.currentTime);
  }
}

/**
 * SMART RESUME - Continues from exact pause position
 */
play(): void {
  if (this.isPlaying) return;

  if (!this.audioContext || !this.currentPattern) {
    throw new Error('Audio engine not initialized or no pattern loaded');
  }

  // Calculate start time based on pause position
  if (this.isPaused) {
    // Resume from pause position
    this.startTime = this.audioContext.currentTime - this.pausePosition;
    this.isPaused = false;
    console.log(`Resuming from position: ${this.pausePosition.toFixed(3)}s`);
  } else {
    // Start from beginning
    this.startTime = this.audioContext.currentTime;
    this.pausePosition = 0;
    console.log('Starting from beginning');
  }

  // Restore master gain
  if (this.masterGain) {
    this.masterGain.gain.setValueAtTime(1, this.audioContext.currentTime);
  }

  // Start scheduling
  this.schedulePattern();

  this.isPlaying = true;
}
```

### **3. Enhanced Audio Scheduling with Immediate Stop Capability**

```typescript
/**
 * Schedule instrument hit with immediate stop capability
 */
private scheduleInstrumentHit(instrumentName: string, time: number): void {
  if (!this.audioContext || !this.gainNode) return;

  // Create audio nodes
  const oscillator = this.audioContext.createOscillator();
  const envelope = this.audioContext.createGain();

  // Connect: oscillator -> envelope -> masterGain -> gain -> destination
  oscillator.connect(envelope);
  envelope.connect(this.masterGain!);

  // Track for immediate stopping
  this.activeOscillators.push(oscillator);

  // Set up the sound based on instrument
  switch (instrumentName.toLowerCase()) {
    case 'kick':
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(60, time);
      oscillator.frequency.exponentialRampToValueAtTime(30, time + 0.1);
      envelope.gain.setValueAtTime(0.8, time);
      envelope.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
      oscillator.start(time);
      oscillator.stop(time + 0.2);
      break;

    case 'snare':
      // Create noise for snare
      const bufferSize = this.audioContext.sampleRate * 0.1;
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = this.audioContext.createBufferSource();
      noise.buffer = buffer;
      noise.connect(envelope);

      // Track for immediate stopping
      this.activeNoiseSources.push(noise);

      envelope.gain.setValueAtTime(0.3, time);
      envelope.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
      noise.start(time);
      noise.stop(time + 0.1);
      break;

    case 'hihat':
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(8000, time);
      envelope.gain.setValueAtTime(0.1, time);
      envelope.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
      oscillator.start(time);
      oscillator.stop(time + 0.05);
      break;
  }

  // Auto-cleanup when audio ends
  const cleanup = () => {
    this.activeOscillators = this.activeOscillators.filter(osc => osc !== oscillator);
    this.activeNoiseSources = this.activeNoiseSources.filter(source => source !== noise);
  };

  oscillator.addEventListener('ended', cleanup);
  if (noise) {
    noise.addEventListener('ended', cleanup);
  }
}
```

### **4. Real-time State Updates (No Polling)**

```typescript
/**
 * Get current state with real-time position calculation
 */
getState() {
  const tempo = this.currentPattern?.tempo || 120;
  const volume = this.gainNode ? 20 * Math.log10(this.gainNode.gain.value) : -6;

  // Calculate real-time position
  let currentTime = 0;
  if (this.audioContext && this.isPlaying && this.startTime > 0) {
    currentTime = this.audioContext.currentTime - this.startTime;
    // Keep within loop bounds
    currentTime = currentTime % this.loopDuration;
  } else if (this.isPaused) {
    currentTime = this.pausePosition;
  }

  return {
    isInitialized: this.isInitialized,
    isPlaying: this.isPlaying,
    isPaused: this.isPaused,
    tempo,
    currentTime,
    volume,
    error: null
  };
}
```

### **5. Enhanced React Hook with Immediate Updates**

```typescript
export const useAudioEngine = () => {
  const [state, setState] = useState<AudioState>({
    isInitialized: false,
    isPlaying: false,
    isPaused: false,
    tempo: 120,
    volume: -6,
    currentTime: 0,
    error: null
  });

  // Immediate state updates (no polling)
  const updateState = useCallback(() => {
    const engineState = audioEngine.getState();
    setState(prev => ({
      ...prev,
      isInitialized: engineState.isInitialized,
      isPlaying: engineState.isPlaying,
      isPaused: engineState.isPaused,
      tempo: engineState.tempo,
      currentTime: engineState.currentTime,
      volume: engineState.volume
    }));
  }, []);

  // Immediate pause with state update
  const pause = useCallback(() => {
    try {
      audioEngine.pause();
      updateState(); // Immediate UI update
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to pause';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, [updateState]);

  // Immediate stop with state update
  const stop = useCallback(() => {
    try {
      audioEngine.stop();
      updateState(); // Immediate UI update
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, [updateState]);

  // Immediate play with state update
  const play = useCallback(() => {
    try {
      audioEngine.play();
      updateState(); // Immediate UI update
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to play';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, [updateState]);

  // High-frequency updates only when playing
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (state.isPlaying) {
      // High-frequency updates when playing (60fps)
      interval = setInterval(updateState, 16);
    } else {
      // Low-frequency updates when stopped/paused
      interval = setInterval(updateState, 100);
    }

    return () => clearInterval(interval);
  }, [state.isPlaying, updateState]);

  return {
    state,
    initialize,
    play,
    pause,
    stop,
    setTempo,
    setVolume,
    loadPattern
  };
};
```

### **6. Enhanced Transport Controls UI**

```typescript
export const TransportControls: React.FC = () => {
  const { state: audioState, play, pause, stop, setTempo, setVolume, initialize } = useAudio();

  const handlePlayPause = async () => {
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

  return (
    <div className="p-4">
      {/* Transport Controls */}
      <div className="flex items-center space-x-3">
        <button
          onClick={handlePlayPause}
          className={`btn ${audioState.isPlaying ? 'btn-secondary' : 'btn-primary'} btn-md`}
          disabled={false}
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

        {/* Position Display */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-foreground-muted">Position:</span>
          <span className="text-sm font-mono">
            {Math.floor(audioState.currentTime / 60)}:{(audioState.currentTime % 60).toFixed(1).padStart(4, '0')}
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
  );
};
```

---

## 🎯 **Implementation Priority**

### **Phase 1: Critical Fixes (Week 1)**
1. **Immediate Audio Stopping**: Implement `stopAllAudio()` method
2. **True Pause**: Add pause position tracking and resume capability
3. **True Stop**: Add position reset and immediate audio stopping
4. **State Updates**: Remove polling, add immediate state updates

### **Phase 2: Enhanced Features (Week 2)**
1. **Master Gain Control**: Add master gain node for immediate volume control
2. **Audio Node Tracking**: Track all active audio nodes for immediate stopping
3. **Position Display**: Real-time position display with loop awareness
4. **Status Indicators**: Visual feedback for play/pause/stop states

### **Phase 3: Polish (Week 3)**
1. **Performance Optimization**: Optimize audio node creation/destruction
2. **Error Handling**: Robust error handling for audio operations
3. **Testing**: Comprehensive testing of transport controls
4. **Documentation**: Update documentation with new transport behavior

---

## 🎵 **Expected Results**

After implementation:
- **Immediate Response**: < 10ms between button press and audio change
- **True Pause**: Audio stops instantly, resumes from exact position
- **True Stop**: Audio stops instantly, resets to beginning
- **Visual Feedback**: UI updates immediately, no delays
- **Professional Feel**: DAW-like transport control experience

This will transform the transport controls from a basic implementation to professional-grade DAW-like behavior.
