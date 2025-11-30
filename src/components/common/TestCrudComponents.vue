<template>
  <div class="test-page">
    <div class="test-container">
      <h1>CRUD Foundation Components Test Page</h1>

      <!-- InlineEditField Tests -->
      <section class="test-section">
        <h2>InlineEditField Component</h2>

        <div class="test-box">
          <h3>Text Field</h3>
          <label class="field-label">Agent Name:</label>
          <InlineEditField
            v-model="agentName"
            field-type="text"
            label="Agent Name"
            placeholder="Enter agent name"
            :validation="nameValidation"
          />
          <div class="value-display">Current value: {{ agentName }}</div>
        </div>

        <div class="test-box">
          <h3>Textarea Field</h3>
          <label class="field-label">Description:</label>
          <InlineEditField
            v-model="description"
            field-type="textarea"
            label="Description"
            placeholder="Enter description"
          />
          <div class="value-display">Current value: {{ description }}</div>
        </div>

        <div class="test-box">
          <h3>Select Field</h3>
          <label class="field-label">Model:</label>
          <InlineEditField
            v-model="model"
            field-type="select"
            label="Model"
            :options="MODEL_OPTIONS"
            placeholder="Select a model"
          />
          <div class="value-display">Current value: {{ model }}</div>
        </div>

        <div class="test-box">
          <h3>SelectButton Field</h3>
          <label class="field-label">Status:</label>
          <InlineEditField
            v-model="enabled"
            field-type="selectbutton"
            label="Status"
            :options="ENABLED_OPTIONS"
          />
          <div class="value-display">Current value: {{ enabled }}</div>
        </div>

        <div class="test-box">
          <h3>MultiSelect Field</h3>
          <label class="field-label">Allowed Tools:</label>
          <InlineEditField
            v-model="tools"
            field-type="multiselect"
            label="Allowed Tools"
            :options="TOOL_OPTIONS"
            placeholder="Select tools"
          />
          <div class="value-display">Current value: {{ tools }}</div>
        </div>

        <div class="test-box">
          <h3>Color Palette Field</h3>
          <label class="field-label">Color:</label>
          <InlineEditField
            v-model="color"
            field-type="colorpalette"
            label="Color"
          />
          <div class="value-display">Current value: {{ color }}</div>
        </div>

        <div class="test-box">
          <h3>Number Field</h3>
          <label class="field-label">Timeout (seconds):</label>
          <InlineEditField
            v-model="timeout"
            field-type="number"
            label="Timeout"
            :min="1"
            :max="3600"
          />
          <div class="value-display">Current value: {{ timeout }}</div>
        </div>
      </section>

      <!-- ColorPaletteDropdown Test -->
      <section class="test-section">
        <h2>ColorPaletteDropdown Component</h2>
        <div class="test-box">
          <h3>Standalone Color Selector</h3>
          <ColorPaletteDropdown v-model="standaloneColor" />
          <div class="value-display">Selected color: {{ standaloneColor || 'None' }}</div>
        </div>
      </section>

      <!-- DeleteConfirmationModal Test -->
      <section class="test-section">
        <h2>DeleteConfirmationModal Component</h2>

        <div class="test-box">
          <h3>Delete Agent (No Dependencies)</h3>
          <Button
            label="Delete Agent"
            severity="danger"
            icon="pi pi-trash"
            @click="openDeleteModal('agent', 'api-specialist', [])"
          />
        </div>

        <div class="test-box">
          <h3>Delete Command (With Dependencies)</h3>
          <Button
            label="Delete Command"
            severity="danger"
            icon="pi pi-trash"
            @click="openDeleteModal('command', 'validate-code', dependentItems)"
          />
        </div>

        <div class="test-box">
          <h3>Delete Skill</h3>
          <Button
            label="Delete Skill"
            severity="danger"
            icon="pi pi-trash"
            @click="openDeleteModal('skill', 'test-runner', [])"
          />
        </div>
      </section>

      <!-- Action Log -->
      <section v-if="actionLog.length > 0" class="test-section">
        <h2>Action Log</h2>
        <div class="test-box">
          <ul>
            <li v-for="(log, index) in actionLog" :key="index">{{ log }}</li>
          </ul>
        </div>
      </section>
    </div>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmationModal
      v-model:visible="showDeleteModal"
      :item-type="deleteModalType"
      :item-name="deleteModalName"
      :dependent-items="deleteModalDependents"
      :loading="deleteLoading"
      @confirm="handleDelete"
      @cancel="handleDeleteCancel"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Button from 'primevue/button'
import InlineEditField from '@/components/forms/InlineEditField.vue'
import ColorPaletteDropdown from '@/components/forms/ColorPaletteDropdown.vue'
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal.vue'
import {
  MODEL_OPTIONS,
  ENABLED_OPTIONS,
  TOOL_OPTIONS
} from '@/constants/form-options'

// InlineEditField test data
const agentName = ref('api-specialist')
const description = ref('An agent specialized in API integration and testing.')
const model = ref('sonnet')
const enabled = ref(true)
const tools = ref(['Read', 'Write', 'Bash'])
const color = ref('blue')
const timeout = ref(60)

// Validation rules for agent name
const nameValidation = [
  { type: 'required' },
  { type: 'agentName', message: 'Must be lowercase letters, numbers, hyphens, or underscores (max 64 chars)' }
]

// ColorPaletteDropdown test data
const standaloneColor = ref('purple')

// DeleteConfirmationModal test data
const showDeleteModal = ref(false)
const deleteModalType = ref('agent')
const deleteModalName = ref('')
const deleteModalDependents = ref([])
const deleteLoading = ref(false)

const dependentItems = [
  'agents/api-specialist.md',
  'commands/tools/validate.md',
  'skills/test-runner/SKILL.md'
]

// Action log
const actionLog = ref([])

/**
 * Open delete confirmation modal
 */
function openDeleteModal(type, name, dependents) {
  deleteModalType.value = type
  deleteModalName.value = name
  deleteModalDependents.value = dependents
  showDeleteModal.value = true

  const timestamp = new Date().toLocaleTimeString()
  actionLog.value.push(`Opened delete modal for ${type}: ${name} at ${timestamp}`)
}

/**
 * Handle delete confirmation
 */
function handleDelete() {
  const timestamp = new Date().toLocaleTimeString()
  actionLog.value.push(`Delete confirmed for ${deleteModalType.value}: ${deleteModalName.value} at ${timestamp}`)

  // Simulate API call
  deleteLoading.value = true
  setTimeout(() => {
    deleteLoading.value = false
    showDeleteModal.value = false
    actionLog.value.push(`Delete completed at ${new Date().toLocaleTimeString()}`)
  }, 1500)
}

/**
 * Handle delete cancellation
 */
function handleDeleteCancel() {
  const timestamp = new Date().toLocaleTimeString()
  actionLog.value.push(`Delete cancelled at ${timestamp}`)
}
</script>

<style scoped>
.test-page {
  min-height: 100vh;
  background: var(--p-surface-50);
  padding: 2rem;
}

:global(.dark) .test-page {
  background: var(--p-surface-950);
}

.test-container {
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: var(--p-surface-900);
  margin-bottom: 2rem;
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
}

:global(.dark) h1 {
  color: var(--p-surface-50);
}

.test-section {
  margin-bottom: 3rem;
}

.test-section h2 {
  color: var(--p-surface-900);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--p-surface-300);
  font-size: 1.5rem;
  font-weight: 600;
}

:global(.dark) .test-section h2 {
  color: var(--p-surface-50);
  border-bottom-color: var(--p-surface-700);
}

.test-box {
  background: var(--p-surface-0);
  border: 1px solid var(--p-surface-300);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

:global(.dark) .test-box {
  background: var(--p-surface-900);
  border-color: var(--p-surface-700);
}

.test-box h3 {
  color: var(--p-surface-900);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--p-surface-200);
}

:global(.dark) .test-box h3 {
  color: var(--p-surface-50);
  border-bottom-color: var(--p-surface-800);
}

.field-label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--p-surface-700);
}

:global(.dark) .field-label {
  color: var(--p-surface-200);
}

.value-display {
  margin-top: 0.75rem;
  padding: 0.5rem;
  background: var(--p-surface-100);
  border-left: 3px solid var(--p-primary-500);
  font-size: 0.9rem;
  color: var(--p-surface-600);
  font-family: monospace;
}

:global(.dark) .value-display {
  background: var(--p-surface-800);
  color: var(--p-surface-300);
}

.test-box ul {
  margin: 0;
  padding-left: 1.5rem;
  color: var(--p-surface-700);
}

:global(.dark) .test-box ul {
  color: var(--p-surface-200);
}

.test-box li {
  margin: 0.5rem 0;
}
</style>
