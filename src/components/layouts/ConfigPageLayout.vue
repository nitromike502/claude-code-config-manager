<template>
  <div class="flex min-h-screen">
    <div class="flex-1 p-4 md:p-8 max-w-[1400px] mx-auto w-full">
      <!-- Breadcrumbs -->
      <BreadcrumbNavigation :items="breadcrumbItems" />

      <!-- Page Info Bar -->
      <div class="mb-8">
        <div class="flex items-center gap-3 text-2xl font-semibold mb-2 text-text-primary">
          <i :class="pageIcon" class="text-[1.75rem]" :style="{ color: pageIconColor }"></i>
          <span>{{ pageTitle }}</span>
        </div>
        <div v-if="pageSubtitle" class="text-sm ml-10 text-text-secondary">{{ pageSubtitle }}</div>
      </div>

      <!-- Loading State -->
      <LoadingState v-if="loading" :message="loadingMessage" />

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12 px-4 rounded-lg mt-8 bg-bg-secondary border border-border-primary">
        <i class="pi pi-exclamation-triangle text-5xl mb-4 text-error"></i>
        <p class="text-base mb-6 text-text-primary">{{ errorMessage }}</p>
        <Button @click="$emit('retry')" label="Retry" icon="pi pi-refresh" severity="danger" />
      </div>

      <!-- Content Area (warnings + config panels) -->
      <div v-else>
        <!-- Warning Banner -->
        <Message v-if="warnings.length > 0" severity="warn" :closable="false" class="mb-6">
          <template #messageicon>
            <i class="pi pi-exclamation-circle text-xl mr-3"></i>
          </template>
          <div>
            <div class="font-semibold mb-2">{{ warnings.length }} Warning{{ warnings.length > 1 ? 's' : '' }}</div>
            <ul class="list-disc ml-4">
              <li v-for="(warning, index) in warnings" :key="index" class="text-sm">
                <template v-if="typeof warning === 'string'">{{ warning }}</template>
                <template v-else>{{ warning.message || warning }}</template>
              </li>
            </ul>
          </div>
        </Message>

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
                :enable-crud="enableAgentCrud"
                @item-selected="(item) => $emit('show-detail', item, 'agents', agents)"
                @copy-clicked="(item) => $emit('copy-clicked', item)"
                @delete-clicked="(item) => $emit('agent-delete', item)"
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

          <!-- Skills Panel -->
          <ConfigPanel
            card-type="skills"
            title="Skills"
            :count="skills.length"
            icon="pi pi-sparkles"
            color="var(--color-skills)"
            :loading="loadingSkills"
            :items="skills"
            :showing-all="showingAllSkills"
            :initial-display-count="initialDisplayCount"
            @toggle-show-all="$emit('toggle-skills')"
          >
            <template #default="{ items }">
              <ConfigItemList
                :items="items"
                item-type="skills"
                @item-selected="(item) => $emit('show-detail', item, 'skills', skills)"
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
      :scope="scope"
      :project-id="projectId"
      :enable-crud="enableAgentCrud"
      @close="$emit('close-sidebar')"
      @navigate="(direction) => $emit('navigate', direction)"
      @copy-clicked="(item) => $emit('copy-clicked', item)"
      @agent-delete="(item) => $emit('agent-delete', item)"
      @agent-updated="$emit('agent-updated')"
    />

    <!-- Copy Modal Slot -->
    <slot name="copy-modal"></slot>
  </div>
</template>

<script setup>
import Button from 'primevue/button'
import Message from 'primevue/message'
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
  loadingSkills: {
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
  skills: {
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
  showingAllSkills: {
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
  enableAgentCrud: {
    type: Boolean,
    default: false
  }
})

defineEmits([
  'retry',
  'toggle-agents',
  'toggle-commands',
  'toggle-hooks',
  'toggle-mcp',
  'toggle-skills',
  'show-detail',
  'close-sidebar',
  'navigate',
  'copy-clicked',
  'agent-delete',
  'agent-updated'
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
