// Unified Audio Engine Hook - Real-time everything, no pre-calculation
import { useState, useCallback, useEffect } from 'react';
import { unifiedAudioEngine } from '../services/unifiedAudioEngine';
import { UnifiedAudioState } from '../types/app';

export const useUnifiedAudioEngine = () => {
  const [state, setState] = useState<UnifiedAudioState>({
    isInitialized: false,
    isPlaying: false,
    isPaused: false,
    tempo: 120,
    volume: -6,
    currentTime: 0,
    error: null,
    effectsEnabled: false,
    audioQuality: 'high',
    overflowMode: 'loop'
  });

  // Initialize unified audio engine
  const initialize = useCallback(async () => {
    const engineState = unifiedAudioEngine.getState();
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
      await unifiedAudioEngine.initialize();

      const newState = unifiedAudioEngine.getState();
      setState(prev => ({
        ...prev,
        ...newState,
        error: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize unified audio engine';
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, []);

  // Auto-initialize on first user interaction
  useEffect(() => {
    const engineState = unifiedAudioEngine.getState();
    if (engineState.isInitialized) {
      setState(prev => ({
        ...prev,
        ...engineState,
        error: null
      }));
      return;
    }

    const handleUserInteraction = async () => {
      const currentEngineState = unifiedAudioEngine.getState();
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
    const engineState = unifiedAudioEngine.getState();
    setState(prev => ({
      ...prev,
      ...engineState
    }));
  }, []);

  // Audio control functions
  const play = useCallback(async () => {
    if (!state.isInitialized) {
      setState(prev => ({
        ...prev,
        error: 'Unified audio engine not initialized'
      }));
      return;
    }

    try {
      await unifiedAudioEngine.play();
      updateState();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to play';
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, [state.isInitialized, updateState]);

  const pause = useCallback(async () => {
    try {
      await unifiedAudioEngine.pause();
      updateState();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to pause';
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, [updateState]);

  const stop = useCallback(async () => {
    try {
      await unifiedAudioEngine.stop();
      updateState();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop';
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, [updateState]);

  // Unified parameter update interface
  const updateParameter = useCallback(async (type: 'tempo' | 'sequence' | 'effects' | 'eq' | 'volume', value: any) => {
    try {
      await unifiedAudioEngine.updateParameter(type, value);
      updateState();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to update ${type}`;
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, [updateState]);

  // Convenience methods for common parameters
  const setTempo = useCallback((tempo: number) => {
    updateParameter('tempo', tempo);
  }, [updateParameter]);

  const setVolume = useCallback((volume: number) => {
    updateParameter('volume', volume);
  }, [updateParameter]);

  const loadPattern = useCallback((pattern: string) => {
    const engineState = unifiedAudioEngine.getState();
    if (!engineState.isInitialized) {
      setState(prev => ({
        ...prev,
        error: 'Unified audio engine not initialized'
      }));
      return;
    }

    try {
      unifiedAudioEngine.loadPattern(pattern);
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

  // Overflow mode control (loop vs rest for shorter instruments)
  const setOverflowMode = useCallback(async (mode: 'loop' | 'rest') => {
    try {
      await unifiedAudioEngine.setOverflowMode(mode);
      updateState();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set overflow mode';
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, [updateState]);

  // Get parameter history for debugging
  const getParameterHistory = useCallback(() => {
    return unifiedAudioEngine.getParameterHistory();
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
    updateParameter,
    setTempo,
    setVolume,
    loadPattern,
    getParameterHistory,
    setOverflowMode
  };
};
