# Form Field Types Specification

## Overview

This document maps configuration properties to their appropriate PrimeVue form components, with specific configurations for each field type.

## Field Type Summary

| Field Type | PrimeVue Component | Key Props |
|------------|-------------------|-----------|
| text | InputText | `fluid`, `invalid` |
| textarea | Textarea | `autoResize`, `fluid` |
| select | Select | `options`, `optionLabel`, `optionValue`, `filter` |
| selectbutton | SelectButton | `options`, `optionLabel`, `optionValue` |
| multiselect | MultiSelect | `options`, `display="chip"`, `showToggleAll` |
| colorpalette | Select (custom) | Custom template with color chips |
| number | InputNumber | `min`, `max`, `showButtons` |
| keyvalue | Custom | Dynamic key-value rows |
| chips | Chips | Array of strings |

---

## Text Field (InputText)

### Use Cases
- name, command, url, argument-hint

### Configuration
```vue
<InputText
  v-model="value"
  :fluid="true"
  :invalid="hasError"
  :placeholder="placeholder"
  :disabled="disabled"
/>
```

### Props
| Prop | Value | Description |
|------|-------|-------------|
| fluid | true | Full width |
| invalid | boolean | Red border on error |
| placeholder | string | Hint text |
| disabled | boolean | Read-only state |

---

## Textarea Field

### Use Cases
- description, content, systemPrompt, command (hooks)

### Configuration
```vue
<Textarea
  v-model="value"
  :autoResize="true"
  :fluid="true"
  :rows="3"
  :placeholder="placeholder"
  :disabled="disabled"
/>
```

### Props
| Prop | Value | Description |
|------|-------|-------------|
| autoResize | true | Grows with content |
| fluid | true | Full width |
| rows | 3-10 | Initial height |

---

## Select Field (Dropdown)

### Use Cases
- event (hooks), permissionMode (agents)

### Configuration
```vue
<Select
  v-model="value"
  :options="options"
  optionLabel="label"
  optionValue="value"
  :filter="options.length > 5"
  :showClear="!required"
  :fluid="true"
  :placeholder="placeholder"
/>
```

### Props
| Prop | Value | Description |
|------|-------|-------------|
| filter | boolean | Enable search (for long lists) |
| showClear | boolean | Allow clearing selection |
| fluid | true | Full width |

### Example Options
```javascript
// Hook event types
const eventOptions = [
  { label: 'PreToolUse', value: 'PreToolUse' },
  { label: 'PostToolUse', value: 'PostToolUse' },
  { label: 'PermissionRequest', value: 'PermissionRequest' },
  { label: 'Notification', value: 'Notification' },
  { label: 'UserPromptSubmit', value: 'UserPromptSubmit' },
  { label: 'Stop', value: 'Stop' },
  { label: 'SubagentStop', value: 'SubagentStop' },
  { label: 'PreCompact', value: 'PreCompact' },
  { label: 'SessionStart', value: 'SessionStart' },
  { label: 'SessionEnd', value: 'SessionEnd' }
]

// Permission modes
const permissionModeOptions = [
  { label: 'Default', value: 'default' },
  { label: 'Accept Edits', value: 'acceptEdits' },
  { label: 'Bypass Permissions', value: 'bypassPermissions' },
  { label: 'Plan', value: 'plan' },
  { label: 'Ignore', value: 'ignore' }
]
```

---

## SelectButton Field

### Use Cases
- model, type (hooks), enabled, suppressOutput, continue, disable-model-invocation, transport (MCP)

### Configuration
```vue
<SelectButton
  v-model="value"
  :options="options"
  optionLabel="label"
  optionValue="value"
  :allowEmpty="false"
/>
```

### Props
| Prop | Value | Description |
|------|-------|-------------|
| allowEmpty | false | Must have selection |
| optionLabel | "label" | Display text key |
| optionValue | "value" | Value key |

### Example Options

```javascript
// Model selection
const modelOptions = [
  { label: 'Sonnet', value: 'sonnet' },
  { label: 'Opus', value: 'opus' },
  { label: 'Haiku', value: 'haiku' },
  { label: 'Inherit', value: 'inherit' }
]

// Boolean: Enabled/Disabled
const enabledOptions = [
  { label: 'Enabled', value: true },
  { label: 'Disabled', value: false }
]

// Boolean: Yes/No
const yesNoOptions = [
  { label: 'Yes', value: true },
  { label: 'No', value: false }
]

// Hook type
const hookTypeOptions = [
  { label: 'Command', value: 'command' },
  { label: 'Prompt', value: 'prompt' }
]

// MCP transport
const transportOptions = [
  { label: 'stdio', value: 'stdio' },
  { label: 'http', value: 'http' },
  { label: 'sse', value: 'sse' }
]
```

### Reference
https://primevue.org/selectbutton/

---

## MultiSelect Field

### Use Cases
- tools, allowed-tools, skills, matcher (hooks)

### Configuration
```vue
<MultiSelect
  v-model="value"
  :options="options"
  optionLabel="label"
  optionValue="value"
  display="chip"
  :showToggleAll="true"
  :maxSelectedLabels="3"
  :filter="options.length > 10"
  :fluid="true"
  :placeholder="placeholder"
/>
```

### Props
| Prop | Value | Description |
|------|-------|-------------|
| display | "chip" | Show as removable chips |
| showToggleAll | true | Select/deselect all |
| maxSelectedLabels | 3 | Truncate after N items |
| filter | boolean | Enable search |

### Example Options

```javascript
// Built-in tools
const toolOptions = [
  { label: 'AskUserQuestion', value: 'AskUserQuestion' },
  { label: 'Bash', value: 'Bash' },
  { label: 'BashOutput', value: 'BashOutput' },
  { label: 'Edit', value: 'Edit' },
  { label: 'ExitPlanMode', value: 'ExitPlanMode' },
  { label: 'Glob', value: 'Glob' },
  { label: 'Grep', value: 'Grep' },
  { label: 'KillShell', value: 'KillShell' },
  { label: 'NotebookEdit', value: 'NotebookEdit' },
  { label: 'Read', value: 'Read' },
  { label: 'Skill', value: 'Skill' },
  { label: 'SlashCommand', value: 'SlashCommand' },
  { label: 'Task', value: 'Task' },
  { label: 'TodoWrite', value: 'TodoWrite' },
  { label: 'WebFetch', value: 'WebFetch' },
  { label: 'WebSearch', value: 'WebSearch' },
  { label: 'Write', value: 'Write' }
]

// Hook matcher options (tools + wildcard)
const matcherOptions = [
  { label: 'All Tools (*)', value: '*' },
  ...toolOptions
]
```

### Special: Matcher Field
For hook matchers, selected values are joined with `|` when saving:
```javascript
// UI selection: ['Read', 'Write', 'Edit']
// Saved value: 'Read|Write|Edit'

// Transform for save
const matcherString = selectedTools.join('|')

// Transform for display
const selectedTools = matcherString.split('|')
```

### Reference
https://primevue.org/multiselect/

---

## Number Field (InputNumber)

### Use Cases
- timeout, retries

### Configuration
```vue
<InputNumber
  v-model="value"
  :min="min"
  :max="max"
  :showButtons="true"
  :fluid="true"
/>
```

### Props
| Prop | Value | Description |
|------|-------|-------------|
| min | number | Minimum value |
| max | number | Maximum value |
| showButtons | true | Increment/decrement buttons |

### Example Configurations
```javascript
// Timeout (seconds)
{ min: 1, max: 3600, default: 60 }

// Retries
{ min: 0, max: 10, default: 3 }
```

---

## Key-Value Editor (Custom)

### Use Cases
- env (MCP), headers (MCP)

### Visual Design
```
┌────────────────────────────────────────────┐
│ Environment Variables                      │
├────────────────────────────────────────────┤
│ Key             │ Value              │ [x] │
│ ┌─────────────┐ │ ┌────────────────┐ │     │
│ │ DEBUG       │ │ │ true           │ │ [x] │
│ └─────────────┘ │ └────────────────┘ │     │
│ ┌─────────────┐ │ ┌────────────────┐ │     │
│ │ PATH        │ │ │ ${HOME}/bin    │ │ [x] │
│ └─────────────┘ │ └────────────────┘ │     │
│                                      [+]   │
└────────────────────────────────────────────┘
```

### Component Structure
```vue
<template>
  <div class="key-value-editor">
    <div
      v-for="(pair, index) in pairs"
      :key="index"
      class="flex gap-2 mb-2"
    >
      <InputText
        v-model="pair.key"
        placeholder="Key"
        class="flex-1"
      />
      <InputText
        v-model="pair.value"
        placeholder="Value"
        class="flex-1"
      />
      <Button
        icon="pi pi-times"
        severity="danger"
        text
        rounded
        @click="removePair(index)"
      />
    </div>
    <Button
      icon="pi pi-plus"
      label="Add"
      severity="secondary"
      text
      size="small"
      @click="addPair"
    />
  </div>
</template>
```

### Data Transformation
```javascript
// Object to pairs (for editing)
const objectToPairs = (obj) => {
  return Object.entries(obj || {}).map(([key, value]) => ({ key, value }))
}

// Pairs to object (for saving)
const pairsToObject = (pairs) => {
  return pairs.reduce((obj, { key, value }) => {
    if (key.trim()) {
      obj[key.trim()] = value
    }
    return obj
  }, {})
}
```

---

## Chips Field

### Use Cases
- args (MCP server)

### Configuration
```vue
<Chips
  v-model="value"
  :allowDuplicate="false"
  :addOnBlur="true"
  separator=","
  :fluid="true"
/>
```

### Props
| Prop | Value | Description |
|------|-------|-------------|
| allowDuplicate | false | Prevent duplicates |
| addOnBlur | true | Add on focus loss |
| separator | "," | Split on comma |

### Reference
https://primevue.org/chips/

---

## Constants File

Create a shared constants file for reuse:

```javascript
// src/constants/form-options.js

export const MODEL_OPTIONS = [
  { label: 'Sonnet', value: 'sonnet' },
  { label: 'Opus', value: 'opus' },
  { label: 'Haiku', value: 'haiku' },
  { label: 'Inherit', value: 'inherit' }
]

export const ENABLED_OPTIONS = [
  { label: 'Enabled', value: true },
  { label: 'Disabled', value: false }
]

export const YES_NO_OPTIONS = [
  { label: 'Yes', value: true },
  { label: 'No', value: false }
]

export const HOOK_TYPE_OPTIONS = [
  { label: 'Command', value: 'command' },
  { label: 'Prompt', value: 'prompt' }
]

export const TRANSPORT_OPTIONS = [
  { label: 'stdio', value: 'stdio' },
  { label: 'http', value: 'http' },
  { label: 'sse', value: 'sse' }
]

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

export const BUILT_IN_TOOLS = [
  'AskUserQuestion', 'Bash', 'BashOutput', 'Edit', 'ExitPlanMode',
  'Glob', 'Grep', 'KillShell', 'NotebookEdit', 'Read', 'Skill',
  'SlashCommand', 'Task', 'TodoWrite', 'WebFetch', 'WebSearch', 'Write'
]

export const TOOL_OPTIONS = BUILT_IN_TOOLS.map(t => ({ label: t, value: t }))

export const MATCHER_OPTIONS = [
  { label: 'All Tools (*)', value: '*' },
  ...TOOL_OPTIONS
]

export const PERMISSION_MODE_OPTIONS = [
  { label: 'Default', value: 'default' },
  { label: 'Accept Edits', value: 'acceptEdits' },
  { label: 'Bypass Permissions', value: 'bypassPermissions' },
  { label: 'Plan', value: 'plan' },
  { label: 'Ignore', value: 'ignore' }
]
```

---

## PrimeVue References

- InputText: https://primevue.org/inputtext/
- Textarea: https://primevue.org/textarea/
- Select: https://primevue.org/select/
- SelectButton: https://primevue.org/selectbutton/
- MultiSelect: https://primevue.org/multiselect/
- InputNumber: https://primevue.org/inputnumber/
- Chips: https://primevue.org/chips/
