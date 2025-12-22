# Form Components

This directory contains reusable form components for editing complex data structures.

## Components

### ArgsArrayEditor.vue

Edits arrays of command-line arguments using PrimeVue Chips component.

**Props:**
- `modelValue` (Array): Array of strings
- `disabled` (Boolean): Disable editing
- `placeholder` (String): Input placeholder text

**Usage:**
```vue
<ArgsArrayEditor
  v-model="commandArgs"
  :disabled="!canEdit"
  placeholder="Add argument..."
/>
```

### KeyValueEditor.vue

Edits key-value pair objects (like environment variables or HTTP headers).

**Props:**
- `modelValue` (Object): Object with string keys and values
- `disabled` (Boolean): Disable editing
- `keyPlaceholder` (String): Placeholder for key input (default: "Key")
- `valuePlaceholder` (String): Placeholder for value input (default: "Value")

**Features:**
- Dynamic rows with add/remove functionality
- Monospace font for technical values
- Supports variable syntax like `${VAR}` (displayed literally, expanded at runtime)
- Unique auto-generated keys for new pairs
- Empty state message when no entries
- Smooth animations for row additions

**Usage:**
```vue
<!-- Environment Variables -->
<KeyValueEditor
  v-model="mcpServer.env"
  :disabled="!canEdit"
  key-placeholder="Variable name"
  value-placeholder="Value"
/>

<!-- HTTP Headers -->
<KeyValueEditor
  v-model="mcpServer.headers"
  :disabled="!canEdit"
  key-placeholder="Header name"
  value-placeholder="Value"
/>
```

**Empty Keys:**
Keys are automatically cleaned up on emit. Empty or whitespace-only keys are filtered out.

**Key Renaming:**
Users can edit keys directly. The component handles object key updates properly.

**Example Data:**
```js
{
  GITHUB_TOKEN: '${GITHUB_TOKEN}',
  API_KEY: 'test-key-123',
  PORT: '8080'
}
```
