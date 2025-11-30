<template>
  <Select
    :model-value="modelValue"
    :options="colorOptions"
    option-label="label"
    option-value="value"
    :disabled="disabled"
    :show-clear="true"
    :fluid="true"
    placeholder="Select a color"
    aria-label="Agent color selection"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #value="slotProps">
      <div v-if="slotProps.value" class="flex items-center gap-2">
        <span
          class="color-chip"
          :style="{ backgroundColor: getColorHex(slotProps.value) }"
          :aria-label="`Color: ${slotProps.value}`"
        ></span>
        <span>{{ formatLabel(slotProps.value) }}</span>
      </div>
      <span v-else>None</span>
    </template>

    <template #option="slotProps">
      <div class="flex items-center gap-2">
        <span
          class="color-chip"
          :style="{ backgroundColor: getColorHex(slotProps.option.value) }"
          :aria-label="`Color: ${slotProps.option.value}`"
        ></span>
        <span>{{ slotProps.option.label }}</span>
      </div>
    </template>
  </Select>
</template>

<script setup>
import Select from 'primevue/select'
import { COLOR_OPTIONS } from '@/constants/form-options'

defineProps({
  modelValue: {
    type: String,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

defineEmits(['update:modelValue'])

// Color options with "None" option
const colorOptions = COLOR_OPTIONS

// Map color names to hex values for visual display
const colorMap = {
  blue: '#3b82f6',
  cyan: '#06b6d4',
  green: '#10b981',
  orange: '#f97316',
  purple: '#a855f7',
  red: '#ef4444',
  yellow: '#eab308',
  pink: '#ec4899',
  indigo: '#6366f1',
  teal: '#14b8a6'
}

/**
 * Get hex color code for a color name
 * @param {string} colorName - Color name
 * @returns {string} - Hex color code
 */
function getColorHex(colorName) {
  return colorMap[colorName] || '#6b7280' // Default gray if not found
}

/**
 * Format color label (capitalize first letter)
 * @param {string} colorName - Color name
 * @returns {string} - Formatted label
 */
function formatLabel(colorName) {
  if (!colorName) return 'None'
  return colorName.charAt(0).toUpperCase() + colorName.slice(1)
}
</script>

<style scoped>
.color-chip {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* Dark mode border adjustment */
:global(.dark) .color-chip {
  border-color: rgba(255, 255, 255, 0.2);
}
</style>
