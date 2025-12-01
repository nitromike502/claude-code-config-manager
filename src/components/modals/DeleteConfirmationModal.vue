<template>
  <Dialog
    :visible="visible"
    modal
    :closable="!loading"
    :draggable="false"
    :style="{ width: '90vw', maxWidth: '500px' }"
    :breakpoints="{ '640px': '95vw' }"
    @update:visible="$emit('update:visible', $event)"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <i class="pi pi-exclamation-triangle text-2xl text-orange-500" aria-hidden="true"></i>
        <span class="text-lg font-semibold">Delete {{ itemTypeLabel }}</span>
      </div>
    </template>

    <!-- Warning Message -->
    <div class="mb-4">
      <p class="text-surface-700 dark:text-surface-200">
        Are you sure you want to delete <strong>"{{ itemName }}"</strong>?
      </p>
      <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">
        This action cannot be undone.
      </p>
    </div>

    <!-- Dependent Items Warning -->
    <Message
      v-if="dependentItems.length > 0"
      severity="warn"
      :closable="false"
      class="mb-4"
    >
      <div>
        <p class="font-semibold mb-2">Referenced by:</p>
        <ul class="list-disc list-inside text-sm space-y-1">
          <li v-for="(item, index) in dependentItems" :key="index">{{ formatReference(item) }}</li>
        </ul>
      </div>
    </Message>

    <!-- Confirmation Input -->
    <div class="mb-4">
      <label for="delete-confirm" class="block text-sm font-semibold mb-2 text-surface-700 dark:text-surface-200">
        Type <em>delete</em> to confirm:
      </label>
      <InputText
        id="delete-confirm"
        ref="confirmInput"
        v-model="confirmText"
        :disabled="loading"
        :invalid="attemptedConfirm && !isConfirmValid"
        placeholder="Type 'delete' here"
        :fluid="true"
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
import { ref, computed, watch, nextTick } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  itemType: {
    type: String,
    required: true,
    validator: (value) => ['agent', 'command', 'skill', 'hook', 'mcp'].includes(value)
  },
  itemName: {
    type: String,
    required: true
  },
  dependentItems: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

const confirmText = ref('')
const attemptedConfirm = ref(false)
const confirmInput = ref(null)

// Reset confirmation text and state when modal opens
watch(() => props.visible, (newVal) => {
  if (newVal) {
    confirmText.value = ''
    attemptedConfirm.value = false

    // Focus the confirmation input after dialog renders
    nextTick(() => {
      if (confirmInput.value) {
        const inputEl = confirmInput.value.$el?.querySelector('input') || confirmInput.value.$el
        if (inputEl && inputEl.focus) {
          inputEl.focus()
        }
      }
    })
  }
})

// Map item type to user-friendly label
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

// Check if confirmation text is valid (case-insensitive)
const isConfirmValid = computed(() => {
  return confirmText.value.toLowerCase() === 'delete'
})

/**
 * Format a reference item for display
 * Handles both string items and object items from the referenceChecker service
 * @param {string|Object} item - Reference item (string or {type, name, location, lines})
 * @returns {string} Formatted display string
 */
function formatReference(item) {
  // If it's already a string, return as-is
  if (typeof item === 'string') {
    return item
  }

  // If it's an object with type/name/lines structure
  if (item && typeof item === 'object') {
    const typeName = item.type || 'file'
    const name = item.name || 'unknown'
    const lines = Array.isArray(item.lines) && item.lines.length > 0
      ? ` (line${item.lines.length > 1 ? 's' : ''} ${item.lines.join(', ')})`
      : ''

    return `${typeName}: ${name}${lines}`
  }

  // Fallback: convert to string
  return String(item)
}

/**
 * Handle Enter key in confirmation input
 */
function handleEnter() {
  if (isConfirmValid.value && !props.loading) {
    onConfirm()
  } else {
    attemptedConfirm.value = true
  }
}

/**
 * Confirm deletion
 */
function onConfirm() {
  if (!isConfirmValid.value || props.loading) {
    attemptedConfirm.value = true
    return
  }

  emit('confirm')
}

/**
 * Cancel deletion
 */
function onCancel() {
  confirmText.value = ''
  attemptedConfirm.value = false
  emit('cancel')
  emit('update:visible', false)
}
</script>

<style scoped>
/* Message component customization */
:deep(.p-message) {
  border-left: 4px solid;
}
</style>
