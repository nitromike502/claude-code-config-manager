# Product Requirements Document: Phase 3 - Subagent Management

**Version:** 2.1
**Phase:** 3 - Edit Subagents (Edit-Only)
**Last Updated:** 2025-10-18
**Status:** Approved for Implementation (Pending Phase 2 Migration)

✅ **This document has been reviewed and refined. Ready for implementation after Phase 2 complete.**

---

## 1. Overview

**Goal:** Add editing capabilities for managing subagent configurations at both project and user levels.

**Scope:** Edit existing subagents only (no create/delete operations in this phase).

**Prerequisites:** Phase 1 MVP + Phase 2 (Vite+Vue3 SPA Migration) must be complete.

---

## 2. Features

### 2.1 View Subagent Configuration
- Display all agent fields in read-only mode
- Show all configuration values even if empty
- Sidebar detail view with:
  - Agent metadata (name, description, model, tools, color)
  - Agent instructions (body content rendered as markdown)
- Fixed "Edit" button at bottom right, always visible when scrolling
- Padding at bottom of sidebar to accommodate button

### 2.2 Edit Subagent Configuration
- Click "Edit" button to enter edit mode
- All fields become editable simultaneously:
  - **Name:** Read-only text input (no renaming in this phase)
  - **Description:** Required textarea
  - **Model:** Dropdown with 3 models + "Unspecified" option
    - claude-sonnet-4-5-20250929
    - claude-sonnet-3-5-20241022
    - claude-opus-4-20250514
  - **Tools:** Select2 multi-select with tags enabled
    - Predefined tools: Read, Write, Edit, Glob, Grep, Bash, BashOutput, WebFetch, WebSearch, NotebookEdit, TodoWrite, SlashCommand
    - Custom tool names supported (PascalCase validation)
    - Wildcard option: "*" (all tools)
  - **Color:** Color palette selector
    - Options: Automatic, Blue, Green, Orange, Purple, Red, Yellow, Teal, Pink
  - **Body:** WYSIWYG editor (TipTap)
    - Rich text editing with toolbar
    - Toggle button to switch between WYSIWYG and raw HTML (inline, not modal)
    - Markdown syntax highlighting in preview
- Save and Cancel buttons at bottom (replace Edit button)
- Entire file rewritten on save with all updates

### 2.3 Validation
- Required fields: name, description
- Name: Lowercase alphanumeric + hyphens, 3-50 characters, must start/end with alphanumeric
- Description: 10-500 characters
- Tools: PascalCase format or "*" wildcard
- Model: Must match canonical model IDs or be "Unspecified"
- Color: Must be valid color from palette
- Helpful error messages for validation failures
- Success notification on save
- Error notification on save failure (e.g., file permissions, disk errors)

### 2.4 Markdown & HTML Handling
- WYSIWYG editor uses TipTap for Vue 3 integration
- HTML ↔ Markdown conversion for seamless editing
- Light markdown normalization on save:
  - Trailing newline ensured
  - Consistent line endings (LF)
  - Trailing whitespace trimmed
- Preserve all markdown formatting (headers, lists, code blocks, etc.)
- Security: Strip/escape HTML tags, no script injection

---

## 3. User Experience Flow

**View Mode:**
1. User navigates to agent detail sidebar
2. All configuration fields displayed in read-only state
3. Edit button visible at bottom right (fixed position)
4. Body content rendered as formatted markdown

**Edit Mode:**
1. User clicks Edit button
2. All fields become editable (except name field)
3. WYSIWYG editor active for body content
4. Save and Cancel buttons replace Edit button
5. User makes changes to any/all fields
6. Click Save → entire file rewritten, success notification shown
7. Click Cancel → discard all changes, return to view mode

**Future Phases:**
- Create/Delete subagent operations
- Renaming agents (requires careful file system handling)
- Template library for common patterns
- Testing/preview mode
- Import/export functionality
