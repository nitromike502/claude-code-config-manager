<template>
  <div>
    <!-- Sidebar Overlay -->
    <div v-if="visible" class="sidebar-overlay fixed inset-0 bg-black/50 z-[999]" @click="emit('close')"></div>

    <!-- Detail Sidebar -->
    <div v-if="visible" class="sidebar fixed right-0 top-0 w-full md:w-[75vw] md:min-w-[500px] md:max-w-[75vw] h-screen bg-bg-secondary border-l border-border-primary shadow-card flex flex-col z-[1000]" @click.stop>
      <div class="p-6 border-b border-border-primary flex justify-between items-center gap-4">
        <div class="flex items-center gap-3 text-lg font-semibold text-text-primary flex-1 min-w-0">
          <i :class="typeIcon" :style="{ color: typeColor }"></i>
          <span class="overflow-hidden text-ellipsis whitespace-nowrap">{{ selectedItem?.name || selectedItem?.event || 'Item Details' }}</span>
        </div>
        <div class="flex gap-2">
          <Button
            @click="handleNavigatePrev"
            :disabled="!hasPrev"
            icon="pi pi-chevron-left"
            text
            class="nav-btn w-8 h-8 p-0 bg-transparent border border-border-primary rounded flex items-center justify-center transition-all duration-200 text-text-primary"
          />
          <Button
            @click="handleNavigateNext"
            :disabled="!hasNext"
            icon="pi pi-chevron-right"
            text
            class="nav-btn w-8 h-8 p-0 bg-transparent border border-border-primary rounded flex items-center justify-center transition-all duration-200 text-text-primary"
          />
          <Button
            @click="emit('close')"
            icon="pi pi-times"
            text
            class="close-btn w-8 h-8 p-0 bg-transparent border border-border-primary rounded flex items-center justify-center transition-all duration-200 text-text-primary"
          />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-6">
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
        </div>

        <!-- Content Section -->
        <div v-if="selectedItem?.content" class="mb-6">
          <h4 class="mb-3 text-sm font-semibold text-text-primary uppercase tracking-wider">Content</h4>
          <pre class="bg-bg-primary p-4 rounded border border-border-primary font-mono text-xs whitespace-pre-wrap break-words overflow-x-auto max-h-[400px] overflow-y-auto">{{ selectedItem.content }}</pre>
        </div>
      </div>

      <div class="p-4 px-6 border-t border-border-primary flex gap-3">
        <Button
          @click="handleCopy"
          :disabled="!selectedItem"
          label="Copy"
          icon="pi pi-copy"
          class="action-btn copy-action-btn flex-1 px-4 py-3 rounded font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200"
        />
        <Button
          @click="emit('close')"
          label="Close"
          icon="pi pi-times"
          outlined
          class="action-btn close-action-btn flex-1 px-4 py-3 rounded font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Button from 'primevue/button'

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
  navigate: (payload) => {
    return payload && typeof payload.index === 'number' && payload.item !== undefined
  },
  'copy-clicked': (item) => {
    return item && typeof item === 'object'
  }
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
    mcp: 'pi pi-server'
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
    mcp: 'var(--color-mcp)'
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
      'mcp': 'mcp'
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
/* Animations */
.sidebar-overlay {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.sidebar {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

/* Button hover states with CSS variable colors */
.nav-btn:hover:not(:disabled),
.close-btn:hover {
  background: var(--bg-primary);
  border-color: var(--color-primary);
}

.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.copy-action-btn {
  background: var(--color-primary);
  color: white;
}

.copy-action-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-card);
}

.copy-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--bg-tertiary);
  color: var(--text-disabled);
}

.close-action-btn {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.close-action-btn:hover {
  background: var(--bg-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-card);
}
</style>
