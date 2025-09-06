import React, { createContext, useContext, ReactNode } from 'react';
import { useAudioEngine, AudioEngineHook } from '../hooks/useAudioEngine';

const AudioEngineContext = createContext<AudioEngineHook | null>(null);

interface AudioEngineProviderProps {
  children: ReactNode;
}

export const AudioEngineProvider: React.FC<AudioEngineProviderProps> = ({ children }) => {
  const audioEngine = useAudioEngine();

  return (
    <AudioEngineContext.Provider value={audioEngine}>
      {children}
    </AudioEngineContext.Provider>
  );
};

export const useAudioEngineContext = (): AudioEngineHook => {
  const context = useContext(AudioEngineContext);
  if (!context) {
    throw new Error('useAudioEngineContext must be used within an AudioEngineProvider');
  }
  return context;
};
