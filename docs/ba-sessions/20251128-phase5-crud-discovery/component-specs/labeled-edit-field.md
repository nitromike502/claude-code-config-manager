# LabeledEditField Component Specification

## Overview

A wrapper around InlineEditField that includes the label as part of the component. Provides intelligent layout selection based on field type:
- **Inline layout** for simple fields (text, select, number, colorpalette, selectbutton)
- **Block layout** for large content fields (textarea, multiselect)

## Component Name

`LabeledEditField.vue`

## Location

`src/components/forms/LabeledEditField.vue`

## Visual States

### Inline Layout (Simple Fields)

Used for: text, select, number, colorpalette, selectbutton

```
┌─────────────────────────────────────────────────────┐
│ Field Label:  Value text here                  [✏️] │
└─────────────────────────────────────────────────────┘
```

**Edit Mode:**
```
┌─────────────────────────────────────────────────────┐
│ Field Label:  ┌──────────────────────┐  [✓] [✗]    │
│               │ Editable content     │              │
│               └──────────────────────┘              │
└─────────────────────────────────────────────────────┘
```

### Block Layout (Large Content)

Used for: textarea, multiselect

```
┌─────────────────────────────────────────────────────┐
│ Field Label: [✏️]                                   │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Content displayed in pre-formatted block        │ │
│ │ (textarea) or chips (multiselect)               │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Edit Mode:**
```
┌─────────────────────────────────────────────────────┐
│ Field Label:                                        │
│ ┌─────────────────────────────────────────────────┐ │
│ │                                                 │ │
│ │ Large editable textarea or multiselect          │ │
│ │                                                 │ │
│ └─────────────────────────────────────────────────┘ │
│ [Validation error message if present]              │
│ [Save] [Cancel]                                     │
└─────────────────────────────────────────────────────┘
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `modelValue` | any | Yes | null | Current value (v-model) |
| `fieldType` | string | Yes | - | Type of edit field (see Field Types) |
| `label` | string | Yes | - | Label text displayed with the field |
| `options` | array | No | [] | Options for select/multiselect/selectbutton |
| `placeholder` | string | No | '' | Placeholder text |
| `disabled` | boolean | No | false | Disable editing |
| `validation` | array | No | [] | Validation rules from useFormValidation |
| `min` | number | No | undefined | Minimum value for number fields |
| `max` | number | No | undefined | Maximum value for number fields |

## Field Types

### Inline Layout Fields

| Type | Component | Use Case | Layout |
|------|-----------|----------|--------|
| `text` | InputText | Single-line text | Inline |
| `select` | Select | Dropdown with options | Inline |
| `selectbutton` | SelectButton | Binary/small enum | Inline |
| `colorpalette` | ColorPaletteDropdown | Color selection | Inline |
| `number` | InputNumber | Numeric values | Inline |

### Block Layout Fields

| Type | Component | Use Case | Layout |
|------|-----------|----------|--------|
| `textarea` | Textarea | Multi-line text | Block |
| `multiselect` | MultiSelect | Multiple selections | Block |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | new value | Value changed and accepted (v-model) |
| `edit-start` | - | Editing mode activated |
| `edit-cancel` | - | Editing cancelled |
| `edit-accept` | new value | Editing accepted |

## Layout Logic

The component automatically determines layout based on `fieldType`:

```javascript
const isBlockField = computed(() => {
  return ['textarea', 'multiselect'].includes(props.fieldType)
})
```

- **Block fields**: Edit button appears next to label, content displays below
- **Inline fields**: Label and field appear side-by-side in the same row

## Usage Examples

### Text Field (Inline Layout)

```vue
<LabeledEditField
  v-model="agent.name"
  field-type="text"
  label="Agent Name"
  placeholder="Enter name"
  :validation="[
    { rule: 'required', message: 'Name is required' },
    { rule: 'minLength', value: 3, message: 'Name must be at least 3 characters' }
  ]"
/>
```

### Textarea (Block Layout)

```vue
<LabeledEditField
  v-model="agent.description"
  field-type="textarea"
  label="Description"
  placeholder="Describe the agent's purpose"
  :validation="[{ rule: 'maxLength', value: 500 }]"
/>
```

### SelectButton (Inline Layout)

```vue
<LabeledEditField
  v-model="hook.enabled"
  field-type="selectbutton"
  label="Status"
  :options="[
    { label: 'Enabled', value: true },
    { label: 'Disabled', value: false }
  ]"
/>
```

### MultiSelect (Block Layout)

```vue
<LabeledEditField
  v-model="agent.tools"
  field-type="multiselect"
  label="Allowed Tools"
  :options="[
    { label: 'Read', value: 'read' },
    { label: 'Write', value: 'write' },
    { label: 'Bash', value: 'bash' },
    { label: 'Edit', value: 'edit' }
  ]"
  placeholder="Select allowed tools"
/>
```

### Select Dropdown (Inline Layout)

```vue
<LabeledEditField
  v-model="agent.model"
  field-type="select"
  label="Model"
  :options="[
    { label: 'Claude Sonnet 4.5', value: 'claude-sonnet-4-5' },
    { label: 'Claude Opus', value: 'claude-opus' },
    { label: 'Claude Haiku', value: 'claude-haiku' },
    { label: 'Inherit from parent', value: 'inherit' }
  ]"
/>
```

### Color Palette (Inline Layout)

```vue
<LabeledEditField
  v-model="agent.color"
  field-type="colorpalette"
  label="Color"
/>
```

### Number Input (Inline Layout)

```vue
<LabeledEditField
  v-model="agent.temperature"
  field-type="number"
  label="Temperature"
  :min="0"
  :max="2"
  placeholder="0.0 - 2.0"
/>
```

## Component Structure

```vue
<template>
  <div class="labeled-edit-field">
    <!-- Inline layout for simple fields -->
    <div v-if="!isBlockField" class="flex items-start gap-2">
      <div class="label">{{ label }}:</div>
      <InlineEditField
        v-model="modelValue"
        :field-type="fieldType"
        v-bind="$props"
        @update:model-value="$emit('update:modelValue', $event)"
        @edit-start="$emit('edit-start')"
        @edit-cancel="$emit('edit-cancel')"
        @edit-accept="$emit('edit-accept', $event)"
      />
    </div>

    <!-- Block layout for large content -->
    <div v-else>
      <!-- Header with label and edit button -->
      <div class="header">
        <div class="label">{{ label }}:</div>
        <Button
          v-if="!isEditing && !disabled"
          icon="pi pi-pencil"
          text
          rounded
          size="small"
          @click="startEdit"
        />
      </div>

      <!-- Display mode: show content -->
      <div v-if="!isEditing" class="content-display">
        <!-- Textarea: pre-formatted text block -->
        <!-- MultiSelect: chips display -->
      </div>

      <!-- Edit mode: show input with save/cancel -->
      <div v-else class="edit-container">
        <!-- Textarea or MultiSelect component -->
        <!-- Validation error message -->
        <!-- Save/Cancel buttons -->
      </div>
    </div>
  </div>
</template>
```

## Styling

### Inline Layout

```css
.flex items-start gap-2 {
  /* Label and field side-by-side */
}

.label {
  @apply text-text-primary font-bold shrink-0 mt-2 mr-1;
}
```

### Block Layout

```css
.header {
  @apply flex items-center gap-2 mb-2;
}

.content-display pre {
  @apply bg-bg-primary p-3 rounded border border-border-primary
         font-mono text-xs whitespace-pre-wrap break-words
         overflow-x-auto max-h-[300px] overflow-y-auto text-text-primary;
}

.content-display .chips {
  @apply flex flex-wrap gap-1;
}
```

### Edit Button Hover Effect

```css
.edit-btn {
  opacity: 0;
  transition: opacity 0.2s;
}

.labeled-edit-field:hover .edit-btn {
  opacity: 1;
}
```

## Accessibility

- Edit button has `aria-label="Edit {label}"`
- Keyboard support: Tab, Enter, Escape
- Field receives focus when entering edit mode
- Validation errors announced to screen readers
- WCAG 2.1 AA compliant

## PrimeVue Components Used

- `Button` - Edit, Save, Cancel buttons
- `InputText` - Text fields (via InlineEditField)
- `Textarea` - Multi-line text input
- `Select` - Dropdown selection (via InlineEditField)
- `SelectButton` - Binary/enum selection (via InlineEditField)
- `MultiSelect` - Multi-selection
- `InputNumber` - Numeric input (via InlineEditField)
- `Message` - Validation errors
- `ColorPaletteDropdown` - Color selection (via InlineEditField)

## Related Components

- **InlineEditField** - Base component wrapped by LabeledEditField
- **ColorPaletteDropdown** - Custom color picker used by InlineEditField
- **useFormValidation** - Composable for validation logic

## Implementation Notes

1. **Layout Selection**: Automatically chooses inline vs block layout based on field type
2. **Deep Clone**: Original value is cloned when starting edit (arrays are spread)
3. **Focus Management**: Auto-focuses input field when entering edit mode
4. **Validation**: Runs validation before accepting changes
5. **Loading State**: Shows loading indicator during save operation
6. **Escape Handling**: Restores original value on cancel

## Validation Integration

The component integrates with `useFormValidation` composable:

```javascript
import { useFormValidation } from '@/composables/useFormValidation'

const { validate } = useFormValidation()

// Validation rules array format:
const validation = [
  { rule: 'required', message: 'This field is required' },
  { rule: 'minLength', value: 3, message: 'Minimum 3 characters' },
  { rule: 'maxLength', value: 100, message: 'Maximum 100 characters' },
  { rule: 'pattern', value: /^[a-z-]+$/, message: 'Lowercase and hyphens only' }
]
```

## Best Practices

1. **Choose Appropriate Field Type**: Use block layout for content that spans multiple lines
2. **Provide Validation**: Always validate user input with appropriate rules
3. **Use Placeholders**: Help users understand expected input format
4. **Handle Events**: Listen to edit-start, edit-accept for side effects (e.g., autosave)
5. **Disable When Needed**: Use `disabled` prop for read-only scenarios
6. **Label Clarity**: Use descriptive labels that clearly identify the field

## Differences from InlineEditField

| Feature | InlineEditField | LabeledEditField |
|---------|-----------------|------------------|
| Label | Prop only (not displayed) | Displayed as part of component |
| Layout | Always inline | Inline OR block based on type |
| Block fields | Not supported | Textarea and MultiSelect with special layout |
| Edit button | Always inline with value | Next to label for block fields |
| Use case | When label is external | When label is part of the field |

## When to Use

**Use LabeledEditField when:**
- You want the label as part of the component
- You need automatic inline/block layout selection
- You're building forms with consistent labeled fields
- You need special block layout for textarea/multiselect

**Use InlineEditField when:**
- Label is handled externally (e.g., in a table header)
- You need custom label positioning
- All fields should use inline layout
- You need more control over the layout
