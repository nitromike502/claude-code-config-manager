<template>
  <div class="key-value-editor">
    <!-- Existing pairs -->
    <div v-for="(value, key, index) in localPairs" :key="index" class="pair-row flex gap-2 mb-2 items-center">
      <InputText
        v-model="pairKeys[index]"
        :placeholder="keyPlaceholder"
        :disabled="disabled"
        class="flex-1 font-mono text-sm"
        @blur="handleKeyChange(index, $event.target.value)"
      />
      <InputText
        v-model="pairValues[index]"
        :placeholder="valuePlaceholder"
        :disabled="disabled"
        class="flex-1 font-mono text-sm"
        @blur="handleValueChange(index, $event.target.value)"
      />
      <Button
        v-if="!disabled"
        icon="pi pi-trash"
        severity="danger"
        text
        rounded
        size="small"
        :aria-label="`Remove ${pairKeys[index] || 'pair'}`"
        @click="removePair(index)"
      />
    </div>

    <!-- Empty state -->
    <div v-if="Object.keys(localPairs).length === 0" class="text-text-tertiary text-sm italic mb-2">
      No entries. Click "Add" to create one.
    </div>

    <!-- Add button -->
    <Button
      v-if="!disabled"
      label="Add"
      icon="pi pi-plus"
      severity="secondary"
      size="small"
      outlined
      @click="addPair"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  disabled: {
    type: Boolean,
    default: false
  },
  keyPlaceholder: {
    type: String,
    default: 'Key'
  },
  valuePlaceholder: {
    type: String,
    default: 'Value'
  }
})

const emit = defineEmits(['update:modelValue'])

// Local copy of the object
const localPairs = ref({ ...props.modelValue })

// Arrays to track keys and values for editing (needed because object keys can change)
const pairKeys = ref([])
const pairValues = ref([])

// Sync arrays with object
function syncArrays() {
  const entries = Object.entries(localPairs.value)
  pairKeys.value = entries.map(([k]) => k)
  pairValues.value = entries.map(([, v]) => v)
}

// Initialize arrays
syncArrays()

// Watch for external changes
watch(() => props.modelValue, (newVal) => {
  if (JSON.stringify(newVal) !== JSON.stringify(localPairs.value)) {
    localPairs.value = { ...(newVal || {}) }
    syncArrays()
  }
}, { deep: true })

function handleKeyChange(index, newKey) {
  const oldKey = pairKeys.value[index]
  const value = pairValues.value[index]

  // Skip if key didn't actually change
  if (newKey === oldKey) return

  // Skip if new key is empty (will be handled on blur/save)
  if (!newKey.trim()) return

  // Build new object
  const newPairs = {}
  Object.entries(localPairs.value).forEach(([k, v], i) => {
    if (i === index) {
      // Use new key
      newPairs[newKey.trim()] = value
    } else {
      newPairs[k] = v
    }
  })

  localPairs.value = newPairs
  pairKeys.value[index] = newKey.trim()
  emitUpdate()
}

function handleValueChange(index, newValue) {
  const key = pairKeys.value[index]
  if (key) {
    localPairs.value[key] = newValue
    pairValues.value[index] = newValue
    emitUpdate()
  }
}

function addPair() {
  // Generate unique placeholder key
  let newKey = 'NEW_KEY'
  let counter = 1
  while (localPairs.value[newKey]) {
    newKey = `NEW_KEY_${counter}`
    counter++
  }

  localPairs.value[newKey] = ''
  pairKeys.value.push(newKey)
  pairValues.value.push('')
  emitUpdate()
}

function removePair(index) {
  const key = pairKeys.value[index]
  delete localPairs.value[key]
  pairKeys.value.splice(index, 1)
  pairValues.value.splice(index, 1)
  emitUpdate()
}

function emitUpdate() {
  // Clean up: remove entries with empty keys
  const cleaned = {}
  Object.entries(localPairs.value).forEach(([k, v]) => {
    if (k && k.trim()) {
      cleaned[k.trim()] = v
    }
  })
  emit('update:modelValue', cleaned)
}
</script>

<style scoped>
.key-value-editor {
  /* Container styles */
}

.pair-row {
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.key-value-editor :deep(.p-inputtext) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style>
