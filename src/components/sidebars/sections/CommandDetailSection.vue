<template>
  <div>
    <!-- Metadata Section -->
    <div class="mb-6">
      <h4 class="mb-3 text-sm font-semibold text-text-primary uppercase tracking-wider">Metadata</h4>

      <!-- Name Field -->
      <LabeledEditField
        v-model="commandData.name"
        field-type="text"
        label="Name"
        placeholder="command-name"
        :disabled="!canEdit || (editingField !== null && editingField !== 'name')"
        :validation="[{ type: 'required' }]"
        @edit-start="handleEditStart('name')"
        @edit-cancel="handleEditCancel"
        @edit-accept="handleFieldUpdate('name', $event)"
      />

      <!-- Description Field -->
      <LabeledEditField
        v-model="commandData.description"
        field-type="textarea"
        label="Description"
        placeholder="Brief description"
        :disabled="!canEdit || (editingField !== null && editingField !== 'description')"
        @edit-start="handleEditStart('description')"
        @edit-cancel="handleEditCancel"
        @edit-accept="handleFieldUpdate('description', $event)"
      />

      <!-- Model Field -->
      <LabeledEditField
        v-model="commandData.model"
        field-type="selectbutton"
        label="Model"
        :options="commandModelOptions"
        :disabled="!canEdit || (editingField !== null && editingField !== 'model')"
        @edit-start="handleEditStart('model')"
        @edit-cancel="handleEditCancel"
        @edit-accept="handleFieldUpdate('model', $event)"
      />

      <!-- Allowed Tools Field -->
      <LabeledEditField
        v-model="commandData.allowedTools"
        field-type="multiselect"
        label="Allowed Tools"
        :options="toolOptions"
        placeholder="Select allowed tools"
        :disabled="!canEdit || (editingField !== null && editingField !== 'allowedTools')"
        @edit-start="handleEditStart('allowedTools')"
        @edit-cancel="handleEditCancel"
        @edit-accept="handleFieldUpdate('allowedTools', $event)"
      />

      <!-- Argument Hint Field (optional - only show if has value or can edit) -->
      <LabeledEditField
        v-if="canEdit || commandData.argumentHint"
        v-model="commandData.argumentHint"
        field-type="text"
        label="Argument Hint"
        placeholder="<query>"
        :disabled="!canEdit || (editingField !== null && editingField !== 'argumentHint')"
        @edit-start="handleEditStart('argumentHint')"
        @edit-cancel="handleEditCancel"
        @edit-accept="handleFieldUpdate('argumentHint', $event)"
      />

      <!-- Model Invocation Field (optional - only show if has value or can edit) -->
      <LabeledEditField
        v-if="canEdit || commandData.disableModelInvocation !== null"
        v-model="commandData.disableModelInvocation"
        field-type="selectbutton"
        label="Model Invocation"
        :options="modelInvocationOptions"
        :disabled="!canEdit || (editingField !== null && editingField !== 'disableModelInvocation')"
        @edit-start="handleEditStart('disableModelInvocation')"
        @edit-cancel="handleEditCancel"
        @edit-accept="handleFieldUpdate('disableModelInvocation', $event)"
      />
    </div>

    <!-- Content Section -->
    <div class="mb-6">
      <h4 class="mb-3 text-sm font-semibold text-text-primary uppercase tracking-wider">Content</h4>

      <LabeledEditField
        v-model="commandData.content"
        field-type="textarea"
        label="Content"
        placeholder="The command's content (instructions)"
        :disabled="!canEdit || (editingField !== null && editingField !== 'content')"
        :validation="[{ type: 'required' }, { type: 'minLength', param: 10, message: 'Content must be at least 10 characters' }]"
        @edit-start="handleEditStart('content')"
        @edit-cancel="handleEditCancel"
        @edit-accept="handleFieldUpdate('content', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import LabeledEditField from '@/components/forms/LabeledEditField.vue'
import { useCommandsStore } from '@/stores/commands'
import { MODEL_OPTIONS, TOOL_OPTIONS, MODEL_INVOCATION_OPTIONS } from '@/constants/form-options'

const commandsStore = useCommandsStore()

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

const emit = defineEmits(['field-update', 'update:editing-field', 'command-updated'])

// Local reactive state for command data
const commandData = ref({
  name: '',
  description: '',
  model: 'inherit',
  allowedTools: [],
  argumentHint: '',
  disableModelInvocation: false,
  content: ''
})

// Use constants from form-options
const commandModelOptions = MODEL_OPTIONS
const modelInvocationOptions = MODEL_INVOCATION_OPTIONS
const toolOptions = TOOL_OPTIONS

// Watch for selectedItem changes to update commandData
watch(() => props.selectedItem, (newItem) => {
  if (newItem) {
    commandData.value = {
      name: newItem.name || '',
      description: newItem.description || '',
      model: newItem.model || 'inherit',
      allowedTools: newItem.tools || [],
      argumentHint: newItem.argumentHint || '',
      disableModelInvocation: newItem.disableModelInvocation || false,
      content: newItem.content || ''
    }
  }
}, { immediate: true })

// Handle edit start
const handleEditStart = (fieldName) => {
  emit('update:editing-field', fieldName)
}

// Handle edit cancel
const handleEditCancel = () => {
  emit('update:editing-field', null)
}

// Handle field update
const handleFieldUpdate = async (fieldName, newValue) => {
  if (!props.canEdit) return

  try {
    // Build updates object
    // Note: Backend expects camelCase field names (argumentHint, allowedTools, disableModelInvocation)
    // Backend handles the conversion to kebab-case for YAML frontmatter internally
    const updates = { [fieldName]: newValue }

    // Get the command path (construct from namespace + name + .md)
    // Commands have: { name: 'helper', namespace: 'utils', filePath: '/full/path/...' }
    // Backend expects: 'utils/helper.md' or 'helper.md' (relative path)
    const commandPath = props.selectedItem.namespace
      ? `${props.selectedItem.namespace}/${props.selectedItem.name}.md`
      : `${props.selectedItem.name}.md`

    // Call API through store
    const result = await commandsStore.updateCommand(
      props.scope,
      props.projectId,
      commandPath,
      updates
    )

    if (result.success) {
      // Update local commandData
      commandData.value[fieldName] = newValue

      // Notify parent that command was updated
      emit('command-updated')
    }
  } finally {
    emit('update:editing-field', null)
  }
}
</script>

<style scoped>
/* Component-specific styles if needed */
</style>
