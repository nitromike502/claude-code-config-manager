<template>
  <div class="error-state">
    <i :class="icon"></i>
    <h3>{{ title }}</h3>
    <p>{{ message }}</p>
    <Button
      v-if="retryText"
      @click="emit('retry')"
      :label="retryText"
      :icon="retryIcon"
      severity="danger"
      class="retry-btn"
    />
  </div>
</template>

<script setup>
/**
 * ErrorState Component
 *
 * Reusable component for displaying error states with optional retry action.
 * Follows the same design pattern as EmptyState.vue for consistency.
 *
 * @component
 * @example
 * <ErrorState
 *   title="Error Loading Data"
 *   message="Failed to connect to the server. Please try again."
 *   retryText="Retry"
 *   @retry="loadData"
 * />
 *
 * @example
 * <!-- Error state without retry button -->
 * <ErrorState
 *   title="Connection Lost"
 *   message="Unable to reach the server."
 * />
 */
import Button from 'primevue/button'

/**
 * Component props
 * @typedef {Object} ErrorStateProps
 * @property {string} icon - PrimeIcons icon class for the error icon (default: 'pi pi-exclamation-triangle')
 * @property {string} title - Error title/heading
 * @property {string} message - Error message/description
 * @property {string} [retryText] - Text for retry button (if provided, button will be shown)
 * @property {string} retryIcon - PrimeIcons icon class for retry button (default: 'pi pi-refresh')
 */
defineProps({
  icon: {
    type: String,
    default: 'pi pi-exclamation-triangle',
    validator: (value) => value.includes('pi-')
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  retryText: {
    type: String,
    default: null
  },
  retryIcon: {
    type: String,
    default: 'pi pi-refresh',
    validator: (value) => !value || value.includes('pi-')
  }
})

/**
 * Component emits
 * @event retry - Emitted when retry button is clicked
 */
const emit = defineEmits({
  retry: null
})
</script>

<style scoped>
.error-state {
  text-align: center;
  padding: 3rem 1.5rem;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.error-state i:first-child {
  font-size: 3.5rem;
  opacity: 0.8;
  color: var(--color-error);
}

.error-state h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.error-state p {
  margin: 0;
  font-size: 0.95rem;
  color: var(--text-secondary);
  max-width: 400px;
}

.retry-btn {
  margin-top: 0.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .error-state {
    padding: 2rem 1rem;
  }

  .error-state i:first-child {
    font-size: 2.5rem;
  }

  .error-state h3 {
    font-size: 1.1rem;
  }

  .error-state p {
    font-size: 0.9rem;
  }
}
</style>
