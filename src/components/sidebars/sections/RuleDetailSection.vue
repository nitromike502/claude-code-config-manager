<template>
  <div>
    <!-- Metadata Section -->
    <div class="mb-6">
      <h4 class="mb-3 text-sm font-semibold text-text-primary uppercase tracking-wider">Metadata</h4>

      <!-- Rule Name (Read-Only) -->
      <p class="my-2 text-sm text-text-secondary leading-relaxed">
        <strong class="text-text-primary">Name:</strong> {{ selectedItem.name }}
      </p>

      <!-- Description -->
      <p v-if="selectedItem.description" class="my-2 text-sm text-text-secondary leading-relaxed">
        <strong class="text-text-primary">Description:</strong> {{ selectedItem.description }}
      </p>

      <!-- Conditional Badge -->
      <div class="my-3 flex items-center gap-2">
        <strong class="text-text-primary text-sm">Type:</strong>
        <Tag
          v-if="selectedItem.isConditional"
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

      <!-- Path Patterns -->
      <div v-if="selectedItem.paths && selectedItem.paths.length > 0" class="my-3">
        <div class="text-text-primary font-bold text-sm mb-2">Path Patterns</div>
        <div class="bg-bg-primary p-3 rounded border border-border-primary">
          <div
            v-for="(pattern, index) in selectedItem.paths"
            :key="index"
            class="flex items-center gap-2 py-1"
          >
            <i class="pi pi-folder text-xs" style="color: var(--color-rules)"></i>
            <code class="text-xs font-mono text-text-secondary">{{ pattern }}</code>
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
    <div v-if="selectedItem?.content" class="mb-6">
      <h4 class="mb-3 text-sm font-semibold text-text-primary uppercase tracking-wider">Content</h4>
      <pre class="bg-bg-primary p-4 rounded border border-border-primary font-mono text-xs whitespace-pre-wrap break-words overflow-x-auto max-h-[400px] overflow-y-auto text-text-primary">{{ selectedItem.content }}</pre>
    </div>
  </div>
</template>

<script setup>
import Tag from 'primevue/tag'

defineProps({
  selectedItem: {
    type: Object,
    required: true
  },
  canEdit: {
    type: Boolean,
    default: false
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
</script>
