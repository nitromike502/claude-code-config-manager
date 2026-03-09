<template>
  <div>
    <!-- Metadata Section -->
    <div class="mb-6">
      <h4 class="mb-3 text-sm font-semibold text-text-primary uppercase tracking-wider">Metadata</h4>

      <!-- Name Field -->
      <LabeledEditField
        v-model="ruleData.name"
        field-type="text"
        label="Name"
        placeholder="rule-name"
        :disabled="!canEdit || editingField !== null && editingField !== 'name'"
        :validation="[{ type: 'required' }]"
        @edit-start="handleEditStart('name')"
        @edit-cancel="handleEditCancel"
        @edit-accept="handleFieldUpdate('name', $event)"
      />

      <!-- Description (read-only, derived from content) -->
      <p v-if="ruleData.description" class="my-2 text-sm text-text-secondary leading-relaxed">
        <strong class="text-text-primary">Description:</strong> {{ ruleData.description }}
      </p>

      <!-- Conditional Badge -->
      <div class="my-3 flex items-center gap-2">
        <strong class="text-text-primary text-sm">Type:</strong>
        <Tag
          v-if="ruleData.isConditional"
          value="Conditional"
          severity="warning"
          class="text-xs"
        />
        <Tag
          v-else
          value="Global"
          severity="info"
          class="text-xs"
        />
      </div>

      <!-- Path Patterns (editable one-to-many) -->
      <div class="my-3">
        <div class="text-text-primary font-bold text-sm mb-2">Path Patterns</div>
        <div v-if="canEdit" class="paths-editor">
          <div
            v-for="(pattern, index) in ruleData.paths"
            :key="index"
            class="flex items-center gap-2 mb-2"
          >
            <i class="pi pi-folder text-xs flex-shrink-0" style="color: var(--color-rules)"></i>
            <InputText
              v-model="ruleData.paths[index]"
              class="flex-1 font-mono text-xs"
              placeholder="src/**/*.ts"
              @blur="handlePathsUpdate"
              @keydown.enter="handlePathsUpdate"
            />
            <Button
              icon="pi pi-trash"
              text
              severity="danger"
              class="path-remove-btn"
              aria-label="Remove path"
              @click="removePath(index)"
            />
          </div>
          <Button
            icon="pi pi-plus"
            label="Add path"
            text
            size="small"
            class="mt-1"
            @click="addPath"
          />
          <small class="text-text-tertiary text-xs mt-1 block">
            Glob patterns that determine when this rule is active.
          </small>
        </div>
        <div v-else-if="ruleData.paths && ruleData.paths.length > 0" class="bg-bg-primary p-3 rounded border border-border-primary">
          <div
            v-for="(pattern, index) in ruleData.paths"
            :key="index"
            class="flex items-center gap-2 py-1"
          >
            <i class="pi pi-folder text-xs" style="color: var(--color-rules)"></i>
            <code class="text-xs font-mono text-text-secondary">{{ pattern }}</code>
          </div>
        </div>
        <p v-else class="text-sm text-text-tertiary italic">No path patterns (global rule)</p>
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
    <div class="mb-6">
      <h4 class="mb-3 text-sm font-semibold text-text-primary uppercase tracking-wider">Content</h4>

      <LabeledEditField
        v-model="ruleData.content"
        field-type="textarea"
        label="Content"
        placeholder="Rule content (markdown)"
        :disabled="!canEdit || editingField !== null && editingField !== 'content'"
        :validation="[{ type: 'required' }]"
        @edit-start="handleEditStart('content')"
        @edit-cancel="handleEditCancel"
        @edit-accept="handleFieldUpdate('content', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import LabeledEditField from '@/components/forms/LabeledEditField.vue'
import { useRulesStore } from '@/stores/rules'

const rulesStore = useRulesStore()

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

const emit = defineEmits(['field-update', 'update:editing-field', 'rule-updated'])

// Local editing field state
const editingField = ref(null)

// Rule data ref
const ruleData = ref({
  name: '',
  description: '',
  paths: [],
  isConditional: false,
  content: ''
})

// Watch for selectedItem changes to update ruleData
watch(() => props.selectedItem, (newItem) => {
  if (newItem) {
    ruleData.value = {
      name: newItem.name || '',
      description: newItem.description || '',
      paths: newItem.paths ? [...newItem.paths] : [],
      isConditional: newItem.isConditional || false,
      content: newItem.content || ''
    }
    editingField.value = null
  }
}, { immediate: true })

// Handle edit start
const handleEditStart = (fieldName) => {
  editingField.value = fieldName
  emit('update:editing-field', fieldName)
}

// Handle edit cancel
const handleEditCancel = () => {
  editingField.value = null
  emit('update:editing-field', null)
}

// Handle field update (called when LabeledEditField saves)
const handleFieldUpdate = async (fieldName, newValue) => {
  if (!props.canEdit) return

  try {
    const updates = { [fieldName]: newValue }

    const result = await rulesStore.updateRule(
      props.projectId,
      props.selectedItem.name,
      updates,
      props.scope
    )

    if (result.success) {
      ruleData.value[fieldName] = newValue

      // Update conditional status based on paths
      if (fieldName === 'paths') {
        ruleData.value.isConditional = Array.isArray(newValue) && newValue.length > 0
      }

      emit('rule-updated')
    }
  } finally {
    editingField.value = null
    emit('update:editing-field', null)
  }
}

// Path management
const addPath = () => {
  ruleData.value.paths.push('')
}

const removePath = (index) => {
  ruleData.value.paths.splice(index, 1)
  handlePathsUpdate()
}

const handlePathsUpdate = async () => {
  if (!props.canEdit) return

  // Filter out empty paths
  const cleanPaths = ruleData.value.paths
    .map(p => p.trim())
    .filter(p => p !== '')

  // Update local state
  ruleData.value.paths = cleanPaths.length > 0 ? cleanPaths : []
  ruleData.value.isConditional = cleanPaths.length > 0

  try {
    const updates = { paths: cleanPaths.length > 0 ? cleanPaths : null }

    const result = await rulesStore.updateRule(
      props.projectId,
      props.selectedItem.name,
      updates,
      props.scope
    )

    if (result.success) {
      emit('rule-updated')
    }
  } catch (err) {
    // Error is handled by the store
  }
}
</script>

<style scoped>
.paths-editor .path-remove-btn {
  width: 1.75rem !important;
  height: 1.75rem !important;
  padding: 0 !important;
}
</style>
