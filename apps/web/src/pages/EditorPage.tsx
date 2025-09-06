import React from 'react';
import { ASCIIEditor } from '../components/editor/ASCIIEditor';
import { ChatInterface } from '../components/ai/ChatInterface';
import { TransportControls } from '../components/audio/TransportControls';
import { StepSequencerGrid, PatternAnalysis } from '../components/visualizations';
import { usePattern, useAudio } from '../contexts/AppContext';

export const EditorPage: React.FC = () => {
  const { parsedPattern } = usePattern();
  const { state: audioState } = useAudio();

  return (
    <div className="flex h-full">
      {/* Editor Pane - 70% width */}
      <div className="editor-pane flex flex-col">
        <div className="flex-1 flex">
          {/* ASCII Editor - 60% */}
          <div className="flex-1">
            <ASCIIEditor />
          </div>

          {/* Editor Visualization - 40% */}
          <div className="w-2/5 border-l border-border">
            <div className="h-full overflow-y-auto">
              <StepSequencerGrid 
                pattern={parsedPattern}
                currentStep={Math.floor(audioState.currentTime * (audioState.tempo / 60)) % (parsedPattern?.totalSteps || 16)}
                className="h-full"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border">
          <TransportControls />
        </div>
      </div>

      {/* Chat Pane - 30% width */}
      <div className="chat-pane flex flex-col">
        <div className="flex-1">
          <ChatInterface />
        </div>

        {/* AI Visualization */}
        <div className="border-t border-border h-1/3">
          <div className="h-full overflow-y-auto">
            <PatternAnalysis 
              pattern={parsedPattern}
              className="h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
