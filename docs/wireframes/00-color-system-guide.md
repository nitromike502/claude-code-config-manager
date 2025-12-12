# Color System Guide

## Overview
This document provides a quick reference for the Claude Code Config Manager color system and explains how colors are organized across wireframe documents.

---

## Color Palette Documents

### Dark Mode
- **File:** `06-dark-mode-palette.md`
- **Usage:** Default theme for Phase 1 MVP
- **PrimeVue Theme:** `lara-dark-blue`

### Light Mode
- **File:** `06-light-mode-palette.md`
- **Usage:** Optional theme (can be implemented in Phase 1 or Phase 2)
- **PrimeVue Theme:** `lara-light-blue`

---

## CSS Variable Naming Convention

All colors use CSS custom properties for easy theme switching:

### Backgrounds
```css
--bg-primary       /* Main app background */
--bg-secondary     /* Cards, panels */
--bg-tertiary      /* Card headers, section headers */
--bg-header        /* Top navigation bar */
--bg-code          /* Code blocks */
--bg-hover         /* Hover states */
```

### Borders
```css
--border-primary   /* Main borders */
--border-secondary /* Subtle dividers */
--border-focus     /* Focus indicators */
```

### Text
```css
--text-primary     /* Main content */
--text-secondary   /* Supporting text */
--text-muted       /* Less important text */
--text-emphasis    /* Important headings */
--text-disabled    /* Disabled elements */
```

### Semantic Colors
```css
--color-primary           /* Primary actions */
--color-primary-hover     /* Primary hover state */
--color-primary-active    /* Primary active state */
--color-link              /* Links */
--color-success           /* Success messages */
--color-warning           /* Warnings */
--color-error             /* Errors */
--color-info              /* Info messages */
```

### Category Colors
```css
--color-agents     /* Agents (green) */
--color-commands   /* Commands (blue) */
--color-hooks      /* Hooks (orange) */
--color-mcp        /* MCP servers (purple) */
```

### Shadows & Overlays
```css
--shadow-card             /* Default card shadow */
--shadow-card-hover       /* Card hover shadow */
--shadow-card-active      /* Card active shadow */
--shadow-sidebar          /* Sidebar shadow */
--overlay-modal           /* Modal backdrop */
--overlay-hover           /* Hover overlay */
```

### Syntax Highlighting
```css
--syntax-keyword          /* Keywords */
--syntax-string           /* Strings */
--syntax-number           /* Numbers */
--syntax-comment          /* Comments */
--syntax-function         /* Functions */
--syntax-variable         /* Variables */
--syntax-type             /* Types */
--syntax-operator         /* Operators */
--syntax-punctuation      /* Punctuation */
```

---

## Before & After: Color Reference Refactoring

### Before (Hex Codes)
```css
.project-card {
  background-color: #1e1e1e;
  border: 1px solid #3e3e3e;
  color: #e0e0e0;
}

.project-card:hover {
  background-color: #2a2a2a;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.stat-agents {
  color: #4CAF50;
}
```

### After (CSS Variables)
```css
.project-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  color: var(--text-primary);
}

.project-card:hover {
  background-color: var(--bg-hover);
  box-shadow: var(--shadow-card-hover);
}

.stat-agents {
  color: var(--color-agents);
}
```

### Benefits
- **Easy theme switching:** Change `data-theme` attribute to switch between light/dark
- **Consistent colors:** All components reference the same variables
- **Maintainability:** Update colors in one place (palette document)
- **Readability:** Variable names are self-documenting

---

## Theme Switching Implementation

### HTML Root Element
```html
<!-- Dark mode (default) -->
<html data-theme="dark">

<!-- Light mode -->
<html data-theme="light">
```

### JavaScript Theme Toggle
```javascript
function toggleTheme() {
  const root = document.documentElement;
  const currentTheme = root.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

// Load saved theme on page load
function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
}
```

### CSS Variables Definition
```css
/* Dark Mode */
:root[data-theme="dark"] {
  --bg-primary: #121212;
  --text-primary: #e0e0e0;
  --color-agents: #4CAF50;
  /* ... other dark mode colors */
}

/* Light Mode */
:root[data-theme="light"] {
  --bg-primary: #f5f5f5;
  --text-primary: #212121;
  --color-agents: #388e3c;
  /* ... other light mode colors */
}
```

---

## Color Usage in Wireframes

### Wireframe Documents Updated
All wireframe documents now reference CSS variables instead of hex codes:

1. **01-dashboard-view.md** - Project list interface
2. **02-project-detail-view.md** - Single project view with config cards
3. **03-user-global-view.md** - User-level configurations
4. **04-detail-interactions.md** - Detail sidebar/modal
5. **05-component-specifications.md** - Reusable components
6. **07-responsive-design.md** - Responsive breakpoints

### Color Sections in Wireframes
Each wireframe now includes a **Color Specifications** section with:
- Reference to palette documents
- CSS variable mappings for that view
- Example CSS implementation
- Usage notes

### Example: Project Card Colors
```markdown
## Color Specifications

**Reference:** See `06-dark-mode-palette.md` and `06-light-mode-palette.md`

### Project Cards
- **Background:** `var(--bg-secondary)`
- **Border:** `var(--border-primary)`
- **Hover Background:** `var(--bg-hover)`
- **Shadow:** `var(--shadow-card)` / `var(--shadow-card-hover)` on hover

### Text
- **Primary Text:** `var(--text-primary)` - project names
- **Secondary Text:** `var(--text-secondary)` - file paths
- **Muted Text:** `var(--text-muted)` - metadata
```

---

## Category Color Consistency

### Agents (Green)
- **Dark Mode:** `#4CAF50`
- **Light Mode:** `#388e3c` (darker for better contrast on white)
- **Variable:** `var(--color-agents)`
- **Icon:** 🤖 or `pi-users`

### Commands (Blue)
- **Dark Mode:** `#2196F3`
- **Light Mode:** `#1976d2` (darker for better contrast)
- **Variable:** `var(--color-commands)`
- **Icon:** ⚡ or `pi-bolt`

### Hooks (Orange)
- **Dark Mode:** `#FF9800`
- **Light Mode:** `#f57c00` (darker for better contrast)
- **Variable:** `var(--color-hooks)`
- **Icon:** 🪝 or `pi-link`

### MCP (Purple)
- **Dark Mode:** `#9C27B0`
- **Light Mode:** `#7b1fa2` (darker for better contrast)
- **Variable:** `var(--color-mcp)`
- **Icon:** 🔌 or `pi-server`

**Note:** Colors are slightly adjusted between light/dark modes to maintain WCAG AA contrast ratios.

---

## Accessibility Standards

All color combinations meet WCAG AA minimum standards:

### Text Contrast Ratios
- **Normal text:** 4.5:1 minimum
- **Large text:** 3:1 minimum
- **UI components:** 3:1 minimum

### Color Independence
- Never rely solely on color to convey information
- Always pair color with icons, labels, or patterns
- Test with color blindness simulators

### Focus Indicators
- All interactive elements have visible focus indicators
- Focus outline: `2px solid var(--border-focus)`
- Focus box shadow: `0 0 0 3px rgba([color], 0.2)`

---

## Testing & Validation

### Contrast Checkers
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Chrome DevTools: Lighthouse accessibility audit

### Color Blindness Testing
- Colorblindly (Chrome extension)
- Stark (Figma plugin)
- NoCoffee Vision Simulator

### Browser Testing
- Chrome DevTools: Device mode + theme toggle
- Firefox: Responsive design mode
- Safari: Dark/light mode switching

---

## Quick Reference: Common Components

### Buttons
```css
.btn-primary {
  background-color: var(--color-primary);
  color: var(--text-emphasis);
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
}
```

### Cards
```css
.card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  box-shadow: var(--shadow-card);
}

.card:hover {
  background-color: var(--bg-hover);
  box-shadow: var(--shadow-card-hover);
}
```

### Links
```css
.link {
  color: var(--color-link);
}

.link:hover {
  color: var(--color-link-hover);
}
```

### Code Blocks
```css
.code-block {
  background-color: var(--bg-code);
  border: 1px solid var(--border-secondary);
  color: var(--text-primary);
}
```

---

## Implementation Checklist

### Phase 1 MVP
- [x] Define dark mode palette with CSS variables
- [x] Define light mode palette with CSS variables
- [x] Refactor wireframes to use CSS variables
- [ ] Implement CSS variables in global stylesheet
- [ ] Apply variables to all components
- [ ] Test theme switching functionality
- [ ] Verify accessibility compliance

### Phase 2+ (Optional)
- [ ] User preference for theme selection
- [ ] Auto-switch based on system preference (`prefers-color-scheme`)
- [ ] High contrast mode
- [ ] Custom theme builder
- [ ] Colorblind-friendly alternative palettes

---

## Notes for Frontend Developer

1. **Global CSS File:** Define all CSS variables in a global stylesheet (e.g., `theme.css` or `colors.css`)

2. **PrimeVue Integration:** Override PrimeVue's CSS variables to match custom theme

3. **Component Styling:** Use CSS variables consistently in all component stylesheets

4. **Theme Toggle:** Implement theme switcher in app header (Phase 1 or Phase 2)

5. **Local Storage:** Persist user's theme preference in localStorage

6. **SSR Considerations:** If using SSR, ensure theme loads before first paint to avoid flash

7. **Performance:** CSS variables have minimal performance impact, but avoid excessive nesting

8. **Fallbacks:** Provide fallback colors for browsers without CSS variable support (IE11)

---

## Related Documents

- **06-dark-mode-palette.md** - Complete dark mode color definitions
- **06-light-mode-palette.md** - Complete light mode color definitions
- **01-dashboard-view.md** - Dashboard color usage
- **02-project-detail-view.md** - Project view color usage
- **03-user-global-view.md** - User view color usage
- **04-detail-interactions.md** - Sidebar color usage
- **05-component-specifications.md** - Component color patterns
- **07-responsive-design.md** - Responsive design specs

---

## Summary

The Claude Code Config Manager color system is built on CSS custom properties (variables) for maximum flexibility and maintainability. All wireframe documents reference these variables instead of hardcoded hex values, enabling easy theme switching between dark and light modes while maintaining consistent branding and accessibility standards throughout the application.
