import React, { useState } from 'react';
import { CollapsibleSection } from './CollapsibleSection';
import { StepSequencerGrid, PatternAnalysis, PlayheadIndicator, WaveformDisplay } from '../visualizations';
import { ParsedPattern } from '../../types/app';

interface VisualizationPanelProps {
  pattern: ParsedPattern | null;
  currentStep?: number;
  currentTime?: number;
  isPlaying?: boolean;
  tempo?: number;
  className?: string;
}

export const VisualizationPanel: React.FC<VisualizationPanelProps> = ({
  pattern,
  currentStep = -1,
  currentTime = 0,
  isPlaying = false,
  tempo = 120,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState({
    stepSequencer: true, // Default to expanded as it's most important
    patternAnalysis: false,
    audioVisualization: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Step Sequencer Grid */}
      <div className="visualization-section">
        <CollapsibleSection
          title="Step Sequencer"
          icon="🎵"
          isExpanded={expandedSections.stepSequencer}
          onToggle={() => toggleSection('stepSequencer')}
          className="h-auto"
        >
          <StepSequencerGrid
            pattern={pattern}
            currentStep={currentStep}
            className="h-auto"
          />
        </CollapsibleSection>
      </div>

      {/* Pattern Analysis */}
      <div className="visualization-section">
        <CollapsibleSection
          title="Pattern Analysis"
          icon="📊"
          isExpanded={expandedSections.patternAnalysis}
          onToggle={() => toggleSection('patternAnalysis')}
          className="h-auto"
        >
          <PatternAnalysis
            pattern={pattern}
            className="h-auto"
          />
        </CollapsibleSection>
      </div>

      {/* Audio Visualizations */}
      <div className="visualization-section">
        <CollapsibleSection
          title="Audio Visualizations"
          icon="🎧"
          isExpanded={expandedSections.audioVisualization}
          onToggle={() => toggleSection('audioVisualization')}
          className="h-auto"
        >
          <div className="space-y-4">
            <PlayheadIndicator
              pattern={pattern}
              currentTime={currentTime}
              isPlaying={isPlaying}
              tempo={tempo}
              className="h-auto"
            />
            <WaveformDisplay
              pattern={pattern}
              currentTime={currentTime}
              isPlaying={isPlaying}
              tempo={tempo}
              className="h-auto"
            />
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
};
