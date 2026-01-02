/**
 * Type Mapping Utility
 *
 * Provides centralized configuration and utility functions for configuration types
 * (agents, commands, skills, hooks, MCP servers) including icons, labels, and colors.
 */

/**
 * Configuration object for each type with display properties
 */
export const TYPE_CONFIG = {
  agent: {
    icon: 'pi pi-users',
    label: 'Agent',
    color: 'success' // Maps to --color-success
  },
  command: {
    icon: 'pi pi-bolt',
    label: 'Command',
    color: 'info' // Maps to --color-info
  },
  skill: {
    icon: 'pi pi-sparkles',
    label: 'Skill',
    color: 'skills' // Maps to --color-skills
  },
  hook: {
    icon: 'pi pi-link',
    label: 'Hook',
    color: 'warning' // Maps to --color-warning
  },
  mcp: {
    icon: 'pi pi-server',
    label: 'MCP Server',
    color: 'mcp' // Maps to --color-mcp
  }
};

/**
 * Get PrimeIcon class for a configuration type
 * @param {string} type - Configuration type (agent, command, skill, hook, mcp)
 * @returns {string} PrimeIcon class name
 */
export function getTypeIcon(type) {
  return TYPE_CONFIG[type]?.icon || 'pi pi-file';
}

/**
 * Format type string for display
 * @param {string} type - Configuration type (agent, command, skill, hook, mcp)
 * @returns {string} Formatted display label
 */
export function formatType(type) {
  return TYPE_CONFIG[type]?.label || type;
}

/**
 * Get color identifier for a configuration type
 * @param {string} type - Configuration type (agent, command, skill, hook, mcp)
 * @returns {string} Color identifier (maps to CSS custom properties)
 */
export function getTypeColor(type) {
  return TYPE_CONFIG[type]?.color || 'default';
}
