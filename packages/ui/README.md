# @atal-ai/ui - Design System

Centralized design token system for the ATAL AI application.

## Overview

This package provides a single source of truth for all design tokens used throughout the ATAL AI application, including:

- **Colors** - Brand colors, semantic colors, and color scales
- **Gradients** - Pre-defined gradient combinations
- **Shadows** - Elevation and depth shadows
- **Spacing** - Consistent spacing scale
- **Typography** - Font families, sizes, and weights
- **Border Radius** - Rounded corner scales
- **Transitions** - Animation duration and easing functions
- **Breakpoints** - Responsive design breakpoints
- **Z-Index** - Stacking context values

## Installation

```bash
npm install @atal-ai/ui
# or
yarn add @atal-ai/ui
```

## Usage

### Basic Color Usage

```typescript
import { COLORS } from '@atal-ai/ui'

// Using brand colors
const buttonColor = COLORS.primary        // #FF8C42
const lightColor = COLORS.primaryLight    // #FFD166

// Using semantic colors
const successColor = COLORS.success       // #10B981
const errorColor = COLORS.error           // #EF4444

// Using color scales
const orangeColor = COLORS.orange[600]    // #EA580C
```

### Gradients

```typescript
import { GRADIENTS } from '@atal-ai/ui'

// Using pre-defined gradients
const primaryGradient = GRADIENTS.primary
const successGradient = GRADIENTS.successGradient

// CSS-in-JS usage
const style = {
  background: GRADIENTS.rainbow,
}
```

### Spacing

```typescript
import { SPACING } from '@atal-ai/ui'

const styles = {
  padding: SPACING[4],    // 1rem (16px)
  margin: SPACING[2],     // 0.5rem (8px)
  gap: SPACING[6],        // 1.5rem (24px)
}
```

### Typography

```typescript
import { TYPOGRAPHY } from '@atal-ai/ui'

const heading = {
  fontFamily: TYPOGRAPHY.fontSans,
  fontSize: TYPOGRAPHY.sizes.xl,
  fontWeight: TYPOGRAPHY.weights.bold,
  lineHeight: TYPOGRAPHY.lineHeights.tight,
}
```

### Shadows

```typescript
import { SHADOWS } from '@atal-ai/ui'

const card = {
  boxShadow: SHADOWS.md,  // Elevation 2
}

const elevated = {
  boxShadow: SHADOWS.lg,  // Elevation 3
}
```

### Transitions

```typescript
import { TRANSITIONS } from '@atal-ai/ui'

const button = {
  transition: TRANSITIONS.common.all,
  transitionDuration: TRANSITIONS.duration.fast,
  transitionTimingFunction: TRANSITIONS.easing.inOut,
}
```

### Utility Functions

#### Converting Colors

```typescript
import { hexToRgb, hexToRgba } from '@atal-ai/ui'

// Convert hex to RGB
const rgb = hexToRgb('#FF8C42')
// { r: 255, g: 140, b: 66 }

// Convert hex to RGBA with opacity
const rgba = hexToRgba('#FF8C42', 0.5)
// 'rgba(255, 140, 66, 0.5)'
```

#### Accessibility

```typescript
import { hasGoodContrast } from '@atal-ai/ui'

// Check if two colors have sufficient contrast (WCAG AA)
const isAccessible = hasGoodContrast('#FF8C42', '#FFFFFF')
// true
```

## Color Palette

### Brand Colors

- **Primary**: `#FF8C42` (Orange)
- **Primary Light**: `#FFD166` (Yellow)

### Semantic Colors

- **Success**: `#10B981` (Green)
- **Error**: `#EF4444` (Red)
- **Warning**: `#F59E0B` (Amber)
- **Info**: `#3B82F6` (Blue)

### Extended Color Scales

Each major color has a 10-step scale (50, 100, 200, ..., 900):

- Orange
- Yellow
- Blue
- Green
- Red
- Gray

## Spacing Scale

The spacing scale uses a consistent multiplier (0.25rem):

- `0` = 0
- `1` = 0.25rem (4px)
- `2` = 0.5rem (8px)
- `3` = 0.75rem (12px)
- `4` = 1rem (16px)
- `6` = 1.5rem (24px)
- `8` = 2rem (32px)
- ... and more

## Typography

### Font Families

- **Sans**: Geist Sans (system fallback)
- **Mono**: Geist Mono
- **Devanagari**: For Hindi text
- **Bengali**: For Bengali text

### Font Sizes

From `xs` (12px) to `4xl` (36px)

### Font Weights

- Light: 300
- Normal: 400
- Medium: 500
- Semibold: 600
- Bold: 700
- Extrabold: 800

## Responsive Breakpoints

- `xs`: 320px
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## Z-Index Scale

For managing stacking context:

- `base`: 0
- `dropdown`: 1000
- `sticky`: 1100
- `fixed`: 1200
- `modal`: 1300
- `popover`: 1400
- `tooltip`: 1500
- `notification`: 1600

## Dark Mode

Dark mode tokens are available through the THEME object:

```typescript
import { THEME } from '@atal-ai/ui'

// Light mode
const lightColors = THEME.light.colors

// Dark mode
const darkColors = THEME.dark.colors
```

Or get CSS variables for dark mode:

```typescript
import { getCSSVariables } from '@atal-ai/ui'

const darkVars = getCSSVariables('dark')
```

## Integration with Tailwind

The design tokens are also available as CSS variables in `globals.css`:

```css
:root {
  --primary: #FF8C42;
  --primary-light: #FFD166;
  --background: #FFFFFF;
  /* ... more variables */
}
```

## Best Practices

1. **Always use design tokens** - Don't hardcode colors or spacing
2. **Semantic colors** - Use `success`, `error`, `warning`, `info` for meaningful states
3. **Color scales** - Use appropriate color intensity (e.g., `orange[600]` for hover states)
4. **Spacing consistency** - Use the spacing scale for all margins and padding
5. **Transitions** - Use predefined transitions for consistency
6. **Accessibility** - Check contrast ratios for text on colors

## Contributing

When adding new design tokens:

1. Update `theme.ts` with the new token
2. Add corresponding CSS variables to `globals.css`
3. Update this README with usage examples
4. Commit with a clear description of the changes

## License

MIT
