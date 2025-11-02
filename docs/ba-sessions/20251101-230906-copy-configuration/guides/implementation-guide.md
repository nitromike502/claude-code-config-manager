# Copy Configuration Feature - Implementation Guide

**Feature:** Copy Configuration Between Projects
**Estimated Effort:** 26-27 hours (~3.5 days)
**Phase:** 3.0 (First Write Operation)

## Prerequisites

**Required Reading:**
1. `../prd/PRD-Copy-Configuration.md` - Complete requirements
2. `../decisions.md` - Architectural decisions
3. `../wireframes/design-notes.md` - UI specifications
4. `../decision-matrix.md` - Quick reference

**Development Environment:**
- Node.js 18+ and npm
- Familiarity with Vue 3 Composition API, Pinia, PrimeVue
- Understanding of async/await and filesystem operations
- Access to Windows, macOS, or Linux for testing

**Timeline:**
- Day 1: Backend (14 hours)
- Day 2: Frontend (13 hours)
- Day 3+: Testing & polish

---

## Architecture Overview

```
User Action → CopyButton → CopyModal → API Client → Backend
                                ↓
                           Pinia Store
                                ↓
                        Toast Notifications

Backend: API Routes → Copy Service → Conflict Resolver → File System
```

**Key Patterns:**
- **Strategy Pattern:** Conflict resolution (extensible to V2 preferences)
- **Additive Layers:** Visual indicators (easy to remove)
- **Reactive Validation:** Fail gracefully vs pre-checking

---

## Implementation Sequence

### Phase 1: Backend (Day 1 - 14 hours)

**Story 3.1: Copy Service Infrastructure (6 hours)**
1. Create `src/backend/services/copy-service.js`
2. Implement basic file copy with validation
3. Add conflict detection logic
4. Create conflict resolver with strategy pattern
5. Write unit tests

**Story 3.2: Configuration-Specific Copy (5 hours)**
1. Implement agent copy (`copyAgent`)
2. Implement command copy (`copyCommand`)
3. Implement skill copy (`copySkill` - directory recursion)
4. Implement hook copy (`copyHook` - smart merge)
5. Implement MCP copy (`copyMcp`)
6. Write tests for each type

**Story 3.3: API Endpoints (3 hours)**
1. Create `src/backend/routes/copy.js`
2. Add 5 POST endpoints: `/api/copy/{agent,command,skill,hook,mcp}`
3. Add validation middleware
4. Add error handling middleware
5. Write API integration tests

### Phase 2: Frontend (Day 2 - 13 hours)

**Story 3.4: Base Components (5 hours)**
1. Create `src/components/copy/CopyButton.vue`
2. Create `src/components/copy/CopyModal.vue`
3. Create `src/components/copy/ConflictResolver.vue`
4. Write component tests

**Story 3.5: State Management (3 hours)**
1. Create `src/stores/copy-store.js` (Pinia)
2. Add copy actions and state
3. Integrate with API client (`src/api/client.js`)
4. Write store tests

**Story 3.6: Integration (5 hours)**
1. Add CopyButton to ConfigCard components
2. Add CopyButton to ConfigItemList
3. Integrate with ProjectDetail and UserGlobal views
4. Add Toast notifications
5. Add plugin detection (disable button)
6. Write E2E tests

### Phase 3: Polish & Testing (Partial Day 3)

**Story 3.7: Testing & Quality (Ongoing)**
1. Run full test suite (95-120 tests)
2. Cross-platform testing (Windows, macOS, Linux)
3. Accessibility audit (WCAG 2.1 AA)
4. Performance testing (<500ms target)
5. Update documentation

---

## Backend Implementation Details

### 1. Copy Service (src/backend/services/copy-service.js)

**Core Methods:**

```javascript
const path = require('path');
const fs = require('fs').promises;

class CopyService {
  /**
   * Copy agent file between scopes/projects
   */
  async copyAgent(request) {
    const { sourcePath, targetScope, targetProjectId, conflictStrategy } = request;

    // 1. Validate source exists
    await this.validateSource(sourcePath);

    // 2. Determine target path
    const targetPath = this.buildTargetPath('agent', targetScope, targetProjectId, sourcePath);

    // 3. Check for conflicts
    const conflict = await this.detectConflict(sourcePath, targetPath);
    if (conflict && !conflictStrategy) {
      return { success: false, conflict };
    }

    // 4. Resolve conflict if strategy provided
    const finalPath = await this.resolveConflict(targetPath, conflictStrategy);

    // 5. Copy file
    await fs.copyFile(sourcePath, finalPath);

    // 6. Validate copied file
    await this.validateCopiedFile(finalPath);

    return { success: true, copiedPath: finalPath };
  }

  /**
   * Copy hook with smart script-level merge
   */
  async copyHook(request) {
    const { sourceHook, targetScope, targetProjectId } = request;

    // 1. Read target settings.json
    const settingsPath = this.getSettingsPath(targetScope, targetProjectId);
    const settings = await this.readSettings(settingsPath);

    // 2. Smart merge: compare scripts within same event
    const mergedHooks = this.mergeHooks(settings.hooks || {}, sourceHook);

    // 3. Write updated settings
    settings.hooks = mergedHooks;
    await this.writeSettings(settingsPath, settings);

    return { success: true, message: 'Hook merged successfully' };
  }

  /**
   * Smart hook merge: script-level duplicate detection
   */
  mergeHooks(existingHooks, newHook) {
    const merged = { ...existingHooks };

    for (const [event, scripts] of Object.entries(newHook)) {
      // Normalize to arrays
      const newScripts = Array.isArray(scripts) ? scripts : [scripts];
      const existingScripts = merged[event]
        ? (Array.isArray(merged[event]) ? merged[event] : [merged[event]])
        : [];

      // Add only new scripts (duplicate detection)
      for (const script of newScripts) {
        if (!existingScripts.includes(script)) {
          existingScripts.push(script);
        }
      }

      merged[event] = existingScripts;
    }

    return merged;
  }

  /**
   * Detect conflict: target file exists
   */
  async detectConflict(sourcePath, targetPath) {
    try {
      const targetExists = await fs.access(targetPath).then(() => true).catch(() => false);
      if (!targetExists) return null;

      const [sourceStat, targetStat] = await Promise.all([
        fs.stat(sourcePath),
        fs.stat(targetPath)
      ]);

      return {
        targetPath,
        sourceModified: sourceStat.mtime.toISOString(),
        targetModified: targetStat.mtime.toISOString()
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Resolve conflict based on strategy
   */
  async resolveConflict(targetPath, strategy) {
    if (!strategy) return targetPath;

    switch (strategy) {
      case 'skip':
        throw new Error('Copy cancelled by user');

      case 'overwrite':
        // TODO: Consider creating backup before overwrite
        return targetPath;

      case 'rename':
        return this.generateUniquePath(targetPath);

      default:
        throw new Error(`Unknown conflict strategy: ${strategy}`);
    }
  }

  /**
   * Generate unique path: filename-2.md, filename-3.md, etc.
   */
  async generateUniquePath(originalPath) {
    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    const base = path.basename(originalPath, ext);

    let counter = 2;
    let newPath;

    do {
      newPath = path.join(dir, `${base}-${counter}${ext}`);
      counter++;
    } while (await fs.access(newPath).then(() => true).catch(() => false));

    return newPath;
  }

  /**
   * Validate source path (security: prevent path traversal)
   */
  async validateSource(sourcePath) {
    // Normalize and resolve path
    const normalized = path.normalize(sourcePath);
    const resolved = path.resolve(normalized);

    // Check for path traversal attempts
    if (normalized.includes('..')) {
      throw new Error('Path traversal detected');
    }

    // Verify source exists and is readable
    await fs.access(resolved, fs.constants.R_OK);

    return resolved;
  }

  /**
   * Build target path based on scope and config type
   */
  buildTargetPath(configType, targetScope, targetProjectId, sourcePath) {
    const filename = path.basename(sourcePath);

    if (targetScope === 'user') {
      // User-level: ~/.claude/{agents,commands,skills}/
      const homeDir = require('os').homedir();
      return path.join(homeDir, '.claude', `${configType}s`, filename);
    } else {
      // Project-level: {projectPath}/.claude/{agents,commands,skills}/
      const projectPath = this.getProjectPath(targetProjectId);
      return path.join(projectPath, '.claude', `${configType}s`, filename);
    }
  }
}

module.exports = new CopyService();
```

**Key Points:**
- Use Node.js `path` module for cross-platform compatibility
- Always validate paths (prevent path traversal)
- Handle both file-based (agents, commands, skills) and settings-based (hooks, MCP) configs
- Smart merge for hooks (script-level duplicate detection)
- Generate unique filenames for rename strategy

### 2. API Endpoints (src/backend/routes/copy.js)

```javascript
const express = require('express');
const router = express.Router();
const copyService = require('../services/copy-service');

/**
 * POST /api/copy/agent
 * Copy agent file between scopes/projects
 */
router.post('/api/copy/agent', async (req, res) => {
  try {
    const { sourcePath, targetScope, targetProjectId, conflictStrategy } = req.body;

    // Validate request
    if (!sourcePath || !targetScope) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Execute copy
    const result = await copyService.copyAgent(req.body);

    if (result.conflict) {
      // Conflict detected, return to UI for resolution
      return res.status(409).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Copy agent error:', error);

    // Map filesystem errors to HTTP status codes
    const status = mapErrorToStatus(error);
    res.status(status).json({ error: error.message });
  }
});

/**
 * POST /api/copy/hook
 * Copy hook configuration with smart merge
 */
router.post('/api/copy/hook', async (req, res) => {
  try {
    const result = await copyService.copyHook(req.body);
    res.json(result);
  } catch (error) {
    console.error('Copy hook error:', error);
    const status = mapErrorToStatus(error);
    res.status(status).json({ error: error.message });
  }
});

// Similar endpoints for /command, /skill, /mcp

/**
 * Map filesystem errors to HTTP status codes
 */
function mapErrorToStatus(error) {
  if (error.code === 'EACCES') return 403; // Permission denied
  if (error.code === 'ENOENT') return 404; // Not found
  if (error.code === 'ENOSPC') return 507; // Disk full
  if (error.message.includes('Path traversal')) return 400; // Bad request
  return 500; // Internal server error
}

module.exports = router;
```

**Register routes in main server:**

```javascript
// src/backend/server.js
const copyRoutes = require('./routes/copy');
app.use(copyRoutes);
```

---

## Frontend Implementation Details

### 1. CopyButton Component (src/components/copy/CopyButton.vue)

```vue
<template>
  <Button
    icon="pi pi-copy"
    :label="showLabel ? 'Copy to...' : ''"
    :disabled="disabled"
    @click="handleClick"
    class="copy-button p-button-sm p-button-secondary"
    v-tooltip.top="tooltipText"
  />
</template>

<script setup>
import { computed } from 'vue';
import Button from 'primevue/button';
import Tooltip from 'primevue/tooltip';

const props = defineProps({
  configItem: {
    type: Object,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  showLabel: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['copy-clicked']);

const tooltipText = computed(() => {
  if (props.disabled && props.configItem.location === 'plugin') {
    return 'This configuration is provided by a plugin and cannot be copied. Install the plugin in your target project instead.';
  }
  return 'Copy this configuration to another project or user-level';
});

function handleClick() {
  emit('copy-clicked', props.configItem);
}
</script>

<style scoped>
.copy-button {
  margin-left: 0.5rem;
}
</style>
```

### 2. CopyModal Component (src/components/copy/CopyModal.vue)

```vue
<template>
  <Dialog
    v-model:visible="isVisible"
    header="Copy Configuration"
    :modal="true"
    :style="{ width: '600px' }"
    :closable="true"
  >
    <!-- Source Section -->
    <div class="source-section mb-4">
      <h4>Source</h4>
      <div class="source-info">
        <i class="pi pi-file mr-2"></i>
        <span class="config-name">{{ sourceConfig.name }}</span>
        <span class="config-type ml-2 text-sm text-gray-400">
          ({{ sourceConfig.type }})
        </span>
      </div>
      <div class="source-location text-sm text-gray-500 mt-1">
        {{ sourceConfig.location }}
      </div>
    </div>

    <Divider />

    <!-- Destination Section -->
    <div class="destination-section">
      <h4>Copy to:</h4>
      <div class="destination-list" style="max-height: 300px; overflow-y: auto;">
        <!-- User Global Card -->
        <div class="destination-card" @click="selectDestination('user', null)">
          <div class="card-content">
            <i class="pi pi-home mr-2"></i>
            <div class="card-info">
              <div class="card-title">User Global</div>
              <div class="card-path text-sm text-gray-500">~/.claude/</div>
            </div>
          </div>
          <Button label="Copy Here" class="p-button-sm" />
        </div>

        <!-- Project Cards -->
        <div
          v-for="project in projects"
          :key="project.id"
          class="destination-card"
          @click="selectDestination('project', project.id)"
        >
          <div class="card-content">
            <i class="pi pi-folder mr-2"></i>
            <div class="card-info">
              <div class="card-title">{{ project.name }}</div>
              <div class="card-path text-sm text-gray-500">{{ project.path }}</div>
            </div>
          </div>
          <Button label="Copy Here" class="p-button-sm" />
        </div>
      </div>
    </div>

    <template #footer>
      <Button label="Cancel" @click="closeModal" class="p-button-text" />
    </template>
  </Dialog>

  <!-- Conflict Resolver Dialog -->
  <ConflictResolver
    v-model:visible="showConflictDialog"
    :conflict="currentConflict"
    @resolve="handleConflictResolution"
  />
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Divider from 'primevue/divider';
import ConflictResolver from './ConflictResolver.vue';
import { useCopyStore } from '@/stores/copy-store';
import { useProjectsStore } from '@/stores/projects-store';
import { useToast } from 'primevue/usetoast';

const props = defineProps({
  visible: Boolean,
  sourceConfig: Object
});

const emit = defineEmits(['update:visible', 'copy-success']);

const copyStore = useCopyStore();
const projectsStore = useProjectsStore();
const toast = useToast();

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

const projects = computed(() => projectsStore.projects);
const showConflictDialog = ref(false);
const currentConflict = ref(null);
const pendingCopy = ref(null);

async function selectDestination(scope, projectId) {
  try {
    const result = await copyStore.copyConfiguration({
      sourceConfig: props.sourceConfig,
      targetScope: scope,
      targetProjectId: projectId
    });

    if (result.conflict) {
      // Show conflict dialog
      currentConflict.value = result.conflict;
      pendingCopy.value = { scope, projectId };
      showConflictDialog.value = true;
    } else {
      // Success
      showSuccess(result);
      closeModal();
    }
  } catch (error) {
    showError(error);
  }
}

async function handleConflictResolution(strategy) {
  try {
    const result = await copyStore.copyConfiguration({
      sourceConfig: props.sourceConfig,
      targetScope: pendingCopy.value.scope,
      targetProjectId: pendingCopy.value.projectId,
      conflictStrategy: strategy
    });

    showSuccess(result);
    closeModal();
    showConflictDialog.value = false;
  } catch (error) {
    showError(error);
  }
}

function showSuccess(result) {
  toast.add({
    severity: 'success',
    summary: 'Configuration Copied',
    detail: `${props.sourceConfig.name} has been copied successfully`,
    life: 5000
  });
  emit('copy-success', result);
}

function showError(error) {
  toast.add({
    severity: 'error',
    summary: 'Copy Failed',
    detail: error.message || 'An error occurred while copying',
    life: 0 // Manual dismiss
  });
}

function closeModal() {
  isVisible.value = false;
  currentConflict.value = null;
  pendingCopy.value = null;
}
</script>

<style scoped>
.destination-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  margin-bottom: 0.5rem;
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.destination-card:hover {
  background: var(--surface-hover);
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.card-content {
  display: flex;
  align-items: center;
}

.card-info {
  display: flex;
  flex-direction: column;
}

.card-title {
  font-weight: 600;
}
</style>
```

### 3. Pinia Store (src/stores/copy-store.js)

```javascript
import { defineStore } from 'pinia';
import api from '@/api/client';

export const useCopyStore = defineStore('copy', {
  state: () => ({
    copying: false,
    lastCopyResult: null
  }),

  actions: {
    async copyConfiguration(request) {
      this.copying = true;

      try {
        const { sourceConfig, targetScope, targetProjectId, conflictStrategy } = request;

        // Determine which endpoint to call based on config type
        const endpoint = this.getEndpointForType(sourceConfig.type);

        // Build request payload
        const payload = {
          sourcePath: sourceConfig.path,
          targetScope,
          targetProjectId,
          conflictStrategy
        };

        // Call API
        const result = await api[endpoint](payload);

        this.lastCopyResult = result;
        return result;
      } finally {
        this.copying = false;
      }
    },

    getEndpointForType(type) {
      const typeMap = {
        'agent': 'copyAgent',
        'command': 'copyCommand',
        'skill': 'copySkill',
        'hook': 'copyHook',
        'mcp': 'copyMcp'
      };
      return typeMap[type] || 'copyAgent';
    }
  }
});
```

### 4. API Client Methods (src/api/client.js)

```javascript
// Add to existing API client
export default {
  // ... existing methods

  async copyAgent(request) {
    return this.post('/api/copy/agent', request);
  },

  async copyCommand(request) {
    return this.post('/api/copy/command', request);
  },

  async copySkill(request) {
    return this.post('/api/copy/skill', request);
  },

  async copyHook(request) {
    return this.post('/api/copy/hook', request);
  },

  async copyMcp(request) {
    return this.post('/api/copy/mcp', request);
  }
};
```

---

## Testing Implementation

### Backend Unit Tests (tests/backend/copy-service.test.js)

```javascript
const copyService = require('../../src/backend/services/copy-service');
const fs = require('fs').promises;
const path = require('path');

describe('CopyService', () => {
  describe('mergeHooks', () => {
    it('should merge hooks without duplicates', () => {
      const existing = {
        'pre-commit': ['eslint .']
      };

      const newHook = {
        'pre-commit': ['npm test', 'eslint .'],
        'post-commit': ['git push']
      };

      const result = copyService.mergeHooks(existing, newHook);

      expect(result['pre-commit']).toEqual(['eslint .', 'npm test']);
      expect(result['post-commit']).toEqual(['git push']);
    });

    it('should handle single-script hooks (non-array)', () => {
      const existing = {
        'pre-commit': 'eslint .'
      };

      const newHook = {
        'pre-commit': 'npm test'
      };

      const result = copyService.mergeHooks(existing, newHook);

      expect(result['pre-commit']).toEqual(['eslint .', 'npm test']);
    });
  });

  describe('generateUniquePath', () => {
    it('should generate filename-2.md if filename.md exists', async () => {
      const originalPath = '/test/agent.md';
      // Mock fs.access to simulate existing file
      jest.spyOn(fs, 'access').mockResolvedValueOnce().mockRejectedValueOnce();

      const result = await copyService.generateUniquePath(originalPath);

      expect(result).toBe('/test/agent-2.md');
    });
  });
});
```

### E2E Tests (tests/e2e/copy-configuration.spec.js)

```javascript
const { test, expect } = require('@playwright/test');

test('Copy agent between projects successfully', async ({ page }) => {
  // Navigate to project detail
  await page.goto('http://localhost:5173');
  await page.click('text=my-project');

  // Click copy button on first agent
  await page.click('[data-testid="agent-card"] .copy-button');

  // Modal should open
  await expect(page.locator('.p-dialog-header')).toContainText('Copy Configuration');

  // Select destination project
  await page.click('text=target-project >> ancestor::div.destination-card >> text=Copy Here');

  // Success toast should appear
  await expect(page.locator('.p-toast-summary')).toContainText('Configuration Copied');

  // Modal should close
  await expect(page.locator('.p-dialog')).not.toBeVisible();
});

test('Handle conflict with rename strategy', async ({ page }) => {
  // Setup: Create conflict scenario
  // ... setup code

  // Trigger copy that will conflict
  await page.click('.copy-button');
  await page.click('text=target-project >> ancestor::div.destination-card >> text=Copy Here');

  // Conflict dialog should appear
  await expect(page.locator('text=File Already Exists')).toBeVisible();

  // Select rename strategy
  await page.click('input[value="rename"]');
  await page.click('text=Confirm Action');

  // Success toast
  await expect(page.locator('.p-toast-summary')).toContainText('Configuration Copied');
});
```

---

## Key Implementation Notes

### Security Checklist
- ✅ Validate all paths (prevent `../` traversal)
- ✅ Use `path.normalize()` and `path.resolve()`
- ✅ Check file permissions before operations
- ✅ Don't follow symbolic links
- ✅ Sanitize filenames (no shell commands)

### Performance Targets
- File copy: <500ms
- Skill directory copy: <2s (100+ files)
- Conflict detection: <100ms
- Modal open animation: <300ms

### Accessibility Requirements
- Keyboard: Tab, Enter, Escape work correctly
- Screen readers: ARIA labels on all interactive elements
- Focus: Visible focus indicators (2px outline)
- Contrast: 4.5:1 minimum for all text

### Cross-Platform Testing
Test on:
- Windows 10/11 (path separators: `\`)
- macOS Monterey+ (permissions, symlinks)
- Linux Ubuntu 20.04+ (various distros)

---

## Common Issues & Solutions

### Issue: Copy fails silently
**Cause:** Backend error not propagated to UI
**Solution:** Check network tab, verify error handling in API client

### Issue: Modal doesn't close after success
**Cause:** `v-model:visible` binding issue
**Solution:** Verify computed property getter/setter

### Issue: Hooks not merging correctly
**Cause:** Array normalization missing
**Solution:** Ensure both existing and new hooks converted to arrays

### Issue: Path traversal vulnerability
**Cause:** Missing validation
**Solution:** Always use `path.normalize()` and reject paths with `..`

---

## Deployment Checklist

Before merging to develop:
- [ ] All 95-120 tests passing (100%)
- [ ] Lint errors resolved (`npm run lint`)
- [ ] TypeScript errors resolved (if applicable)
- [ ] Security audit passed
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Cross-platform testing complete (Win/Mac/Linux)
- [ ] Documentation updated (CHANGELOG, CLAUDE.md)
- [ ] PR description complete with screenshots
- [ ] Code review approved by 2+ reviewers

---

## Related Documents

- **PRD:** `../prd/PRD-Copy-Configuration.md`
- **Decisions:** `../decisions.md`
- **Wireframes:** `../wireframes/design-notes.md`
- **Decision Matrix:** `../decision-matrix.md`
- **Testing Guide:** `docs/guides/TESTING-GUIDE.md`
- **Git Workflow:** `docs/guides/GIT-WORKFLOW.md`

---

**Last Updated:** November 1, 2025
**Status:** Ready for Implementation
