import React, { useState } from 'react';

export const ASCIIEditor: React.FC = () => {
  const [content, setContent] = useState(`TEMPO 120
SWING 12%
SCALE C major

inst kick: sample("kick.wav")
inst snare: sample("snare.wav")
inst hihat: sample("hihat.wav")

seq kick: x...x...x...x...
seq snare: ....x.......x...
seq hihat: x.x.x.x.x.x.x.x.`);

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border p-4">
        <h2 className="text-lg font-semibold">ASCII Pattern Editor</h2>
        <p className="text-sm text-foreground-muted">
          Write your musical patterns using ASCII DSL syntax
        </p>
      </div>

      <div className="flex-1 p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full bg-background border border-border rounded p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="Enter your ASCII pattern here..."
        />
      </div>

      <div className="border-t border-border p-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-foreground-muted">
            Lines: {content.split('\n').length} | Characters: {content.length}
          </div>
          <div className="flex space-x-2">
            <button className="btn btn-ghost btn-sm">Validate</button>
            <button className="btn btn-ghost btn-sm">Format</button>
            <button className="btn btn-primary btn-sm">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};
