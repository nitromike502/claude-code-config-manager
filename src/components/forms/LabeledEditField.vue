<template>
  <div class="labeled-edit-field my-2 text-sm text-text-secondary leading-relaxed">
    <!-- Inline layout for simple fields (text, select, number, color) -->
    <div v-if="!isBlockField" class="flex items-start gap-2">
      <div class="text-text-primary font-bold shrink-0 mt-2 mr-1">{{ label }}:</div>
      <InlineEditField
        :model-value="modelValue"
        :field-type="fieldType"
        :label="label"
        :placeholder="placeholder"
        :disabled="disabled"
        :options="options"
        :validation="validation"
        :min="min"
        :max="max"
        @update:model-value="$emit('update:modelValue', $event)"
        @edit-start="$emit('edit-start')"
        @edit-cancel="$emit('edit-cancel')"
        @edit-accept="$emit('edit-accept', $event)"
      />
    </div>

    <!-- Block layout for large content (textarea, multiselect) -->
    <div v-else>
      <!-- Header with label and edit button -->
      <div class="flex items-center gap-2 mb-2">
        <div class="text-text-primary font-bold">{{ label }}:</div>
        <Button
          v-if="!isEditing && !disabled"
          icon="pi pi-pencil"
          text
          rounded
          size="small"
          :aria-label="`Edit ${label}`"
          class="edit-btn"
          @click="startEdit"
        />
      </div>

      <!-- Display mode: show content -->
      <div v-if="!isEditing" class="content-display">
        <pre v-if="fieldType === 'textarea'" class="bg-bg-primary p-3 rounded border border-border-primary font-mono text-xs whitespace-pre-wrap break-words overflow-x-auto max-h-[300px] overflow-y-auto text-text-primary">{{ displayValue }}</pre>
        <div v-else-if="fieldType === 'multiselect'" class="flex flex-wrap gap-1">
          <span
            v-for="(item, index) in displayArray"
            :key="index"
            class="inline-block bg-bg-tertiary px-2 py-1 rounded text-xs"
          >{{ item }}</span>
          <span v-if="!displayArray.length" class="text-text-muted">None selected</span>
        </div>
      </div>

      <!-- Edit mode: show input with save/cancel -->
      <div v-else class="edit-container">
        <Textarea
          v-if="fieldType === 'textarea'"
          ref="fieldRef"
          v-model="editValue"
          :auto-resize="true"
          :fluid="true"
          :rows="6"
          :placeholder="placeholder"
          :disabled="loading"
          class="w-full"
          @keydown.escape="cancel"
        />
        <MultiSelect
          v-else-if="fieldType === 'multiselect'"
          ref="fieldRef"
          v-model="editValue"
          :options="options"
          option-label="label"
          option-value="value"
          display="chip"
          :show-toggle-all="true"
          :max-selected-labels="5"
          :filter="options.length > 10"
          :fluid="true"
          :placeholder="placeholder"
          :disabled="loading"
        />

        <!-- Validation Error -->
        <Message
          v-if="validationError"
          severity="error"
          :closable="false"
          class="mt-2"
        >
          {{ validationError }}
        </Message>

        <!-- Action buttons -->
        <div class="flex gap-2 mt-2">
          <Button
            label="Save"
            icon="pi pi-check"
            severity="success"
            size="small"
            :disabled="loading"
            :loading="loading"
            @click="accept"
          />
          <Button
            label="Cancel"
            icon="pi pi-times"
            severity="secondary"
            size="small"
            outlined
            :disabled="loading"
            @click="cancel"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * LabeledEditField Component
 *
 * A wrapper around InlineEditField that includes the label as part of the component.
 * Provides two layout modes based on field type:
 * - Inline layout: Label and field appear side-by-side (text, select, number, colorpalette, selectbutton)
 * - Block layout: Label with edit button on top, content below (textarea, multiselect)
 *
 * @component
 * @example
 * <!-- Inline layout (text field) -->
 * <LabeledEditField
 *   v-model="agent.name"
 *   field-type="text"
 *   label="Agent Name"
 *   placeholder="Enter name"
 * />
 *
 * @example
 * <!-- Block layout (textarea) -->
 * <LabeledEditField
 *   v-model="agent.description"
 *   field-type="textarea"
 *   label="Description"
 *   :validation="[{ rule: 'minLength', value: 10 }]"
 * />
 *
 * @example
 * <!-- SelectButton with options -->
 * <LabeledEditField
 *   v-model="hook.enabled"
 *   field-type="selectbutton"
 *   label="Status"
 *   :options="[
 *     { label: 'Enabled', value: true },
 *     { label: 'Disabled', value: false }
 *   ]"
 * />
 */
import { ref, computed, nextTick } from 'vue'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import MultiSelect from 'primevue/multiselect'
import Message from 'primevue/message'
import InlineEditField from './InlineEditField.vue'
import { useFormValidation } from '@/composables/useFormValidation'

const props = defineProps({
  /** The field value (v-model) */
  modelValue: {
    type: [String, Number, Boolean, Array, Object],
    default: null
  },
  /**
   * Type of edit field
   * @values 'text', 'textarea', 'select', 'selectbutton', 'multiselect', 'colorpalette', 'number'
   */
  fieldType: {
    type: String,
    required: true
  },
  /** Label text displayed with the field */
  label: {
    type: String,
    required: true
  },
  /** Options array for select/multiselect/selectbutton fields */
  options: {
    type: Array,
    default: () => []
  },
  /** Placeholder text for the input field */
  placeholder: {
    type: String,
    default: ''
  },
  /** Disable editing */
  disabled: {
    type: Boolean,
    default: false
  },
  /** Array of validation rules from useFormValidation composable */
  validation: {
    type: Array,
    default: () => []
  },
  /** Minimum value for number fields */
  min: {
    type: Number,
    default: undefined
  },
  /** Maximum value for number fields */
  max: {
    type: Number,
    default: undefined
  }
})

const emit = defineEmits([
  /** Emitted when the value changes (v-model update) */
  'update:modelValue',
  /** Emitted when editing starts */
  'edit-start',
  /** Emitted when editing is cancelled */
  'edit-cancel',
  /** Emitted when the new value is accepted */
  'edit-accept'
])

const { validate } = useFormValidation()

/**
 * Determines if this field should use block layout (label above, content below)
 * Block fields: textarea
 * Inline fields: text, select, number, colorpalette, selectbutton, multiselect
 * Note: multiselect uses inline layout for better visual consistency with other controls
 */
const isBlockField = computed(() => {
  return ['textarea'].includes(props.fieldType)
})

// State for block field editing
const isEditing = ref(false)
const editValue = ref(null)
const validationError = ref(null)
const loading = ref(false)
const fieldRef = ref(null)

/**
 * Formatted display value for textarea fields in display mode
 * Shows "Not set" if value is null/undefined, otherwise converts to string
 */
const displayValue = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) {
    return 'Not set'
  }
  return String(props.modelValue)
})

/**
 * Array value for multiselect fields in display mode
 * Returns empty array if value is not an array
 */
const displayArray = computed(() => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue
  }
  return []
})

/**
 * Start editing mode for block fields (textarea, multiselect)
 * Deep clones the value, focuses the input field, and emits edit-start event
 */
function startEdit() {
  if (props.disabled) return

  editValue.value = Array.isArray(props.modelValue)
    ? [...props.modelValue]
    : props.modelValue

  isEditing.value = true
  validationError.value = null
  emit('edit-start')

  nextTick(() => {
    if (fieldRef.value) {
      const inputEl = fieldRef.value.$el?.querySelector('input, textarea') || fieldRef.value.$el
      if (inputEl && inputEl.focus) {
        inputEl.focus()
      }
    }
  })
}

/**
 * Accept the edited value
 * Runs validation if provided, emits update events, and exits edit mode
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

  loading.value = true
  validationError.value = null

  emit('update:modelValue', editValue.value)
  emit('edit-accept', editValue.value)

  setTimeout(() => {
    loading.value = false
    isEditing.value = false
  }, 100)
}

/**
 * Cancel editing and revert to original value
 * Clears validation errors and emits edit-cancel event
 */
function cancel() {
  if (loading.value) return

  editValue.value = props.modelValue
  validationError.value = null
  isEditing.value = false
  emit('edit-cancel')
}
</script>

<style scoped>
.edit-btn {
  opacity: 0;
  transition: opacity 0.2s;
}

.labeled-edit-field:hover .edit-btn {
  opacity: 1;
}

.content-display pre {
  margin: 0;
}
</style>
