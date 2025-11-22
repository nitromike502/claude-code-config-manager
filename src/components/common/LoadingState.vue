<template>
  <div class="loading-state">
    <!-- Item type: Simple text skeleton -->
    <template v-if="type === 'item'">
      <div v-for="n in count" :key="n" class="item-skeleton">
        <Skeleton height="2rem" class="mb-2"></Skeleton>
        <Skeleton height="1rem" width="80%"></Skeleton>
      </div>
    </template>

    <!-- Card type: Realistic card layout -->
    <template v-if="type === 'card'">
      <div v-for="n in count" :key="n" class="card-skeleton">
        <Skeleton height="3rem" class="mb-3"></Skeleton>
        <Skeleton height="1.5rem" count="2" class="mb-2"></Skeleton>
        <Skeleton height="1rem" width="60%"></Skeleton>
      </div>
    </template>

    <!-- List type: Compact row skeleton -->
    <template v-if="type === 'list'">
      <div v-for="n in count" :key="n" class="list-skeleton">
        <Skeleton height="1.5rem"></Skeleton>
      </div>
    </template>
  </div>
</template>

<script setup>
import Skeleton from 'primevue/skeleton'

defineProps({
  count: {
    type: Number,
    default: 3,
    validator: (value) => value > 0
  },
  type: {
    type: String,
    default: 'item',
    validator: (value) => ['item', 'card', 'list'].includes(value)
  }
})
</script>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

/* Item skeleton: Minimal text content */
.item-skeleton {
  padding: 0.5rem;
  border-radius: 4px;
}

/* Card skeleton: More prominent, card-like layout */
.card-skeleton {
  padding: 1.5rem;
  border: 1px solid var(--border-secondary);
  border-radius: 6px;
  background: var(--bg-secondary);
}

/* List skeleton: Compact row layout */
.list-skeleton {
  padding: 0.5rem;
  border-radius: 4px;
}

/* Spacing utilities for Skeleton children */
.mb-2 {
  margin-bottom: 0.5rem;
}

.mb-3 {
  margin-bottom: 0.75rem;
}
</style>
