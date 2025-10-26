<template>
  <div class="items-list">
    <div
      v-for="(item, index) in items"
      :key="index"
      class="config-item"
      @click="$emit('item-selected', item, itemType)"
    >
      <div class="item-content">
        <div class="item-name">{{ getItemName(item) }}</div>
        <div class="item-description" :class="{ 'truncated': truncateDescription }">
          {{ getItemDescription(item, itemType) }}
        </div>
      </div>
      <button class="view-details-btn" @click.stop="$emit('item-selected', item, itemType)">
        <i class="pi pi-eye"></i>
        View Details
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

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

defineEmits(['item-selected']);

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
.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.config-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.config-item:hover {
  background: var(--bg-hover);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-card);
}

.item-content {
  flex: 1;
  min-width: 0; /* Allow text truncation */
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.item-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-primary);
}

.item-description {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.item-description.truncated {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.view-details-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0; /* Prevent button from shrinking */
}

.view-details-btn:hover {
  background: var(--color-primary);
  color: var(--text-emphasis);
  transform: translateY(-1px);
  box-shadow: var(--shadow-card);
}

.view-details-btn i {
  font-size: 0.9rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .config-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .view-details-btn {
    width: 100%;
    justify-content: center;
  }
}

/* Dark/Light Mode Support - Handled by CSS Variables */
/* The component automatically supports both themes via the variables defined in variables.css */
</style>
