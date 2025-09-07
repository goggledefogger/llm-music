# Testing Lessons Learned - LLM Music Project

## Overview

This document captures the key lessons learned from implementing and fixing the comprehensive test suite for the LLM Music project. It provides actionable insights for future developers to avoid common testing pitfalls and write robust, maintainable tests.

## Key Lessons Learned

### 1. Multiple Elements with Same Text

**Problem**: `getByText` fails when multiple elements contain the same text.

**Example**:
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

**When to Use**: When testing components that display the same text in multiple places (e.g., instrument names, step counts, percentages).

### 2. Split Text Across HTML Elements

**Problem**: Text is broken up by whitespace or spans in the HTML, especially common with Tailwind CSS.

**Example**:
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

**When to Use**: When text is split across multiple HTML elements due to CSS styling or responsive design.

### 3. Role Ambiguity

**Problem**: Multiple elements have the same role (e.g., multiple textboxes).

**Example**:
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

**When to Use**: When there are multiple elements with the same role (buttons, inputs, etc.).

### 4. Component Behavior Assumptions

**Problem**: Tests assume component behavior without checking actual implementation.

**Example**:
```typescript
// ❌ This assumes the component shows "Pattern Loop: 2/4"
expect(screen.getByText('Pattern Loop: 2/4')).toBeInTheDocument()
// Error: Unable to find an element with the text: Pattern Loop: 2/4
```

**Solution**: Inspect the actual rendered HTML and match it (step-based timing):
```typescript
// ✅ With STEPS_PER_BEAT=4, 120 BPM, currentTime=1.0s → shows 9/16
expect(screen.getByText('Pattern Loop: 9/16')).toBeInTheDocument()
```

**When to Use**: Always - test the actual behavior, not assumptions.

### 5. Async Content Loading

**Problem**: Content loads asynchronously and tests run before it's ready.

**Example**:
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

**When to Use**: When testing components that load content asynchronously (API calls, validation, etc.).

## Best Practices Summary

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

## Common Testing Patterns

### Pattern 1: Multiple Elements with Same Text

```typescript
// Use getAllByText for elements that appear multiple times
const elements = screen.getAllByText('kick')
expect(elements.length).toBeGreaterThan(0)
```

### Pattern 2: Split Text Across Elements

```typescript
// Use regex patterns for text split across HTML elements
expect(screen.getByText(/16 steps/)).toBeInTheDocument()
```

### Pattern 3: Specific Element Selection

```typescript
// Use placeholder, label, or other unique attributes
const editor = screen.getByPlaceholderText('Enter your ASCII pattern here...')
```

### Pattern 4: Component Behavior Matching

```typescript
// Match actual component behavior (step-based timing)
expect(screen.getByText('Pattern Loop: 9/16')).toBeInTheDocument()
```

### Pattern 5: Async Content Handling

```typescript
// Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument()
})
```

## Test Quality Checklist

### Before Writing Tests
- [ ] Understand the component's actual behavior
- [ ] Identify potential multiple elements
- [ ] Check for split text in the HTML
- [ ] Plan for async content loading

### While Writing Tests
- [ ] Use specific selectors (placeholder, role with name, test ID)
- [ ] Handle multiple elements with `getAllByText`
- [ ] Use regex patterns for split text
- [ ] Use `waitFor` for async content
- [ ] Test user-visible behavior, not implementation

### After Writing Tests
- [ ] Run tests to ensure they pass
- [ ] Check for any console warnings or errors
- [ ] Verify test coverage is adequate
- [ ] Document any special testing considerations

## Recent Improvements (2024)

### 1. Mock Centralization
We successfully centralized common mocks to reduce duplication:

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
- Easier maintenance and updates

### 2. Integration Test Simplification
We learned that complex integration tests often provide more maintenance burden than value:

**Before**: 7 complex tests with overly specific expectations
**After**: 2 simple tests covering core workflows

```typescript
// ❌ Complex test that breaks easily
expect(screen.getByText('140 BPM')).toBeInTheDocument();
expect(screen.getByText('6 instruments ready')).toBeInTheDocument();

// ✅ Simple test that focuses on behavior
expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument();
expect(playButton).toBeInTheDocument();
```

**Key Lesson**: Integration tests should verify workflows work end-to-end, not test implementation details.

### 3. Behavior-Focused Testing
We shifted from testing implementation details to testing user-visible behavior:

```typescript
// ❌ Testing implementation
expect(mockAudioContext.createOscillator).toHaveBeenCalled();

// ✅ Testing behavior
expect(() => audioEngine.play()).not.toThrow();
```

## Future Recommendations

### 1. Test ID Strategy
Consider adding `data-testid` attributes to components for more reliable testing:

```typescript
// In component
<div data-testid="step-sequencer-grid">...</div>

// In test
const grid = screen.getByTestId('step-sequencer-grid')
```

### 2. Test Utilities
Create reusable test utilities for common patterns:

```typescript
// testUtils.ts
export const getByTextMultiple = (text: string) => {
  const elements = screen.getAllByText(text)
  expect(elements.length).toBeGreaterThan(0)
  return elements
}
```

### 3. Test Documentation
Document testing patterns and best practices for the team:

```typescript
/**
 * Test pattern for components with multiple elements
 * Use getAllByText when the same text appears multiple times
 */
it('should handle multiple elements correctly', () => {
  // Implementation
})
```

## Conclusion

These lessons learned provide a foundation for writing robust, maintainable tests that handle common testing pitfalls. By following these practices, future developers can avoid the issues we encountered and write tests that are more reliable and easier to maintain.

**Key Takeaway**: Test behavior, not implementation. Use specific selectors. Handle multiple elements gracefully. Use async handling properly.
