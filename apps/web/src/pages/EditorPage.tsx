import React from 'react';
import { ASCIIEditor } from '../components/editor/ASCIIEditor';
import { ChatInterface } from '../components/ai/ChatInterface';
import { TransportControls } from '../components/audio/TransportControls';

export const EditorPage: React.FC = () => {

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
            <div className="h-full p-4 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Pattern Visualization</h3>
              <p className="text-xs text-gray-500">Visualization will be implemented here</p>
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
          <div className="h-full p-4 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700 mb-2">AI Analysis</h3>
            <p className="text-xs text-gray-500">AI analysis will be implemented here</p>
          </div>
        </div>
      </div>
    </div>
  );
};
