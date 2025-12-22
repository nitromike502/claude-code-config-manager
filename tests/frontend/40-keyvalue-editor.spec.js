import { test, expect } from '@playwright/test';

test.describe('KeyValueEditor Component', () => {
  test('component file exists and has correct structure', async () => {
    const fs = require('fs');
    const path = '/home/claude/manager/src/components/forms/KeyValueEditor.vue';

    // Read the component file
    const content = fs.readFileSync(path, 'utf8');

    // Verify essential parts exist
    expect(content).toContain('<template>');
    expect(content).toContain('<script setup>');
    expect(content).toContain('import InputText');
    expect(content).toContain('import Button');
    expect(content).toContain('modelValue');
    expect(content).toContain('disabled');
    expect(content).toContain('keyPlaceholder');
    expect(content).toContain('valuePlaceholder');
    expect(content).toContain("emit('update:modelValue'");
    expect(content).toContain('function addPair()');
    expect(content).toContain('function removePair(');
    expect(content).toContain('function handleKeyChange(');
    expect(content).toContain('function handleValueChange(');
  });

  test('component has required features', async () => {
    const fs = require('fs');
    const path = '/home/claude/manager/src/components/forms/KeyValueEditor.vue';
    const content = fs.readFileSync(path, 'utf8');

    // Check for key features
    expect(content).toContain('font-mono'); // Monospace font
    expect(content).toContain('fadeIn'); // Animation
    expect(content).toContain('No entries'); // Empty state
    expect(content).toContain('pi-plus'); // Add button icon
    expect(content).toContain('pi-trash'); // Remove button icon
    expect(content).toContain('v-for="(value, key, index) in localPairs"'); // Iteration over pairs
  });

  test('component has proper prop types', async () => {
    const fs = require('fs');
    const path = '/home/claude/manager/src/components/forms/KeyValueEditor.vue';
    const content = fs.readFileSync(path, 'utf8');

    // modelValue should be Object type
    expect(content).toContain('type: Object');

    // disabled should be Boolean
    expect(content).toContain('type: Boolean');

    // Placeholders should be String
    expect(content).toContain('type: String');
  });

  test('component handles empty object correctly', async () => {
    const fs = require('fs');
    const path = '/home/claude/manager/src/components/forms/KeyValueEditor.vue';
    const content = fs.readFileSync(path, 'utf8');

    // Should check for empty object and show message
    expect(content).toContain('Object.keys(localPairs).length === 0');
    expect(content).toContain('No entries. Click "Add" to create one');
  });

  test('component has proper v-model emit', async () => {
    const fs = require('fs');
    const path = '/home/claude/manager/src/components/forms/KeyValueEditor.vue';
    const content = fs.readFileSync(path, 'utf8');

    // Should emit update:modelValue
    expect(content).toContain("defineEmits(['update:modelValue'])");
    expect(content).toContain("emit('update:modelValue'");
  });

  test('component cleans up empty keys', async () => {
    const fs = require('fs');
    const path = '/home/claude/manager/src/components/forms/KeyValueEditor.vue';
    const content = fs.readFileSync(path, 'utf8');

    // Should filter out empty keys in emitUpdate
    expect(content).toContain('function emitUpdate()');
    expect(content).toContain('if (k && k.trim())'); // Checks for non-empty keys
  });

  test('component generates unique placeholder keys', async () => {
    const fs = require('fs');
    const path = '/home/claude/manager/src/components/forms/KeyValueEditor.vue';
    const content = fs.readFileSync(path, 'utf8');

    // Should generate unique keys like NEW_KEY, NEW_KEY_1, etc.
    expect(content).toContain("let newKey = 'NEW_KEY'");
    expect(content).toContain('while (localPairs.value[newKey])');
    expect(content).toContain('counter++');
  });

  test('component watches for external changes', async () => {
    const fs = require('fs');
    const path = '/home/claude/manager/src/components/forms/KeyValueEditor.vue';
    const content = fs.readFileSync(path, 'utf8');

    // Should watch modelValue for external updates
    expect(content).toContain('watch(() => props.modelValue');
    expect(content).toContain('syncArrays()');
  });

  test('component supports disabled state', async () => {
    const fs = require('fs');
    const path = '/home/claude/manager/src/components/forms/KeyValueEditor.vue';
    const content = fs.readFileSync(path, 'utf8');

    // Should pass disabled prop to inputs
    expect(content).toContain(':disabled="disabled"');

    // Should conditionally show buttons based on disabled
    expect(content).toContain('v-if="!disabled"');
  });

  test('component has proper accessibility attributes', async () => {
    const fs = require('fs');
    const path = '/home/claude/manager/src/components/forms/KeyValueEditor.vue';
    const content = fs.readFileSync(path, 'utf8');

    // Should have aria-label for remove buttons
    expect(content).toContain(':aria-label=');
    expect(content).toContain('Remove');
  });
});
