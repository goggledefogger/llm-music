// Base Visualization Component for the ASCII Generative Sequencer
import React from 'react';
import { VisualizationConfig, ModuleData } from '../../types/module';

export interface BaseVisualizationProps {
  config: VisualizationConfig;
  data: ModuleData;
  onUpdate?: (data: any) => void;
  className?: string;
}

export abstract class BaseVisualization extends React.Component<BaseVisualizationProps> {
  protected canvasRef = React.createRef<HTMLCanvasElement>();
  protected containerRef = React.createRef<HTMLDivElement>();
  protected animationFrameId: number | null = null;

  componentDidMount() {
    this.initializeVisualization();
    this.startAnimation();
  }

  componentDidUpdate(prevProps: BaseVisualizationProps) {
    if (prevProps.data !== this.props.data) {
      this.updateVisualization();
    }
  }

  componentWillUnmount() {
    this.stopAnimation();
    this.cleanup();
  }

  // Abstract methods to be implemented by subclasses
  abstract initializeVisualization(): void;
  abstract updateVisualization(): void;
  abstract renderVisualization(): void;
  abstract cleanup(): void;

  // Base implementation
  protected startAnimation() {
    if (this.props.config.realTime) {
      this.animationFrameId = requestAnimationFrame(() => {
        this.renderVisualization();
        this.startAnimation();
      });
    }
  }

  protected stopAnimation() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  protected handleInteraction = (event: any) => {
    // Base interaction handling
    if (this.props.onUpdate) {
      this.props.onUpdate({
        type: 'interaction',
        event,
        timestamp: Date.now()
      });
    }
  };

  render() {
    const { config, className } = this.props;

    return (
      <div
        ref={this.containerRef}
        className={`visualization ${config.type} ${className || ''}`}
        data-module={this.props.data.type}
        data-visualization={config.type}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative'
        }}
      >
        <canvas
          ref={this.canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block'
          }}
          onMouseDown={this.handleInteraction}
          onMouseMove={this.handleInteraction}
          onMouseUp={this.handleInteraction}
          onTouchStart={this.handleInteraction}
          onTouchMove={this.handleInteraction}
          onTouchEnd={this.handleInteraction}
        />
        {this.renderOverlay()}
      </div>
    );
  }

  protected renderOverlay(): React.ReactNode {
    return null;
  }

  // Utility methods
  protected getCanvasContext(): CanvasRenderingContext2D | null {
    const canvas = this.canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Set up canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    return ctx;
  }

  protected resizeCanvas() {
    const canvas = this.canvasRef.current;
    const container = this.containerRef.current;

    if (canvas && container) {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    }
  }
}

// Functional component wrapper for easier use
export interface VisualizationComponentProps extends BaseVisualizationProps {
  type: string;
}

export const VisualizationComponent: React.FC<VisualizationComponentProps> = ({
  type,
  ...props
}) => {
  // This would dynamically import and render the appropriate visualization
  // For now, return a placeholder
  return (
    <div className={`visualization-placeholder ${type}`}>
      <div className="visualization-content">
        <h3>{type} Visualization</h3>
        <p>Module: {props.data.type}</p>
        <p>Component: {props.config.component}</p>
        <p>Real-time: {props.config.realTime ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
};
