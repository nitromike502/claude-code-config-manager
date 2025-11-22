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
      root: { style: `width: ${modalWidth}; max-width: ${modalMaxWidth}` },
      mask: { style: 'background-color: var(--overlay-modal-mask)' }
    }"
    @hide="handleDialogHide"
  >
    <template #header>
      <div class="modal-header">
        <i class="pi pi-copy" style="color: var(--color-primary)"></i>
        <span>Copy Configuration</span>
      </div>
    </template>

    <!-- 2-Column Layout Container -->
    <div class="modal-body">
      <!-- Left Column: Source Configuration -->
      <div class="source-column">
        <h3 class="section-title">Source</h3>

        <!-- Type -->
        <div class="source-field">
          <div class="field-row">
            <span class="field-label">Type</span>
            <span class="config-type" :class="`type-${sourceConfig.type}`">
              <i :class="getTypeIcon(sourceConfig.type)"></i>
              {{ formatType(sourceConfig.type) }}
            </span>
          </div>
        </div>

        <!-- Name -->
        <div class="source-field">
          <div class="field-value">{{ sourceConfig.name || sourceConfig.event }}</div>
          <div class="field-sublabel">Name</div>
        </div>

        <!-- Project -->
        <div class="source-field">
          <div class="field-value">{{ sourceConfig.projectId || 'User Global' }}</div>
          <div class="field-sublabel">Project</div>
        </div>
      </div>

      <!-- Right Column: Destination Selection -->
      <div class="destination-column">
        <h3 class="section-title">Target</h3>
        <div class="destinations-container">
          <!-- User Global Card -->
          <Card
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
              <div class="card-header">
                <div class="card-title">
                  <i class="pi pi-user card-icon"></i>
                  <h4 class="card-name">User Global</h4>
                </div>
                <Button
                  label="Copy Here"
                  icon="pi pi-copy"
                  iconPos="left"
                  class="card-button"
                  @click.stop="handleButtonCopy({ id: 'user-global', name: 'User Global', path: '~/.claude/', icon: 'pi pi-user' })"
                />
              </div>
            </template>
            <template #content>
              <div class="card-path">~/.claude/</div>
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
              <div class="card-header">
                <div class="card-title">
                  <i :class="project.icon + ' card-icon'"></i>
                  <h4 class="card-name">{{ project.name }}</h4>
                </div>
                <Button
                  label="Copy Here"
                  icon="pi pi-copy"
                  iconPos="left"
                  class="card-button"
                  @click.stop="handleButtonCopy(project)"
                />
              </div>
            </template>
            <template #content>
              <div class="card-path">{{ project.path }}</div>
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
import { useProjectsStore } from '@/stores/projects';
import { useCopyStore } from '@/stores/copy-store';

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  sourceConfig: {
    type: Object,
    required: true,
    validator: (value) => {
      // Config items can have either 'name' (agents, commands, MCP) or 'event' (hooks)
      return value && (value.name || value.event) && value.type &&
             ['agent', 'command', 'hook', 'mcp'].includes(value.type);
    }
  }
});

const emit = defineEmits(['update:visible', 'copy-success', 'copy-error', 'copy-cancelled']);

// Initialize stores
const projectsStore = useProjectsStore();
const copyStore = useCopyStore();

// Track selected destination
const selectedDestination = ref(null);

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

// Use projects from store instead of mock data
const mockProjects = computed(() => projectsStore.projects);

// Get icon for configuration type
const getTypeIcon = (type) => {
  const icons = {
    agent: 'pi pi-users',
    command: 'pi pi-bolt',
    hook: 'pi pi-link',
    mcp: 'pi pi-server'
  };
  return icons[type] || 'pi pi-file';
};

// Format type for display
const formatType = (type) => {
  const formats = {
    agent: 'Agent',
    command: 'Command',
    hook: 'Hook',
    mcp: 'MCP Server'
  };
  return formats[type] || type;
};

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

  // Immediately trigger copy operation
  await handleCopy();
};

// Handle copy action
const handleCopy = async () => {
  if (!selectedDestination.value) {
    return; // No destination selected
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
      conflictStrategy: 'skip' // Default strategy; in future, could prompt user
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
/* Modal Header */
.modal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-emphasis);
}

.modal-header i {
  font-size: 1.5rem;
}

/* 2-Column Layout */
.modal-body {
  display: flex;
  gap: 1.5rem;
  min-height: 400px;
  max-height: 600px;
  width: 100%;
}

/* Left Column - Source */
.source-column {
  flex: 0 0 40%;
  display: flex;
  flex-direction: column;
  min-width: 0; /* Allows content to wrap/truncate if needed */
}

/* Right Column - Destination */
.destination-column {
  flex: 1 1 60%;
  display: flex;
  flex-direction: column;
  min-width: 0; /* Allows flex item to shrink below content size */
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-emphasis);
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Source Fields */
.source-field {
  margin-bottom: 1.5rem;
}

.source-field:last-child {
  margin-bottom: 0;
}

/* Type field - 50/50 layout */
.field-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.field-label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.875rem;
}

/* Name and Project fields - value on top, label below */
.field-value {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-emphasis);
  margin-bottom: 0.25rem;
  word-break: break-word;
}

.field-sublabel {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

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

/* Destinations Container (Scrollable) */
.destinations-container {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-right: 0.5rem;
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

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0; /* Allow text to truncate if needed */
}

.card-icon {
  font-size: 1.5rem;
  color: var(--color-primary);
  flex-shrink: 0;
}

.card-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-emphasis);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-path {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
  font-family: 'Courier New', monospace;
}

.card-button {
  flex-shrink: 0;
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

/* Modal Width - Responsive */
.copy-modal :deep(.p-dialog) {
  width: 70vw !important; /* Laptop - larger modal */
  max-width: 1200px !important;
}

/* Tablet and smaller - full width */
@media (max-width: 1024px) {
  .copy-modal :deep(.p-dialog) {
    width: 95vw !important;
    max-width: none !important;
  }
}

/* Tablet - adjust layout */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

/* Mobile - smaller text */
@media (max-width: 480px) {
  .modal-header {
    font-size: 1rem;
  }

  .modal-header i {
    font-size: 1.25rem;
  }

  .section-title {
    font-size: 0.9rem;
  }
}
</style>
