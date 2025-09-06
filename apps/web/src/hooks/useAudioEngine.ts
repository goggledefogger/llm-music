// Audio engine hook for React components
import { useState, useEffect, useCallback, useRef } from 'react';
import { AudioEngine } from '../services/audioEngine';
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

  const audioEngineRef = useRef<AudioEngine | null>(null);

  // Initialize audio engine
  const initialize = useCallback(async () => {
    if (state.isInitialized) {
      return;
    }

    try {
      setState(prev => ({ ...prev, error: null }));

      if (!audioEngineRef.current) {
        audioEngineRef.current = new AudioEngine();
      }

      await audioEngineRef.current.initialize();

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
  }, [state.isInitialized]);

  // Play function
  const play = useCallback(() => {
    if (!audioEngineRef.current || !state.isInitialized) {
      setState(prev => ({
        ...prev,
        error: 'Audio engine not initialized'
      }));
      return;
    }

    try {
      audioEngineRef.current.play();
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
    if (!audioEngineRef.current) {
      return;
    }

    try {
      audioEngineRef.current.pause();
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
    if (!audioEngineRef.current) {
      return;
    }

    try {
      audioEngineRef.current.stop();
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
    if (!audioEngineRef.current) {
      return;
    }

    try {
      audioEngineRef.current.setTempo(tempo);
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
    if (!audioEngineRef.current) {
      return;
    }

    try {
      audioEngineRef.current.setVolume(volume);
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
    if (!audioEngineRef.current || !state.isInitialized) {
      setState(prev => ({
        ...prev,
        error: 'Audio engine not initialized'
      }));
      return;
    }

    try {
      audioEngineRef.current.loadPattern(pattern);
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
  }, [state.isInitialized]);

  // Update state from audio engine
  useEffect(() => {
    if (!audioEngineRef.current || !state.isInitialized) {
      return;
    }

    const interval = setInterval(() => {
      try {
        const engineState = audioEngineRef.current!.getState();
        setState(prev => ({
          ...prev,
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
  }, [state.isInitialized]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.dispose();
      }
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
