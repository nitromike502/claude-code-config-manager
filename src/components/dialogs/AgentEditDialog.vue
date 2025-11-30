<template>
  <Dialog
    :visible="visible"
    modal
    :closable="!loading"
    :draggable="false"
    :style="{ width: '90vw', maxWidth: '700px' }"
    :breakpoints="{ '640px': '95vw' }"
    @update:visible="$emit('update:visible', $event)"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <i class="pi pi-pencil text-2xl text-blue-500" aria-hidden="true"></i>
        <span class="text-lg font-semibold">Edit Agent: {{ agent?.name }}</span>
      </div>
    </template>

    <!-- Form Fields -->
    <div class="space-y-4">
      <!-- Name -->
      <div class="field">
        <label for="agent-name" class="block text-sm font-semibold mb-2 text-surface-700 dark:text-surface-200">
          Name <span class="text-red-500">*</span>
        </label>
        <InputText
          id="agent-name"
          v-model="formData.name"
          :disabled="loading"
          :invalid="!!errors.name"
          :fluid="true"
          placeholder="agent-name"
        />
        <small v-if="errors.name" class="text-red-500 text-xs mt-1 block">{{ errors.name }}</small>
        <small class="text-surface-500 dark:text-surface-400 text-xs mt-1 block">
          Lowercase letters, numbers, hyphens, underscores (max 64 chars)
        </small>
      </div>

      <!-- Description -->
      <div class="field">
        <label for="agent-description" class="block text-sm font-semibold mb-2 text-surface-700 dark:text-surface-200">
          Description <span class="text-red-500">*</span>
        </label>
        <Textarea
          id="agent-description"
          v-model="formData.description"
          :disabled="loading"
          :invalid="!!errors.description"
          :fluid="true"
          :auto-resize="true"
          :rows="2"
          placeholder="Brief description of the agent's purpose"
        />
        <small v-if="errors.description" class="text-red-500 text-xs mt-1 block">{{ errors.description }}</small>
      </div>

      <!-- Color -->
      <div class="field">
        <label class="block text-sm font-semibold mb-2 text-surface-700 dark:text-surface-200">
          Color
        </label>
        <ColorPaletteDropdown
          v-model="formData.color"
          :disabled="loading"
        />
      </div>

      <!-- Model -->
      <div class="field">
        <label class="block text-sm font-semibold mb-2 text-surface-700 dark:text-surface-200">
          Model
        </label>
        <SelectButton
          v-model="formData.model"
          :options="modelOptions"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          :disabled="loading"
        />
      </div>

      <!-- Permission Mode -->
      <div class="field">
        <label for="agent-permission" class="block text-sm font-semibold mb-2 text-surface-700 dark:text-surface-200">
          Permission Mode
        </label>
        <Select
          id="agent-permission"
          v-model="formData.permissionMode"
          :options="permissionOptions"
          option-label="label"
          option-value="value"
          :fluid="true"
          :disabled="loading"
        />
      </div>

      <!-- Tools -->
      <div class="field">
        <label for="agent-tools" class="block text-sm font-semibold mb-2 text-surface-700 dark:text-surface-200">
          Allowed Tools
        </label>
        <MultiSelect
          id="agent-tools"
          v-model="formData.tools"
          :options="toolOptions"
          option-label="label"
          option-value="value"
          display="chip"
          :show-toggle-all="true"
          :max-selected-labels="3"
          :filter="true"
          :fluid="true"
          :disabled="loading"
          placeholder="Select allowed tools"
        />
      </div>

      <!-- Skills -->
      <div class="field">
        <label for="agent-skills" class="block text-sm font-semibold mb-2 text-surface-700 dark:text-surface-200">
          Skills
        </label>
        <MultiSelect
          id="agent-skills"
          v-model="formData.skills"
          :options="skillOptions"
          option-label="label"
          option-value="value"
          display="chip"
          :show-toggle-all="true"
          :max-selected-labels="3"
          :filter="true"
          :fluid="true"
          :disabled="loading"
          placeholder="Select skills"
        />
      </div>

      <!-- System Prompt -->
      <div class="field">
        <label for="agent-prompt" class="block text-sm font-semibold mb-2 text-surface-700 dark:text-surface-200">
          System Prompt <span class="text-red-500">*</span>
        </label>
        <Textarea
          id="agent-prompt"
          v-model="formData.systemPrompt"
          :disabled="loading"
          :invalid="!!errors.systemPrompt"
          :fluid="true"
          :auto-resize="true"
          :rows="6"
          placeholder="The agent's system prompt (instructions)"
        />
        <small v-if="errors.systemPrompt" class="text-red-500 text-xs mt-1 block">{{ errors.systemPrompt }}</small>
      </div>
    </div>

    <template #footer>
      <Button
        label="Cancel"
        severity="secondary"
        :disabled="loading"
        @click="onCancel"
      />
      <Button
        label="Save Changes"
        :disabled="loading"
        :loading="loading"
        @click="onSave"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import MultiSelect from 'primevue/multiselect'
import ColorPaletteDropdown from '@/components/forms/ColorPaletteDropdown.vue'
import { useFormValidation } from '@/composables/useFormValidation'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  agent: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'save', 'cancel'])

const { validate } = useFormValidation()

// Form data
const formData = ref({
  name: '',
  description: '',
  color: '',
  model: 'inherit',
  permissionMode: 'default',
  tools: [],
  skills: [],
  systemPrompt: ''
})

// Validation errors
const errors = ref({
  name: null,
  description: null,
  systemPrompt: null
})

// Model options
const modelOptions = [
  { label: 'Inherit', value: 'inherit' },
  { label: 'Sonnet', value: 'sonnet' },
  { label: 'Opus', value: 'opus' },
  { label: 'Haiku', value: 'haiku' }
]

// Permission mode options
const permissionOptions = [
  { label: 'Default', value: 'default' },
  { label: 'Accept Edits', value: 'acceptEdits' },
  { label: 'Bypass Permissions', value: 'bypassPermissions' },
  { label: 'Plan', value: 'plan' },
  { label: 'Ignore', value: 'ignore' }
]

// Tool options (common Claude Code tools)
const toolOptions = [
  { label: 'Bash', value: 'Bash' },
  { label: 'Read', value: 'Read' },
  { label: 'Write', value: 'Write' },
  { label: 'Edit', value: 'Edit' },
  { label: 'Glob', value: 'Glob' },
  { label: 'Grep', value: 'Grep' },
  { label: 'WebFetch', value: 'WebFetch' },
  { label: 'TodoRead', value: 'TodoRead' },
  { label: 'TodoWrite', value: 'TodoWrite' }
]

// Skill options (will be populated from available skills)
const skillOptions = computed(() => {
  // TODO: Get actual skills from store/API
  // For now, return empty array
  return []
})

// Initialize form data when agent changes
watch(() => props.agent, (newAgent) => {
  if (newAgent) {
    formData.value = {
      name: newAgent.name || '',
      description: newAgent.description || '',
      color: newAgent.color || '',
      model: newAgent.model || 'inherit',
      permissionMode: newAgent.permissionMode || 'default',
      tools: newAgent.tools || [],
      skills: newAgent.skills || [],
      systemPrompt: newAgent.content || ''
    }
    // Clear errors
    errors.value = {
      name: null,
      description: null,
      systemPrompt: null
    }
  }
}, { immediate: true })

/**
 * Validate form fields
 * @returns {boolean} - True if form is valid
 */
function validateForm() {
  let isValid = true
  errors.value = {
    name: null,
    description: null,
    systemPrompt: null
  }

  // Validate name
  const nameValidation = validate(formData.value.name, [
    { type: 'required' },
    { type: 'agentName' }
  ])
  if (!nameValidation.valid) {
    errors.value.name = nameValidation.error
    isValid = false
  }

  // Validate description
  const descValidation = validate(formData.value.description, [
    { type: 'required' },
    { type: 'minLength', param: 10, message: 'Description must be at least 10 characters' }
  ])
  if (!descValidation.valid) {
    errors.value.description = descValidation.error
    isValid = false
  }

  // Validate system prompt
  const promptValidation = validate(formData.value.systemPrompt, [
    { type: 'required' },
    { type: 'minLength', param: 20, message: 'System prompt must be at least 20 characters' }
  ])
  if (!promptValidation.valid) {
    errors.value.systemPrompt = promptValidation.error
    isValid = false
  }

  return isValid
}

/**
 * Handle save button click
 */
function onSave() {
  if (!validateForm()) {
    return
  }

  // Emit save event with updates
  const updates = {
    name: formData.value.name,
    description: formData.value.description,
    color: formData.value.color || undefined,
    model: formData.value.model,
    permissionMode: formData.value.permissionMode,
    tools: formData.value.tools.length > 0 ? formData.value.tools : undefined,
    skills: formData.value.skills.length > 0 ? formData.value.skills : undefined,
    content: formData.value.systemPrompt
  }

  emit('save', updates)
}

/**
 * Handle cancel button click
 */
function onCancel() {
  emit('cancel')
  emit('update:visible', false)
}
</script>

<style scoped>
.field {
  margin-bottom: 1rem;
}

.field:last-child {
  margin-bottom: 0;
}
</style>
