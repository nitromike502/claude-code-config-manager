<template>
  <div v-if="hasError" class="flex items-center justify-center min-h-[200px] p-8">
    <div class="error-message rounded-lg p-8 max-w-2xl text-center">
      <div class="text-5xl mb-4">⚠️</div>
      <h3 class="m-0 mb-4 text-2xl error-heading">Something went wrong</h3>
      <p class="m-0 mb-6 leading-6 error-text">{{ errorMessage }}</p>
      <div class="flex gap-4 justify-center mb-4">
        <Button
          @click="reset"
          label="Try Again"
          severity="danger"
          class="btn-retry px-4 py-2 rounded text-sm font-medium cursor-pointer transition-all duration-200"
        />
        <Button
          @click="reportIssue"
          label="Report Issue"
          outlined
          class="btn-report px-4 py-2 rounded text-sm font-medium cursor-pointer transition-all duration-200"
        />
      </div>
      <details v-if="errorDetails" class="error-details mt-4 text-left">
        <summary class="cursor-pointer text-sm mb-2 select-none error-summary">Technical Details</summary>
        <pre class="rounded p-4 text-xs overflow-x-auto max-h-[200px] overflow-y-auto error-pre">{{ errorDetails }}</pre>
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
.error-message {
  background-color: var(--color-error-bg);
  border: 2px solid var(--color-error);
}

.error-heading {
  color: var(--color-error);
}

.error-text {
  color: var(--text-primary);
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

.error-summary {
  color: var(--text-secondary);
}

.error-summary:hover {
  color: var(--text-primary);
}

.error-pre {
  background-color: var(--bg-code);
  border: 1px solid var(--border-primary);
  color: var(--text-secondary);
}
</style>
