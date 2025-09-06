// Simplified app context provider
import React, { createContext, useContext, ReactNode } from 'react';
import { useAppState } from '../hooks/useAppState';
import { AppState, AppActions } from '../types/app';

interface AppContextType {
  state: AppState;
  actions: AppActions;
}

const AppContext = createContext<AppContextType | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { state, actions } = useAppState();

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Convenience hooks for specific parts of the state
export const usePattern = () => {
  const { state, actions } = useApp();
  return {
    content: state.currentPattern,
    parsedPattern: state.parsedPattern,
    validation: state.validation,
    updateContent: actions.updatePattern,
    setCursorPosition: actions.setCursorPosition
  };
};

export const useAudio = () => {
  const { state, actions } = useApp();
  return {
    state: state.audio,
    play: actions.play,
    pause: actions.pause,
    stop: actions.stop,
    setTempo: actions.setTempo,
    setVolume: actions.setVolume,
    initialize: actions.initializeAudio
  };
};

export const useUI = () => {
  const { state, actions } = useApp();
  return {
    state: state.ui,
    setActiveTab: actions.setActiveTab,
    toggleSidebar: actions.toggleSidebar,
    setTheme: actions.setTheme
  };
};
