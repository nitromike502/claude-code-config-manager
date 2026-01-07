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

    <!-- Main Content - Entity-specific sections -->
    <AgentDetailSection
      v-if="selectedType === 'agents'"
      :selected-item="selectedItem"
      :can-edit="canEdit"
      :project-id="projectId"
      :scope="scope"
      @agent-updated="$emit('agent-updated')"
    />

    <CommandDetailSection
      v-else-if="selectedType === 'commands'"
      :selected-item="selectedItem"
      :can-edit="canEditCommand"
      :project-id="projectId"
      :scope="scope"
      @command-updated="$emit('command-updated')"
    />

    <HookDetailSection
      v-else-if="selectedType === 'hooks'"
      :selected-item="selectedItem"
      :can-edit="canEditHook"
      :project-id="projectId"
      :scope="scope"
      @hook-updated="$emit('hook-updated')"
    />

    <McpDetailSection
      v-else-if="selectedType === 'mcp'"
      :selected-item="selectedItem"
      :can-edit="canEditMcp"
      :project-id="projectId"
      :scope="scope"
      @mcp-updated="$emit('mcp-updated')"
    />

    <SkillDetailSection
      v-else-if="selectedType === 'skills'"
      :selected-item="selectedItem"
      :can-edit="canEditSkill"
      :project-id="projectId"
      :scope="scope"
      @skill-updated="$emit('skill-updated')"
    />

    <!-- Content Section - only show for types not handled by section components -->
    <div v-if="selectedItem?.content && !['agents', 'commands', 'skills', 'hooks', 'mcp'].includes(selectedType)" class="mb-6">
      <pre class="bg-bg-primary p-4 rounded border border-border-primary font-mono text-xs whitespace-pre-wrap break-words overflow-x-auto max-h-[400px] overflow-y-auto text-text-primary">{{ selectedItem.content }}</pre>
    </div>

    <!-- Footer with Actions (inline icon buttons) -->
    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <!-- Delete Button (for agents, commands, skills, hooks, and mcp with edit enabled) -->
        <Button
          v-if="(selectedType === 'agents' && canEdit) || (selectedType === 'commands' && canEditCommand) || (selectedType === 'skills' && canEditSkill) || (selectedType === 'hooks' && canEditHook) || (selectedType === 'mcp' && canEditMcp)"
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
import AgentDetailSection from './sections/AgentDetailSection.vue'
import CommandDetailSection from './sections/CommandDetailSection.vue'
import HookDetailSection from './sections/HookDetailSection.vue'
import McpDetailSection from './sections/McpDetailSection.vue'
import SkillDetailSection from './sections/SkillDetailSection.vue'

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
  'agent-delete': (item) => {
    return item && typeof item === 'object'
  },
  'agent-updated': () => true,
  'command-delete': (item) => {
    return item && typeof item === 'object'
  },
  'command-updated': () => true,
  'skill-delete': (item) => {
    return item && typeof item === 'object'
  },
  'skill-updated': () => true,
  'hook-delete': (item) => {
    return item && typeof item === 'object'
  },
  'hook-updated': () => true,
  'mcp-delete': (item) => {
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

// Computed: Can edit skills (only if enableCrud is true)
const canEditSkill = computed(() => {
  return props.enableCrud &&
         props.selectedType === 'skills'
})

// Computed: Can edit hooks (only if enableCrud is true)
const canEditHook = computed(() => {
  return props.enableCrud &&
         props.selectedType === 'hooks'
})

// Computed: Can edit MCP servers (only if enableCrud is true)
const canEditMcp = computed(() => {
  return props.enableCrud &&
         props.selectedType === 'mcp'
})

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

// Handle delete button click
const handleDelete = () => {
  if (canEdit.value && props.selectedItem) {
    emit('agent-delete', props.selectedItem)
  } else if (canEditCommand.value && props.selectedItem) {
    emit('command-delete', props.selectedItem)
  } else if (canEditSkill.value && props.selectedItem) {
    emit('skill-delete', props.selectedItem)
  } else if (canEditHook.value && props.selectedItem) {
    emit('hook-delete', props.selectedItem)
  } else if (canEditMcp.value && props.selectedItem) {
    emit('mcp-delete', props.selectedItem)
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
</style>
