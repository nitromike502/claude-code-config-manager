# CSS Variables Guide

**Document Version:** 1.0
**Last Updated:** October 31, 2025
**Related Ticket:** HIGH-001 - Standardize CSS Variable System

---

## Overview

Claude Code Manager uses CSS Custom Properties (variables) for theming and consistent styling across the application. This system supports light and dark modes with seamless theme switching.

### Key Principles

1. **Consistent Naming** - All variables follow semantic prefixes (`--bg-*`, `--text-*`, `--color-*`)
2. **Theme Parity** - Both themes define identical variable names with different values
3. **Single Source of Truth** - All variables defined in `src/styles/variables.css`
4. **No Inline Values** - Components always use variables, never hardcoded colors

---

## Variable Categories

### Backgrounds (`--bg-*`)

Used for page backgrounds, card surfaces, and UI elements.

| Variable | Purpose | Dark Value | Light Value |
|----------|---------|------------|-------------|
| `--bg-primary` | Page background | `#121212` | `#f5f5f5` |
| `--bg-secondary` | Card/panel backgrounds | `#1e1e1e` | `#ffffff` |
| `--bg-tertiary` | Headers, footers | `#252525` | `#fafafa` |
| `--bg-header` | App header specific | `#181818` | `#ffffff` |
| `--bg-code` | Code block backgrounds | `#1a1a1a` | `#f8f8f8` |
| `--bg-hover` | Interactive hover states | `#2a2a2a` | `#fafafa` |

**Example Usage:**
```css
.card {
  background-color: var(--bg-secondary);
}

.card:hover {
  background-color: var(--bg-hover);
}
```

---

### Text (`--text-*`)

Used for all text content with varying emphasis levels.

| Variable | Purpose | Dark Value | Light Value |
|----------|---------|------------|-------------|
| `--text-primary` | Default body text | `#e0e0e0` | `#212121` |
| `--text-secondary` | Labels, captions | `#a0a0a0` | `#616161` |
| `--text-muted` | Subtle hints | `#707070` | `#9e9e9e` |
| `--text-emphasis` | Headings, important | `#ffffff` | `#000000` |
| `--text-disabled` | Inactive elements | `#505050` | `#bdbdbd` |

**Example Usage:**
```css
.title {
  color: var(--text-emphasis);
}

.description {
  color: var(--text-secondary);
}

.hint {
  color: var(--text-muted);
}
```

---

### Borders (`--border-*`)

Used for borders, dividers, and focus indicators.

| Variable | Purpose | Dark Value | Light Value |
|----------|---------|------------|-------------|
| `--border-primary` | Default borders | `#3e3e3e` | `#e0e0e0` |
| `--border-secondary` | Subtle dividers | `#2e2e2e` | `#eeeeee` |
| `--border-focus` | Keyboard focus | `#007ad9` | `#1976d2` |

**Example Usage:**
```css
.card {
  border: 1px solid var(--border-primary);
}

input:focus {
  border-color: var(--border-focus);
  outline: 2px solid var(--border-focus);
}
```

---

### Semantic Colors (`--color-*`)

Brand colors and their interactive states.

#### Primary Brand Color

| Variable | Purpose | Dark Value | Light Value |
|----------|---------|------------|-------------|
| `--color-primary` | Default state | `#007ad9` | `#1976d2` |
| `--color-primary-hover` | Hover state | `#005fa3` | `#1565c0` |
| `--color-primary-active` | Active/pressed | `#004d82` | `#0d47a1` |
| `--color-primary-disabled` | Disabled state | `#003d66` | `#bbdefb` |

**Example Usage:**
```css
.button-primary {
  background-color: var(--color-primary);
}

.button-primary:hover {
  background-color: var(--color-primary-hover);
}

.button-primary:active {
  background-color: var(--color-primary-active);
}

.button-primary:disabled {
  background-color: var(--color-primary-disabled);
}
```

#### Link Colors

| Variable | Purpose | Dark Value | Light Value |
|----------|---------|------------|-------------|
| `--color-link` | Default link | `#64B5F6` | `#1976d2` |
| `--color-link-hover` | Hover state | `#42A5F5` | `#1565c0` |
| `--color-link-visited` | Visited links | `#90CAF9` | `#5e35b1` |

---

### Status Colors (`--color-*`)

Semantic colors for success, warning, error, and info states.

| Variable | Purpose | Dark Value | Light Value |
|----------|---------|------------|-------------|
| `--color-success` | Success text/icons | `#4CAF50` | `#388e3c` |
| `--color-success-bg` | Success background | `#1b5e20` | `#e8f5e9` |
| `--color-warning` | Warning text/icons | `#FFA726` | `#f57c00` |
| `--color-warning-bg` | Warning background | `#e65100` | `#fff3e0` |
| `--color-error` | Error text/icons | `#EF5350` | `#d32f2f` |
| `--color-error-bg` | Error background | `#b71c1c` | `#ffebee` |
| `--color-info` | Info text/icons | `#2196F3` | `#1976d2` |
| `--color-info-bg` | Info background | `#0d47a1` | `#e3f2fd` |

**Example Usage:**
```css
.alert-success {
  color: var(--color-success);
  background-color: var(--color-success-bg);
  border-left: 4px solid var(--color-success);
}

.alert-error {
  color: var(--color-error);
  background-color: var(--color-error-bg);
  border-left: 4px solid var(--color-error);
}
```

---

### Category Colors (`--color-*`)

Specific colors for Claude Code configuration types.

| Variable | Purpose | Dark Value | Light Value |
|----------|---------|------------|-------------|
| `--color-agents` | Subagents | `#4CAF50` (Green) | `#388e3c` |
| `--color-commands` | Slash commands | `#2196F3` (Blue) | `#1976d2` |
| `--color-skills` | Skills | `#a855f7` (Purple) | `#c084fc` |
| `--color-hooks` | Hooks | `#FF9800` (Orange) | `#f57c00` |
| `--color-mcp` | MCP servers | `#9C27B0` (Purple) | `#7b1fa2` |
| `--color-user` | User-level configs | `#9C27B0` (Purple) | `#7b1fa2` |

**Example Usage:**
```vue
<template>
  <div class="config-card" :class="`config-${type}`">
    <span class="icon" :style="{ color: categoryColor }">●</span>
    {{ title }}
  </div>
</template>

<script>
export default {
  props: ['type'], // 'agents', 'commands', 'skills', 'hooks', 'mcp', 'user'
  computed: {
    categoryColor() {
      return `var(--color-${this.type})`;
    }
  }
}
</script>
```

---

### Shadows (`--shadow-*`)

Box shadows for depth and elevation.

| Variable | Purpose | Usage |
|----------|---------|-------|
| `--shadow-card` | Default card elevation | Cards at rest |
| `--shadow-card-hover` | Lifted card state | Cards on hover |
| `--shadow-card-active` | Pressed card state | Cards when clicked |
| `--shadow-sidebar` | Sidebar/drawer shadow | Overlays, sidebars |

**Example Usage:**
```css
.card {
  box-shadow: var(--shadow-card);
  transition: box-shadow 0.2s;
}

.card:hover {
  box-shadow: var(--shadow-card-hover);
}

.sidebar {
  box-shadow: var(--shadow-sidebar);
}
```

---

## PrimeVue Compatibility

The system maintains compatibility aliases for potential PrimeVue component integration:

| Alias | Maps To | Purpose |
|-------|---------|---------|
| `--surface-ground` | `--bg-primary` | Page background |
| `--surface-card` | `--bg-secondary` | Card backgrounds |
| `--surface-border` | `--border-primary` | Default borders |

**When to use:**
- Use standardized names (`--bg-*`, `--border-*`) for new code
- Aliases are maintained for PrimeVue components if added later
- Do not use aliases in custom Vue components

---

## Theme Switching

The application supports two themes:

- **Dark Mode** (default): `data-theme="dark"`
- **Light Mode**: `data-theme="light"`

### How It Works

Theme switching is handled by toggling the `data-theme` attribute on the `<html>` element:

```javascript
// Theme store (src/stores/theme.js)
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}
```

Both themes define **identical variable names** with different values, so no component code changes are needed when switching themes.

### Testing Themes

**Manual Testing:**
1. Start dev server: `npm run dev`
2. Click theme toggle button (top right)
3. Verify colors switch smoothly
4. Refresh page - theme should persist
5. Check browser console for errors

**Automated Testing:**
```bash
npm run test:visual  # Includes theme switching tests
```

---

## Usage Guidelines

### ✅ Do

```css
/* Use semantic variables */
.card {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

/* Use status colors for semantic meaning */
.error-message {
  color: var(--color-error);
}

/* Use category colors for config types */
.agent-badge {
  background-color: var(--color-agents);
}
```

### ❌ Don't

```css
/* Don't use hardcoded colors */
.card {
  background-color: #1e1e1e; /* Bad - breaks theme switching */
}

/* Don't use hex values inline */
<div style="color: #e0e0e0"></div> /* Bad */

/* Don't create component-specific color variables */
/* Use existing semantic variables instead */
.my-component {
  --my-custom-blue: #007ad9; /* Bad - use --color-primary */
}
```

---

## Adding New Variables

If you need to add new variables:

### 1. Choose the Right Category

- **Backgrounds?** → `--bg-*`
- **Text colors?** → `--text-*`
- **Borders?** → `--border-*`
- **Semantic colors?** → `--color-*`
- **Shadows?** → `--shadow-*`

### 2. Define in Both Themes

**Always define variables in both dark and light modes:**

```css
/* src/styles/variables.css */

/* Dark Mode */
:root[data-theme="dark"] {
  --bg-sidebar: #1a1a1a; /* Example: new sidebar background */
}

/* Light Mode */
:root[data-theme="light"] {
  --bg-sidebar: #f0f0f0; /* Same variable, different value */
}
```

### 3. Document the Variable

Add comments explaining the variable's purpose:

```css
/* Sidebar specific background (darker than tertiary) */
--bg-sidebar: #1a1a1a;
```

### 4. Update This Guide

Add the new variable to the appropriate section of this document with:
- Variable name
- Purpose/usage
- Dark value
- Light value
- Example usage

---

## Migration from Legacy Variables

The following variables have been standardized (October 2025):

| Legacy Variable | New Variable | Notes |
|-----------------|--------------|-------|
| `--surface-border` | `--border-primary` | Migrated |
| `--primary-color` | `--color-primary` | Migrated |
| `--surface-ground` | `--bg-primary` | Migrated |
| `--primary-color-dark` | `--color-primary-hover` | Migrated |
| `--surface-card` | `--bg-secondary` | Migrated |
| `--border-color` | `--border-primary` | Removed duplicate |
| `--red-500`, `--red-600` | `--color-error` | Migrated |

**All component code has been updated.** Do not use legacy variable names in new code.

---

## Browser Support

CSS Custom Properties are supported in:
- Chrome 49+
- Firefox 31+
- Safari 9.1+
- Edge 15+

All modern browsers support the features used in this theme system.

---

## Troubleshooting

### Theme not switching?

**Check:**
1. `data-theme` attribute set on `<html>` element?
2. Browser console for CSS errors?
3. Variable names spelled correctly (case-sensitive)?

### Colors look wrong?

**Check:**
1. Using `var(--variable-name)` not plain values?
2. Variable defined in both dark and light themes?
3. Browser dev tools → Computed styles → Variable values

### New variable not working?

**Check:**
1. Defined in `:root[data-theme="dark"]` **and** `:root[data-theme="light"]`?
2. Using correct prefix (`--bg-*`, `--text-*`, etc.)?
3. Dev server restarted after adding variable?

---

## Quick Reference

### Most Common Variables

```css
/* Backgrounds */
--bg-primary       /* Page background */
--bg-secondary     /* Card background */
--bg-hover         /* Hover state */

/* Text */
--text-primary     /* Body text */
--text-secondary   /* Labels */
--text-emphasis    /* Headings */

/* Borders */
--border-primary   /* Default border */
--border-focus     /* Focus indicator */

/* Colors */
--color-primary    /* Brand color */
--color-error      /* Error state */
--color-success    /* Success state */
```

### Template for New Components

```vue
<template>
  <div class="my-component">
    <h2 class="title">{{ title }}</h2>
    <p class="description">{{ description }}</p>
  </div>
</template>

<style scoped>
.my-component {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  padding: 1rem;
}

.title {
  color: var(--text-emphasis);
  margin-bottom: 0.5rem;
}

.description {
  color: var(--text-secondary);
}
</style>
```

---

## Related Documentation

- **Variable Definitions:** `src/styles/variables.css`
- **Global Styles:** `src/styles/global.css`
- **Theme Store:** `src/stores/theme.js`
- **Testing Guide:** `docs/guides/TESTING-GUIDE.md`
- **Original Ticket:** `docs/tickets/phase-2.2/HIGH-001-standardize-css-variables.md`

---

## Changelog

### v1.0 - October 31, 2025
- Initial documentation created
- Completed HIGH-001 standardization
- Removed 11 unused variables
- Added comprehensive inline comments to variables.css
- Migrated 92 legacy variable references
