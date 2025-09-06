# Responsive Design System

## Overview

This project uses a modular, maintainable responsive design system built on top of Tailwind CSS. The approach prioritizes simplicity and maintainability through:

1. **Modular CSS Architecture**: Centralized styling with reusable components
2. **Base Components**: Common patterns abstracted into reusable components
3. **Consistent Spacing System**: Three levels of spacing for different use cases
4. **Single Source of Truth**: All styling decisions made once and applied everywhere

## Philosophy

- **Modular by design**: Common patterns abstracted into reusable components and CSS classes
- **Single source of truth**: Styling decisions made once and applied everywhere
- **Consistent breakpoints**: Use the standard Tailwind breakpoints (sm, md, lg, xl, 2xl)
- **Progressive enhancement**: Mobile-first approach with larger screen enhancements
- **No over-engineering**: Simple abstractions that reduce maintenance burden

## Breakpoints

```css
xs: 475px   /* Extra small devices */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X large devices */
```

## Responsive Utilities

### Layout Classes

- `.responsive-text` - Scales text size across breakpoints
- `.responsive-padding` - Scales padding across breakpoints  
- `.responsive-spacing` - Scales vertical spacing across breakpoints
- `.responsive-grid` - Responsive grid that adapts column count

### Compact Utilities (for dense layouts)

- `.compact-text` - Smaller text scaling for space-constrained areas
- `.compact-padding` - Reduced padding for dense layouts
- `.compact-spacing` - Tighter vertical spacing for compact components

### Ultra-Compact Utilities (for visualization panels)

- `.ultra-compact-text` - Minimal text scaling for very dense layouts
- `.ultra-compact-padding` - Minimal padding for visualization panels
- `.ultra-compact-spacing` - Minimal vertical spacing for tight layouts

### Layout Panels

- `.visualization-panel` - Responsive visualization sidebar
- `.chat-panel` - Responsive chat sidebar
- `.editor-pane` - Main editor area

### Base Components

- `BaseVisualization` - Reusable component for all visualization types
- `.viz-default` - Standard visualization styling with background and padding
- `.viz-compact` - Compact visualization styling
- `.viz-ultra-compact` - Minimal styling for dense layouts
- `.viz-description` - Consistent description text styling
- `.viz-content` - Content area with proper spacing

### Page Layout Classes

- `.page-container` - Standard page container (max-w-6xl)
- `.page-container-sm` - Small page container (max-w-4xl)
- `.page-container-lg` - Large page container (max-w-7xl)
- `.page-header` - Centered page header with bottom margin
- `.page-title` - Large page title styling
- `.page-subtitle` - Page subtitle styling

### Chat Interface Classes

- `.chat-header` - Chat interface header with border and padding
- `.chat-messages` - Chat messages container with scrolling

## Usage Guidelines

### 1. Use Base Components for Common Patterns

```tsx
// ✅ Good - Use BaseVisualization for all visualization components
const MyVisualization = () => (
  <BaseVisualization
    description="Description of what this shows"
    variant="ultra-compact"
  >
    {/* Your visualization content */}
  </BaseVisualization>
);

// ✅ Good - Use Tailwind utilities directly for custom layouts
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Item key={item.id} />)}
</div>
```

### 2. Mobile-First Approach

```tsx
// ✅ Good - Mobile first
<div className="text-sm md:text-base lg:text-lg">
  Content
</div>

// ❌ Avoid - Desktop first
<div className="text-lg md:text-base sm:text-sm">
  Content
</div>
```

### 3. Consistent Spacing

```tsx
// ✅ Good - Consistent spacing scale
<div className="space-y-2 md:space-y-4 lg:space-y-6">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### 4. Responsive Components

```tsx
// ✅ Good - Component-specific responsive behavior
const StepSequencer = () => (
  <div className="flex space-x-0.5">
    {steps.map(step => (
      <button 
        key={step.id}
        className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6"
      >
        {step.number}
      </button>
    ))}
  </div>
);
```

### 5. Choosing the Right Utility Level

```tsx
// ✅ Good - Use ultra-compact for visualization panels
const VisualizationPanel = () => (
  <div className="ultra-compact-padding">
    <h3 className="ultra-compact-text">Title</h3>
    <div className="ultra-compact-spacing">
      {items.map(item => <Item key={item.id} />)}
    </div>
  </div>
);

// ✅ Good - Use compact utilities for dense layouts
const DenseVisualization = () => (
  <div className="compact-padding">
    <h3 className="compact-text">Title</h3>
    <div className="compact-spacing">
      {items.map(item => <Item key={item.id} />)}
    </div>
  </div>
);

// ✅ Good - Use regular utilities for spacious layouts
const SpaciousCard = () => (
  <div className="responsive-padding">
    <h3 className="responsive-text">Title</h3>
    <div className="responsive-spacing">
      {items.map(item => <Item key={item.id} />)}
    </div>
  </div>
);
```

## Component Patterns

### Collapsible Sections

```tsx
<div className="bg-background-secondary rounded-lg border border-border">
  <button className="w-full flex items-center justify-between p-3 md:p-4">
    <h3 className="text-sm md:text-base font-semibold">Title</h3>
    <ChevronIcon className="w-4 h-4 md:w-5 md:h-5" />
  </button>
  {isExpanded && (
    <div className="p-3 md:p-4 border-t border-border">
      {children}
    </div>
  )}
</div>
```

### Responsive Grids

```tsx
// Metrics grid
<div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
  {metrics.map(metric => (
    <div key={metric.id} className="p-2 md:p-3 bg-background rounded">
      <div className="text-xs md:text-sm text-foreground-muted">
        {metric.label}
      </div>
      <div className="text-sm md:text-base font-semibold">
        {metric.value}
      </div>
    </div>
  ))}
</div>
```

### Responsive Visualizations

```tsx
// Step sequencer - compact for space efficiency
<div className="flex space-x-0.5 overflow-x-auto">
  {steps.map(step => (
    <button
      key={step.id}
      className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 flex-shrink-0"
    >
      {step.number}
    </button>
  ))}
</div>

// Dense visualization component
<div className="compact-padding">
  <h3 className="compact-text">Visualization Title</h3>
  <div className="compact-spacing">
    {visualizationItems.map(item => (
      <div key={item.id} className="text-xs">
        {item.content}
      </div>
    ))}
  </div>
</div>
```

## Best Practices

1. **Start with mobile**: Design for mobile first, then enhance for larger screens
2. **Use semantic breakpoints**: Choose breakpoints based on content needs, not device types
3. **Consistent spacing**: Use the same spacing scale across all components
4. **Choose the right utility level**: 
   - `ultra-compact-*` for visualization panels and very dense layouts
   - `compact-*` for dense layouts and data grids
   - `responsive-*` for spacious layouts and cards
5. **Test on real devices**: Always test responsive behavior on actual devices
6. **Keep it simple**: Avoid complex responsive abstractions that are hard to maintain

## Migration Guide

When updating existing components to be responsive:

1. **Audit current behavior**: Check how the component behaves on different screen sizes
2. **Identify breakpoints**: Determine where the layout needs to change
3. **Apply mobile-first**: Start with mobile styles, then add larger screen enhancements
4. **Test thoroughly**: Verify behavior across all target breakpoints
5. **Document changes**: Update component documentation with responsive behavior

## Future Considerations

- **Container queries**: Consider using container queries for component-level responsive behavior
- **CSS Grid**: Leverage CSS Grid for complex layouts
- **Custom properties**: Use CSS custom properties for dynamic theming
- **Performance**: Monitor bundle size and runtime performance of responsive styles
