<template>
  <Button
    :label="showLabel ? 'Copy to...' : ''"
    icon="pi pi-copy"
    severity="secondary"
    :disabled="isDisabled"
    :aria-label="ariaLabel"
    v-tooltip.top="tooltipText"
    @click="handleClick"
    class="copy-button"
  />
</template>

<script setup>
import { computed } from 'vue';
import Button from 'primevue/button';
import Tooltip from 'primevue/tooltip';

const props = defineProps({
  configItem: {
    type: Object,
    required: true,
    validator: (value) => {
      // Config items can have either 'name' (agents, commands, MCP) or 'event' (hooks)
      return value && typeof value === 'object' && (value.name || value.event);
    }
  },
  disabled: {
    type: Boolean,
    default: false
  },
  showLabel: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits({
  'copy-clicked': (configItem) => {
    return configItem && typeof configItem === 'object';
  }
});

// Computed property for plugin detection
const isPluginItem = computed(() => {
  return props.configItem?.location === 'plugin';
});

// Computed property for combined disabled state (external prop OR plugin item)
const isDisabled = computed(() => {
  return props.disabled || isPluginItem.value;
});

// Computed property for ARIA label
const ariaLabel = computed(() => {
  const itemName = props.configItem?.name || props.configItem?.event || 'configuration';
  return `Copy ${itemName}`;
});

// Computed property for tooltip text
const tooltipText = computed(() => {
  // Check if disabled due to plugin
  if (isPluginItem.value) {
    return 'This configuration is provided by a plugin and cannot be copied';
  }
  // Default tooltip
  return 'Copy this configuration to another project or user-level';
});

// Handle button click
const handleClick = () => {
  if (!isDisabled.value) {
    emit('copy-clicked', props.configItem);
  }
};
</script>

<style scoped>
/* Copy Button Styling */
.copy-button {
  /* Use PrimeVue's default button styles with CSS variables */
  transition: all 0.2s ease;
}

/* Focus indicator for accessibility (WCAG 2.1 AA) */
.copy-button:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

/* Disabled state styling */
.copy-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  color: var(--text-disabled);
}

/* Hover state for non-disabled buttons */
.copy-button:not(:disabled):hover {
  background-color: var(--bg-hover);
}

/* Responsive adjustments */
@media (max-width: 767px) {
  .copy-button {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }
}
</style>
