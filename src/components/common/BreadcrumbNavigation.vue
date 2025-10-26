<template>
  <nav class="breadcrumbs" aria-label="Breadcrumb">
    <template v-for="(item, index) in items" :key="index">
      <!-- Link or current item -->
      <router-link
        v-if="item.route && index < items.length - 1"
        :to="item.route"
        class="breadcrumb-link"
      >
        <i v-if="item.icon" :class="item.icon"></i>
        <span>{{ item.label }}</span>
      </router-link>
      <span v-else class="breadcrumb-current">
        <i v-if="item.icon" :class="item.icon"></i>
        <span>{{ item.label }}</span>
      </span>

      <!-- Separator (not after last item) -->
      <i
        v-if="index < items.length - 1"
        class="pi pi-chevron-right breadcrumb-separator"
        aria-hidden="true"
      ></i>
    </template>
  </nav>
</template>

<script>
export default {
  name: 'BreadcrumbNavigation',
  props: {
    items: {
      type: Array,
      required: true,
      validator: (items) => {
        return items.every(item =>
          item.label &&
          typeof item.label === 'string' &&
          (item.route === undefined || typeof item.route === 'string')
        )
      }
    }
  }
}
</script>

<style scoped>
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0;
  font-size: 0.9rem;
  flex-wrap: wrap;
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
  color: var(--primary-color);
  text-decoration: none;
}

.breadcrumb-link:hover {
  color: var(--primary-color-dark);
  text-decoration: underline;
}

.breadcrumb-link:focus {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
  border-radius: 2px;
}

.breadcrumb-link i,
.breadcrumb-current i {
  font-size: 0.85rem;
}

.breadcrumb-current {
  color: var(--text-primary);
  cursor: default;
}

.breadcrumb-separator {
  font-size: 0.7rem;
  color: var(--text-secondary);
  flex-shrink: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .breadcrumbs {
    font-size: 0.85rem;
    padding: 0.5rem 0;
  }

  .breadcrumb-link i,
  .breadcrumb-current i {
    font-size: 0.8rem;
  }

  .breadcrumb-separator {
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
