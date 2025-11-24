<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    modal
    :closable="true"
    :style="{ width: '40vw' }"
    :draggable="false"
  >
    <template #header>
      <div class="flex items-center gap-2 text-xl font-semibold">
        <i class="pi pi-exclamation-triangle text-2xl" style="color: var(--color-warning)"></i>
        <span>File Already Exists</span>
      </div>
    </template>

    <!-- File Info Cards -->
    <div class="flex flex-col gap-4 mb-6">
      <Card
        :pt="{
          root: { class: 'file-card source-card' },
          header: { class: 'file-card-header' },
          body: { class: 'file-card-body' },
          content: { class: 'file-card-content' }
        }"
      >
        <template #header>
          <div class="card-header">
            <i class="pi pi-file-import"></i>
            <strong>Source file: {{ conflict.source.name }}</strong>
          </div>
        </template>
        <template #content>
          <div class="card-body">
            <div class="info-row">
              <span class="label">Path:</span>
              <span class="value">{{ conflict.source.path }}</span>
            </div>
            <div class="info-row">
              <span class="label">Modified:</span>
              <span class="value">{{ conflict.source.modifiedAt }}</span>
            </div>
          </div>
        </template>
      </Card>

      <Card
        :pt="{
          root: { class: 'file-card target-card' },
          header: { class: 'file-card-header' },
          body: { class: 'file-card-body' },
          content: { class: 'file-card-content' }
        }"
      >
        <template #header>
          <div class="card-header">
            <i class="pi pi-file"></i>
            <strong>Target file: {{ conflict.target.name }}</strong>
          </div>
        </template>
        <template #content>
          <div class="card-body">
            <div class="info-row">
              <span class="label">Path:</span>
              <span class="value">{{ conflict.target.path }}</span>
            </div>
            <div class="info-row">
              <span class="label">Modified:</span>
              <span class="value">{{ conflict.target.modifiedAt }}</span>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Resolution Options -->
    <div class="flex flex-col gap-4" role="radiogroup" aria-label="Conflict resolution options">
      <div
        v-for="option in options"
        :key="option.value"
        class="flex gap-3 p-4 rounded-lg cursor-pointer transition-all duration-200 border-2"
        :class="{
          'bg-hover border-primary shadow-primary-focus': selectedStrategy === option.value,
          'border-border-primary hover:bg-hover hover:border-primary': selectedStrategy !== option.value
        }"
        :style="{ borderColor: selectedStrategy === option.value ? 'var(--color-primary)' : 'var(--border-primary)' }"
      >
        <RadioButton
          :id="option.value"
          v-model="selectedStrategy"
          :value="option.value"
          :name="'conflict-strategy'"
        />
        <div class="flex-1 flex flex-col gap-2">
          <label :for="option.value" class="flex items-center gap-2 cursor-pointer font-semibold text-base">
            <i :class="option.icon" :style="option.color ? { color: option.color } : {}"></i>
            <span>{{ option.label }}</span>
          </label>
          <p
            class="m-0 text-sm leading-6"
            :class="option.value === 'overwrite' ? 'text-warning' : 'text-secondary'"
            :style="option.value === 'overwrite' ? { color: 'var(--color-warning)' } : { color: 'var(--text-secondary)' }"
          >
            {{ option.description }}
          </p>
          <p v-if="option.value === 'rename' && selectedStrategy === 'rename'" class="mt-2 mb-0 p-2 rounded flex items-center gap-2 text-sm" style="background: var(--bg-primary); border-left: 3px solid var(--color-primary)">
            <i class="pi pi-arrow-right" style="color: var(--color-primary)"></i>
            Will copy as: <strong style="color: var(--color-primary)">{{ renamedFilename }}</strong>
          </p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          label="Cancel"
          severity="secondary"
          @click="onCancel"
          icon="pi pi-times"
        />
        <Button
          label="Confirm Action"
          :severity="confirmSeverity"
          @click="onConfirm"
          icon="pi pi-check"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import RadioButton from 'primevue/radiobutton'
import Button from 'primevue/button'
import Card from 'primevue/card'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  conflict: {
    type: Object,
    required: true,
    validator: (value) => {
      return (
        value &&
        value.source &&
        value.source.name &&
        value.source.path &&
        value.target &&
        value.target.name &&
        value.target.path
      )
    }
  }
})

const emit = defineEmits(['update:visible', 'resolve'])

// Selected strategy (default to 'rename' as safest option)
const selectedStrategy = ref('rename')

// Resolution options
const options = [
  {
    value: 'skip',
    label: "Skip - Don't copy this file",
    description: 'The file will not be copied. Target file remains unchanged.',
    icon: 'pi pi-times-circle',
    color: null
  },
  {
    value: 'overwrite',
    label: 'Overwrite - Replace target file',
    description: '⚠️ Warning: This will permanently delete the target file and replace it with the source file.',
    icon: 'pi pi-exclamation-triangle',
    color: 'var(--color-warning)'
  },
  {
    value: 'rename',
    label: 'Rename - Copy with new name',
    description: 'The file will be copied with a new name to avoid conflict.',
    icon: 'pi pi-file',
    color: null
  }
]

// Compute renamed filename (basename-2.extension)
const renamedFilename = computed(() => {
  if (!props.conflict?.source?.name) return ''

  const filename = props.conflict.source.name
  const lastDotIndex = filename.lastIndexOf('.')

  if (lastDotIndex === -1) {
    // No extension
    return `${filename}-2`
  }

  const basename = filename.substring(0, lastDotIndex)
  const extension = filename.substring(lastDotIndex)
  return `${basename}-2${extension}`
})

// Confirm button severity (danger for overwrite, primary otherwise)
const confirmSeverity = computed(() => {
  return selectedStrategy.value === 'overwrite' ? 'danger' : 'primary'
})

// Cancel handler
const onCancel = () => {
  emit('update:visible', false)
  // Reset to default strategy when cancelled
  selectedStrategy.value = 'rename'
}

// Confirm handler
const onConfirm = () => {
  emit('resolve', selectedStrategy.value)
  emit('update:visible', false)
  // Reset to default strategy after confirm
  selectedStrategy.value = 'rename'
}
</script>

<style scoped>
/* ========== File Info Cards - PrimeVue Overrides ========== */
:deep(.file-card) {
  background: var(--bg-tertiary);
  border: 2px solid;
  border-radius: 8px;
}

:deep(.source-card) {
  border-color: var(--color-primary);
}

:deep(.target-card) {
  border-color: var(--color-warning);
}

/* PrimeVue Card header/body/content padding adjustments */
:deep(.file-card-header) {
  padding: 1rem 1rem 0 1rem;
}

:deep(.file-card-body) {
  padding: 0;
}

:deep(.file-card-content) {
  padding: 0 1rem 1rem 1rem;
}

/* Card header styling */
.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
}

.card-header i {
  font-size: 1.1rem;
}

:deep(.source-card) .card-header i {
  color: var(--color-primary);
}

:deep(.target-card) .card-header i {
  color: var(--color-warning);
}

/* Card body and info rows */
.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-row {
  display: flex;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.info-row .label {
  color: var(--text-secondary);
  font-weight: 600;
  min-width: 70px;
}

.info-row .value {
  color: var(--text-primary);
  word-break: break-all;
}

/* ========== Accessibility ========== */
/* Focus indicators for radio buttons */
div[role="radiogroup"] > div:focus-within {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

/* Keyboard navigation support */
:deep(.p-radiobutton:focus) {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
  border-radius: 50%;
}

/* ========== Responsive ========== */
@media (max-width: 768px) {
  :deep(.p-dialog) {
    width: 90vw !important;
  }
}
</style>
