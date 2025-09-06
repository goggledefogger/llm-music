import React from 'react';
import { PatternThumbnail } from '../components/visualizations';
import { ParsedPattern } from '../types/app';

export const PatternsPage: React.FC = () => {
  // Sample patterns for demonstration
  const samplePatterns: Array<{
    id: string;
    name: string;
    category: string;
    pattern: ParsedPattern;
    complexity: number;
  }> = [
    {
      id: '1',
      name: 'Basic House Beat',
      category: 'House',
      pattern: {
        tempo: 128,
        instruments: {
          kick: { name: 'kick', steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false] },
          snare: { name: 'snare', steps: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false] },
          hihat: { name: 'hihat', steps: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true] }
        },
        totalSteps: 16
      },
      complexity: 0.6
    },
    {
      id: '2',
      name: 'Minimal Techno',
      category: 'Techno',
      pattern: {
        tempo: 130,
        instruments: {
          kick: { name: 'kick', steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false] },
          hat: { name: 'hat', steps: [false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true] }
        },
        totalSteps: 16
      },
      complexity: 0.3
    },
    {
      id: '3',
      name: 'Complex Breakbeat',
      category: 'Breakbeat',
      pattern: {
        tempo: 140,
        instruments: {
          kick: { name: 'kick', steps: [true, false, false, true, false, true, false, false, true, false, false, true, false, true, false, false] },
          snare: { name: 'snare', steps: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false] },
          hihat: { name: 'hihat', steps: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false] }
        },
        totalSteps: 16
      },
      complexity: 0.8
    },
    {
      id: '4',
      name: 'Simple Rock',
      category: 'Rock',
      pattern: {
        tempo: 120,
        instruments: {
          kick: { name: 'kick', steps: [true, false, false, false, true, false, false, false] },
          snare: { name: 'snare', steps: [false, false, true, false, false, false, true, false] }
        },
        totalSteps: 8
      },
      complexity: 0.4
    },
    {
      id: '5',
      name: 'Jungle Pattern',
      category: 'Jungle',
      pattern: {
        tempo: 160,
        instruments: {
          kick: { name: 'kick', steps: [true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true] },
          snare: { name: 'snare', steps: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false] },
          hihat: { name: 'hihat', steps: [true, true, false, true, true, true, false, true, true, true, false, true, true, true, false, true] }
        },
        totalSteps: 16
      },
      complexity: 0.7
    },
    {
      id: '6',
      name: 'Ambient Drone',
      category: 'Ambient',
      pattern: {
        tempo: 60,
        instruments: {
          kick: { name: 'kick', steps: [true, false, false, false, false, false, false, false] },
          pad: { name: 'pad', steps: [true, true, true, true, true, true, true, true] }
        },
        totalSteps: 8
      },
      complexity: 0.2
    }
  ];

  const handlePatternLoad = (patternId: string) => {
    console.log('Loading pattern:', patternId);
    // TODO: Implement pattern loading logic
  };

  const handlePatternPreview = (patternId: string) => {
    console.log('Previewing pattern:', patternId);
    // TODO: Implement pattern preview logic
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Pattern Library</h1>
        <p className="text-foreground-secondary">
          Browse and discover patterns created by the community.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {samplePatterns.map((patternData) => (
          <PatternThumbnail
            key={patternData.id}
            pattern={patternData.pattern}
            name={patternData.name}
            category={patternData.category}
            complexity={patternData.complexity}
            onClick={() => handlePatternLoad(patternData.id)}
            onPreview={() => handlePatternPreview(patternData.id)}
          />
        ))}
      </div>
    </div>
  );
};
