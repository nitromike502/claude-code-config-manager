# Responsive Design Specifications

## Overview
This document defines how the Claude Code Config Manager UI adapts across different screen sizes. The primary focus is on laptop and desktop screens, with tablet support as secondary priority and mobile as low priority for Phase 1.

---

## Breakpoints

### Defined Breakpoints
```css
/* Extra Small (Mobile) - Low priority for Phase 1 */
@media (max-width: 599px) { }

/* Small (Tablet) - Secondary priority */
@media (min-width: 600px) and (max-width: 767px) { }

/* Medium (Laptop) - Primary focus */
@media (min-width: 768px) and (max-width: 1199px) { }

/* Large (Desktop) - Primary focus */
@media (min-width: 1200px) { }

/* Extra Large (Wide Desktop) */
@media (min-width: 1920px) { }
```

### Design Priorities
1. **Primary:** Desktop (1200px+) and Laptop (768px-1199px)
2. **Secondary:** Tablet (600px-767px)
3. **Low Priority:** Mobile (<600px)

---

## Dashboard View Responsive Behavior

### Large Desktop (1920px+)
```
Layout:
- Max content width: 1600px (centered)
- Project cards: 4 per row
- Card dimensions: ~360px width
- Generous spacing: 32px gap between cards
- Header: Full width with search bar expanded (400px)

Project Card Grid:
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│        │ │        │ │        │ │        │
└────────┘ └────────┘ └────────┘ └────────┘
```

### Desktop (1200px - 1919px)
```
Layout:
- Max content width: 1400px (centered)
- Project cards: 3 per row
- Card dimensions: ~380px width
- Spacing: 24px gap
- Header: Full width with search bar (350px)

Project Card Grid:
┌────────┐ ┌────────┐ ┌────────┐
│        │ │        │ │        │
└────────┘ └────────┘ └────────┘
┌────────┐ ┌────────┐
│        │ │        │
└────────┘ └────────┘
```

### Laptop (768px - 1199px)
```
Layout:
- Content width: 100% with 16px margins
- Project cards: 2 per row
- Card dimensions: ~45% width
- Spacing: 16px gap
- Header: Compact with search bar (300px)

Project Card Grid:
┌────────────┐ ┌────────────┐
│            │ │            │
└────────────┘ └────────────┘
┌────────────┐ ┌────────────┐
│            │ │            │
└────────────┘ └────────────┘
```

### Tablet (600px - 767px)
```
Layout:
- Content width: 100% with 12px margins
- Project cards: 2 per row (narrower)
- Card dimensions: ~48% width
- Spacing: 12px gap
- Header: Compact with abbreviated search

Project Card Grid:
┌──────────┐ ┌──────────┐
│          │ │          │
└──────────┘ └──────────┘
```

### Mobile (<600px) - Low Priority
```
Layout:
- Content width: 100% with 8px margins
- Project cards: 1 per row (full width)
- Card dimensions: 100% width
- Spacing: 8px gap
- Header: Hamburger menu, icon-only buttons

Project Card Grid:
┌────────────────┐
│                │
└────────────────┘
┌────────────────┐
│                │
└────────────────┘
```

---

## Project Detail View Responsive Behavior

### Desktop (1200px+)
```
Layout:
- Config cards: Max width 960px (centered)
- Side panel: 40% width (min 400px, max 600px)
- Config items: Show full descriptions
- "View Details" buttons: Always visible
- Breadcrumbs: Full path shown

Config Card Layout:
┌────────────────────────────────────────────┐
│ 🤖 Subagents (3)            [Expand All]   │
├────────────────────────────────────────────┤
│ backend-developer       [View Details]     │
│ Backend API development specialist         │
├────────────────────────────────────────────┤
│ frontend-developer      [View Details]     │
│ Vue.js frontend development specialist     │
└────────────────────────────────────────────┘
```

### Laptop (768px - 1199px)
```
Layout:
- Config cards: 100% width with 16px margins
- Side panel: 50% width (min 400px)
- Config items: Truncate descriptions after 60 chars
- "View Details" buttons: Icon only on small screens
- Breadcrumbs: Truncate middle paths with "..."

Config Card Layout:
┌──────────────────────────────────────┐
│ 🤖 Subagents (3)    [Expand All]     │
├──────────────────────────────────────┤
│ backend-developer       [👁️]        │
│ Backend API development...           │
├──────────────────────────────────────┤
│ frontend-developer      [👁️]        │
│ Vue.js frontend...                   │
└──────────────────────────────────────┘
```

### Tablet (600px - 767px)
```
Layout:
- Config cards: 100% width with 12px margins
- Side panel: 60% width (min 350px)
- Config items: Truncate descriptions after 40 chars
- "View Details" buttons: Icon only
- Breadcrumbs: Only show current page
- Cards: Reduce padding

Config Card Layout:
┌────────────────────────────────┐
│ 🤖 Subagents (3)  [Expand]     │
├────────────────────────────────┤
│ backend-developer     [👁️]    │
│ Backend API dev...             │
└────────────────────────────────┘
```

### Mobile (<600px) - Low Priority
```
Layout:
- Config cards: 100% width with 8px margins
- Side panel: 90% width (full screen style)
- Config items: Stack name and description vertically
- "View Details" buttons: Full width at bottom of item
- Breadcrumbs: Back button only
- Cards: Minimal padding, collapsed by default

Config Card Layout (Accordion Style):
┌──────────────────────────┐
│ 🤖 Subagents (3)    [▼]  │
├──────────────────────────┤
│ backend-developer        │
│ Backend API...           │
│ [View Details]           │
├──────────────────────────┤
│ [Show 2 more...]         │
└──────────────────────────┘
```

---

## Detail Sidebar Responsive Behavior

### Desktop (1200px+)
- **Width:** 40% of viewport
- **Min Width:** 400px
- **Max Width:** 600px
- **Position:** Right side overlay
- **Modal:** Yes (dims background)
- **Content:** Full width with comfortable padding
- **Navigation:** Prev/Next buttons visible

### Laptop (768px - 1199px)
- **Width:** 50% of viewport
- **Min Width:** 400px
- **Max Width:** None
- **Position:** Right side overlay
- **Content:** Reduced padding
- **Navigation:** Icon-only Prev/Next buttons

### Tablet (600px - 767px)
- **Width:** 60% of viewport
- **Min Width:** 350px
- **Position:** Right side overlay
- **Content:** Minimal padding
- **Code blocks:** Horizontal scroll for long lines
- **Actions:** Stack buttons vertically

### Mobile (<600px) - Low Priority
- **Width:** 90% of viewport (almost full screen)
- **Min Width:** None
- **Position:** Full screen overlay with margins
- **Content:** Minimal padding (8px)
- **Actions:** Full-width stacked buttons
- **Prev/Next:** Hide, use close and reopen for navigation

---

## Header Responsive Behavior

### Desktop (1200px+)
```
┌────────────────────────────────────────────────────────────┐
│ [← Back]  Dashboard / Project      [🔍 Search]  [⟳] [👤]  │
└────────────────────────────────────────────────────────────┘
```
- Full breadcrumbs
- Full-width search (400px)
- All buttons with labels
- Spacing: 24px between elements

### Laptop (768px - 1199px)
```
┌──────────────────────────────────────────────────────┐
│ [←] Dashboard / Pro...  [🔍 Search]  [⟳] [👤]       │
└──────────────────────────────────────────────────────┘
```
- Truncated breadcrumbs
- Medium search (300px)
- Icon-only buttons with tooltips
- Spacing: 16px

### Tablet (600px - 767px)
```
┌────────────────────────────────────────────────┐
│ [←] Project  [🔍]  [⟳] [👤] [☰]                │
└────────────────────────────────────────────────┘
```
- Current page only
- Icon-only search (expands on click)
- All icon buttons
- Spacing: 12px

### Mobile (<600px) - Low Priority
```
┌──────────────────────────────────┐
│ [☰] Claude Code [🔍] [⟳]         │
└──────────────────────────────────┘
```
- Hamburger menu for navigation
- Icon-only buttons
- Minimal spacing: 8px

---

## Typography Scaling

### Headings

#### Desktop (1200px+)
- **H1:** 2rem (32px) - Page titles
- **H2:** 1.5rem (24px) - Section headers
- **H3:** 1.25rem (20px) - Card headers
- **Body:** 1rem (16px)
- **Small:** 0.875rem (14px)

#### Laptop (768px - 1199px)
- **H1:** 1.75rem (28px)
- **H2:** 1.375rem (22px)
- **H3:** 1.125rem (18px)
- **Body:** 1rem (16px)
- **Small:** 0.875rem (14px)

#### Tablet (600px - 767px)
- **H1:** 1.5rem (24px)
- **H2:** 1.25rem (20px)
- **H3:** 1.125rem (18px)
- **Body:** 0.9375rem (15px)
- **Small:** 0.8125rem (13px)

#### Mobile (<600px)
- **H1:** 1.375rem (22px)
- **H2:** 1.125rem (18px)
- **H3:** 1rem (16px)
- **Body:** 0.875rem (14px)
- **Small:** 0.75rem (12px)

---

## Spacing & Padding

### Container Padding

| Breakpoint | Container Padding | Card Padding | Gap Between Items |
|------------|-------------------|--------------|-------------------|
| Desktop (1200px+) | 32px | 24px | 16px |
| Laptop (768px-1199px) | 16px | 16px | 12px |
| Tablet (600px-767px) | 12px | 12px | 8px |
| Mobile (<600px) | 8px | 8px | 8px |

### Component Spacing

| Element | Desktop | Laptop | Tablet | Mobile |
|---------|---------|--------|--------|--------|
| Header height | 64px | 56px | 48px | 48px |
| Card gap | 24px | 16px | 12px | 8px |
| Section gap | 32px | 24px | 16px | 12px |
| Button padding | 12px 24px | 10px 20px | 8px 16px | 8px 12px |

---

## Touch Targets (Mobile/Tablet)

### Minimum Touch Target Sizes
- **Buttons:** 44px × 44px minimum
- **List Items:** 48px minimum height
- **Icons:** 24px × 24px (with padding to 44px touch area)
- **Links:** Increase padding to meet 44px target

### Interactive Spacing
- **Between Buttons:** 8px minimum
- **Between List Items:** 1px divider or 8px gap
- **Around Interactive Elements:** 8px clearance

---

## Performance Considerations

### Image/Icon Loading
- Use SVG icons (scale without quality loss)
- Lazy load images below the fold
- Optimize icon bundle size

### CSS Performance
- Use CSS containment for cards: `contain: layout style paint`
- Use `will-change` sparingly for animations
- Avoid expensive CSS filters on large areas

### JavaScript Performance
- Debounce search input (300ms)
- Throttle scroll events (100ms)
- Virtual scrolling for lists with 50+ items
- Lazy load detail sidebar content

---

## Testing Checklist

### Responsive Testing
- ✅ Test at each breakpoint (599px, 767px, 1199px, 1920px)
- ✅ Test in-between breakpoints for smooth transitions
- ✅ Test landscape and portrait orientations (tablet)
- ✅ Test on actual devices (not just browser resize)

### Device Testing
- ✅ Desktop: Chrome, Firefox, Safari, Edge
- ✅ Laptop: 13" MacBook, 14" Windows laptop
- ✅ Tablet: iPad, Android tablet
- ✅ Mobile: iPhone, Android phone (low priority)

### Interaction Testing
- ✅ Touch gestures work on tablets
- ✅ Hover states don't stick on touch devices
- ✅ Scrolling is smooth on all devices
- ✅ Sidebar/modal dismisses properly

---

## Implementation Notes

### CSS Media Queries
```css
/* Mobile First Approach */
.project-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  padding: 8px;
}

@media (min-width: 600px) {
  .project-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 12px;
  }
}

@media (min-width: 768px) {
  .project-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    padding: 16px;
  }
}

@media (min-width: 1200px) {
  .project-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    padding: 32px;
    max-width: 1400px;
    margin: 0 auto;
  }
}

@media (min-width: 1920px) {
  .project-grid {
    grid-template-columns: repeat(4, 1fr);
    max-width: 1600px;
  }
}
```

### Vue Composable for Breakpoints
```typescript
// composables/useBreakpoints.ts
import { ref, onMounted, onUnmounted } from 'vue';

export function useBreakpoints() {
  const isMobile = ref(false);
  const isTablet = ref(false);
  const isLaptop = ref(false);
  const isDesktop = ref(false);

  const updateBreakpoint = () => {
    const width = window.innerWidth;
    isMobile.value = width < 600;
    isTablet.value = width >= 600 && width < 768;
    isLaptop.value = width >= 768 && width < 1200;
    isDesktop.value = width >= 1200;
  };

  onMounted(() => {
    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', updateBreakpoint);
  });

  return { isMobile, isTablet, isLaptop, isDesktop };
}
```

---

## Notes

### Design Philosophy
- **Mobile First CSS:** Start with mobile styles, enhance for larger screens
- **Progressive Enhancement:** Core functionality works everywhere, enhancements for larger screens
- **Performance First:** Prioritize fast loading and smooth interactions
- **Touch-Friendly:** Even on desktop, design for possible touch input

### Future Enhancements
- Adaptive layout that learns user's most common screen size
- Split-screen mode for comparing configs (desktop only)
- Picture-in-picture detail view (floating window)
- Custom breakpoints per user preference
