import React, { useMemo } from 'react';
import { ParsedPattern } from '../../types/app';
import { BaseVisualization } from './BaseVisualization';

interface QuickStatsBarProps {
  pattern: ParsedPattern | null;
  className?: string;
}

interface StatCardProps {
  label: string;
  value: string | number;
  color: 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'yellow';
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color, subtitle }) => {
  const colorClasses = {
    green: 'text-green-400 bg-green-500/15',
    blue: 'text-blue-400 bg-blue-500/15',
    purple: 'text-purple-400 bg-purple-500/15',
    orange: 'text-orange-400 bg-orange-500/15',
    red: 'text-red-400 bg-red-500/15',
    yellow: 'text-yellow-400 bg-yellow-500/15'
  };

  return (
    <div className="bg-background rounded p-1 sm:p-2 flex-1 min-w-0 w-full">
      <div className="text-[10px] sm:text-xs text-foreground-muted mb-1 truncate">{label}</div>
      <div className={`text-xs sm:text-sm font-semibold ${colorClasses[color]} px-1 sm:px-2 py-0.5 sm:py-1 rounded truncate`}>
        {value}
      </div>
      {subtitle && (
        <div className="text-[10px] sm:text-xs text-foreground-muted mt-1 truncate">
          {subtitle}
        </div>
      )}
    </div>
  );
};

export const QuickStatsBar: React.FC<QuickStatsBarProps> = ({
  pattern,
  className = ''
}) => {
  const stats = useMemo(() => {
    if (!pattern) return null;

    const instruments = Object.keys(pattern.instruments);
    const maxSteps = Math.max(...instruments.map(inst => pattern.instruments[inst].steps.length), 16);
    
    // Calculate pattern complexity
    const totalSteps = instruments.length * maxSteps;
    const activeSteps = instruments.reduce((acc, inst) => 
      acc + pattern.instruments[inst].steps.filter(Boolean).length, 0
    );
    const complexity = activeSteps / totalSteps;

    // Calculate density
    const density = activeSteps / totalSteps;

    const getComplexityLabel = (complexity: number) => {
      if (complexity < 0.3) return 'Simple';
      if (complexity < 0.7) return 'Medium';
      return 'Complex';
    };

    const getComplexityColor = (complexity: number): StatCardProps['color'] => {
      if (complexity < 0.3) return 'green';
      if (complexity < 0.7) return 'yellow';
      return 'red';
    };

    const getDensityColor = (density: number): StatCardProps['color'] => {
      if (density < 0.3) return 'blue';
      if (density < 0.7) return 'purple';
      return 'orange';
    };

    return {
      complexity: {
        label: getComplexityLabel(complexity),
        value: `${Math.round(complexity * 100)}%`,
        color: getComplexityColor(complexity)
      },
      density: {
        label: `${Math.round(density * 100)}%`,
        value: `${activeSteps}/${totalSteps}`,
        color: getDensityColor(density),
        subtitle: 'steps active'
      },
      tempo: {
        label: `${pattern.tempo} BPM`,
        value: `${maxSteps} steps`,
        color: 'purple' as const,
        subtitle: 'pattern length'
      },
      instruments: {
        label: `${instruments.length} instruments`,
        value: instruments.join(', '),
        color: 'orange' as const,
        subtitle: 'active tracks'
      },
      groove: (() => {
        const grooveModules = pattern.grooveModules;
        if (!grooveModules || Object.keys(grooveModules).length === 0) {
          return null;
        }
        const entries = Object.entries(grooveModules);
        const primary = entries[0];
        const [target, mod] = primary;
        const subdivSuffix = mod.type === 'swing'
          ? ` (${mod.subdivision === '4n' ? '4th' : mod.subdivision === '16n' ? '16th' : '8th'})`
          : '';
        const label = `${mod.type} ${Math.round(mod.amount * 100)}%${subdivSuffix}`;
        const subtitle = entries.length > 1
          ? `${target} + ${entries.length - 1} more`
          : target;
        return {
          label,
          value: label,
          color: 'yellow' as const,
          subtitle
        };
      })()
    };
  }, [pattern]);

  if (!pattern || !stats) {
    return (
      <div className={`p-4 text-center text-foreground-muted ${className}`}>
        <p>No pattern loaded</p>
        <p className="text-sm">Create a pattern to see quick stats</p>
      </div>
    );
  }

  return (
    <BaseVisualization
      className={className}
      description="Essential pattern metrics at a glance"
      variant="ultra-compact"
    >
      <div className={`grid grid-cols-2 ${stats.groove ? 'sm:grid-cols-5' : 'sm:grid-cols-4'} gap-1 sm:gap-2`}>
        <div className="min-w-0">
          <StatCard
            label="Complexity"
            value={stats.complexity.label}
            color={stats.complexity.color}
            subtitle={stats.complexity.value}
          />
        </div>
        <div className="min-w-0">
          <StatCard
            label="Density"
            value={stats.density.label}
            color={stats.density.color}
            subtitle={stats.density.subtitle}
          />
        </div>
        <div className="min-w-0">
          <StatCard
            label="Tempo"
            value={stats.tempo.label}
            color={stats.tempo.color}
            subtitle={stats.tempo.subtitle}
          />
        </div>
        <div className="min-w-0">
          <StatCard
            label="Instruments"
            value={stats.instruments.label}
            color={stats.instruments.color}
            subtitle={stats.instruments.value}
          />
        </div>
        {stats.groove && (
          <div className="min-w-0">
            <StatCard
              label="Groove"
              value={stats.groove.label}
              color={stats.groove.color}
              subtitle={stats.groove.subtitle}
            />
          </div>
        )}
      </div>
    </BaseVisualization>
  );
};
