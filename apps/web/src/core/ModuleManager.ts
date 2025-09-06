// Module Manager for the ASCII Generative Sequencer
import { ModuleInterface, ModuleManager, ModuleType } from '../types/module';

export class ModuleManagerImpl implements ModuleManager {
  public modules: Map<string, ModuleInterface> = new Map();
  public activeModule: string | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private moduleHealth: Map<string, { isHealthy: boolean; lastError?: string; lastChecked: Date }> = new Map();

  /**
   * Register a new module
   */
  registerModule(module: ModuleInterface): void {
    const moduleData = module.getData();
    const moduleId = this.generateModuleId(moduleData);

    this.modules.set(moduleId, module);
    this.moduleHealth.set(moduleId, {
      isHealthy: true,
      lastChecked: new Date()
    });
    this.emit('module:registered', { moduleId, module });

    console.log(`Module registered: ${moduleId}`);
  }

  /**
   * Unregister a module
   */
  unregisterModule(id: string): void {
    const module = this.modules.get(id);
    if (module) {
      module.destroy();
      this.modules.delete(id);
      this.moduleHealth.delete(id);
      this.emit('module:unregistered', { moduleId: id });

      if (this.activeModule === id) {
        this.activeModule = null;
      }

      console.log(`Module unregistered: ${id}`);
    }
  }

  /**
   * Get a module by ID
   */
  getModule(id: string): ModuleInterface | null {
    return this.modules.get(id) || null;
  }

  /**
   * Set the active module
   */
  setActiveModule(id: string): void {
    if (this.modules.has(id)) {
      this.activeModule = id;
      this.emit('module:activated', { moduleId: id });
      console.log(`Active module set to: ${id}`);
    }
  }

  /**
   * Get all registered modules
   */
  getAllModules(): ModuleInterface[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get modules by type
   */
  getModulesByType(type: ModuleType): ModuleInterface[] {
    return this.getAllModules().filter(module => {
      const data = module.getData();
      return data.type === type;
    });
  }

  /**
   * Initialize all modules
   */
  async initializeAll(): Promise<void> {
    const initPromises = this.getAllModules().map(async (module) => {
      const moduleId = this.getModuleId(module);
      try {
        await module.initialize();
        this.updateModuleHealth(moduleId, true);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
        this.updateModuleHealth(moduleId, false, errorMessage);
        console.error(`Failed to initialize module ${moduleId}:`, error);
      }
    });

    await Promise.all(initPromises);
    this.emit('modules:initialized', {});
  }

  /**
   * Destroy all modules
   */
  destroyAll(): void {
    this.getAllModules().forEach(module => {
      try {
        module.destroy();
      } catch (error) {
        console.error(`Error destroying module:`, error);
      }
    });

    this.modules.clear();
    this.activeModule = null;
    this.emit('modules:destroyed', {});
  }

  /**
   * Subscribe to module events
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from module events
   */
  off(event: string, callback: (data: any) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  /**
   * Emit an event to all listeners
   */
  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Generate a unique module ID
   */
  private generateModuleId(moduleData: any): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${moduleData.type}-${timestamp}-${random}`;
  }

  /**
   * Get module statistics
   */
  getStats(): {
    totalModules: number;
    activeModule: string | null;
    modulesByType: Record<ModuleType, number>;
    healthyModules: number;
    unhealthyModules: number;
  } {
    const modulesByType: Record<ModuleType, number> = {
      editor: 0,
      audio: 0,
      ai: 0,
      patterns: 0
    };

    let healthyModules = 0;
    let unhealthyModules = 0;

    this.getAllModules().forEach(module => {
      const data = module.getData();
      const moduleType = data.type as ModuleType;
      if (modulesByType[moduleType] !== undefined) {
        modulesByType[moduleType]++;
      }
    });

    this.moduleHealth.forEach(health => {
      if (health.isHealthy) {
        healthyModules++;
      } else {
        unhealthyModules++;
      }
    });

    return {
      totalModules: this.modules.size,
      activeModule: this.activeModule,
      modulesByType,
      healthyModules,
      unhealthyModules
    };
  }

  /**
   * Update module health status
   */
  updateModuleHealth(moduleId: string, isHealthy: boolean, error?: string): void {
    this.moduleHealth.set(moduleId, {
      isHealthy,
      lastError: error,
      lastChecked: new Date()
    });
    this.emit('module:health-updated', { moduleId, isHealthy, error });
  }

  /**
   * Get module health status
   */
  getModuleHealth(moduleId: string): { isHealthy: boolean; lastError?: string; lastChecked: Date } | null {
    return this.moduleHealth.get(moduleId) || null;
  }

  /**
   * Get all healthy modules
   */
  getHealthyModules(): ModuleInterface[] {
    return this.getAllModules().filter(module => {
      const moduleId = this.getModuleId(module);
      const health = this.moduleHealth.get(moduleId);
      return health?.isHealthy === true;
    });
  }

  /**
   * Get all unhealthy modules
   */
  getUnhealthyModules(): ModuleInterface[] {
    return this.getAllModules().filter(module => {
      const moduleId = this.getModuleId(module);
      const health = this.moduleHealth.get(moduleId);
      return health?.isHealthy === false;
    });
  }

  /**
   * Get module ID from module instance
   */
  getModuleId(module: ModuleInterface): string {
    for (const [id, mod] of this.modules.entries()) {
      if (mod === module) {
        return id;
      }
    }
    throw new Error('Module not found in registry');
  }
}

// Singleton instance
export const moduleManager = new ModuleManagerImpl();
