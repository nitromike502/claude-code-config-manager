# Collaborative UI Development Workflow

## Overview

This document describes the collaborative, visual-first workflow for UI development in the Claude Code Manager project. This workflow is designed for iterative, real-time development where the developer can see changes immediately and provide feedback.

## Workflow Philosophy

**The Problem with Blind Development:**
- AI cannot see the visual output of UI changes
- Mechanically converting CSS to utility classes doesn't ensure proper component usage
- Missing opportunities to use native PrimeVue components instead of custom styling
- Changes may technically work but visually break the design

**The Solution: Visual Collaboration**
- Developer views changes live in browser during development
- Developer guides component selection and styling decisions
- AI implements changes based on visual feedback
- Iterative approach: make change → review → refine → commit

## Core Principles

### 1. Component-First Development
- **Use PrimeVue native components** wherever possible (Card, Panel, Divider, DataView, etc.)
- Think like Bootstrap: use the component library's building blocks
- Only use custom divs when no appropriate PrimeVue component exists
- Minimal custom styling - let PrimeVue handle the heavy lifting

### 2. Outside-In Approach
- Start with full page layout structure
- Work down into sections and regions
- Then focus on individual components
- Finally refine nested elements and details

### 3. Visual Verification Required
- Developer must view changes live as they're applied
- No "batch changes and hope they work" approach
- Catch visual issues immediately before committing
- Developer provides specific feedback based on what they see

### 4. Incremental Progress
- One component/section at a time
- Commit working changes frequently
- Multiple dev sessions expected for large refactors
- Progress over perfection

## Workflow Steps

### Phase 1: Planning
1. **Developer selects target component(s)** - "Let's work on the Dashboard layout"
2. **Developer describes desired outcome** - "Use PrimeVue Card for each config section"
3. **AI proposes implementation approach** - Which PrimeVue components, structure, etc.
4. **Developer approves or adjusts plan** - Visual expectations clarified

### Phase 2: Implementation
1. **AI makes changes** - Implements the agreed-upon approach
2. **Developer views live** - Checks browser immediately
3. **Developer provides feedback** - "Spacing is wrong", "Use Panel instead of Card", etc.
4. **AI adjusts** - Iterates based on visual feedback
5. **Repeat until correct** - Continue 2-4 until developer approves

### Phase 3: Commit
1. **Developer confirms completion** - "This section looks good"
2. **AI commits changes** - Single component/section per commit
3. **Move to next component** - Or end session for continuation later

## Component Selection Priority

Work in this order:

### 1. Full Page Layout
- App.vue (overall app container)
- Router view structure
- Top-level navigation/header
- Main content area structure

### 2. View Layouts
- Dashboard.vue
- ProjectDetail.vue
- UserGlobal.vue
- Component arrangement and spacing

### 3. Major Components
- ConfigCard.vue
- ConfigDetailSidebar.vue
- CopyModal.vue
- Navigation components

### 4. Utility Components
- EmptyState.vue
- ErrorState.vue
- LoadingState.vue
- Small, focused components

### 5. Refinement
- Responsive behavior
- Accessibility improvements
- Visual polish
- Animation/transitions

## Communication Patterns

### Developer to AI

**Good Examples:**
- "Let's work on the Dashboard. Use PrimeVue Card components for each config section."
- "That spacing looks wrong. The cards should have gap-4 between them."
- "Replace that custom div with a PrimeVue Panel component."
- "The header looks good. Let's move on to the config list."

**What to Include:**
- Which component to work on
- What PrimeVue components to use
- Specific styling adjustments needed
- Visual feedback on current state
- Approval to proceed or changes needed

### AI to Developer

**Before Implementation:**
- Confirm understanding of target component
- Propose specific PrimeVue components to use
- Ask clarifying questions about visual expectations

**During Implementation:**
- Describe what changes are being made
- Explain which PrimeVue components are being used
- Note any technical considerations

**After Implementation:**
- Summarize what was changed
- Highlight any areas that might need visual verification
- Ask for feedback on the result

## PrimeVue Component Reference

### Common Components to Use

**Layout & Structure:**
- `<Card>` - Card containers (like Bootstrap card)
- `<Panel>` - Collapsible panels with headers
- `<Divider>` - Section dividers
- `<Splitter>` - Split panes/layouts
- `<ScrollPanel>` - Scrollable areas

**Navigation:**
- `<Breadcrumb>` - Breadcrumb navigation
- `<Menu>` - Menus and dropdowns
- `<TabView>` / `<TabPanel>` - Tabbed interfaces
- `<Steps>` - Step indicators

**Data Display:**
- `<DataView>` - Flexible data display (list/grid)
- `<DataTable>` - Tables
- `<Timeline>` - Timeline display
- `<Tree>` - Hierarchical data

**Feedback:**
- `<Message>` - Inline messages
- `<Toast>` - Toast notifications
- `<ProgressBar>` - Progress indicators
- `<Skeleton>` - Loading skeletons

**Forms & Input:**
- `<Button>` - Buttons
- `<InputText>` - Text inputs
- `<Dropdown>` - Select dropdowns
- `<Dialog>` - Modal dialogs
- `<RadioButton>` - Radio buttons

### When to Use Custom Divs

Only use custom divs when:
- No appropriate PrimeVue component exists
- You need a simple wrapper for layout (flexbox, grid)
- The element has a specific semantic meaning (article, section, header, footer)

Even then, check if PrimeVue has a component first!

## Tailwind Usage Guidelines

**Use Tailwind for:**
- Spacing (padding, margin, gap)
- Layout (flex, grid, positioning)
- Sizing (width, height, max-width)
- Responsive prefixes (md:, lg:, etc.)
- Basic utilities (text-center, hidden, etc.)

**Don't use Tailwind for:**
- Colors - Use CSS custom properties (--bg-primary, --text-secondary, etc.)
- Typography - Let PrimeVue handle text styling
- Borders/shadows - PrimeVue components include these
- Complex states - Use PrimeVue component props

**Goal:** Minimal Tailwind classes, mostly for layout and spacing.

## Session Management

### Starting a Session
1. Developer indicates which component(s) to work on
2. Review current state of component together
3. Agree on PrimeVue components to use
4. Begin implementation

### During a Session
- Focus on one component/section at a time
- Make changes, get feedback, iterate
- Commit completed sections
- Track progress informally (no formal tickets needed for UI polish)

### Ending a Session
1. Commit any completed work
2. Document what was completed
3. Note what's next for the following session
4. No need to finish entire refactor in one session

### Resuming a Session
1. Review what was completed last time
2. Developer selects next component to work on
3. Continue iterative process

## Success Criteria

**A component is "complete" when:**
- ✅ Uses appropriate PrimeVue components
- ✅ Minimal custom styling (mostly layout/spacing)
- ✅ Developer confirms it looks correct visually
- ✅ Responsive behavior works as expected
- ✅ Maintains accessibility (keyboard nav, screen readers)

**The refactor is "complete" when:**
- ✅ All major components use PrimeVue components appropriately
- ✅ Styling is maintainable and follows component patterns
- ✅ Developer is satisfied with the visual design
- ✅ Application functions correctly

## Anti-Patterns to Avoid

### ❌ Blind CSS Conversion
**Don't:** Mechanically convert CSS classes to Tailwind utilities
**Do:** Ask "Is there a PrimeVue component for this?"

### ❌ Batch Changes Without Visual Verification
**Don't:** Make 10 components worth of changes and hope they work
**Do:** One component at a time, verify visually, then proceed

### ❌ Ignoring Visual Feedback
**Don't:** Assume changes are correct because they compile
**Do:** Listen to developer's visual feedback and iterate

### ❌ Over-Engineering
**Don't:** Create complex custom components when PrimeVue has a solution
**Do:** Use PrimeVue's built-in components and features

### ❌ Utility Class Overload
**Don't:** Use 20+ Tailwind classes when a PrimeVue component would suffice
**Do:** Let PrimeVue handle styling, use Tailwind for layout only

## Example Session

```
Developer: "Let's work on Dashboard.vue. I want to use PrimeVue Card components
           for each configuration section instead of the custom divs."

AI: "I'll replace the custom .config-section divs with PrimeVue Card components.
     Each card will have a title prop for the section header. Should I keep the
     current spacing between cards?"

Developer: "Yes, keep the spacing. Let's see it."

AI: [Makes changes to Dashboard.vue]

Developer: "Good, but the card headers are too large. Use a smaller heading."

AI: [Adjusts Card header styling]

Developer: "Perfect! Commit this and let's move on to the config list inside."

AI: [Commits Dashboard Card migration]

Developer: "Now let's look at ConfigCard.vue..."
```

## Benefits of This Workflow

1. **Visual Quality** - Developer sees exactly what's being built
2. **Proper Component Usage** - PrimeVue components used correctly
3. **Faster Iteration** - Immediate feedback catches issues quickly
4. **Better Maintainability** - Component-based code is easier to manage
5. **Developer Control** - Developer guides all visual decisions
6. **Incremental Progress** - No need to complete everything in one session

---

**Remember:** The goal is not to remove CSS or reduce lines of code. The goal is to **use PrimeVue components properly** to build a maintainable, visually consistent UI that follows component library best practices (like Bootstrap).
