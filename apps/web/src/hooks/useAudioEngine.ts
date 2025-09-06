// Simplified audio engine hook (replaces the old complex one)
import { useState, useCallback, useEffect } from 'react';
import { audioEngine } from '../services/audioEngine';
import { AudioState } from '../types/app';

export const useAudioEngine = () => {
  const [state, setState] = useState<AudioState>({
    isInitialized: false,
    isPlaying: false,
    tempo: 120,
    volume: -6,
    currentTime: 0,
    error: null
  });

  // Initialize audio engine
  const initialize = useCallback(async () => {
    const engineState = audioEngine.getState();
    if (engineState.isInitialized) {
      setState(prev => ({
        ...prev,
        isInitialized: true,
        error: null
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, error: null }));
      await audioEngine.initialize();
      setState(prev => ({
        ...prev,
        isInitialized: true,
        error: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize audio';
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, []);

  // Auto-initialize on first user interaction
  useEffect(() => {
    const engineState = audioEngine.getState();
    if (engineState.isInitialized) {
      setState(prev => ({
        ...prev,
        isInitialized: true,
        error: null
      }));
      return;
    }

    const handleUserInteraction = async () => {
      const currentEngineState = audioEngine.getState();
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

  // Audio control functions
  const play = useCallback(() => {
    if (!state.isInitialized) {
      setState(prev => ({
        ...prev,
        error: 'Audio engine not initialized'
      }));
      return;
    }

    try {
      audioEngine.play();
      setState(prev => ({
        ...prev,
        isPlaying: true,
        error: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to play';
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, [state.isInitialized]);

  const pause = useCallback(() => {
    try {
      audioEngine.pause();
      setState(prev => ({
        ...prev,
        isPlaying: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to pause';
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, []);

  const stop = useCallback(() => {
    try {
      audioEngine.stop();
      setState(prev => ({
        ...prev,
        isPlaying: false,
        currentTime: 0
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop';
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, []);

  const setTempo = useCallback((tempo: number) => {
    try {
      audioEngine.setTempo(tempo);
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
      audioEngine.setVolume(volume);
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
    const engineState = audioEngine.getState();
    if (!engineState.isInitialized) {
      setState(prev => ({
        ...prev,
        error: 'Audio engine not initialized'
      }));
      return;
    }

    try {
      audioEngine.loadPattern(pattern);
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

  // Update state from audio engine
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const engineState = audioEngine.getState();
        setState(prev => ({
          ...prev,
          isInitialized: engineState.isInitialized,
          isPlaying: engineState.isPlaying,
          tempo: engineState.tempo,
          currentTime: engineState.currentTime,
          volume: engineState.volume
        }));
      } catch (error) {
        // Ignore errors in state updates
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

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
