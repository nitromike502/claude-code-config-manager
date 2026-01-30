<template>
  <ConfigurationPage
    scope="project"
    :project-id="projectId"
  />
</template>

<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ConfigurationPage from '@/components/pages/ConfigurationPage.vue'

/**
 * ProjectDetail Component
 *
 * Thin wrapper around ConfigurationPage for project-level configurations.
 * Handles route integration and passes projectId to the reusable ConfigurationPage component.
 *
 * @component
 * @example
 * // Used in router as:
 * { path: '/projects/:id', component: ProjectDetail, props: true }
 */
export default {
  name: 'ProjectDetail',
  components: { ConfigurationPage },
  props: {
    /**
     * Project ID from route parameter
     * @type {String}
     */
    id: {
      type: String,
      default: null
    }
  },
  setup(props) {
    const route = useRoute()

    // Get projectId from props or route params
    const projectId = computed(() => props.id || route.params.id)

    return {
      projectId
    }
  }
}
</script>
