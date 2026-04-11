<template>
  <div v-if="scope" class="flex items-center gap-2">
    <Tag v-if="scope === 'project'" severity="info" value="Project" class="mcp-tag" />
    <Tag v-else-if="scope === 'user'" severity="secondary" value="User" class="mcp-tag" />
    <Tag v-if="status === 'enabled'" severity="success" value="Enabled" class="mcp-tag" />
    <Tag v-else-if="status === 'disabled'" severity="danger" value="Disabled" class="mcp-tag" />
  </div>
</template>

<script setup>
import Tag from 'primevue/tag'

defineProps({
  scope: {
    type: String,
    default: null
  },
  status: {
    type: String,
    default: null
  }
})
</script>

<style scoped>
.mcp-tag {
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  white-space: nowrap;
  flex-shrink: 0;
}

:deep(.p-tag) {
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
}
</style>
