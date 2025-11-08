<template>
  <div class="test-page">
    <div class="test-container">
      <h1>Copy Components Test Page</h1>

      <!-- CopyButton Test -->
      <section class="test-section">
        <h2>CopyButton Component</h2>

        <div class="test-box">
          <h3>Default CopyButton (with label)</h3>
          <CopyButton
            :config-item="testAgent"
            @copy-clicked="handleCopyClicked"
          />
        </div>

        <div class="test-box">
          <h3>CopyButton without label</h3>
          <CopyButton
            :config-item="testAgent"
            :show-label="false"
            @copy-clicked="handleCopyClicked"
          />
        </div>

        <div class="test-box">
          <h3>Disabled CopyButton (regular config)</h3>
          <CopyButton
            :config-item="testAgent"
            :disabled="true"
            @copy-clicked="handleCopyClicked"
          />
        </div>

        <div class="test-box">
          <h3>Disabled CopyButton (plugin config)</h3>
          <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">
            Hover over the button to see the plugin-specific tooltip
          </p>
          <CopyButton
            :config-item="pluginConfig"
            :disabled="true"
            @copy-clicked="handleCopyClicked"
          />
        </div>

        <div class="test-box">
          <h3>Multiple CopyButtons in a row</h3>
          <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            <CopyButton
              :config-item="testAgent"
              @copy-clicked="handleCopyClicked"
            />
            <CopyButton
              :config-item="testCommand"
              @copy-clicked="handleCopyClicked"
            />
            <CopyButton
              :config-item="testHook"
              @copy-clicked="handleCopyClicked"
            />
            <CopyButton
              :config-item="testMcp"
              @copy-clicked="handleCopyClicked"
            />
          </div>
        </div>

        <div class="test-box">
          <h3>Keyboard Navigation Test</h3>
          <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">
            Tab to focus the button, press Enter or Space to activate
          </p>
          <div style="display: flex; gap: 1rem;">
            <CopyButton
              :config-item="testAgent"
              @copy-clicked="handleCopyClicked"
            />
            <CopyButton
              :config-item="testCommand"
              @copy-clicked="handleCopyClicked"
            />
          </div>
        </div>
      </section>

      <!-- CopyModal Test -->
      <section class="test-section">
        <h2>CopyModal Component</h2>

        <div class="test-box">
          <h3>Open Copy Modal</h3>
          <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 1rem;">
            Click the button below to open the copy modal dialog. Test selecting different destinations, keyboard navigation (Tab, Enter, Escape), and scrolling through the project list.
          </p>
          <button @click="showCopyModal = true" class="test-btn">
            <i class="pi pi-copy"></i>
            Open Copy Modal
          </button>
        </div>

        <div v-if="lastCopyResult" class="test-box">
          <h3>Last Copy Result</h3>
          <div class="resolution-result">
            <i class="pi pi-check-circle" style="color: var(--color-success); font-size: 1.5rem;"></i>
            <div>
              <strong>Source:</strong> {{ lastCopyResult.source.name }} ({{ lastCopyResult.source.type }})<br>
              <strong>Destination:</strong> {{ lastCopyResult.destination.name }} ({{ lastCopyResult.destination.path }})
            </div>
          </div>
        </div>
      </section>

      <!-- Action Log -->
      <section v-if="actionLog.length > 0" class="test-section">
        <h2>Action Log</h2>
        <div class="test-box">
          <ul>
            <li v-for="(log, index) in actionLog" :key="index">{{ log }}</li>
          </ul>
          <button @click="clearLog" class="clear-btn">Clear Log</button>
        </div>
      </section>

      <!-- CopyModal Dialog -->
      <CopyModal
        v-model:visible="showCopyModal"
        :source-config="testSourceConfig"
        @copy-success="handleCopySuccess"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import CopyButton from '@/components/copy/CopyButton.vue';
import CopyModal from '@/components/copy/CopyModal.vue';

const actionLog = ref([]);
const showCopyModal = ref(false);
const lastCopyResult = ref(null);

// Test data
const testAgent = {
  name: 'test-agent',
  description: 'A test subagent for verification',
  location: 'project'
};

const testCommand = {
  name: 'test-command',
  description: 'A test slash command',
  location: 'user'
};

const testHook = {
  event: 'after:command',
  command: 'echo "test"',
  location: 'project'
};

const testMcp = {
  name: 'test-mcp-server',
  transport: 'stdio',
  location: 'user'
};

const pluginConfig = {
  name: 'plugin-provided-agent',
  description: 'This agent is provided by a plugin',
  location: 'plugin'
};

const testSourceConfig = {
  name: 'test-agent.md',
  type: 'agent',
  path: '/home/claude/manager/.claude/agents'
};

const handleCopyClicked = (configItem) => {
  const timestamp = new Date().toLocaleTimeString();
  const itemName = configItem.name || configItem.event || 'unknown';
  actionLog.value.unshift(`Copy clicked for "${itemName}" at ${timestamp}`);
};

const handleCopySuccess = (result) => {
  lastCopyResult.value = result;
  const timestamp = new Date().toLocaleTimeString();
  actionLog.value.unshift(`Copy successful: ${result.source.name} → ${result.destination.name} at ${timestamp}`);
};

const clearLog = () => {
  actionLog.value = [];
};
</script>

<style scoped>
.test-page {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 2rem;
}

.test-container {
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: var(--text-primary);
  margin-bottom: 2rem;
  text-align: center;
}

.test-section {
  margin-bottom: 3rem;
}

.test-section h2 {
  color: var(--text-primary);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--border-primary);
}

.test-box {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.test-box h3 {
  color: var(--text-primary);
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-primary);
}

.test-box ul {
  margin: 0 0 1rem 0;
  padding-left: 1.5rem;
  color: var(--text-secondary);
}

.test-box li {
  margin: 0.5rem 0;
}

.clear-btn {
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.2s;
}

.clear-btn:hover {
  background: var(--color-primary-hover);
}

.test-btn {
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

.test-btn:hover {
  background: var(--color-primary-hover);
}

.test-btn i {
  font-size: 1rem;
}

.resolution-result {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-tertiary);
  border-radius: 6px;
  border-left: 4px solid var(--color-success);
}

.resolution-result div {
  color: var(--text-primary);
  font-size: 0.95rem;
}
</style>
