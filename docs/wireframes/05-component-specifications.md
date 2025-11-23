# Component Specifications

## Overview
This document defines reusable Vue components for the Claude Code Manager application. Each component is specified with its purpose, props, events, and PrimeVue dependencies.

---

## 1. AppHeader Component

### Purpose
Global application header with navigation, search, and actions.

### Location in UI
Top of every view (Dashboard, Project Detail, User/Global).

### Structure
```vue
<template>
  <Toolbar class="app-header">
    <template #start>
      <Button v-if="showBack" icon="pi pi-arrow-left" text @click="handleBack" />
      <Breadcrumb v-if="breadcrumbs" :model="breadcrumbs" />
      <div v-else class="app-title">
        <i class="pi pi-code"></i>
        <span>Claude Code Manager</span>
      </div>
    </template>

    <template #center>
      <IconField iconPosition="left">
        <InputIcon class="pi pi-search"></InputIcon>
        <InputText v-model="searchQuery" placeholder="Search..." @input="handleSearch" />
      </IconField>
    </template>

    <template #end>
      <Button
        icon="pi pi-refresh"
        text
        rounded
        @click="handleRescan"
        v-tooltip.bottom="'Rescan projects'"
      />
      <Button
        icon="pi pi-user"
        text
        rounded
        :class="{ 'active': isUserView }"
        @click="handleUserView"
        v-tooltip.bottom="'User configurations'"
      />
    </template>
  </Toolbar>
</template>
```

### Props
```typescript
interface Props {
  showBack?: boolean;
  breadcrumbs?: Array<{ label: string; to?: string }>;
  searchQuery?: string;
  isUserView?: boolean;
  showRescan?: boolean;
}
```

### Events
```typescript
interface Events {
  'back': () => void;
  'search': (query: string) => void;
  'rescan': () => void;
  'user-view': () => void;
}
```

### PrimeVue Components Used
- `Toolbar`
- `Button`
- `Breadcrumb`
- `InputText`
- `IconField`
- `InputIcon`
- `Tooltip` (directive)

### Styling Notes
- Dark mode background: `#181818`
- Border bottom: `#3e3e3e`
- Height: 64px
- Z-index: 1000 (stays on top)

---

## 2. ProjectCard Component

### Purpose
Display a single project in the dashboard grid.

### Location in UI
Dashboard view (multiple instances in grid).

### Structure
```vue
<template>
  <Card class="project-card" @click="handleClick">
    <template #header>
      <div class="project-header">
        <i class="pi pi-folder"></i>
        <span class="project-name">{{ project.name }}</span>
      </div>
    </template>

    <template #subtitle>
      <div class="project-path">{{ project.path }}</div>
    </template>

    <template #content>
      <div class="project-stats">
        <div class="stat">
          <i class="pi pi-users" style="color: #4CAF50"></i>
          <span>{{ project.stats.agents }} Agents</span>
        </div>
        <div class="stat">
          <i class="pi pi-bolt" style="color: #2196F3"></i>
          <span>{{ project.stats.commands }} Commands</span>
        </div>
        <div class="stat">
          <i class="pi pi-link" style="color: #FF9800"></i>
          <span>{{ project.stats.hooks }} Hooks</span>
        </div>
        <div class="stat">
          <i class="pi pi-server" style="color: #9C27B0"></i>
          <span>{{ project.stats.mcp }} MCP</span>
        </div>
      </div>
    </template>

    <template #footer>
      <Button label="View" icon="pi pi-arrow-right" iconPos="right" />
    </template>
  </Card>
</template>
```

### Props
```typescript
interface Props {
  project: {
    id: string;
    name: string;
    path: string;
    exists: boolean;
    stats: {
      agents: number;
      commands: number;
      hooks: number;
      mcp: number;
    };
  };
}
```

### Events
```typescript
interface Events {
  'click': (projectId: string) => void;
}
```

### PrimeVue Components Used
- `Card`
- `Button`

### Styling Notes
- Card background: `#1e1e1e`
- Hover: `#2a2a2a` with elevated shadow
- Border: `#3e3e3e`
- Cursor: pointer on entire card
- Transition: 200ms ease

---

## 3. ConfigCard Component

### Purpose
Reusable card for displaying configuration lists (Subagents, Commands, Hooks, MCP).

### Location in UI
Project Detail and User/Global views (4 instances per page).

### Structure
```vue
<template>
  <Card class="config-card">
    <template #header>
      <div class="config-header">
        <div class="header-left">
          <i :class="icon" :style="{ color: iconColor }"></i>
          <span class="config-title">{{ title }} ({{ items.length }})</span>
        </div>
        <div class="header-right">
          <Button
            :label="expandedAll ? 'Collapse All' : 'Expand All'"
            text
            size="small"
            @click="toggleExpandAll"
          />
        </div>
      </div>
    </template>

    <template #content>
      <div v-if="loading" class="loading-state">
        <Skeleton height="60px" class="mb-2"></Skeleton>
        <Skeleton height="60px" class="mb-2"></Skeleton>
        <Skeleton height="60px"></Skeleton>
      </div>

      <div v-else-if="items.length === 0" class="empty-state">
        <i :class="icon" style="font-size: 3rem; opacity: 0.3;"></i>
        <p>No {{ title.toLowerCase() }} configured</p>
      </div>

      <div v-else class="config-list">
        <ConfigItem
          v-for="(item, index) in displayedItems"
          :key="item.id || index"
          :item="item"
          :type="type"
          @view-details="handleViewDetails"
        />

        <Button
          v-if="hasMore"
          :label="`Show ${remainingCount} more...`"
          text
          class="show-more-btn"
          @click="showAll"
        />
      </div>
    </template>
  </Card>
</template>
```

### Props
```typescript
interface Props {
  title: string;           // e.g., "Subagents", "Slash Commands"
  icon: string;            // PrimeIcons class
  iconColor: string;       // Hex color for icon
  type: 'agents' | 'commands' | 'hooks' | 'mcp';
  items: Array<any>;       // Config items to display
  loading?: boolean;
  initialDisplayCount?: number;  // Default: 5
}
```

### Events
```typescript
interface Events {
  'view-details': (item: any) => void;
  'expand-all': () => void;
  'collapse-all': () => void;
}
```

### PrimeVue Components Used
- `Card`
- `Button`
- `Skeleton` (loading state)

### State Management
```typescript
const expandedAll = ref(false);
const showingAll = ref(false);

const displayedItems = computed(() => {
  if (showingAll.value) return items.value;
  return items.value.slice(0, props.initialDisplayCount || 5);
});

const hasMore = computed(() => {
  return items.value.length > (props.initialDisplayCount || 5) && !showingAll.value;
});

const remainingCount = computed(() => {
  return items.value.length - (props.initialDisplayCount || 5);
});
```

---

## 4. ConfigItem Component

### Purpose
Display a single configuration item within a ConfigCard.

### Location in UI
Inside ConfigCard (multiple instances).

### Structure
```vue
<template>
  <div class="config-item" @click="handleClick">
    <div class="item-content">
      <div class="item-name">{{ itemName }}</div>
      <div class="item-description">{{ itemDescription }}</div>
    </div>
    <div class="item-actions">
      <Button
        label="View Details"
        icon="pi pi-eye"
        text
        size="small"
        @click.stop="$emit('view-details', item)"
      />
    </div>
  </div>
</template>
```

### Props
```typescript
interface Props {
  item: any;
  type: 'agents' | 'commands' | 'hooks' | 'mcp';
}
```

### Computed Properties
```typescript
const itemName = computed(() => {
  switch (props.type) {
    case 'agents': return props.item.name;
    case 'commands': return props.item.name;
    case 'hooks': return props.item.name || props.item.event;
    case 'mcp': return props.item.name;
  }
});

const itemDescription = computed(() => {
  switch (props.type) {
    case 'agents': return props.item.description;
    case 'commands': return props.item.description;
    case 'hooks': return `Event: ${props.item.event} • Pattern: ${props.item.pattern}`;
    case 'mcp': return `Transport: ${props.item.transport} • Command: ${props.item.command}`;
  }
});
```

### Events
```typescript
interface Events {
  'view-details': (item: any) => void;
}
```

### Styling Notes
- Background: `#1e1e1e`
- Hover: `#2a2a2a`
- Border bottom: `#2e2e2e` (between items)
- Padding: 16px
- Cursor: pointer

---

## 5. DetailSidebar Component

### Purpose
Side panel for displaying full configuration details.

### Location in UI
Overlays right side of screen when viewing details.

### Structure
```vue
<template>
  <Sidebar
    v-model:visible="visible"
    position="right"
    :style="{ width: '40%', minWidth: '400px', maxWidth: '600px' }"
    :modal="true"
  >
    <template #header>
      <div class="sidebar-header">
        <div class="header-title">
          <i :class="typeIcon" :style="{ color: typeColor }"></i>
          <span>{{ item.name }}</span>
        </div>
        <div class="header-actions">
          <Button
            icon="pi pi-chevron-left"
            text
            rounded
            @click="navigatePrev"
            :disabled="!hasPrev"
            v-tooltip.bottom="'Previous'"
          />
          <Button
            icon="pi pi-chevron-right"
            text
            rounded
            @click="navigateNext"
            :disabled="!hasNext"
            v-tooltip.bottom="'Next'"
          />
        </div>
      </div>
      <div class="header-metadata">
        <Tag :value="typeLabel" />
        <span class="file-path">{{ item.filePath }}</span>
      </div>
    </template>

    <div class="sidebar-content">
      <Panel header="YAML Frontmatter" :collapsed="true" toggleable>
        <pre><code class="language-yaml">{{ yamlContent }}</code></pre>
        <Button
          icon="pi pi-copy"
          text
          size="small"
          label="Copy YAML"
          @click="copyYaml"
        />
      </Panel>

      <div class="markdown-content" v-html="renderedMarkdown"></div>
    </div>

    <template #footer>
      <div class="sidebar-actions">
        <Button
          label="Copy All"
          icon="pi pi-copy"
          @click="copyAll"
        />
        <Button
          label="Download"
          icon="pi pi-download"
          outlined
          @click="download"
        />
      </div>
    </template>
  </Sidebar>
</template>
```

### Props
```typescript
interface Props {
  visible: boolean;
  item: any;
  type: 'agents' | 'commands' | 'hooks' | 'mcp';
  hasPrev?: boolean;
  hasNext?: boolean;
}
```

### Events
```typescript
interface Events {
  'update:visible': (visible: boolean) => void;
  'navigate-prev': () => void;
  'navigate-next': () => void;
}
```

### PrimeVue Components Used
- `Sidebar`
- `Panel`
- `Button`
- `Tag`
- `Tooltip` (directive)

### Methods
```typescript
const copyYaml = () => {
  navigator.clipboard.writeText(yamlContent.value);
  toast.add({ severity: 'success', summary: 'Copied', detail: 'YAML copied to clipboard', life: 3000 });
};

const copyAll = () => {
  const fullContent = `---\n${yamlContent.value}\n---\n\n${markdownContent.value}`;
  navigator.clipboard.writeText(fullContent);
  toast.add({ severity: 'success', summary: 'Copied', detail: 'Content copied to clipboard', life: 3000 });
};

const download = () => {
  const blob = new Blob([`---\n${yamlContent.value}\n---\n\n${markdownContent.value}`], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${item.value.name}.md`;
  a.click();
  URL.revokeObjectURL(url);
};
```

---

## 6. SearchFilter Component

### Purpose
Unified search and filter controls for lists.

### Location in UI
Above project/config lists.

### Structure
```vue
<template>
  <div class="search-filter">
    <IconField iconPosition="left" class="search-field">
      <InputIcon class="pi pi-search"></InputIcon>
      <InputText
        v-model="searchQuery"
        placeholder="Search..."
        @input="handleSearch"
      />
      <Button
        v-if="searchQuery"
        icon="pi pi-times"
        text
        rounded
        class="clear-btn"
        @click="clearSearch"
      />
    </IconField>

    <Dropdown
      v-model="selectedSort"
      :options="sortOptions"
      optionLabel="label"
      optionValue="value"
      placeholder="Sort by..."
      @change="handleSort"
    />

    <MultiSelect
      v-if="filterOptions"
      v-model="selectedFilters"
      :options="filterOptions"
      optionLabel="label"
      optionValue="value"
      placeholder="Filter..."
      @change="handleFilter"
    />
  </div>
</template>
```

### Props
```typescript
interface Props {
  searchPlaceholder?: string;
  sortOptions: Array<{ label: string; value: string }>;
  filterOptions?: Array<{ label: string; value: string }>;
}
```

### Events
```typescript
interface Events {
  'search': (query: string) => void;
  'sort': (sortBy: string) => void;
  'filter': (filters: string[]) => void;
}
```

### PrimeVue Components Used
- `InputText`
- `IconField`
- `InputIcon`
- `Button`
- `Dropdown`
- `MultiSelect`

---

## 7. EmptyState Component

### Purpose
Display when no data is available.

### Structure
```vue
<template>
  <div class="empty-state">
    <i :class="icon" class="empty-icon"></i>
    <h3>{{ title }}</h3>
    <p>{{ message }}</p>
    <Button v-if="action" :label="action.label" @click="action.handler" />
  </div>
</template>
```

### Props
```typescript
interface Props {
  icon: string;
  title: string;
  message: string;
  action?: {
    label: string;
    handler: () => void;
  };
}
```

---

## 8. LoadingState Component

### Purpose
Standardized skeleton loading placeholder used across all views to replace custom spinner implementations.

### Structure
```vue
<template>
  <div class="loading-state">
    <Skeleton v-for="n in count" :key="n" :height="height" class="mb-2"></Skeleton>
  </div>
</template>
```

### Props
```typescript
interface Props {
  count?: number;      // Default: 3
  height?: string;     // Default: "60px"
}
```

### PrimeVue Components Used
- `Skeleton`

### Usage Pattern
The LoadingState component is the standardized loading pattern across all views:
- Dashboard.vue (project grid loading)
- ProjectDetail.vue (page-level loading)
- UserGlobal.vue (page-level loading)

```vue
<LoadingState v-if="loading" :count="5" height="60px" />
<template v-else>
  <!-- content -->
</template>
```

---

## 9. Dropdown Component

### Purpose
PrimeVue Dropdown for project sorting and filtering.

### Usage in Dashboard
```vue
<Dropdown
  v-model="sortBy"
  :options="sortOptions"
  optionLabel="label"
  optionValue="value"
  placeholder="Sort by..."
  class="min-w-[200px]"
/>
```

### Sort Options Structure
```typescript
const sortOptions = [
  { label: 'Name (A-Z)', value: 'name-asc' },
  { label: 'Name (Z-A)', value: 'name-desc' },
  { label: 'Most Agents', value: 'agents-desc' },
  { label: 'Most Commands', value: 'commands-desc' }
];
```

### PrimeVue Components Used
- `Dropdown`

### Accessibility
- Keyboard navigation: Tab, Enter, Arrow keys
- Screen reader support built-in
- WCAG 2.1 AA compliant

---

## 10. Theme Toggle Button

### Purpose
PrimeVue Button with PrimeIcons for theme switching.

### Usage in App.vue
```vue
<Button
  @click="themeStore.toggleTheme"
  :icon="themeStore.currentTheme === 'light' ? 'pi pi-moon' : 'pi pi-sun'"
  :label="themeStore.currentTheme === 'light' ? 'Dark' : 'Light'"
  severity="secondary"
  outlined
/>
```

### PrimeVue Components Used
- `Button`
- `PrimeIcons` (pi-moon, pi-sun)

### Styling
- severity: "secondary"
- outlined: true (transparent background)
- Consistent with PrimeVue Aura theme

---

## Component Relationships

```
App
├── AppHeader (global)
│   ├── Toolbar
│   ├── Breadcrumb
│   ├── InputText (search)
│   └── Buttons
│
├── DashboardView
│   ├── SearchFilter
│   └── ProjectCard (multiple)
│
├── ProjectDetailView
│   ├── AppHeader
│   ├── Card (project info)
│   ├── ConfigCard (4 instances)
│   │   └── ConfigItem (multiple)
│   └── DetailSidebar
│
└── UserGlobalView
    ├── AppHeader
    ├── Card (user info)
    ├── ConfigCard (4 instances)
    │   └── ConfigItem (multiple)
    └── DetailSidebar
```

---

## Shared Composables

### useApi
```typescript
// composables/useApi.ts
export function useApi() {
  const fetchProjects = async () => {
    const response = await fetch('/api/projects');
    return response.json();
  };

  const fetchProjectAgents = async (projectId: string) => {
    const response = await fetch(`/api/projects/${projectId}/agents`);
    return response.json();
  };

  // ... other API methods

  return {
    fetchProjects,
    fetchProjectAgents,
    // ...
  };
}
```

### useToast
```typescript
// composables/useToast.ts
import { useToast as usePrimeToast } from 'primevue/usetoast';

export function useToast() {
  const toast = usePrimeToast();

  const showSuccess = (message: string) => {
    toast.add({ severity: 'success', summary: 'Success', detail: message, life: 3000 });
  };

  const showError = (message: string) => {
    toast.add({ severity: 'error', summary: 'Error', detail: message, life: 5000 });
  };

  return { showSuccess, showError, toast };
}
```

### useClipboard
```typescript
// composables/useClipboard.ts
export function useClipboard() {
  const { showSuccess, showError } = useToast();

  const copyToClipboard = async (text: string, successMessage = 'Copied to clipboard') => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess(successMessage);
    } catch (error) {
      showError('Failed to copy to clipboard');
    }
  };

  return { copyToClipboard };
}
```

---

## Notes

### Implementation Best Practices
- Use Vue 3 Composition API (`<script setup>`)
- TypeScript for all components
- PrimeVue components from CDN (import from primevue)
- Consistent prop naming conventions
- Emit events for parent communication
- Use computed properties for derived state
- Implement loading and error states for all data-fetching components
- Add keyboard navigation support
- Ensure accessibility (ARIA labels, focus management)

### Testing Recommendations
- Unit tests for computed properties and methods
- Integration tests for component interactions
- E2E tests for critical user flows
- Visual regression tests for UI consistency
