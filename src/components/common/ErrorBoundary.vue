<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-message">
      <div class="error-icon">⚠️</div>
      <h3>Something went wrong</h3>
      <p class="error-text">{{ errorMessage }}</p>
      <div class="error-actions">
        <Button
          @click="reset"
          label="Try Again"
          severity="danger"
          class="btn-retry"
        />
        <Button
          @click="reportIssue"
          label="Report Issue"
          outlined
          class="btn-report"
        />
      </div>
      <details v-if="errorDetails" class="error-details">
        <summary>Technical Details</summary>
        <pre>{{ errorDetails }}</pre>
      </details>
    </div>
  </div>
  <slot v-else></slot>
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'
import Button from 'primevue/button'

const hasError = ref(false)
const errorMessage = ref('')
const errorDetails = ref('')

/**
 * Vue Error Boundary
 * Catches errors in child components and displays fallback UI
 * Prevents entire app from crashing due to single component errors
 */
onErrorCaptured((err, instance, info) => {
  hasError.value = true
  errorMessage.value = err.message || 'An unexpected error occurred'

  // Capture detailed error information for debugging
  errorDetails.value = JSON.stringify({
    error: err.toString(),
    component: instance?.$options?.name || 'Unknown',
    errorInfo: info,
    stack: err.stack
  }, null, 2)

  // Log error for debugging
  console.error('[ErrorBoundary] Caught error:', {
    error: err,
    component: instance?.$options?.name,
    info,
    stack: err.stack
  })

  // Prevent error from propagating to parent components
  return false
})

/**
 * Reset error state and retry rendering
 */
const reset = () => {
  hasError.value = false
  errorMessage.value = ''
  errorDetails.value = ''
}

/**
 * Open GitHub issues page for error reporting
 */
const reportIssue = () => {
  const issueUrl = 'https://github.com/nitromike502/claude-code-web-manager/issues/new'
  const title = encodeURIComponent(`Error: ${errorMessage.value}`)
  const body = encodeURIComponent(`## Error Description\n\n${errorMessage.value}\n\n## Technical Details\n\n\`\`\`\n${errorDetails.value}\n\`\`\``)

  window.open(`${issueUrl}?title=${title}&body=${body}`, '_blank')
}
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 2rem;
}

.error-message {
  background-color: var(--color-error-bg);
  border: 2px solid var(--color-error);
  border-radius: 8px;
  padding: 2rem;
  max-width: 600px;
  text-align: center;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-message h3 {
  color: var(--color-error);
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
}

.error-text {
  color: var(--text-primary);
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.btn-retry,
.btn-report {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-retry {
  background-color: var(--color-primary);
  color: var(--text-emphasis);
}

.btn-retry:hover {
  background-color: var(--color-primary-hover);
}

.btn-report {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.btn-report:hover {
  background-color: var(--bg-hover);
}

.error-details {
  margin-top: 1rem;
  text-align: left;
}

.error-details summary {
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  user-select: none;
}

.error-details summary:hover {
  color: var(--text-primary);
}

.error-details pre {
  background-color: var(--bg-code);
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  padding: 1rem;
  font-size: 0.75rem;
  overflow-x: auto;
  max-height: 200px;
  overflow-y: auto;
  color: var(--text-secondary);
}
</style>
