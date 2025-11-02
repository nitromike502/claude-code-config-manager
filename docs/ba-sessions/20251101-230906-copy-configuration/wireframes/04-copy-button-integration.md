# Wireframe: Copy Button Integration

**Component:** CopyButton.vue (integrated into existing config items)
**Purpose:** Trigger copy operation from config item lists
**Integration Points:** ConfigItemList.vue, ConfigCard.vue

---

## Copy Button in Config Item List

### Full Item Row Layout
```
┌────────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────────┐   │ ← Config Card
│ │ Agents (12)                                              │   │
│ ├──────────────────────────────────────────────────────────┤   │
│ │ ┌────────────────────────────────────────────────────┐   │   │ ← Item Row
│ │ │ 📝 code-reviewer                   🔧 [👁] [📋]    │   │   │
│ │ │ Reviews code for quality and best practices       │   │   │
│ │ └────────────────────────────────────────────────────┘   │   │
│ │ ┌────────────────────────────────────────────────────┐   │   │
│ │ │ 📝 test-generator                  🔧 [👁] [📋]    │   │   │
│ │ │ Generates unit tests for components               │   │   │
│ │ └────────────────────────────────────────────────────┘   │   │
│ │ ┌────────────────────────────────────────────────────┐   │   │
│ │ │ 📝 docs-writer                     🔧 [👁] [📋]    │   │   │
│ │ │ Creates documentation from code                   │   │   │
│ │ └────────────────────────────────────────────────────┘   │   │
│ └──────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
                                                ↑     ↑
                                            View   Copy
                                            (👁)   (📋)
```

### Detailed Item Row
```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  📝 code-reviewer                    🔧  [👁 View]  [📋 Copy]   │ ← Item Row
│  Reviews code for quality and best practices                    │   (Hover State)
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
  ↑                                    ↑      ↑           ↑
  Icon                              Badge   View Btn   Copy Btn
  + Name                            (tools)            (NEW)
  Description (secondary text)
```

---

## Copy Button States

### State 1: Default (Not Hovered)

**Option A: Always Visible (Recommended for Mobile)**
```
┌──────────────────────────────────────────────────────────┐
│ 📝 code-reviewer                [👁 View]  [📋 Copy]     │
│ Reviews code for quality and best practices             │
└──────────────────────────────────────────────────────────┘
                                              ↑
                                    Copy button visible
                                    Opacity: 0.6
```

**Option B: Hover-Only (Recommended for Desktop)**
```
┌──────────────────────────────────────────────────────────┐
│ 📝 code-reviewer                [👁 View]                │
│ Reviews code for quality and best practices             │
└──────────────────────────────────────────────────────────┘
                                              ↑
                                    Copy button hidden
                                    (appears on hover)
```

---

### State 2: Hover (Desktop)
```
┌══════════════════════════════════════════════════════════┐ ← Background highlight
║ 📝 code-reviewer                [👁 View]  [📋 Copy]     ║   (--bg-hover)
║ Reviews code for quality and best practices             ║
╚══════════════════════════════════════════════════════════╝
                                    ↑           ↑
                              View Button   Copy Button
                              Opacity: 1    Opacity: 1
                                            (slides in)
```

**Animation:**
- Copy button slides in from right (100ms)
- Opacity: 0 → 1
- Transform: translateX(10px) → translateX(0)

---

### State 3: Copy Button Hover
```
┌──────────────────────────────────────────────────────────┐
│ 📝 code-reviewer                [👁 View]  [📋 Copy]     │
│ Reviews code for quality and best practices             │
└──────────────────────────────────────────────────────────┘
                                              ↑
                                    Border: var(--color-primary)
                                    Background: var(--bg-hover)
                                    Scale: 1.05
```

---

### State 4: Copy Button Active/Click
```
┌──────────────────────────────────────────────────────────┐
│ 📝 code-reviewer                [👁 View]  [📋 Copy]     │
│ Reviews code for quality and best practices             │
└──────────────────────────────────────────────────────────┘
                                              ↑
                                    Scale: 0.95
                                    Triggers modal opening
```

---

### State 5: Disabled (Plugin Item)
```
┌──────────────────────────────────────────────────────────┐
│ 📦 analytics-agent  [PLUGIN]    [👁 View]  [🚫 Copy]     │
│ Provided by Analytics Plugin                            │
└──────────────────────────────────────────────────────────┘
                                              ↑
                                    Opacity: 0.4
                                    Cursor: not-allowed
                                    Tooltip: "Plugin items cannot be copied"
```

---

## Copy Button Component

### Button Variants

#### Variant 1: Icon Only (Compact)
```
┌───┐
│📋 │  ← Icon: pi pi-copy
└───┘
  ↑
  32x32px
  No text label
  Tooltip: "Copy to..."
```

**Usage:** When space is limited, icon-only is cleaner

**Styling:**
```css
.copy-btn-icon-only {
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: 1px solid var(--border-secondary);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.copy-btn-icon-only i {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.copy-btn-icon-only:hover:not(:disabled) {
  background: var(--bg-hover);
  border-color: var(--color-primary);
  transform: scale(1.05);
}

.copy-btn-icon-only:active {
  transform: scale(0.95);
}

.copy-btn-icon-only:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

---

#### Variant 2: Icon + Text Label
```
┌──────────┐
│ 📋 Copy  │  ← Icon + Text
└──────────┘
  ↑
  Auto width
  Padding: 0.5rem 0.75rem
```

**Usage:** When space allows, text makes action clearer

**Styling:**
```css
.copy-btn-with-label {
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: 1px solid var(--border-secondary);
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.copy-btn-with-label i {
  font-size: 0.875rem;
}

.copy-btn-with-label:hover:not(:disabled) {
  background: var(--bg-hover);
  border-color: var(--color-primary);
  color: var(--text-primary);
}
```

---

#### Variant 3: Menu Item (Dropdown)
```
┌────────────────────┐
│ 📋 Copy to...      │  ← Menu item in dropdown
├────────────────────┤
│ 👁 View Details    │
│ 📋 Copy to...      │  ← This option
│ ✏️  Edit           │
│ 🗑️  Delete         │
└────────────────────┘
```

**Usage:** Alternative integration as menu item (future enhancement)

---

## Integration Patterns

### Pattern 1: Inline Actions (Recommended for V1)
```
Item Layout:
┌──────────────────────────────────────────────────────────┐
│ [Icon] [Name + Description]              [Actions Area]  │
└──────────────────────────────────────────────────────────┘
  ↑                                         ↑
  Item Info (flex: 1)                     Actions (flex-end)
```

**HTML Structure:**
```vue
<div class="item-row">
  <div class="item-info" @click="handleViewDetails">
    <i :class="typeIcon"></i>
    <div class="item-text">
      <div class="item-name">{{ item.name }}</div>
      <div class="item-description">{{ item.description }}</div>
    </div>
    <div class="item-badges">
      <span v-if="item.location === 'plugin'" class="badge-plugin">
        PLUGIN
      </span>
    </div>
  </div>

  <div class="item-actions">
    <button class="view-btn" @click.stop="handleViewDetails">
      <i class="pi pi-eye"></i>
      <span>View</span>
    </button>

    <CopyButton
      :config-item="item"
      :config-type="type"
      :disabled="item.location === 'plugin'"
      @click.stop="handleCopy"
    />
  </div>
</div>
```

**CSS:**
```css
.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-secondary);
  transition: background 0.2s ease;
  cursor: pointer;
}

.item-row:hover {
  background: var(--bg-hover);
}

.item-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0; /* Allow text truncation */
}

.item-actions {
  display: flex;
  gap: 0.5rem;
  opacity: 0; /* Hidden by default */
  transition: opacity 0.2s ease;
}

.item-row:hover .item-actions {
  opacity: 1; /* Show on hover */
}

/* Mobile: Always show actions */
@media (max-width: 767px) {
  .item-actions {
    opacity: 1;
  }
}
```

---

### Pattern 2: Context Menu (Future Enhancement)
```
Item Layout (with 3-dot menu):
┌──────────────────────────────────────────────────────────┐
│ [Icon] [Name + Description]                        [⋮]   │
└──────────────────────────────────────────────────────────┘
                                                       ↑
                                                3-dot menu
                                                (opens dropdown)

Dropdown Menu:
┌────────────────────┐
│ 👁 View Details    │
│ 📋 Copy to...      │
│ ✏️  Edit           │ ← Future CRUD
│ 🗑️  Delete         │ ← Future CRUD
└────────────────────┘
```

**Defer to V2+:** When CRUD operations are available

---

## Plugin Item Restriction

### Visual Indicator for Plugin Items
```
┌──────────────────────────────────────────────────────────────┐
│ 📦 analytics-agent  [PLUGIN]    [👁 View]  [🚫 Copy]         │
│ Provided by Analytics Plugin                                │
└──────────────────────────────────────────────────────────────┘
  ↑                    ↑                        ↑
  Different Icon     Badge                  Disabled Copy Button
  (package icon)     (purple)               (crossed-out icon)
```

### Plugin Badge Design
```
┌─────────┐
│ PLUGIN  │  ← Badge
└─────────┘
  ↑
  Background: var(--color-mcp) #9C27B0 (purple)
  Color: white
  Font-size: 0.75rem
  Font-weight: 600
  Padding: 0.25rem 0.5rem
  Border-radius: 3px
  Text-transform: uppercase
  Letter-spacing: 0.5px
```

### Disabled Copy Button (Plugin Items)
```
┌───┐
│🚫 │  ← Disabled state
└───┘
  ↑
  Icon: pi pi-ban or pi pi-times-circle
  Opacity: 0.4
  Cursor: not-allowed
  Border: 1px solid var(--border-secondary)
  No hover effect
```

### Tooltip for Disabled Button
```
┌────────────────────────────────────────────────────────┐
│ This configuration is provided by a plugin and         │
│ cannot be copied. Install the plugin in your target    │
│ project instead.                                       │
└────────────────────────────────────────────────────────┘
  ↑
  Shows on hover over disabled copy button
  Max-width: 300px
  Font-size: 0.875rem
  Background: var(--bg-tertiary)
  Border: 1px solid var(--border-primary)
  Padding: 0.75rem
  Box-shadow: var(--shadow-card)
```

---

## Responsive Behavior

### Desktop (>1024px)
```
┌────────────────────────────────────────────────────────────────┐
│ 📝 code-reviewer               🔧 [👁 View]  [📋 Copy]         │ ← Full layout
│ Reviews code for quality and best practices                   │
└────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Actions appear on hover (opacity: 0 → 1)
- Both View and Copy buttons visible
- Text labels shown

---

### Tablet (768px - 1023px)
```
┌──────────────────────────────────────────────────────┐
│ 📝 code-reviewer           [👁]  [📋]                │ ← Icon-only buttons
│ Reviews code for quality and best practices         │
└──────────────────────────────────────────────────────┘
```

**Behavior:**
- Actions always visible (opacity: 1)
- Icon-only buttons (no text labels)
- Tooltips show on hover

---

### Mobile (<768px)
```
┌────────────────────────────────────────────┐
│ 📝 code-reviewer                           │
│ Reviews code for quality...       [👁][📋] │ ← Stacked layout
└────────────────────────────────────────────┘
```

**Behavior:**
- Actions always visible
- Icon-only buttons
- Description may truncate (ellipsis)
- Buttons move to second line if needed

**Vertical Stacking (very narrow):**
```
┌────────────────────────────────────────────┐
│ 📝 code-reviewer                           │
│ Reviews code for quality...                │
│                               [👁]  [📋]   │ ← Buttons on own line
└────────────────────────────────────────────┘
```

---

## Accessibility Features

### ARIA Labels

**Copy Button:**
```vue
<button
  aria-label="Copy code-reviewer.md to another project"
  :aria-disabled="isPlugin"
  @click="handleCopy"
>
  <i class="pi pi-copy"></i>
  <span class="sr-only">Copy to...</span>
</button>
```

**Disabled Copy Button (Plugin):**
```vue
<button
  aria-label="Cannot copy plugin item. This configuration is provided by a plugin."
  aria-disabled="true"
  disabled
>
  <i class="pi pi-ban"></i>
  <span class="sr-only">Copy not available (plugin item)</span>
</button>
```

---

### Keyboard Navigation

**Tab Order:**
1. Item row (entire row focusable)
2. View button
3. Copy button
4. Next item row

**Keyboard Actions:**
- **Tab:** Navigate to copy button
- **Enter / Space:** Activate copy button (open modal)
- **Escape:** Close modal (if open)

**Focus Indicators:**
```css
.copy-btn:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
  border-radius: 4px;
}
```

---

### Screen Reader Support

**Item Row Announcement:**
```
"code-reviewer, agent. Reviews code for quality and best practices.
View button. Copy to another project button."
```

**Plugin Item Announcement:**
```
"analytics-agent, plugin item. Provided by Analytics Plugin.
View button. Copy button unavailable. This configuration is provided by
a plugin and cannot be copied. Install the plugin in your target project instead."
```

---

## Alternative Placements (Considered but Rejected)

### Alternative 1: Copy Button in Card Header
```
┌────────────────────────────────────────────────────────┐
│ Agents (12)                             [📋 Copy All]  │ ← Card-level copy
├────────────────────────────────────────────────────────┤
│ (Item list)                                            │
└────────────────────────────────────────────────────────┘
```

**Rejected:** V1 is single-item copy only. Batch copy deferred to V2.

---

### Alternative 2: Floating Action Button (FAB)
```
┌────────────────────────────────────────────────────────┐
│ Item List                                              │
│                                                        │
│                                              ┌───┐     │
│                                              │ 📋 │     │ ← FAB
│                                              └───┘     │
└────────────────────────────────────────────────────────┘
```

**Rejected:** Less clear which item is being copied. Requires selection state.

---

### Alternative 3: Drag Handle (Drag-and-Drop)
```
┌────────────────────────────────────────────────────────┐
│ ☰ 📝 code-reviewer                      [👁 View]      │
│   Reviews code for quality and best practices         │
└────────────────────────────────────────────────────────┘
  ↑
  Drag handle (6 dots icon)
```

**Rejected:** More complex to implement. Deferred to V2.

---

## Summary of Design Decisions

1. **Inline Actions Pattern:** Copy button appears alongside View button in item row
2. **Icon-Only on Small Screens:** Saves space, tooltips provide context
3. **Hover-Reveal on Desktop:** Keeps UI clean, shows actions on intent
4. **Always Visible on Mobile:** Better discoverability on touch devices
5. **Disabled State for Plugins:** Visual and functional restriction with clear explanation
6. **Consistent Styling:** Matches existing View button and action button patterns

---

**Wireframe Version:** 1.0
**Created:** November 1, 2025
**Status:** Ready for Review
