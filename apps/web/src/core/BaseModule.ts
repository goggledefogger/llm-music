// Base Module class for the ASCII Generative Sequencer
import { ModuleInterface, ModuleData, ModuleState, ModuleMetadata, ModuleType } from '../types/module';

export abstract class BaseModule implements ModuleInterface {
  protected data: ModuleData;
  protected state: ModuleState;
  protected metadata: ModuleMetadata;
  protected isDestroyed: boolean = false;

  constructor(
    type: ModuleType,
    name: string,
    description: string,
    capabilities: any = {}
  ) {
    this.state = {
      isActive: false,
      isInitialized: false,
      isLoading: false,
      error: null,
      lastUpdated: new Date()
    };

    this.metadata = {
      name,
      description,
      version: '1.0.0',
      capabilities: {
        canVisualize: true,
        canExport: false,
        canImport: false,
        canShare: false,
        canAnalyze: false,
        ...capabilities
      },
      visualization: {
        type: 'grid',
        component: 'DefaultVisualization',
        props: {},
        responsive: true,
        realTime: false
      }
    };

    this.data = {
      id: this.generateId(),
      type,
      state: this.state,
      data: this.getInitialData(),
      metadata: this.metadata
    };
  }

  // Core module methods
  async initialize(): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('Cannot initialize destroyed module');
    }

    this.setState({ isLoading: true, error: null });

    try {
      await this.onInitialize();
      this.setState({
        isInitialized: true,
        isLoading: false,
        lastUpdated: new Date()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.setState({
        isLoading: false,
        error: errorMessage
      });
      throw error;
    }
  }

  destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    try {
      this.onDestroy();
    } catch (error) {
      console.error(`Error in module destroy:`, error);
    } finally {
      this.isDestroyed = true;
      this.setState({ isActive: false, isInitialized: false });
    }
  }

  getState(): ModuleState {
    return { ...this.state };
  }

  getData(): ModuleData {
    return {
      ...this.data,
      state: this.getState(),
      data: this.getModuleData()
    };
  }

  updateData(newData: any): void {
    if (this.isDestroyed) {
      return;
    }

    try {
      this.onDataUpdate(newData);
      this.setState({ lastUpdated: new Date() });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Data update failed';
      this.setState({ error: errorMessage });
    }
  }

  // Visualization methods
  getVisualizationConfig() {
    return { ...this.metadata.visualization };
  }

  abstract renderVisualization(): React.ReactElement;

  updateVisualization(data: any): void {
    if (this.isDestroyed) {
      return;
    }

    try {
      this.onVisualizationUpdate(data);
    } catch (error) {
      console.error(`Error updating visualization:`, error);
    }
  }

  // Protected methods for subclasses to override
  protected abstract getInitialData(): any;
  protected abstract getModuleData(): any;
  protected abstract onInitialize(): Promise<void>;
  protected onDestroy(): void {}
  protected onDataUpdate(_newData: any): void {}
  protected onVisualizationUpdate(_data: any): void {}

  // Utility methods
  protected setState(updates: Partial<ModuleState>): void {
    this.state = { ...this.state, ...updates };
    this.data.state = this.state;
  }

  protected setError(error: string | null): void {
    this.setState({ error });
  }

  protected clearError(): void {
    this.setState({ error: null });
  }

  protected setActive(active: boolean): void {
    this.setState({ isActive: active });
  }

  private generateId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${this.metadata.name.toLowerCase()}-${timestamp}-${random}`;
  }

  // Module-specific methods (to be implemented by subclasses)
  [key: string]: any;
}
