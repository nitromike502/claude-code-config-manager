/**
 * ConfigItemList MCP Badge and Restriction Tests
 *
 * Tests for STORY-11.1 frontend changes:
 * - Scope badges (Project/User) for MCP items
 * - Status badges (Enabled/Disabled) for MCP items
 * - Copy/delete restrictions for user-scope MCP items in project view
 *
 * Testing approach:
 * - Component mounting via @vue/test-utils with PrimeVue configured
 * - Logic functions (canDelete, copy disabled) verified through rendered output
 * - PrimeVue components are stubbed to avoid theme/CSS dependency issues
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createApp } from 'vue'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Mount ConfigItemList with PrimeVue-aware stubs.
 *
 * PrimeVue components require a running Vue app with the plugin installed.
 * We stub them to simple HTML equivalents so the tests focus on the
 * component's own logic rather than PrimeVue internals.
 */
async function mountConfigItemList(props) {
  setActivePinia(createPinia())

  // Dynamic import after Pinia is ready
  const { default: ConfigItemList } = await import(
    '../../../src/components/cards/ConfigItemList.vue'
  )

  return mount(ConfigItemList, {
    props,
    global: {
      stubs: {
        // Stub PrimeVue Card — render a div that exposes named slots
        Card: {
          template: `
            <div class="p-card-stub">
              <div class="p-card-header"><slot name="header" /></div>
              <div class="p-card-content"><slot name="content" /></div>
            </div>
          `
        },
        // Stub PrimeVue Tag — render a span with the value text
        Tag: {
          props: ['value', 'severity'],
          template: `<span class="p-tag-stub" :data-severity="severity">{{ value }}</span>`
        },
        // Stub PrimeVue Button — render a button with icon and label
        Button: {
          props: ['label', 'icon', 'disabled', 'ariaLabel', 'outlined', 'size', 'severity'],
          template: `
            <button
              class="p-button-stub"
              :aria-label="ariaLabel || label"
              :disabled="disabled"
              :data-icon="icon"
            >{{ label }}</button>
          `,
          emits: ['click']
        },
        // Stub CopyButton — render a button that reflects disabled state
        CopyButton: {
          props: ['configItem', 'disabled', 'showLabel'],
          template: `
            <button
              class="copy-button-stub"
              :disabled="disabled"
              aria-label="Copy"
            >Copy</button>
          `,
          emits: ['copy-clicked']
        }
      }
    }
  })
}

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

const projectScopedMcpItem = {
  name: 'filesystem',
  scope: 'project',
  status: 'enabled',
  transport: 'stdio',
  command: 'npx'
}

const userScopedMcpItem = {
  name: 'context7',
  scope: 'user',
  status: 'enabled',
  transport: 'stdio',
  command: 'npx'
}

const disabledMcpItem = {
  name: 'sequential-thinking',
  scope: 'project',
  status: 'disabled',
  transport: 'stdio',
  command: 'npx'
}

const agentItem = {
  name: 'frontend-architect',
  description: 'Designs Vue components'
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ConfigItemList — MCP scope and status badges', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // --- Badge rendering ---

  it('renders scope badge "Project" for MCP item with scope project', async () => {
    const wrapper = await mountConfigItemList({
      items: [projectScopedMcpItem],
      itemType: 'mcp'
    })

    const tags = wrapper.findAll('.p-tag-stub')
    const tagValues = tags.map(t => t.text())
    expect(tagValues).toContain('Project')
  })

  it('renders scope badge "User" for MCP item with scope user', async () => {
    const wrapper = await mountConfigItemList({
      items: [userScopedMcpItem],
      itemType: 'mcp'
    })

    const tags = wrapper.findAll('.p-tag-stub')
    const tagValues = tags.map(t => t.text())
    expect(tagValues).toContain('User')
  })

  it('renders status badge "Enabled" for enabled MCP server', async () => {
    const wrapper = await mountConfigItemList({
      items: [projectScopedMcpItem], // status: 'enabled'
      itemType: 'mcp'
    })

    const tags = wrapper.findAll('.p-tag-stub')
    const tagValues = tags.map(t => t.text())
    expect(tagValues).toContain('Enabled')
  })

  it('renders status badge "Disabled" for disabled MCP server', async () => {
    const wrapper = await mountConfigItemList({
      items: [disabledMcpItem], // status: 'disabled'
      itemType: 'mcp'
    })

    const tags = wrapper.findAll('.p-tag-stub')
    const tagValues = tags.map(t => t.text())
    expect(tagValues).toContain('Disabled')
  })

  it('does NOT render scope or status badges for non-MCP items (agents)', async () => {
    const wrapper = await mountConfigItemList({
      items: [agentItem],
      itemType: 'agents'
    })

    // No Tag stubs should be rendered for non-MCP item types
    const tags = wrapper.findAll('.p-tag-stub')
    expect(tags.length).toBe(0)
  })

  // --- Delete button restrictions ---

  it('hides delete button for user-scope MCP items even with enableCrud true', async () => {
    const wrapper = await mountConfigItemList({
      items: [userScopedMcpItem],
      itemType: 'mcp',
      enableCrud: true
    })

    // Delete button is a p-button-stub with data-icon="pi pi-trash"
    const deleteButtons = wrapper
      .findAll('.p-button-stub')
      .filter(btn => btn.attributes('data-icon') === 'pi pi-trash')

    expect(deleteButtons.length).toBe(0)
  })

  it('shows delete button for project-scope MCP items with enableCrud true', async () => {
    const wrapper = await mountConfigItemList({
      items: [projectScopedMcpItem],
      itemType: 'mcp',
      enableCrud: true
    })

    const deleteButtons = wrapper
      .findAll('.p-button-stub')
      .filter(btn => btn.attributes('data-icon') === 'pi pi-trash')

    expect(deleteButtons.length).toBe(1)
  })

  it('hides delete button for project-scope MCP when enableCrud is false', async () => {
    const wrapper = await mountConfigItemList({
      items: [projectScopedMcpItem],
      itemType: 'mcp',
      enableCrud: false
    })

    const deleteButtons = wrapper
      .findAll('.p-button-stub')
      .filter(btn => btn.attributes('data-icon') === 'pi pi-trash')

    expect(deleteButtons.length).toBe(0)
  })

  // --- Copy button restrictions ---

  it('copy button is disabled for user-scope MCP in project view (pageScope=project)', async () => {
    const wrapper = await mountConfigItemList({
      items: [userScopedMcpItem],
      itemType: 'mcp',
      pageScope: 'project'
    })

    const copyButton = wrapper.find('.copy-button-stub')
    expect(copyButton.exists()).toBe(true)
    expect(copyButton.attributes('disabled')).toBeDefined()
  })

  it('copy button is NOT disabled for user-scope MCP in user view (pageScope=user)', async () => {
    const wrapper = await mountConfigItemList({
      items: [userScopedMcpItem],
      itemType: 'mcp',
      pageScope: 'user'
    })

    const copyButton = wrapper.find('.copy-button-stub')
    expect(copyButton.exists()).toBe(true)
    expect(copyButton.attributes('disabled')).toBeUndefined()
  })

  it('copy button is enabled for project-scope MCP regardless of pageScope', async () => {
    const wrapper = await mountConfigItemList({
      items: [projectScopedMcpItem],
      itemType: 'mcp',
      pageScope: 'project'
    })

    const copyButton = wrapper.find('.copy-button-stub')
    expect(copyButton.exists()).toBe(true)
    expect(copyButton.attributes('disabled')).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Logic unit tests — canDelete and copy-disabled logic in isolation
// ---------------------------------------------------------------------------

describe('ConfigItemList — canDelete logic (unit)', () => {
  /**
   * canDelete mirrors the implementation in ConfigItemList.vue:
   *
   *   if itemType === 'mcp' && item.scope === 'user' → false
   *   else → enableCrud && supportedType && item.location !== 'plugin'
   */
  const canDelete = (item, itemType, enableCrud) => {
    if (itemType === 'mcp' && item.scope === 'user') {
      return false
    }
    const supportedTypes = ['agents', 'commands', 'skills', 'hooks', 'mcp', 'rules']
    return enableCrud && supportedTypes.includes(itemType) && item.location !== 'plugin'
  }

  it('returns false for user-scope MCP regardless of enableCrud', () => {
    expect(canDelete({ scope: 'user', name: 'ctx7' }, 'mcp', true)).toBe(false)
    expect(canDelete({ scope: 'user', name: 'ctx7' }, 'mcp', false)).toBe(false)
  })

  it('returns true for project-scope MCP with enableCrud true', () => {
    expect(canDelete({ scope: 'project', name: 'fs' }, 'mcp', true)).toBe(true)
  })

  it('returns false for project-scope MCP with enableCrud false', () => {
    expect(canDelete({ scope: 'project', name: 'fs' }, 'mcp', false)).toBe(false)
  })

  it('returns false for plugin MCP even with enableCrud true', () => {
    expect(canDelete({ scope: 'project', name: 'fs', location: 'plugin' }, 'mcp', true)).toBe(false)
  })

  it('returns true for agents with enableCrud true', () => {
    expect(canDelete({ name: 'frontend-architect' }, 'agents', true)).toBe(true)
  })

  it('returns false for agents with enableCrud false', () => {
    expect(canDelete({ name: 'frontend-architect' }, 'agents', false)).toBe(false)
  })
})

describe('ConfigItemList — copy disabled logic (unit)', () => {
  /**
   * Copy disabled logic mirrors the :disabled binding in ConfigItemList.vue:
   *
   *   item.location === 'plugin'
   *   OR (itemType === 'mcp' && item.scope === 'user' && pageScope === 'project')
   */
  const isCopyDisabled = (item, itemType, pageScope) => {
    return (
      item.location === 'plugin' ||
      (itemType === 'mcp' && item.scope === 'user' && pageScope === 'project')
    )
  }

  it('disabled for user-scope MCP in project view', () => {
    expect(isCopyDisabled({ scope: 'user', name: 'ctx7' }, 'mcp', 'project')).toBe(true)
  })

  it('enabled for user-scope MCP in user view', () => {
    expect(isCopyDisabled({ scope: 'user', name: 'ctx7' }, 'mcp', 'user')).toBe(false)
  })

  it('enabled for user-scope MCP when pageScope is null', () => {
    expect(isCopyDisabled({ scope: 'user', name: 'ctx7' }, 'mcp', null)).toBe(false)
  })

  it('enabled for project-scope MCP in project view', () => {
    expect(isCopyDisabled({ scope: 'project', name: 'fs' }, 'mcp', 'project')).toBe(false)
  })

  it('disabled for plugin items of any type', () => {
    expect(isCopyDisabled({ name: 'agent', location: 'plugin' }, 'agents', 'project')).toBe(true)
    expect(isCopyDisabled({ scope: 'project', name: 'mcp', location: 'plugin' }, 'mcp', 'project')).toBe(true)
  })

  it('enabled for project-scope MCP in user view', () => {
    expect(isCopyDisabled({ scope: 'project', name: 'fs' }, 'mcp', 'user')).toBe(false)
  })
})
