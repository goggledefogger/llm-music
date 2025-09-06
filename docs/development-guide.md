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

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Audio**: Tone.js, Web Audio API
- **Editor**: CodeMirror 6
- **Testing**: Vitest, React Testing Library
- **Build**: Turborepo for monorepo management

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
│   │   │   ├── stores/         # State management
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
└── test/
    └── setup.ts
```

### Writing Tests

```typescript
// Example test file
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ASCIIEditor } from './ASCIIEditor'

describe('ASCIIEditor', () => {
  it('renders without crashing', () => {
    render(<ASCIIEditor />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('accepts user input', () => {
    render(<ASCIIEditor />)
    const editor = screen.getByRole('textbox')
    // Test user interaction
  })
})
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

- Use Tailwind CSS for styling
- Follow mobile-first responsive design
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
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or use different port
pnpm dev:web --port 3002
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
```

### Environment Variables

Required environment variables:

```bash
# .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
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
3. **Make a small change** - Get familiar with the workflow
4. **Read the documentation** - Understand the project goals
5. **Join the team** - Participate in discussions and planning

Happy coding! 🎵
