// Hybrid Audio Engine Hook - Combines Web Audio API with Tone.js
import { useState, useCallback, useEffect } from 'react';
import { hybridAudioEngine, HybridAudioState } from '../services/hybridAudioEngine';

export const useHybridAudioEngine = () => {
  const [state, setState] = useState<HybridAudioState>({
    isInitialized: false,
    isPlaying: false,
    isPaused: false,
    tempo: 120,
    volume: -6,
    currentTime: 0,
    error: null,
    effectsEnabled: false,
    collaborationEnabled: false,
    audioQuality: 'high'
  });

  // Initialize hybrid audio engine
  const initialize = useCallback(async () => {
    const engineState = hybridAudioEngine.getState();
    if (engineState.isInitialized) {
      setState(prev => ({
        ...prev,
        ...engineState,
        error: null
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, error: null }));
      await hybridAudioEngine.initialize();

      const newState = hybridAudioEngine.getState();
      setState(prev => ({
        ...prev,
        ...newState,
        error: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize hybrid audio engine';
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, []);

  // Auto-initialize on first user interaction
  useEffect(() => {
    const engineState = hybridAudioEngine.getState();
    if (engineState.isInitialized) {
      setState(prev => ({
        ...prev,
        ...engineState,
        error: null
      }));
      return;
    }

    const handleUserInteraction = async () => {
      const currentEngineState = hybridAudioEngine.getState();
      if (!currentEngineState.isInitialized && !state.error) {
        await initialize();
      }
      // Remove event listeners after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    // Add event listeners for user interaction
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [state.error, initialize]);

  // Update state from engine
  const updateState = useCallback(() => {
    const engineState = hybridAudioEngine.getState();
    setState(prev => ({
      ...prev,
      ...engineState
    }));
  }, []);

  // Audio control functions
  const play = useCallback(() => {
    if (!state.isInitialized) {
      setState(prev => ({
        ...prev,
        error: 'Hybrid audio engine not initialized'
      }));
      return;
    }

    try {
      hybridAudioEngine.play();
      updateState();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to play';
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, [state.isInitialized, updateState]);

  const pause = useCallback(() => {
    try {
      hybridAudioEngine.pause();
      updateState();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to pause';
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, [updateState]);

  const stop = useCallback(() => {
    try {
      hybridAudioEngine.stop();
      updateState();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop';
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, [updateState]);

  const setTempo = useCallback((tempo: number) => {
    try {
      hybridAudioEngine.setTempo(tempo);
      setState(prev => ({
        ...prev,
        tempo
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set tempo';
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    try {
      hybridAudioEngine.setVolume(volume);
      setState(prev => ({
        ...prev,
        volume
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set volume';
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, []);

  const loadPattern = useCallback((pattern: string) => {
    const engineState = hybridAudioEngine.getState();
    if (!engineState.isInitialized) {
      setState(prev => ({
        ...prev,
        error: 'Hybrid audio engine not initialized'
      }));
      return;
    }

    try {
      hybridAudioEngine.loadPattern(pattern);
      setState(prev => ({
        ...prev,
        error: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load pattern';
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, []);

  // Effect control functions
  const setEffectEnabled = useCallback((effectId: string, enabled: boolean) => {
    try {
      hybridAudioEngine.setEffectEnabled(effectId, enabled);
      updateState();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle effect';
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, [updateState]);

  const setEffectWet = useCallback((effectId: string, wet: number) => {
    try {
      hybridAudioEngine.setEffectWet(effectId, wet);
      updateState();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set effect wet level';
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, [updateState]);

  // Get performance metrics
  const getPerformanceMetrics = useCallback(() => {
    return hybridAudioEngine.getPerformanceMetrics();
  }, []);

  // High-frequency updates when playing
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
    loadPattern,
    setEffectEnabled,
    setEffectWet,
    getPerformanceMetrics
  };
};
