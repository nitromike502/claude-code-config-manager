<template>
  <div class="test-container">
    <h1>CopyModal Component Test</h1>
    <p>Click the button below to open the CopyModal component</p>

    <Button
      label="Open Copy Modal"
      icon="pi pi-copy"
      @click="showModal = true"
    />

    <CopyModal
      v-model:visible="showModal"
      :source-config="testSourceConfig"
      @copy-success="handleCopySuccess"
    />

    <div v-if="lastCopyResult" class="result-display">
      <h3>Last Copy Result:</h3>
      <pre>{{ JSON.stringify(lastCopyResult, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Button from 'primevue/button';
import CopyModal from './CopyModal.vue';

const showModal = ref(false);
const lastCopyResult = ref(null);

const testSourceConfig = ref({
  name: 'test-agent.md',
  type: 'agent',
  path: '/home/claude/manager/.claude/agents'
});

const handleCopySuccess = (result) => {
  console.log('Copy success:', result);
  lastCopyResult.value = result;
};
</script>

<style scoped>
.test-container {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  color: var(--text-emphasis);
  margin-bottom: 1rem;
}

p {
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.result-display {
  margin-top: 2rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 6px;
}

.result-display h3 {
  margin: 0 0 1rem 0;
  color: var(--text-emphasis);
}

.result-display pre {
  background: var(--bg-code);
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  color: var(--text-primary);
  font-size: 0.875rem;
}
</style>
