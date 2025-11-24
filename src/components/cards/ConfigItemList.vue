<template>
  <div class="flex flex-col gap-3">
    <div
      v-for="(item, index) in items"
      :key="index"
      class="config-item flex items-center justify-between gap-4 p-4 rounded-lg cursor-pointer transition-all duration-200 md:flex-col md:items-start md:gap-3"
      @click="$emit('item-selected', item, itemType)"
    >
      <div class="flex-1 min-w-0 flex flex-col gap-1">
        <div class="font-semibold text-[0.95rem] text-text-primary">{{ getItemName(item) }}</div>
        <div
          class="text-[0.85rem] text-text-secondary leading-[1.4]"
          :class="{ 'truncate': truncateDescription }"
        >
          {{ getItemDescription(item, itemType) }}
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <div @click.stop>
          <CopyButton
            :configItem="item"
            :disabled="item.location === 'plugin'"
            :showLabel="false"
            @copy-clicked="handleCopyClick"
          />
        </div>
        <Button
          label="View Details"
          icon="pi pi-eye"
          outlined
          @click.stop="$emit('item-selected', item, itemType)"
          class="view-details-btn"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import Button from 'primevue/button';
import CopyButton from '@/components/copy/CopyButton.vue';

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
/* Config Item - Background, border, and shadow styling (layout in Tailwind) */
.config-item {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
}

.config-item:hover {
  background: var(--bg-hover);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-card);
}

/* View Details Button - Preserve PrimeVue Button hover effects */
.view-details-btn:hover {
  background: var(--color-primary);
  color: var(--text-emphasis);
  transform: translateY(-1px);
  box-shadow: var(--shadow-card);
}

/* Responsive Design - Mobile button layout */
@media (max-width: 768px) {
  .view-details-btn {
    flex: 1;
    justify-content: center;
  }
}

/* Dark/Light Mode Support - Handled by CSS Variables */
</style>
