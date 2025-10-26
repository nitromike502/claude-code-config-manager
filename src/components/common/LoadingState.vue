<template>
  <div class="loading-state">
    <div
      v-for="n in count"
      :key="n"
      class="skeleton"
      :class="`skeleton-${type}`"
    ></div>
  </div>
</template>

<script>
export default {
  name: 'LoadingState',
  props: {
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
  }
}
</script>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--surface-ground) 0%,
    var(--surface-border) 50%,
    var(--surface-ground) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 4px;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Skeleton Type Variants */
.skeleton-item {
  height: 60px;
  width: 100%;
}

.skeleton-card {
  height: 150px;
  width: 100%;
}

.skeleton-list {
  height: 40px;
  width: 100%;
}

/* Responsive */
@media (max-width: 768px) {
  .skeleton-item {
    height: 50px;
  }

  .skeleton-card {
    height: 120px;
  }
}
</style>
