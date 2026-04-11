/**
 * ConfigItemList MCP Badge and Restriction Tests
 *
 * Tests for STORY-11.1 frontend changes:
 * - Scope badges (Project/User) for MCP items
 * - Status badges (Enabled/Disabled) for MCP items
 * - Copy/delete restrictions for user-scope MCP items in project view
 *
 * Tests for STORY-11.2 frontend changes (MCP toggle feature):
 * - Toggle button visible for MCP items in project view
 * - Toggle button NOT visible in user view or for non-MCP items
 * - McpScopeBadges toggleable prop and toggle-status event
 * - MCP store toggleMcpStatus action
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
// Mock the API module for store tests
// ---------------------------------------------------------------------------

vi.mock('@/api', () => ({
  toggleProjectMcpStatus: vi.fn()
}))

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
    '@/components/cards/ConfigItemList.vue'
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
        // Stub McpScopeBadges — render the same tag spans the tests assert on
        McpScopeBadges: {
          props: ['scope', 'status'],
          template: `
            <div v-if="scope">
              <span v-if="scope === 'project'" class="p-tag-stub" data-severity="info">Project</span>
              <span v-else-if="scope === 'user'" class="p-tag-stub" data-severity="secondary">User</span>
              <span v-if="status === 'enabled'" class="p-tag-stub" data-severity="success">Enabled</span>
              <span v-else-if="status === 'disabled'" class="p-tag-stub" data-severity="danger">Disabled</span>
            </div>
          `
        },
        // Stub PrimeVue Tag — render a span with the value text (used by other components)
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

  it('hides delete button for user-scope MCP items even with enableCrud true (in project view)', async () => {
    const wrapper = await mountConfigItemList({
      items: [userScopedMcpItem],
      itemType: 'mcp',
      enableCrud: true,
      pageScope: 'project'
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

// ---------------------------------------------------------------------------
// MCP Toggle Button visibility (STORY-11.2)
// ---------------------------------------------------------------------------

describe('ConfigItemList — MCP toggle button visibility', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders toggle button for MCP items in project view (pageScope=project)', async () => {
    const wrapper = await mountConfigItemList({
      items: [projectScopedMcpItem],
      itemType: 'mcp',
      pageScope: 'project',
      projectId: 'test'
    })

    // Toggle button has aria-label "Disable" (since item is enabled) or "Enable"
    const toggleBtns = wrapper
      .findAll('.p-button-stub')
      .filter(btn => {
        const label = btn.attributes('aria-label')
        return label === 'Disable' || label === 'Enable'
      })

    expect(toggleBtns.length).toBe(1)
  })

  it('renders "Enable" label on toggle button for disabled MCP server in project view', async () => {
    const wrapper = await mountConfigItemList({
      items: [disabledMcpItem],
      itemType: 'mcp',
      pageScope: 'project',
      projectId: 'test'
    })

    const enableBtn = wrapper
      .findAll('.p-button-stub')
      .find(btn => btn.attributes('aria-label') === 'Enable')

    expect(enableBtn).toBeDefined()
  })

  it('does NOT render toggle button for MCP items in user view (pageScope=user)', async () => {
    const wrapper = await mountConfigItemList({
      items: [projectScopedMcpItem],
      itemType: 'mcp',
      pageScope: 'user',
      projectId: null
    })

    const toggleBtns = wrapper
      .findAll('.p-button-stub')
      .filter(btn => {
        const label = btn.attributes('aria-label')
        return label === 'Disable' || label === 'Enable'
      })

    expect(toggleBtns.length).toBe(0)
  })

  it('does NOT render toggle button for MCP items when pageScope is null', async () => {
    const wrapper = await mountConfigItemList({
      items: [projectScopedMcpItem],
      itemType: 'mcp',
      pageScope: null
    })

    const toggleBtns = wrapper
      .findAll('.p-button-stub')
      .filter(btn => {
        const label = btn.attributes('aria-label')
        return label === 'Disable' || label === 'Enable'
      })

    expect(toggleBtns.length).toBe(0)
  })

  it('does NOT render toggle button for non-MCP items (agents)', async () => {
    const wrapper = await mountConfigItemList({
      items: [agentItem],
      itemType: 'agents',
      pageScope: 'project'
    })

    const toggleBtns = wrapper
      .findAll('.p-button-stub')
      .filter(btn => {
        const label = btn.attributes('aria-label')
        return label === 'Disable' || label === 'Enable'
      })

    expect(toggleBtns.length).toBe(0)
  })

  it('does NOT render toggle button for hooks in project view', async () => {
    const hookItem = {
      name: 'PreToolUse',
      event: 'PreToolUse',
      pattern: 'Bash',
      command: 'echo test'
    }

    const wrapper = await mountConfigItemList({
      items: [hookItem],
      itemType: 'hooks',
      pageScope: 'project'
    })

    const toggleBtns = wrapper
      .findAll('.p-button-stub')
      .filter(btn => {
        const label = btn.attributes('aria-label')
        return label === 'Disable' || label === 'Enable'
      })

    expect(toggleBtns.length).toBe(0)
  })

  it('renders toggle button for user-scope MCP in project view', async () => {
    // User-scope MCP servers can be toggled (disabled) from a project view
    const wrapper = await mountConfigItemList({
      items: [userScopedMcpItem],
      itemType: 'mcp',
      pageScope: 'project',
      projectId: 'test'
    })

    const toggleBtns = wrapper
      .findAll('.p-button-stub')
      .filter(btn => {
        const label = btn.attributes('aria-label')
        return label === 'Disable' || label === 'Enable'
      })

    expect(toggleBtns.length).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// McpScopeBadges component — toggleable prop (STORY-11.2)
// ---------------------------------------------------------------------------

describe('McpScopeBadges — toggleable prop', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  async function mountMcpScopeBadges(props) {
    setActivePinia(createPinia())

    const { default: McpScopeBadges } = await import(
      '@/components/common/McpScopeBadges.vue'
    )

    return mount(McpScopeBadges, {
      props,
      global: {
        stubs: {
          // Use a real stub that exposes the class attribute so we can inspect it
          Tag: {
            props: ['value', 'severity'],
            template: `<span class="p-tag-stub" :data-severity="severity" :data-value="value">{{ value }}</span>`
          }
        }
      }
    })
  }

  it('applies mcp-tag-toggleable class to status tag when toggleable=true', async () => {
    const wrapper = await mountMcpScopeBadges({
      scope: 'project',
      status: 'enabled',
      toggleable: true
    })

    // The component applies mcp-tag-toggleable class to the Tag wrapping the status
    // We verify via the rendered HTML that the class is present on the tag element
    expect(wrapper.html()).toContain('mcp-tag-toggleable')
  })

  it('does NOT apply mcp-tag-toggleable class when toggleable is false (default)', async () => {
    const wrapper = await mountMcpScopeBadges({
      scope: 'project',
      status: 'enabled'
      // toggleable defaults to false
    })

    expect(wrapper.html()).not.toContain('mcp-tag-toggleable')
  })

  it('emits toggle-status when status tag is clicked and toggleable=true (enabled server)', async () => {
    const wrapper = await mountMcpScopeBadges({
      scope: 'project',
      status: 'enabled',
      toggleable: true
    })

    // Find the enabled status tag and click it
    const enabledTag = wrapper.findAll('.p-tag-stub').find(t => t.attributes('data-value') === 'Enabled')
    expect(enabledTag).toBeDefined()

    await enabledTag.trigger('click')

    expect(wrapper.emitted('toggle-status')).toBeTruthy()
    expect(wrapper.emitted('toggle-status').length).toBe(1)
  })

  it('emits toggle-status when status tag is clicked and toggleable=true (disabled server)', async () => {
    const wrapper = await mountMcpScopeBadges({
      scope: 'project',
      status: 'disabled',
      toggleable: true
    })

    const disabledTag = wrapper.findAll('.p-tag-stub').find(t => t.attributes('data-value') === 'Disabled')
    expect(disabledTag).toBeDefined()

    await disabledTag.trigger('click')

    expect(wrapper.emitted('toggle-status')).toBeTruthy()
    expect(wrapper.emitted('toggle-status').length).toBe(1)
  })

  it('does NOT emit toggle-status on scope tag click even when toggleable=true', async () => {
    const wrapper = await mountMcpScopeBadges({
      scope: 'project',
      status: 'enabled',
      toggleable: true
    })

    // Scope tag (Project) should not be clickable
    const scopeTag = wrapper.findAll('.p-tag-stub').find(t => t.attributes('data-value') === 'Project')
    expect(scopeTag).toBeDefined()

    await scopeTag.trigger('click')

    // No toggle-status event from the scope badge
    expect(wrapper.emitted('toggle-status')).toBeFalsy()
  })

  it('does NOT emit toggle-status when toggleable=false and status tag is clicked', async () => {
    const wrapper = await mountMcpScopeBadges({
      scope: 'project',
      status: 'enabled',
      toggleable: false
    })

    const enabledTag = wrapper.findAll('.p-tag-stub').find(t => t.attributes('data-value') === 'Enabled')
    expect(enabledTag).toBeDefined()

    await enabledTag.trigger('click')

    // Should not have emitted toggle-status
    expect(wrapper.emitted('toggle-status')).toBeFalsy()
  })

  it('renders nothing when scope is null', async () => {
    const wrapper = await mountMcpScopeBadges({
      scope: null,
      status: 'enabled'
    })

    expect(wrapper.find('.p-tag-stub').exists()).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// MCP store — toggleMcpStatus action (STORY-11.2)
// ---------------------------------------------------------------------------

describe('MCP Store — toggleMcpStatus action', () => {
  // Import api mock after vi.mock() hoisting
  let api

  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    api = await import('@/api')
  })

  it('calls toggleProjectMcpStatus API with correct arguments', async () => {
    api.toggleProjectMcpStatus.mockResolvedValue({
      success: true,
      serverName: 'filesystem',
      enabled: false,
      status: 'disabled'
    })

    const { useMcpStore } = await import('@/stores/mcp')
    const store = useMcpStore()

    await store.toggleMcpStatus('testproject', 'filesystem', false)

    expect(api.toggleProjectMcpStatus).toHaveBeenCalledWith('testproject', 'filesystem', false)
  })

  it('updates cached server status on success', async () => {
    api.toggleProjectMcpStatus.mockResolvedValue({
      success: true,
      serverName: 'filesystem',
      enabled: false,
      status: 'disabled'
    })

    const { useMcpStore } = await import('@/stores/mcp')
    const store = useMcpStore()

    // Seed the cache with an enabled server
    store.projectMcpServers.set('testproject', [
      { name: 'filesystem', status: 'enabled', scope: 'project', transport: 'stdio' }
    ])

    const result = await store.toggleMcpStatus('testproject', 'filesystem', false)

    expect(result.success).toBe(true)
    expect(result.status).toBe('disabled')

    // Verify in-memory cache was updated
    const cached = store.getProjectMcpCache('testproject')
    const server = cached.find(s => s.name === 'filesystem')
    expect(server.status).toBe('disabled')
  })

  it('returns success result with new status', async () => {
    api.toggleProjectMcpStatus.mockResolvedValue({
      success: true,
      serverName: 'context7',
      enabled: true,
      status: 'enabled'
    })

    const { useMcpStore } = await import('@/stores/mcp')
    const store = useMcpStore()

    store.projectMcpServers.set('proj1', [
      { name: 'context7', status: 'disabled', scope: 'project', transport: 'stdio' }
    ])

    const result = await store.toggleMcpStatus('proj1', 'context7', true)

    expect(result.success).toBe(true)
    expect(result.status).toBe('enabled')
  })

  it('returns failure result when API call fails', async () => {
    api.toggleProjectMcpStatus.mockRejectedValue(new Error('Network error'))

    const { useMcpStore } = await import('@/stores/mcp')
    const store = useMcpStore()

    const result = await store.toggleMcpStatus('testproject', 'filesystem', false)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Network error')
  })

  it('does not mutate cache when API call fails', async () => {
    api.toggleProjectMcpStatus.mockRejectedValue(new Error('Server error'))

    const { useMcpStore } = await import('@/stores/mcp')
    const store = useMcpStore()

    store.projectMcpServers.set('testproject', [
      { name: 'filesystem', status: 'enabled', scope: 'project', transport: 'stdio' }
    ])

    await store.toggleMcpStatus('testproject', 'filesystem', false)

    // Cache should remain unchanged
    const cached = store.getProjectMcpCache('testproject')
    const server = cached.find(s => s.name === 'filesystem')
    expect(server.status).toBe('enabled')
  })

  it('handles missing server in cache gracefully (no crash)', async () => {
    api.toggleProjectMcpStatus.mockResolvedValue({
      success: true,
      serverName: 'nonexistent',
      enabled: false,
      status: 'disabled'
    })

    const { useMcpStore } = await import('@/stores/mcp')
    const store = useMcpStore()

    // Cache is empty — server not preloaded
    const result = await store.toggleMcpStatus('testproject', 'nonexistent', false)

    // Should succeed without throwing
    expect(result.success).toBe(true)
    expect(result.status).toBe('disabled')
  })

  it('returns empty array from getProjectMcpCache when projectId not loaded', async () => {
    const { useMcpStore } = await import('@/stores/mcp')
    const store = useMcpStore()

    const result = store.getProjectMcpCache('neverloaded')
    expect(result).toEqual([])
  })
})
