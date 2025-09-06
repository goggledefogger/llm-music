import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ModuleSystemProvider } from '../contexts/ModuleSystemContext';
import { AudioEngineProvider } from '../contexts/AudioEngineContext';

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ModuleSystemProvider>
      <AudioEngineProvider>
        {children}
      </AudioEngineProvider>
    </ModuleSystemProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };
