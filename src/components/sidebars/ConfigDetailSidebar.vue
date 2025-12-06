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
        <!-- Name Field -->
        <LabeledEditField
          v-model="agentData.name"
          field-type="text"
          label="Name"
          placeholder="agent-name"
          :disabled="!canEdit || editingField !== null && editingField !== 'name'"
          :validation="[{ type: 'required' }, { type: 'agentName' }]"
          @edit-start="editingField = 'name'"
          @edit-cancel="editingField = null"
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
          @edit-start="editingField = 'description'"
          @edit-cancel="editingField = null"
          @edit-accept="handleFieldUpdate('description', $event)"
        />

        <!-- Color Field -->
        <LabeledEditField
          v-model="agentData.color"
          field-type="colorpalette"
          label="Color"
          :disabled="!canEdit || editingField !== null && editingField !== 'color'"
          @edit-start="editingField = 'color'"
          @edit-cancel="editingField = null"
          @edit-accept="handleFieldUpdate('color', $event)"
        />

        <!-- Model Field -->
        <LabeledEditField
          v-model="agentData.model"
          field-type="selectbutton"
          label="Model"
          :options="modelOptions"
          :disabled="!canEdit || editingField !== null && editingField !== 'model'"
          @edit-start="editingField = 'model'"
          @edit-cancel="editingField = null"
          @edit-accept="handleFieldUpdate('model', $event)"
        />

        <!-- Permission Mode Field -->
        <LabeledEditField
          v-model="agentData.permissionMode"
          field-type="select"
          label="Permission Mode"
          :options="permissionOptions"
          :disabled="!canEdit || editingField !== null && editingField !== 'permissionMode'"
          @edit-start="editingField = 'permissionMode'"
          @edit-cancel="editingField = null"
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
          @edit-start="editingField = 'tools'"
          @edit-cancel="editingField = null"
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
          @edit-start="editingField = 'skills'"
          @edit-cancel="editingField = null"
          @edit-accept="handleFieldUpdate('skills', $event)"
        />
      </div>

      <!-- Commands Metadata -->
      <div v-else-if="selectedType === 'commands'">
        <!-- Name Field -->
        <LabeledEditField
          v-model="commandData.name"
          field-type="text"
          label="Name"
          placeholder="command-name"
          :disabled="!canEditCommand || editingField !== null && editingField !== 'name'"
          :validation="[{ type: 'required' }]"
          @edit-start="editingField = 'name'"
          @edit-cancel="editingField = null"
          @edit-accept="handleCommandFieldUpdate('name', $event)"
        />

        <!-- Description Field -->
        <LabeledEditField
          v-model="commandData.description"
          field-type="textarea"
          label="Description"
          placeholder="Brief description"
          :disabled="!canEditCommand || editingField !== null && editingField !== 'description'"
          @edit-start="editingField = 'description'"
          @edit-cancel="editingField = null"
          @edit-accept="handleCommandFieldUpdate('description', $event)"
        />

        <!-- Model Field -->
        <LabeledEditField
          v-model="commandData.model"
          field-type="selectbutton"
          label="Model"
          :options="commandModelOptions"
          :disabled="!canEditCommand || editingField !== null && editingField !== 'model'"
          @edit-start="editingField = 'model'"
          @edit-cancel="editingField = null"
          @edit-accept="handleCommandFieldUpdate('model', $event)"
        />

        <!-- Allowed Tools Field -->
        <LabeledEditField
          v-model="commandData.allowedTools"
          field-type="multiselect"
          label="Allowed Tools"
          :options="toolOptions"
          placeholder="Select allowed tools"
          :disabled="!canEditCommand || editingField !== null && editingField !== 'allowedTools'"
          @edit-start="editingField = 'allowedTools'"
          @edit-cancel="editingField = null"
          @edit-accept="handleCommandFieldUpdate('allowedTools', $event)"
        />

        <!-- Argument Hint Field -->
        <LabeledEditField
          v-model="commandData.argumentHint"
          field-type="text"
          label="Argument Hint"
          placeholder="<query>"
          :disabled="!canEditCommand || editingField !== null && editingField !== 'argumentHint'"
          @edit-start="editingField = 'argumentHint'"
          @edit-cancel="editingField = null"
          @edit-accept="handleCommandFieldUpdate('argumentHint', $event)"
        />

        <!-- Model Invocation Field -->
        <LabeledEditField
          v-model="commandData.disableModelInvocation"
          field-type="selectbutton"
          label="Model Invocation"
          :options="modelInvocationOptions"
          :disabled="!canEditCommand || editingField !== null && editingField !== 'disableModelInvocation'"
          @edit-start="editingField = 'disableModelInvocation'"
          @edit-cancel="editingField = null"
          @edit-accept="handleCommandFieldUpdate('disableModelInvocation', $event)"
        />
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
      <div v-else-if="selectedType === 'mcp'">
        <p class="my-2 text-sm text-text-secondary leading-relaxed"><strong class="text-text-primary">Name:</strong> {{ selectedItem.name }}</p>
        <p v-if="selectedItem.transport || selectedItem.transportType" class="my-2 text-sm text-text-secondary leading-relaxed">
          <strong class="text-text-primary">Transport:</strong> {{ selectedItem.transport || selectedItem.transportType }}
        </p>
        <p v-if="selectedItem.command" class="my-2 text-sm text-text-secondary leading-relaxed"><strong class="text-text-primary">Command:</strong> <code class="bg-bg-primary px-1 py-0.5 rounded font-mono text-xs text-primary">{{ selectedItem.command }}</code></p>
        <p v-if="selectedItem.args && selectedItem.args.length > 0" class="my-2 text-sm text-text-secondary leading-relaxed">
          <strong class="text-text-primary">Arguments:</strong> {{ selectedItem.args.join(' ') }}
        </p>
        <p v-if="selectedItem.enabled === false" class="my-2 text-sm text-text-secondary leading-relaxed"><strong class="text-text-primary">Status:</strong> Disabled</p>
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
      <h4 class="mb-3 text-sm font-semibold text-text-primary uppercase tracking-wider">
        {{ selectedType === 'agents' ? 'System Prompt' : 'Content' }}
      </h4>

      <!-- For agents, use inline editing -->
      <div v-if="selectedType === 'agents'">
        <LabeledEditField
          v-model="agentData.systemPrompt"
          field-type="textarea"
          label="System Prompt"
          placeholder="The agent's system prompt (instructions)"
          :disabled="!canEdit || editingField !== null && editingField !== 'systemPrompt'"
          :validation="[{ type: 'required' }, { type: 'minLength', param: 20, message: 'System prompt must be at least 20 characters' }]"
          @edit-start="editingField = 'systemPrompt'"
          @edit-cancel="editingField = null"
          @edit-accept="handleFieldUpdate('systemPrompt', $event)"
        />
      </div>

      <!-- For other types, show as read-only -->
      <pre v-else class="bg-bg-primary p-4 rounded border border-border-primary font-mono text-xs whitespace-pre-wrap break-words overflow-x-auto max-h-[400px] overflow-y-auto text-text-primary">{{ selectedItem.content }}</pre>
    </div>

    <!-- Footer with Actions (inline icon buttons) -->
    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <!-- Delete Button (for agents and commands with edit enabled) -->
        <Button
          v-if="(selectedType === 'agents' && canEdit) || (selectedType === 'commands' && canEditCommand)"
          @click="handleDelete"
          :disabled="!selectedItem"
          icon="pi pi-trash"
          outlined
          severity="danger"
          aria-label="Delete"
          v-tooltip.top="'Delete'"
          class="sidebar-action-btn delete-action-btn"
        />

        <Button
          @click="handleCopy"
          :disabled="!selectedItem"
          icon="pi pi-copy"
          outlined
          aria-label="Copy"
          v-tooltip.top="'Copy'"
          class="sidebar-action-btn copy-action-btn"
        />
        <Button
          @click="localVisible = false"
          icon="pi pi-times"
          outlined
          aria-label="Close"
          v-tooltip.top="'Close'"
          class="sidebar-action-btn close-action-btn"
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
import { useAgentsStore } from '@/stores/agents'
import { useCommandsStore } from '@/stores/commands'

const agentsStore = useAgentsStore()
const commandsStore = useCommandsStore()

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
  // CRUD support (for agents)
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
  'agent-delete': (item) => {
    return item && typeof item === 'object'
  },
  'agent-updated': () => true,
  'command-delete': (item) => {
    return item && typeof item === 'object'
  },
  'command-updated': () => true,
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

// Command editing state
const commandData = ref({
  name: '',
  description: '',
  model: 'inherit',
  allowedTools: [],
  argumentHint: '',
  disableModelInvocation: false
})

const editingField = ref(null)

// Computed: Can edit agents (only if enableCrud is true and not a plugin agent)
const canEdit = computed(() => {
  return props.enableCrud &&
         props.selectedType === 'agents' &&
         props.selectedItem?.location !== 'plugin'
})

// Computed: Can edit commands (only if enableCrud is true)
const canEditCommand = computed(() => {
  return props.enableCrud &&
         props.selectedType === 'commands'
})

// Model options for agents
const modelOptions = [
  { label: 'Inherit', value: 'inherit' },
  { label: 'Sonnet', value: 'sonnet' },
  { label: 'Opus', value: 'opus' },
  { label: 'Haiku', value: 'haiku' }
]

// Model options for commands (same as agents)
const commandModelOptions = [
  { label: 'Inherit', value: 'inherit' },
  { label: 'Sonnet', value: 'sonnet' },
  { label: 'Opus', value: 'opus' },
  { label: 'Haiku', value: 'haiku' }
]

// Model invocation options for commands
const modelInvocationOptions = [
  { label: 'Allow Model', value: false },
  { label: 'Skip Model', value: true }
]

// Permission mode options for agents
const permissionOptions = [
  { label: 'Default', value: 'default' },
  { label: 'Accept Edits', value: 'acceptEdits' },
  { label: 'Bypass Permissions', value: 'bypassPermissions' },
  { label: 'Plan', value: 'plan' },
  { label: 'Ignore', value: 'ignore' }
]

// Tool options for agents
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

// Skill options for agents (TODO: populate from available skills)
const skillOptions = computed(() => {
  // For now, return empty array
  // TODO: Get actual skills from store/API
  return []
})

// Watch for selectedItem changes to update agentData
watch(() => props.selectedItem, (newItem) => {
  if (newItem && props.selectedType === 'agents') {
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
  } else if (newItem && props.selectedType === 'commands') {
    // Update command data
    commandData.value = {
      name: newItem.name || '',
      description: newItem.description || '',
      model: newItem.model || 'inherit',
      allowedTools: newItem.tools || [],
      argumentHint: newItem.argumentHint || '',
      disableModelInvocation: newItem.disableModelInvocation || false
    }
    editingField.value = null
  }
}, { immediate: true })

// Handle field update (called when InlineEditField saves)
const handleFieldUpdate = async (fieldName, newValue) => {
  if (!canEdit.value) return

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
  }
}

// Handle command field update
const handleCommandFieldUpdate = async (fieldName, newValue) => {
  if (!canEditCommand.value) return

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
    editingField.value = null
  }
}

// Handle delete button click
const handleDelete = () => {
  if (canEdit.value && props.selectedItem) {
    emit('agent-delete', props.selectedItem)
  } else if (canEditCommand.value && props.selectedItem) {
    emit('command-delete', props.selectedItem)
  }
}

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

/* Sidebar action buttons (footer) - icon-only outlined style */
.sidebar-action-btn {
  width: 2.5rem !important;
  height: 2.5rem !important;
  padding: 0 !important;
  transition: all 0.2s !important;
}

.sidebar-action-btn:disabled {
  opacity: 0.4 !important;
  cursor: not-allowed !important;
}

/* Copy action button */
.copy-action-btn {
  background: var(--bg-secondary) !important;
  color: var(--color-primary) !important;
  border: 1px solid var(--color-primary) !important;
}

.copy-action-btn:hover:not(:disabled) {
  background: var(--color-primary) !important;
  color: white !important;
  transform: translateY(-1px);
  box-shadow: var(--shadow-card);
}

/* Delete action button */
.delete-action-btn {
  background: var(--bg-secondary) !important;
  color: var(--color-error) !important;
  border: 1px solid var(--color-error) !important;
}

.delete-action-btn:hover:not(:disabled) {
  background: var(--color-error) !important;
  color: white !important;
  transform: translateY(-1px);
  box-shadow: var(--shadow-card);
}

/* Close action button */
.close-action-btn {
  background: var(--bg-secondary) !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--border-primary) !important;
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
