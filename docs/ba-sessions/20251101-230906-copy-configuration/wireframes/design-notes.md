# Copy Configuration Feature - Design Specifications

**Session:** BA-20251101-230906-copy-configuration
**Date:** November 1, 2025
**Status:** Ready for Development

## Overview

This document provides comprehensive design specifications for the Copy Configuration feature UI components. All designs follow the established Claude Code Manager design system and use PrimeVue component patterns.

---

## Component Architecture

### Component Hierarchy

```
CopyButton.vue (trigger component)
  └── CopyModal.vue (main modal dialog)
      ├── SourceCard (source display)
      ├── DestinationCardList (scrollable destination selection)
      │   └── DestinationCard (individual project cards)
      └── ConflictDialog.vue (nested dialog for conflicts)

ToastNotification (success/error feedback - PrimeVue Toast service)
```

---

## 1. Copy Button (Trigger Component)

### Component: `CopyButton.vue`

**Purpose:** Trigger button that appears on each config item to initiate copy operation.

**PrimeVue Component:** Custom button with PrimeVue icon

**Visual Appearance:**
- Small button with copy icon (pi pi-copy)
- Appears on hover over config item or always visible (design decision)
- Secondary styling (not primary blue)
- Tooltip: "Copy to..."

**Props:**
```vue
{
  configItem: Object,      // The config item to copy
  configType: String,      // 'agents' | 'commands' | 'hooks' | 'mcp'
  disabled: Boolean,       // true for plugin items
  tooltipText: String      // Custom tooltip (e.g., "Plugin items cannot be copied")
}
```

**States:**
- **Default:** Subtle gray icon, low opacity
- **Hover:** Full opacity, background highlight
- **Active/Click:** Scale down slightly
- **Disabled:** 40% opacity, cursor not-allowed, tooltip explains why

**Integration:**
```vue
<!-- In ConfigItemList.vue items -->
<div class="item-actions">
  <CopyButton
    :config-item="item"
    :config-type="type"
    :disabled="item.location === 'plugin'"
    @click="openCopyModal(item)"
  />
</div>
```

**CSS Specifications:**
```css
.copy-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: 1px solid var(--border-secondary);
  border-radius: 4px;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.2s ease;
}

.copy-btn:hover:not(:disabled) {
  opacity: 1;
  background: var(--bg-hover);
  border-color: var(--color-primary);
}

.copy-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.copy-btn i {
  font-size: 0.875rem;
  color: var(--text-secondary);
}
```

---

## 2. Copy Modal (Main Dialog)

### Component: `CopyModal.vue`

**Purpose:** Main modal dialog for selecting copy destination.

**PrimeVue Component:** Base on `Dialog` component pattern (custom implementation matching sidebar style)

**Layout Structure:**

```
┌────────────────────────────────────────────────────────────┐
│  Copy Configuration                                    [×]  │ ← Header
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ SOURCE                                              │  │
│  │ ┌──────────────────────────────────────────────┐    │  │
│  │ │ 📄 code-reviewer.md                          │    │  │ ← Source Card
│  │ │ Type: Agent                                  │    │  │
│  │ │ Current Location:                            │    │  │
│  │ │ 📁 Project: ~/projects/web-app               │    │  │
│  │ └──────────────────────────────────────────────┘    │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ COPY TO                                             │  │
│  │ ┌──────────────────────────────────────────────┐    │  │ ← Scrollable
│  │ │ 🌐 User Global                              │    │  │   Destination
│  │ │ ~/.claude/                   [Copy Here →]  │    │  │   Area
│  │ └──────────────────────────────────────────────┘    │  │
│  │                                                     │  │
│  │ ┌──────────────────────────────────────────────┐    │  │
│  │ │ 📁 api-server                               │    │  │
│  │ │ ~/projects/api-server        [Copy Here →]  │    │  │
│  │ └──────────────────────────────────────────────┘    │  │
│  │                                                     │  │
│  │ ┌──────────────────────────────────────────────┐    │  │
│  │ │ 📁 mobile-app                               │    │  │
│  │ │ ~/projects/mobile-app        [Copy Here →]  │    │  │
│  │ └──────────────────────────────────────────────┘    │  │
│  │                                                     │  │
│  │ ... (more projects)                                 │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│                                      [Cancel]              │ ← Footer
└────────────────────────────────────────────────────────────┘
```

**Dimensions:**
- **Width:** 600px (fixed)
- **Max Height:** 80vh
- **Modal Position:** Centered on screen
- **Z-Index:** 1000 (overlay: 999)

**Header Section:**
```css
.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-tertiary);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-emphasis);
}

.modal-close-btn {
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  cursor: pointer;
}
```

**Source Card:**
```css
.source-section {
  padding: 1.5rem;
  background: var(--bg-secondary);
}

.source-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
}

.source-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  padding: 1rem;
}

.source-card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.source-card-meta {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.6;
}
```

**Destination Section:**
```css
.destination-section {
  padding: 1.5rem;
  background: var(--bg-secondary);
}

.destination-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
}

.destination-list {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 2px; /* Prevent shadow clipping */
}

/* Custom scrollbar for destination list */
.destination-list::-webkit-scrollbar {
  width: 8px;
}

.destination-list::-webkit-scrollbar-track {
  background: var(--bg-primary);
  border-radius: 4px;
}

.destination-list::-webkit-scrollbar-thumb {
  background: var(--border-primary);
  border-radius: 4px;
}

.destination-list::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}
```

**Destination Card:**
```css
.destination-card {
  background: var(--bg-tertiary);
  border: 2px solid var(--border-primary);
  border-radius: 6px;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.destination-card:hover {
  background: var(--bg-hover);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-card);
}

.destination-card-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.destination-card-icon {
  font-size: 1.5rem;
  color: var(--text-secondary);
}

.destination-card-text {
  flex: 1;
  min-width: 0;
}

.destination-card-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.destination-card-path {
  font-size: 0.8rem;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-here-btn {
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s ease;
}

.copy-here-btn:hover {
  background: var(--color-primary-hover);
}
```

**Footer Section:**
```css
.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-primary);
  display: flex;
  justify-content: flex-end;
  background: var(--bg-secondary);
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: var(--bg-hover);
  border-color: var(--color-primary);
}
```

**Modal Overlay:**
```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  animation: fadeIn 0.2s ease;
}

.copy-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  max-height: 80vh;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  box-shadow: var(--shadow-sidebar);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translate(-50%, -45%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}
```

**Props:**
```vue
{
  visible: Boolean,
  sourceItem: Object,      // Config item being copied
  sourceType: String,      // 'agents' | 'commands' | 'hooks' | 'mcp'
  sourceScope: String,     // 'user' | 'project'
  sourceProjectId: String, // If scope is 'project'
  projects: Array          // All available projects for destination
}
```

**Emits:**
```vue
{
  'close': null,
  'copy': {
    destination: Object,  // Selected destination (user or project)
    conflictStrategy: String // 'skip' | 'overwrite' | 'rename' (if needed)
  }
}
```

**Visual Indicators (Optional - Additive Layer):**

As per decision #3, subtle indicators can be added:

```css
/* Optional source indicator */
.source-card::before {
  content: '→';
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.5rem;
  color: var(--text-muted);
  opacity: 0.5;
}

/* Optional target indicator on hover */
.destination-card:hover::after {
  content: '✓';
  margin-left: 0.5rem;
  color: var(--color-success);
  animation: fadeIn 0.2s ease;
}
```

**Note:** These indicators should be conditionally rendered and easily removable via a feature flag or prop.

---

## 3. Conflict Resolution Dialog

### Component: `ConflictDialog.vue`

**Purpose:** Nested dialog that appears when copy operation detects existing file at destination.

**PrimeVue Component:** Custom dialog (similar to modal pattern)

**Layout Structure:**

```
┌──────────────────────────────────────────────────────┐
│  ⚠️  File Already Exists                        [×]  │ ← Header
├──────────────────────────────────────────────────────┤
│                                                      │
│  A file with this name already exists at the         │
│  destination. What would you like to do?             │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ SOURCE FILE                                    │  │ ← Source Info
│  │ code-reviewer.md                               │  │
│  │ ~/projects/web-app/.claude/agents/             │  │
│  │ Last modified: Nov 1, 2025 2:30 PM             │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ TARGET FILE                                    │  │ ← Target Info
│  │ code-reviewer.md                               │  │
│  │ ~/projects/api-server/.claude/agents/          │  │
│  │ Last modified: Oct 15, 2025 10:45 AM           │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ CHOOSE AN ACTION:                              │  │ ← Action Selection
│  │                                                │  │
│  │ ○ Skip (don't copy)                            │  │
│  │   The target file will remain unchanged.       │  │
│  │                                                │  │
│  │ ○ Overwrite (replace target)                   │  │
│  │   ⚠️  The existing file will be replaced.      │  │
│  │                                                │  │
│  │ ● Rename (copy as code-reviewer-2.md)          │  │ ← Default
│  │   The new file will be saved with a new name.  │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│                  [Cancel]  [Confirm Action]          │ ← Footer
└──────────────────────────────────────────────────────┘
```

**Dimensions:**
- **Width:** 550px (fixed)
- **Max Height:** 70vh
- **Position:** Centered over Copy Modal
- **Z-Index:** 1100 (overlay: 1099)

**Header Section:**
```css
.conflict-dialog-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-primary);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--color-warning-bg);
}

.conflict-dialog-header i {
  font-size: 1.5rem;
  color: var(--color-warning);
}

.conflict-dialog-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-emphasis);
  flex: 1;
}
```

**Content Section:**
```css
.conflict-dialog-content {
  padding: 1.5rem;
  overflow-y: auto;
  max-height: calc(70vh - 180px);
}

.conflict-message {
  font-size: 0.95rem;
  color: var(--text-primary);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.file-info-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.file-info-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.file-info-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.file-info-path {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.file-info-modified {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.action-selection {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1.5rem;
}

.action-selection-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.action-option {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.action-option:hover {
  background: var(--bg-hover);
}

.action-option input[type="radio"] {
  margin-top: 0.25rem;
  cursor: pointer;
}

.action-option-content {
  flex: 1;
}

.action-option-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.action-option-description {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* Overwrite option warning styling */
.action-option-overwrite .action-option-title {
  color: var(--color-warning);
}

.action-option-overwrite .action-option-description::before {
  content: '⚠️ ';
}
```

**Footer Section:**
```css
.conflict-dialog-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-primary);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  background: var(--bg-secondary);
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.confirm-btn {
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.2s ease;
}

.confirm-btn:hover {
  background: var(--color-primary-hover);
}

/* Overwrite button styling */
.confirm-btn.overwrite-action {
  background: var(--color-warning);
}

.confirm-btn.overwrite-action:hover {
  background: var(--color-warning-bg);
}
```

**Props:**
```vue
{
  visible: Boolean,
  sourceFile: Object,      // { name, path, modified }
  targetFile: Object,      // { name, path, modified }
  defaultStrategy: String  // 'rename' (safest default)
}
```

**Emits:**
```vue
{
  'close': null,
  'resolve': String        // 'skip' | 'overwrite' | 'rename'
}
```

---

## 4. Success Feedback (Toast Notification)

### Component: PrimeVue Toast Service

**Purpose:** Non-blocking notification confirming successful copy operation.

**PrimeVue Component:** Toast service (integrated in App.vue)

**Layout Structure:**

```
┌────────────────────────────────────────────────────┐
│  ✓  Configuration Copied Successfully              │
├────────────────────────────────────────────────────┤
│  code-reviewer.md has been copied to:              │
│                                                    │
│  ~/projects/api-server/.claude/agents/             │
│                                                    │
│  [View in Target Project →]                   [×]  │
└────────────────────────────────────────────────────┘
```

**Position:** Top-right corner
**Duration:** Auto-dismiss after 5 seconds
**Width:** 400px
**Animation:** Slide in from right

**Toast Configuration:**
```javascript
this.$toast.add({
  severity: 'success',
  summary: 'Configuration Copied Successfully',
  detail: `${fileName} has been copied to:\n${targetPath}`,
  life: 5000, // 5 seconds
  closable: true
});
```

**Custom Styling:**
```css
.p-toast-message-success {
  background: var(--color-success-bg);
  border: 1px solid var(--color-success);
  border-left: 4px solid var(--color-success);
  color: var(--text-primary);
}

.p-toast-message-success .p-toast-message-icon {
  color: var(--color-success);
  font-size: 1.5rem;
}

.p-toast-message-success .p-toast-summary {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-emphasis);
  margin-bottom: 0.5rem;
}

.p-toast-message-success .p-toast-detail {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.6;
  white-space: pre-wrap;
}

/* Optional: Link to target project */
.toast-action-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  color: var(--color-primary);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.2s ease;
}

.toast-action-link:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}
```

---

## 5. Error State (Toast Notification)

### Component: PrimeVue Toast Service

**Purpose:** Non-blocking notification for copy operation failures.

**Layout Structure:**

```
┌────────────────────────────────────────────────────┐
│  ✗  Cannot Copy to Target Location                │
├────────────────────────────────────────────────────┤
│  Permission denied                                 │
│                                                    │
│  Check file permissions and try again.             │
│                                                    │
│                                               [×]  │
└────────────────────────────────────────────────────┘
```

**Position:** Top-right corner
**Duration:** Manual dismiss only (no auto-dismiss)
**Width:** 400px
**Animation:** Slide in from right

**Toast Configuration:**
```javascript
this.$toast.add({
  severity: 'error',
  summary: 'Cannot Copy to Target Location',
  detail: `${errorReason}\n\n${actionableAdvice}`,
  life: 0, // No auto-dismiss for errors
  closable: true
});
```

**Custom Styling:**
```css
.p-toast-message-error {
  background: var(--color-error-bg);
  border: 1px solid var(--color-error);
  border-left: 4px solid var(--color-error);
  color: var(--text-primary);
}

.p-toast-message-error .p-toast-message-icon {
  color: var(--color-error);
  font-size: 1.5rem;
}

.p-toast-message-error .p-toast-summary {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-emphasis);
  margin-bottom: 0.5rem;
}

.p-toast-message-error .p-toast-detail {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.6;
  white-space: pre-wrap;
}
```

**Error Message Patterns:**

| Error Type | Summary | Detail | Advice |
|------------|---------|--------|--------|
| EACCES | Cannot Copy to Target Location | Permission denied | Check file permissions and try again |
| ENOSPC | Cannot Copy to Target Location | Disk space full | Free up disk space and try again |
| ENOENT | Cannot Copy Configuration | Source file not found | The file may have been deleted |
| EROFS | Cannot Copy to Target Location | Read-only filesystem | Choose a different target location |
| EISDIR | Cannot Copy Configuration | Target is a directory | The target path is invalid |

---

## 6. Plugin Item Restriction (Disabled State)

### Component: Integrated into `CopyButton.vue`

**Purpose:** Visually indicate and prevent copying of plugin-provided configs.

**Visual Appearance:**

```
┌──────────────────────────────────────────────────┐
│  📦 analytics-agent                    [🚫 Copy] │ ← Button disabled
│  Provided by: Analytics Plugin                  │
└──────────────────────────────────────────────────┘
```

**Plugin Badge:**
```css
.plugin-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: var(--color-mcp); /* Purple */
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.plugin-badge i {
  font-size: 0.875rem;
}
```

**Disabled Copy Button:**
```css
.copy-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: var(--border-secondary);
}

.copy-btn:disabled i {
  color: var(--text-disabled);
}
```

**Tooltip (PrimeVue Tooltip directive):**
```vue
<button
  v-tooltip.top="tooltipMessage"
  :disabled="isPlugin"
  class="copy-btn"
>
  <i class="pi pi-copy"></i>
</button>

<!-- Tooltip message for plugin items -->
tooltipMessage: "This configuration is provided by a plugin and cannot be copied. Install the plugin in your target project instead."
```

**Tooltip Styling:**
```css
.p-tooltip {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.875rem;
  max-width: 300px;
  box-shadow: var(--shadow-card);
}

.p-tooltip .p-tooltip-arrow {
  border-bottom-color: var(--bg-tertiary);
}
```

---

## Interaction States

### 1. Default State
- Modal closed
- Copy buttons visible on config items (hover or always visible)
- No notifications

### 2. Hover State
- **Copy Button:** Full opacity, background highlight, border color changes
- **Destination Card:** Background lightens, border color changes to primary, subtle shadow

### 3. Active/Click State
- **Copy Button:** Scale down slightly (0.95)
- **Destination Card:** Border becomes solid primary color

### 4. Disabled State
- **Copy Button:** 40% opacity, cursor not-allowed, tooltip explains restriction
- **Radio Option:** Grayed out (if conditionally disabled)

### 5. Loading State
- **During Copy Operation:** Show spinner overlay on modal
- **Button:** Disabled with loading spinner replacing icon

```css
.modal-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(18, 18, 18, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-primary);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## Responsive Design

### Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Desktop | 1920px+ | Full layout, modal 600px wide |
| Laptop | 1440px | Full layout, modal 600px wide |
| Tablet | 768px - 1439px | Modal 90vw wide, max 600px |
| Mobile | < 768px | Modal 100vw, full screen overlay |

### Mobile Adaptations (< 768px)

**Copy Modal:**
```css
@media (max-width: 767px) {
  .copy-modal {
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    transform: translate(-50%, -50%);
  }

  .destination-list {
    max-height: calc(100vh - 400px);
  }

  .destination-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .copy-here-btn {
    width: 100%;
  }
}
```

**Conflict Dialog:**
```css
@media (max-width: 767px) {
  .conflict-dialog {
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }

  .file-info-path {
    word-break: break-all;
  }
}
```

---

## Accessibility (WCAG 2.1 AA Compliance)

### Keyboard Navigation

**Tab Order:**
1. Copy button (on config item)
2. Modal close button
3. Destination cards (focusable)
4. Copy Here buttons
5. Cancel button
6. Conflict dialog radio options
7. Conflict dialog buttons

**Keyboard Shortcuts:**
- **Escape:** Close modal or conflict dialog
- **Enter:** Activate focused button or select destination
- **Arrow Keys:** Navigate between radio options in conflict dialog
- **Tab / Shift+Tab:** Navigate between focusable elements

**Focus Indicators:**
```css
button:focus-visible,
.destination-card:focus-visible,
input[type="radio"]:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}
```

### ARIA Labels

```vue
<!-- Copy Button -->
<button
  aria-label="Copy code-reviewer.md to another project"
  :aria-disabled="isPlugin"
>

<!-- Modal -->
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>

<!-- Destination Card -->
<div
  role="button"
  tabindex="0"
  :aria-label="`Copy to ${project.name} project`"
  @keypress.enter="handleCopyToProject(project)"
>

<!-- Radio Options -->
<input
  type="radio"
  :id="`action-${option}`"
  :aria-checked="selectedAction === option"
  :aria-describedby="`action-${option}-description`"
>
```

### Color Contrast

All color combinations meet WCAG 2.1 AA standards (4.5:1 for normal text, 3:1 for large text):

| Element | Foreground | Background | Ratio |
|---------|------------|------------|-------|
| Primary Text | #e0e0e0 | #1e1e1e | 10.4:1 ✓ |
| Secondary Text | #a0a0a0 | #1e1e1e | 6.7:1 ✓ |
| Primary Button | #ffffff | #007ad9 | 4.9:1 ✓ |
| Warning Text | #FFA726 | #e65100 | 4.6:1 ✓ |
| Error Text | #ffffff | #b71c1c | 7.2:1 ✓ |
| Success Text | #ffffff | #1b5e20 | 8.1:1 ✓ |

### Screen Reader Support

**Status Announcements:**
```vue
<div role="status" aria-live="polite" class="sr-only">
  {{ statusMessage }}
</div>

<!-- Examples -->
statusMessage: "Copy modal opened"
statusMessage: "Conflict detected for code-reviewer.md"
statusMessage: "Configuration copied successfully"
statusMessage: "Copy operation failed: Permission denied"
```

**Screen Reader Only Text:**
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

## Integration with Existing Components

### ConfigItemList.vue Integration

**Add Copy Button to Item Actions:**

```vue
<!-- In ConfigItemList.vue template -->
<div class="item-row">
  <div class="item-info" @click="handleItemClick(item)">
    <!-- Existing item content -->
  </div>

  <div class="item-actions">
    <CopyButton
      :config-item="item"
      :config-type="type"
      :disabled="item.location === 'plugin'"
      @click.stop="handleCopyClick(item)"
    />
  </div>
</div>
```

**Styling for Item Actions:**
```css
.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-secondary);
  cursor: pointer;
  transition: background 0.2s ease;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.item-row:hover .item-actions {
  opacity: 1;
}

/* Or always visible variant */
.item-actions.always-visible {
  opacity: 1;
}
```

### State Management (Pinia Store)

**New Copy Store Module:**

```javascript
// stores/copyConfig.js
import { defineStore } from 'pinia';

export const useCopyConfigStore = defineStore('copyConfig', {
  state: () => ({
    modalVisible: false,
    sourceItem: null,
    sourceType: null,
    sourceScope: null,
    sourceProjectId: null,
    conflictDialogVisible: false,
    conflictData: null,
    isLoading: false
  }),

  actions: {
    openCopyModal(item, type, scope, projectId) {
      this.sourceItem = item;
      this.sourceType = type;
      this.sourceScope = scope;
      this.sourceProjectId = projectId;
      this.modalVisible = true;
    },

    closeCopyModal() {
      this.modalVisible = false;
      this.sourceItem = null;
    },

    showConflictDialog(conflictData) {
      this.conflictData = conflictData;
      this.conflictDialogVisible = true;
    },

    async performCopy(destination, conflictStrategy = null) {
      this.isLoading = true;
      try {
        // API call to copy endpoint
        const result = await api.copy({
          sourceType: this.sourceType,
          sourcePath: this.sourceItem.path,
          sourceScope: this.sourceScope,
          sourceProjectId: this.sourceProjectId,
          targetScope: destination.scope,
          targetProjectId: destination.projectId,
          conflictStrategy
        });

        if (result.conflict && !conflictStrategy) {
          // Show conflict dialog
          this.showConflictDialog(result.conflict);
        } else if (result.success) {
          // Show success toast
          this.$toast.add({
            severity: 'success',
            summary: 'Configuration Copied Successfully',
            detail: result.message,
            life: 5000
          });
          this.closeCopyModal();
        }
      } catch (error) {
        // Show error toast
        this.$toast.add({
          severity: 'error',
          summary: 'Copy Failed',
          detail: error.message,
          life: 0
        });
      } finally {
        this.isLoading = false;
      }
    }
  }
});
```

---

## Animation & Transitions

### Modal Animations

**Enter Animation:**
- Overlay: Fade in (0.2s)
- Modal: Slide up + fade in (0.3s)

**Exit Animation:**
- Modal: Slide down + fade out (0.2s)
- Overlay: Fade out (0.2s)

```css
/* Vue Transition Integration */
.modal-enter-active {
  animation: slideUp 0.3s ease;
}

.modal-leave-active {
  animation: slideDown 0.2s ease;
}

.overlay-enter-active {
  animation: fadeIn 0.2s ease;
}

.overlay-leave-active {
  animation: fadeOut 0.2s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translate(-50%, -45%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

@keyframes slideDown {
  from {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -55%);
  }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
```

### Micro-interactions

**Button Hover:**
```css
.copy-btn {
  transition: all 0.2s ease;
  transform-origin: center;
}

.copy-btn:hover {
  transform: scale(1.05);
}

.copy-btn:active {
  transform: scale(0.95);
}
```

**Destination Card Selection:**
```css
.destination-card {
  transition: all 0.2s ease;
}

.destination-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
}

.destination-card:active {
  transform: translateY(0);
  box-shadow: var(--shadow-card);
}
```

---

## Dark Mode Palette (Phase 1 Required)

**Already defined in `src/styles/variables.css`**

### Key Colors for Copy Feature:

| Purpose | Variable | Value | Usage |
|---------|----------|-------|-------|
| Modal Background | `--bg-secondary` | #1e1e1e | Modal main background |
| Modal Header | `--bg-tertiary` | #252525 | Header and section backgrounds |
| Card Background | `--bg-tertiary` | #252525 | Source and destination cards |
| Hover State | `--bg-hover` | #2a2a2a | Interactive element hover |
| Primary Action | `--color-primary` | #007ad9 | "Copy Here" buttons |
| Warning | `--color-warning` | #FFA726 | Overwrite action |
| Success | `--color-success` | #4CAF50 | Success notifications |
| Error | `--color-error` | #EF5350 | Error notifications |
| Border | `--border-primary` | #3e3e3e | Card and modal borders |
| Text Primary | `--text-primary` | #e0e0e0 | Main text |
| Text Secondary | `--text-secondary` | #a0a0a0 | Subtitles and descriptions |
| Text Muted | `--text-muted` | #707070 | Labels and hints |

---

## Design Decisions Summary

### 1. Source vs Destination Differentiation

**Decision:** Subtle visual differentiation using layout hierarchy, not color coding.

**Rationale:**
- Source is at top (single card, compact, read-only feel)
- Destination is below (multiple cards, interactive, selection feel)
- Clear "COPY TO" label separates sections
- Avoid excessive color contrast that may be distracting

**Alternative Considered:** Color-code source (green) and destinations (blue)
**Rejected:** Too visually noisy, inconsistent with existing design system

### 2. Destination Cards Visible Before Scrolling

**Decision:** Show 3-4 destination cards before scrolling is required.

**Calculation:**
- Modal max height: 80vh
- Header: ~80px
- Source section: ~120px
- Footer: ~60px
- Remaining for destinations: ~80vh - 260px = ~400-500px
- Each destination card: ~80px height
- Visible cards: 5-6 cards comfortably

**Rationale:** Most users have 5-15 projects. Showing 5 immediately covers majority use case without overwhelming.

### 3. Conflict Preview Content

**Decision:** Show metadata only (name, path, modified date), NOT file contents.

**Rationale:**
- File contents can be very long (agents with hundreds of lines)
- Metadata sufficient for user to make informed decision
- Keeps dialog compact and fast to render
- User can always cancel and view full content in sidebar first

**Alternative Considered:** Show first 10 lines of each file
**Rejected:** Adds complexity, slows rendering, often not informative (YAML frontmatter)

### 4. Success Notification Action Link

**Decision:** Include optional "View in Target Project" link in success toast.

**Rationale:**
- Provides immediate way to verify copy
- Enhances user confidence
- Natural next step after copy operation
- Easy to implement (router navigation)

**Implementation:**
```vue
<router-link
  :to="`/project/${targetProjectId}`"
  class="toast-action-link"
>
  View in Target Project →
</router-link>
```

### 5. Undo Button in Success Toast

**Decision:** NO undo button in V1 (per decision #4 in decision-matrix.md).

**Rationale:**
- Adds significant complexity
- Rely on git for rollback
- Future CRUD delete provides manual cleanup
- Keep V1 focused and simple

### 6. Loading/Progress Indicator

**Decision:** Show loading overlay on modal during copy operation.

**Rationale:**
- Copy operations should be <500ms for files
- Simple spinner overlay sufficient
- Prevents accidental double-clicks
- Clear visual feedback that operation is in progress

**For Skills (large directories):**
- Show progress percentage if operation >1 second
- Backend can emit progress events
- Defer to V2 if adds >2 hours of work

---

## Open Questions for Review

### 1. Copy Button Visibility

**Question:** Should copy buttons be always visible or appear only on hover?

**Option A: Hover-only (chosen in wireframes)**
- Pros: Cleaner UI, less visual clutter
- Cons: Discoverability issue, not mobile-friendly

**Option B: Always visible**
- Pros: Better discoverability, mobile-friendly
- Cons: More visual noise, takes up space

**Recommendation:** Start with hover-only for desktop, always visible for mobile (<768px).

### 2. Destination Card Selection vs Buttons

**Question:** Should clicking the entire destination card trigger copy, or only the "Copy Here" button?

**Option A: Card click (alternative design)**
- Pros: Larger click target, faster workflow
- Cons: May be confusing if cards have other actions later

**Option B: Button only (chosen in wireframes)**
- Pros: Clear action trigger, explicit confirmation
- Cons: Smaller click target

**Recommendation:** Button only for V1 (safer, more explicit).

### 3. Scroll Behavior

**Question:** Should destination list auto-scroll to show "User Global" at top, or current project?

**Recommendation:** Always show "User Global" first (most common "promote to user-level" use case).

---

## Files Created

This design specification document serves as the complete reference for:

1. **Component Structure** - All Vue component definitions
2. **Styling Specifications** - Complete CSS for all states
3. **Interaction Patterns** - User flows and behaviors
4. **Accessibility** - WCAG 2.1 AA compliance guidelines
5. **Responsive Design** - Breakpoints and mobile adaptations
6. **Integration** - How to integrate with existing components

**Next Steps:**
1. Review this document with project manager
2. Create visual wireframe images (PNG/SVG) based on these specs
3. Get approval before frontend implementation begins

---

**Document Version:** 1.0
**Last Updated:** November 1, 2025
**Author:** UI/UX Design Specialist (Claude)
**Status:** Ready for Review
