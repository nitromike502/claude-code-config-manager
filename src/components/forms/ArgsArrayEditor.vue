<template>
  <div class="args-array-editor">
    <Chips
      v-model="localArgs"
      :disabled="disabled"
      :placeholder="placeholder"
      separator=","
      class="w-full"
      @update:model-value="handleUpdate"
    />
    <small class="text-text-tertiary text-xs mt-1 block">
      Press Enter to add argument. Order is preserved.
    </small>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import Chips from 'primevue/chips'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  disabled: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: 'Add argument...'
  }
})

const emit = defineEmits(['update:modelValue'])

// Local copy to avoid direct prop mutation
const localArgs = ref([...props.modelValue])

// Watch for external changes to modelValue
watch(() => props.modelValue, (newVal) => {
  // Only update if the arrays are actually different
  if (JSON.stringify(newVal) !== JSON.stringify(localArgs.value)) {
    localArgs.value = [...(newVal || [])]
  }
}, { deep: true })

function handleUpdate(newValue) {
  // Ensure we're emitting a proper array
  const sanitized = (newValue || []).map(arg => String(arg).trim()).filter(Boolean)
  emit('update:modelValue', sanitized)
}
</script>

<style scoped>
.args-array-editor {
  /* Container styles */
}

.args-array-editor :deep(.p-chips) {
  width: 100%;
}

.args-array-editor :deep(.p-chips-multiple-container) {
  width: 100%;
  padding: 0.5rem;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.args-array-editor :deep(.p-chips-token) {
  background: var(--p-primary-100);
  color: var(--p-primary-700);
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-family: monospace;
  font-size: 0.875rem;
}

.args-array-editor :deep(.p-chips-input-token input) {
  font-family: monospace;
}

/* Dark mode adjustments */
:root[data-theme='dark'] .args-array-editor :deep(.p-chips-token) {
  background: var(--p-primary-900);
  color: var(--p-primary-100);
}
</style>
