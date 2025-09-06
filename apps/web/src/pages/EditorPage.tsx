import React from 'react';
import { ASCIIEditor } from '../components/editor/ASCIIEditor';
import { ChatInterface } from '../components/ai/ChatInterface';
import { TransportControls } from '../components/audio/TransportControls';

export const EditorPage: React.FC = () => {
  return (
    <div className="flex h-full">
      {/* Editor Pane - 70% width */}
      <div className="editor-pane flex flex-col">
        <div className="flex-1">
          <ASCIIEditor />
        </div>
        <div className="border-t border-border">
          <TransportControls />
        </div>
      </div>

      {/* Chat Pane - 30% width */}
      <div className="chat-pane flex flex-col">
        <ChatInterface />
      </div>
    </div>
  );
};
