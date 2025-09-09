import React, { useState } from 'react';
import { CollapsibleSection } from './CollapsibleSection';
import { 
  StepSequencerGrid, 
  QuickStatsBar, 
  PatternAnalysis, 
  AudioEffects,
  SampleLibrary,
  PlayheadIndicator, 
  WaveformDisplay 
} from '../visualizations';
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
    stepSequencer: true,    // Always visible - primary visualization
    quickStats: true,       // Always visible - essential metrics
    audioWaveform: true,    // Always visible - playback feedback
    patternAnalysis: false, // Expandable - detailed breakdowns
    audioEffects: false,    // Collapsible - advanced audio processing
    sampleLibrary: true     // Small helper panel for sample mapping
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className={`ultra-compact-spacing w-full min-w-0 ${className}`}>
      {/* 0. Sample Library - Quick mapping helpers */}
      <div className="visualization-section">
        <CollapsibleSection
          title="Sample Library"
          icon="📦"
          isExpanded={expandedSections.sampleLibrary}
          onToggle={() => toggleSection('sampleLibrary')}
          className="h-auto"
        >
          <SampleLibrary className="h-auto" />
        </CollapsibleSection>
      </div>

      {/* 1. Step Sequencer - Most Used (Primary Tool) */}
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

      {/* 2. Audio Waveform - Real-time Feedback (Second Most Used) */}
      <div className="visualization-section">
        <CollapsibleSection
          title="Audio Waveform"
          icon="🎧"
          isExpanded={expandedSections.audioWaveform}
          onToggle={() => toggleSection('audioWaveform')}
          className="h-auto"
        >
          <div className="ultra-compact-spacing">
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

      {/* 3. Audio Effects - EQ and Processing (Frequently Used During Creation) */}
      <div className="visualization-section">
        <CollapsibleSection
          title="Audio Effects"
          icon="🎛️"
          isExpanded={expandedSections.audioEffects}
          onToggle={() => toggleSection('audioEffects')}
          className="h-auto"
        >
          <AudioEffects
            pattern={pattern}
            className="h-auto"
          />
        </CollapsibleSection>
      </div>

      {/* 4. Quick Stats - Quick Reference */}
      <div className="visualization-section">
        <CollapsibleSection
          title="Quick Stats"
          icon="📊"
          isExpanded={expandedSections.quickStats}
          onToggle={() => toggleSection('quickStats')}
          className="h-auto"
        >
          <QuickStatsBar
            pattern={pattern}
            className="h-auto"
          />
        </CollapsibleSection>
      </div>

      {/* 5. Pattern Analysis - Detailed Analysis (When Needed) */}
      <div className="visualization-section">
        <CollapsibleSection
          title="Pattern Analysis"
          icon="📈"
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
    </div>
  );
};
