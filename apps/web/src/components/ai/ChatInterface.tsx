import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePattern, usePatternLoader } from '../../contexts/AppContext';
import {
  streamAIResponse,
  extractPatterns,
  getStoredProvider,
  setStoredProvider,
  AIProvider,
} from '../../services/aiService';
import { PatternPreview } from './PatternPreview';
import { ProviderSelector } from './ProviderSelector';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const ChatInterface: React.FC = () => {
  const { content: editorContent } = usePattern();
  const { loadPatternContent } = usePatternLoader();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hello! I'm your AI music assistant. I can help you create, modify, and improve your ASCII patterns. What would you like to work on?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [provider, setProvider] = useState<AIProvider>(getStoredProvider);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleProviderChange = useCallback((p: AIProvider) => {
    setProvider(p);
    setStoredProvider(p);
  }, []);

  const handleApplyPattern = useCallback(
    (pattern: string) => {
      loadPatternContent(pattern);
    },
    [loadPatternContent]
  );

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    // Build history from existing messages (exclude system greeting)
    const history = messages
      .filter((m) => m.id !== '1')
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    // Create a placeholder assistant message
    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const stream = streamAIResponse({
        prompt: trimmed,
        context: editorContent,
        provider,
        history,
      });

      for await (const chunk of stream) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + chunk } : m
          )
        );
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  'Sorry, I encountered an error. Please try again.',
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, messages, editorContent, provider]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="h-full flex flex-col bg-background-secondary">
      {/* Header */}
      <div className="chat-header">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <h2 className="text-sm font-semibold text-foreground">AI Assistant</h2>
          </div>
          <ProviderSelector provider={provider} onChange={handleProviderChange} />
        </div>
        <p className="text-xs text-foreground-muted mt-1">
          Get help creating and modifying patterns
        </p>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onApplyPattern={handleApplyPattern}
            isStreaming={isStreaming && message === messages[messages.length - 1] && message.role === 'assistant'}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 bg-background-secondary">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your pattern..."
            className="input flex-1 h-9 text-sm"
            disabled={isStreaming}
          />
          <button
            onClick={handleSend}
            className="btn btn-primary h-9 px-4 text-sm"
            disabled={!input.trim() || isStreaming}
          >
            {isStreaming ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Message Bubble sub-component ---

interface MessageBubbleProps {
  message: ChatMessage;
  onApplyPattern: (pattern: string) => void;
  isStreaming: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onApplyPattern,
  isStreaming,
}) => {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] p-2.5 rounded-lg bg-accent text-background">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  // Assistant message: render text segments and pattern blocks
  const patterns = extractPatterns(message.content);
  const segments = renderAssistantContent(message.content, patterns, onApplyPattern);

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] p-2.5 rounded-lg bg-background-tertiary text-foreground">
        <div className="text-sm">{segments}</div>
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-accent ml-0.5 animate-pulse" />
        )}
      </div>
    </div>
  );
};

// Split assistant content into text and pattern blocks
function renderAssistantContent(
  content: string,
  patterns: string[],
  onApply: (pattern: string) => void
): React.ReactNode[] {
  if (patterns.length === 0) {
    return [
      <span key="text" className="whitespace-pre-wrap">
        {content}
      </span>,
    ];
  }

  const nodes: React.ReactNode[] = [];
  const regex = /```(?:ascii|pattern)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  let idx = 0;

  while ((match = regex.exec(content)) !== null) {
    // Text before this code block
    if (match.index > lastIndex) {
      nodes.push(
        <span key={`text-${idx}`} className="whitespace-pre-wrap">
          {content.slice(lastIndex, match.index)}
        </span>
      );
    }
    // The pattern block
    const pattern = match[1].trim();
    nodes.push(
      <PatternPreview key={`pattern-${idx}`} pattern={pattern} onApply={onApply} />
    );
    lastIndex = match.index + match[0].length;
    idx++;
  }

  // Remaining text after the last code block
  if (lastIndex < content.length) {
    nodes.push(
      <span key={`text-${idx}`} className="whitespace-pre-wrap">
        {content.slice(lastIndex)}
      </span>
    );
  }

  return nodes;
}
