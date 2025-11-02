# Wireframe: Conflict Resolution Dialog

**Component:** ConflictDialog.vue
**Purpose:** Handle conflicts when copying to a location with existing file
**Dimensions:** 550px width, max 70vh height

---

## Full Dialog Layout

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │           MODAL OVERLAY (darker - 60% black)                 │ │
│  │                                                              │ │
│  │  ┌───────────────────────────────────────────────────────┐  │ │
│  │  │ ⚠️  File Already Exists                          [×]  │  │ │ ← Header (warning bg)
│  │  ├───────────────────────────────────────────────────────┤  │ │
│  │  │                                                       │  │ │
│  │  │ A file with this name already exists at the         │  │ │ ← Explanation
│  │  │ destination. What would you like to do?             │  │ │
│  │  │                                                       │  │ │
│  │  │ ┌─────────────────────────────────────────────────┐  │  │ │
│  │  │ │ SOURCE FILE                                     │  │  │ │ ← Source Info
│  │  │ │ code-reviewer.md                                │  │  │ │
│  │  │ │ ~/projects/web-app/.claude/agents/              │  │  │ │
│  │  │ │ Last modified: Nov 1, 2025 2:30 PM              │  │  │ │
│  │  │ └─────────────────────────────────────────────────┘  │  │ │
│  │  │                                                       │  │ │
│  │  │ ┌─────────────────────────────────────────────────┐  │  │ │
│  │  │ │ TARGET FILE                                     │  │  │ │ ← Target Info
│  │  │ │ code-reviewer.md                                │  │  │ │
│  │  │ │ ~/projects/api-server/.claude/agents/           │  │  │ │
│  │  │ │ Last modified: Oct 15, 2025 10:45 AM            │  │  │ │
│  │  │ └─────────────────────────────────────────────────┘  │  │ │
│  │  │                                                       │  │ │
│  │  │ ┌─────────────────────────────────────────────────┐  │  │ │
│  │  │ │ CHOOSE AN ACTION:                               │  │  │ │ ← Action Selection
│  │  │ │                                                 │  │  │ │
│  │  │ │ ○ Skip (don't copy)                             │  │  │ │ ← Radio Option 1
│  │  │ │   The target file will remain unchanged.        │  │  │ │
│  │  │ │                                                 │  │  │ │
│  │  │ │ ○ Overwrite (replace target)                    │  │  │ │ ← Radio Option 2
│  │  │ │   ⚠️  The existing file will be replaced.       │  │  │ │   (warning color)
│  │  │ │                                                 │  │  │ │
│  │  │ │ ● Rename (copy as code-reviewer-2.md)           │  │  │ │ ← Radio Option 3
│  │  │ │   The new file will be saved with a new name.   │  │  │ │   (DEFAULT selected)
│  │  │ └─────────────────────────────────────────────────┘  │  │ │
│  │  │                                                       │  │ │
│  │  │                      [Cancel]  [Confirm Action]       │  │ │ ← Footer
│  │  └───────────────────────────────────────────────────────┘  │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### Header Section (Warning Style)
```
┌───────────────────────────────────────────────────────┐
│ ⚠️  File Already Exists                          [×]  │
└───────────────────────────────────────────────────────┘
  ↑                                                  ↑
  Warning Icon (1.5rem)                          Close Button
  --color-warning                                (32x32px)

  Background: var(--color-warning-bg) #e65100
  Text Color: var(--text-emphasis)
```

**Styling:**
- Background: `var(--color-warning-bg)` (dark orange for dark mode)
- Padding: `1.5rem`
- Border-bottom: `1px solid var(--border-primary)`
- Display: flex, align-items: center, gap: 0.75rem

---

### Explanation Text
```
┌───────────────────────────────────────────────────────┐
│ A file with this name already exists at the         │
│ destination. What would you like to do?             │
└───────────────────────────────────────────────────────┘
```

**Styling:**
- Font-size: `0.95rem`
- Color: `var(--text-primary)`
- Line-height: `1.6`
- Margin-bottom: `1.5rem`
- Padding: `1.5rem 1.5rem 0`

---

### File Info Cards

#### Source File Card
```
┌─────────────────────────────────────────────────────────┐
│ SOURCE FILE                                             │ ← Label
│ code-reviewer.md                                        │ ← File Name
│ ~/projects/web-app/.claude/agents/                      │ ← Path
│ Last modified: Nov 1, 2025 2:30 PM                      │ ← Modified Date
└─────────────────────────────────────────────────────────┘
```

**Elements:**
1. **Label:** "SOURCE FILE" (0.75rem, uppercase, --text-muted, letter-spacing: 0.5px)
2. **File Name:** `code-reviewer.md` (1rem, bold, --text-primary)
3. **Path:** Full path (0.875rem, --text-secondary)
4. **Modified:** Timestamp (0.8rem, --text-muted)

**Styling:**
- Background: `var(--bg-tertiary)`
- Border: `1px solid var(--border-primary)`
- Border-radius: `6px`
- Padding: `1rem`
- Margin-bottom: `1rem`

#### Target File Card
```
┌─────────────────────────────────────────────────────────┐
│ TARGET FILE                                             │ ← Label
│ code-reviewer.md                                        │ ← File Name (same)
│ ~/projects/api-server/.claude/agents/                   │ ← Path (different)
│ Last modified: Oct 15, 2025 10:45 AM                    │ ← Modified Date (older)
└─────────────────────────────────────────────────────────┘
```

**Styling:** Same as Source File Card

**Visual Differentiation:**
- Source: Subtle blue left border (optional)
- Target: Subtle orange left border (optional)

```css
.source-file-card {
  border-left: 3px solid var(--color-info);
}

.target-file-card {
  border-left: 3px solid var(--color-warning);
}
```

---

### Action Selection Section

#### Container
```
┌───────────────────────────────────────────────────────────┐
│ CHOOSE AN ACTION:                                         │ ← Section Label
│                                                           │
│ (Radio options below)                                     │
└───────────────────────────────────────────────────────────┘
```

**Styling:**
- Background: `var(--bg-secondary)`
- Border: `1px solid var(--border-primary)`
- Border-radius: `6px`
- Padding: `1rem`
- Margin-top: `1.5rem`

---

#### Radio Option 1: Skip (Don't Copy)
```
┌───────────────────────────────────────────────────────────┐
│ ○ Skip (don't copy)                                       │ ← Radio + Label
│   The target file will remain unchanged.                  │ ← Description
└───────────────────────────────────────────────────────────┘
```

**Elements:**
- **Radio Button:** Unchecked circle (○)
- **Title:** "Skip (don't copy)" (0.95rem, bold, --text-primary)
- **Description:** Helper text (0.85rem, --text-secondary)

**Styling:**
- Padding: `0.75rem`
- Border-radius: `4px`
- Cursor: pointer
- Hover: background: `var(--bg-hover)`

---

#### Radio Option 2: Overwrite (Warning Style)
```
┌───────────────────────────────────────────────────────────┐
│ ○ Overwrite (replace target)                              │ ← Radio + Label
│   ⚠️  The existing file will be replaced.                 │ ← Warning Description
└───────────────────────────────────────────────────────────┘
```

**Elements:**
- **Radio Button:** Unchecked circle (○)
- **Title:** "Overwrite (replace target)" (0.95rem, bold, **--color-warning**)
- **Description:** "⚠️ The existing file will be replaced." (0.85rem, --text-secondary)
- **Warning Icon:** ⚠️ prepended to description

**Styling:**
- Same as Option 1
- Title color: `var(--color-warning)` to indicate destructive action
- Description has warning emoji prefix

---

#### Radio Option 3: Rename (Default Selected)
```
┌───────────────────────────────────────────────────────────┐
│ ● Rename (copy as code-reviewer-2.md)                     │ ← Radio + Label
│   The new file will be saved with a new name.             │ ← Description
└───────────────────────────────────────────────────────────┘
```

**Elements:**
- **Radio Button:** Checked circle (●) - **DEFAULT**
- **Title:** "Rename (copy as code-reviewer-2.md)" (0.95rem, bold, --text-primary)
- **Description:** Helper text (0.85rem, --text-secondary)

**Styling:**
- Same as Option 1
- Background: `var(--bg-hover)` when selected
- Border: `2px solid var(--color-primary)` when selected

---

## Radio Button Detailed Design

### Unchecked State
```
○  Skip (don't copy)
↑
Circle: 18px diameter
Border: 2px solid var(--border-primary)
Background: transparent
```

### Checked State
```
●  Rename (copy as...)
↑
Circle: 18px diameter
Border: 2px solid var(--color-primary)
Background: var(--color-primary)
Inner dot: 8px diameter, white
```

### Hover State (Unchecked)
```
◉  Overwrite (replace target)
↑
Border color changes to: var(--color-primary)
Cursor: pointer
```

### Focus State (Keyboard Navigation)
```
◎  Skip (don't copy)
↑
Outline: 2px solid var(--border-focus)
Outline-offset: 2px
```

---

## Button Specifications

### Cancel Button (Secondary)
```
┌─────────────────┐
│ Cancel          │
└─────────────────┘
```

**Styling:**
- Background: transparent
- Border: `1px solid var(--border-primary)`
- Color: `var(--text-primary)`
- Padding: `0.75rem 1.5rem`
- Border-radius: `4px`
- Font-size: `0.875rem`
- Hover: background: `var(--bg-hover)`, border-color: `var(--color-primary)`

### Confirm Action Button (Primary)

**Default (Rename/Skip selected):**
```
┌─────────────────────┐
│ Confirm Action      │  ← Blue primary button
└─────────────────────┘
```

**Styling:**
- Background: `var(--color-primary)` #007ad9
- Color: white
- Padding: `0.75rem 1.5rem`
- Border-radius: `4px`
- Font-size: `0.875rem`
- Font-weight: 500
- Hover: background: `var(--color-primary-hover)` #005fa3

**Overwrite selected:**
```
┌─────────────────────┐
│ Confirm Action      │  ← Orange/warning button
└─────────────────────┘
```

**Styling:**
- Background: `var(--color-warning)` #FFA726
- Color: white
- Hover: background: `var(--color-warning-bg)` #e65100

---

## Interaction States

### 1. Dialog Opening
```
Step 1: Copy Modal dims (opacity: 0.6)
Step 2: Conflict Dialog overlay appears (darker overlay)
Step 3: Conflict Dialog slides in from center (scale up animation)

Animation:
- Duration: 0.3s
- Easing: ease-out
- Transform: scale(0.9) → scale(1.0)
- Opacity: 0 → 1
```

### 2. Radio Selection Change
```
Before (Rename selected):
● Rename (copy as...)          ← Selected (blue border)
○ Skip (don't copy)             ← Unselected
○ Overwrite (replace target)    ← Unselected

User clicks "Overwrite":
○ Rename (copy as...)           ← Deselect animation
● Overwrite (replace target)    ← Select animation (border → blue)
○ Skip (don't copy)             ← Unchanged

Confirm Button:
[Confirm Action]                ← Background changes to warning color
```

### 3. Confirm Action Click
```
Step 1: Button shows loading state
┌─────────────────────┐
│ [Spinner] Loading   │
└─────────────────────┘

Step 2: Dialog closes (fade out)

Step 3a: Success - Show success toast
Step 3b: Error - Show error toast
```

---

## Edge Cases

### Case 1: Very Long File Name
```
┌─────────────────────────────────────────────────────┐
│ very-long-agent-name-that-might-overflow-the-ui.md  │
│ Wraps to second line if needed                      │
└─────────────────────────────────────────────────────┘
```

**Handling:**
- File name: word-break: break-all
- Max 2 lines before ellipsis
- Show full name in tooltip on hover

### Case 2: Very Long Path
```
┌─────────────────────────────────────────────────────┐
│ ~/very/long/path/to/project/directory/.claude/...   │
│ Uses ellipsis in middle of path                     │
└─────────────────────────────────────────────────────┘
```

**Handling:**
- Path: text-overflow: ellipsis
- Full path in tooltip on hover
- Consider middle ellipsis: "~/very/.../agents/"

### Case 3: Recently Modified Files (Time Comparison)
```
Source File:
Last modified: Nov 1, 2025 2:30 PM  (TODAY - show in green)

Target File:
Last modified: Oct 15, 2025 10:45 AM  (older - neutral)
```

**Visual Hint:**
- If source is newer: subtle green indicator
- If target is newer: subtle orange indicator (user might lose recent work)

```css
.file-modified-newer {
  color: var(--color-success);
}

.file-modified-older {
  color: var(--color-warning);
}
```

---

## Annotations

**Key Design Decisions:**

1. **Default to Rename:** Safest option pre-selected to prevent accidental data loss
2. **Warning Styling for Overwrite:** Orange color and warning icon make destructive action obvious
3. **File Comparison:** Show both source and target info so user can make informed decision
4. **Button Color Changes:** Confirm button changes to warning color when Overwrite is selected
5. **No File Content Preview:** Metadata only (name, path, date) to keep dialog compact

**Accessibility Notes:**
- All radio options keyboard navigable (arrow keys)
- ARIA role="radiogroup" on action selection
- ARIA-describedby links each radio to its description
- Screen reader announces: "Warning: File already exists" when dialog opens
- Focus automatically set to first radio option on open

**Responsive Behavior:**
- Desktop (>768px): 550px wide, centered
- Mobile (<768px): 100vw width, full screen overlay
- Paths may wrap on mobile (word-break: break-all)

**Error Prevention:**
- Confirm button requires radio selection (can't proceed without choosing)
- Warning styling for destructive actions
- Clear descriptions of what each action does

---

## Alternative: Scrollable Content (Many Conflicts)

**Note:** V1 handles single-item copy only. For future batch operations:

```
┌───────────────────────────────────────────────────────┐
│ ⚠️  3 Conflicts Detected                         [×]  │
├───────────────────────────────────────────────────────┤
│ Multiple files already exist. Choose actions:         │
│                                                       │
│ ┌───────────────────────────────────────────────────┐ │
│ │ [Scrollable area with multiple conflict cards]    │ │
│ │                                                   │ │
│ │ 1. code-reviewer.md                               │ │
│ │    [Rename] [Overwrite] [Skip]                    │ │
│ │                                                   │ │
│ │ 2. test-generator.md                              │ │
│ │    [Rename] [Overwrite] [Skip]                    │ │
│ └───────────────────────────────────────────────────┘ │
│                                                       │
│              [Skip All]  [Confirm Actions]            │
└───────────────────────────────────────────────────────┘
```

**Defer to V2:** Batch operations with multiple conflicts

---

**Wireframe Version:** 1.0
**Created:** November 1, 2025
**Status:** Ready for Review
