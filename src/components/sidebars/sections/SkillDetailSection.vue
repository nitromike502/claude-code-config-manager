<template>
  <div>
    <!-- Metadata Section -->
    <div class="mb-6">
      <!-- Skill Name (Read-Only - directory name cannot be changed) -->
      <p class="my-2 text-sm text-text-secondary leading-relaxed">
        <strong class="text-text-primary">Name:</strong> {{ selectedItem.name }}
      </p>

      <!-- Skill Description Field -->
      <LabeledEditField
        v-model="skillData.description"
        field-type="textarea"
        label="Description"
        placeholder="Brief description of what this skill does"
        :disabled="!canEdit || editingField !== null && editingField !== 'description'"
        :validation="[{ type: 'required' }, { type: 'minLength', param: 10, message: 'Description must be at least 10 characters' }]"
        @edit-start="updateEditingField('description')"
        @edit-cancel="updateEditingField(null)"
        @edit-accept="handleSkillFieldUpdate('description', $event)"
      />

      <!-- Allowed Tools Field -->
      <LabeledEditField
        v-model="skillData.allowedTools"
        field-type="multiselect"
        label="Allowed Tools"
        :options="toolOptions"
        placeholder="Select allowed tools"
        :disabled="!canEdit || editingField !== null && editingField !== 'allowedTools'"
        @edit-start="updateEditingField('allowedTools')"
        @edit-cancel="updateEditingField(null)"
        @edit-accept="handleSkillFieldUpdate('allowedTools', $event)"
      />

      <!-- Supporting Files (Read-Only Display) -->
      <div v-if="selectedItem.fileCount || selectedItem.files" class="my-3">
        <div class="text-text-primary font-bold text-sm mb-2">Supporting Files (Read-Only)</div>
        <Accordion :value="null" class="skill-structure-accordion">
          <AccordionPanel value="files">
            <AccordionHeader>
              <div class="flex items-center gap-2">
                <i class="pi pi-folder text-color-skills"></i>
                <span class="font-semibold">File Tree</span>
                <span class="text-text-muted text-xs ml-1">({{ selectedItem.fileCount }} files)</span>
              </div>
            </AccordionHeader>
            <AccordionContent>
              <div class="file-tree pl-2">
                <div
                  v-for="(file, index) in selectedItem.files"
                  :key="index"
                  class="file-tree-item"
                  :class="{ 'directory': file.type === 'directory' }"
                  :style="{ paddingLeft: getIndentLevel(file.relativePath) + 'rem' }"
                >
                  <i :class="file.type === 'directory' ? 'pi pi-folder' : 'pi pi-file'"
                     :style="{ color: file.type === 'directory' ? 'var(--color-skills)' : 'var(--text-muted)' }"></i>
                  <span class="text-xs text-text-secondary">{{ file.name }}</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionPanel>
        </Accordion>
      </div>

      <!-- External References Warning -->
      <div v-if="selectedItem.externalReferences && selectedItem.externalReferences.length > 0" class="my-3 p-3 bg-color-warning-bg rounded border border-color-warning">
        <div class="flex items-start gap-2">
          <i class="pi pi-exclamation-triangle text-color-warning mt-0.5 text-lg"></i>
          <div class="flex-1">
            <p class="text-sm font-semibold text-color-warning mb-1">External References Detected</p>
            <p class="text-xs text-text-secondary mb-3">
              This skill contains {{ selectedItem.externalReferences.length }}
              reference{{ selectedItem.externalReferences.length > 1 ? 's' : '' }} to files outside the skill directory, which may affect portability when copying to other projects.
            </p>
            <div class="space-y-2">
              <div v-for="(ref, index) in selectedItem.externalReferences" :key="index" class="bg-bg-primary p-2 rounded text-xs">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-text-muted">Line {{ ref.line }}:</span>
                  <Tag
                    :severity="ref.severity === 'error' ? 'danger' : 'warning'"
                    :value="ref.type?.toUpperCase() || 'REFERENCE'"
                    class="text-[10px] px-1.5 py-0.5"
                  />
                </div>
                <code class="block bg-bg-secondary px-2 py-1 rounded font-mono text-text-secondary break-all">{{ ref.reference }}</code>
                <p class="text-text-muted mt-1">in {{ ref.file }}</p>
              </div>
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

    <!-- Content Section -->
    <div v-if="selectedItem?.content">
      <LabeledEditField
        v-model="skillData.content"
        field-type="textarea"
        label="Content"
        placeholder="The skill's markdown content (instructions, examples, etc.)"
        :disabled="!canEdit || editingField !== null && editingField !== 'content'"
        :validation="[{ type: 'required' }, { type: 'minLength', param: 10, message: 'Content must be at least 10 characters' }]"
        @edit-start="updateEditingField('content')"
        @edit-cancel="updateEditingField(null)"
        @edit-accept="handleSkillFieldUpdate('content', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useSkillsStore } from '@/stores/skills'
import LabeledEditField from '@/components/forms/LabeledEditField.vue'
import { TOOL_OPTIONS } from '@/constants/form-options'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'
import Tag from 'primevue/tag'

const props = defineProps({
  selectedItem: {
    type: Object,
    required: true
  },
  canEdit: {
    type: Boolean,
    default: false
  },
  editingField: {
    type: String,
    default: null
  },
  projectId: {
    type: String,
    default: null
  },
  scope: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['field-update', 'update:editing-field', 'skill-updated'])

const skillsStore = useSkillsStore()

// Skill editing state
const skillData = ref({
  name: '',
  description: '',
  allowedTools: [],
  content: ''
})

// Use constants from form-options
const toolOptions = TOOL_OPTIONS

// Update editing field (emit to parent)
const updateEditingField = (fieldName) => {
  emit('update:editing-field', fieldName)
}

// Handle skill field update
const handleSkillFieldUpdate = async (fieldName, newValue) => {
  if (!props.canEdit) return

  try {
    // Build updates object with just the changed field
    const updates = { [fieldName]: newValue }

    // Extract skill directory name from directoryPath
    // Skills are identified by their directory name (e.g., 'write-file'), not display name
    const skillDirName = props.selectedItem.directoryPath
      ? props.selectedItem.directoryPath.split('/').pop()
      : props.selectedItem.name

    // Call API through store
    const result = await skillsStore.updateSkill(
      props.projectId,
      skillDirName,
      updates,
      props.scope
    )

    if (result.success) {
      // Update local skillData
      skillData.value[fieldName] = newValue

      // Notify parent that skill was updated
      emit('skill-updated')
    }
  } finally {
    updateEditingField(null)
  }
}

// Watch for changes to selectedItem
watch(() => props.selectedItem, (newItem) => {
  if (newItem) {
    skillData.value = {
      name: newItem.name || '',
      description: newItem.description || '',
      allowedTools: newItem.allowedTools || [],
      content: newItem.content || ''
    }
    updateEditingField(null)
  }
}, { immediate: true })

// Helper: Calculate indent level for file tree
const getIndentLevel = (relativePath) => {
  if (!relativePath) return 0
  const depth = (relativePath.match(/\//g) || []).length
  return depth * 1.25 // 1.25rem per level
}
</script>

<style scoped>
.skill-structure-accordion {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.file-tree {
  background: var(--bg-primary);
  border-radius: 4px;
  padding: 0.5rem;
}

.file-tree-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  transition: background 0.2s;
}

.file-tree-item:hover {
  background: var(--bg-hover);
  border-radius: 4px;
}

.file-tree-item.directory {
  font-weight: 500;
}
</style>
