import React from 'react';

interface PatternPreviewProps {
  pattern: string;
  onApply: (pattern: string) => void;
}

export const PatternPreview: React.FC<PatternPreviewProps> = ({ pattern, onApply }) => {
  return (
    <div className="my-2 rounded-md border border-border bg-background overflow-hidden">
      <pre className="p-3 text-xs font-mono overflow-x-auto custom-scrollbar whitespace-pre">
        {pattern}
      </pre>
      <div className="border-t border-border px-3 py-2 flex justify-end">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onApply(pattern)}
        >
          Apply to Editor
        </button>
      </div>
    </div>
  );
};
