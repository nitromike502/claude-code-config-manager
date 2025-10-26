<template>
  <div>
    <!-- Sidebar Overlay -->
    <div v-if="visible" class="sidebar-overlay" @click="$emit('close')"></div>

    <!-- Detail Sidebar -->
    <div v-if="visible" class="sidebar" @click.stop>
      <div class="sidebar-header">
        <div class="sidebar-header-title">
          <i :class="typeIcon" :style="{ color: typeColor }"></i>
          <span>{{ selectedItem?.name || selectedItem?.event || 'Item Details' }}</span>
        </div>
        <div class="sidebar-nav">
          <button @click="handleNavigatePrev" :disabled="!hasPrev" class="nav-btn">
            <i class="pi pi-chevron-left"></i>
          </button>
          <button @click="handleNavigateNext" :disabled="!hasNext" class="nav-btn">
            <i class="pi pi-chevron-right"></i>
          </button>
          <button @click="$emit('close')" class="close-btn">
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>

      <div class="sidebar-content">
        <div class="sidebar-section">
          <h4>Metadata</h4>

          <!-- Agents Metadata -->
          <div v-if="selectedType === 'agents'">
            <p><strong>Name:</strong> {{ selectedItem.name }}</p>
            <p><strong>Description:</strong> {{ selectedItem.description }}</p>
            <p><strong>Color:</strong> {{ selectedItem.color || 'Not specified' }}</p>
            <p><strong>Model:</strong> {{ selectedItem.model || 'inherit' }}</p>
            <p v-if="selectedItem.tools && selectedItem.tools.length > 0">
              <strong>Allowed Tools:</strong> {{ selectedItem.tools.join(', ') }}
            </p>
            <p v-else-if="selectedItem.tools && selectedItem.tools.length === 0">
              <strong>Allowed Tools:</strong> None specified
            </p>
          </div>

          <!-- Commands Metadata -->
          <div v-else-if="selectedType === 'commands'">
            <p><strong>Name:</strong> {{ selectedItem.name }}</p>
            <p><strong>Description:</strong> {{ selectedItem.description }}</p>
            <p v-if="selectedItem.namespace"><strong>Namespace:</strong> {{ selectedItem.namespace }}</p>
            <p v-if="selectedItem.color"><strong>Color:</strong> {{ selectedItem.color }}</p>
            <p v-if="selectedItem.argumentHint"><strong>Argument Hint:</strong> {{ selectedItem.argumentHint }}</p>
            <p v-if="selectedItem.tools && selectedItem.tools.length > 0">
              <strong>Allowed Tools:</strong> {{ selectedItem.tools.join(', ') }}
            </p>
            <p v-else-if="selectedItem.tools && selectedItem.tools.length === 0">
              <strong>Allowed Tools:</strong> None specified
            </p>
          </div>

          <!-- Hooks Metadata -->
          <div v-else-if="selectedType === 'hooks'">
            <p><strong>Event:</strong> {{ selectedItem.event }}</p>
            <p v-if="selectedItem.type"><strong>Type:</strong> {{ selectedItem.type }}</p>
            <p v-if="selectedItem.matcher"><strong>Matcher:</strong> {{ selectedItem.matcher }}</p>
            <p v-if="selectedItem.pattern"><strong>Pattern:</strong> {{ selectedItem.pattern }}</p>
            <p v-if="selectedItem.command"><strong>Command:</strong> <code>{{ selectedItem.command }}</code></p>
          </div>

          <!-- MCP Servers Metadata -->
          <div v-else-if="selectedType === 'mcp'">
            <p><strong>Name:</strong> {{ selectedItem.name }}</p>
            <p v-if="selectedItem.transport || selectedItem.transportType">
              <strong>Transport:</strong> {{ selectedItem.transport || selectedItem.transportType }}
            </p>
            <p v-if="selectedItem.command"><strong>Command:</strong> <code>{{ selectedItem.command }}</code></p>
            <p v-if="selectedItem.args && selectedItem.args.length > 0">
              <strong>Arguments:</strong> {{ selectedItem.args.join(' ') }}
            </p>
            <p v-if="selectedItem.enabled === false"><strong>Status:</strong> Disabled</p>
          </div>
        </div>

        <!-- Content Section -->
        <div v-if="selectedItem?.content" class="sidebar-section">
          <h4>Content</h4>
          <pre class="content-preview">{{ selectedItem.content }}</pre>
        </div>
      </div>

      <div class="sidebar-footer">
        <button @click="$emit('close')" class="action-btn close-action-btn">
          <i class="pi pi-times"></i>
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'ConfigDetailSidebar',
  props: {
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
  },
  emits: ['close', 'navigate'],
  setup(props, { emit }) {
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
        const newIndex = props.selectedIndex - 1
        const newItem = props.currentItems[newIndex]
        emit('navigate', { item: newItem, index: newIndex })
      }
    }

    const handleNavigateNext = () => {
      if (hasNext.value) {
        const newIndex = props.selectedIndex + 1
        const newItem = props.currentItems[newIndex]
        emit('navigate', { item: newItem, index: newIndex })
      }
    }

    return {
      hasPrev,
      hasNext,
      typeIcon,
      typeColor,
      handleNavigatePrev,
      handleNavigateNext
    }
  }
}
</script>

<style scoped>
/* Sidebar Overlay */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
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

/* Sidebar */
.sidebar {
  position: fixed;
  right: 0;
  top: 0;
  width: 75vw;
  min-width: 500px;
  max-width: 75vw;
  height: 100vh;
  background: var(--surface-card);
  border-left: 1px solid var(--surface-border);
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 1000;
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

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.sidebar-header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
  min-width: 0;
}

.sidebar-header-title span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-nav {
  display: flex;
  gap: 0.5rem;
}

.nav-btn,
.close-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: 1px solid var(--surface-border);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: var(--text-primary);
}

.nav-btn i,
.close-btn i {
  color: var(--text-primary);
}

.nav-btn:hover:not(:disabled),
.close-btn:hover {
  background: var(--surface-ground);
  border-color: var(--primary-color);
}

.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.sidebar-section {
  margin-bottom: 1.5rem;
}

.sidebar-section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sidebar-section p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.sidebar-section strong {
  color: var(--text-primary);
}

.sidebar-section code {
  background: var(--surface-ground);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: var(--primary-color);
}

.content-preview {
  background: var(--surface-ground);
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid var(--surface-border);
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
}

.sidebar-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--surface-border);
}

.action-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background 0.2s;
}

.action-btn:hover {
  background: var(--primary-color-dark);
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    min-width: 100%;
  }
}
</style>
