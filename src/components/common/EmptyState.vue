<template>
  <div class="text-center px-6 py-12 md:px-6 md:py-12 max-md:px-4 max-md:py-8 flex flex-col items-center gap-3 empty-state">
    <i :class="icon" class="text-6xl opacity-30 md:text-6xl max-md:text-5xl empty-state-icon"></i>
    <h3 class="m-0 text-xl font-semibold md:text-xl max-md:text-lg empty-state-title">{{ title }}</h3>
    <p class="m-0 text-sm max-w-sm md:text-sm max-md:text-sm empty-state-text">{{ message }}</p>
    <Button
      v-if="actionText"
      @click="emit('action')"
      :label="actionText"
      :icon="actionIcon"
      class="mt-2 px-5 py-2.5 rounded cursor-pointer text-sm font-medium inline-flex items-center gap-2 transition-colors duration-200 text-white action-btn"
    />
  </div>
</template>

<script setup>
import Button from 'primevue/button'

defineProps({
  icon: {
    type: String,
    required: true,
    validator: (value) => value.includes('pi-')
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: 'No items configured'
  },
  actionText: {
    type: String,
    default: null
  },
  actionIcon: {
    type: String,
    default: null,
    validator: (value) => !value || value.includes('pi-')
  }
})

const emit = defineEmits({
  action: null
})
</script>

<style scoped>
.empty-state {
  color: var(--text-secondary);
}

.empty-state-icon {
  color: var(--text-secondary);
}

.empty-state-title {
  color: var(--text-primary);
}

.empty-state-text {
  color: var(--text-secondary);
}

.action-btn {
  background: var(--color-primary);
  border: none;
}

.action-btn:hover {
  background: var(--color-primary-hover);
}

.action-btn i {
  font-size: 0.9rem;
  opacity: 1;
  color: white;
}
</style>
