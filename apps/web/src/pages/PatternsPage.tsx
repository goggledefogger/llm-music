import React from 'react';

export const PatternsPage: React.FC = () => {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Pattern Library</h1>
        <p className="text-foreground-secondary">
          Browse and discover patterns created by the community.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder pattern cards */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card">
            <div className="card-header">
              <h3 className="font-semibold">Pattern {i}</h3>
              <p className="text-sm text-foreground-muted">by User{i}</p>
            </div>
            <div className="card-content">
              <pre className="text-xs font-mono bg-background p-3 rounded">
{`TEMPO 120
inst kick: sample("kick.wav")
seq kick: x...x...x...x...`}
              </pre>
            </div>
            <div className="card-footer">
              <button className="btn btn-primary btn-sm">Load</button>
              <button className="btn btn-ghost btn-sm">Share</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
