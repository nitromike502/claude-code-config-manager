<template>
  <div>
    <!-- Event Field (READONLY - cannot change after creation) -->
    <p class="my-2 text-sm text-text-secondary leading-relaxed">
      <strong class="text-text-primary">Event:</strong> {{ selectedItem.event }}
      <span class="text-text-muted text-xs ml-2">(read-only)</span>
    </p>

    <!-- Matcher Field (only for PreToolUse/PostToolUse/PermissionRequest/Notification events) -->
    <LabeledEditField
      v-if="isMatcherBasedEvent(selectedItem.event)"
      v-model="hookData.matcher"
      field-type="text"
      label="Matcher"
      placeholder="Bash|Read|Write or *"
      :disabled="!canEdit || editingField !== null && editingField !== 'matcher'"
      :validation="[{ type: 'required' }]"
      @edit-start="handleEditStart('matcher')"
      @edit-cancel="handleEditCancel"
      @edit-accept="handleHookFieldUpdate('matcher', $event)"
    />

    <!-- Type Field (command or prompt - prompt only for certain events) -->
    <LabeledEditField
      v-model="hookData.type"
      field-type="selectbutton"
      label="Type"
      :options="supportsPromptType(hookData.event) ? hookTypeOptions : [{ label: 'Command', value: 'command' }]"
      :disabled="!canEdit || editingField !== null && editingField !== 'type'"
      @edit-start="handleEditStart('type')"
      @edit-cancel="handleEditCancel"
      @edit-accept="handleHookFieldUpdate('type', $event)"
    />

    <!-- Command Field -->
    <LabeledEditField
      v-model="hookData.command"
      field-type="textarea"
      label="Command"
      placeholder="Shell command to execute"
      :disabled="!canEdit || editingField !== null && editingField !== 'command'"
      :validation="[{ type: 'required' }]"
      @edit-start="handleEditStart('command')"
      @edit-cancel="handleEditCancel"
      @edit-accept="handleHookFieldUpdate('command', $event)"
    />

    <!-- Timeout Field -->
    <LabeledEditField
      v-model="hookData.timeout"
      field-type="number"
      label="Timeout (ms)"
      placeholder="30000"
      :disabled="!canEdit || editingField !== null && editingField !== 'timeout'"
      @edit-start="handleEditStart('timeout')"
      @edit-cancel="handleEditCancel"
      @edit-accept="handleHookFieldUpdate('timeout', $event)"
    />

    <!-- Enabled Field -->
    <LabeledEditField
      v-model="hookData.enabled"
      field-type="selectbutton"
      label="Enabled"
      :options="booleanOptions"
      :disabled="!canEdit || editingField !== null && editingField !== 'enabled'"
      @edit-start="handleEditStart('enabled')"
      @edit-cancel="handleEditCancel"
      @edit-accept="handleHookFieldUpdate('enabled', $event)"
    />

    <!-- Suppress Output Field -->
    <LabeledEditField
      v-model="hookData.suppressOutput"
      field-type="selectbutton"
      label="Suppress Output"
      :options="booleanOptions"
      :disabled="!canEdit || editingField !== null && editingField !== 'suppressOutput'"
      @edit-start="handleEditStart('suppressOutput')"
      @edit-cancel="handleEditCancel"
      @edit-accept="handleHookFieldUpdate('suppressOutput', $event)"
    />

    <!-- Continue Field -->
    <LabeledEditField
      v-model="hookData.continue"
      field-type="selectbutton"
      label="Continue on Error"
      :options="booleanOptions"
      :disabled="!canEdit || editingField !== null && editingField !== 'continue'"
      @edit-start="handleEditStart('continue')"
      @edit-cancel="handleEditCancel"
      @edit-accept="handleHookFieldUpdate('continue', $event)"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import LabeledEditField from '@/components/forms/LabeledEditField.vue'
import { useHooksStore } from '@/stores/hooks'
import api from '@/api'

// Props
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

// Emits
const emit = defineEmits(['field-update', 'update:editing-field', 'hook-updated'])

// Store
const hooksStore = useHooksStore()

// Local state
const hookData = ref({
  event: '',
  matcher: '',
  type: 'command',
  command: '',
  timeout: 30000,
  enabled: true,
  suppressOutput: false,
  continue: true
})

const editingField = ref(null)

// Hook type options
const hookTypeOptions = [
  { label: 'Command', value: 'command' },
  { label: 'Prompt', value: 'prompt' }
]

// Boolean options for hook fields
const booleanOptions = [
  { label: 'Yes', value: true },
  { label: 'No', value: false }
]

// Hook event metadata - fetched from API on mount, with fallback values
const hookEventMetadata = ref({
  matcherBasedEvents: ['PreToolUse', 'PostToolUse', 'PermissionRequest', 'Notification'],
  promptSupportedEvents: ['PreToolUse', 'PermissionRequest', 'UserPromptSubmit', 'Stop', 'SubagentStop']
})

// Fetch hook event metadata from API
onMounted(async () => {
  try {
    const response = await fetch(`${api.BASE_URL}/api/hooks/events`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    const data = await response.json()

    // Update metadata with API response
    if (data.matcherBasedEvents && data.promptSupportedEvents) {
      hookEventMetadata.value = {
        matcherBasedEvents: data.matcherBasedEvents,
        promptSupportedEvents: data.promptSupportedEvents
      }
    }
  } catch (error) {
    console.warn('Failed to fetch hook event metadata, using fallbacks:', error)
    // Keep fallback values already set in hookEventMetadata.value
  }
})

// Check if event requires matcher
const isMatcherBasedEvent = (event) => hookEventMetadata.value.matcherBasedEvents.includes(event)

// Check if event supports prompt type
const supportsPromptType = (event) => hookEventMetadata.value.promptSupportedEvents.includes(event)

// Watch for selectedItem changes
watch(() => props.selectedItem, (newItem) => {
  if (newItem) {
    // Update hook data
    hookData.value = {
      event: newItem.event || '',
      matcher: newItem.matcher || '',
      type: newItem.type || 'command',
      command: newItem.command || '',
      timeout: newItem.timeout || 30000,
      enabled: newItem.enabled !== false, // Default to true
      suppressOutput: newItem.suppressOutput || false,
      continue: newItem.continue !== false // Default to true
    }
    editingField.value = null
  }
}, { immediate: true })

// Edit handlers
const handleEditStart = (fieldName) => {
  editingField.value = fieldName
  emit('update:editing-field', fieldName)
}

const handleEditCancel = () => {
  editingField.value = null
  emit('update:editing-field', null)
}

// Handle hook field update
const handleHookFieldUpdate = async (fieldName, newValue) => {
  if (!props.canEdit) return

  try {
    // Build updates object with just the changed field
    const updates = { [fieldName]: newValue }

    // Build hookId from the selected item
    // Hook items should have: event, matcher (optional), index
    const hookId = `${props.selectedItem.event}::${props.selectedItem.matcher || ''}::${props.selectedItem.index || 0}`

    // Call API through store
    const result = await hooksStore.updateHook(
      props.projectId,
      hookId,
      updates,
      props.scope
    )

    if (result.success) {
      // Update local hookData
      hookData.value[fieldName] = newValue

      // Notify parent that hook was updated
      emit('hook-updated')
    }
  } finally {
    editingField.value = null
    emit('update:editing-field', null)
  }
}
</script>
