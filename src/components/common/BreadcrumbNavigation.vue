<template>
  <nav class="breadcrumbs" aria-label="Breadcrumb">
    <Breadcrumb :model="breadcrumbItems" :home="homeItem">
      <template #item="{ item, props }">
        <router-link
          v-if="item.to"
          :to="item.to"
          v-bind="props.action"
          class="breadcrumb-link"
        >
          <i v-if="item.icon" :class="item.icon"></i>
          <span class="breadcrumb-label">{{ item.label }}</span>
        </router-link>
        <span v-else v-bind="props.action" class="breadcrumb-current">
          <i v-if="item.icon" :class="item.icon"></i>
          <span class="breadcrumb-label">{{ item.label }}</span>
        </span>
      </template>
    </Breadcrumb>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import Breadcrumb from 'primevue/breadcrumb'

const props = defineProps({
  items: {
    type: Array,
    required: true,
    validator: (items) => {
      // Validate each item has a label string
      // route can be undefined, null (current page), or string (link)
      return items.every(item => {
        const hasValidLabel = item.label && typeof item.label === 'string'
        const hasValidRoute = item.route === undefined || item.route === null || typeof item.route === 'string'
        return hasValidLabel && hasValidRoute
      })
    }
  }
})

// Separate first item as "home" for PrimeVue Breadcrumb home prop
// Convert route → to (PrimeVue MenuItem property)
const homeItem = computed(() => {
  if (props.items.length === 0) return null
  const first = props.items[0]
  return {
    label: first.label,
    to: first.route,
    icon: first.icon || 'pi pi-home'
  }
})

// Remaining items for breadcrumb model
// Convert route → to (PrimeVue MenuItem property)
const breadcrumbItems = computed(() => {
  if (props.items.length <= 1) return []
  return props.items.slice(1).map(item => ({
    label: item.label,
    to: item.route,
    icon: item.icon
  }))
})
</script>

<style scoped>
.breadcrumbs {
  margin-bottom: 1.5rem;
}

.breadcrumb-link,
.breadcrumb-current {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: color 0.2s ease;
}

.breadcrumb-link {
  color: var(--color-primary);
  text-decoration: none;
}

.breadcrumb-link:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

.breadcrumb-link:focus {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
  border-radius: 2px;
}

.breadcrumb-current {
  color: var(--text-primary);
  cursor: default;
}

.breadcrumb-link i,
.breadcrumb-current i {
  font-size: 0.85rem;
}

.breadcrumb-label {
  font-size: 0.9rem;
}

/* PrimeVue Breadcrumb overrides */
:deep(.p-breadcrumb) {
  background: transparent;
  border: none;
  padding: 0.75rem 0;
}

:deep(.p-breadcrumb-list) {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

:deep(.p-breadcrumb-separator) {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

/* Responsive */
@media (max-width: 768px) {
  .breadcrumb-label {
    font-size: 0.85rem;
  }

  .breadcrumb-link i,
  .breadcrumb-current i {
    font-size: 0.8rem;
  }

  :deep(.p-breadcrumb) {
    padding: 0.5rem 0;
  }

  :deep(.p-breadcrumb-separator) {
    font-size: 0.65rem;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .breadcrumb-link {
    text-decoration: underline;
  }

  .breadcrumb-link:hover {
    text-decoration: underline;
    text-decoration-thickness: 2px;
  }
}
</style>
