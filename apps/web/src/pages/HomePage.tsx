import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePatternLoader } from '../contexts/AppContext';

const DEMO_PATTERN = `TEMPO 120

# Drums
sample kick: kick
sample snare: snare
sample hihat: hihat

seq kick:  x...x...x...x...
seq snare: ....x.......x...
seq hihat: x.x.x.x.x.x.x.x.`;

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { loadPatternContent } = usePatternLoader();

  const handleTryPattern = () => {
    loadPatternContent(DEMO_PATTERN);
    navigate('/editor');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title text-5xl tracking-tight">
          ASCII Generative Sequencer
        </h1>
        <p className="page-subtitle text-foreground-secondary">
          Create music with ASCII patterns and AI assistance
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/editor" className="btn btn-primary btn-lg">
            Start Creating
          </Link>
          <Link to="/patterns" className="btn btn-secondary btn-lg">
            Browse Patterns
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="card hover:border-accent/30 transition-colors">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-foreground">ASCII Patterns</h3>
          </div>
          <div className="card-content">
            <p className="text-sm text-foreground-secondary leading-relaxed">
              Create musical patterns using simple ASCII syntax. Define instruments,
              sequences, and effects with text-based commands.
            </p>
          </div>
        </div>

        <div className="card hover:border-accent/30 transition-colors">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-foreground">AI Assistant</h3>
          </div>
          <div className="card-content">
            <p className="text-sm text-foreground-secondary leading-relaxed">
              Get help from AI to generate patterns, modify existing ones,
              and explore new musical ideas through natural language.
            </p>
          </div>
        </div>

        <div className="card hover:border-accent/30 transition-colors">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-foreground">Real-time Audio</h3>
          </div>
          <div className="card-content">
            <p className="text-sm text-foreground-secondary leading-relaxed">
              Hear your patterns instantly with high-quality audio synthesis
              and real-time visualizations.
            </p>
          </div>
        </div>
      </div>

      {/* Try It Now section */}
      <div className="card mb-12">
        <div className="card-header">
          <h2 className="text-2xl font-semibold">Try It Now</h2>
          <p className="text-foreground-secondary text-sm">
            Click the pattern below to load it into the editor and start playing
          </p>
        </div>
        <div className="card-content">
          <button
            onClick={handleTryPattern}
            className="w-full text-left group"
          >
            <pre className="p-4 bg-background rounded-lg border border-border text-sm font-mono whitespace-pre group-hover:border-accent group-hover:bg-background-secondary transition-colors cursor-pointer">
{DEMO_PATTERN}
            </pre>
            <p className="mt-2 text-sm text-foreground-muted group-hover:text-accent transition-colors">
              Click to open in editor &rarr;
            </p>
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-2xl font-semibold">Quick Start</h2>
        </div>
        <div className="card-content">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-accent text-background rounded-full flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Open the Editor</h3>
                <p className="text-foreground-secondary">
                  Click "Start Creating" to open the editor with a live visualizer and AI chat.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-accent text-background rounded-full flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Write ASCII Patterns</h3>
                <p className="text-foreground-secondary mb-2">
                  Define instruments with <code className="bg-background-tertiary px-1 py-0.5 rounded text-sm">sample</code> and
                  sequences with <code className="bg-background-tertiary px-1 py-0.5 rounded text-sm">seq</code>.
                  Use <code className="bg-background-tertiary px-1 py-0.5 rounded text-sm">x</code> for hits and
                  <code className="bg-background-tertiary px-1 py-0.5 rounded text-sm">.</code> for rests.
                </p>
                <button
                  onClick={handleTryPattern}
                  className="group"
                >
                  <pre className="p-3 bg-background rounded text-sm font-mono group-hover:bg-background-secondary transition-colors cursor-pointer">
{`TEMPO 120
sample kick: kick
seq kick: x...x...x...x...`}
                  </pre>
                  <p className="mt-1 text-xs text-foreground-muted group-hover:text-accent transition-colors">
                    Click to load full demo &rarr;
                  </p>
                </button>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-accent text-background rounded-full flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Get AI Help</h3>
                <p className="text-foreground-secondary">
                  Use the chat panel to ask AI for pattern ideas, modifications,
                  and musical suggestions in natural language.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-accent text-background rounded-full flex items-center justify-center font-bold text-sm">
                4
              </div>
              <div>
                <h3 className="font-semibold mb-1">Keyboard Shortcuts</h3>
                <p className="text-foreground-secondary">
                  Press <kbd className="bg-background-tertiary px-1.5 py-0.5 rounded border border-border text-xs font-mono">Space</kbd> to
                  play/pause and <kbd className="bg-background-tertiary px-1.5 py-0.5 rounded border border-border text-xs font-mono">Escape</kbd> to
                  stop. Drag panel borders to resize the layout.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
