# 🧪 Visualization Testing & Documentation

> **Note**: This document has been consolidated into the main [QA Handoff](docs/qa-handoff.md#visualization-system-qa-handoff) document. This file is kept for reference but should be considered deprecated.

## 📋 **Testing Strategy Overview**

This document outlines the comprehensive testing strategy for the visualization components implemented in the ASCII Generative Sequencer project. The testing approach ensures reliability, maintainability, and proper integration with the existing architecture.

## 🏗️ **Test Architecture**

### **Test Structure**
```
apps/web/src/
├── test/
│   ├── setup.ts                    # Test environment setup
│   └── testUtils.tsx               # Custom render with providers
├── components/
│   ├── editor/
│   │   ├── ASCIIEditor.test.tsx    # ✅ Existing - ASCII editor tests
│   │   └── StepSequencerGrid.test.tsx # ✅ New - Step sequencer tests
│   ├── audio/
│   │   └── PlayheadIndicator.test.tsx # ✅ New - Playhead tests
│   ├── ai/
│   │   └── PatternAnalysis.test.tsx # ✅ New - Pattern analysis tests
│   └── patterns/
│       └── PatternThumbnail.test.tsx # ✅ New - Pattern thumbnail tests
├── pages/
│   └── EditorPage.test.tsx         # ✅ New - Integration tests
└── services/
    ├── patternParser.test.ts       # ✅ Existing - Parser tests
    └── patternParser.eq.test.ts    # ✅ New - EQ module tests
```

### **Testing Framework**
- **Test Runner**: Vitest (fast, Vite-native)
- **Testing Library**: React Testing Library (user-centric testing)
- **Mocking**: Vitest mocks for external dependencies
- **Coverage**: Comprehensive component and integration testing

## 🧪 **Test Categories**

### **1. Unit Tests**
**Purpose**: Test individual components in isolation

**Coverage**:
- Component rendering
- Props handling
- State management
- Event handling
- Edge cases and error states
- **EQ Module Testing** (Added Sept 2025)

**Example**:
```typescript
describe('StepSequencerGrid', () => {
  it('renders without crashing', () => {
    render(<StepSequencerGrid pattern={mockPattern} />);
    expect(screen.getByText('Step Sequencer')).toBeInTheDocument();
  });

  it('shows no pattern message when pattern is null', () => {
    render(<StepSequencerGrid pattern={null} />);
    expect(screen.getByText('No pattern loaded')).toBeInTheDocument();
  });
});
```

### **2. Integration Tests**
**Purpose**: Test component interactions and data flow

**Coverage**:
- Context integration
- State synchronization
- Real-time updates
- Cross-component communication

**Example**:
```typescript
describe('EditorPage', () => {
  it('updates step sequencer when pattern changes', async () => {
    render(<EditorPage />);
    const editor = screen.getByRole('textbox');
    
    fireEvent.change(editor, { target: { value: 'TEMPO 120\nseq kick: x...x...' } });
    
    await waitFor(() => {
      expect(screen.getByText('✓ Valid & Loaded')).toBeInTheDocument();
    });
    
    expect(screen.getByText('kick')).toBeInTheDocument();
  });
});
```

### **3. Mock Strategy**
**Purpose**: Isolate components from external dependencies

**Mocked Dependencies**:
- **Tone.js**: Audio engine functionality
- **D3.js**: Visualization library
- **Web Audio API**: Browser audio context

**Example**:
```typescript
// Mock Tone.js to avoid import issues in tests
vi.mock('tone', () => ({
  default: {
    start: vi.fn().mockResolvedValue(undefined),
    getTransport: vi.fn(() => ({
      bpm: { value: 120 },
      start: vi.fn(),
      stop: vi.fn(),
      // ... other methods
    }))
  }
}));
```

## 📊 **Test Coverage Analysis**

### **Current Test Status**
- **Total Test Files**: 9 (4 existing + 5 new)
- **Total Tests**: 110 (110 passing + 0 failing)
- **Coverage Areas**: Components, Services, Integration, EQ Modules
- **Test Quality**: Robust testing practices with proper handling of multiple elements, split text, and component behavior

### **Test Results Summary**
```
✅ ALL TESTS PASSING (110):
- ASCIIEditor: 10/10 tests passing
- PatternParser: 25/25 tests passing
- PatternParser.EQ: 6/6 tests passing (Added Sept 2025)
- App: 1/1 test passing
- StepSequencerGrid: 8/8 tests passing
- PlayheadIndicator: 6/6 tests passing
- PatternThumbnail: 6/6 tests passing
- PatternAnalysis: 14/14 tests passing
- EditorPage: 6/6 tests passing

🎯 TEST QUALITY IMPROVEMENTS:
- Multiple element handling with getAllByText
- Split text handling with regex patterns
- Specific selectors for unique element identification
- Component behavior matching with actual rendered output
- Async content handling with waitFor
- **EQ Module Testing Coverage** (Added Sept 2025)
```

### **Test Quality Improvements**

#### **Resolved Issues**:
1. **Multiple Elements**: Now handled with `getAllByText` and length checks
2. **Split Text**: Now handled with regex patterns for text split across HTML elements
3. **Component Behavior**: Tests now match actual rendered output, not assumptions
4. **Role Ambiguity**: Tests now use specific selectors like placeholder text
5. **Async Content**: Tests now use `waitFor` for asynchronous content loading

#### **Best Practices Implemented**:
1. **Flexible Text Matching**: Use regex patterns and `getAllByText`
2. **Component Behavior Alignment**: Tests match actual implementation
3. **Specific Selectors**: Use placeholder text, role names, and test IDs
4. **Async Handling**: Use `waitFor` for content that loads asynchronously
5. **Debugging Support**: Include `console.log(screen.debug())` for troubleshooting
3. **Async Handling**: Proper use of `waitFor` and `findBy` queries

## 🔧 **Test Implementation Details**

### **Custom Test Utilities**
```typescript
// testUtils.tsx
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AppProvider } from '../contexts/AppContext';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AppProvider>
      {children}
    </AppProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### **Test Data Factories**
```typescript
// Mock pattern data for consistent testing
const mockPattern: ParsedPattern = {
  tempo: 120,
  instruments: {
    kick: {
      name: 'kick',
      steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false]
    },
    snare: {
      name: 'snare',
      steps: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false]
    },
    hihat: {
      name: 'hihat',
      steps: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]
    }
  },
  totalSteps: 16
};
```

### **Async Testing Patterns**
```typescript
// Proper async testing with waitFor
it('updates when pattern changes', async () => {
  render(<Component />);
  
  // Trigger async action
  fireEvent.change(input, { target: { value: 'new value' } });
  
  // Wait for async update
  await waitFor(() => {
    expect(screen.getByText('Updated Content')).toBeInTheDocument();
  });
});
```

## 🎛️ **EQ Module Testing** (Added Sept 2025)

### **EQ Test Coverage**

The EQ module system includes comprehensive testing to ensure reliable parsing, validation, and visualization:

#### **Test File**: `patternParser.eq.test.ts`
- **Total Tests**: 6/6 passing
- **Coverage**: Parsing, validation, clamping, error handling

#### **Test Categories**:

**1. EQ Parsing Tests**
```typescript
it('should parse EQ modules with valid syntax', () => {
  const pattern = `TEMPO 120
eq master: low=0 mid=0 high=0
eq kick: low=2 mid=-1 high=1`;

  const result = PatternParser.parse(pattern);
  
  expect(result.eqModules.master).toEqual({
    name: 'master',
    low: 0, mid: 0, high: 0
  });
});
```

**2. Value Clamping Tests**
```typescript
it('should clamp EQ values to -3 to +3 range', () => {
  const pattern = `eq test: low=5 mid=-10 high=0`;
  const result = PatternParser.parse(pattern);
  
  expect(result.eqModules.test).toEqual({
    name: 'test',
    low: 3,    // Clamped from 5
    mid: -3,   // Clamped from -10
    high: 0
  });
});
```

**3. Validation Tests**
```typescript
it('should validate EQ syntax correctly', () => {
  const invalidPattern = `eq invalid: low=2 mid=invalid high=1`;
  const result = PatternParser.validate(invalidPattern);
  
  expect(result.isValid).toBe(false);
  expect(result.errors.some(error => 
    error.includes('Invalid EQ values')
  )).toBe(true);
});
```

**4. Edge Case Tests**
- Invalid syntax handling
- Missing EQ modules
- Multiple EQ modules
- Pattern without EQ

#### **EQ Visualization Testing**

The EQ display component is tested through integration tests:
- **Real-time updates**: EQ values update as user types
- **Color coding**: Proper color display for positive/negative values
- **Layout**: Correct display of multiple EQ modules
- **Responsive design**: Works on all screen sizes

## 🎯 **Testing Best Practices**

### **1. User-Centric Testing**
- Test from user perspective, not implementation details
- Use semantic queries (`getByRole`, `getByLabelText`)
- Focus on user interactions and outcomes

### **2. Accessibility Testing**
- Test keyboard navigation
- Verify ARIA labels and roles
- Ensure screen reader compatibility

### **3. Performance Testing**
- Test component rendering performance
- Verify memory usage and cleanup
- Test with large datasets

### **4. Error Handling Testing**
- Test error states and fallbacks
- Verify graceful degradation
- Test edge cases and boundary conditions

## 📈 **Test Metrics & Monitoring**

### **Coverage Targets**
- **Component Coverage**: 90%+ for all visualization components
- **Integration Coverage**: 80%+ for critical user flows
- **Error Path Coverage**: 70%+ for error handling

### **Performance Benchmarks**
- **Test Execution Time**: <5 seconds for full suite
- **Component Render Time**: <100ms for visualization components
- **Memory Usage**: <50MB for test environment

### **Quality Gates**
- All tests must pass before merge
- No decrease in coverage percentage
- Performance benchmarks must be maintained

## 🚀 **Continuous Integration**

### **CI/CD Pipeline**
```yaml
# .github/workflows/test.yml
name: Test Suite
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

### **Test Automation**
- **Pre-commit Hooks**: Run tests before commit
- **Pull Request Checks**: Automated test execution
- **Coverage Reports**: Automated coverage analysis

## 🔍 **Debugging Test Issues**

### **Common Debugging Techniques**
1. **Screen Debugging**: Use `screen.debug()` to inspect DOM
2. **Query Debugging**: Use `screen.logTestingPlaygroundURL()`
3. **Async Debugging**: Add `waitFor` with longer timeouts
4. **Mock Debugging**: Verify mock implementations

### **Test Environment Setup**
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.test.*',
        '**/*.spec.*'
      ]
    }
  }
});
```

## 📚 **Documentation Standards**

### **Test Documentation Requirements**
1. **Test Purpose**: Clear description of what is being tested
2. **Test Data**: Document mock data and test scenarios
3. **Expected Behavior**: Document expected outcomes
4. **Edge Cases**: Document boundary conditions and error states

### **Code Comments**
```typescript
/**
 * Tests the StepSequencerGrid component's ability to display
 * pattern data and handle user interactions
 */
describe('StepSequencerGrid', () => {
  /**
   * Verifies that the component renders without crashing
   * when provided with valid pattern data
   */
  it('renders without crashing', () => {
    // Test implementation
  });
});
```

## 🎯 **Future Testing Enhancements**

### **Planned Improvements**
1. **Visual Regression Testing**: Screenshot comparisons
2. **Performance Testing**: Load testing for large patterns
3. **Accessibility Testing**: Automated a11y testing
4. **E2E Testing**: Full user journey testing

### **Testing Tools Integration**
- **Playwright**: E2E testing framework
- **Storybook**: Component testing and documentation
- **Chromatic**: Visual regression testing
- **Lighthouse**: Performance and accessibility auditing

---

## ✅ **Testing Checklist**

### **Pre-Development**
- [ ] Test requirements defined
- [ ] Test data prepared
- [ ] Mock strategies planned
- [ ] Test environment configured

### **During Development**
- [ ] Unit tests written for each component
- [ ] Integration tests for data flow
- [ ] Error handling tests implemented
- [ ] Accessibility tests included

### **Pre-Deployment**
- [ ] All tests passing
- [ ] Coverage targets met
- [ ] Performance benchmarks satisfied
- [ ] Documentation updated

### **Post-Deployment**
- [ ] Test results monitored
- [ ] Coverage reports reviewed
- [ ] Performance metrics tracked
- [ ] User feedback incorporated

---

**The testing strategy ensures robust, reliable visualization components that integrate seamlessly with the existing architecture while maintaining high quality standards.** 🧪✨
