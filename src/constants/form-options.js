/**
 * Form Options Constants
 *
 * Shared constants for form fields across CRUD interfaces.
 * These options are used in select dropdowns, select buttons,
 * and multi-select components.
 *
 * @see docs/ba-sessions/20251128-phase5-crud-discovery/component-specs/form-field-types.md
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
  { label: 'Prompt', value: 'prompt' }
]

// MCP server transport options
export const TRANSPORT_OPTIONS = [
  { label: 'stdio', value: 'stdio' },
  { label: 'http', value: 'http' },
  { label: 'sse', value: 'sse' }
]

// Hook event type options with matcher support flag
export const HOOK_EVENT_OPTIONS = [
  { label: 'PreToolUse', value: 'PreToolUse', hasMatcher: true },
  { label: 'PostToolUse', value: 'PostToolUse', hasMatcher: true },
  { label: 'PermissionRequest', value: 'PermissionRequest', hasMatcher: true },
  { label: 'Notification', value: 'Notification', hasMatcher: true },
  { label: 'UserPromptSubmit', value: 'UserPromptSubmit', hasMatcher: false },
  { label: 'Stop', value: 'Stop', hasMatcher: false },
  { label: 'SubagentStop', value: 'SubagentStop', hasMatcher: false },
  { label: 'PreCompact', value: 'PreCompact', hasMatcher: false },
  { label: 'SessionStart', value: 'SessionStart', hasMatcher: false },
  { label: 'SessionEnd', value: 'SessionEnd', hasMatcher: false }
]

// Built-in Claude Code tools
export const BUILT_IN_TOOLS = [
  'AskUserQuestion',
  'Bash',
  'BashOutput',
  'Edit',
  'ExitPlanMode',
  'Glob',
  'Grep',
  'KillShell',
  'NotebookEdit',
  'Read',
  'Skill',
  'SlashCommand',
  'Task',
  'TodoWrite',
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
  { label: 'Ignore', value: 'ignore' }
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
