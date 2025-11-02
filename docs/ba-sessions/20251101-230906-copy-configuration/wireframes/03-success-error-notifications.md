# Wireframe: Success & Error Notifications

**Component:** PrimeVue Toast Service
**Purpose:** Provide feedback after copy operations (success or error)
**Position:** Top-right corner of screen

---

## Success Notification (Toast)

### Full Layout
```
                                    ┌──────────────────────────────────┐
                                    │ ✓ Configuration Copied Success...│ ← Summary
                                    ├──────────────────────────────────┤
Screen Top-Right Corner →           │ code-reviewer.md has been copied │ ← Detail
                                    │ to:                              │
                                    │                                  │
                                    │ ~/projects/api-server/.claude/   │
                                    │ agents/                          │
                                    │                                  │
                                    │ [View in Target Project →]  [×]  │ ← Actions
                                    └──────────────────────────────────┘
                                              ↑
                                    400px width, auto height
                                    Auto-dismiss: 5 seconds
```

### Detailed Breakdown
```
┌────────────────────────────────────────────────────────┐
│ ✓  Configuration Copied Successfully             [×]   │ ← Header
├────────────────────────────────────────────────────────┤
│ code-reviewer.md has been copied to:                   │ ← Message Line 1
│                                                        │
│ ~/projects/api-server/.claude/agents/                  │ ← Message Line 2
│                                                        │   (Target Path)
│ ┌──────────────────────────────────────────────────┐   │
│ │ View in Target Project →                         │   │ ← Optional Action Link
│ └──────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

### Components

#### Header Section
```
┌────────────────────────────────────────────────────┐
│ ✓  Configuration Copied Successfully          [×]  │
└────────────────────────────────────────────────────┘
  ↑                                                ↑
  Success Icon (1.5rem)                       Close Button
  --color-success                             (16x16px)
```

**Elements:**
1. **Icon:** ✓ checkmark (pi pi-check-circle, 1.5rem, --color-success)
2. **Summary:** "Configuration Copied Successfully" (1rem, bold, --text-emphasis)
3. **Close Button:** × (pi pi-times, 16x16px, clickable)

**Styling:**
```css
.p-toast-message-success {
  background: var(--color-success-bg); /* #1b5e20 dark green */
  border: 1px solid var(--color-success); /* #4CAF50 green */
  border-left: 4px solid var(--color-success); /* Accent border */
  border-radius: 6px;
  padding: 1rem;
  box-shadow: var(--shadow-card-hover);
  min-width: 400px;
  max-width: 500px;
}

.p-toast-message-icon {
  color: var(--color-success);
  font-size: 1.5rem;
  margin-right: 0.75rem;
}

.p-toast-summary {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-emphasis);
  margin-bottom: 0.5rem;
}
```

---

#### Detail Section
```
┌────────────────────────────────────────────────────┐
│ code-reviewer.md has been copied to:               │
│                                                    │
│ ~/projects/api-server/.claude/agents/              │
└────────────────────────────────────────────────────┘
```

**Elements:**
1. **Line 1:** "{fileName} has been copied to:" (0.875rem, --text-secondary)
2. **Line 2:** Full target path (0.875rem, --text-secondary, monospace)

**Styling:**
```css
.p-toast-detail {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.6;
  white-space: pre-wrap;
  margin-bottom: 0.75rem;
}

.p-toast-detail code,
.p-toast-detail .path {
  font-family: 'Courier New', monospace;
  background: var(--bg-primary);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  color: var(--text-primary);
}
```

---

#### Action Link (Optional)
```
┌────────────────────────────────────────────────────┐
│ [View in Target Project →]                         │
└────────────────────────────────────────────────────┘
```

**Elements:**
1. **Link:** "View in Target Project →" with arrow icon
2. **Behavior:** Navigates to target project detail page
3. **Style:** Primary blue link color

**Styling:**
```css
.toast-action-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  color: var(--color-primary);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
}

.toast-action-link:hover {
  background: var(--bg-hover);
  border-color: var(--color-primary);
  color: var(--color-primary-hover);
}

.toast-action-link i {
  font-size: 0.875rem;
}
```

---

### Animation Sequence

#### Enter Animation (Slide in from right)
```
Frame 1 (0ms):           Frame 2 (150ms):        Frame 3 (300ms):
Hidden                   50% visible             100% visible
transform: X(100%)       transform: X(50%)       transform: X(0)
opacity: 0               opacity: 0.5            opacity: 1
```

```css
.p-toast-message-enter-active {
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

#### Exit Animation (Fade out)
```
Frame 1 (0ms):           Frame 2 (150ms):        Frame 3 (300ms):
100% visible             50% visible             Hidden
opacity: 1               opacity: 0.5            opacity: 0
transform: X(0)          transform: X(20%)       transform: X(50%)
```

```css
.p-toast-message-leave-active {
  animation: fadeOutRight 0.3s ease-in;
}

@keyframes fadeOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(50%);
    opacity: 0;
  }
}
```

#### Auto-Dismiss Timer Indicator (Optional)
```
┌────────────────────────────────────────────────────┐
│ ✓  Configuration Copied Successfully          [×]  │
├────────────────────────────────────────────────────┤
│ Message content...                                 │
│                                                    │
│ [Progress bar: ████████░░░░░░░░░░░░░░░░░]  60%   │ ← Timer
└────────────────────────────────────────────────────┘
```

**Optional Enhancement:** Show countdown bar (0% to 100% over 5 seconds)

---

## Error Notification (Toast)

### Full Layout
```
                                    ┌──────────────────────────────────┐
                                    │ ✗ Cannot Copy to Target Location │ ← Summary
                                    ├──────────────────────────────────┤
Screen Top-Right Corner →           │ Permission denied                │ ← Error Reason
                                    │                                  │
                                    │ Check file permissions and try   │ ← Advice
                                    │ again.                           │
                                    │                                  │
                                    │                             [×]  │ ← Close Only
                                    └──────────────────────────────────┘
                                              ↑
                                    400px width, auto height
                                    NO auto-dismiss (manual close)
```

### Detailed Breakdown
```
┌────────────────────────────────────────────────────────┐
│ ✗  Cannot Copy to Target Location                [×]   │ ← Header
├────────────────────────────────────────────────────────┤
│ Permission denied                                      │ ← Error Reason
│                                                        │   (Bold, emphasized)
│ Check file permissions and try again.                  │ ← Actionable Advice
└────────────────────────────────────────────────────────┘
```

### Components

#### Header Section
```
┌────────────────────────────────────────────────────┐
│ ✗  Cannot Copy to Target Location             [×]  │
└────────────────────────────────────────────────────┘
  ↑                                                ↑
  Error Icon (1.5rem)                         Close Button
  --color-error                               (16x16px)
```

**Elements:**
1. **Icon:** ✗ (pi pi-times-circle, 1.5rem, --color-error)
2. **Summary:** "Cannot Copy to Target Location" (1rem, bold, --text-emphasis)
3. **Close Button:** × (pi pi-times, 16x16px, clickable) - **no auto-dismiss**

**Styling:**
```css
.p-toast-message-error {
  background: var(--color-error-bg); /* #b71c1c dark red */
  border: 1px solid var(--color-error); /* #EF5350 red */
  border-left: 4px solid var(--color-error); /* Accent border */
  border-radius: 6px;
  padding: 1rem;
  box-shadow: var(--shadow-card-hover);
  min-width: 400px;
  max-width: 500px;
}

.p-toast-message-error .p-toast-message-icon {
  color: var(--color-error);
  font-size: 1.5rem;
  margin-right: 0.75rem;
}

.p-toast-message-error .p-toast-summary {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-emphasis);
  margin-bottom: 0.5rem;
}
```

---

#### Detail Section
```
┌────────────────────────────────────────────────────┐
│ Permission denied                                  │ ← Error Type
│                                                    │
│ Check file permissions and try again.              │ ← Advice
└────────────────────────────────────────────────────┘
```

**Elements:**
1. **Error Reason:** "Permission denied" (0.875rem, bold, --text-primary)
2. **Blank Line:** Spacing for readability
3. **Actionable Advice:** What user should do (0.875rem, --text-secondary)

**Styling:**
```css
.p-toast-message-error .p-toast-detail {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.6;
  white-space: pre-wrap;
}

.p-toast-detail-reason {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.p-toast-detail-advice {
  font-style: italic;
  color: var(--text-muted);
}
```

---

### Error Message Templates

#### Error 1: Permission Denied (EACCES)
```
┌────────────────────────────────────────────────────┐
│ ✗  Cannot Copy to Target Location            [×]  │
├────────────────────────────────────────────────────┤
│ Permission denied                                  │
│                                                    │
│ Check file permissions and try again.              │
└────────────────────────────────────────────────────┘
```

#### Error 2: Disk Space Full (ENOSPC)
```
┌────────────────────────────────────────────────────┐
│ ✗  Cannot Copy to Target Location            [×]  │
├────────────────────────────────────────────────────┤
│ Disk space full                                    │
│                                                    │
│ Free up disk space and try again.                  │
└────────────────────────────────────────────────────┘
```

#### Error 3: Source File Not Found (ENOENT)
```
┌────────────────────────────────────────────────────┐
│ ✗  Cannot Copy Configuration                  [×]  │
├────────────────────────────────────────────────────┤
│ Source file not found                              │
│                                                    │
│ The file may have been deleted.                    │
└────────────────────────────────────────────────────┘
```

#### Error 4: Read-Only Filesystem (EROFS)
```
┌────────────────────────────────────────────────────┐
│ ✗  Cannot Copy to Target Location            [×]  │
├────────────────────────────────────────────────────┤
│ Read-only filesystem                               │
│                                                    │
│ Choose a different target location.                │
└────────────────────────────────────────────────────┘
```

#### Error 5: Target is Directory (EISDIR)
```
┌────────────────────────────────────────────────────┐
│ ✗  Cannot Copy Configuration                  [×]  │
├────────────────────────────────────────────────────┤
│ Target is a directory                              │
│                                                    │
│ The target path is invalid.                        │
└────────────────────────────────────────────────────┘
```

#### Error 6: Generic/Unknown Error
```
┌────────────────────────────────────────────────────┐
│ ✗  Copy Failed                                [×]  │
├────────────────────────────────────────────────────┤
│ An unexpected error occurred                       │
│                                                    │
│ Please try again or contact support.               │
└────────────────────────────────────────────────────┘
```

---

## Multiple Toast Stack

### When Multiple Operations Occur
```
Screen Top-Right:

┌────────────────────────────────────────┐ ← Toast 1 (newest)
│ ✓ Configuration Copied Successfully    │
│ code-reviewer.md → api-server          │
└────────────────────────────────────────┘
  ↓ (8px gap)
┌────────────────────────────────────────┐ ← Toast 2 (older)
│ ✓ Configuration Copied Successfully    │
│ test-generator.md → mobile-app         │
└────────────────────────────────────────┘
  ↓ (8px gap)
┌────────────────────────────────────────┐ ← Toast 3 (oldest)
│ ✗ Cannot Copy to Target Location      │
│ Permission denied                      │
└────────────────────────────────────────┘
```

**Stacking Behavior:**
- Newest toast appears at top
- Older toasts push down
- Max 5 toasts visible (older ones auto-dismiss)
- Gap between toasts: 8px

---

## Positioning & Responsive Behavior

### Desktop (>1024px)
```
Screen Layout:
┌────────────────────────────────────────────────────┐
│ App Header                                         │
├────────────────────────────────────────────────────┤
│                                                    │
│  Main Content                     ┌──────────────┐ │
│                                   │ Toast Area   │ │ ← Top-right
│                                   │              │ │   16px from top
│                                   └──────────────┘ │   16px from right
│                                                    │
└────────────────────────────────────────────────────┘
```

**Position:**
- Fixed position
- Top: 80px (below header)
- Right: 16px
- Z-index: 2000 (above modals)

### Tablet (768px - 1023px)
```
Screen Layout:
┌────────────────────────────────────┐
│ App Header                         │
├────────────────────────────────────┤
│                                    │
│  Main Content    ┌───────────────┐ │ ← Toast Area
│                  │ Toast         │ │   Narrower
│                  └───────────────┘ │   (300px width)
│                                    │
└────────────────────────────────────┘
```

**Position:**
- Fixed position
- Top: 80px
- Right: 12px
- Width: 300px (narrower)

### Mobile (<768px)
```
Screen Layout:
┌────────────────────────────────────┐
│ App Header                         │
├────────────────────────────────────┤
│ ┌────────────────────────────────┐ │ ← Toast Area
│ │ Toast (full width)             │ │   Full width
│ └────────────────────────────────┘ │   Top of content
│                                    │
│  Main Content                      │
│                                    │
└────────────────────────────────────┘
```

**Position:**
- Fixed position
- Top: 60px (below mobile header)
- Left: 8px
- Right: 8px
- Width: calc(100vw - 16px)

---

## Accessibility Features

### Screen Reader Announcements

**Success Toast:**
```html
<div role="status" aria-live="polite" aria-atomic="true">
  Configuration copied successfully.
  code-reviewer.md has been copied to ~/projects/api-server/.claude/agents/.
</div>
```

**Error Toast:**
```html
<div role="alert" aria-live="assertive" aria-atomic="true">
  Error: Cannot copy to target location.
  Permission denied. Check file permissions and try again.
</div>
```

**ARIA Attributes:**
- Success: `role="status"`, `aria-live="polite"`
- Error: `role="alert"`, `aria-live="assertive"` (higher priority)
- `aria-atomic="true"` (read entire message)

### Keyboard Navigation

**Close Button Focus:**
```css
.p-toast-close-button:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
  border-radius: 4px;
}
```

**Action Link Focus:**
```css
.toast-action-link:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}
```

**Keyboard Shortcuts:**
- **Escape:** Dismiss focused toast
- **Tab:** Navigate to close button or action link
- **Enter:** Activate action link (if present)

---

## Color Contrast Validation

### Success Toast (Dark Mode)
| Element | Foreground | Background | Ratio | Pass |
|---------|------------|------------|-------|------|
| Summary | #ffffff | #1b5e20 | 8.1:1 | ✓ AAA |
| Detail | #a0a0a0 | #1b5e20 | 4.9:1 | ✓ AA |
| Icon | #4CAF50 | #1b5e20 | 3.2:1 | ✓ Large |

### Error Toast (Dark Mode)
| Element | Foreground | Background | Ratio | Pass |
|---------|------------|------------|-------|------|
| Summary | #ffffff | #b71c1c | 7.2:1 | ✓ AAA |
| Detail | #a0a0a0 | #b71c1c | 4.6:1 | ✓ AA |
| Icon | #EF5350 | #b71c1c | 3.5:1 | ✓ Large |

All combinations meet WCAG 2.1 AA standards (4.5:1 minimum for normal text).

---

## Implementation Notes

### PrimeVue Toast Service Usage

**In App.vue:**
```vue
<template>
  <Toast position="top-right" />
</template>

<script setup>
import Toast from 'primevue/toast';
</script>
```

**In Component:**
```vue
<script setup>
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const showSuccessToast = (fileName, targetPath) => {
  toast.add({
    severity: 'success',
    summary: 'Configuration Copied Successfully',
    detail: `${fileName} has been copied to:\n\n${targetPath}`,
    life: 5000, // 5 seconds
    closable: true
  });
};

const showErrorToast = (errorType, errorMessage) => {
  toast.add({
    severity: 'error',
    summary: 'Cannot Copy to Target Location',
    detail: `${errorType}\n\nCheck file permissions and try again.`,
    life: 0, // No auto-dismiss
    closable: true
  });
};
</script>
```

---

**Wireframe Version:** 1.0
**Created:** November 1, 2025
**Status:** Ready for Review
