// Main app state hook that combines all functionality
import { useState, useCallback, useEffect } from 'react';
import { usePatternEditor } from './usePatternEditor';
import { useAudioEngine } from './useAudioEngine';
import { AppState, AppActions, UIState } from '../types/app';

export const useAppState = () => {
  // Individual hooks
  const patternEditor = usePatternEditor();
  const audioEngine = useAudioEngine();

  // UI state
  const [ui, setUI] = useState<UIState>({
    activeTab: 'editor',
    sidebarOpen: true,
    theme: 'dark'
  });

  // Auto-load valid patterns into audio engine
  const loadPatternToAudio = useCallback((pattern: string) => {
    if (patternEditor.validation?.isValid && audioEngine.state.isInitialized) {
      audioEngine.loadPattern(pattern);
    }
  }, [patternEditor.validation?.isValid, audioEngine.state.isInitialized, audioEngine.loadPattern]);

  // Load pattern when it becomes valid and audio is ready
  useEffect(() => {
    if (patternEditor.validation?.isValid && audioEngine.state.isInitialized) {
      loadPatternToAudio(patternEditor.content);
    }
  }, [patternEditor.validation?.isValid, patternEditor.content, audioEngine.state.isInitialized, loadPatternToAudio]);

  // Combined state
  const state: AppState = {
    currentPattern: patternEditor.content,
    parsedPattern: patternEditor.parsedPattern,
    validation: patternEditor.validation,
    audio: audioEngine.state,
    ui
  };

  // Combined actions
  const actions: AppActions = {
    // Pattern actions
    updatePattern: patternEditor.updateContent,
    setCursorPosition: patternEditor.updateCursorPosition,

    // Audio actions
    initializeAudio: audioEngine.initialize,
    play: audioEngine.play,
    pause: audioEngine.pause,
    stop: audioEngine.stop,
    setTempo: audioEngine.setTempo,
    setVolume: audioEngine.setVolume,

    // UI actions
    setActiveTab: useCallback((tab: UIState['activeTab']) => {
      setUI(prev => ({ ...prev, activeTab: tab }));
    }, []),

    toggleSidebar: useCallback(() => {
      setUI(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen }));
    }, []),

    setTheme: useCallback((theme: UIState['theme']) => {
      setUI(prev => ({ ...prev, theme }));
    }, [])
  };

  return {
    state,
    actions,
    // Expose individual hooks for components that need direct access
    patternEditor,
    audioEngine
  };
};
