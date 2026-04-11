<template>
  <div class="flex flex-col gap-3">
    <Card
      v-for="(item, index) in items"
      :key="index"
      :pt="cardPt"
      class="config-item-card cursor-pointer"
      @click="$emit('item-selected', item, itemType)"
    >
      <!-- Header: Name (left) + Buttons (right) -->
      <template #header>
        <div class="flex items-center justify-between gap-3 px-4 py-3">
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-semibold text-[0.95rem] text-text-primary truncate">{{ getItemName(item) }}</span>
            <!-- MCP scope and status badges -->
            <McpScopeBadges
              v-if="itemType === 'mcp'"
              :scope="item.scope"
              :status="item.status"
            />
          </div>
          <div class="flex items-center gap-2 shrink-0" @click.stop>
            <!-- MCP Toggle Button (project view only) -->
            <Button
              v-if="itemType === 'mcp' && pageScope === 'project'"
              :icon="item.status === 'enabled' ? 'pi pi-ban' : 'pi pi-check-circle'"
              outlined
              size="small"
              :severity="item.status === 'enabled' ? 'secondary' : 'success'"
              :aria-label="item.status === 'enabled' ? 'Disable' : 'Enable'"
              :title="item.status === 'enabled' ? 'Disable MCP server' : 'Enable MCP server'"
              class="mcp-toggle-btn"
              :loading="toggleLoadingMap[item.name]"
              @click.stop="handleMcpToggle(item)"
            />
            <!-- Delete Button (agents, commands, skills, hooks, MCP) -->
            <Button
              v-if="canDelete(item)"
              icon="pi pi-trash"
              outlined
              size="small"
              severity="danger"
              aria-label="Delete"
              class="delete-btn"
              @click.stop="handleDeleteClick(item)"
            />

            <!-- Copy Button -->
            <CopyButton
              :configItem="item"
              :disabled="item.location === 'plugin' || (itemType === 'mcp' && item.scope === 'user' && pageScope === 'project')"
              :showLabel="false"
              @copy-clicked="handleCopyClick"
            />

            <!-- View Button -->
            <Button
              label="View"
              icon="pi pi-eye"
              outlined
              size="small"
              @click.stop="$emit('item-selected', item, itemType)"
              class="view-btn"
            />
          </div>
        </div>
      </template>

      <!-- Content: Description only -->
      <template #content>
        <div
          class="text-[0.85rem] text-text-secondary leading-[1.4]"
          :class="{ 'line-clamp-2': truncateDescription }"
        >
          {{ getItemDescription(item, itemType) }}
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed, reactive } from 'vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import McpScopeBadges from '@/components/common/McpScopeBadges.vue';
import CopyButton from '@/components/copy/CopyButton.vue';
import { useMcpStore } from '@/stores/mcp';

// Pass-through configuration for PrimeVue Card component
const cardPt = computed(() => ({
  root: {
    class: 'config-item-card-root'
  },
  header: {
    class: 'config-item-card-header'
  },
  body: {
    class: 'config-item-card-body'
  },
  content: {
    class: 'config-item-card-content'
  }
}));

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  itemType: {
    type: String,
    required: true,
    validator: (value) => ['agents', 'commands', 'hooks', 'mcp', 'skills', 'rules'].includes(value),
  },
  truncateDescription: {
    type: Boolean,
    default: true,
  },
  /**
   * Enable CRUD operations (delete button shown for agents, commands, skills)
   */
  enableCrud: {
    type: Boolean,
    default: false
  },
  /**
   * Page context scope — used to restrict actions on user-scope items in project view
   * null = unknown context, 'project' = project page, 'user' = user page
   */
  pageScope: {
    type: String,
    default: null,
    validator: (value) => value === null || ['project', 'user'].includes(value)
  },
  /**
   * Project ID — required for MCP toggle functionality in project view
   */
  projectId: {
    type: String,
    default: null
  }
});

const emit = defineEmits({
  'item-selected': (item, itemType) => {
    return item !== null && typeof itemType === 'string' && ['agents', 'commands', 'hooks', 'mcp', 'skills', 'rules'].includes(itemType)
  },
  'copy-clicked': (item) => {
    return item !== null && typeof item === 'object';
  },
  'delete-clicked': (item) => {
    return item !== null && typeof item === 'object';
  },
  'mcp-toggled': (item) => {
    return item !== null && typeof item === 'object';
  }
});

// MCP store for toggle operations
const mcpStore = useMcpStore();

// Track per-server loading state for toggle buttons
const toggleLoadingMap = reactive({});

/**
 * Check if delete button should be shown for an item
 * Show for agents, commands, skills, hooks, and MCP that are not plugins.
 * On the project page, never show delete for user-scope MCP items — they are
 * inherited from the user config and not owned by the project.
 * On the user page, user-scope MCP items can be deleted (they are the user's own).
 */
const canDelete = (item) => {
  if (props.itemType === 'mcp' && item.scope === 'user' && props.pageScope === 'project') {
    return false;
  }
  return props.enableCrud &&
         (props.itemType === 'agents' || props.itemType === 'commands' || props.itemType === 'skills' || props.itemType === 'hooks' || props.itemType === 'mcp' || props.itemType === 'rules') &&
         item.location !== 'plugin';
};

/**
 * Handle delete button click
 */
const handleDeleteClick = (item) => {
  emit('delete-clicked', item);
};

/**
 * Handle copy button click - emit event to parent
 * Adds configType field to identify what kind of config this is
 * Note: For hooks, we preserve the original 'type' field (command/shell/etc)
 */
const handleCopyClick = (item) => {
  // Convert itemType from plural ('agents', 'commands') to singular ('agent', 'command')
  const typeMapping = {
    'agents': 'agent',
    'commands': 'command',
    'hooks': 'hook',
    'mcp': 'mcp',
    'skills': 'skill',
    'rules': 'rule'
  };

  const itemWithType = {
    ...item,
    configType: typeMapping[props.itemType] || props.itemType
  };

  emit('copy-clicked', itemWithType);
};

/**
 * Handle MCP server toggle (enable/disable) from the list
 * Only available in project view (pageScope === 'project')
 */
const handleMcpToggle = async (item) => {
  if (!props.projectId || props.pageScope !== 'project') return;

  const newEnabled = item.status !== 'enabled';
  toggleLoadingMap[item.name] = true;

  try {
    const result = await mcpStore.toggleMcpStatus(props.projectId, item.name, newEnabled);

    if (result.success) {
      // Update the item's status in place so the badge flips immediately
      item.status = result.status;
      emit('mcp-toggled', item);
    }
  } finally {
    toggleLoadingMap[item.name] = false;
  }
};

/**
 * Get the display name for an item based on its type
 */
const getItemName = (item) => {
  // For hooks, prefer 'name' field, then fall back to 'event'
  if (props.itemType === 'hooks') {
    return item.name || item.event || 'Unnamed Hook';
  }

  // For all other types, use the 'name' field
  return item.name || 'Unnamed';
};

/**
 * Get the appropriate description based on item type
 */
const getItemDescription = (item, type) => {
  switch (type) {
    case 'agents':
      return item.description || 'No description available';

    case 'commands':
      return item.description || 'No description available';

    case 'hooks':
      // Display event and pattern information
      const event = item.event || 'N/A';
      const pattern = item.pattern || 'N/A';
      return `Event: ${event} • Pattern: ${pattern}`;

    case 'mcp':
      // Display transport and command information
      const transport = item.transport || 'N/A';
      const command = item.command || 'N/A';
      return `Transport: ${transport} • Command: ${command}`;

    default:
      return 'No details available';
  }
};
</script>

<style scoped>
/* Config Item Card - PrimeVue Card styling */
.config-item-card {
  transition: all 0.2s ease;
}

.config-item-card:hover {
  box-shadow: var(--shadow-card);
}

/* Card Root - Background and border */
:deep(.config-item-card-root) {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  overflow: hidden;
}

.config-item-card:hover :deep(.config-item-card-root) {
  background: var(--bg-hover);
  border-color: var(--color-primary);
}

/* Dark mode - Use primary-hover color for card border on hover */
:global(.dark) .config-item-card:hover :deep(.config-item-card-root) {
  border-color: var(--color-primary-hover);
}

/* Card Header - Bottom border separator */
:deep(.config-item-card-header) {
  padding: 0;
  background: transparent;
  border-bottom: 1px solid var(--border-secondary);
}

/* Card Body - No extra padding (handled by content) */
:deep(.config-item-card-body) {
  padding: 0;
}

/* Card Content - Padding for description */
:deep(.config-item-card-content) {
  padding: 0.75rem 1rem;
}

/* CRUD Buttons - Icon-only styling */
.crud-btn {
  font-size: 0.8rem;
  min-width: 2rem;
}

.crud-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-card);
}

/* MCP Toggle Button */
.mcp-toggle-btn {
  font-size: 0.8rem;
  transition: all 0.2s;
}

.mcp-toggle-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-card);
}

/* Delete Button - Danger outlined button */
.delete-btn {
  font-size: 0.8rem;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: var(--color-error) !important;
  color: white !important;
  transform: translateY(-1px);
  box-shadow: var(--shadow-card);
}

/* View Button - Smaller styling */
.view-btn {
  font-size: 0.8rem;
}

.view-btn:hover {
  background: var(--color-primary);
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: var(--shadow-card);
}

/* Line clamp for description truncation */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Responsive Design - Mobile adjustments */
@media (max-width: 768px) {
  .view-btn {
    flex: 1;
    justify-content: center;
  }
}
</style>
