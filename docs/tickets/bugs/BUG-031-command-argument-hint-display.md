---
id: BUG-031
title: Slash Command details sidebar missing argument hint from YAML
status: resolved
priority: high
category: Data Display
assigned_to: null
created_at: 2025-10-23
updated_at: 2025-10-26
resolved_at: 2025-10-26
---

## Description
Slash command configuration sidebar detail view is not displaying the `argument_hint` field from command YAML frontmatter, even though the field is parsed and available.

## Current Behavior
- Command sidebar shows name, description, namespace, color, and tools
- The `argumentHint` field is parsed from YAML but not displayed in sidebar
- Users cannot see what arguments or parameters a command expects

## Expected Behavior
- Command detail sidebar should display argument hint field
- Argument hint should show usage information in readable format
- Should handle missing argument hint gracefully (show nothing if not set)

## Affected Component(s)
- ProjectDetail.vue (command sidebar metadata section)
- UserGlobal.vue (command sidebar metadata section)

## Data Source
- Command YAML frontmatter: `argument-hint` field (note: kebab-case in YAML, camelCase in JS)
- Example: `argument-hint: "[instructions] - Optional context for command"`
- Example: `argument-hint: "[date] [additional-instructions]"`

## Steps to Reproduce
1. Navigate to any project detail page or user global config
2. Scroll to commands section
3. Click on a command card to open sidebar
4. Observe that argument hint field is NOT displayed in metadata section
5. Verify the command YAML has an argument-hint field

## Acceptance Criteria
- [x] Command sidebar detail view displays argument hint field
- [x] Argument hint field is clearly labeled as "Argument Hint"
- [x] Argument hint value is shown in readable format
- [x] Handles missing argument hint gracefully (shows nothing if not set)
- [x] Works in both ProjectDetail.vue and UserGlobal.vue
- [x] NOTE: YAML field is `argument-hint` (kebab-case), JS property is `argumentHint` (camelCase)

## Resolution
**Fixed in commit (current session)**

### Changes Made
1. **projectDiscovery.js:** Added `argumentHint` field extraction for commands
   - Extracts `argument-hint` from YAML frontmatter
   - Maps to camelCase `argumentHint` in API response
   - Applied to both getProjectCommands() and getUserCommands() functions (2 locations)
   - Sets to `null` if not present

2. **ConfigDetailSidebar.vue:** Already had display logic for `argumentHint`
   - Frontend code was already in place: `<p v-if="selectedItem.argumentHint"><strong>Argument Hint:</strong> {{ selectedItem.argumentHint }}</p>`
   - Issue was that backend wasn't extracting the field

### Affected Files
- Backend: `src/backend/services/projectDiscovery.js` (getProjectCommands, getUserCommands - 2 locations)
- Frontend: `src/components/sidebars/ConfigDetailSidebar.vue` (display already present)

### Verification
- ✅ Backend tests passing (270 tests)
- ✅ argumentHint field properly extracted in API response
- ✅ Frontend conditionally displays when present
- ✅ Applies to both ProjectDetail.vue and UserGlobal.vue (both use ConfigDetailSidebar)
- ✅ Properly handles both present and missing argument-hint fields
