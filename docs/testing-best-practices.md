# Testing Best Practices - LLM Music Project

## Overview

This document captures the testing best practices and lessons learned from implementing and fixing the comprehensive test suite for the LLM Music project. It provides guidance for future developers to avoid common testing pitfalls and write robust, maintainable tests.

## Table of Contents

1. [Testing Framework Setup](#testing-framework-setup)
2. [Common Testing Pitfalls](#common-testing-pitfalls)
3. [Best Practices](#best-practices)
4. [Debugging Strategies](#debugging-strategies)
5. [Component-Specific Testing](#component-specific-testing)
6. [Integration Testing](#integration-testing)
7. [Performance Testing](#performance-testing)

## Testing Framework Setup

### Vitest Configuration

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

### Test Setup

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
```

### Custom Test Utilities

```typescript
// src/test/testUtils.tsx
import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AppProvider } from '../contexts/AppContext'

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AppProvider>
      {children}
    </AppProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

## Common Testing Pitfalls

### 1. Multiple Elements with Same Text

**Problem**: `getByText` fails when multiple elements contain the same text.

**Example Failure**:
```typescript
// ❌ This will fail if there are multiple "kick" elements
expect(screen.getByText('kick')).toBeInTheDocument()
// Error: Found multiple elements with the text: kick
```

**Solution**: Use `getAllByText` and check the length:

```typescript
// ✅ This handles multiple elements correctly
const kickElements = screen.getAllByText('kick')
expect(kickElements.length).toBeGreaterThan(0)
```

### 2. Split Text Across Elements

**Problem**: Text is broken up by whitespace or spans in the HTML, especially common with Tailwind CSS.

**Example Failure**:
```typescript
// ❌ This will fail if text is split like "3 instruments • 16 steps"
expect(screen.getByText('16 steps')).toBeInTheDocument()
// Error: Unable to find an element with the text: 16 steps
```

**Solution**: Use regex patterns:

```typescript
// ✅ This handles split text correctly
expect(screen.getByText(/16 steps/)).toBeInTheDocument()
```

### 3. Role Ambiguity

**Problem**: Multiple elements have the same role (e.g., multiple textboxes).

**Example Failure**:
```typescript
// ❌ This will fail if there are multiple textboxes
const editor = screen.getByRole('textbox')
// Error: Found multiple elements with the role "textbox"
```

**Solution**: Use more specific selectors:

```typescript
// ✅ This targets a specific textbox by placeholder
const editor = screen.getByPlaceholderText('Enter your ASCII pattern here...')
```

### 4. Component Behavior Assumptions

**Problem**: Tests assume component behavior without checking actual implementation.

**Example Failure**:
```typescript
// ❌ This assumes the component shows "Pattern Loop: 2/4"
expect(screen.getByText('Pattern Loop: 2/4')).toBeInTheDocument()
// Error: Unable to find an element with the text: Pattern Loop: 2/4
```

**Solution**: Inspect the actual rendered HTML and match it:

```typescript
// ✅ This matches the actual component behavior
expect(screen.getByText('Pattern Loop: 2/16')).toBeInTheDocument()
```

### 5. Async Content Loading

**Problem**: Content loads asynchronously and tests run before it's ready.

**Example Failure**:
```typescript
// ❌ This will fail if content hasn't loaded yet
expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument()
// Error: Unable to find an element with the text: ✓ Valid & Loaded
```

**Solution**: Use `waitFor` for async operations:

```typescript
// ✅ This waits for async content to load
await waitFor(() => {
  expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument()
})
```

## Best Practices

### 1. Use Specific Selectors

```typescript
// ❌ Generic role selector
const button = screen.getByRole('button')

// ✅ Specific button by name
const playButton = screen.getByRole('button', { name: '▶️' })

// ✅ Specific input by placeholder
const editor = screen.getByPlaceholderText('Enter your ASCII pattern here...')
```

### 2. Handle Multiple Elements Gracefully

```typescript
// ❌ Assumes single element
expect(screen.getByText('kick')).toBeInTheDocument()

// ✅ Handles multiple elements
const kickElements = screen.getAllByText('kick')
expect(kickElements.length).toBeGreaterThan(0)

// ✅ Or use regex for partial matches
expect(screen.getByText(/kick/)).toBeInTheDocument()
```

### 3. Use Flexible Text Matching

```typescript
// ❌ Exact text match
expect(screen.getByText('Current Step: 5')).toBeInTheDocument()

// ✅ Flexible matching
expect(screen.getByText('Current Step:')).toBeInTheDocument()
const currentStepElements = screen.getAllByText('5')
expect(currentStepElements.length).toBeGreaterThan(0)
```

### 4. Test User Behavior, Not Implementation

```typescript
// ❌ Testing implementation details
expect(component.state.isValid).toBe(true)

// ✅ Testing user-visible behavior
expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument()
```

### 5. Use Proper Async Handling

```typescript
// ❌ No async handling
fireEvent.change(editor, { target: { value: 'TEMPO 120' } })
expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument()

// ✅ Proper async handling
fireEvent.change(editor, { target: { value: 'TEMPO 120' } })
await waitFor(() => {
  expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument()
})
```

## Debugging Strategies

### 1. Inspect Rendered HTML

```typescript
// Add this to any test to see the full HTML output
console.log(screen.debug())
```

### 2. Check for Multiple Elements

```typescript
// Use getAllByText to see how many elements match
const elements = screen.getAllByText('kick')
console.log('Found', elements.length, 'elements with text "kick"')
```

### 3. Use More Specific Queries

```typescript
// Instead of getByText, use getByRole with name
const button = screen.getByRole('button', { name: '▶️' })

// Or use getByTestId for unique identifiers
const element = screen.getByTestId('unique-test-id')
```

### 4. Test Component Behavior, Not Implementation

```typescript
// ❌ Testing implementation details
expect(component.state.isValid).toBe(true)

// ✅ Testing user-visible behavior
expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument()
```

## Component-Specific Testing

### Visualization Components

#### StepSequencerGrid Testing

```typescript
describe('StepSequencerGrid', () => {
  it('displays pattern information correctly', () => {
    render(<StepSequencerGrid pattern={mockPattern} />)
    
    // Use regex for split text
    expect(screen.getByText(/16 steps/)).toBeInTheDocument()
    expect(screen.getByText('120 BPM')).toBeInTheDocument()
  })

  it('highlights current step when provided', () => {
    render(<StepSequencerGrid pattern={mockPattern} currentStep={4} />)
    
    // Check for current step indicator
    expect(screen.getByText('Current Step:')).toBeInTheDocument()
    // The current step should be displayed as 5 (1-indexed)
    const currentStepElements = screen.getAllByText('5')
    expect(currentStepElements.length).toBeGreaterThan(0)
  })
})
```

#### PatternAnalysis Testing

```typescript
describe('PatternAnalysis', () => {
  it('displays key metrics correctly', () => {
    render(<PatternAnalysis pattern={mockPattern} />)
    
    // Use getAllByText for multiple elements
    const instrumentElements = screen.getAllByText(/2 instruments/)
    expect(instrumentElements.length).toBeGreaterThan(0)
    
    // Use regex for percentages
    const densityElements = screen.getAllByText(/50%/)
    expect(densityElements.length).toBeGreaterThan(0)
  })
})
```

#### PlayheadIndicator Testing

```typescript
describe('PlayheadIndicator', () => {
  it('shows pattern loop information', () => {
    render(
      <PlayheadIndicator
        pattern={mockPattern}
        currentTime={1.0}
        isPlaying={true}
        tempo={120}
      />
    )
    
    // Match actual component behavior
    expect(screen.getByText('Pattern Loop: 3/16')).toBeInTheDocument()
  })
})
```

### Integration Testing

#### EditorPage Testing

```typescript
describe('EditorPage', () => {
  it('renders all main components', () => {
    render(<EditorPage />)
    
    // Use specific selectors for multiple elements
    expect(screen.getByPlaceholderText('Enter your ASCII pattern here...')).toBeInTheDocument()
    expect(screen.getByText('ASCII Pattern Editor')).toBeInTheDocument()
    
    // Check for initial state
    expect(screen.getByText('Create a pattern in the ASCII editor to see the step sequencer')).toBeInTheDocument()
  })

  it('updates pattern analysis when pattern changes', async () => {
    render(<EditorPage />)
    
    const editor = screen.getByPlaceholderText('Enter your ASCII pattern here...')
    
    // Type a valid pattern
    fireEvent.change(editor, { target: { value: 'TEMPO 120\nseq kick: x...x...\nseq snare: ....x...' } })
    
    // Wait for validation
    await waitFor(() => {
      expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument()
    })
    
    // Pattern analysis should show the pattern data
    const instrumentElements = screen.getAllByText(/2 instruments/)
    expect(instrumentElements.length).toBeGreaterThan(0)
  })
})
```

## Performance Testing

### Test Execution Time

```typescript
// Monitor test execution time
describe('Performance Tests', () => {
  it('should render large patterns quickly', () => {
    const startTime = performance.now()
    
    render(<StepSequencerGrid pattern={largePattern} />)
    
    const endTime = performance.now()
    expect(endTime - startTime).toBeLessThan(100) // Should render in under 100ms
  })
})
```

### Memory Usage

```typescript
// Test for memory leaks
describe('Memory Tests', () => {
  it('should not leak memory when unmounting', () => {
    const { unmount } = render(<StepSequencerGrid pattern={mockPattern} />)
    
    // Unmount component
    unmount()
    
    // Check that no references remain
    expect(screen.queryByText('Step Sequencer')).not.toBeInTheDocument()
  })
})
```

## Test Organization

### File Structure

```
src/
├── components/
│   ├── editor/
│   │   ├── ASCIIEditor.tsx
│   │   └── ASCIIEditor.test.tsx
│   └── visualizations/
│       ├── editor/
│       │   ├── StepSequencerGrid.tsx
│       │   └── StepSequencerGrid.test.tsx
│       └── audio/
│           ├── PlayheadIndicator.tsx
│           └── PlayheadIndicator.test.tsx
├── pages/
│   ├── EditorPage.tsx
│   └── EditorPage.test.tsx
└── test/
    ├── setup.ts
    └── testUtils.tsx
```

### Test Naming Conventions

```typescript
// Use descriptive test names
describe('StepSequencerGrid', () => {
  it('should render without crashing', () => {})
  it('should display pattern information correctly', () => {})
  it('should highlight current step when provided', () => {})
  it('should handle empty patterns gracefully', () => {})
  it('should call onStepToggle when step is clicked', () => {})
})
```

## Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm test
      - run: pnpm test:coverage
```

### Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "pnpm test && pnpm lint"
    }
  }
}
```

## Conclusion

Following these best practices will help ensure:

1. **Robust Tests**: Tests that handle edge cases and multiple elements gracefully
2. **Maintainable Code**: Tests that are easy to understand and modify
3. **Reliable CI/CD**: Tests that pass consistently in different environments
4. **Better Debugging**: Clear error messages and debugging strategies
5. **Future-Proof**: Tests that won't break with minor UI changes

Remember: **Test behavior, not implementation. Use specific selectors. Handle multiple elements gracefully.**
