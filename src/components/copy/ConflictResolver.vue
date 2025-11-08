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
      <div class="dialog-header">
        <i class="pi pi-exclamation-triangle warning-icon"></i>
        <span>File Already Exists</span>
      </div>
    </template>

    <!-- File Info Cards -->
    <div class="file-info-cards">
      <div class="file-card source-card">
        <div class="card-header">
          <i class="pi pi-file-import"></i>
          <strong>Source file: {{ conflict.source.name }}</strong>
        </div>
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
      </div>

      <div class="file-card target-card">
        <div class="card-header">
          <i class="pi pi-file"></i>
          <strong>Target file: {{ conflict.target.name }}</strong>
        </div>
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
      </div>
    </div>

    <!-- Resolution Options -->
    <div class="resolution-options" role="radiogroup" aria-label="Conflict resolution options">
      <div
        v-for="option in options"
        :key="option.value"
        class="option"
        :class="{ selected: selectedStrategy === option.value }"
      >
        <RadioButton
          :id="option.value"
          v-model="selectedStrategy"
          :value="option.value"
          :name="'conflict-strategy'"
        />
        <div class="option-content">
          <label :for="option.value">
            <i :class="option.icon" :style="option.color ? { color: option.color } : {}"></i>
            <span class="option-label">{{ option.label }}</span>
          </label>
          <p class="option-description" :class="{ warning: option.value === 'overwrite' }">
            {{ option.description }}
          </p>
          <p v-if="option.value === 'rename' && selectedStrategy === 'rename'" class="rename-preview">
            <i class="pi pi-arrow-right"></i>
            Will copy as: <strong>{{ renamedFilename }}</strong>
          </p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
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
/* ========== Dialog Header ========== */
.dialog-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.warning-icon {
  color: var(--color-warning);
  font-size: 1.5rem;
}

/* ========== File Info Cards ========== */
.file-info-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.file-card {
  background: var(--bg-tertiary);
  border: 2px solid;
  border-radius: 8px;
  padding: 1rem;
}

.source-card {
  border-color: var(--color-primary);
}

.target-card {
  border-color: var(--color-warning);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 1rem;
}

.card-header i {
  font-size: 1.1rem;
}

.source-card .card-header i {
  color: var(--color-primary);
}

.target-card .card-header i {
  color: var(--color-warning);
}

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

/* ========== Resolution Options ========== */
.resolution-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid var(--border-primary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option:hover {
  background: var(--bg-hover);
  border-color: var(--color-primary);
}

.option.selected {
  background: var(--bg-hover);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(0, 122, 217, 0.1);
}

.option-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-content label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-primary);
}

.option-content label i {
  font-size: 1.1rem;
}

.option-label {
  font-weight: 600;
}

.option-description {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.option-description.warning {
  color: var(--color-warning);
  font-weight: 500;
}

.rename-preview {
  margin: 0.5rem 0 0 0;
  padding: 0.5rem;
  background: var(--bg-primary);
  border-left: 3px solid var(--color-primary);
  font-size: 0.9rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 4px;
}

.rename-preview i {
  color: var(--color-primary);
}

.rename-preview strong {
  color: var(--color-primary);
  font-weight: 600;
}

/* ========== Dialog Footer ========== */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* ========== Accessibility ========== */
/* Focus indicators for radio buttons */
.option:focus-within {
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

  .file-info-cards {
    gap: 0.75rem;
  }

  .file-card {
    padding: 0.75rem;
  }

  .option {
    padding: 0.75rem;
  }

  .option-content label {
    font-size: 0.95rem;
  }

  .option-description {
    font-size: 0.85rem;
  }
}
</style>
