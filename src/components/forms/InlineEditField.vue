<template>
  <div class="inline-edit-field">
    <!-- Display Mode -->
    <div v-if="!isEditing" class="display-mode group">
      <span class="value">{{ displayValue }}</span>
      <Button
        icon="pi pi-pencil"
        text
        rounded
        size="small"
        :disabled="disabled"
        :aria-label="`Edit ${label}`"
        class="edit-btn"
        @click="startEdit"
      />
    </div>

    <!-- Edit Mode -->
    <div v-else class="edit-mode">
      <div class="field-container">
        <!-- Text Input -->
        <InputText
          v-if="fieldType === 'text'"
          ref="fieldRef"
          v-model="editValue"
          :fluid="true"
          :invalid="!!validationError"
          :placeholder="placeholder"
          :disabled="loading"
          @keydown.enter="handleEnter"
          @keydown.escape="cancel"
        />

        <!-- Textarea -->
        <Textarea
          v-else-if="fieldType === 'textarea'"
          ref="fieldRef"
          v-model="editValue"
          :auto-resize="true"
          :fluid="true"
          :rows="3"
          :placeholder="placeholder"
          :disabled="loading"
          @keydown.escape="cancel"
        />

        <!-- Select Dropdown -->
        <Select
          v-else-if="fieldType === 'select'"
          ref="fieldRef"
          v-model="editValue"
          :options="options"
          option-label="label"
          option-value="value"
          :filter="options.length > 5"
          :show-clear="!required"
          :fluid="true"
          :placeholder="placeholder"
          :disabled="loading"
        />

        <!-- SelectButton -->
        <SelectButton
          v-else-if="fieldType === 'selectbutton'"
          ref="fieldRef"
          v-model="editValue"
          :options="options"
          option-label="label"
          option-value="value"
          :allow-empty="!required"
          :disabled="loading"
        />

        <!-- MultiSelect -->
        <MultiSelect
          v-else-if="fieldType === 'multiselect'"
          ref="fieldRef"
          v-model="editValue"
          :options="options"
          option-label="label"
          option-value="value"
          display="chip"
          :show-toggle-all="true"
          :max-selected-labels="3"
          :filter="options.length > 10"
          :fluid="true"
          :placeholder="placeholder"
          :disabled="loading"
        />

        <!-- Color Palette -->
        <ColorPaletteDropdown
          v-else-if="fieldType === 'colorpalette'"
          ref="fieldRef"
          v-model="editValue"
          :disabled="loading"
        />

        <!-- Number Input -->
        <InputNumber
          v-else-if="fieldType === 'number'"
          ref="fieldRef"
          v-model="editValue"
          :show-buttons="true"
          :fluid="true"
          :min="min"
          :max="max"
          :disabled="loading"
          @keydown.enter="handleEnter"
          @keydown.escape="cancel"
        />
      </div>

      <!-- Action Buttons -->
      <div class="actions">
        <Button
          icon="pi pi-check"
          severity="success"
          text
          rounded
          size="small"
          :disabled="loading"
          :loading="loading"
          aria-label="Accept changes"
          @click="accept"
        />
        <Button
          icon="pi pi-times"
          severity="danger"
          text
          rounded
          size="small"
          :disabled="loading"
          aria-label="Cancel editing"
          @click="cancel"
        />
      </div>
    </div>

    <!-- Validation Error -->
    <Message
      v-if="validationError"
      severity="error"
      :closable="false"
      class="mt-2"
    >
      {{ validationError }}
    </Message>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import MultiSelect from 'primevue/multiselect'
import InputNumber from 'primevue/inputnumber'
import Message from 'primevue/message'
import ColorPaletteDropdown from './ColorPaletteDropdown.vue'
import { useFormValidation } from '@/composables/useFormValidation'

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean, Array, Object],
    default: null
  },
  fieldType: {
    type: String,
    required: true,
    validator: (value) => [
      'text',
      'textarea',
      'select',
      'selectbutton',
      'multiselect',
      'colorpalette',
      'number'
    ].includes(value)
  },
  label: {
    type: String,
    default: ''
  },
  options: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  validation: {
    type: Array,
    default: () => []
  },
  min: {
    type: Number,
    default: undefined
  },
  max: {
    type: Number,
    default: undefined
  }
})

const emit = defineEmits([
  'update:modelValue',
  'edit-start',
  'edit-cancel',
  'edit-accept'
])

const { validate } = useFormValidation()

// Component state
const isEditing = ref(false)
const editValue = ref(null)
const validationError = ref(null)
const loading = ref(false)
const fieldRef = ref(null)

// Computed display value
const displayValue = computed(() => {
  const value = props.modelValue

  // Handle null/undefined
  if (value === null || value === undefined) {
    return 'Not set'
  }

  // Handle boolean
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  // Handle array (multiselect)
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'None selected'
  }

  // Handle object (should be converted to string representation)
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  // Handle string/number
  return String(value)
})

/**
 * Start editing mode
 */
function startEdit() {
  if (props.disabled) return

  // Deep clone the original value
  editValue.value = Array.isArray(props.modelValue)
    ? [...props.modelValue]
    : props.modelValue

  isEditing.value = true
  validationError.value = null
  emit('edit-start')

  // Focus the field after Vue updates DOM
  nextTick(() => {
    if (fieldRef.value) {
      // Handle different component types
      const inputEl = fieldRef.value.$el?.querySelector('input, textarea') || fieldRef.value.$el
      if (inputEl && inputEl.focus) {
        inputEl.focus()
      }
    }
  })
}

/**
 * Accept changes
 */
function accept() {
  // Run validation if provided
  if (props.validation && props.validation.length > 0) {
    const result = validate(editValue.value, props.validation)
    if (!result.valid) {
      validationError.value = result.error
      return
    }
  }

  // Check required field
  if (props.required && !editValue.value) {
    validationError.value = 'This field is required'
    return
  }

  loading.value = true
  validationError.value = null

  // Emit the new value
  emit('update:modelValue', editValue.value)
  emit('edit-accept', editValue.value)

  // Exit edit mode after a short delay (simulating save)
  setTimeout(() => {
    loading.value = false
    isEditing.value = false
  }, 100)
}

/**
 * Cancel editing
 */
function cancel() {
  if (loading.value) return

  editValue.value = props.modelValue
  validationError.value = null
  isEditing.value = false
  emit('edit-cancel')
}

/**
 * Handle Enter key (for single-line fields)
 */
function handleEnter(event) {
  // Only accept on Enter for single-line fields
  if (['text', 'number'].includes(props.fieldType)) {
    event.preventDefault()
    accept()
  }
}

// Watch for external value changes while editing
watch(() => props.modelValue, (newValue) => {
  if (!isEditing.value) {
    editValue.value = newValue
  }
})
</script>

<style scoped>
.inline-edit-field {
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
}

.display-mode {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.display-mode .value {
  flex: 1;
  color: var(--p-surface-700);
}

:global(.dark) .display-mode .value {
  color: var(--p-surface-200);
}

.display-mode .edit-btn {
  opacity: 0;
  transition: opacity 0.2s;
}

.display-mode:hover .edit-btn,
.display-mode:focus-within .edit-btn {
  opacity: 1;
}

.edit-mode {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.edit-mode .field-container {
  flex: 1;
}

.edit-mode .actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}
</style>
