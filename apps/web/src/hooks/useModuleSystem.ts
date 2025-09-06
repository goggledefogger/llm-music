// Module System Hook for the ASCII Generative Sequencer
import { useState, useEffect, useCallback } from 'react';
import { ModuleInterface, ModuleType } from '../types/module';
import { moduleManager } from '../core/ModuleManager';
import { EditorModule } from '../modules/EditorModule';
import { AudioModule } from '../modules/AudioModule';
import { AIModule } from '../modules/AIModule';
import { PatternsModule } from '../modules/PatternsModule';

export interface ModuleSystemState {
  modules: Map<string, ModuleInterface>;
  activeModule: string | null;
  isInitialized: boolean;
  error: string | null;
}

export interface ModuleSystemHook {
  state: ModuleSystemState;
  getModule: (id: string) => ModuleInterface | null;
  getModuleByType: (type: ModuleType) => ModuleInterface | null;
  setActiveModule: (id: string) => void;
  updateModuleData: (id: string, data: any) => void;
  initialize: () => Promise<void>;
  destroy: () => void;
}

export const useModuleSystem = (): ModuleSystemHook => {
  const [state, setState] = useState<ModuleSystemState>({
    modules: new Map(),
    activeModule: null,
    isInitialized: false,
    error: null
  });

  // Initialize modules
  const initialize = useCallback(async () => {
    if (state.isInitialized) {
      return;
    }

    try {
      setState(prev => ({ ...prev, error: null }));

      // Only create and register modules if they don't exist
      const existingModules = moduleManager.getAllModules();
      const hasModules = existingModules.length > 0;

      if (!hasModules) {
        // Create and register modules
        const editorModule = new EditorModule();
        const audioModule = new AudioModule();
        const aiModule = new AIModule();
        const patternsModule = new PatternsModule();

        moduleManager.registerModule(editorModule);
        moduleManager.registerModule(audioModule);
        moduleManager.registerModule(aiModule);
        moduleManager.registerModule(patternsModule);
      }

      // Initialize all modules
      await moduleManager.initializeAll();

      // Set initial state
      setState(prev => ({
        ...prev,
        modules: new Map(moduleManager.modules),
        activeModule: moduleManager.activeModule,
        isInitialized: true
      }));

      console.log('Module system initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize module system';
      setState(prev => ({ ...prev, error: errorMessage }));
      console.error('Module system initialization failed:', error);
    }
  }, [state.isInitialized]);

  // Destroy modules
  const destroy = useCallback(() => {
    try {
      moduleManager.destroyAll();
      setState(prev => ({
        ...prev,
        modules: new Map(),
        activeModule: null,
        isInitialized: false
      }));
      console.log('Module system destroyed');
    } catch (error) {
      console.error('Error destroying module system:', error);
    }
  }, []);

  // Get module by ID
  const getModule = useCallback((id: string): ModuleInterface | null => {
    return moduleManager.getModule(id);
  }, []);

  // Get module by type
  const getModuleByType = useCallback((type: ModuleType): ModuleInterface | null => {
    const modules = moduleManager.getModulesByType(type);
    return modules.length > 0 ? modules[0] : null;
  }, []);

  // Set active module
  const setActiveModule = useCallback((id: string) => {
    moduleManager.setActiveModule(id);
    setState(prev => ({
      ...prev,
      activeModule: moduleManager.activeModule
    }));
  }, []);

  // Update module data
  const updateModuleData = useCallback((id: string, data: any) => {
    const module = moduleManager.getModule(id);
    if (module) {
      module.updateData(data);
      setState(prev => ({
        ...prev,
        modules: new Map(moduleManager.modules)
      }));
    }
  }, []);

  // Listen for module events
  useEffect(() => {
    const handleModuleRegistered = (_data: any) => {
      setState(prev => ({
        ...prev,
        modules: new Map(moduleManager.modules)
      }));
    };

    const handleModuleUnregistered = (_data: any) => {
      setState(prev => ({
        ...prev,
        modules: new Map(moduleManager.modules),
        activeModule: moduleManager.activeModule
      }));
    };

    const handleModuleActivated = (_data: any) => {
      setState(prev => ({
        ...prev,
        activeModule: moduleManager.activeModule
      }));
    };

    moduleManager.on('module:registered', handleModuleRegistered);
    moduleManager.on('module:unregistered', handleModuleUnregistered);
    moduleManager.on('module:activated', handleModuleActivated);

    return () => {
      moduleManager.off('module:registered', handleModuleRegistered);
      moduleManager.off('module:unregistered', handleModuleUnregistered);
      moduleManager.off('module:activated', handleModuleActivated);
    };
  }, []);

  // Auto-initialize on mount (only once)
  useEffect(() => {
    if (!state.isInitialized) {
      initialize();
    }

    return () => {
      // Only destroy if this is the last instance
      // We'll let the singleton handle cleanup
    };
  }, [state.isInitialized, initialize]);

  return {
    state,
    getModule,
    getModuleByType,
    setActiveModule,
    updateModuleData,
    initialize,
    destroy
  };
};

// Convenience hooks for specific modules
export const useEditorModule = () => {
  const { getModuleByType } = useModuleSystem();
  return getModuleByType('editor') as EditorModule | null;
};

export const useAudioModule = () => {
  const { getModuleByType } = useModuleSystem();
  return getModuleByType('audio') as AudioModule | null;
};

export const useAIModule = () => {
  const { getModuleByType } = useModuleSystem();
  return getModuleByType('ai') as AIModule | null;
};

export const usePatternsModule = () => {
  const { getModuleByType } = useModuleSystem();
  return getModuleByType('patterns') as PatternsModule | null;
};
