<template>
  <div>
    <!-- Name Field -->
    <LabeledEditField
      v-model="mcpData.name"
      field-type="text"
      label="Name"
      placeholder="server-name"
      :disabled="!canEdit || editingField !== null && editingField !== 'name'"
      :validation="[{ type: 'required' }, { type: 'pattern', param: /^[a-zA-Z0-9_-]+$/, message: 'Name can only contain letters, numbers, hyphens, and underscores' }]"
      @edit-start="handleEditStart('name')"
      @edit-cancel="handleEditCancel"
      @edit-accept="handleMcpFieldUpdate('name', $event)"
    />

    <!-- Transport Type Field (read-only) -->
    <p class="my-2 text-sm text-text-secondary leading-relaxed">
      <strong class="text-text-primary">Transport:</strong>
      {{ mcpData.type }}
      <span class="text-text-tertiary text-xs">(read-only)</span>
    </p>

    <!-- stdio-specific fields -->
    <template v-if="mcpData.type === 'stdio'">
      <!-- Command Field -->
      <LabeledEditField
        v-model="mcpData.command"
        field-type="text"
        label="Command"
        placeholder="node"
        :disabled="!canEdit || editingField !== null && editingField !== 'command'"
        :validation="[{ type: 'required' }]"
        @edit-start="handleEditStart('command')"
        @edit-cancel="handleEditCancel"
        @edit-accept="handleMcpFieldUpdate('command', $event)"
      />

      <!-- Args Field (array editor) -->
      <div class="my-3">
        <div class="text-text-primary font-bold text-sm mb-2">Arguments</div>
        <ArgsArrayEditor
          v-model="mcpData.args"
          :disabled="!canEdit"
          placeholder="Add argument..."
          @update:model-value="handleMcpFieldUpdate('args', $event)"
        />
      </div>

      <!-- Env Field (key-value editor) -->
      <div class="my-3">
        <div class="text-text-primary font-bold text-sm mb-2">Environment Variables</div>
        <KeyValueEditor
          v-model="mcpData.env"
          :disabled="!canEdit"
          key-placeholder="VAR_NAME"
          value-placeholder="value"
          @update:model-value="handleMcpFieldUpdate('env', $event)"
        />
      </div>
    </template>

    <!-- http/sse-specific fields -->
    <template v-if="mcpData.type === 'http' || mcpData.type === 'sse'">
      <!-- URL Field -->
      <LabeledEditField
        v-model="mcpData.url"
        field-type="text"
        label="URL"
        placeholder="https://example.com"
        :disabled="!canEdit || editingField !== null && editingField !== 'url'"
        :validation="[{ type: 'required' }]"
        @edit-start="handleEditStart('url')"
        @edit-cancel="handleEditCancel"
        @edit-accept="handleMcpFieldUpdate('url', $event)"
      />

      <!-- Headers Field (key-value editor) -->
      <div class="my-3">
        <div class="text-text-primary font-bold text-sm mb-2">Headers</div>
        <KeyValueEditor
          v-model="mcpData.headers"
          :disabled="!canEdit"
          key-placeholder="Header-Name"
          value-placeholder="value"
          @update:model-value="handleMcpFieldUpdate('headers', $event)"
        />
      </div>
    </template>

    <!-- Common fields (all transport types) -->
    <!-- Enabled Field -->
    <LabeledEditField
      v-model="mcpData.enabled"
      field-type="selectbutton"
      label="Enabled"
      :options="booleanOptions"
      :disabled="!canEdit || editingField !== null && editingField !== 'enabled'"
      @edit-start="handleEditStart('enabled')"
      @edit-cancel="handleEditCancel"
      @edit-accept="handleMcpFieldUpdate('enabled', $event)"
    />

    <!-- Timeout Field (optional) -->
    <LabeledEditField
      v-if="canEdit || mcpData.timeout !== null"
      v-model="mcpData.timeout"
      field-type="number"
      label="Timeout (ms)"
      placeholder="30000"
      :disabled="!canEdit || editingField !== null && editingField !== 'timeout'"
      @edit-start="handleEditStart('timeout')"
      @edit-cancel="handleEditCancel"
      @edit-accept="handleMcpFieldUpdate('timeout', $event)"
    />

    <!-- Retries Field (optional) -->
    <LabeledEditField
      v-if="canEdit || mcpData.retries !== null"
      v-model="mcpData.retries"
      field-type="number"
      label="Retries"
      placeholder="3"
      :disabled="!canEdit || editingField !== null && editingField !== 'retries'"
      @edit-start="handleEditStart('retries')"
      @edit-cancel="handleEditCancel"
      @edit-accept="handleMcpFieldUpdate('retries', $event)"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import LabeledEditField from '@/components/forms/LabeledEditField.vue'
import ArgsArrayEditor from '@/components/forms/ArgsArrayEditor.vue'
import KeyValueEditor from '@/components/forms/KeyValueEditor.vue'
import { useMcpStore } from '@/stores/mcp'

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

const emit = defineEmits(['field-update', 'update:editing-field', 'mcp-updated'])

const mcpStore = useMcpStore()

// Local editing field state
const editingField = ref(props.editingField)

// MCP data ref
const mcpData = ref({
  name: '',
  type: 'stdio',
  command: '',
  args: [],
  env: {},
  url: '',
  headers: {},
  enabled: true,
  timeout: null,
  retries: null
})

// Boolean options for selectbutton
const booleanOptions = [
  { label: 'Yes', value: true },
  { label: 'No', value: false }
]

// Watch selectedItem and update mcpData
watch(() => props.selectedItem, (newItem) => {
  if (newItem) {
    mcpData.value = {
      name: newItem.name || '',
      type: newItem.type || newItem.transport || newItem.transportType || 'stdio',
      command: newItem.command || '',
      args: newItem.args || [],
      env: newItem.env || {},
      url: newItem.url || '',
      headers: newItem.headers || {},
      enabled: newItem.enabled !== false, // Default to true
      timeout: newItem.timeout || null,
      retries: newItem.retries || null
    }
    editingField.value = null
  }
}, { immediate: true })

// Watch editingField prop and sync to local state
watch(() => props.editingField, (newValue) => {
  editingField.value = newValue
})

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

// Handle MCP field update
const handleMcpFieldUpdate = async (fieldName, newValue) => {
  if (!props.canEdit) return

  try {
    // Build updates object with just the changed field
    const updates = { [fieldName]: newValue }

    // Call API through store
    const result = await mcpStore.updateMcpServer(
      props.projectId,
      props.selectedItem.name,
      updates,
      props.scope
    )

    if (result.success) {
      // Update local mcpData
      mcpData.value[fieldName] = newValue

      // Notify parent that MCP server was updated
      emit('mcp-updated')
    }
  } finally {
    editingField.value = null
    emit('update:editing-field', null)
  }
}
</script>
