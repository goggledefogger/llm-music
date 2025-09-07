# ASCII Generative Sequencer - Development Guide

## Overview

This guide provides comprehensive instructions for setting up, developing, and contributing to the ASCII Generative Sequencer project. The project is a browser-based music sequencer that combines ASCII pattern notation with AI assistance.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Development Environment](#development-environment)
3. [Project Structure](#project-structure)
4. [Available Scripts](#available-scripts)
5. [Testing](#testing)
6. [Code Standards](#code-standards)
7. [Contributing](#contributing)
8. [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

- **Node.js**: 18.0 or higher
- **pnpm**: 9.0 or higher (package manager)
- **Git**: 2.0 or higher

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd llm-music
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

4. **Start development server**
   ```bash
   pnpm dev:web
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Development Environment

### Package Manager: pnpm

This project uses pnpm with workspace protocol for efficient dependency management:

```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version
```

### Workspace Configuration

The project uses a monorepo structure with pnpm workspaces:

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Key Dependencies

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS with modular design system
- **Audio**: Web Audio API (direct implementation)
- **Editor**: Custom text editor implementation
- **Testing**: Vitest, React Testing Library
- **Build**: Turborepo for monorepo management
- **State Management**: React Context with focused custom hooks

## Project Structure

```
llm-music/
├── apps/
│   ├── web/                    # React frontend application
│   │   ├── src/
│   │   │   ├── components/     # UI components
│   │   │   │   ├── ai/         # AI chat interface
│   │   │   │   ├── audio/      # Audio controls
│   │   │   │   ├── editor/     # ASCII editor
│   │   │   │   ├── layout/     # Layout components
│   │   │   │   └── visualization/ # Audio visualizations
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── pages/          # Page components
│   │   │   ├── services/       # API services
│   │   │   ├── stores/         # State management (not used - using React Context)
│   │   │   ├── styles/         # Global styles
│   │   │   ├── types/          # TypeScript types
│   │   │   └── utils/          # Utility functions
│   │   ├── public/             # Static assets
│   │   ├── tests/              # Test files
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── vitest.config.ts
│   └── api/                    # Vercel serverless functions
├── packages/
│   ├── shared/                 # Shared types and utilities
│   │   ├── src/
│   │   │   ├── types/          # TypeScript interfaces
│   │   │   ├── constants/      # Shared constants
│   │   │   └── utils/          # Shared utilities
│   │   └── package.json
│   ├── ui/                     # Shared UI components
│   └── config/                 # Shared configuration
├── docs/                       # Documentation
├── .env.example                # Environment template
├── package.json                # Root package.json
├── pnpm-workspace.yaml         # pnpm workspace config
├── turbo.json                  # Turborepo configuration
└── README.md
```

## Available Scripts

### Root Level Commands

```bash
# Development
pnpm dev              # Start all development servers
pnpm dev:web          # Start only the web app
pnpm dev:api          # Start only the API functions

# Building
pnpm build            # Build all packages
pnpm build:web        # Build only the web app
pnpm build:api        # Build only the API functions

# Testing
pnpm test             # Run all tests
pnpm test:watch       # Run tests in watch mode
pnpm test:e2e         # Run end-to-end tests

# Code Quality
pnpm lint             # Lint all packages
pnpm lint:fix         # Fix linting issues
pnpm type-check       # Type check all packages
pnpm format           # Format code with Prettier

# Package Management
pnpm clean            # Clean all build artifacts
pnpm install:clean    # Clean install all dependencies
```

### Web App Specific Commands

```bash
cd apps/web

# Development
pnpm dev              # Start web development server
pnpm build            # Build web app for production
pnpm preview          # Preview production build

# Testing
pnpm test             # Run web app tests
pnpm test:ui          # Run tests with UI
pnpm test:coverage    # Run tests with coverage

# Code Quality
pnpm lint             # Lint web app code
pnpm type-check       # Type check web app
```

## ASCII DSL Syntax

### Basic Pattern Syntax

The ASCII Generative Sequencer uses a simple, keyboard-friendly DSL for creating musical patterns:

```ascii
TEMPO 120

seq kick: x...x...x...x...
seq snare: ....x.......x...
seq hihat: x.x.x.x.x.x.x.x.
```

**Key Elements:**
- `TEMPO`: Sets the BPM (60-200 range)
- `seq instrument:`: Defines a step sequence for an instrument
- `x`: Active step (sound plays)
- `.`: Inactive step (silence)
- `#`: Comment line

### EQ Module Syntax (Added Sept 2025)

The sequencer now supports **EQ (Equalizer) modules** for professional audio control:

```ascii
TEMPO 120

# EQ Settings
eq master: low=0 mid=0 high=0
eq kick: low=2 mid=-1 high=1
eq snare: low=-1 mid=2 high=1

seq kick: x...x...x...x...
seq snare: ....x.......x...
seq hihat: x.x.x.x.x.x.x.x.
```

**EQ Syntax:**
- `eq name:`: Defines an EQ module
- `low=X`: Bass frequency adjustment (-3 to +3)
- `mid=Y`: Midrange frequency adjustment (-3 to +3)
- `high=Z`: Treble frequency adjustment (-3 to +3)

**EQ Features:**
- **Keyboard-Only**: No mouse required - pure text input
- **Range Control**: Values automatically clamped to -3 to +3
- **Real-time Visualization**: Color-coded display in Pattern Analysis
- **Multiple Modules**: Support for unlimited EQ modules
- **Validation**: Comprehensive error handling

**EQ Examples:**
```ascii
# Boost kick bass, cut snare low end
eq kick: low=3 mid=0 high=-1
eq snare: low=-2 mid=2 high=1

# Master EQ for overall mix
eq master: low=1 mid=0 high=-1

# Hihat with bright top end
eq hihat: low=0 mid=0 high=2
```

### Pattern Validation

The system provides real-time validation with helpful error messages:

```ascii
# Valid pattern
TEMPO 120
eq kick: low=2 mid=-1 high=1
seq kick: x...x...x...x...

# Invalid patterns with error messages
eq kick: low=5 mid=invalid high=1  # Error: Invalid EQ values
seq kick: x...x...x...x...x...x...x...x...x...x...x...x...x...x...x...x...x...  # Warning: Too many steps
```

## Pattern Loading System

### Overview

The ASCII Generative Sequencer includes a comprehensive pattern loading system that allows users to browse, search, filter, and load existing patterns from a pattern library. This system provides seamless integration between the pattern library and the editor.

### Key Components

#### PatternService
```typescript
// Complete pattern storage and retrieval system
export class PatternService {
  // Core storage operations
  static getStoredPatterns(): StoredPattern[]
  static savePattern(pattern: Omit<StoredPattern, 'id' | 'createdAt' | 'updatedAt'>): StoredPattern
  static updatePattern(id: string, updates: Partial<StoredPattern>): StoredPattern | null
  static deletePattern(id: string): boolean

  // Search and filtering
  static getPatternsByCategory(category: string): StoredPattern[]
  static searchPatterns(query: string): StoredPattern[]
  static getPatternById(id: string): StoredPattern | null

  // Initialization
  static initializeStorage(): void
  static getSamplePatterns(): StoredPattern[]
}
```

#### Pattern Loading Workflow
1. **Browse Patterns**: Users navigate to the Patterns page to see all available patterns
2. **Search & Filter**: Users can search by name/content and filter by category
3. **Load Pattern**: Clicking "Load" instantly loads the pattern into the editor
4. **Automatic Navigation**: User is automatically navigated to the editor page (`/editor`)
5. **Editor Integration**: Pattern appears in ASCII editor with full audio integration

#### Sample Patterns
The system includes 6 pre-loaded sample patterns:
- **Basic House Beat** (House) - 128 BPM, 3 instruments
- **Minimal Techno** (Techno) - 130 BPM, 2 instruments
- **Complex Breakbeat** (Breakbeat) - 140 BPM, 3 instruments
- **Simple Rock** (Rock) - 120 BPM, 2 instruments
- **Jungle Pattern** (Jungle) - 160 BPM, 3 instruments
- **Ambient Drone** (Ambient) - 60 BPM, 2 instruments

### Testing Pattern Loading

```typescript
// Test pattern loading functionality
it('should load pattern when load button is clicked', async () => {
  const { PatternService } = await import('../services/patternService');
  (PatternService.getStoredPatterns as any).mockReturnValue([
    {
      id: 'test-1',
      name: 'Test Pattern',
      category: 'Test',
      content: 'TEMPO 120\nseq kick: x...x...',
      parsedPattern: { /* parsed data */ },
      complexity: 0.5,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      isPublic: true
    }
  ]);

  render(<PatternsPage />);
  
  await waitFor(() => {
    expect(screen.getByText('Test Pattern')).toBeInTheDocument();
  });

  const loadButton = screen.getByText('Load');
  fireEvent.click(loadButton);

  expect(mockLoadPattern).toHaveBeenCalledWith('test-1');
});
```

## Testing

### Test Framework: Vitest

The project uses Vitest for fast, modern testing:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test App.test.tsx
```

### Current Test Status
- **Total Tests**: 114 tests
- **Passing**: 114 tests ✅
- **Failing**: 0 tests ✅
- **Coverage**: Comprehensive coverage of components, services, and utilities
- **Test Quality**: Robust testing practices with behavior-focused approach
- **Integration Tests**: 2 focused integration tests covering core user workflows

### Test Structure

```
apps/web/src/
├── components/
│   ├── editor/
│   │   ├── ASCIIEditor.tsx
│   │   └── ASCIIEditor.test.tsx
│   └── audio/
│       ├── TransportControls.tsx
│       └── TransportControls.test.tsx
├── hooks/
│   ├── useAudioEngine.ts
│   └── useAudioEngine.test.ts
├── test/
│   ├── integration/
│   │   └── workflow.test.tsx
│   ├── sharedMocks.ts
│   └── setup.ts
```

### Writing Tests

```typescript
// Example test file with auto-validation testing
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ASCIIEditor } from './ASCIIEditor'

describe('ASCIIEditor', () => {
  it('renders without crashing', () => {
    render(<ASCIIEditor />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('auto-validates and loads valid patterns', async () => {
    render(<ASCIIEditor />)
    const editor = screen.getByRole('textbox')

    // Type a valid pattern
    fireEvent.change(editor, { target: { value: 'TEMPO 120\nseq kick: x...x...' } })

    // Wait for auto-validation to complete
    await waitFor(() => {
      expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument()
    })
  })

  it('shows validation errors for invalid patterns', async () => {
    render(<ASCIIEditor />)
    const editor = screen.getByRole('textbox')

    // Type an invalid pattern
    fireEvent.change(editor, { target: { value: 'INVALID PATTERN' } })

    // Wait for validation to complete
    await waitFor(() => {
      expect(screen.getByText('✗ Invalid')).toBeInTheDocument()
    })
  })

  it('shows warnings for patterns with issues', async () => {
    render(<ASCIIEditor />)
    const editor = screen.getByRole('textbox')

    // Type a pattern with warnings (no tempo)
    fireEvent.change(editor, { target: { value: 'seq kick: x...' } })

    await waitFor(() => {
      expect(screen.getByText(/No tempo specified/)).toBeInTheDocument()
    })
  })
})
```

### Recent Testing Improvements

#### Mock Centralization
We've centralized common mocks to reduce duplication and improve maintainability:

```typescript
// src/test/sharedMocks.ts
export const mockAudioContext = { /* centralized mock */ };
export const mockTone = { /* centralized mock */ };
export const resetMocks = () => { /* reset helper */ };

// Usage in tests
import { mockAudioContext, mockTone, resetMocks } from '../test/sharedMocks';
```

**Benefits**:
- Reduced code duplication by ~70 lines per test file
- Consistent mock behavior across all tests
- Single source of truth for common mocks

#### Integration Testing
We've simplified integration tests to focus on behavior rather than implementation details:

```typescript
// ✅ Good: Test complete workflows
it('should complete basic workflow: create pattern → validate → play → stop', async () => {
  // Test the essential user journey
});

// ❌ Avoid: Overly specific UI expectations
expect(screen.getByText('140 BPM')).toBeInTheDocument();
```

**Key Principle**: Integration tests should verify workflows work end-to-end, not test implementation details.

### Testing Best Practices

#### Handling Multiple Elements

When testing components that may have multiple elements with the same text, use `getAllByText` instead of `getByText`:

```typescript
// ❌ This will fail if there are multiple "kick" elements
expect(screen.getByText('kick')).toBeInTheDocument()

// ✅ This handles multiple elements correctly
const kickElements = screen.getAllByText('kick')
expect(kickElements.length).toBeGreaterThan(0)
```

#### Handling Split Text

When text is split across multiple HTML elements (common with Tailwind CSS), use regex patterns:

```typescript
// ❌ This will fail if text is split like "3 instruments • 16 steps"
expect(screen.getByText('16 steps')).toBeInTheDocument()

// ✅ This handles split text correctly
expect(screen.getByText(/16 steps/)).toBeInTheDocument()
```

#### Specific Element Selection

When there are multiple elements with the same role, be more specific:

```typescript
// ❌ This will fail if there are multiple textboxes
const editor = screen.getByRole('textbox')

// ✅ This targets a specific textbox by placeholder
const editor = screen.getByPlaceholderText('Enter your ASCII pattern here...')
```

#### Component-Specific Text Matching

Match the actual rendered text, not what you expect:

```typescript
// ❌ This assumes the component shows "Pattern Loop: 2/4"
expect(screen.getByText('Pattern Loop: 2/4')).toBeInTheDocument()

// ✅ This matches the actual component behavior
expect(screen.getByText('Pattern Loop: 2/16')).toBeInTheDocument()
```

#### Handling Dynamic Content

For content that changes based on component state, use flexible matchers:

```typescript
// ❌ This assumes exact text format
expect(screen.getByText('Current Step: 5')).toBeInTheDocument()

// ✅ This handles the actual component structure
expect(screen.getByText('Current Step:')).toBeInTheDocument()
const currentStepElements = screen.getAllByText('5')
expect(currentStepElements.length).toBeGreaterThan(0)
```

### Test Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
```

### Common Testing Pitfalls

#### 1. Multiple Elements with Same Text

**Problem**: `getByText` fails when multiple elements contain the same text.

**Solution**: Use `getAllByText` and check the length:

```typescript
const elements = screen.getAllByText('kick')
expect(elements.length).toBeGreaterThan(0)
```

#### 2. Split Text Across Elements

**Problem**: Text is broken up by whitespace or spans in the HTML.

**Solution**: Use regex patterns:

```typescript
expect(screen.getByText(/16 steps/)).toBeInTheDocument()
```

#### 3. Component Behavior Assumptions

**Problem**: Tests assume component behavior without checking actual implementation.

**Solution**: Inspect the actual rendered HTML and match it:

```typescript
// Check what the component actually renders
console.log(screen.debug())
```

#### 4. Role Ambiguity

**Problem**: Multiple elements have the same role (e.g., multiple textboxes).

**Solution**: Use more specific selectors:

```typescript
// Use placeholder, label, or other unique attributes
const editor = screen.getByPlaceholderText('Enter your ASCII pattern here...')
```

#### 5. Async Content Loading

**Problem**: Content loads asynchronously and tests run before it's ready.

**Solution**: Use `waitFor` for async operations:

```typescript
await waitFor(() => {
  expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument()
})
```

### Debugging Test Failures

#### 1. Inspect Rendered HTML

```typescript
// Add this to any test to see the full HTML output
console.log(screen.debug())
```

#### 2. Check for Multiple Elements

```typescript
// Use getAllByText to see how many elements match
const elements = screen.getAllByText('kick')
console.log('Found', elements.length, 'elements with text "kick"')
```

#### 3. Use More Specific Queries

```typescript
// Instead of getByText, use getByRole with name
const button = screen.getByRole('button', { name: '▶️' })

// Or use getByTestId for unique identifiers
const element = screen.getByTestId('unique-test-id')
```

#### 4. Test Component Behavior, Not Implementation

```typescript
// ❌ Testing implementation details
expect(component.state.isValid).toBe(true)

// ✅ Testing user-visible behavior
expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument()
```

## Current Implementation Status

### ✅ Completed Features

**Audio Engine:**
- Complete Web Audio API implementation with professional-quality synthesis
- Kick, snare, hihat synthesizers with proper timing and envelopes
- Sample-accurate audio scheduling and pattern playback
- Cross-platform compatibility (desktop and mobile)
- Transport controls with play, pause, stop functionality
- Tempo and volume control with real-time adjustment

**Pattern System:**
- Boolean-based pattern parsing with real-time validation
- Pattern auto-loading when audio engine becomes ready
- Real-time validation with debouncing and error handling

**Architecture:**
- Simplified component-based architecture with focused custom hooks
- Single context provider (AppProvider) for unified state management
- Consolidated type definitions with no duplication
- Clean build process with all compilation errors resolved

### 🚧 In Progress

**ASCII Editor:**
- Basic textarea with real-time validation
- CodeMirror 6 integration pending
- Custom DSL syntax highlighting pending

**AI Integration:**
- Mock chat interface implemented
- OpenAI API integration pending

## Auto-Validation System

### Overview

The ASCII Generative Sequencer features an **auto-validation system** that validates and loads patterns automatically as users type, without requiring manual button clicks. This provides immediate feedback and a seamless user experience.

### Key Features

- **Real-time Validation**: Patterns are validated as users type with a 300ms debounce
- **Auto-loading**: Valid patterns are automatically loaded into the audio engine
- **Graceful Error Handling**: Invalid patterns don't break the system - only the problematic parts are disabled
- **Detailed Feedback**: Users see specific errors, warnings, and valid instrument status
- **Module Health Tracking**: The system tracks which modules are healthy and which have failed

### Implementation Details

#### Pattern Parser Enhancements

```typescript
// Enhanced validation with detailed feedback
static validate(pattern: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validInstruments: string[];
  invalidInstruments: string[];
}

// Partial parsing for graceful degradation
static parsePartial(pattern: string): {
  parsed: ParsedPattern | null;
  errors: string[];
  warnings: string[];
  validInstruments: string[];
}
```

#### Module Health System

```typescript
// Module health tracking
interface ModuleHealth {
  isHealthy: boolean;
  lastError?: string;
  lastChecked: Date;
}

// Graceful failure handling
updateModuleHealth(moduleId: string, isHealthy: boolean, error?: string): void
getHealthyModules(): ModuleInterface[]
getUnhealthyModules(): ModuleInterface[]
```

#### Auto-Validation Flow

1. **User Types**: Content changes trigger validation
2. **Debounced Validation**: 300ms delay prevents excessive validation
3. **Pattern Analysis**: Parser validates syntax and structure
4. **Module Updates**: Editor module receives validation results
5. **Audio Loading**: Valid patterns are auto-loaded into audio engine
6. **UI Feedback**: Users see real-time validation status

### Testing Auto-Validation

```typescript
// Test auto-validation behavior
it('should auto-validate patterns as user types', async () => {
  render(<ASCIIEditor />);
  const editor = screen.getByRole('textbox');

  // Type valid pattern
  fireEvent.change(editor, { target: { value: 'TEMPO 120\nseq kick: x...x...' } });

  await waitFor(() => {
    expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument();
  });
});
```

### Testing EQ Modules

```typescript
// Test EQ module parsing
it('should parse EQ modules correctly', () => {
  const pattern = `TEMPO 120
eq master: low=0 mid=0 high=0
eq kick: low=2 mid=-1 high=1
seq kick: x...x...x...x...`;

  const result = PatternParser.parse(pattern);

  expect(result.eqModules.master).toEqual({
    name: 'master',
    low: 0,
    mid: 0,
    high: 0
  });
  expect(result.eqModules.kick).toEqual({
    name: 'kick',
    low: 2,
    mid: -1,
    high: 1
  });
});

// Test EQ value clamping
it('should clamp EQ values to -3 to +3 range', () => {
  const pattern = `TEMPO 120
eq test: low=5 mid=-10 high=0`;

  const result = PatternParser.parse(pattern);

  expect(result.eqModules.test).toEqual({
    name: 'test',
    low: 3,    // Clamped from 5
    mid: -3,   // Clamped from -10
    high: 0
  });
});

// Test EQ validation
it('should validate EQ syntax correctly', () => {
  const validPattern = `TEMPO 120
eq master: low=0 mid=0 high=0
seq kick: x...x...x...x...`;

  const invalidPattern = `TEMPO 120
eq invalid: low=2 mid=invalid high=1
seq kick: x...x...x...x...`;

  const validResult = PatternParser.validate(validPattern);
  const invalidResult = PatternParser.validate(invalidPattern);

  expect(validResult.isValid).toBe(true);
  expect(invalidResult.isValid).toBe(false);
  expect(invalidResult.errors.some(error => 
    error.includes('Invalid EQ values')
  )).toBe(true);
});
```

### Testing Audio Engine

The audio engine tests use comprehensive mocking to test Web Audio API functionality:

```typescript
// Mock Web Audio API for testing
const mockAudioContext = {
  currentTime: 0,
  state: 'running',
  sampleRate: 44100,
  createGain: vi.fn(() => ({
    gain: { 
      value: 0.5,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn()
    },
    connect: vi.fn(),
  })),
  // ... other mock methods
};
```

### Recent Fixes

#### Sequencer Continuous Playback Fix
- **Issue**: Sequencer was resetting to 0:00 after each loop
- **Solution**: Implemented multi-loop scheduling (4 loops ahead)
- **Result**: Seamless continuous playback with proper timing
- **Testing**: Comprehensive test coverage with 112 passing tests

#### Test Suite Simplification
- **Issue**: Complex mocking in audio engine tests was brittle and testing implementation details
- **Solution**: Simplified tests to focus on behavior rather than implementation
- **Result**: All tests passing with more maintainable and reliable test suite
- **Benefits**: Tests are easier to understand, maintain, and less likely to break with code changes

## Code Standards

### TypeScript

- Use strict TypeScript configuration
- Define interfaces for all data structures
- Use type imports: `import type { User } from './types'`
- Avoid `any` type - use proper typing

### React

- Use functional components with hooks
- Follow React best practices for performance
- Use proper prop types and interfaces
- Implement proper error boundaries

### Styling

- Use Tailwind CSS with modular design system for styling
- Follow mobile-first responsive design with 3-level spacing system
- Use BaseVisualization component for all visualization components
- Follow established CSS class patterns (page-container, chat-header, etc.)
- Use CSS modules for component-specific styles
- Maintain consistent spacing and typography

### File Naming

- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utilities: `camelCase.ts`
- Types: `camelCase.ts`
- Tests: `ComponentName.test.tsx`

### Import Organization

```typescript
// 1. React imports
import React from 'react'
import { useState, useEffect } from 'react'

// 2. Third-party imports
import { Tone } from 'tone'
import { EditorView } from '@codemirror/view'

// 3. Internal imports
import { ASCIIEditor } from '@/components/editor/ASCIIEditor'
import { useAudioEngine } from '@/hooks/useAudioEngine'

// 4. Type imports
import type { Pattern } from '@/types'
```

## Contributing

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code following the standards above
   - Add tests for new functionality
   - Update documentation if needed

3. **Run tests and linting**
   ```bash
   pnpm test
   pnpm lint
   pnpm type-check
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Format

Use conventional commits:

```
feat: add new feature
fix: fix bug description
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add or update tests
chore: maintenance tasks
```

### Pull Request Guidelines

- Provide clear description of changes
- Include screenshots for UI changes
- Ensure all tests pass
- Request review from team members
- Update documentation as needed

## Troubleshooting

### Common Issues

#### 1. pnpm Installation Issues

```bash
# Clear pnpm cache
pnpm store prune

# Reinstall dependencies
rm -rf node_modules
pnpm install
```

#### 2. Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
pnpm dev:web --port 3001
```

#### 3. TypeScript Errors

```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
pnpm type-check
```

#### 4. Test Failures

```bash
# Clear test cache
rm -rf node_modules/.vite
pnpm test
```

### Development Tools

#### VS Code Extensions

Recommended extensions for development:

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-vitest"
  ]
}
```

#### Browser DevTools

- Use Chrome DevTools for Web Audio API debugging
- Enable "Web Audio" in Chrome DevTools
- Use React DevTools for component debugging

### Performance Optimization

#### Bundle Analysis

```bash
# Analyze bundle size
pnpm build
npx vite-bundle-analyzer dist
```

#### Audio Performance

```typescript
// Monitor audio context performance
const audioContext = new AudioContext()
console.log('Audio Context Latency:', audioContext.baseLatency)
console.log('Audio Context Sample Rate:', audioContext.sampleRate)

// Current audio engine implementation
import { AudioEngine } from '@/services/audioEngine'

const audioEngine = AudioEngine.getInstance()
await audioEngine.initialize()
audioEngine.loadPattern(parsedPattern)
audioEngine.play() // Now plays professional-quality audio
```

### Environment Variables

Required environment variables:

```bash
# .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Getting Help

- Check the [documentation](docs/)
- Review existing [issues](https://github.com/your-org/llm-music/issues)
- Ask questions in team chat
- Create an issue for bugs or feature requests

## Next Steps

After setting up your development environment:

1. **Explore the codebase** - Start with the main components
2. **Run the tests** - Understand the testing patterns
3. **Test the audio engine** - Click play to hear the synthesizers
4. **Make a small change** - Get familiar with the workflow
5. **Read the documentation** - Understand the project goals
6. **Join the team** - Participate in discussions and planning

### Quick Audio Test

1. Start the development server: `pnpm dev:web`
2. Navigate to the Editor page
3. Click the Play button
4. Listen to the kick, snare, and hihat sounds
5. Adjust tempo and volume to test real-time controls

The audio engine is fully functional with professional-quality synthesis! 🎵
