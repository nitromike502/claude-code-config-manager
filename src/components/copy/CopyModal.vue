<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    :closable="true"
    :style="{ width: '50vw' }"
    :draggable="false"
    class="copy-modal"
    @hide="handleDialogHide"
  >
    <template #header>
      <div class="modal-header">
        <i class="pi pi-copy" style="color: var(--color-primary)"></i>
        <span>Copy Configuration</span>
      </div>
    </template>

    <!-- Source Configuration Section -->
    <div class="source-section">
      <h3 class="section-title">Source Configuration</h3>
      <div class="source-info">
        <div class="info-row">
          <span class="info-label">Filename:</span>
          <span class="info-value">{{ sourceConfig.name || sourceConfig.event }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Type:</span>
          <span class="info-value config-type" :class="`type-${sourceConfig.type}`">
            <i :class="getTypeIcon(sourceConfig.type)"></i>
            {{ formatType(sourceConfig.type) }}
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">Current Location:</span>
          <span class="info-value">{{ sourceConfig.path || 'User Global' }}</span>
        </div>
      </div>
    </div>

    <!-- Divider -->
    <Divider />

    <!-- Destination Section -->
    <div class="destination-section">
      <h3 class="section-title">Select Destination</h3>

      <!-- User Global Card -->
      <div
        class="destination-card"
        :class="{ 'selected': selectedDestination?.id === 'user-global' }"
        tabindex="0"
        role="button"
        aria-label="Copy to User Global"
        @click="selectDestination({ id: 'user-global', name: 'User Global', path: '~/.claude/', icon: 'pi pi-user' })"
        @keydown="handleKeyDown($event, { id: 'user-global', name: 'User Global', path: '~/.claude/', icon: 'pi pi-user' })"
      >
        <div class="card-header">
          <i class="pi pi-user card-icon"></i>
          <h4 class="card-name">User Global</h4>
        </div>
        <div class="card-path">~/.claude/</div>
        <Button
          label="Copy Here"
          icon="pi pi-copy"
          class="card-button"
          @click.stop="handleButtonCopy({ id: 'user-global', name: 'User Global', path: '~/.claude/', icon: 'pi pi-user' })"
        />
      </div>

      <!-- Project Cards Container -->
      <div class="projects-container">
        <div
          v-for="project in mockProjects"
          :key="project.id"
          class="destination-card"
          :class="{ 'selected': selectedDestination?.id === project.id }"
          tabindex="0"
          role="button"
          :aria-label="`Copy to ${project.name}`"
          @click="selectDestination(project)"
          @keydown="handleKeyDown($event, project)"
        >
          <div class="card-header">
            <i :class="project.icon + ' card-icon'"></i>
            <h4 class="card-name">{{ project.name }}</h4>
          </div>
          <div class="card-path">{{ project.path }}</div>
          <Button
            label="Copy Here"
            icon="pi pi-copy"
            class="card-button"
            @click.stop="handleButtonCopy(project)"
          />
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Divider from 'primevue/divider';
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

/* Source Section */
.source-section {
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-emphasis);
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.source-info {
  background: var(--bg-tertiary);
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid var(--border-primary);
}

.info-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-weight: 600;
  color: var(--text-primary);
  min-width: 140px;
}

.info-value {
  color: var(--text-secondary);
  word-break: break-all;
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

/* Destination Section */
.destination-section {
  margin-top: 1rem;
}

/* Destination Card */
.destination-card {
  padding: 1rem;
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--bg-secondary);
  margin-bottom: 0.75rem;
}

.destination-card:last-child {
  margin-bottom: 0;
}

.destination-card:hover {
  background: var(--bg-hover);
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.destination-card:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.destination-card.selected {
  background: var(--bg-hover);
  border-color: var(--color-primary);
  border-width: 2px;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.card-icon {
  font-size: 1.5rem;
  color: var(--color-primary);
}

.card-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-emphasis);
}

.card-path {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
  font-family: 'Courier New', monospace;
}

.card-button {
  width: 100%;
}

/* Projects Container (Scrollable) */
.projects-container {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-right: 0.5rem;
}

/* Custom scrollbar for projects container */
.projects-container::-webkit-scrollbar {
  width: 8px;
}

.projects-container::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: 4px;
}

.projects-container::-webkit-scrollbar-thumb {
  background: var(--border-primary);
  border-radius: 4px;
}

.projects-container::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary);
}

/* Divider spacing */
:deep(.p-divider) {
  margin: 1.5rem 0;
}

/* Responsive */
@media (max-width: 1024px) {
  :deep(.p-dialog) {
    width: 70vw !important;
  }
}

@media (max-width: 768px) {
  :deep(.p-dialog) {
    width: 90vw !important;
  }

  .info-row {
    flex-direction: column;
    gap: 0.25rem;
  }

  .info-label {
    min-width: unset;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  :deep(.p-dialog) {
    width: 95vw !important;
  }

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
