import React, { useState } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI music assistant. I can help you create, modify, and improve your ASCII patterns. What would you like to work on?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I understand you want help with your pattern. Let me analyze your current code and provide suggestions...',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col bg-background-secondary">
      <div className="chat-header">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <h2 className="text-sm font-semibold text-foreground">AI Assistant</h2>
        </div>
        <p className="text-xs text-foreground-muted mt-1">
          Get help creating and modifying patterns
        </p>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] ${
                message.role === 'user'
                  ? 'chat-bubble-user'
                  : 'chat-bubble-assistant'
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
              <p className="text-[10px] text-foreground-muted mt-1.5">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border p-3 bg-background-secondary">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your pattern..."
            className="input flex-1 h-9 text-sm"
          />
          <button
            onClick={handleSend}
            className="btn btn-primary h-9 px-4 text-sm"
            disabled={!input.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
