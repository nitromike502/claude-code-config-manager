<template>
  <div class="labeled-edit-field my-2 text-sm text-text-secondary leading-relaxed">
    <!-- Inline layout for simple fields (text, select, number, color) -->
    <div v-if="!isBlockField" class="flex items-start gap-2">
      <div class="text-text-primary font-bold shrink-0 mt-2 mr-1">{{ label }}:</div>
      <InlineEditField
        v-model="modelValue"
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
import { ref, computed, nextTick } from 'vue'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import MultiSelect from 'primevue/multiselect'
import Message from 'primevue/message'
import InlineEditField from './InlineEditField.vue'
import { useFormValidation } from '@/composables/useFormValidation'

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean, Array, Object],
    default: null
  },
  fieldType: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
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

// Determine if this is a "block" field type (large content)
const isBlockField = computed(() => {
  return ['textarea', 'multiselect'].includes(props.fieldType)
})

// State for block field editing
const isEditing = ref(false)
const editValue = ref(null)
const validationError = ref(null)
const loading = ref(false)
const fieldRef = ref(null)

// Display value for textarea
const displayValue = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) {
    return 'Not set'
  }
  return String(props.modelValue)
})

// Display array for multiselect
const displayArray = computed(() => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue
  }
  return []
})

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
