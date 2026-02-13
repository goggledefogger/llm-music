import React from 'react';
import { AIProvider } from '../../services/aiService';

interface ProviderSelectorProps {
  provider: AIProvider;
  onChange: (provider: AIProvider) => void;
}

const PROVIDERS: { value: AIProvider; label: string }[] = [
  { value: 'gemini', label: 'Gemini' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Claude' },
];

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({ provider, onChange }) => {
  return (
    <select
      value={provider}
      onChange={(e) => onChange(e.target.value as AIProvider)}
      className="h-7 rounded border border-border bg-background-secondary text-foreground text-xs px-1.5 focus:outline-none focus:ring-1 focus:ring-accent"
    >
      {PROVIDERS.map((p) => (
        <option key={p.value} value={p.value}>
          {p.label}
        </option>
      ))}
    </select>
  );
};
