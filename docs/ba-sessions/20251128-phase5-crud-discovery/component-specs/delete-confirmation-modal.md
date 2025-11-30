# DeleteConfirmationModal Component Specification

## Overview

A reusable modal dialog for confirming deletion of configuration items. Includes safety measures: displays dependent items, requires typing "delete" to confirm.

## Component Name

`DeleteConfirmationModal.vue`

## Location

`src/components/modals/DeleteConfirmationModal.vue`

## Visual Layout

```
┌─────────────────────────────────────────────────┐
│ ⚠️ Delete Configuration                      [X] │
├─────────────────────────────────────────────────┤
│                                                 │
│  Are you sure you want to delete               │
│  "agent-name"? This cannot be undone.          │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ ⚠️ Referenced by:                        │   │
│  │ • agents/api-specialist.md              │   │
│  │ • commands/tools/validate.md            │   │
│  │ • skills/test-runner/SKILL.md           │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Type "delete" to confirm:                     │
│  ┌─────────────────────────────────────────┐   │
│  │                                         │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
├─────────────────────────────────────────────────┤
│                    [Cancel]  [Delete]           │
└─────────────────────────────────────────────────┘
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `visible` | boolean | Yes | - | Show/hide modal (v-model) |
| `itemType` | string | Yes | - | Config type (agent, command, etc.) |
| `itemName` | string | Yes | - | Name of item being deleted |
| `dependentItems` | array | No | [] | List of items referencing this one |
| `loading` | boolean | No | false | Show loading state during delete |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:visible` | boolean | Modal visibility changed |
| `confirm` | - | User confirmed deletion |
| `cancel` | - | User cancelled deletion |

## Dependent Items Format

```javascript
// Array of strings showing file paths or descriptions
[
  'agents/api-specialist.md',
  'commands/tools/validate.md',
  'skills/test-runner/SKILL.md'
]
```

## Usage Example

```vue
<template>
  <DeleteConfirmationModal
    v-model:visible="showDeleteModal"
    :item-type="selectedConfig.type"
    :item-name="selectedConfig.name"
    :dependent-items="foundReferences"
    :loading="isDeleting"
    @confirm="handleDelete"
    @cancel="showDeleteModal = false"
  />
</template>

<script setup>
const showDeleteModal = ref(false)
const selectedConfig = ref(null)
const foundReferences = ref([])
const isDeleting = ref(false)

const openDeleteModal = async (config) => {
  selectedConfig.value = config
  // Fetch references before showing modal
  foundReferences.value = await api.checkReferences(config)
  showDeleteModal.value = true
}

const handleDelete = async () => {
  isDeleting.value = true
  try {
    await api.deleteConfig(selectedConfig.value)
    toast.add({ severity: 'success', summary: 'Deleted successfully' })
    showDeleteModal.value = false
    emit('deleted', selectedConfig.value)
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Delete failed', detail: error.message })
  } finally {
    isDeleting.value = false
  }
}
</script>
```

## Component Structure

```vue
<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    modal
    :closable="!loading"
    :draggable="false"
    :style="{ width: '90vw', maxWidth: '500px' }"
    :breakpoints="{ '640px': '95vw' }"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <i class="pi pi-exclamation-triangle text-2xl text-orange-500"></i>
        <span class="text-lg font-semibold">Delete {{ itemTypeLabel }}</span>
      </div>
    </template>

    <!-- Warning Message -->
    <div class="mb-4">
      <p>Are you sure you want to delete <strong>"{{ itemName }}"</strong>?</p>
      <p class="text-sm text-text-secondary mt-1">This action cannot be undone.</p>
    </div>

    <!-- Dependent Items Warning -->
    <Message
      v-if="dependentItems.length > 0"
      severity="warn"
      class="mb-4"
    >
      <template #default>
        <div>
          <p class="font-semibold mb-2">Referenced by:</p>
          <ul class="list-disc list-inside text-sm space-y-1">
            <li v-for="item in dependentItems" :key="item">{{ item }}</li>
          </ul>
        </div>
      </template>
    </Message>

    <!-- Confirmation Input -->
    <div class="mb-4">
      <label for="delete-confirm" class="block text-sm font-semibold mb-2">
        Type <code class="bg-surface-100 px-1 rounded">delete</code> to confirm:
      </label>
      <InputText
        id="delete-confirm"
        v-model="confirmText"
        :disabled="loading"
        placeholder="Type 'delete' here"
        class="w-full"
        @keydown.enter="handleEnter"
      />
    </div>

    <template #footer>
      <Button
        label="Cancel"
        severity="secondary"
        :disabled="loading"
        @click="onCancel"
      />
      <Button
        label="Delete"
        severity="danger"
        :disabled="!isConfirmValid || loading"
        :loading="loading"
        @click="onConfirm"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'

const props = defineProps({
  visible: { type: Boolean, required: true },
  itemType: { type: String, required: true },
  itemName: { type: String, required: true },
  dependentItems: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

const confirmText = ref('')

// Reset confirmation text when modal opens
watch(() => props.visible, (newVal) => {
  if (newVal) {
    confirmText.value = ''
  }
})

const itemTypeLabel = computed(() => {
  const labels = {
    agent: 'Subagent',
    command: 'Slash Command',
    skill: 'Skill',
    hook: 'Hook',
    mcp: 'MCP Server'
  }
  return labels[props.itemType] || 'Configuration'
})

const isConfirmValid = computed(() => {
  return confirmText.value.toLowerCase() === 'delete'
})

const handleEnter = () => {
  if (isConfirmValid.value && !props.loading) {
    onConfirm()
  }
}

const onConfirm = () => {
  emit('confirm')
}

const onCancel = () => {
  confirmText.value = ''
  emit('cancel')
  emit('update:visible', false)
}
</script>
```

## Styling

```css
/* Message component customization for dependent items */
:deep(.p-message) {
  @apply border-l-4;
}

/* Code styling for "delete" keyword */
code {
  @apply bg-surface-100 dark:bg-surface-700 px-1 py-0.5 rounded text-sm;
}
```

## Accessibility

- Modal traps focus when open
- Close button has `aria-label`
- Confirmation input has associated label
- Delete button is disabled until valid input
- Escape key closes modal (when not loading)
- Screen reader announces warning and dependent items

## PrimeVue Components Used

- `Dialog` - Modal container
- `Button` - Cancel and Delete actions
- `InputText` - Confirmation input
- `Message` - Warning for dependent items

## Button Placement

Per your PRD requirements:
1. **Config Cards:** Delete icon button on each card
2. **Detail Sidebar:** Delete icon button near Close button (right side)

Both locations open this same modal component.

## Implementation Notes

1. **Reset state** when modal opens (clear confirmation text)
2. **Disable interactions** while loading
3. **Case-insensitive** confirmation ("delete", "DELETE", "Delete" all valid)
4. **Focus management** - Focus confirmation input on modal open
5. **Loading state** - Show spinner on Delete button during API call
