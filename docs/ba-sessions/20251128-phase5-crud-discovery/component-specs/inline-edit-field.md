# InlineEditField Component Specification

## Overview

A reusable Vue component that provides inline editing capability for configuration properties. Displays a value with an edit icon, and transforms into an editable field when activated.

## Component Name

`InlineEditField.vue`

## Location

`src/components/forms/InlineEditField.vue`

## Visual States

### Display Mode
```
┌─────────────────────────────────────────┐
│ Value text here                    [✏️] │
└─────────────────────────────────────────┘
```

### Edit Mode
```
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │ Editable field content              │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                              [✓] [✗]    │
└─────────────────────────────────────────┘
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `modelValue` | any | Yes | - | Current value (v-model) |
| `fieldType` | string | Yes | - | Type of edit field |
| `label` | string | No | - | Field label (for accessibility) |
| `options` | array | No | [] | Options for select/multiselect |
| `placeholder` | string | No | - | Placeholder text |
| `disabled` | boolean | No | false | Disable editing |
| `required` | boolean | No | false | Mark as required |
| `validation` | function | No | - | Validation function |

## Field Types

| Type | Component | Use Case |
|------|-----------|----------|
| `text` | InputText | Single-line text |
| `textarea` | Textarea | Multi-line text |
| `select` | Select | Dropdown with options |
| `selectbutton` | SelectButton | Binary/small enum |
| `multiselect` | MultiSelect | Multiple selections |
| `colorpalette` | Select (custom) | Color selection |
| `number` | InputNumber | Numeric values |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | new value | Value changed and accepted |
| `edit-start` | - | Editing mode activated |
| `edit-cancel` | - | Editing cancelled |
| `edit-accept` | new value | Editing accepted |

## Keyboard Support

| Key | Action |
|-----|--------|
| Enter | Accept changes (single-line fields) |
| Escape | Cancel editing |
| Tab | Move to next field |

## Usage Examples

### Text Field
```vue
<InlineEditField
  v-model="agent.name"
  field-type="text"
  label="Name"
  placeholder="Enter name"
  :validation="validateName"
/>
```

### Textarea
```vue
<InlineEditField
  v-model="agent.description"
  field-type="textarea"
  label="Description"
  required
/>
```

### SelectButton (Boolean)
```vue
<InlineEditField
  v-model="hook.enabled"
  field-type="selectbutton"
  label="Status"
  :options="[
    { label: 'Enabled', value: true },
    { label: 'Disabled', value: false }
  ]"
/>
```

### SelectButton (Enum)
```vue
<InlineEditField
  v-model="agent.model"
  field-type="selectbutton"
  label="Model"
  :options="[
    { label: 'Sonnet', value: 'sonnet' },
    { label: 'Opus', value: 'opus' },
    { label: 'Haiku', value: 'haiku' },
    { label: 'Inherit', value: 'inherit' }
  ]"
/>
```

### MultiSelect
```vue
<InlineEditField
  v-model="agent.tools"
  field-type="multiselect"
  label="Allowed Tools"
  :options="builtInTools"
/>
```

### Color Palette
```vue
<InlineEditField
  v-model="agent.color"
  field-type="colorpalette"
  label="Color"
  :options="colorPalette"
/>
```

## Component Structure

```vue
<template>
  <div class="inline-edit-field">
    <!-- Display Mode -->
    <div v-if="!isEditing" class="display-mode">
      <span class="value">{{ displayValue }}</span>
      <Button
        icon="pi pi-pencil"
        text
        rounded
        size="small"
        :disabled="disabled"
        :aria-label="`Edit ${label}`"
        @click="startEdit"
      />
    </div>

    <!-- Edit Mode -->
    <div v-else class="edit-mode">
      <component
        :is="fieldComponent"
        v-model="editValue"
        v-bind="fieldProps"
        @keydown.enter="handleEnter"
        @keydown.escape="cancel"
      />
      <div class="actions">
        <Button
          icon="pi pi-check"
          severity="success"
          text
          rounded
          size="small"
          aria-label="Accept changes"
          @click="accept"
        />
        <Button
          icon="pi pi-times"
          severity="danger"
          text
          rounded
          size="small"
          aria-label="Cancel editing"
          @click="cancel"
        />
      </div>
    </div>

    <!-- Validation Error -->
    <Message
      v-if="validationError"
      severity="error"
      :text="validationError"
      variant="simple"
    />
  </div>
</template>
```

## Styling

```css
.inline-edit-field {
  @apply py-1;
}

.display-mode {
  @apply flex items-center justify-between gap-2 group;
}

.display-mode .value {
  @apply flex-1 text-text-primary;
}

.display-mode button {
  @apply opacity-0 group-hover:opacity-100 transition-opacity;
}

.edit-mode {
  @apply flex gap-2 items-start;
}

.edit-mode .actions {
  @apply flex gap-1 flex-shrink-0;
}
```

## Accessibility

- Edit button has `aria-label="Edit {label}"`
- Accept button has `aria-label="Accept changes"`
- Cancel button has `aria-label="Cancel editing"`
- Field receives focus when entering edit mode
- Escape key cancels editing
- Focus trap within edit mode

## PrimeVue Components Used

- `Button` - Edit, Accept, Cancel buttons
- `InputText` - Text field
- `Textarea` - Multi-line text
- `Select` - Dropdown selection
- `SelectButton` - Binary/enum selection
- `MultiSelect` - Multi-selection
- `InputNumber` - Numeric input
- `Message` - Validation errors

## Implementation Notes

1. **Deep clone** original value when starting edit
2. **Focus management** - Auto-focus field on edit start
3. **Validation** - Run validation before accepting
4. **Escape handling** - Restore original value on cancel
5. **Click outside** - Optional: cancel on click outside
