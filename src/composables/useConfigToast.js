import { useToast } from 'primevue/usetoast'

/**
 * Composable for standardized toast notifications across configuration operations
 * Provides consistent messaging and lifetimes for success, error, and info toasts
 */
export function useConfigToast() {
  const toast = useToast()

  /**
   * Show success toast for copy operation
   * @param {string} filename - Name of the copied file/configuration
   */
  const copySuccess = (filename) => {
    toast.add({
      severity: 'success',
      summary: 'Configuration Copied',
      detail: `${filename} has been copied successfully`,
      life: 5000
    })
  }

  /**
   * Show success toast for delete operation
   * @param {string} itemType - Type of item (e.g., 'Hook', 'Skill', 'MCP Server')
   * @param {string} itemName - Name/description of the deleted item
   */
  const deleteSuccess = (itemType, itemName) => {
    toast.add({
      severity: 'success',
      summary: `${itemType} Deleted`,
      detail: `${itemName} has been deleted successfully`,
      life: 5000
    })
  }

  /**
   * Show error toast for copy operation
   * @param {Error|Object} error - Error object with message property
   */
  const copyError = (error) => {
    toast.add({
      severity: 'error',
      summary: 'Copy Failed',
      detail: error.message || 'An error occurred during the copy operation',
      life: 0 // Manual dismiss
    })
  }

  /**
   * Show error toast for delete operation
   * @param {Error|Object} error - Error object with message property
   */
  const deleteError = (error) => {
    toast.add({
      severity: 'error',
      summary: 'Delete Failed',
      detail: error.message || error.error || 'An unexpected error occurred',
      life: 0 // Manual dismiss
    })
  }

  /**
   * Show info toast for cancelled copy operation
   */
  const copyCancelled = () => {
    toast.add({
      severity: 'info',
      summary: 'Copy operation cancelled',
      detail: '',
      life: 3000
    })
  }

  /**
   * Show generic success toast
   * @param {string} message - Success message to display
   */
  const success = (message) => {
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: message,
      life: 5000
    })
  }

  /**
   * Show generic error toast
   * @param {string} message - Error message to display
   */
  const error = (message) => {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 0 // Manual dismiss
    })
  }

  /**
   * Show generic info toast
   * @param {string} message - Info message to display
   */
  const info = (message) => {
    toast.add({
      severity: 'info',
      summary: 'Info',
      detail: message,
      life: 3000
    })
  }

  return {
    copySuccess,
    deleteSuccess,
    copyError,
    deleteError,
    copyCancelled,
    success,
    error,
    info
  }
}
