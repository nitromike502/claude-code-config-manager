<template>
  <div class="flex flex-col gap-3">
    <Card
      v-for="(item, index) in items"
      :key="index"
      :pt="cardPt"
      class="config-item-card cursor-pointer"
      @click="$emit('item-selected', item, itemType)"
    >
      <!-- Header: Name (left) + Buttons (right) -->
      <template #header>
        <div class="flex items-center justify-between gap-3 px-4 py-3">
          <span class="font-semibold text-[0.95rem] text-text-primary truncate">{{ getItemName(item) }}</span>
          <div class="flex items-center gap-2 shrink-0" @click.stop>
            <CopyButton
              :configItem="item"
              :disabled="item.location === 'plugin'"
              :showLabel="false"
              @copy-clicked="handleCopyClick"
            />
            <Button
              label="View"
              icon="pi pi-eye"
              outlined
              size="small"
              @click.stop="$emit('item-selected', item, itemType)"
              class="view-btn"
            />
          </div>
        </div>
      </template>

      <!-- Content: Description only -->
      <template #content>
        <div
          class="text-[0.85rem] text-text-secondary leading-[1.4]"
          :class="{ 'line-clamp-2': truncateDescription }"
        >
          {{ getItemDescription(item, itemType) }}
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import CopyButton from '@/components/copy/CopyButton.vue';

// Pass-through configuration for PrimeVue Card component
const cardPt = computed(() => ({
  root: {
    class: 'config-item-card-root'
  },
  header: {
    class: 'config-item-card-header'
  },
  body: {
    class: 'config-item-card-body'
  },
  content: {
    class: 'config-item-card-content'
  }
}));

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  itemType: {
    type: String,
    required: true,
    validator: (value) => ['agents', 'commands', 'hooks', 'mcp'].includes(value),
  },
  truncateDescription: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits({
  'item-selected': (item, itemType) => {
    return item !== null && typeof itemType === 'string' && ['agents', 'commands', 'hooks', 'mcp'].includes(itemType)
  },
  'copy-clicked': (item) => {
    return item !== null && typeof item === 'object';
  }
});

/**
 * Handle copy button click - emit event to parent
 * Adds configType field to identify what kind of config this is
 * Note: For hooks, we preserve the original 'type' field (command/shell/etc)
 */
const handleCopyClick = (item) => {
  // Convert itemType from plural ('agents', 'commands') to singular ('agent', 'command')
  const typeMapping = {
    'agents': 'agent',
    'commands': 'command',
    'hooks': 'hook',
    'mcp': 'mcp'
  };

  const itemWithType = {
    ...item,
    configType: typeMapping[props.itemType] || props.itemType
  };

  emit('copy-clicked', itemWithType);
};

/**
 * Get the display name for an item based on its type
 */
const getItemName = (item) => {
  // For hooks, prefer 'name' field, then fall back to 'event'
  if (props.itemType === 'hooks') {
    return item.name || item.event || 'Unnamed Hook';
  }

  // For all other types, use the 'name' field
  return item.name || 'Unnamed';
};

/**
 * Get the appropriate description based on item type
 */
const getItemDescription = (item, type) => {
  switch (type) {
    case 'agents':
      return item.description || 'No description available';

    case 'commands':
      return item.description || 'No description available';

    case 'hooks':
      // Display event and pattern information
      const event = item.event || 'N/A';
      const pattern = item.pattern || 'N/A';
      return `Event: ${event} • Pattern: ${pattern}`;

    case 'mcp':
      // Display transport and command information
      const transport = item.transport || 'N/A';
      const command = item.command || 'N/A';
      return `Transport: ${transport} • Command: ${command}`;

    default:
      return 'No details available';
  }
};
</script>

<style scoped>
/* Config Item Card - PrimeVue Card styling */
.config-item-card {
  transition: all 0.2s ease;
}

.config-item-card:hover {
  box-shadow: var(--shadow-card);
}

/* Card Root - Background and border */
:deep(.config-item-card-root) {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  overflow: hidden;
}

.config-item-card:hover :deep(.config-item-card-root) {
  background: var(--bg-hover);
  border-color: var(--color-primary);
}

/* Dark mode - Use primary-hover color for card border on hover */
:global(.dark) .config-item-card:hover :deep(.config-item-card-root) {
  border-color: var(--color-primary-hover);
}

/* Card Header - Bottom border separator */
:deep(.config-item-card-header) {
  padding: 0;
  background: transparent;
  border-bottom: 1px solid var(--border-secondary);
}

/* Card Body - No extra padding (handled by content) */
:deep(.config-item-card-body) {
  padding: 0;
}

/* Card Content - Padding for description */
:deep(.config-item-card-content) {
  padding: 0.75rem 1rem;
}

/* View Button - Smaller styling */
.view-btn {
  font-size: 0.8rem;
}

.view-btn:hover {
  background: var(--color-primary);
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: var(--shadow-card);
}

/* Line clamp for description truncation */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Responsive Design - Mobile adjustments */
@media (max-width: 768px) {
  .view-btn {
    flex: 1;
    justify-content: center;
  }
}
</style>
