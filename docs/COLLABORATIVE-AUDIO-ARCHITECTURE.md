# 🎵 Collaborative Audio Architecture - State Synchronization

## 📋 **Overview**

This document outlines the collaborative audio architecture for the ASCII Generative Sequencer, focusing on **state synchronization** rather than audio streaming for optimal performance and bandwidth efficiency.

## 🎯 **Architecture Decision: State Sync vs Audio Streaming**

### **Why State Synchronization?**

After extensive research and analysis, **state synchronization** is significantly superior to audio streaming for collaborative music applications:

| Aspect | State Sync | Audio Streaming |
|--------|------------|-----------------|
| **Bandwidth** | < 1KB/s | 100KB/s+ |
| **Latency** | < 10ms | 50-200ms |
| **Quality** | Perfect (deterministic) | Compressed/degraded |
| **Scalability** | 2-100+ users | 2-10 users |
| **Network Resilience** | High | Low |
| **Personal Effects** | Supported | Not supported |

### **Key Benefits**
- ✅ **Bandwidth Efficient**: Only sync control data, not audio streams
- ✅ **Low Latency**: < 10ms for state changes vs 50-200ms for audio
- ✅ **Deterministic**: Each client generates identical audio from same state
- ✅ **Scalable**: Works with 2-100+ participants
- ✅ **Personal Effects**: Each user can add local effects without affecting others

---

## 🏗️ **Architecture Overview**

### **System Components**

```
┌─────────────────────────────────────────────────────────────┐
│                Collaborative Audio System                   │
├─────────────────────────────────────────────────────────────┤
│  Client A          │  Client B          │  Client C        │
│  ├─ Audio Engine   │  ├─ Audio Engine   │  ├─ Audio Engine │
│  ├─ State Sync     │  ├─ State Sync     │  ├─ State Sync   │
│  └─ Local Effects  │  └─ Local Effects  │  └─ Local Effects│
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            │                                │
│                    WebSocket Server                         │
│                    ├─ Session Management                    │
│                    ├─ State Broadcasting                    │
│                    └─ Conflict Resolution                   │
└─────────────────────────────────────────────────────────────┘
```

### **Data Flow**

1. **User Action**: User changes pattern, tempo, or effects
2. **Local Processing**: Audio engine processes change locally
3. **State Sync**: Change is sent to server via WebSocket
4. **Broadcast**: Server broadcasts change to all participants
5. **Remote Processing**: Other clients apply change to their audio engines
6. **Synchronized Output**: All clients produce identical audio

---

## 🔄 **State Synchronization Protocol**

### **Shared Audio State**

```typescript
// apps/web/src/types/collaborative.ts
export interface SharedAudioState {
  // Pattern data
  pattern: ParsedPattern;

  // Transport state
  transport: {
    tempo: number;
    timeSignature: [number, number];
    currentPosition: number;
    isPlaying: boolean;
    isPaused: boolean;
  };

  // Effects settings
  effects: {
    [instrumentId: string]: {
      [effectId: string]: EffectSettings;
    };
    master: {
      [effectId: string]: EffectSettings;
    };
  };

  // Instrument settings
  instruments: {
    [instrumentId: string]: InstrumentSettings;
  };

  // Session metadata
  session: {
    id: string;
    participants: Participant[];
    masterClock: number;
  };
}

export interface EffectSettings {
  id: string;
  type: string;
  parameters: Record<string, number>;
  enabled: boolean;
}

export interface InstrumentSettings {
  id: string;
  type: string;
  parameters: Record<string, number>;
  volume: number;
  muted: boolean;
}

export interface Participant {
  id: string;
  name: string;
  isMaster: boolean;
  lastSeen: number;
}
```

### **State Change Messages**

```typescript
// apps/web/src/types/collaborative.ts
export interface StateChangeMessage {
  type: 'stateChange';
  sessionId: string;
  participantId: string;
  timestamp: number;
  change: StateChange;
}

export interface StateChange {
  type: 'pattern' | 'transport' | 'effect' | 'instrument';
  path: string; // e.g., 'pattern.instruments.kick.steps'
  value: any;
  operation: 'set' | 'add' | 'remove' | 'update';
}

export interface JoinMessage {
  type: 'join';
  sessionId: string;
  participant: Participant;
  initialState: SharedAudioState;
}

export interface LeaveMessage {
  type: 'leave';
  sessionId: string;
  participantId: string;
}
```

---

## ⏱️ **Timing Synchronization**

### **Master-Slave Clock System**

```typescript
// apps/web/src/services/timingSynchronizer.ts
export class TimingSynchronizer {
  private masterClock: number = 0;
  private localClock: number = 0;
  private offset: number = 0;
  private isMaster: boolean = false;

  // Sync to master clock
  syncToMaster(masterTime: number, localTime: number): void {
    this.masterClock = masterTime;
    this.localClock = localTime;
    this.offset = masterTime - localTime;
  }

  // Get synchronized time
  getSyncedTime(): number {
    return Date.now() + this.offset;
  }

  // Get synchronized audio time
  getSyncedAudioTime(): number {
    return this.audioContext.currentTime + (this.offset / 1000);
  }

  // Set as master
  setAsMaster(): void {
    this.isMaster = true;
    this.masterClock = Date.now();
  }

  // Broadcast master time
  broadcastMasterTime(): void {
    if (this.isMaster) {
      this.ws?.send(JSON.stringify({
        type: 'masterTime',
        masterTime: this.masterClock,
        localTime: Date.now()
      }));
    }
  }
}
```

### **Transport Synchronization**

```typescript
// apps/web/src/services/transportSynchronizer.ts
export class TransportSynchronizer {
  private timingSync: TimingSynchronizer;
  private transport: Tone.Transport;

  // Sync transport state
  syncTransport(transportState: TransportState): void {
    const syncedTime = this.timingSync.getSyncedAudioTime();

    // Sync tempo
    this.transport.bpm.value = transportState.tempo;

    // Sync time signature
    this.transport.timeSignature = transportState.timeSignature;

    // Sync position
    if (transportState.isPlaying) {
      this.transport.start(syncedTime);
    } else {
      this.transport.pause(syncedTime);
    }
  }

  // Get current transport state
  getTransportState(): TransportState {
    return {
      tempo: this.transport.bpm.value,
      timeSignature: this.transport.timeSignature,
      currentPosition: this.transport.position,
      isPlaying: this.transport.state === 'started',
      isPaused: this.transport.state === 'paused'
    };
  }
}
```

---

## 🌐 **Network Architecture**

### **WebSocket Server**

```typescript
// apps/api/collaboration/websocket.ts
export class CollaborationWebSocket {
  private sessions: Map<string, CollaborationSession> = new Map();

  handleConnection(ws: WebSocket, sessionId: string): void {
    const session = this.getOrCreateSession(sessionId);
    const participant = session.addParticipant(ws);

    // Send current state to new participant
    ws.send(JSON.stringify({
      type: 'initialState',
      state: session.getCurrentState()
    }));

    // Broadcast participant joined
    this.broadcastToSession(sessionId, {
      type: 'participantJoined',
      participant
    });
  }

  handleMessage(ws: WebSocket, message: any): void {
    const session = this.getSession(message.sessionId);
    const participant = session.getParticipant(ws);

    switch (message.type) {
      case 'stateChange':
        this.handleStateChange(session, participant, message);
        break;
      case 'masterTime':
        this.handleMasterTime(session, participant, message);
        break;
    }
  }

  private handleStateChange(session: CollaborationSession, participant: Participant, message: StateChangeMessage): void {
    // Apply state change
    session.applyStateChange(message.change);

    // Broadcast to other participants
    this.broadcastToSession(session.id, message, participant.id);
  }
}
```

### **Session Management**

```typescript
// apps/api/collaboration/session.ts
export class CollaborationSession {
  public id: string;
  private participants: Map<string, Participant> = new Map();
  private state: SharedAudioState;
  private masterClock: number = 0;

  constructor(id: string) {
    this.id = id;
    this.state = this.createInitialState();
  }

  addParticipant(ws: WebSocket): Participant {
    const participant: Participant = {
      id: generateId(),
      name: `Participant ${this.participants.size + 1}`,
      isMaster: this.participants.size === 0,
      lastSeen: Date.now()
    };

    this.participants.set(participant.id, participant);
    return participant;
  }

  applyStateChange(change: StateChange): void {
    // Apply change to state
    this.updateState(change);

    // Update master clock
    this.masterClock = Date.now();
  }

  getCurrentState(): SharedAudioState {
    return {
      ...this.state,
      session: {
        id: this.id,
        participants: Array.from(this.participants.values()),
        masterClock: this.masterClock
      }
    };
  }
}
```

---

## 🔧 **Client Implementation**

### **State Sync Manager**

```typescript
// apps/web/src/services/stateSyncManager.ts
export class StateSyncManager {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private participantId: string | null = null;
  private localState: SharedAudioState;
  private remoteStates: Map<string, SharedAudioState> = new Map();
  private timingSync: TimingSynchronizer;
  private transportSync: TransportSynchronizer;

  constructor() {
    this.timingSync = new TimingSynchronizer();
    this.transportSync = new TransportSynchronizer(this.timingSync);
    this.localState = this.createInitialState();
  }

  async initialize(): Promise<void> {
    // Initialize WebSocket connection
    this.ws = new WebSocket('ws://localhost:3001/collaboration');

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onopen = () => {
      console.log('Connected to collaboration server');
    };
  }

  joinSession(sessionId: string): void {
    this.sessionId = sessionId;
    this.ws?.send(JSON.stringify({
      type: 'join',
      sessionId,
      participant: this.getParticipant(),
      initialState: this.localState
    }));
  }

  syncStateChange(change: StateChange): void {
    // Apply change locally
    this.applyLocalStateChange(change);

    // Send to server
    this.ws?.send(JSON.stringify({
      type: 'stateChange',
      sessionId: this.sessionId,
      participantId: this.participantId,
      timestamp: Date.now(),
      change
    }));
  }

  private handleMessage(message: any): void {
    switch (message.type) {
      case 'initialState':
        this.applyRemoteState(message.state);
        break;
      case 'stateChange':
        this.applyRemoteStateChange(message);
        break;
      case 'masterTime':
        this.timingSync.syncToMaster(message.masterTime, message.localTime);
        break;
      case 'participantJoined':
        this.addParticipant(message.participant);
        break;
      case 'participantLeft':
        this.removeParticipant(message.participantId);
        break;
    }
  }
}
```

### **Audio Engine Integration**

```typescript
// apps/web/src/services/hybridAudioEngine.ts
export class HybridAudioEngine {
  private stateSync: StateSyncManager;
  private transport: Tone.Transport;
  private effectsChain: Tone.EffectsChain;

  constructor() {
    this.stateSync = new StateSyncManager();
    this.transport = Tone.getTransport();
    this.effectsChain = new Tone.EffectsChain();
  }

  async initialize(): Promise<void> {
    await Tone.start();
    await this.stateSync.initialize();
  }

  // Transport methods with sync
  play(): void {
    const change: StateChange = {
      type: 'transport',
      path: 'transport.isPlaying',
      value: true,
      operation: 'set'
    };

    this.stateSync.syncStateChange(change);
    this.transport.start();
  }

  pause(): void {
    const change: StateChange = {
      type: 'transport',
      path: 'transport.isPlaying',
      value: false,
      operation: 'set'
    };

    this.stateSync.syncStateChange(change);
    this.transport.pause();
  }

  setTempo(tempo: number): void {
    const change: StateChange = {
      type: 'transport',
      path: 'transport.tempo',
      value: tempo,
      operation: 'set'
    };

    this.stateSync.syncStateChange(change);
    this.transport.bpm.value = tempo;
  }

  // Effects methods with sync
  addEffect(effect: Tone.Effect, instrument?: string): void {
    const effectId = generateId();
    const change: StateChange = {
      type: 'effect',
      path: `effects.${instrument || 'master'}.${effectId}`,
      value: {
        id: effectId,
        type: effect.constructor.name,
        parameters: this.getEffectParameters(effect),
        enabled: true
      },
      operation: 'set'
    };

    this.stateSync.syncStateChange(change);
    this.effectsChain.add(effect);
  }
}
```

---

## 🧪 **Testing Strategy**

### **Unit Tests**
- [ ] **StateSyncManager**: State synchronization logic
- [ ] **TimingSynchronizer**: Clock synchronization
- [ ] **TransportSynchronizer**: Transport state sync
- [ ] **CollaborationSession**: Session management

### **Integration Tests**
- [ ] **WebSocket Communication**: Real-time messaging
- [ ] **State Consistency**: All clients have same state
- [ ] **Timing Accuracy**: Synchronized playback
- [ ] **Conflict Resolution**: Simultaneous changes

### **Load Tests**
- [ ] **Multi-User**: 10+ participants
- [ ] **High Frequency**: Rapid state changes
- [ ] **Network Issues**: Connection drops and recovery
- [ ] **Performance**: Latency and bandwidth usage

---

## 📊 **Performance Metrics**

### **Target Performance**
- **Latency**: < 10ms for state sync
- **Bandwidth**: < 1KB/s per participant
- **Scalability**: 2-100+ participants
- **Reliability**: 99.9% uptime
- **Synchronization**: < 5ms drift between clients

### **Monitoring**
- **WebSocket Latency**: Round-trip time measurements
- **State Sync Frequency**: Changes per second
- **Bandwidth Usage**: Data transfer rates
- **Error Rates**: Failed state changes
- **Participant Count**: Active sessions

---

## 🚀 **Implementation Roadmap**

### **Phase 1: Foundation (1 week)**
- [ ] **WebSocket Server**: Basic collaboration server
- [ ] **State Sync Manager**: Core synchronization logic
- [ ] **Basic Messages**: Join, leave, state change
- [ ] **Testing**: 2-user collaboration

### **Phase 2: Advanced Features (1 week)**
- [ ] **Timing Synchronization**: Master-slave clock system
- [ ] **Transport Sync**: Synchronized playback
- [ ] **Effects Sync**: Shared effects chains
- [ ] **Testing**: Multi-user sessions

### **Phase 3: Optimization (1 week)**
- [ ] **Performance Optimization**: Bandwidth and latency
- [ ] **Error Handling**: Network issues and recovery
- [ ] **Mobile Support**: Mobile device optimization
- [ ] **Final Testing**: Load testing and optimization

---

## 🎯 **Success Criteria**

### **Technical Requirements**
- ✅ **Latency**: < 10ms for state sync
- ✅ **Bandwidth**: < 1KB/s per participant
- ✅ **Scalability**: 2-100+ participants
- ✅ **Reliability**: 99.9% uptime
- ✅ **Synchronization**: < 5ms drift

### **Feature Requirements**
- ✅ **Real-time Sync**: Instant state synchronization
- ✅ **Multi-user**: 2-100+ participants
- ✅ **Conflict Resolution**: Handle simultaneous changes
- ✅ **Network Resilience**: Graceful degradation
- ✅ **Mobile Support**: Works on mobile devices

---

## 🎉 **Expected Outcomes**

After implementing this collaborative audio architecture, the ASCII Generative Sequencer will have:

1. **Real-time Collaboration**: Multiple users can jam together in real-time
2. **Efficient Bandwidth**: 10x more efficient than audio streaming
3. **Low Latency**: < 10ms synchronization for responsive collaboration
4. **Scalable**: Support for 2-100+ participants
5. **Professional Quality**: Deterministic audio output across all clients

This state synchronization approach provides the foundation for professional-grade collaborative music production in the browser.

---

**Ready for Development Team Implementation** 🚀
