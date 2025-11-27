<template>
  <Button
    :label="showLabel ? 'Copy to...' : ''"
    icon="pi pi-copy"
    outlined
    size="small"
    :disabled="isDisabled"
    :aria-label="ariaLabel"
    v-tooltip.top="tooltipText"
    @click="handleClick"
    class="copy-btn"
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
    return 'Plugin config cannot be copied';
  }
  // Default tooltip
  return 'Copy to another project';
});

// Handle button click
const handleClick = () => {
  if (!isDisabled.value) {
    emit('copy-clicked', props.configItem);
  }
};
</script>

<style scoped>
/* Copy Button - Match View button hover styles */
.copy-btn:hover:not(:disabled) {
  background: var(--color-primary);
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: var(--shadow-card);
}
</style>
