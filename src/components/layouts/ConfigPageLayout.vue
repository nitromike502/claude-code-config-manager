<template>
  <div class="flex min-h-screen">
    <div class="flex-1 p-4 md:p-8 max-w-[1400px] mx-auto w-full">
      <!-- Breadcrumbs -->
      <BreadcrumbNavigation :items="breadcrumbItems" />

      <!-- Page Info Bar -->
      <div class="mb-8">
        <div class="flex items-center gap-3 text-2xl font-semibold mb-2" style="color: var(--text-primary)">
          <i :class="pageIcon" class="text-[1.75rem]" :style="{ color: pageIconColor }"></i>
          <span>{{ pageTitle }}</span>
        </div>
        <div v-if="pageSubtitle" class="text-sm ml-10" style="color: var(--text-secondary)">{{ pageSubtitle }}</div>
      </div>

      <!-- Loading State -->
      <LoadingState v-if="loading" :message="loadingMessage" />

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12 px-4 rounded-lg mt-8" style="background: var(--bg-secondary); border: 1px solid var(--border-primary)">
        <i class="pi pi-exclamation-triangle text-5xl mb-4" style="color: var(--color-error)"></i>
        <p class="text-base mb-6" style="color: var(--text-primary)">{{ errorMessage }}</p>
        <Button @click="$emit('retry')" label="Retry" icon="pi pi-refresh" severity="danger" />
      </div>

      <!-- Content Area (warnings + config panels) -->
      <div v-else>
        <!-- Warning Banner -->
        <div v-if="warnings.length > 0" class="rounded-lg p-4 md:p-6 mb-6" style="background: var(--color-warning-bg); border: 1px solid var(--color-warning)">
          <div class="flex items-center gap-3 font-semibold mb-2" style="color: var(--color-warning)">
            <i class="pi pi-exclamation-circle text-xl"></i>
            <span>{{ warnings.length }} Warning{{ warnings.length > 1 ? 's' : '' }}</span>
          </div>
          <ul class="list-disc ml-8" style="color: var(--color-warning)">
            <li v-for="(warning, index) in warnings" :key="index" class="my-1 text-sm">
              <template v-if="typeof warning === 'string'">{{ warning }}</template>
              <template v-else>{{ warning.message || warning }}</template>
            </li>
          </ul>
        </div>

        <!-- Config Panels Container -->
        <div class="grid gap-6 xl:grid-cols-2">
          <!-- Agents Panel -->
          <ConfigPanel
            card-type="agents"
            title="Subagents"
            :count="agents.length"
            icon="pi pi-users"
            color="var(--color-agents)"
            :loading="loadingAgents"
            :items="agents"
            :showing-all="showingAllAgents"
            :initial-display-count="initialDisplayCount"
            @toggle-show-all="$emit('toggle-agents')"
          >
            <template #default="{ items }">
              <ConfigItemList
                :items="items"
                item-type="agents"
                @item-selected="(item) => $emit('show-detail', item, 'agents', agents)"
                @copy-clicked="(item) => $emit('copy-clicked', item)"
              />
            </template>
          </ConfigPanel>

          <!-- Commands Panel -->
          <ConfigPanel
            card-type="commands"
            title="Slash Commands"
            :count="commands.length"
            icon="pi pi-bolt"
            color="var(--color-commands)"
            :loading="loadingCommands"
            :items="commands"
            :showing-all="showingAllCommands"
            :initial-display-count="initialDisplayCount"
            @toggle-show-all="$emit('toggle-commands')"
          >
            <template #default="{ items }">
              <ConfigItemList
                :items="items"
                item-type="commands"
                @item-selected="(item) => $emit('show-detail', item, 'commands', commands)"
                @copy-clicked="(item) => $emit('copy-clicked', item)"
              />
            </template>
          </ConfigPanel>

          <!-- Hooks Panel -->
          <ConfigPanel
            card-type="hooks"
            title="Hooks"
            :count="hooks.length"
            icon="pi pi-link"
            color="var(--color-hooks)"
            :loading="loadingHooks"
            :items="hooks"
            :showing-all="showingAllHooks"
            :initial-display-count="initialDisplayCount"
            @toggle-show-all="$emit('toggle-hooks')"
          >
            <template #default="{ items }">
              <ConfigItemList
                :items="items"
                item-type="hooks"
                @item-selected="(item) => $emit('show-detail', item, 'hooks', hooks)"
                @copy-clicked="(item) => $emit('copy-clicked', item)"
              />
            </template>
          </ConfigPanel>

          <!-- MCP Servers Panel -->
          <ConfigPanel
            card-type="mcp"
            title="MCP Servers"
            :count="mcpServers.length"
            icon="pi pi-server"
            color="var(--color-mcp)"
            :loading="loadingMcp"
            :items="mcpServers"
            :showing-all="showingAllMcp"
            :initial-display-count="initialDisplayCount"
            @toggle-show-all="$emit('toggle-mcp')"
          >
            <template #default="{ items }">
              <ConfigItemList
                :items="items"
                item-type="mcp"
                @item-selected="(item) => $emit('show-detail', item, 'mcp', mcpServers)"
                @copy-clicked="(item) => $emit('copy-clicked', item)"
              />
            </template>
          </ConfigPanel>
        </div>
      </div>
    </div>

    <!-- Sidebar Overlay -->
    <div
      v-if="sidebarVisible"
      class="fixed inset-0 z-[999] animate-fade-in"
      style="background: rgba(0, 0, 0, 0.5)"
      @click="$emit('close-sidebar')"
    ></div>

    <!-- Detail Sidebar Component -->
    <ConfigDetailSidebar
      :visible="sidebarVisible"
      :selected-item="selectedItem"
      :selected-type="selectedType"
      :current-items="currentItems"
      :selected-index="selectedIndex"
      @close="$emit('close-sidebar')"
      @navigate="(direction) => $emit('navigate', direction)"
      @copy-clicked="(item) => $emit('copy-clicked', item)"
    />

    <!-- Copy Modal Slot -->
    <slot name="copy-modal"></slot>
  </div>
</template>

<script setup>
import Button from 'primevue/button'
import ConfigPanel from '@/components/cards/ConfigPanel.vue'
import ConfigItemList from '@/components/cards/ConfigItemList.vue'
import BreadcrumbNavigation from '@/components/common/BreadcrumbNavigation.vue'
import ConfigDetailSidebar from '@/components/sidebars/ConfigDetailSidebar.vue'
import LoadingState from '@/components/common/LoadingState.vue'

defineProps({
  // Page header props
  pageTitle: {
    type: String,
    required: true
  },
  pageSubtitle: {
    type: String,
    default: ''
  },
  pageIcon: {
    type: String,
    required: true
  },
  pageIconColor: {
    type: String,
    default: 'var(--color-primary)'
  },
  breadcrumbItems: {
    type: Array,
    required: true
  },

  // Loading states
  loading: {
    type: Boolean,
    default: false
  },
  loadingMessage: {
    type: String,
    default: 'Loading...'
  },
  loadingAgents: {
    type: Boolean,
    default: false
  },
  loadingCommands: {
    type: Boolean,
    default: false
  },
  loadingHooks: {
    type: Boolean,
    default: false
  },
  loadingMcp: {
    type: Boolean,
    default: false
  },

  // Error state
  error: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: ''
  },

  // Warnings
  warnings: {
    type: Array,
    default: () => []
  },

  // Config data arrays
  agents: {
    type: Array,
    default: () => []
  },
  commands: {
    type: Array,
    default: () => []
  },
  hooks: {
    type: Array,
    default: () => []
  },
  mcpServers: {
    type: Array,
    default: () => []
  },

  // Show all toggles
  showingAllAgents: {
    type: Boolean,
    default: false
  },
  showingAllCommands: {
    type: Boolean,
    default: false
  },
  showingAllHooks: {
    type: Boolean,
    default: false
  },
  showingAllMcp: {
    type: Boolean,
    default: false
  },
  initialDisplayCount: {
    type: Number,
    default: 5
  },

  // Sidebar state
  sidebarVisible: {
    type: Boolean,
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

defineEmits([
  'retry',
  'toggle-agents',
  'toggle-commands',
  'toggle-hooks',
  'toggle-mcp',
  'show-detail',
  'close-sidebar',
  'navigate',
  'copy-clicked'
])
</script>

<style scoped>
/* Sidebar animation for fade-in */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease;
}
</style>
