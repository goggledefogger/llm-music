import React from 'react';
import { ASCIIEditor } from '../components/editor/ASCIIEditor';
import { ChatInterface } from '../components/ai/ChatInterface';
import { TransportControls } from '../components/audio/TransportControls';
import { ModuleVisualization } from '../components/visualizations/ModuleVisualization';
import { useModuleSystem } from '../hooks/useModuleSystem';

export const EditorPage: React.FC = () => {
  const { getModuleByType } = useModuleSystem();

  const editorModule = getModuleByType('editor');
  const aiModule = getModuleByType('ai');

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
          {editorModule && (
            <div className="w-2/5 border-l border-border">
              <ModuleVisualization
                module={editorModule}
                className="h-full"
              />
            </div>
          )}
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
        {aiModule && (
          <div className="border-t border-border h-1/3">
            <ModuleVisualization
              module={aiModule}
              className="h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
};
