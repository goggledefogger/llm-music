// Module Visualization Wrapper for the ASCII Generative Sequencer
import React, { useState, useEffect } from 'react';
import { ModuleInterface, ModuleData } from '../../types/module';
import { VisualizationComponent } from './BaseVisualization';

export interface ModuleVisualizationProps {
  module: ModuleInterface;
  className?: string;
  onUpdate?: (data: any) => void;
}

export const ModuleVisualization: React.FC<ModuleVisualizationProps> = ({
  module,
  className,
  onUpdate
}) => {
  const [moduleData, setModuleData] = useState<ModuleData>(module.getData());
  const [isVisible, setIsVisible] = useState(true);

  // Update module data when module changes
  useEffect(() => {
    const updateData = () => {
      setModuleData(module.getData());
    };

    // Initial data
    updateData();

    // Set up periodic updates for real-time visualizations
    const config = module.getVisualizationConfig();
    let intervalId: NodeJS.Timeout | null = null;

    if (config.realTime) {
      intervalId = setInterval(updateData, 100); // Update every 100ms
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [module]);

  // Handle visualization updates
  const handleUpdate = (data: any) => {
    if (onUpdate) {
      onUpdate(data);
    }

    // Pass updates to the module
    module.updateVisualization(data);
  };

  // Get visualization configuration
  const config = module.getVisualizationConfig();

  if (!isVisible) {
    return (
      <div className={`module-visualization hidden ${className || ''}`}>
        <button
          onClick={() => setIsVisible(true)}
          className="show-visualization-btn"
        >
          Show Visualization
        </button>
      </div>
    );
  }

  return (
    <div className={`module-visualization ${moduleData.type} ${className || ''}`}>
      <div className="visualization-header">
        <h3 className="visualization-title">
          {moduleData.metadata.name} Visualization
        </h3>
        <div className="visualization-controls">
          <button
            onClick={() => setIsVisible(false)}
            className="hide-visualization-btn"
            title="Hide visualization"
          >
            ×
          </button>
        </div>
      </div>

      <div className="visualization-content">
        <VisualizationComponent
          type={config.type}
          config={config}
          data={moduleData}
          onUpdate={handleUpdate}
        />
      </div>

      {moduleData.state.error && (
        <div className="visualization-error">
          <p>Error: {moduleData.state.error}</p>
        </div>
      )}

      <div className="visualization-status">
        <span className={`status-indicator ${moduleData.state.isActive ? 'active' : 'inactive'}`}>
          {moduleData.state.isActive ? 'Active' : 'Inactive'}
        </span>
        <span className="last-updated">
          Updated: {moduleData.state.lastUpdated.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

// Hook for using module visualizations
export const useModuleVisualization = (module: ModuleInterface | null) => {
  const [isVisible, setIsVisible] = useState(true);
  const [config, setConfig] = useState(module?.getVisualizationConfig() || null);

  useEffect(() => {
    if (module) {
      setConfig(module.getVisualizationConfig());
    }
  }, [module]);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const updateVisualization = (data: any) => {
    if (module) {
      module.updateVisualization(data);
    }
  };

  return {
    isVisible,
    config,
    toggleVisibility,
    updateVisualization
  };
};
