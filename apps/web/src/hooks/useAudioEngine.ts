// Audio engine hook for React components
import { useState, useEffect, useCallback } from 'react';
import { audioEngine } from '../services/audioEngine';
import { AudioEngineState, AudioEngineHook } from '../types/audio';

export const useAudioEngine = (): AudioEngineHook => {
  const [state, setState] = useState<AudioEngineState>({
    isPlaying: false,
    isInitialized: false,
    tempo: 120,
    currentTime: 0,
    volume: -6,
    error: null
  });

  // Initialize audio engine
  const initialize = useCallback(async () => {
    // Check if the singleton is already initialized
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

  // Auto-initialize on first user interaction (only if not already initialized)
  useEffect(() => {
    // Check if singleton is already initialized
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

  // Play function
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

  // Pause function
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

  // Stop function
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

  // Set tempo function
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

  // Set volume function
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

  // Load pattern function
  const loadPattern = useCallback((pattern: string) => {
    // Check if the audio engine is actually initialized
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't dispose the singleton audio engine here
      // Let the application handle cleanup
    };
  }, []);

  return {
    state,
    play,
    pause,
    stop,
    setTempo,
    setVolume,
    loadPattern,
    initialize
  };
};
