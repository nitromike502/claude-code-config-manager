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

        <!-- Structure Information -->
        <div v-if="selectedItem.fileCount || selectedItem.subdirectories" class="my-3 p-3 bg-bg-tertiary rounded">
          <p class="text-sm font-semibold text-text-primary mb-2">Structure</p>
          <p v-if="selectedItem.fileCount" class="my-1 text-sm text-text-secondary">
            <strong class="text-text-primary">Files:</strong> {{ selectedItem.fileCount }}
          </p>
          <div v-if="selectedItem.subdirectories && selectedItem.subdirectories.length > 0" class="my-1">
            <strong class="text-text-primary text-sm">Subdirectories:</strong>
            <ul class="list-disc ml-4 mt-1">
              <li v-for="(dir, index) in selectedItem.subdirectories" :key="index" class="text-xs text-text-secondary">{{ dir }}</li>
            </ul>
          </div>
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
</style>
