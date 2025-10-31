<template>
  <div class="empty-state">
    <i :class="icon"></i>
    <h3>{{ title }}</h3>
    <p>{{ message }}</p>
    <button
      v-if="actionText"
      @click="$emit('action')"
      class="action-btn"
    >
      <i v-if="actionIcon" :class="actionIcon"></i>
      {{ actionText }}
    </button>
  </div>
</template>

<script>
export default {
  name: 'EmptyState',
  props: {
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
  },
  emits: ['action']
}
</script>

<style scoped>
.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.empty-state i:first-child {
  font-size: 3.5rem;
  opacity: 0.3;
  color: var(--text-secondary);
}

.empty-state h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.empty-state p {
  margin: 0;
  font-size: 0.95rem;
  color: var(--text-secondary);
  max-width: 400px;
}

.action-btn {
  margin-top: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s ease;
}

.action-btn:hover {
  background: var(--color-primary-hover);
}

.action-btn i {
  font-size: 0.9rem;
  opacity: 1;
  color: white;
}

/* Responsive */
@media (max-width: 768px) {
  .empty-state {
    padding: 2rem 1rem;
  }

  .empty-state i:first-child {
    font-size: 2.5rem;
  }

  .empty-state h3 {
    font-size: 1.1rem;
  }

  .empty-state p {
    font-size: 0.9rem;
  }
}
</style>
