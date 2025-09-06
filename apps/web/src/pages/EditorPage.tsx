import React from 'react';
import { ASCIIEditor } from '../components/editor/ASCIIEditor';
import { ChatInterface } from '../components/ai/ChatInterface';
import { TransportControls } from '../components/audio/TransportControls';
import { VisualizationPanel } from '../components/layout/VisualizationPanel';
import { usePattern, useAudio } from '../contexts/AppContext';

export const EditorPage: React.FC = () => {
  const { parsedPattern } = usePattern();
  const { state: audioState } = useAudio();

  const currentStep = Math.floor(audioState.currentTime * (audioState.tempo / 60)) % (parsedPattern?.totalSteps || 16);

  return (
    <div className="flex h-full">
      {/* Main Editor Area - 60% width */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ASCII Editor - Takes most of the space */}
        <div className="flex-1 min-h-0">
          <ASCIIEditor />
        </div>

        {/* Compact Transport Controls */}
        <div className="border-t border-border bg-background-secondary">
          <TransportControls />
        </div>
      </div>

      {/* Visualization Panel - 25% width */}
      <div className="w-80 border-l border-border bg-background-secondary">
        <div className="h-full overflow-y-auto custom-scrollbar p-4">
          <VisualizationPanel
            pattern={parsedPattern}
            currentStep={currentStep}
            currentTime={audioState.currentTime}
            isPlaying={audioState.isPlaying}
            tempo={audioState.tempo}
            className="h-auto"
          />
        </div>
      </div>

      {/* Chat Panel - 15% width */}
      <div className="w-64 border-l border-border bg-background">
        <div className="h-full flex flex-col">
          <div className="flex-1 min-h-0">
            <ChatInterface />
          </div>
        </div>
      </div>
    </div>
  );
};
