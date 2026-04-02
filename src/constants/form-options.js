/**
 * Form Options Constants
 *
 * Shared constants for form fields across CRUD interfaces.
 * These options are used in select dropdowns, select buttons,
 * and multi-select components.
 *
 * @see docs/ba-sessions/20251128-phase5-crud-discovery/component-specs/form-field-types.md
 *
 * NOTE: HOOK_EVENT_OPTIONS is defined here for frontend use.
 * The authoritative source is src/backend/config/hooks.js
 * Frontend components should fetch from GET /api/hooks/events for dynamic data.
 */

// Model selection options (for agents)
export const MODEL_OPTIONS = [
  { label: 'Sonnet', value: 'sonnet' },
  { label: 'Opus', value: 'opus' },
  { label: 'Haiku', value: 'haiku' },
  { label: 'Inherit', value: 'inherit' }
]

// Enabled/Disabled options (for hooks, MCP servers)
export const ENABLED_OPTIONS = [
  { label: 'Enabled', value: true },
  { label: 'Disabled', value: false }
]

// Yes/No options (for boolean fields)
export const YES_NO_OPTIONS = [
  { label: 'Yes', value: true },
  { label: 'No', value: false }
]

// Hook type options
export const HOOK_TYPE_OPTIONS = [
  { label: 'Command', value: 'command' },
  { label: 'HTTP', value: 'http' },
  { label: 'Prompt', value: 'prompt' },
  { label: 'Agent', value: 'agent' }
]

// MCP server transport options
export const TRANSPORT_OPTIONS = [
  { label: 'stdio', value: 'stdio' },
  { label: 'http', value: 'http' },
  { label: 'sse', value: 'sse' },
  { label: 'WebSocket', value: 'ws' }
]

// Hook event type options with matcher support flag
// Synced with src/backend/config/hooks.js - frontend components should fetch from API for dynamic data
export const HOOK_EVENT_OPTIONS = [
  { label: 'PreToolUse', value: 'PreToolUse', hasMatcher: true },
  { label: 'PostToolUse', value: 'PostToolUse', hasMatcher: true },
  { label: 'PostToolUseFailure', value: 'PostToolUseFailure', hasMatcher: true },
  { label: 'PermissionRequest', value: 'PermissionRequest', hasMatcher: true },
  { label: 'Notification', value: 'Notification', hasMatcher: true },
  { label: 'UserPromptSubmit', value: 'UserPromptSubmit', hasMatcher: false },
  { label: 'Stop', value: 'Stop', hasMatcher: false },
  { label: 'StopFailure', value: 'StopFailure', hasMatcher: true },
  { label: 'SubagentStart', value: 'SubagentStart', hasMatcher: true },
  { label: 'SubagentStop', value: 'SubagentStop', hasMatcher: true },
  { label: 'PreCompact', value: 'PreCompact', hasMatcher: true },
  { label: 'PostCompact', value: 'PostCompact', hasMatcher: true },
  { label: 'SessionStart', value: 'SessionStart', hasMatcher: true },
  { label: 'SessionEnd', value: 'SessionEnd', hasMatcher: true },
  { label: 'InstructionsLoaded', value: 'InstructionsLoaded', hasMatcher: true },
  { label: 'ConfigChange', value: 'ConfigChange', hasMatcher: true },
  { label: 'FileChanged', value: 'FileChanged', hasMatcher: true },
  { label: 'Elicitation', value: 'Elicitation', hasMatcher: true },
  { label: 'ElicitationResult', value: 'ElicitationResult', hasMatcher: true },
  { label: 'TaskCreated', value: 'TaskCreated', hasMatcher: false },
  { label: 'TaskCompleted', value: 'TaskCompleted', hasMatcher: false },
  { label: 'TeammateIdle', value: 'TeammateIdle', hasMatcher: false },
  { label: 'CwdChanged', value: 'CwdChanged', hasMatcher: false },
  { label: 'WorktreeCreate', value: 'WorktreeCreate', hasMatcher: false },
  { label: 'WorktreeRemove', value: 'WorktreeRemove', hasMatcher: false },
  { label: 'Setup', value: 'Setup', hasMatcher: false }
]

// Built-in Claude Code tools
export const BUILT_IN_TOOLS = [
  'Agent',
  'AskUserQuestion',
  'Bash',
  'BashOutput',
  'Edit',
  'ExitPlanMode',
  'Glob',
  'Grep',
  'KillShell',
  'LSP',
  'NotebookEdit',
  'Read',
  'Skill',
  'Task',
  'TaskCreate',
  'TaskGet',
  'TaskList',
  'TaskOutput',
  'TaskStop',
  'TaskUpdate',
  'TodoWrite',
  'ToolSearch',
  'WebFetch',
  'WebSearch',
  'Write'
]

// Tool options formatted for PrimeVue Select/MultiSelect
export const TOOL_OPTIONS = BUILT_IN_TOOLS.map(tool => ({
  label: tool,
  value: tool
}))

// Matcher options (tools + wildcard for hook matchers)
export const MATCHER_OPTIONS = [
  { label: 'All Tools (*)', value: '*' },
  ...TOOL_OPTIONS
]

// Permission mode options (for agents)
export const PERMISSION_MODE_OPTIONS = [
  { label: 'Default', value: 'default' },
  { label: 'Accept Edits', value: 'acceptEdits' },
  { label: 'Bypass Permissions', value: 'bypassPermissions' },
  { label: 'Plan', value: 'plan' },
  { label: "Don't Ask", value: 'dontAsk' },
  { label: 'Auto', value: 'auto' },
  { label: 'Delegate', value: 'delegate' }
]

// Model invocation options (for commands)
export const MODEL_INVOCATION_OPTIONS = [
  { label: 'Invocable', value: false },
  { label: 'Non-Invocable', value: true }
]

// Official Claude Code colors
export const CLAUDE_CODE_COLORS = [
  'blue',
  'cyan',
  'green',
  'orange',
  'purple',
  'red',
  'yellow',
  'pink',
  'indigo',
  'teal'
]

// Color options formatted for Select dropdown
export const COLOR_OPTIONS = CLAUDE_CODE_COLORS.map(color => ({
  label: color.charAt(0).toUpperCase() + color.slice(1),
  value: color
}))
