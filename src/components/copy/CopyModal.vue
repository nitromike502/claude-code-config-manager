<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    :closable="true"
    :closeOnEscape="true"
    :dismissableMask="true"
    :draggable="false"
    appendTo="body"
    class="copy-modal"
    :pt="{
      root: { style: `width: ${modalWidth}; max-width: ${modalMaxWidth}; max-height: 90vh; display: flex; flex-direction: column;` },
      content: { style: 'flex: 1; overflow: hidden; display: flex; flex-direction: column;' },
      mask: { style: 'background-color: var(--overlay-modal-mask)' }
    }"
    @hide="handleDialogHide"
  >
    <template #header>
      <div class="flex items-center gap-3 text-xl font-semibold text-text-emphasis">
        <i class="pi pi-copy text-primary"></i>
        <span>Copy Configuration</span>
      </div>
    </template>

    <!-- External Reference Warning (Skills Only) -->
    <Message
      v-if="hasExternalReferences"
      severity="warn"
      :closable="false"
      class="mb-4"
    >
      <div class="external-ref-warning">
        <h4 class="font-semibold mb-2 flex items-center gap-2">
          <i class="pi pi-exclamation-triangle"></i>
          External References Detected
        </h4>
        <p class="mb-3 text-sm">
          This skill references files outside its directory. These external files
          will <strong>NOT be copied</strong> and the skill may not work correctly
          at the destination.
        </p>

        <div class="external-ref-list mb-3 p-2 bg-bg-secondary rounded max-h-32 overflow-y-auto">
          <div v-for="(ref, index) in externalReferences" :key="index" class="external-ref-item text-xs mb-2">
            <div class="flex items-start gap-2">
              <i class="pi pi-file mt-0.5 text-text-muted"></i>
              <div class="flex-1">
                <code class="bg-bg-tertiary px-1 py-0.5 rounded font-mono">{{ ref.reference }}</code>
                <span class="text-text-muted ml-2">({{ ref.file }}, line {{ ref.line }})</span>
              </div>
            </div>
          </div>
        </div>

        <div class="acknowledgment-checkbox flex items-center gap-2 p-2 bg-bg-tertiary rounded">
          <Checkbox v-model="acknowledgedWarnings" inputId="acknowledge-warnings" binary />
          <label for="acknowledge-warnings" class="text-sm cursor-pointer">
            I understand and want to proceed anyway
          </label>
        </div>
      </div>
    </Message>

    <!-- 2-Column Layout Container -->
    <div class="copy-modal-content flex gap-6 w-full">
      <!-- Left Column: Source Configuration -->
      <div class="flex-none w-2/5 flex flex-col min-w-0">
        <h3 class="text-base font-semibold text-text-emphasis m-0 mb-4 uppercase tracking-wider">Source</h3>

        <!-- Type -->
        <div class="mb-6">
          <div class="flex justify-between items-center">
            <span class="font-semibold text-text-primary text-sm">Type</span>
            <span class="config-type" :class="`type-${sourceConfig.type}`">
              <i :class="getTypeIcon(sourceConfig.type)"></i>
              {{ formatType(sourceConfig.type) }}
            </span>
          </div>
        </div>

        <!-- Name -->
        <div class="mb-6">
          <div class="text-base font-medium text-text-emphasis mb-1 break-words">{{ sourceConfig.name || sourceConfig.event }}</div>
          <div class="text-xs text-text-muted uppercase tracking-wider font-medium">Name</div>
        </div>

        <!-- Project -->
        <div class="mb-6">
          <div class="text-base font-medium text-text-emphasis mb-1 break-words">{{ sourceConfig.projectId || 'User Global' }}</div>
          <div class="text-xs text-text-muted uppercase tracking-wider font-medium">Project</div>
        </div>
      </div>

      <!-- Right Column: Destination Selection -->
      <div class="flex-1 w-3/5 flex flex-col">
        <h3 class="text-base font-semibold text-text-emphasis m-0 mb-4 uppercase tracking-wider">Target</h3>
        <div class="flex-1 overflow-y-auto flex flex-col gap-3 pr-2 destinations-container">
          <!-- User Global Card (hidden when source is from User Global) -->
          <Card
            v-if="!isSourceUserGlobal"
            :class="{ 'selected': selectedDestination?.id === 'user-global' }"
            :pt="{
              root: { class: 'destination-card' },
              header: { class: 'destination-card-header' },
              body: { class: 'destination-card-body' },
              content: { class: 'destination-card-content' }
            }"
            tabindex="0"
            role="button"
            aria-label="Copy to User Global"
            @click="selectDestination({ id: 'user-global', name: 'User Global', path: '~/.claude/', icon: 'pi pi-user' })"
            @keydown="handleKeyDown($event, { id: 'user-global', name: 'User Global', path: '~/.claude/', icon: 'pi pi-user' })"
          >
            <template #header>
              <div class="flex items-center justify-between gap-4 mb-2">
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <i class="pi pi-user text-2xl text-color-primary flex-shrink-0"></i>
                  <h4 class="m-0 text-base font-semibold text-text-emphasis overflow-hidden text-ellipsis whitespace-nowrap">User Global</h4>
                </div>
                <Button
                  label="Copy Here"
                  icon="pi pi-copy"
                  iconPos="left"
                  class="flex-shrink-0"
                  @click.stop="handleButtonCopy({ id: 'user-global', name: 'User Global', path: '~/.claude/', icon: 'pi pi-user' })"
                />
              </div>
            </template>
            <template #content>
              <div class="text-sm text-text-muted mb-4 font-mono">~/.claude/</div>
            </template>
          </Card>

          <!-- Project Cards -->
          <Card
            v-for="project in mockProjects"
            :key="project.id"
            :class="{ 'selected': selectedDestination?.id === project.id }"
            :pt="{
              root: { class: 'destination-card' },
              header: { class: 'destination-card-header' },
              body: { class: 'destination-card-body' },
              content: { class: 'destination-card-content' }
            }"
            tabindex="0"
            role="button"
            :aria-label="`Copy to ${project.name}`"
            @click="selectDestination(project)"
            @keydown="handleKeyDown($event, project)"
          >
            <template #header>
              <div class="flex items-center justify-between gap-4 mb-2">
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <i :class="project.icon + ' text-2xl text-color-primary flex-shrink-0'"></i>
                  <h4 class="m-0 text-base font-semibold text-text-emphasis overflow-hidden text-ellipsis whitespace-nowrap">{{ project.name }}</h4>
                </div>
                <Button
                  label="Copy Here"
                  icon="pi pi-copy"
                  iconPos="left"
                  class="flex-shrink-0"
                  @click.stop="handleButtonCopy(project)"
                />
              </div>
            </template>
            <template #content>
              <div class="text-sm text-text-muted mb-4 font-mono">{{ project.path }}</div>
            </template>
          </Card>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Message from 'primevue/message';
import Checkbox from 'primevue/checkbox';
import { useProjectsStore } from '@/stores/projects';
import { useCopyStore } from '@/stores/copy-store';
import { getTypeIcon, formatType } from '@/utils/typeMapping';

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  sourceConfig: {
    type: Object,
    required: true,
    validator: (value) => {
      // Config items can have either 'name' (agents, commands, MCP, skills) or 'event' (hooks)
      return value && (value.name || value.event) && value.type &&
             ['agent', 'command', 'hook', 'mcp', 'skill'].includes(value.type);
    }
  }
});

const emit = defineEmits(['update:visible', 'copy-success', 'copy-error', 'copy-cancelled']);

// Initialize stores
const projectsStore = useProjectsStore();
const copyStore = useCopyStore();

// Track selected destination
const selectedDestination = ref(null)

// Track acknowledgment of warnings for skills
const acknowledgedWarnings = ref(false);

// Responsive modal width
const windowWidth = ref(window.innerWidth);
const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  window.addEventListener('resize', updateWindowWidth);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateWindowWidth);
});

const modalWidth = computed(() => {
  if (windowWidth.value <= 1024) {
    return '95vw';
  }
  return '70vw';
});

const modalMaxWidth = computed(() => {
  if (windowWidth.value <= 1024) {
    return 'none';
  }
  return '1200px';
});

// Reset selection and load projects when modal opens
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    selectedDestination.value = null;
    acknowledgedWarnings.value = false;
    // Always load fresh project list when modal opens
    await projectsStore.loadProjects();
  }
}, { immediate: true });

// Computed property for v-model binding
const isVisible = computed({
  get() {
    return props.visible;
  },
  set(value) {
    emit('update:visible', value);
  }
});

// Check if source is from User Global (no projectId means user-global)
const isSourceUserGlobal = computed(() => !props.sourceConfig?.projectId);

// Use projects from store, filtering out the source project (can't copy to self)
const availableProjects = computed(() => {
  const sourceProjectId = props.sourceConfig?.projectId;
  if (!sourceProjectId) {
    // Source is user-global, show all projects
    return projectsStore.projects;
  }
  // Filter out the source project from target list
  return projectsStore.projects.filter(project => project.id !== sourceProjectId);
});

// Backwards-compatible alias (used in template)
const mockProjects = availableProjects;

// Check if source has external references (skills only)
const hasExternalReferences = computed(() => {
  return props.sourceConfig?.type === 'skill' &&
         props.sourceConfig?.externalReferences &&
         props.sourceConfig.externalReferences.length > 0;
});

// Get external references list
const externalReferences = computed(() => {
  return props.sourceConfig?.externalReferences || [];
});

// Handle keyboard navigation on destination cards
const handleKeyDown = async (event, destination) => {
  // Handle Enter key to select and copy
  if (event.key === 'Enter') {
    event.preventDefault();
    await selectDestination(destination);
  }
  // Handle Space key to also select and copy (same behavior)
  else if (event.key === ' ') {
    event.preventDefault();
    await selectDestination(destination);
  }
};

// Track if a selection was made
let selectionMade = false;

// Handle Dialog hide event (close button clicked or ESC pressed)
const handleDialogHide = () => {
  // Only emit cancelled if user didn't make a selection
  if (!selectionMade) {
    emit('copy-cancelled');
  }
  selectionMade = false; // Reset for next open
};

// Handle destination selection (selects and triggers copy)
const selectDestination = async (destination) => {
  console.log('Selected destination:', destination);
  // Set selection
  selectedDestination.value = destination;

  // Check if this is a skill with external references
  if (hasExternalReferences.value && !acknowledgedWarnings.value) {
    // Do not proceed with copy - user must acknowledge warnings first
    return;
  }

  // Immediately trigger copy operation
  await handleCopy();
};

// Handle copy action
const handleCopy = async () => {
  if (!selectedDestination.value) {
    return; // No destination selected
  }

  // Check if warnings must be acknowledged first
  if (hasExternalReferences.value && !acknowledgedWarnings.value) {
    return; // User must acknowledge warnings before copy
  }

  try {
    selectionMade = true;

    // Prepare copy request
    const targetScope = selectedDestination.value.id === 'user-global' ? 'user' : 'project';
    const targetProjectId = selectedDestination.value.id === 'user-global' ? null : selectedDestination.value.id;

    const copyRequest = {
      sourceConfig: props.sourceConfig,
      targetScope,
      targetProjectId,
      conflictStrategy: 'skip', // Default strategy; in future, could prompt user
      acknowledgedWarnings: acknowledgedWarnings.value // Include acknowledgment for skills
    };

    // Call copy store to perform the copy operation
    const result = await copyStore.copyConfiguration(copyRequest);

    // Check if there was a conflict
    if (result.conflict) {
      // Future: Could show conflict resolution UI
      // For now, just treat as an error
      emit('copy-error', new Error('Configuration already exists at destination'));
      isVisible.value = false;
      return;
    }

    // Success! Emit with result details
    emit('copy-success', {
      source: props.sourceConfig,
      destination: selectedDestination.value,
      filename: result.filename || props.sourceConfig.name || props.sourceConfig.event,
      copiedPath: result.copiedPath
    });
    isVisible.value = false; // Close modal after success
  } catch (error) {
    emit('copy-error', error);
    isVisible.value = false; // Close modal after error too
  }
};

// Handle "Copy Here" button click (select and copy in one action)
const handleButtonCopy = async (destination) => {
  // Set selection
  selectedDestination.value = destination;
  // Perform copy
  await handleCopy();
};
</script>

<style scoped>
/* Modal Content Layout - Fill container height with internal scrolling */
.copy-modal-content {
  flex: 1;
  min-height: 0; /* Allow flex item to shrink below content size */
  overflow: hidden;
}

/* Config Type Badges - Keep for styling */
.config-type {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-weight: 500;
}

.config-type.type-agent {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.config-type.type-command {
  background: var(--color-info-bg);
  color: var(--color-info);
}

.config-type.type-hook {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}

.config-type.type-mcp {
  background: var(--color-mcp-bg);
  color: var(--color-mcp);
}

.config-type.type-skill {
  background: var(--color-skills-bg);
  color: var(--color-skills);
}

/* Custom scrollbar for destinations container */
.destinations-container::-webkit-scrollbar {
  width: 8px;
}

.destinations-container::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: 4px;
}

.destinations-container::-webkit-scrollbar-thumb {
  background: var(--border-primary);
  border-radius: 4px;
}

.destinations-container::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary);
}

/* Destination Card - PrimeVue Card Overrides */
:deep(.destination-card) {
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--bg-secondary);
  flex-shrink: 0;
}

:deep(.destination-card:hover) {
  background: var(--bg-hover);
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover-sm);
}

:deep(.destination-card:focus) {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

:deep(.selected .destination-card) {
  background: var(--bg-hover);
  border-color: var(--color-primary);
  border-width: 2px;
  box-shadow: var(--shadow-selected);
}

/* PrimeVue Card body/content padding adjustments */
:deep(.destination-card-header) {
  padding: 1rem 1rem 0.5rem 1rem;
}

:deep(.destination-card-body) {
  padding: 0;
}

:deep(.destination-card-content) {
  padding: 0 1rem 1rem 1rem;
}

/* Modal Overlay/Mask */
:deep(.p-dialog-mask) {
  background-color: var(--overlay-modal-mask);
}


/* Close Button Styling */
:deep(.p-dialog-header-close) {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: transparent;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

:deep(.p-dialog-header-close:hover) {
  background: var(--bg-hover);
  color: var(--text-emphasis);
}

:deep(.p-dialog-header-close:focus) {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

</style>
