# Color Palette Dropdown Specification

## Overview

A custom Select dropdown that displays the official Claude Code colors with color chip previews. Used for the `color` property in subagents and commands.

## Implementation Approach

Use PrimeVue `Select` component with custom template slots to render color chips.

## Official Claude Code Colors

```javascript
const colorPalette = [
  { name: 'Blue', value: 'blue', hex: '#3B82F6' },
  { name: 'Cyan', value: 'cyan', hex: '#06B6D4' },
  { name: 'Green', value: 'green', hex: '#22C55E' },
  { name: 'Orange', value: 'orange', hex: '#F97316' },
  { name: 'Purple', value: 'purple', hex: '#A855F7' },
  { name: 'Red', value: 'red', hex: '#EF4444' },
  { name: 'Yellow', value: 'yellow', hex: '#EAB308' },
  { name: 'Pink', value: 'pink', hex: '#EC4899' },
  { name: 'Indigo', value: 'indigo', hex: '#6366F1' },
  { name: 'Teal', value: 'teal', hex: '#14B8A6' }
]
```

**Note:** The `value` is the Claude Code color name (string), `hex` is for UI display only.

## Visual Design

### Closed State (with selection)
```
┌───────────────────────────────────┐
│ [●] Blue                        ▼ │
└───────────────────────────────────┘
```

### Closed State (no selection)
```
┌───────────────────────────────────┐
│ Select color...                 ▼ │
└───────────────────────────────────┘
```

### Open State (dropdown)
```
┌───────────────────────────────────┐
│ [●] Blue                        ▼ │
├───────────────────────────────────┤
│ [●] Blue                          │
│ [●] Cyan                          │
│ [●] Green                         │
│ [●] Orange                        │
│ [●] Purple                        │
│ [●] Red                           │
│ [●] Yellow                        │
│ [●] Pink                          │
│ [●] Indigo                        │
│ [●] Teal                          │
└───────────────────────────────────┘
```

## Component Implementation

### As Part of InlineEditField

```vue
<!-- In InlineEditField.vue, when fieldType === 'colorpalette' -->
<Select
  v-model="editValue"
  :options="colorPalette"
  optionLabel="name"
  optionValue="value"
  placeholder="Select color..."
  showClear
  fluid
>
  <template #value="{ value }">
    <div v-if="value" class="flex items-center gap-2">
      <span
        class="w-4 h-4 rounded-full border border-surface-300"
        :style="{ backgroundColor: getHexForValue(value) }"
      />
      <span>{{ getNameForValue(value) }}</span>
    </div>
    <span v-else class="text-text-secondary">Select color...</span>
  </template>

  <template #option="{ option }">
    <div class="flex items-center gap-2">
      <span
        class="w-4 h-4 rounded-full border border-surface-300"
        :style="{ backgroundColor: option.hex }"
      />
      <span>{{ option.name }}</span>
    </div>
  </template>
</Select>
```

### Standalone Component (Alternative)

```vue
<!-- src/components/forms/ColorPaletteSelect.vue -->
<template>
  <Select
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    :options="colorPalette"
    optionLabel="name"
    optionValue="value"
    :placeholder="placeholder"
    :showClear="showClear"
    :disabled="disabled"
    fluid
  >
    <template #value="{ value }">
      <div v-if="value" class="flex items-center gap-2">
        <span
          class="color-chip"
          :style="{ backgroundColor: getHex(value) }"
        />
        <span>{{ getName(value) }}</span>
      </div>
      <span v-else class="text-text-secondary">{{ placeholder }}</span>
    </template>

    <template #option="{ option }">
      <div class="flex items-center gap-2">
        <span
          class="color-chip"
          :style="{ backgroundColor: option.hex }"
        />
        <span>{{ option.name }}</span>
      </div>
    </template>
  </Select>
</template>

<script setup>
import { computed } from 'vue'
import Select from 'primevue/select'

const props = defineProps({
  modelValue: { type: String, default: null },
  placeholder: { type: String, default: 'Select color...' },
  showClear: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false }
})

defineEmits(['update:modelValue'])

const colorPalette = [
  { name: 'Blue', value: 'blue', hex: '#3B82F6' },
  { name: 'Cyan', value: 'cyan', hex: '#06B6D4' },
  { name: 'Green', value: 'green', hex: '#22C55E' },
  { name: 'Orange', value: 'orange', hex: '#F97316' },
  { name: 'Purple', value: 'purple', hex: '#A855F7' },
  { name: 'Red', value: 'red', hex: '#EF4444' },
  { name: 'Yellow', value: 'yellow', hex: '#EAB308' },
  { name: 'Pink', value: 'pink', hex: '#EC4899' },
  { name: 'Indigo', value: 'indigo', hex: '#6366F1' },
  { name: 'Teal', value: 'teal', hex: '#14B8A6' }
]

const getHex = (value) => {
  const color = colorPalette.find(c => c.value === value)
  return color?.hex || '#6B7280'
}

const getName = (value) => {
  const color = colorPalette.find(c => c.value === value)
  return color?.name || value
}
</script>

<style scoped>
.color-chip {
  @apply w-4 h-4 rounded-full border border-surface-300 dark:border-surface-500;
}
</style>
```

## Usage

### In InlineEditField
```vue
<InlineEditField
  v-model="agent.color"
  field-type="colorpalette"
  label="Color"
/>
```

### Standalone
```vue
<ColorPaletteSelect
  v-model="agent.color"
  placeholder="Choose a color"
/>
```

## Props (Standalone)

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `modelValue` | string | No | null | Selected color value |
| `placeholder` | string | No | "Select color..." | Placeholder text |
| `showClear` | boolean | No | true | Show clear button |
| `disabled` | boolean | No | false | Disable selection |

## Styling Considerations

### Color Chip
- 16x16 pixels (w-4 h-4)
- Rounded full (circle)
- 1px border to ensure visibility on matching backgrounds

### Dark Mode
- Border color adjusts for visibility
- Colors remain the same (hex values work in both modes)

## Accessibility

- Keyboard navigable (Select component provides this)
- Color name displayed alongside chip (not color-only)
- Clear button for removing selection
- Focus visible indicators

## Constants File

Consider creating a shared constants file:

```javascript
// src/constants/claude-code.js
export const COLOR_PALETTE = [
  { name: 'Blue', value: 'blue', hex: '#3B82F6' },
  { name: 'Cyan', value: 'cyan', hex: '#06B6D4' },
  { name: 'Green', value: 'green', hex: '#22C55E' },
  { name: 'Orange', value: 'orange', hex: '#F97316' },
  { name: 'Purple', value: 'purple', hex: '#A855F7' },
  { name: 'Red', value: 'red', hex: '#EF4444' },
  { name: 'Yellow', value: 'yellow', hex: '#EAB308' },
  { name: 'Pink', value: 'pink', hex: '#EC4899' },
  { name: 'Indigo', value: 'indigo', hex: '#6366F1' },
  { name: 'Teal', value: 'teal', hex: '#14B8A6' }
]

export const getColorHex = (value) => {
  const color = COLOR_PALETTE.find(c => c.value === value)
  return color?.hex || '#6B7280'
}

export const getColorName = (value) => {
  const color = COLOR_PALETTE.find(c => c.value === value)
  return color?.name || value
}
```

## PrimeVue Reference

- Select component: https://primevue.org/select/
- Template slots: https://primevue.org/select/#template
