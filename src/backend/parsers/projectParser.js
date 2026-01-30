/**
 * Project Parser
 * Parses Claude Code project list from ~/.claude.json
 */

const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');

/**
 * Get the path to ~/.claude.json
 * @returns {string} Absolute path to ~/.claude.json
 */
function getClaudeJsonPath() {
  return config.paths.getUserClaudeJsonPath();
}

/**
 * Parse the ~/.claude.json file to extract project paths
 * @returns {Promise<Array>} Array of project objects
 */
async function parseProjects() {
  try {
    const claudeJsonPath = getClaudeJsonPath();

    // Check if file exists
    try {
      await fs.access(claudeJsonPath);
    } catch {
      console.warn(`~/.claude.json not found at ${claudeJsonPath}`);
      return [];
    }

    const content = await fs.readFile(claudeJsonPath, 'utf-8');
    const config = JSON.parse(content);

    // Extract projects object (paths are keys)
    if (!config.projects || typeof config.projects !== 'object') {
      return [];
    }

    const projects = [];

    for (const [projectPath, projectConfig] of Object.entries(config.projects)) {
      // Expand ~ in path if present
      const expandedPath = config.paths.expandHome(projectPath);

      // Check if project directory exists
      let exists = false;
      try {
        const stat = await fs.stat(expandedPath);
        exists = stat.isDirectory();
      } catch {
        exists = false;
      }

      // Extract project name from path (last directory name)
      const projectName = path.basename(expandedPath);

      // Generate a projectId (path with slashes and special chars removed)
      const projectId = generateProjectId(expandedPath);

      projects.push({
        id: projectId,
        name: projectName,
        path: expandedPath,
        exists: exists,
        config: projectConfig || {}
      });
    }

    return projects;
  } catch (error) {
    console.error('Error parsing ~/.claude.json:', error.message);
    return [];
  }
}

/**
 * Generate a project ID from a path
 * Removes slashes and special characters to create a URL-safe ID
 * @param {string} projectPath - Absolute project path
 * @returns {string} Project ID
 */
function generateProjectId(projectPath) {
  // Remove leading slash and replace remaining slashes with empty string
  // Also remove any other special characters
  return projectPath
    .replace(/^\//, '')
    .replace(/[\/\\:]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * Get a project by its ID
 * @param {string} projectId - Project ID
 * @returns {Promise<Object|null>} Project object or null if not found
 */
async function getProjectById(projectId) {
  const projects = await parseProjects();
  return projects.find(p => p.id === projectId) || null;
}

/**
 * Get a project by its path
 * @param {string} projectPath - Absolute project path
 * @returns {Promise<Object|null>} Project object or null if not found
 */
async function getProjectByPath(projectPath) {
  const projects = await parseProjects();
  return projects.find(p => p.path === projectPath) || null;
}

/**
 * Count configuration items for a project
 * @param {string} projectPath - Absolute project path
 * @returns {Promise<Object>} Object with counts
 */
async function getProjectConfigCounts(projectPath) {
  const counts = {
    agents: 0,
    commands: 0,
    hooks: 0,
    mcpServers: 0
  };

  try {
    // Count agents
    const agentsPath = config.paths.getProjectAgentsDir(projectPath);
    try {
      const agentFiles = await fs.readdir(agentsPath);
      counts.agents = agentFiles.filter(f => f.endsWith('.md')).length;
    } catch {
      // Directory doesn't exist
    }

    // Count commands (recursive)
    const commandsPath = config.paths.getProjectCommandsDir(projectPath);
    try {
      counts.commands = await countMarkdownFilesRecursive(commandsPath);
    } catch {
      // Directory doesn't exist
    }

    // Count hooks
    const settingsPath = config.paths.getProjectSettingsPath(projectPath);
    try {
      const content = await fs.readFile(settingsPath, 'utf-8');
      const settings = JSON.parse(content);
      if (settings.hooks) {
        for (const matchers of Object.values(settings.hooks)) {
          if (Array.isArray(matchers)) {
            for (const matcher of matchers) {
              if (matcher.hooks && Array.isArray(matcher.hooks)) {
                counts.hooks += matcher.hooks.length;
              }
            }
          }
        }
      }
    } catch {
      // File doesn't exist or parse error
    }

    // Count MCP servers
    const mcpJsonPath = config.paths.getProjectMcpPath(projectPath);
    try {
      const content = await fs.readFile(mcpJsonPath, 'utf-8');
      const mcpConfig = JSON.parse(content);
      const servers = mcpConfig.mcpServers || mcpConfig;
      if (typeof servers === 'object') {
        counts.mcpServers = Object.keys(servers).length;
      }
    } catch {
      // File doesn't exist or parse error
    }
  } catch (error) {
    console.error(`Error counting configs for ${projectPath}:`, error.message);
  }

  return counts;
}

/**
 * Recursively count markdown files in a directory
 * @param {string} directoryPath - Directory to search
 * @returns {Promise<number>} Count of .md files
 */
async function countMarkdownFilesRecursive(directoryPath) {
  let count = 0;

  try {
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        count += await countMarkdownFilesRecursive(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        count++;
      }
    }
  } catch (error) {
    // Ignore errors
  }

  return count;
}

/**
 * Get all projects with their configuration counts
 * @returns {Promise<Array>} Array of projects with counts
 */
async function getProjectsWithCounts() {
  const projects = await parseProjects();

  // Add counts to each project
  const projectsWithCounts = await Promise.all(
    projects.map(async (project) => {
      const counts = await getProjectConfigCounts(project.path);
      return {
        ...project,
        counts
      };
    })
  );

  return projectsWithCounts;
}

/**
 * Validate a project path (check if it's a Claude Code project)
 * @param {string} projectPath - Absolute project path
 * @returns {Promise<boolean>} True if valid Claude Code project
 */
async function isValidClaudeProject(projectPath) {
  try {
    const claudeDirPath = config.paths.getProjectClaudeDir(projectPath);
    const stat = await fs.stat(claudeDirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

module.exports = {
  getClaudeJsonPath,
  parseProjects,
  generateProjectId,
  getProjectById,
  getProjectByPath,
  getProjectConfigCounts,
  getProjectsWithCounts,
  isValidClaudeProject
};
