import React from 'react';
import { Link } from 'react-router-dom';

export const HomePage: React.FC = () => {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-accent mb-4">
          ASCII Generative Sequencer
        </h1>
        <p className="text-xl text-foreground-secondary mb-8">
          Create music with ASCII patterns and AI assistance
        </p>
        <div className="flex justify-center space-x-4">
          <Link to="/editor" className="btn btn-primary btn-lg">
            Start Creating
          </Link>
          <Link to="/patterns" className="btn btn-secondary btn-lg">
            Browse Patterns
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">🎵 ASCII Patterns</h3>
          </div>
          <div className="card-content">
            <p className="text-foreground-secondary">
              Create musical patterns using simple ASCII syntax. Define instruments,
              sequences, and effects with text-based commands.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">🤖 AI Assistant</h3>
          </div>
          <div className="card-content">
            <p className="text-foreground-secondary">
              Get help from AI to generate patterns, modify existing ones,
              and explore new musical ideas through natural language.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">🎧 Real-time Audio</h3>
          </div>
          <div className="card-content">
            <p className="text-foreground-secondary">
              Hear your patterns instantly with high-quality audio synthesis
              and real-time visualizations.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-2xl font-semibold">Quick Start</h2>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-accent text-background rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold">Open the Editor</h3>
                <p className="text-foreground-secondary">
                  Click "Start Creating" to open the dual-pane editor interface.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-accent text-background rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold">Write ASCII Patterns</h3>
                <p className="text-foreground-secondary">
                  Use the left pane to write patterns in ASCII DSL syntax.
                </p>
                <pre className="mt-2 p-3 bg-background rounded text-sm font-mono">
{`TEMPO 120
inst kick: sample("kick.wav")
seq kick: x...x...x...x...`}
                </pre>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-accent text-background rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold">Get AI Help</h3>
                <p className="text-foreground-secondary">
                  Use the right pane to chat with AI for pattern generation and modification.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
