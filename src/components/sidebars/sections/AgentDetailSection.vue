<template>
  <div>
    <!-- Metadata Section -->
    <div class="mb-6">
      <h4 class="mb-3 text-sm font-semibold text-text-primary uppercase tracking-wider">Metadata</h4>

      <!-- Name Field -->
      <LabeledEditField
        v-model="agentData.name"
        field-type="text"
        label="Name"
        placeholder="agent-name"
        :disabled="!canEdit || editingField !== null && editingField !== 'name'"
        :validation="[{ type: 'required' }, { type: 'agentName' }]"
        @edit-start="handleEditStart('name')"
        @edit-cancel="handleEditCancel"
        @edit-accept="handleFieldUpdate('name', $event)"
      />

      <!-- Description Field -->
      <LabeledEditField
        v-model="agentData.description"
        field-type="textarea"
        label="Description"
        placeholder="Brief description"
        :disabled="!canEdit || editingField !== null && editingField !== 'description'"
        :validation="[{ type: 'required' }, { type: 'minLength', param: 10, message: 'Description must be at least 10 characters' }]"
        @edit-start="handleEditStart('description')"
        @edit-cancel="handleEditCancel"
        @edit-accept="handleFieldUpdate('description', $event)"
      />

      <!-- Color Field -->
      <LabeledEditField
        v-model="agentData.color"
        field-type="colorpalette"
        label="Color"
        :disabled="!canEdit || editingField !== null && editingField !== 'color'"
        @edit-start="handleEditStart('color')"
        @edit-cancel="handleEditCancel"
        @edit-accept="handleFieldUpdate('color', $event)"
      />

      <!-- Model Field -->
      <LabeledEditField
        v-model="agentData.model"
        field-type="selectbutton"
        label="Model"
        :options="modelOptions"
        :disabled="!canEdit || editingField !== null && editingField !== 'model'"
        @edit-start="handleEditStart('model')"
        @edit-cancel="handleEditCancel"
        @edit-accept="handleFieldUpdate('model', $event)"
      />

      <!-- Permission Mode Field -->
      <LabeledEditField
        v-model="agentData.permissionMode"
        field-type="select"
        label="Permission Mode"
        :options="permissionOptions"
        :disabled="!canEdit || editingField !== null && editingField !== 'permissionMode'"
        @edit-start="handleEditStart('permissionMode')"
        @edit-cancel="handleEditCancel"
        @edit-accept="handleFieldUpdate('permissionMode', $event)"
      />

      <!-- Tools Field -->
      <LabeledEditField
        v-model="agentData.tools"
        field-type="multiselect"
        label="Allowed Tools"
        :options="toolOptions"
        placeholder="Select allowed tools"
        :disabled="!canEdit || editingField !== null && editingField !== 'tools'"
        @edit-start="handleEditStart('tools')"
        @edit-cancel="handleEditCancel"
        @edit-accept="handleFieldUpdate('tools', $event)"
      />

      <!-- Skills Field -->
      <LabeledEditField
        v-model="agentData.skills"
        field-type="multiselect"
        label="Skills"
        :options="skillOptions"
        placeholder="Select skills"
        :disabled="!canEdit || editingField !== null && editingField !== 'skills'"
        @edit-start="handleEditStart('skills')"
        @edit-cancel="handleEditCancel"
        @edit-accept="handleFieldUpdate('skills', $event)"
      />
    </div>

    <!-- Content Section (System Prompt) -->
    <div class="mb-6">
      <h4 class="mb-3 text-sm font-semibold text-text-primary uppercase tracking-wider">System Prompt</h4>

      <LabeledEditField
        v-model="agentData.systemPrompt"
        field-type="textarea"
        label="System Prompt"
        placeholder="The agent's system prompt (instructions)"
        :disabled="!canEdit || editingField !== null && editingField !== 'systemPrompt'"
        :validation="[{ type: 'required' }, { type: 'minLength', param: 20, message: 'System prompt must be at least 20 characters' }]"
        @edit-start="handleEditStart('systemPrompt')"
        @edit-cancel="handleEditCancel"
        @edit-accept="handleFieldUpdate('systemPrompt', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import LabeledEditField from '@/components/forms/LabeledEditField.vue'
import { useAgentsStore } from '@/stores/agents'
import { MODEL_OPTIONS, TOOL_OPTIONS, PERMISSION_MODE_OPTIONS } from '@/constants/form-options'

const agentsStore = useAgentsStore()

const props = defineProps({
  selectedItem: {
    type: Object,
    required: true
  },
  canEdit: {
    type: Boolean,
    default: false
  },
  editingField: {
    type: String,
    default: null
  },
  projectId: {
    type: String,
    default: null
  },
  scope: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['field-update', 'update:editing-field', 'agent-updated'])

// Agent editing state
const agentData = ref({
  name: '',
  description: '',
  color: '',
  model: 'inherit',
  permissionMode: 'default',
  tools: [],
  skills: [],
  systemPrompt: ''
})

// Local editing field state
const editingField = ref(null)

// Use constants from form-options
const modelOptions = MODEL_OPTIONS
const permissionOptions = PERMISSION_MODE_OPTIONS
const toolOptions = TOOL_OPTIONS

// Skill options for agents (TODO: populate from available skills)
const skillOptions = []

// Watch for selectedItem changes to update agentData
watch(() => props.selectedItem, (newItem) => {
  if (newItem) {
    // Trim leading newline from systemPrompt for display (it's just formatting for the file)
    let displaySystemPrompt = newItem.content || ''
    if (displaySystemPrompt.startsWith('\n')) {
      displaySystemPrompt = displaySystemPrompt.substring(1)
    }

    agentData.value = {
      name: newItem.name || '',
      description: newItem.description || '',
      color: newItem.color || '',
      model: newItem.model || 'inherit',
      permissionMode: newItem.permissionMode || 'default',
      tools: newItem.tools || [],
      skills: newItem.skills || [],
      systemPrompt: displaySystemPrompt
    }
    editingField.value = null
  }
}, { immediate: true })

// Handle edit start
const handleEditStart = (fieldName) => {
  editingField.value = fieldName
  emit('update:editing-field', fieldName)
}

// Handle edit cancel
const handleEditCancel = () => {
  editingField.value = null
  emit('update:editing-field', null)
}

// Handle field update (called when LabeledEditField saves)
const handleFieldUpdate = async (fieldName, newValue) => {
  if (!props.canEdit) return

  try {
    // Build updates object with just the changed field
    // Note: All field names map directly to API - systemPrompt is expected by the API
    const updates = { [fieldName]: newValue }

    // Call API through store
    const result = await agentsStore.updateAgent(
      props.projectId,
      props.selectedItem.name,
      updates,
      props.scope
    )

    if (result.success) {
      // Update local agentData
      agentData.value[fieldName] = newValue

      // Notify parent that agent was updated
      emit('agent-updated')
    }
  } finally {
    editingField.value = null
    emit('update:editing-field', null)
  }
}
</script>

<style scoped>
/* Component uses theme CSS variables - no additional styling needed */
</style>
