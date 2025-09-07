# 🎵 Tone.js Integration Guide - Development Team

## 📋 **Overview**

This guide provides detailed instructions for integrating Tone.js into the ASCII Generative Sequencer's audio pipeline, creating a hybrid architecture that combines custom Web Audio API synthesis with professional-grade effects and transport.

## 🎯 **Integration Strategy**

### **Hybrid Approach**
- **Custom Web Audio API**: Critical timing and high-performance synthesis
- **Tone.js**: Professional effects, transport, and complex timing
- **State Synchronization**: Collaborative features without audio streaming

### **Key Benefits**
- ✅ **Professional Quality**: Tone.js effects and transport
- ✅ **High Performance**: Custom Web Audio API synthesis
- ✅ **Collaborative**: Real-time multi-user sessions
- ✅ **Efficient**: State sync vs audio streaming (10x bandwidth savings)
- ✅ **Future-Proof**: Scalable architecture

---

## 📦 **Dependencies & Installation**

### **Package.json Updates**

```json
{
  "dependencies": {
    "tone": "^14.7.77",
    "socket.io-client": "^4.7.4",
    "sharedarraybuffer-polyfill": "^1.0.0"
  }
}
```

### **Installation Commands**

```bash
# Install new dependencies
pnpm add tone@^14.7.77 socket.io-client@^4.7.4 sharedarraybuffer-polyfill@^1.0.0

# Install types (if needed)
pnpm add -D @types/tone
```

### **Bundle Size Optimization**

```typescript
// apps/web/src/services/audioEngine.ts
// Import only what you need to minimize bundle size
import {
  Transport,
  EffectsChain,
  EQ3,
  Compressor,
  FeedbackDelay,
  Reverb,
  Limiter,
  StereoWidener
} from 'tone';

// Tree-shaking will remove unused code
```

---

## 🏗️ **Architecture Implementation**

### **Hybrid Audio Engine Structure**

```typescript
// apps/web/src/services/hybridAudioEngine.ts
import * as Tone from 'tone';
import { AudioEngine } from './audioEngine'; // Existing custom engine
import { StateSyncManager } from './stateSyncManager';
import { EffectsChainManager } from './effectsChainManager';

export class HybridAudioEngine {
  // Core Audio Context (Web Audio API)
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;

  // Tone.js Integration
  private toneTransport: Tone.Transport;
  private effectsChain: Tone.EffectsChain;
  private masterEffects: Tone.EffectsChain;

  // Custom Synthesis (Web Audio API)
  private customEngine: AudioEngine;
  private customSynthesizers: Map<string, CustomSynthesizer>;

  // Collaboration
  private stateSync: StateSyncManager;
  private effectsManager: EffectsChainManager;

  constructor() {
    // Initialize Tone.js
    this.toneTransport = Tone.getTransport();
    this.effectsChain = new Tone.EffectsChain();
    this.masterEffects = new Tone.EffectsChain();

    // Initialize custom engine
    this.customEngine = new AudioEngine();
    this.customSynthesizers = new Map();

    // Initialize collaboration
    this.stateSync = new StateSyncManager();
    this.effectsManager = new EffectsChainManager();
  }

  async initialize(): Promise<void> {
    // Initialize Web Audio API
    this.audioContext = new AudioContext();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);

    // Initialize Tone.js
    await Tone.start();

    // Initialize custom engine
    await this.customEngine.initialize();

    // Initialize collaboration
    await this.stateSync.initialize();

    // Connect custom engine to Tone.js effects
    this.connectCustomToTone();
  }

  private connectCustomToTone(): void {
    // Connect custom synthesizers to Tone.js effects chain
    this.customSynthesizers.forEach((synthesizer, instrument) => {
      const instrumentChain = this.effectsManager.createInstrumentChain(instrument);
      synthesizer.connect(instrumentChain);
      instrumentChain.connect(this.masterEffects);
    });

    // Connect master effects to output
    this.masterEffects.connect(this.gainNode);
  }
}
```

### **Effects Chain Manager**

```typescript
// apps/web/src/services/effectsChainManager.ts
import * as Tone from 'tone';

export class EffectsChainManager {
  private chains: Map<string, Tone.EffectsChain> = new Map();
  private masterChain: Tone.EffectsChain;

  constructor() {
    this.masterChain = new Tone.EffectsChain(
      new Tone.Limiter(),       // Master limiting
      new Tone.StereoWidener()  // Stereo imaging
    );
  }

  createInstrumentChain(instrument: string): Tone.EffectsChain {
    const chain = new Tone.EffectsChain(
      new Tone.EQ3(),           // 3-band EQ
      new Tone.Compressor(),    // Compression
      new Tone.FeedbackDelay(), // Delay
      new Tone.Reverb()         // Reverb
    );

    this.chains.set(instrument, chain);
    return chain;
  }

  addEffectToInstrument(instrument: string, effect: Tone.Effect): void {
    const chain = this.chains.get(instrument);
    if (chain) {
      chain.add(effect);
    }
  }

  removeEffectFromInstrument(instrument: string, effectId: string): void {
    const chain = this.chains.get(instrument);
    if (chain) {
      chain.remove(effectId);
    }
  }

  setEffectParameter(instrument: string, effectId: string, param: string, value: number): void {
    const chain = this.chains.get(instrument);
    if (chain) {
      const effect = chain.get(effectId);
      if (effect && effect[param]) {
        effect[param].value = value;
      }
    }
  }

  setRouting(mode: 'serial' | 'parallel' | 'hybrid'): void {
    switch (mode) {
      case 'serial':
        this.setSerialRouting();
        break;
      case 'parallel':
        this.setParallelRouting();
        break;
      case 'hybrid':
        this.setHybridRouting();
        break;
    }
  }

  private setSerialRouting(): void {
    // Effects in series: input → effect1 → effect2 → output
    this.chains.forEach(chain => {
      chain.setRouting('serial');
    });
  }

  private setParallelRouting(): void {
    // Effects in parallel: input → [effect1, effect2] → output
    this.chains.forEach(chain => {
      chain.setRouting('parallel');
    });
  }

  private setHybridRouting(): void {
    // Custom routing: some effects in series, some in parallel
    this.chains.forEach(chain => {
      chain.setRouting('hybrid');
    });
  }
}
```

---

## 🎛️ **Transport Integration**

### **Tone.js Transport Setup**

```typescript
// apps/web/src/services/transportManager.ts
import * as Tone from 'tone';

export class TransportManager {
  private transport: Tone.Transport;
  private customEngine: AudioEngine;
  private stateSync: StateSyncManager;

  constructor(customEngine: AudioEngine, stateSync: StateSyncManager) {
    this.transport = Tone.getTransport();
    this.customEngine = customEngine;
    this.stateSync = stateSync;

    this.setupTransport();
  }

  private setupTransport(): void {
    // Set default tempo
    this.transport.bpm.value = 120;

    // Set time signature
    this.transport.timeSignature = [4, 4];

    // Set swing
    this.transport.swing = 0.5; // 50% swing

    // Setup transport events
    this.transport.on('start', () => {
      this.onTransportStart();
    });

    this.transport.on('pause', () => {
      this.onTransportPause();
    });

    this.transport.on('stop', () => {
      this.onTransportStop();
    });
  }

  // Transport control methods
  play(): void {
    this.transport.start();
    this.syncStateChange('play');
  }

  pause(): void {
    this.transport.pause();
    this.syncStateChange('pause');
  }

  stop(): void {
    this.transport.stop();
    this.syncStateChange('stop');
  }

  setTempo(tempo: number): void {
    this.transport.bpm.value = tempo;
    this.syncStateChange('tempo', tempo);
  }

  setTimeSignature(numerator: number, denominator: number): void {
    this.transport.timeSignature = [numerator, denominator];
    this.syncStateChange('timeSignature', [numerator, denominator]);
  }

  setSwing(swing: number): void {
    this.transport.swing = swing;
    this.syncStateChange('swing', swing);
  }

  // Event handlers
  private onTransportStart(): void {
    // Start custom engine
    this.customEngine.play();
  }

  private onTransportPause(): void {
    // Pause custom engine
    this.customEngine.pause();
  }

  private onTransportStop(): void {
    // Stop custom engine
    this.customEngine.stop();
  }

  // State synchronization
  private syncStateChange(type: string, value?: any): void {
    this.stateSync.syncTransportChange({
      type,
      value,
      timestamp: Date.now()
    });
  }
}
```

---

## 🎵 **Effects Implementation**

### **Professional Effects Setup**

```typescript
// apps/web/src/services/effectsManager.ts
import * as Tone from 'tone';

export class EffectsManager {
  private effects: Map<string, Tone.Effect> = new Map();
  private chains: Map<string, Tone.EffectsChain> = new Map();

  // Create professional effects
  createEQ3(): Tone.EQ3 {
    const eq = new Tone.EQ3({
      low: 0,      // Low frequency gain
      mid: 0,      // Mid frequency gain
      high: 0,     // High frequency gain
      lowFrequency: 400,    // Low frequency cutoff
      highFrequency: 2500   // High frequency cutoff
    });

    this.effects.set('eq3', eq);
    return eq;
  }

  createCompressor(): Tone.Compressor {
    const compressor = new Tone.Compressor({
      threshold: -24,    // dB
      ratio: 12,         // 12:1 ratio
      attack: 0.003,     // 3ms attack
      release: 0.1       // 100ms release
    });

    this.effects.set('compressor', compressor);
    return compressor;
  }

  createFeedbackDelay(): Tone.FeedbackDelay {
    const delay = new Tone.FeedbackDelay({
      delayTime: '8n',   // 8th note delay
      feedback: 0.3,     // 30% feedback
      wet: 0.5          // 50% wet signal
    });

    this.effects.set('feedbackDelay', delay);
    return delay;
  }

  createReverb(): Tone.Reverb {
    const reverb = new Tone.Reverb({
      decay: 2.5,        // 2.5 second decay
      preDelay: 0.01,    // 10ms pre-delay
      wet: 0.3          // 30% wet signal
    });

    this.effects.set('reverb', reverb);
    return reverb;
  }

  createLimiter(): Tone.Limiter {
    const limiter = new Tone.Limiter({
      threshold: -6,     // -6dB threshold
      release: 0.1       // 100ms release
    });

    this.effects.set('limiter', limiter);
    return limiter;
  }

  createStereoWidener(): Tone.StereoWidener {
    const widener = new Tone.StereoWidener({
      width: 0.5         // 50% width
    });

    this.effects.set('stereoWidener', widener);
    return widener;
  }

  // Advanced effects
  createChorus(): Tone.Chorus {
    const chorus = new Tone.Chorus({
      frequency: 1.5,    // 1.5Hz modulation
      delayTime: 3.5,    // 3.5ms delay
      depth: 0.7,        // 70% depth
      wet: 0.3          // 30% wet signal
    });

    this.effects.set('chorus', chorus);
    return chorus;
  }

  createPhaser(): Tone.Phaser {
    const phaser = new Tone.Phaser({
      frequency: 0.5,    // 0.5Hz modulation
      octaves: 3,        // 3 octaves
      baseFrequency: 1000, // 1kHz base
      wet: 0.3          // 30% wet signal
    });

    this.effects.set('phaser', phaser);
    return phaser;
  }

  createDistortion(): Tone.Distortion {
    const distortion = new Tone.Distortion({
      distortion: 0.4,   // 40% distortion
      oversample: '4x'   // 4x oversampling
    });

    this.effects.set('distortion', distortion);
    return distortion;
  }

  // Effect chain management
  createEffectChain(effects: Tone.Effect[]): Tone.EffectsChain {
    const chain = new Tone.EffectsChain(...effects);
    const chainId = generateId();
    this.chains.set(chainId, chain);
    return chain;
  }

  // Parameter control
  setEffectParameter(effectId: string, param: string, value: number): void {
    const effect = this.effects.get(effectId);
    if (effect && effect[param]) {
      effect[param].value = value;
    }
  }

  // Preset management
  savePreset(name: string): void {
    const preset = {
      name,
      effects: Array.from(this.effects.entries()).map(([id, effect]) => ({
        id,
        type: effect.constructor.name,
        parameters: this.getEffectParameters(effect)
      }))
    };

    localStorage.setItem(`preset_${name}`, JSON.stringify(preset));
  }

  loadPreset(name: string): void {
    const presetData = localStorage.getItem(`preset_${name}`);
    if (presetData) {
      const preset = JSON.parse(presetData);
      this.applyPreset(preset);
    }
  }

  private getEffectParameters(effect: Tone.Effect): Record<string, number> {
    const params: Record<string, number> = {};

    // Get all parameters from effect
    Object.keys(effect).forEach(key => {
      if (effect[key] && typeof effect[key].value !== 'undefined') {
        params[key] = effect[key].value;
      }
    });

    return params;
  }

  private applyPreset(preset: any): void {
    preset.effects.forEach((effectData: any) => {
      const effect = this.effects.get(effectData.id);
      if (effect) {
        Object.entries(effectData.parameters).forEach(([param, value]) => {
          if (effect[param]) {
            effect[param].value = value;
          }
        });
      }
    });
  }
}
```

---

## 🔄 **State Synchronization Integration**

### **Tone.js State Sync**

```typescript
// apps/web/src/services/toneStateSync.ts
import * as Tone from 'tone';

export class ToneStateSync {
  private transport: Tone.Transport;
  private effectsManager: EffectsManager;
  private stateSync: StateSyncManager;

  constructor(transport: Tone.Transport, effectsManager: EffectsManager, stateSync: StateSyncManager) {
    this.transport = transport;
    this.effectsManager = effectsManager;
    this.stateSync = stateSync;
  }

  // Sync transport state
  syncTransportState(state: TransportState): void {
    // Sync tempo
    if (state.tempo !== this.transport.bpm.value) {
      this.transport.bpm.value = state.tempo;
    }

    // Sync time signature
    if (JSON.stringify(state.timeSignature) !== JSON.stringify(this.transport.timeSignature)) {
      this.transport.timeSignature = state.timeSignature;
    }

    // Sync swing
    if (state.swing !== this.transport.swing) {
      this.transport.swing = state.swing;
    }

    // Sync position
    if (state.isPlaying && this.transport.state !== 'started') {
      this.transport.start();
    } else if (!state.isPlaying && this.transport.state === 'started') {
      this.transport.pause();
    }
  }

  // Sync effects state
  syncEffectsState(state: EffectsState): void {
    Object.entries(state.effects).forEach(([instrument, effects]) => {
      Object.entries(effects).forEach(([effectId, effectState]) => {
        this.effectsManager.setEffectParameter(effectId, 'enabled', effectState.enabled ? 1 : 0);

        Object.entries(effectState.parameters).forEach(([param, value]) => {
          this.effectsManager.setEffectParameter(effectId, param, value);
        });
      });
    });
  }

  // Get current state
  getCurrentState(): ToneState {
    return {
      transport: {
        tempo: this.transport.bpm.value,
        timeSignature: this.transport.timeSignature,
        swing: this.transport.swing,
        isPlaying: this.transport.state === 'started',
        position: this.transport.position
      },
      effects: this.getEffectsState()
    };
  }

  private getEffectsState(): EffectsState {
    const effects: EffectsState = {};

    this.effectsManager.getEffects().forEach((effect, effectId) => {
      effects[effectId] = {
        enabled: effect.wet.value > 0,
        parameters: this.effectsManager.getEffectParameters(effectId)
      };
    });

    return effects;
  }
}
```

---

## 🧪 **Testing Implementation**

### **Unit Tests**

```typescript
// apps/web/src/services/__tests__/hybridAudioEngine.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HybridAudioEngine } from '../hybridAudioEngine';
import * as Tone from 'tone';

describe('HybridAudioEngine', () => {
  let engine: HybridAudioEngine;

  beforeEach(async () => {
    engine = new HybridAudioEngine();
    await engine.initialize();
  });

  afterEach(() => {
    engine.cleanup();
  });

  it('should initialize with Tone.js and custom engine', async () => {
    expect(engine.isInitialized()).toBe(true);
    expect(Tone.context.state).toBe('running');
  });

  it('should play with synchronized transport', () => {
    engine.play();
    expect(Tone.getTransport().state).toBe('started');
  });

  it('should pause with synchronized transport', () => {
    engine.play();
    engine.pause();
    expect(Tone.getTransport().state).toBe('paused');
  });

  it('should set tempo on both engines', () => {
    engine.setTempo(140);
    expect(Tone.getTransport().bpm.value).toBe(140);
  });

  it('should add effects to instruments', () => {
    const effect = engine.createEQ3();
    engine.addEffectToInstrument('kick', effect);

    const chain = engine.getInstrumentChain('kick');
    expect(chain.getEffects()).toContain(effect);
  });

  it('should sync state changes', () => {
    const stateChange = {
      type: 'tempo',
      value: 160,
      timestamp: Date.now()
    };

    engine.syncStateChange(stateChange);
    expect(Tone.getTransport().bpm.value).toBe(160);
  });
});
```

### **Integration Tests**

```typescript
// apps/web/src/test/integration/audioCollaboration.test.tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HybridAudioEngine } from '../../services/hybridAudioEngine';
import { CollaborationProvider } from '../../contexts/CollaborationContext';

describe('Audio Collaboration Integration', () => {
  let engine1: HybridAudioEngine;
  let engine2: HybridAudioEngine;

  beforeEach(async () => {
    engine1 = new HybridAudioEngine();
    engine2 = new HybridAudioEngine();

    await engine1.initialize();
    await engine2.initialize();

    // Join same session
    engine1.joinSession('test-session');
    engine2.joinSession('test-session');
  });

  afterEach(() => {
    engine1.cleanup();
    engine2.cleanup();
  });

  it('should sync tempo changes between engines', async () => {
    engine1.setTempo(140);

    await waitFor(() => {
      expect(engine2.getTempo()).toBe(140);
    });
  });

  it('should sync effects between engines', async () => {
    const effect = engine1.createEQ3();
    engine1.addEffectToInstrument('kick', effect);

    await waitFor(() => {
      const engine2Effect = engine2.getInstrumentEffect('kick', 'eq3');
      expect(engine2Effect).toBeDefined();
    });
  });

  it('should sync transport state between engines', async () => {
    engine1.play();

    await waitFor(() => {
      expect(engine2.isPlaying()).toBe(true);
    });
  });
});
```

---

## 📊 **Performance Optimization**

### **Bundle Size Optimization**

```typescript
// apps/web/src/services/audioEngine.ts
// Import only what you need
import {
  Transport,
  EffectsChain,
  EQ3,
  Compressor,
  FeedbackDelay,
  Reverb,
  Limiter,
  StereoWidener
} from 'tone';

// Avoid importing entire library
// import * as Tone from 'tone'; // ❌ Don't do this
```

### **Memory Management**

```typescript
// apps/web/src/services/hybridAudioEngine.ts
export class HybridAudioEngine {
  // ... existing code ...

  cleanup(): void {
    // Clean up Tone.js
    this.transport.stop();
    this.effectsChain.dispose();
    this.masterEffects.dispose();

    // Clean up custom engine
    this.customEngine.cleanup();

    // Clean up collaboration
    this.stateSync.cleanup();

    // Clean up audio context
    if (this.audioContext) {
      this.audioContext.close();
    }
  }

  // Garbage collection optimization
  private optimizeMemory(): void {
    // Remove unused effects
    this.effectsManager.cleanupUnusedEffects();

    // Optimize audio buffers
    this.customEngine.optimizeBuffers();

    // Clean up old state
    this.stateSync.cleanupOldState();
  }
}
```

### **Performance Monitoring**

```typescript
// apps/web/src/services/performanceMonitor.ts
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  measureLatency(operation: string, fn: () => void): number {
    const start = performance.now();
    fn();
    const end = performance.now();
    const latency = end - start;

    this.recordMetric(`latency_${operation}`, latency);
    return latency;
  }

  measureBandwidth(operation: string, dataSize: number): void {
    this.recordMetric(`bandwidth_${operation}`, dataSize);
  }

  private recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name)!;
    values.push(value);

    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  getAverageLatency(operation: string): number {
    const values = this.metrics.get(`latency_${operation}`) || [];
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  getAverageBandwidth(operation: string): number {
    const values = this.metrics.get(`bandwidth_${operation}`) || [];
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
}
```

---

## 🚀 **Implementation Checklist**

### **Phase 1: Foundation**
- [ ] **Install Dependencies**: Add Tone.js and Socket.io
- [ ] **Create Hybrid Engine**: Implement HybridAudioEngine class
- [ ] **Transport Integration**: Replace custom transport with Tone.Transport
- [ ] **Basic Effects**: Implement EQ, compression, delay effects
- [ ] **Testing**: Ensure existing functionality still works

### **Phase 2: Effects System**
- [ ] **Modular Effects**: Create EffectsChainManager class
- [ ] **Serial Routing**: Implement serial effect chains
- [ ] **Parallel Routing**: Implement parallel effect processing
- [ ] **UI Integration**: Connect effects to text editor UI
- [ ] **Performance Testing**: Ensure low-latency processing

### **Phase 3: Collaboration**
- [ ] **State Sync**: Implement ToneStateSync class
- [ ] **WebSocket Integration**: Connect to collaboration server
- [ ] **Multi-user Testing**: Test with multiple participants
- [ ] **Error Handling**: Implement robust error handling
- [ ] **Final Testing**: End-to-end testing

---

## 🎯 **Success Criteria**

### **Technical Requirements**
- ✅ **Latency**: < 10ms for state sync, < 100ms for audio
- ✅ **Bandwidth**: < 1KB/s for collaboration features
- ✅ **Bundle Size**: < 150KB total (optimized)
- ✅ **Compatibility**: All modern browsers and mobile
- ✅ **Scalability**: 2-100+ participants

### **Feature Requirements**
- ✅ **Professional Effects**: EQ, compression, delay, reverb
- ✅ **Complex Timing**: Time signatures, polyrhythms, swing
- ✅ **Collaborative Jamming**: Real-time multi-user sessions
- ✅ **Modular Architecture**: Extensible effects and synthesis
- ✅ **Text Editor Integration**: Effects chains from UI

---

## 🎉 **Expected Outcomes**

After implementing this Tone.js integration, the ASCII Generative Sequencer will have:

1. **Professional Audio Quality**: Tone.js effects and transport
2. **High Performance**: Custom Web Audio API synthesis
3. **Collaborative Features**: Real-time multi-user sessions
4. **Modular Architecture**: Extensible effects and synthesis system
5. **Future-Proof Design**: Scalable architecture for advanced features

This hybrid approach provides the best of both worlds: the performance and control of custom Web Audio API with the professional features and collaborative capabilities needed for a modern music production application.

---

**Ready for Development Team Implementation** 🚀
