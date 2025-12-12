# Common Utility Components

This directory contains reusable utility components used throughout the Claude Code Config Manager application.

## Components

### LoadingState.vue

Consistent skeleton loader for displaying while loading data.

**Props:**
- `count` (Number, default: 3) - Number of skeleton items to show
- `type` (String, default: 'item') - Type of skeleton: 'item', 'card', or 'list'

**Usage:**
```vue
<template>
  <LoadingState :count="5" type="item" />
</template>

<script>
import LoadingState from '@/components/common/LoadingState.vue'
</script>
```

**Features:**
- Animated gradient shimmer effect
- Three skeleton types for different use cases
- Responsive sizing
- Dark/light theme support

---

### EmptyState.vue

Consistent empty state display when no items are configured.

**Props:**
- `icon` (String, required) - PrimeIcons class (e.g., 'pi pi-users')
- `title` (String, required) - Empty state title
- `message` (String, default: 'No items configured') - Empty state message
- `actionText` (String, optional) - Text for optional action button
- `actionIcon` (String, optional) - Icon for action button

**Events:**
- `action` - Emitted when action button is clicked

**Usage:**
```vue
<template>
  <EmptyState
    icon="pi pi-users"
    title="No Agents Found"
    message="No subagents are configured for this project."
    action-text="Add Agent"
    action-icon="pi pi-plus"
    @action="handleAddAgent"
  />
</template>

<script>
import EmptyState from '@/components/common/EmptyState.vue'

export default {
  components: { EmptyState },
  setup() {
    const handleAddAgent = () => {
      console.log('Add agent clicked')
    }
    return { handleAddAgent }
  }
}
</script>
```

**Features:**
- Centered content layout
- Icon, title, message display
- Optional action button
- Responsive design
- Dark/light theme support

---

### BreadcrumbNavigation.vue

Reusable breadcrumb navigation for pages.

**Props:**
- `items` (Array, required) - Breadcrumb items
  - Each item: `{ label: String, route?: String, icon?: String }`
  - Last item is always treated as "current" (not clickable)

**Usage:**
```vue
<template>
  <BreadcrumbNavigation :items="breadcrumbs" />
</template>

<script>
import BreadcrumbNavigation from '@/components/common/BreadcrumbNavigation.vue'
import { computed } from 'vue'

export default {
  components: { BreadcrumbNavigation },
  setup() {
    const breadcrumbs = computed(() => [
      { label: 'Home', route: '/', icon: 'pi pi-home' },
      { label: 'Projects', route: '/projects' },
      { label: 'Current Project' }
    ])
    return { breadcrumbs }
  }
}
</script>
```

**Features:**
- Vue Router integration
- Support for icons
- Chevron separators
- Current page indicator
- Keyboard navigation support
- Responsive layout
- Dark/light theme support
- High contrast mode support

---

## Testing

To test all utility components visually, a test page is available:

**Test Component:** `TestUtilityComponents.vue`

This component demonstrates all three utility components with various configurations:
- Multiple breadcrumb examples
- All LoadingState types and counts
- EmptyState with and without action buttons
- Different icons for each component

**Note:** The test component is for development purposes only and should not be included in production builds.

---

## Design Principles

All utility components follow these principles:

1. **Theme Support:** All components use CSS variables and support dark/light themes
2. **Responsive:** Components adapt to different screen sizes
3. **Accessible:** Proper ARIA labels, keyboard navigation, and semantic HTML
4. **Consistent:** Follow project design patterns and naming conventions
5. **Reusable:** Type-agnostic and configurable via props
6. **Performance:** Minimal re-renders and optimized animations

---

## CSS Variables Used

These components use the following CSS variables from `/src/styles/variables.css`:

- `--surface-card` - Card background
- `--surface-ground` - Ground background
- `--surface-border` - Border colors
- `--text-primary` - Primary text color
- `--text-secondary` - Secondary text color
- `--primary-color` - Primary brand color
- `--primary-color-dark` - Darker primary color for hover states
- `--border-focus` - Focus outline color

---

## Integration

These components are ready to be integrated into existing pages:

**Recommended Integration Points:**
- **LoadingState:** Replace inline skeleton loaders in ConfigCard, ProjectDetail, UserGlobal
- **EmptyState:** Replace inline empty states in ConfigCard components
- **BreadcrumbNavigation:** Replace inline breadcrumbs in ProjectDetail and UserGlobal

Integration will be completed in Story 2.4 (Component Refactoring).
