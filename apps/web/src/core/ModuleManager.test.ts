import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModuleManagerImpl } from './ModuleManager';
import { ModuleInterface } from '../types/module';

// Mock module for testing
class MockModule implements ModuleInterface {
  public id = 'test-module';
  public type = 'editor' as const;
  public name = 'Test Module';
  public description = 'A test module';
  public state = { isInitialized: false, lastUpdated: new Date() };
  public data = { test: 'data' };
  public metadata = { canVisualize: true };
  public isDestroyed = false;

  async initialize(): Promise<void> {
    this.state.isInitialized = true;
  }

  destroy(): void {
    this.isDestroyed = true;
  }

  getState() {
    return this.state;
  }

  getData() {
    return { ...this.data, type: this.type };
  }

  updateData(_data: any): void {
    // Mock implementation
  }

  getVisualizationConfig() {
    return {
      type: 'grid' as const,
      component: 'TestVisualization',
      props: {},
      responsive: true,
      realTime: true
    };
  }

  renderVisualization() {
    return null as any;
  }

  updateVisualization(_data: any): void {
    // Mock implementation
  }
}

describe('ModuleManager', () => {
  let moduleManager: ModuleManagerImpl;
  let mockModule: MockModule;

  beforeEach(() => {
    moduleManager = new ModuleManagerImpl();
    mockModule = new MockModule();
  });

  describe('module registration and health tracking', () => {
    it('should register a module and initialize health tracking', () => {
      moduleManager.registerModule(mockModule);

      const stats = moduleManager.getStats();
      expect(stats.totalModules).toBe(1);
      expect(stats.healthyModules).toBe(1);
      expect(stats.unhealthyModules).toBe(0);

      // Get the actual module ID that was generated
      const modules = moduleManager.getAllModules();
      const moduleId = modules[0] ? moduleManager.getModuleId(modules[0]) : null;

      const health = moduleManager.getModuleHealth(moduleId!);
      expect(health).not.toBeNull();
      expect(health?.isHealthy).toBe(true);
    });

    it('should track module health during initialization', async () => {
      moduleManager.registerModule(mockModule);

      await moduleManager.initializeAll();

      const modules = moduleManager.getAllModules();
      const moduleId = modules[0] ? moduleManager.getModuleId(modules[0]) : null;

      const health = moduleManager.getModuleHealth(moduleId!);
      expect(health?.isHealthy).toBe(true);
      expect(health?.lastError).toBeUndefined();
    });

    it('should handle module initialization failures', async () => {
      const failingModule = new MockModule();
      failingModule.initialize = vi.fn().mockRejectedValue(new Error('Initialization failed'));

      moduleManager.registerModule(failingModule);

      await moduleManager.initializeAll();

      const modules = moduleManager.getAllModules();
      const moduleId = modules[0] ? moduleManager.getModuleId(modules[0]) : null;

      const health = moduleManager.getModuleHealth(moduleId!);
      expect(health?.isHealthy).toBe(false);
      expect(health?.lastError).toBe('Initialization failed');
    });

    it('should update module health status', () => {
      moduleManager.registerModule(mockModule);

      const modules = moduleManager.getAllModules();
      const moduleId = modules[0] ? moduleManager.getModuleId(modules[0]) : null;

      moduleManager.updateModuleHealth(moduleId!, false, 'Test error');

      const health = moduleManager.getModuleHealth(moduleId!);
      expect(health?.isHealthy).toBe(false);
      expect(health?.lastError).toBe('Test error');
    });

    it('should get healthy modules', () => {
      const healthyModule = new MockModule();
      const unhealthyModule = new MockModule();
      unhealthyModule.id = 'unhealthy-module';

      moduleManager.registerModule(healthyModule);
      moduleManager.registerModule(unhealthyModule);

      const modules = moduleManager.getAllModules();
      const unhealthyModuleId = modules.find(m => m.id === 'unhealthy-module')
        ? moduleManager.getModuleId(modules.find(m => m.id === 'unhealthy-module')!)
        : null;

      moduleManager.updateModuleHealth(unhealthyModuleId!, false, 'Error');

      const healthyModules = moduleManager.getHealthyModules();
      const unhealthyModules = moduleManager.getUnhealthyModules();

      expect(healthyModules).toHaveLength(1);
      expect(healthyModules[0].id).toBe('test-module');
      expect(unhealthyModules).toHaveLength(1);
      expect(unhealthyModules[0].id).toBe('unhealthy-module');
    });
  });

  describe('module management', () => {
    it('should unregister a module and clean up health tracking', () => {
      moduleManager.registerModule(mockModule);
      expect(moduleManager.getStats().totalModules).toBe(1);

      const modules = moduleManager.getAllModules();
      const moduleId = modules[0] ? moduleManager.getModuleId(modules[0]) : null;

      moduleManager.unregisterModule(moduleId!);
      expect(moduleManager.getStats().totalModules).toBe(0);

      const health = moduleManager.getModuleHealth(moduleId!);
      expect(health).toBeNull();
    });

    it('should get modules by type', () => {
      const editorModule = new MockModule();
      const audioModule = new MockModule();
      audioModule.type = 'audio' as any;
      audioModule.id = 'audio-module';

      moduleManager.registerModule(editorModule);
      moduleManager.registerModule(audioModule);

      const editorModules = moduleManager.getModulesByType('editor');
      const audioModules = moduleManager.getModulesByType('audio');

      expect(editorModules).toHaveLength(1);
      expect(audioModules).toHaveLength(1);
      expect(editorModules[0].type).toBe('editor');
      expect(audioModules[0].type).toBe('audio');
    });

    it('should set and get active module', () => {
      moduleManager.registerModule(mockModule);

      const modules = moduleManager.getAllModules();
      const moduleId = modules[0] ? moduleManager.getModuleId(modules[0]) : null;

      moduleManager.setActiveModule(moduleId!);
      expect(moduleManager.activeModule).toBe(moduleId);

      const stats = moduleManager.getStats();
      expect(stats.activeModule).toBe(moduleId);
    });
  });

  describe('event system', () => {
    it('should emit module registration events', () => {
      const listener = vi.fn();
      moduleManager.on('module:registered', listener);

      moduleManager.registerModule(mockModule);

      expect(listener).toHaveBeenCalledWith({
        moduleId: expect.any(String),
        module: mockModule
      });
    });

    it('should emit module health update events', () => {
      const listener = vi.fn();
      moduleManager.on('module:health-updated', listener);

      moduleManager.registerModule(mockModule);

      const modules = moduleManager.getAllModules();
      const moduleId = modules[0] ? moduleManager.getModuleId(modules[0]) : null;

      moduleManager.updateModuleHealth(moduleId!, false, 'Test error');

      expect(listener).toHaveBeenCalledWith({
        moduleId: moduleId,
        isHealthy: false,
        error: 'Test error'
      });
    });

    it('should unsubscribe from events', () => {
      const listener = vi.fn();
      moduleManager.on('module:registered', listener);
      moduleManager.off('module:registered', listener);

      moduleManager.registerModule(mockModule);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('statistics', () => {
    it('should provide comprehensive module statistics', () => {
      const editorModule = new MockModule();
      const audioModule = new MockModule();
      audioModule.type = 'audio' as any;
      audioModule.id = 'audio-module';

      moduleManager.registerModule(editorModule);
      moduleManager.registerModule(audioModule);

      const modules = moduleManager.getAllModules();
      const audioModuleId = modules.find(m => m.id === 'audio-module')
        ? moduleManager.getModuleId(modules.find(m => m.id === 'audio-module')!)
        : null;

      moduleManager.updateModuleHealth(audioModuleId!, false, 'Audio error');

      const stats = moduleManager.getStats();

      expect(stats.totalModules).toBe(2);
      expect(stats.healthyModules).toBe(1);
      expect(stats.unhealthyModules).toBe(1);
      expect(stats.modulesByType.editor).toBe(1);
      expect(stats.modulesByType.audio).toBe(1);
    });
  });
});
