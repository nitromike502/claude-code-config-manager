<template>
  <div :class="['config-card', cardTypeClass]">
    <!-- Header -->
    <div class="config-header">
      <div class="config-header-left">
        <i :class="icon" :style="{ color: color }"></i>
        <span class="config-title">{{ title }} ({{ count }})</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="skeleton"></div>
      <div class="skeleton"></div>
      <div class="skeleton"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="items.length === 0" class="empty-state">
      <i :class="icon" class="empty-icon"></i>
      <p>No {{ title.toLowerCase() }} configured</p>
    </div>

    <!-- Items List -->
    <div v-else class="items-list">
      <slot :items="displayedItems">
        <!-- Default slot content - expects parent to provide custom rendering -->
      </slot>
    </div>

    <!-- Expand/Collapse Button -->
    <button
      v-if="!loading && items.length > initialDisplayCount"
      @click="handleToggle"
      class="btn-show-more"
    >
      {{ buttonText }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';

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
  }
});

const emit = defineEmits(['toggle-show-all', 'item-selected']);

// Computed property for card type CSS class
const cardTypeClass = computed(() => {
  if (!props.cardType) return '';
  return `${props.cardType}-card`;
});

// Computed property for displayed items
const displayedItems = computed(() => {
  if (props.showingAll || props.items.length <= props.initialDisplayCount) {
    return props.items;
  }
  return props.items.slice(0, props.initialDisplayCount);
});

// Computed property for button text
const buttonText = computed(() => {
  if (props.showingAll) {
    return 'Show less';
  }
  const remainingCount = props.items.length - props.initialDisplayCount;
  return `Show ${remainingCount} more`;
});

// Handle toggle event
const handleToggle = () => {
  emit('toggle-show-all');
};
</script>

<style scoped>
/* Config Card Container */
.config-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

/* Header */
.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background-color: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-primary);
}

.config-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.config-header-left i {
  font-size: 1.5rem;
}

.config-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-emphasis);
}

/* Loading State */
.loading-state {
  padding: 1rem 1.25rem;
}

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

/* Empty State */
.empty-state {
  padding: 3rem 1.25rem;
  text-align: center;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.3;
  margin-bottom: 0.75rem;
  display: block;
}

.empty-state p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Items List */
.items-list {
  padding: 0;
}

/* Expand/Collapse Button */
.btn-show-more {
  width: 100%;
  padding: 0.75rem 1.25rem;
  background-color: transparent;
  color: var(--color-primary);
  border: none;
  border-top: 1px solid var(--border-secondary);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  text-align: center;
}

.btn-show-more:hover {
  background-color: var(--bg-hover);
}

/* Responsive */
@media (max-width: 767px) {
  .config-header {
    padding: 0.875rem 1rem;
  }

  .config-header-left i {
    font-size: 1.25rem;
  }

  .config-title {
    font-size: 1rem;
  }

  .loading-state {
    padding: 1rem;
  }

  .empty-state {
    padding: 2.5rem 1rem;
  }

  .empty-icon {
    font-size: 2.5rem;
  }
}
</style>
