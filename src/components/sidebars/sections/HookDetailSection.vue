<template>
  <div>
    <!-- Metadata Section -->
    <div class="mb-6">
      <h4 class="mb-3 text-sm font-semibold text-text-primary uppercase tracking-wider">Metadata</h4>

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

    <!-- Type Field (command, http, prompt, agent) -->
    <LabeledEditField
      v-model="hookData.type"
      field-type="selectbutton"
      label="Type"
      :options="availableTypeOptions"
      :disabled="!canEdit || editingField !== null && editingField !== 'type'"
      @edit-start="handleEditStart('type')"
      @edit-cancel="handleEditCancel"
      @edit-accept="handleHookFieldUpdate('type', $event)"
    />

    <!-- Command-type fields -->
    <template v-if="hookData.type === 'command'">
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

      <!-- Async Field -->
      <LabeledEditField
        v-if="hookData.async !== undefined && hookData.async !== false"
        v-model="hookData.async"
        field-type="selectbutton"
        label="Async"
        :options="booleanOptions"
        :disabled="!canEdit || editingField !== null && editingField !== 'async'"
        @edit-start="handleEditStart('async')"
        @edit-cancel="handleEditCancel"
        @edit-accept="handleHookFieldUpdate('async', $event)"
      />

      <!-- Shell Field -->
      <p v-if="hookData.shell" class="my-2 text-sm text-text-secondary leading-relaxed">
        <strong class="text-text-primary">Shell:</strong>
        <Tag :value="hookData.shell" severity="info" class="ml-2 text-xs" />
      </p>
    </template>

    <!-- HTTP-type fields -->
    <template v-if="hookData.type === 'http'">
      <LabeledEditField
        v-model="hookData.url"
        field-type="text"
        label="URL"
        placeholder="https://example.com/webhook"
        :disabled="!canEdit || editingField !== null && editingField !== 'url'"
        :validation="[{ type: 'required' }]"
        @edit-start="handleEditStart('url')"
        @edit-cancel="handleEditCancel"
        @edit-accept="handleHookFieldUpdate('url', $event)"
      />

      <!-- Headers (read-only key-value display) -->
      <div v-if="hookData.headers && Object.keys(hookData.headers).length > 0" class="my-3">
        <div class="text-text-primary font-bold text-sm mb-2">Headers:</div>
        <div class="bg-bg-primary p-3 rounded border border-border-primary">
          <div
            v-for="(value, key) in hookData.headers"
            :key="key"
            class="flex items-center gap-2 py-1 text-xs"
          >
            <code class="font-mono text-text-primary">{{ key }}:</code>
            <code class="font-mono text-text-secondary">{{ value }}</code>
          </div>
        </div>
      </div>

      <!-- Allowed Env Vars -->
      <div v-if="hookData.allowedEnvVars && hookData.allowedEnvVars.length > 0" class="my-3">
        <div class="text-text-primary font-bold text-sm mb-2">Allowed Env Vars:</div>
        <div class="flex flex-wrap gap-1">
          <Tag v-for="envVar in hookData.allowedEnvVars" :key="envVar" :value="envVar" severity="info" class="text-xs" />
        </div>
      </div>
    </template>

    <!-- Prompt-type fields -->
    <template v-if="hookData.type === 'prompt'">
      <LabeledEditField
        v-model="hookData.prompt"
        field-type="textarea"
        label="Prompt"
        placeholder="Prompt text for Claude"
        :disabled="!canEdit || editingField !== null && editingField !== 'prompt'"
        @edit-start="handleEditStart('prompt')"
        @edit-cancel="handleEditCancel"
        @edit-accept="handleHookFieldUpdate('prompt', $event)"
      />

      <p v-if="hookData.model" class="my-2 text-sm text-text-secondary leading-relaxed">
        <strong class="text-text-primary">Model:</strong>
        <Tag :value="hookData.model" severity="info" class="ml-2 text-xs" />
      </p>
    </template>

    <!-- Agent-type fields -->
    <template v-if="hookData.type === 'agent'">
      <LabeledEditField
        v-model="hookData.prompt"
        field-type="textarea"
        label="Prompt"
        placeholder="Prompt text for agent"
        :disabled="!canEdit || editingField !== null && editingField !== 'prompt'"
        @edit-start="handleEditStart('prompt')"
        @edit-cancel="handleEditCancel"
        @edit-accept="handleHookFieldUpdate('prompt', $event)"
      />

      <p v-if="hookData.model" class="my-2 text-sm text-text-secondary leading-relaxed">
        <strong class="text-text-primary">Model:</strong>
        <Tag :value="hookData.model" severity="info" class="ml-2 text-xs" />
      </p>
    </template>

    <!-- Common fields for all types -->

    <!-- Condition (if) Field -->
    <p v-if="hookData.if" class="my-2 text-sm text-text-secondary leading-relaxed">
      <strong class="text-text-primary">Condition (if):</strong>
      <code class="ml-1 bg-bg-primary px-2 py-0.5 rounded text-xs font-mono">{{ hookData.if }}</code>
    </p>

    <!-- Status Message Field -->
    <p v-if="hookData.statusMessage" class="my-2 text-sm text-text-secondary leading-relaxed">
      <strong class="text-text-primary">Status Message:</strong> {{ hookData.statusMessage }}
    </p>

    <!-- Once Field -->
    <LabeledEditField
      v-if="hookData.once !== undefined && hookData.once !== false"
      v-model="hookData.once"
      field-type="selectbutton"
      label="Once"
      :options="booleanOptions"
      :disabled="!canEdit || editingField !== null && editingField !== 'once'"
      @edit-start="handleEditStart('once')"
      @edit-cancel="handleEditCancel"
      @edit-accept="handleHookFieldUpdate('once', $event)"
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
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import LabeledEditField from '@/components/forms/LabeledEditField.vue'
import Tag from 'primevue/tag'
import { useHooksStore } from '@/stores/hooks'
import { HOOK_TYPE_OPTIONS, YES_NO_OPTIONS } from '@/constants/form-options'
import api from '@/api'

// Extended hook type options (command, http, prompt, agent)
const EXTENDED_HOOK_TYPE_OPTIONS = [
  { label: 'Command', value: 'command' },
  { label: 'HTTP', value: 'http' },
  { label: 'Prompt', value: 'prompt' },
  { label: 'Agent', value: 'agent' }
]

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
  continue: true,
  // New fields
  async: undefined,
  shell: '',
  url: '',
  headers: null,
  allowedEnvVars: [],
  prompt: '',
  model: '',
  if: '',
  statusMessage: '',
  once: undefined
})

const editingField = ref(null)

// Use constants from form-options
const hookTypeOptions = HOOK_TYPE_OPTIONS
const booleanOptions = YES_NO_OPTIONS

// Computed: available type options based on event support
const availableTypeOptions = computed(() => {
  if (supportsPromptType(hookData.value.event)) {
    return EXTENDED_HOOK_TYPE_OPTIONS
  }
  return [
    { label: 'Command', value: 'command' },
    { label: 'HTTP', value: 'http' }
  ]
})

// Hook event metadata - fetched from API on mount, with fallback values
const hookEventMetadata = ref({
  matcherBasedEvents: ['PreToolUse', 'PostToolUse', 'PermissionRequest', 'Notification'],
  promptSupportedEvents: ['PreToolUse', 'PermissionRequest', 'UserPromptSubmit', 'Stop', 'SubagentStop',
    'SubagentTool', 'SessionPause', 'SessionResume', 'ModelSwitch', 'ContextTruncation',
    'CompactComplete', 'TaskStart', 'TaskComplete', 'ToolError', 'ToolRetry',
    'ModelError', 'ContextWindowWarning', 'McpConnectionChange', 'EditConflict',
    'AgentHandoff', 'PermissionEscalation', 'MemoryCommit', 'WorktreeCreate',
    'WorktreeCleanup', 'GitOperation', 'FileWatch', 'TokenBudgetWarning']
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
      continue: newItem.continue !== false, // Default to true
      // New fields
      async: newItem.async,
      shell: newItem.shell || '',
      url: newItem.url || '',
      headers: newItem.headers || null,
      allowedEnvVars: newItem.allowedEnvVars || [],
      prompt: newItem.prompt || '',
      model: newItem.model || '',
      if: newItem.if || '',
      statusMessage: newItem.statusMessage || '',
      once: newItem.once
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
