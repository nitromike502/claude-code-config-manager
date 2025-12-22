<template>
  <Drawer
    v-model:visible="localVisible"
    position="right"
    :modal="true"
    :dismissable="true"
    :close-on-escape="true"
    :block-scroll="true"
    :show-close-icon="false"
    class="config-detail-drawer"
  >
    <!-- Custom Header with Navigation -->
    <template #header>
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <i :class="typeIcon" :style="{ color: typeColor }"></i>
        <span class="text-lg font-semibold text-text-primary overflow-hidden text-ellipsis whitespace-nowrap">
          {{ selectedItem?.name || selectedItem?.event || 'Item Details' }}
        </span>
      </div>
      <div class="flex gap-2">
        <Button
          @click="handleNavigatePrev"
          :disabled="!hasPrev"
          icon="pi pi-chevron-left"
          text
          class="nav-btn"
          aria-label="Previous item"
        />
        <Button
          @click="handleNavigateNext"
          :disabled="!hasNext"
          icon="pi pi-chevron-right"
          text
          class="nav-btn"
          aria-label="Next item"
        />
        <Button
          @click="localVisible = false"
          icon="pi pi-times"
          text
          class="nav-btn"
          aria-label="Close sidebar"
        />
      </div>
    </template>

    <!-- Main Content -->
    <div class="mb-6">
      <h4 class="mb-3 text-sm font-semibold text-text-primary uppercase tracking-wider">Metadata</h4>

      <!-- Agents Metadata -->
      <div v-if="selectedType === 'agents'">
        <p class="my-2 text-sm text-text-secondary leading-relaxed"><strong class="text-text-primary">Name:</strong> {{ selectedItem.name }}</p>
        <p class="my-2 text-sm text-text-secondary leading-relaxed"><strong class="text-text-primary">Description:</strong> {{ selectedItem.description }}</p>
        <p class="my-2 text-sm text-text-secondary leading-relaxed"><strong class="text-text-primary">Color:</strong> {{ selectedItem.color || 'Not specified' }}</p>
        <p class="my-2 text-sm text-text-secondary leading-relaxed"><strong class="text-text-primary">Model:</strong> {{ selectedItem.model || 'inherit' }}</p>
        <p v-if="selectedItem.tools && selectedItem.tools.length > 0" class="my-2 text-sm text-text-secondary leading-relaxed">
          <strong class="text-text-primary">Allowed Tools:</strong> {{ selectedItem.tools.join(', ') }}
        </p>
        <p v-else-if="Array.isArray(selectedItem.tools) && selectedItem.tools.length === 0" class="my-2 text-sm text-text-secondary leading-relaxed">
          <strong class="text-text-primary">Allowed Tools:</strong> None specified
        </p>
      </div>

      <!-- Commands Metadata -->
      <div v-else-if="selectedType === 'commands'">
        <p class="my-2 text-sm text-text-secondary leading-relaxed"><strong class="text-text-primary">Name:</strong> {{ selectedItem.name }}</p>
        <p class="my-2 text-sm text-text-secondary leading-relaxed"><strong class="text-text-primary">Description:</strong> {{ selectedItem.description }}</p>
        <p v-if="selectedItem.namespace" class="my-2 text-sm text-text-secondary leading-relaxed"><strong class="text-text-primary">Namespace:</strong> {{ selectedItem.namespace }}</p>
        <p v-if="selectedItem.color" class="my-2 text-sm text-text-secondary leading-relaxed"><strong class="text-text-primary">Color:</strong> {{ selectedItem.color }}</p>
        <p v-if="selectedItem.argumentHint" class="my-2 text-sm text-text-secondary leading-relaxed"><strong class="text-text-primary">Argument Hint:</strong> {{ selectedItem.argumentHint }}</p>
        <p v-if="selectedItem.tools && selectedItem.tools.length > 0" class="my-2 text-sm text-text-secondary leading-relaxed">
          <strong class="text-text-primary">Allowed Tools:</strong> {{ selectedItem.tools.join(', ') }}
        </p>
        <p v-else-if="Array.isArray(selectedItem.tools) && selectedItem.tools.length === 0" class="my-2 text-sm text-text-secondary leading-relaxed">
          <strong class="text-text-primary">Allowed Tools:</strong> None specified
        </p>
      </div>

      <!-- Hooks Metadata -->
      <div v-else-if="selectedType === 'hooks'">
        <p class="my-2 text-sm text-text-secondary leading-relaxed"><strong class="text-text-primary">Event:</strong> {{ selectedItem.event }}</p>
        <p v-if="selectedItem.type" class="my-2 text-sm text-text-secondary leading-relaxed"><strong class="text-text-primary">Type:</strong> {{ selectedItem.type }}</p>
        <p v-if="selectedItem.matcher" class="my-2 text-sm text-text-secondary leading-relaxed"><strong class="text-text-primary">Matcher:</strong> {{ selectedItem.matcher }}</p>
        <p v-if="selectedItem.pattern" class="my-2 text-sm text-text-secondary leading-relaxed"><strong class="text-text-primary">Pattern:</strong> {{ selectedItem.pattern }}</p>
        <p v-if="selectedItem.command" class="my-2 text-sm text-text-secondary leading-relaxed"><strong class="text-text-primary">Command:</strong> <code class="bg-bg-primary px-1 py-0.5 rounded font-mono text-xs text-primary">{{ selectedItem.command }}</code></p>
      </div>

      <!-- MCP Servers Metadata -->
      <div v-else-if="selectedType === 'mcp'" class="space-y-3">
        <!-- Name (editable) -->
        <LabeledEditField
          v-model="mcpData.name"
          field-type="text"
          label="Name"
          :disabled="!canEditMcp || (editingField !== null && editingField !== 'mcp-name')"
          @edit-start="editingField = 'mcp-name'"
          @edit-cancel="editingField = null"
          @edit-accept="handleMcpFieldUpdate('name', $event)"
        />

        <!-- Transport Type -->
        <LabeledEditField
          v-model="mcpData.type"
          field-type="selectbutton"
          label="Transport"
          :options="transportOptions"
          :disabled="!canEditMcp || (editingField !== null && editingField !== 'mcp-type')"
          @edit-start="editingField = 'mcp-type'"
          @edit-cancel="editingField = null"
          @edit-accept="handleTransportChange($event)"
        />

        <!-- stdio-specific fields -->
        <template v-if="mcpData.type === 'stdio'">
          <LabeledEditField
            v-model="mcpData.command"
            field-type="text"
            label="Command"
            :disabled="!canEditMcp || (editingField !== null && editingField !== 'mcp-command')"
            :validation="[{ type: 'required' }]"
            @edit-start="editingField = 'mcp-command'"
            @edit-cancel="editingField = null"
            @edit-accept="handleMcpFieldUpdate('command', $event)"
          />

          <!-- Args - using ArgsArrayEditor component -->
          <div class="labeled-field">
            <div class="text-text-primary font-bold mb-2">Arguments:</div>
            <ArgsArrayEditor
              v-model="mcpData.args"
              :disabled="!canEditMcp"
              @update:model-value="handleMcpFieldUpdate('args', $event)"
            />
          </div>

          <!-- Env - using KeyValueEditor component -->
          <div class="labeled-field">
            <div class="text-text-primary font-bold mb-2">Environment:</div>
            <KeyValueEditor
              v-model="mcpData.env"
              :disabled="!canEditMcp"
              key-placeholder="Variable name"
              value-placeholder="Value"
              @update:model-value="handleMcpFieldUpdate('env', $event)"
            />
          </div>
        </template>

        <!-- http/sse-specific fields -->
        <template v-if="mcpData.type === 'http' || mcpData.type === 'sse'">
          <LabeledEditField
            v-model="mcpData.url"
            field-type="text"
            label="URL"
            :disabled="!canEditMcp || (editingField !== null && editingField !== 'mcp-url')"
            :validation="[{ type: 'required' }]"
            @edit-start="editingField = 'mcp-url'"
            @edit-cancel="editingField = null"
            @edit-accept="handleMcpFieldUpdate('url', $event)"
          />

          <!-- Headers - using KeyValueEditor component -->
          <div class="labeled-field">
            <div class="text-text-primary font-bold mb-2">Headers:</div>
            <KeyValueEditor
              v-model="mcpData.headers"
              :disabled="!canEditMcp"
              key-placeholder="Header name"
              value-placeholder="Value"
              @update:model-value="handleMcpFieldUpdate('headers', $event)"
            />
          </div>
        </template>

        <!-- Common fields -->
        <LabeledEditField
          v-model="mcpData.enabled"
          field-type="selectbutton"
          label="Status"
          :options="[{ label: 'Enabled', value: true }, { label: 'Disabled', value: false }]"
          :disabled="!canEditMcp || (editingField !== null && editingField !== 'mcp-enabled')"
          @edit-start="editingField = 'mcp-enabled'"
          @edit-cancel="editingField = null"
          @edit-accept="handleMcpFieldUpdate('enabled', $event)"
        />

        <LabeledEditField
          v-model="mcpData.timeout"
          field-type="number"
          label="Timeout (ms)"
          :min="1000"
          :max="300000"
          :disabled="!canEditMcp || (editingField !== null && editingField !== 'mcp-timeout')"
          @edit-start="editingField = 'mcp-timeout'"
          @edit-cancel="editingField = null"
          @edit-accept="handleMcpFieldUpdate('timeout', $event)"
        />
      </div>

      <!-- Skills Metadata -->
      <div v-else-if="selectedType === 'skills'">
        <p class="my-2 text-sm text-text-secondary leading-relaxed"><strong class="text-text-primary">Name:</strong> {{ selectedItem.name }}</p>
        <p class="my-2 text-sm text-text-secondary leading-relaxed"><strong class="text-text-primary">Description:</strong> {{ selectedItem.description || 'No description' }}</p>
        <p v-if="selectedItem.allowedTools && selectedItem.allowedTools.length > 0" class="my-2 text-sm text-text-secondary leading-relaxed">
          <strong class="text-text-primary">Allowed Tools:</strong>
          <span v-for="(tool, index) in selectedItem.allowedTools" :key="index" class="inline-block bg-bg-tertiary px-2 py-1 rounded text-xs mr-1 mt-1">{{ tool }}</span>
        </p>
        <p v-else-if="Array.isArray(selectedItem.allowedTools) && selectedItem.allowedTools.length === 0" class="my-2 text-sm text-text-secondary leading-relaxed">
          <strong class="text-text-primary">Allowed Tools:</strong> None specified
        </p>
        <p v-if="selectedItem.directoryPath" class="my-2 text-sm text-text-secondary leading-relaxed">
          <strong class="text-text-primary">Directory Path:</strong> <code class="bg-bg-primary px-1 py-0.5 rounded font-mono text-xs text-text-secondary">{{ selectedItem.directoryPath }}</code>
        </p>

        <!-- Structure Information with Collapsible File Tree -->
        <div v-if="selectedItem.fileCount || selectedItem.files" class="my-3">
          <Accordion :value="null" class="skill-structure-accordion">
            <AccordionPanel value="files">
              <AccordionHeader>
                <div class="flex items-center gap-2">
                  <i class="pi pi-folder text-color-skills"></i>
                  <span class="font-semibold">Structure</span>
                  <span class="text-text-muted text-xs ml-1">({{ selectedItem.fileCount }} files)</span>
                </div>
              </AccordionHeader>
              <AccordionContent>
                <div class="file-tree pl-2">
                  <div
                    v-for="(file, index) in selectedItem.files"
                    :key="index"
                    class="file-tree-item"
                    :class="{ 'directory': file.type === 'directory' }"
                    :style="{ paddingLeft: getIndentLevel(file.relativePath) + 'rem' }"
                  >
                    <i :class="file.type === 'directory' ? 'pi pi-folder' : 'pi pi-file'"
                       :style="{ color: file.type === 'directory' ? 'var(--color-skills)' : 'var(--text-muted)' }"></i>
                    <span class="text-xs text-text-secondary">{{ file.name }}</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionPanel>
          </Accordion>
        </div>

        <!-- External References Warning -->
        <div v-if="selectedItem.externalReferences && selectedItem.externalReferences.length > 0" class="my-3 p-3 bg-color-warning-bg rounded border border-color-warning">
          <div class="flex items-start gap-2">
            <i class="pi pi-exclamation-triangle text-color-warning mt-0.5"></i>
            <div class="flex-1">
              <p class="text-sm font-semibold text-color-warning mb-2">External References Detected</p>
              <div v-for="(ref, index) in selectedItem.externalReferences" :key="index" class="mb-2">
                <p class="text-xs text-text-secondary">
                  <code class="bg-bg-primary px-1 py-0.5 rounded font-mono">{{ ref.reference }}</code>
                </p>
                <p class="text-xs text-text-muted">{{ ref.file }}, line {{ ref.line }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Parse Error -->
        <div v-if="selectedItem.hasError && selectedItem.parseError" class="my-3 p-3 bg-color-error-bg rounded border border-color-error">
          <div class="flex items-start gap-2">
            <i class="pi pi-times-circle text-color-error mt-0.5"></i>
            <div class="flex-1">
              <p class="text-sm font-semibold text-color-error mb-1">Parse Error</p>
              <p class="text-xs text-text-secondary">{{ selectedItem.parseError }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Section -->
    <div v-if="selectedItem?.content" class="mb-6">
      <h4 class="mb-3 text-sm font-semibold text-text-primary uppercase tracking-wider">Content</h4>
      <pre class="bg-bg-primary p-4 rounded border border-border-primary font-mono text-xs whitespace-pre-wrap break-words overflow-x-auto max-h-[400px] overflow-y-auto text-text-primary">{{ selectedItem.content }}</pre>
    </div>

    <!-- Footer with Actions -->
    <template #footer>
      <div class="flex gap-3 w-full">
        <Button
          @click="handleCopy"
          :disabled="!selectedItem"
          label="Copy"
          icon="pi pi-copy"
          class="copy-action-btn flex-1"
        />
        <Button
          @click="localVisible = false"
          label="Close"
          icon="pi pi-times"
          outlined
          class="close-action-btn flex-1"
        />
      </div>
    </template>
  </Drawer>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Drawer from 'primevue/drawer'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'
import LabeledEditField from '@/components/forms/LabeledEditField.vue'
import ArgsArrayEditor from '@/components/forms/ArgsArrayEditor.vue'
import KeyValueEditor from '@/components/forms/KeyValueEditor.vue'
import { useMcpStore } from '@/stores/mcp'

const mcpStore = useMcpStore()

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
    default: false
  },
  selectedItem: {
    type: Object,
    default: null
  },
  selectedType: {
    type: String,
    default: null
  },
  currentItems: {
    type: Array,
    default: () => []
  },
  selectedIndex: {
    type: Number,
    default: -1
  },
  // CRUD support
  scope: {
    type: String,
    default: null,
    validator: (value) => value === null || ['project', 'user'].includes(value)
  },
  projectId: {
    type: String,
    default: null
  },
  enableCrud: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits({
  close: null,
  navigate: (direction) => {
    return direction === 'prev' || direction === 'next'
  },
  'copy-clicked': (item) => {
    return item && typeof item === 'object'
  },
  'mcp-updated': () => true,
  'update:visible': (value) => typeof value === 'boolean'
})

// Local visibility state that syncs with parent via v-model pattern
const localVisible = ref(props.visible)

// Sync parent -> local
watch(() => props.visible, (newVal) => {
  localVisible.value = newVal
})

// Sync local -> parent (emit close when drawer closes)
watch(localVisible, (newVal) => {
  if (!newVal) {
    emit('close')
  }
  emit('update:visible', newVal)
})

// MCP editing state
const mcpData = ref({
  name: '',
  type: 'stdio',      // stdio, http, or sse
  command: '',        // stdio only
  args: [],           // stdio only
  env: {},            // stdio only
  url: '',            // http/sse only
  headers: {},        // http/sse only
  enabled: true,
  timeout: 30000,
  retries: 3
})

const editingField = ref(null)

// Transport type options
const transportOptions = [
  { label: 'stdio', value: 'stdio' },
  { label: 'http', value: 'http' },
  { label: 'sse', value: 'sse' }
]

// Computed: Can edit MCP servers (only if enableCrud is true)
const canEditMcp = computed(() => {
  return props.enableCrud &&
         props.selectedType === 'mcp'
})

// Watch for selectedItem changes to populate mcpData
watch(() => props.selectedItem, (newItem) => {
  if (newItem && props.selectedType === 'mcp') {
    // Update MCP data
    mcpData.value = {
      name: newItem.name || '',
      type: newItem.type || newItem.transport || newItem.transportType || 'stdio',
      command: newItem.command || '',
      args: newItem.args || [],
      env: newItem.env || {},
      url: newItem.url || '',
      headers: newItem.headers || {},
      enabled: newItem.enabled !== false,
      timeout: newItem.timeout || 30000,
      retries: newItem.retries || 3
    }
    editingField.value = null
  }
}, { immediate: true })

// Computed: navigation state
const hasPrev = computed(() => props.selectedIndex > 0)
const hasNext = computed(() => props.selectedIndex < props.currentItems.length - 1)

// Computed: type icon
const typeIcon = computed(() => {
  const icons = {
    agents: 'pi pi-users',
    commands: 'pi pi-bolt',
    hooks: 'pi pi-link',
    mcp: 'pi pi-server',
    skills: 'pi pi-sparkles'
  }
  return icons[props.selectedType] || 'pi pi-file'
})

// Computed: type color
const typeColor = computed(() => {
  // For agents, use the defined color if available
  if (props.selectedType === 'agents' && props.selectedItem?.color) {
    return props.selectedItem.color
  }

  // Otherwise use default type colors
  const colors = {
    agents: 'var(--color-agents)',
    commands: 'var(--color-commands)',
    hooks: 'var(--color-hooks)',
    mcp: 'var(--color-mcp)',
    skills: 'var(--color-skills)'
  }
  return colors[props.selectedType] || 'var(--text-primary)'
})

// Navigation handlers
const handleNavigatePrev = () => {
  if (hasPrev.value) {
    emit('navigate', 'prev')
  }
}

const handleNavigateNext = () => {
  if (hasNext.value) {
    emit('navigate', 'next')
  }
}

// Calculate indentation level for file tree based on path depth
const getIndentLevel = (relativePath) => {
  if (!relativePath) return 0
  const depth = (relativePath.match(/\//g) || []).length
  return depth * 1.25 // 1.25rem per level
}

// Handle MCP field update
const handleMcpFieldUpdate = async (fieldName, newValue) => {
  if (!canEditMcp.value) return

  try {
    // Build updates object with just the changed field
    const updates = { [fieldName]: newValue }
    const serverName = props.selectedItem.name

    // Call API through store
    const result = await mcpStore.updateMcpServer(
      props.projectId,
      serverName,
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
  }
}

// Handle transport type change (clears inapplicable fields)
const handleTransportChange = async (newType) => {
  // Build updates object
  const updates = { type: newType }

  // Clear fields that don't apply to new transport
  if (newType === 'stdio') {
    // Clear http/sse fields
    updates.url = undefined
    updates.headers = undefined
  } else {
    // Clear stdio fields
    updates.command = undefined
    updates.args = undefined
    updates.env = undefined
  }

  try {
    const serverName = props.selectedItem.name

    // Call API through store
    const result = await mcpStore.updateMcpServer(
      props.projectId,
      serverName,
      updates,
      props.scope
    )

    if (result.success) {
      // Update local state
      mcpData.value.type = newType
      if (newType === 'stdio') {
        mcpData.value.url = ''
        mcpData.value.headers = {}
      } else {
        mcpData.value.command = ''
        mcpData.value.args = []
        mcpData.value.env = {}
      }

      // Notify parent that MCP server was updated
      emit('mcp-updated')
    }
  } finally {
    editingField.value = null
  }
}

// Handle copy button click
const handleCopy = () => {
  if (props.selectedItem) {
    // Convert selectedType from plural ('agents', 'commands') to singular ('agent', 'command')
    const typeMapping = {
      'agents': 'agent',
      'commands': 'command',
      'hooks': 'hook',
      'mcp': 'mcp',
      'skills': 'skill'
    };

    // Use configType to avoid overwriting hook's type field
    const itemWithType = {
      ...props.selectedItem,
      configType: typeMapping[props.selectedType] || props.selectedType
    };

    emit('copy-clicked', itemWithType)
  }
}
</script>

<style scoped>
/* PrimeVue Drawer Styling */

/* Drawer container - responsive width */
:deep(.p-drawer) {
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-primary);
  box-shadow: var(--shadow-card);
}

/* Overlay/mask styling */
:deep(.p-drawer-mask) {
  background: rgba(0, 0, 0, 0.5);
}

/* Header styling */
:deep(.p-drawer-header) {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

:deep(.p-drawer-title) {
  display: none; /* We use custom header content */
}

/* Content area */
:deep(.p-drawer-content) {
  background: var(--bg-secondary);
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

/* Footer styling */
:deep(.p-drawer-footer) {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-primary);
  padding: 1rem 1.5rem;
}

/* Navigation buttons in header */
.nav-btn {
  width: 2rem !important;
  height: 2rem !important;
  padding: 0 !important;
  background: transparent !important;
  border: 1px solid var(--border-primary) !important;
  border-radius: 0.25rem !important;
  color: var(--text-primary) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.2s !important;
}

.nav-btn:hover:not(:disabled) {
  background: var(--bg-primary) !important;
  border-color: var(--color-primary) !important;
}

.nav-btn:disabled {
  opacity: 0.4 !important;
  cursor: not-allowed !important;
}

/* Copy action button */
.copy-action-btn {
  background: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
  color: white !important;
  padding: 0.75rem 1rem !important;
  font-weight: 500 !important;
  transition: all 0.2s !important;
}

.copy-action-btn:hover:not(:disabled) {
  background: var(--color-primary-hover) !important;
  border-color: var(--color-primary-hover) !important;
  transform: translateY(-1px);
  box-shadow: var(--shadow-card);
}

.copy-action-btn:disabled {
  opacity: 0.6 !important;
  cursor: not-allowed !important;
  background: var(--bg-tertiary) !important;
  border-color: var(--bg-tertiary) !important;
  color: var(--text-disabled) !important;
}

/* Close action button (outlined) */
.close-action-btn {
  background: var(--bg-secondary) !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--border-primary) !important;
  padding: 0.75rem 1rem !important;
  font-weight: 500 !important;
  transition: all 0.2s !important;
}

.close-action-btn:hover {
  background: var(--bg-hover) !important;
  transform: translateY(-1px);
  box-shadow: var(--shadow-card);
}

/* Skills Structure Accordion */
.skill-structure-accordion {
  background: var(--bg-tertiary);
  border-radius: 0.5rem;
  overflow: hidden;
}

:deep(.skill-structure-accordion .p-accordionheader) {
  background: var(--bg-tertiary) !important;
  border: none !important;
  padding: 0.75rem 1rem !important;
}

:deep(.skill-structure-accordion .p-accordionheader:hover) {
  background: var(--bg-hover) !important;
}

:deep(.skill-structure-accordion .p-accordioncontent-content) {
  background: var(--bg-primary) !important;
  border-top: 1px solid var(--border-primary) !important;
  padding: 0.75rem !important;
  max-height: 300px;
  overflow-y: auto;
}

/* File Tree Styling */
.file-tree {
  font-family: var(--font-mono);
}

.file-tree-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  border-radius: 0.25rem;
  transition: background 0.15s;
}

.file-tree-item:hover {
  background: var(--bg-hover);
}

.file-tree-item.directory {
  font-weight: 500;
}

.file-tree-item i {
  font-size: 0.875rem;
  width: 1rem;
  text-align: center;
}
</style>
