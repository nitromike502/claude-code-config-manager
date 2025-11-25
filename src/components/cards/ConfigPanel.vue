<template>
  <Panel
    :header="title"
    :toggleable="toggleable"
    v-model:collapsed="isCollapsed"
    :pt="panelPt"
    :class="['config-panel', cardTypeClass]"
  >
    <!-- Custom Header -->
    <template #header>
      <div class="flex items-center gap-3">
        <i :class="icon" :style="{ color: color }" class="text-2xl md:text-2xl max-md:text-xl"></i>
        <span class="text-lg md:text-lg max-md:text-base font-semibold text-text-emphasis">{{ title }} ({{ count }})</span>
      </div>
    </template>

    <!-- Icons slot for additional header actions -->
    <template #icons>
      <slot name="header-actions"></slot>
    </template>

    <!-- Content -->
    <div class="panel-content">
      <!-- Loading State -->
      <div v-if="loading" class="px-5 py-4 md:px-5 md:py-4 max-md:px-4 max-md:py-4 w-full">
        <div class="skeleton"></div>
        <div class="skeleton"></div>
        <div class="skeleton"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="items.length === 0" class="px-5 py-12 md:px-5 md:py-12 max-md:px-4 max-md:py-10 text-center text-text-muted w-full">
        <i :class="icon" class="block text-5xl md:text-5xl max-md:text-4xl opacity-30 mb-3"></i>
        <p class="m-0 text-sm text-text-secondary">{{ emptyStateMessage }}</p>
      </div>

      <!-- Items List -->
      <div v-else class="w-full">
        <slot :items="displayedItems">
          <!-- Default slot content - expects parent to provide custom rendering -->
        </slot>
      </div>
    </div>

    <!-- Footer -->
    <template #footer v-if="!loading && items.length > initialDisplayCount">
      <Button
        @click="handleToggleShowAll"
        :label="buttonText"
        text
        class="w-full py-3 px-5 bg-transparent text-color-primary border-none cursor-pointer text-sm font-medium transition-all duration-200 text-center hover:bg-bg-hover"
      />
    </template>
  </Panel>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import Button from 'primevue/button';
import Panel from 'primevue/panel';

const props = defineProps({
  title: {
    type: String,
    required: true,
    validator: (value) => value.trim().length > 0
  },
  count: {
    type: Number,
    required: true,
    validator: (value) => value >= 0
  },
  icon: {
    type: String,
    required: true,
    validator: (value) => value.includes('pi-')
  },
  color: {
    type: String,
    required: true,
    validator: (value) => value.startsWith('var(--color-')
  },
  loading: {
    type: Boolean,
    required: true
  },
  items: {
    type: Array,
    required: true
  },
  showingAll: {
    type: Boolean,
    required: true
  },
  initialDisplayCount: {
    type: Number,
    default: 5,
    validator: (value) => value > 0
  },
  cardType: {
    type: String,
    default: '',
    validator: (value) => ['', 'agents', 'commands', 'hooks', 'mcp'].includes(value)
  },
  toggleable: {
    type: Boolean,
    default: false
  },
  collapsed: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits({
  'toggle-show-all': null,
  'update:collapsed': (value) => typeof value === 'boolean',
  'item-selected': (item, itemType) => {
    return item !== null && typeof itemType === 'string'
  }
});

// Local collapsed state with v-model support
const isCollapsed = ref(props.collapsed);

// Sync with parent when collapsed prop changes
watch(() => props.collapsed, (newVal) => {
  isCollapsed.value = newVal;
});

// Emit when local state changes
watch(isCollapsed, (newVal) => {
  emit('update:collapsed', newVal);
});

// Pass-through configuration for PrimeVue Panel component
const panelPt = computed(() => ({
  root: {
    class: 'bg-secondary border-primary',
    style: {
      overflow: 'hidden'
    }
  },
  header: {
    class: 'config-panel-header',
    style: {
      padding: '1rem 1.25rem',
      backgroundColor: 'var(--bg-tertiary)',
      borderBottom: '1px solid var(--border-primary)'
    }
  },
  title: {
    class: 'config-panel-title'
  },
  icons: {
    class: 'config-panel-icons',
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }
  },
  toggleButton: {
    class: 'config-panel-toggle',
    style: {
      width: '2rem',
      height: '2rem'
    }
  },
  content: {
    class: 'p-panel-content',
    style: {
      paddingTop: '1.25rem'
    }
  },
  footer: {
    class: 'config-panel-footer',
    style: {
      padding: '0',
      borderTop: '1px solid var(--border-secondary)'
    }
  }
}));

// Computed property for card type CSS class
const cardTypeClass = computed(() => {
  if (!props.cardType) return '';
  return `${props.cardType}-panel`;
});

// Computed property for displayed items
const displayedItems = computed(() => {
  if (props.showingAll || props.items.length <= props.initialDisplayCount) {
    return props.items;
  }
  return props.items.slice(0, props.initialDisplayCount);
});

// Computed property for empty state message
const emptyStateMessage = computed(() => {
  // Special handling for MCP to keep it uppercase
  if (props.title === 'MCP Servers') {
    return 'No MCP servers configured';
  }
  return `No ${props.title.toLowerCase()} configured`;
});

// Computed property for button text
const buttonText = computed(() => {
  if (props.showingAll) {
    return 'Show less';
  }
  const remainingCount = props.items.length - props.initialDisplayCount;
  return `Show ${remainingCount} more`;
});

// Handle toggle event for show all
const handleToggleShowAll = () => {
  emit('toggle-show-all');
};
</script>

<style scoped>
/* Config Panel Container - Required for PrimeVue Panel overrides */
.config-panel {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  box-shadow: var(--shadow-card);
}

/* Override PrimeVue Panel default styles */
.config-panel :deep(.p-panel-header) {
  background-color: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-primary);
  border-radius: 8px 8px 0 0;
}

.config-panel :deep(.p-panel-content) {
  background-color: var(--bg-secondary);
}

.config-panel :deep(.p-panel-footer) {
  padding: 0;
  border-top: 1px solid var(--border-secondary);
  background-color: var(--bg-secondary);
}

/* Toggle button styling */
.config-panel :deep(.p-panel-toggler) {
  color: var(--text-secondary);
  width: 2rem;
  height: 2rem;
}

.config-panel :deep(.p-panel-toggler:hover) {
  color: var(--text-primary);
  background-color: var(--bg-hover);
}

/* Skeleton Animation - Complex gradient animation that cannot be expressed in Tailwind */
.skeleton {
  height: 60px;
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 25%,
    var(--bg-hover) 50%,
    var(--bg-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 0.75rem;
}

.skeleton:last-child {
  margin-bottom: 0;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
