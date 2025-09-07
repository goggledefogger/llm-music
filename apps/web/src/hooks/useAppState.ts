// Main app state hook that combines all functionality
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatternEditor } from './usePatternEditor';
import { useUnifiedAudioEngine } from './useUnifiedAudioEngine';
import { AppState, AppActions, UIState } from '../types/app';
import { PatternService } from '../services/patternService';

export const useAppState = () => {
  // Individual hooks
  const patternEditor = usePatternEditor();
  const audioEngine = useUnifiedAudioEngine();

  // Use navigate hook with error handling for tests
  let navigate: (path: string) => void;
  try {
    navigate = useNavigate();
  } catch (error) {
    // Fallback for tests that don't have Router context
    navigate = (path: string) => {
      console.log(`Navigation to ${path} (test mode)`);
    };
  }

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

  // Pattern loading functionality
  const loadPattern = useCallback(async (patternId: string) => {
    try {
      const pattern = PatternService.getPatternById(patternId);
      if (!pattern) {
        throw new Error(`Pattern with ID ${patternId} not found`);
      }

      // Load the pattern content into the editor
      patternEditor.updateContent(pattern.content);

      // Navigate to the editor page to show the loaded pattern
      navigate('/editor');
    } catch (error) {
      console.error('Error loading pattern:', error);
      throw error;
    }
  }, [patternEditor.updateContent, navigate]);

  const loadPatternContent = useCallback((content: string) => {
    patternEditor.updateContent(content);
    navigate('/editor');
  }, [patternEditor.updateContent, navigate]);

  // Combined actions
  const actions: AppActions = {
    // Pattern actions
    updatePattern: patternEditor.updateContent,
    setCursorPosition: patternEditor.updateCursorPosition,
    loadPattern,
    loadPatternContent,

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
