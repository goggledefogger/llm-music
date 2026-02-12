import React from 'react';
import { EQModule } from '../../../types/app';

interface EQDisplayProps {
  eqModules?: { [name: string]: EQModule };
  className?: string;
}

export const EQDisplay: React.FC<EQDisplayProps> = ({ eqModules, className = '' }) => {
  if (!eqModules || Object.keys(eqModules).length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <h3 className="text-lg font-semibold mb-2">EQ Settings</h3>
        <p className="text-foreground-secondary">No EQ modules configured</p>
      </div>
    );
  }

  const formatGain = (gain: number): string => {
    if (gain === 0) return '0';
    return gain > 0 ? `+${gain}` : `${gain}`;
  };

  const getGainColor = (gain: number): string => {
    if (gain === 0) return 'text-foreground-secondary';
    if (gain > 0) return 'text-green-400';
    return 'text-red-400';
  };

  return (
    <div className={`p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-3">EQ Settings</h3>
      <div className="space-y-3">
        {Object.entries(eqModules).map(([name, eq]) => (
          <div key={name} className="bg-background rounded-lg p-3 border border-border">
            <h4 className="font-medium text-sm mb-2 capitalize">{name} EQ</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center">
                <div className="text-xs text-foreground-secondary mb-1">Low</div>
                <div className={`font-mono ${getGainColor(eq.low)}`}>
                  {formatGain(eq.low)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-foreground-secondary mb-1">Mid</div>
                <div className={`font-mono ${getGainColor(eq.mid)}`}>
                  {formatGain(eq.mid)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-foreground-secondary mb-1">High</div>
                <div className={`font-mono ${getGainColor(eq.high)}`}>
                  {formatGain(eq.high)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
