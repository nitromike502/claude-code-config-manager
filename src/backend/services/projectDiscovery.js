const path = require('path');
const { expandHome, pathToProjectId, isValidDirectory } = require('../utils/pathUtils');
const { readJSON, exists, listFiles, listFilesRecursive, readMarkdownWithFrontmatter } = require('./fileReader');

/**
 * Reads and parses ~/.claude.json to get all Claude Code projects
 * @returns {Promise<Object>} Map of projectId -> projectData
 */
async function discoverProjects() {
  const claudeJsonPath = expandHome('~/.claude.json');

  try {
    const config = await readJSON(claudeJsonPath);

    if (!config || !config.projects) {
      return {
        projects: {},
        error: null
      };
    }

    // Build projects map with validation
    const projects = {};

    for (const projectPath of Object.keys(config.projects)) {
      const expandedPath = expandHome(projectPath);
      const isValid = await isValidDirectory(expandedPath);
      const projectId = pathToProjectId(expandedPath);

      projects[projectId] = {
        id: projectId,
        path: expandedPath,
        name: path.basename(expandedPath),
        exists: isValid,
        config: config.projects[projectPath]
      };
    }

    return {
      projects,
      error: null
    };
  } catch (error) {
    return {
      projects: {},
      error: error.message
    };
  }
}

/**
 * Gets subagents for a specific project
 * @param {string} projectPath - Absolute project path
 * @returns {Promise<Object>} Object with agents array and warnings array
 */
async function getProjectAgents(projectPath) {
  const agentsDir = path.join(projectPath, '.claude', 'agents');

  try {
    const files = await listFiles(agentsDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    const agents = [];
    const warnings = [];

    for (const file of mdFiles) {
      const filePath = path.join(agentsDir, file);

      try {
        const parsed = await readMarkdownWithFrontmatter(filePath);

        if (parsed) {
          // Check if there was a YAML parse error
          if (parsed.hasError) {
            // Add warning but include the agent with partial data
            warnings.push({
              file: filePath,
              error: parsed.parseError,
              skipped: false // Not skipped, included with partial data
            });
          }

          // Handle tools field - can be string or array
          let tools = [];
          if (parsed.frontmatter.tools) {
            if (typeof parsed.frontmatter.tools === 'string') {
              // Split by comma and trim
              tools = parsed.frontmatter.tools.split(',').map(t => t.trim()).filter(Boolean);
            } else if (Array.isArray(parsed.frontmatter.tools)) {
              tools = parsed.frontmatter.tools;
            }
          }

          agents.push({
            name: file.replace('.md', ''),
            file: file,
            path: filePath,
            frontmatter: parsed.frontmatter,
            content: parsed.content,
            description: parsed.frontmatter.description || '',
            tools: tools,
            color: parsed.frontmatter.color || null,
            model: parsed.frontmatter.model || 'inherit',
            hasParseError: parsed.hasError || false
          });
        }
      } catch (parseError) {
        // Log warning for malformed file and continue processing
        console.warn(`Skipping agent file ${filePath}: ${parseError.message}`);
        warnings.push({
          file: filePath,
          error: parseError.message,
          skipped: true
        });
      }
    }

    return { agents, warnings };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { agents: [], warnings: [] }; // No agents directory
    }
    throw error;
  }
}

/**
 * Gets slash commands for a specific project (supports nested directories)
 * @param {string} projectPath - Absolute project path
 * @returns {Promise<Object>} Object with commands array and warnings array
 */
async function getProjectCommands(projectPath) {
  const commandsDir = path.join(projectPath, '.claude', 'commands');

  try {
    const files = await listFilesRecursive(commandsDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    const commands = [];
    const warnings = [];

    for (const relFile of mdFiles) {
      const filePath = path.join(commandsDir, relFile);

      try {
        const parsed = await readMarkdownWithFrontmatter(filePath);

        if (parsed) {
          // Check if there was a YAML parse error
          if (parsed.hasError) {
            // Add warning but include the command with partial data
            warnings.push({
              file: filePath,
              error: parsed.parseError,
              skipped: false // Not skipped, included with partial data
            });
          }

          // Command name is derived from file path (e.g., "git/commit.md" -> "git/commit")
          const commandName = relFile.replace('.md', '');

          // Handle allowed-tools field - can be string or array
          // Note: Slash commands use 'allowed-tools' per Claude Code spec
          let tools = [];
          const allowedTools = parsed.frontmatter['allowed-tools'];

          if (allowedTools) {
            if (typeof allowedTools === 'string') {
              // Split by comma and trim
              tools = allowedTools.split(',').map(t => t.trim()).filter(Boolean);
            } else if (Array.isArray(allowedTools)) {
              tools = allowedTools;
            }
          }

          commands.push({
            name: commandName,
            file: relFile,
            path: filePath,
            frontmatter: parsed.frontmatter,
            content: parsed.content,
            description: parsed.frontmatter.description || '',
            tools: tools,
            argumentHint: parsed.frontmatter['argument-hint'] || null,
            hasParseError: parsed.hasError || false
          });
        }
      } catch (parseError) {
        // Log warning for malformed file and continue processing
        console.warn(`Skipping command file ${filePath}: ${parseError.message}`);
        warnings.push({
          file: filePath,
          error: parseError.message,
          skipped: true
        });
      }
    }

    return { commands, warnings };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { commands: [], warnings: [] }; // No commands directory
    }
    throw error;
  }
}

/**
 * Gets hooks for a specific project (from settings.json and settings.local.json)
 * @param {string} projectPath - Absolute project path
 * @returns {Promise<Object>} Object with hooks array and warnings array
 */
async function getProjectHooks(projectPath) {
  const settingsPath = path.join(projectPath, '.claude', 'settings.json');
  const localSettingsPath = path.join(projectPath, '.claude', 'settings.local.json');

  const hooks = [];
  const warnings = [];

  // Try reading main settings.json
  try {
    const settings = await readJSON(settingsPath);
    if (settings && settings.hooks) {
      // Type check before .map()
      if (Array.isArray(settings.hooks)) {
        hooks.push(...settings.hooks.map(hook => ({
          ...hook,
          source: 'settings.json'
        })));
      } else if (typeof settings.hooks === 'object') {
        // Handle object format: { "UserPromptSubmit": [...], "Notification": [...] }
        // Each event maps to an array of matcher configs
        for (const [event, matchers] of Object.entries(settings.hooks)) {
          if (Array.isArray(matchers)) {
            matchers.forEach((matcher, index) => {
              hooks.push({
                event,
                matcher: matcher.matcher || '',
                hooks: matcher.hooks || [],
                source: 'settings.json',
                matcherIndex: index
              });
            });
          }
        }
      } else {
        // Unexpected type
        console.warn(`Unexpected hooks format in ${settingsPath}: ${typeof settings.hooks}`);
        warnings.push({
          file: settingsPath,
          error: `hooks is ${typeof settings.hooks}, expected array or object`,
          skipped: true
        });
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      // Log non-ENOENT errors (malformed JSON, etc.)
      console.warn(`Failed to parse ${settingsPath}: ${error.message}`);
      warnings.push({
        file: settingsPath,
        error: error.message,
        skipped: true
      });
    }
  }

  // Try reading settings.local.json
  try {
    const localSettings = await readJSON(localSettingsPath);
    if (localSettings && localSettings.hooks) {
      // Type check before .map()
      if (Array.isArray(localSettings.hooks)) {
        hooks.push(...localSettings.hooks.map(hook => ({
          ...hook,
          source: 'settings.local.json'
        })));
      } else if (typeof localSettings.hooks === 'object') {
        // Handle object format: { "UserPromptSubmit": [...], "Notification": [...] }
        // Each event maps to an array of matcher configs
        for (const [event, matchers] of Object.entries(localSettings.hooks)) {
          if (Array.isArray(matchers)) {
            matchers.forEach((matcher, index) => {
              hooks.push({
                event,
                matcher: matcher.matcher || '',
                hooks: matcher.hooks || [],
                source: 'settings.local.json',
                matcherIndex: index
              });
            });
          }
        }
      } else {
        // Unexpected type
        console.warn(`Unexpected hooks format in ${localSettingsPath}: ${typeof localSettings.hooks}`);
        warnings.push({
          file: localSettingsPath,
          error: `hooks is ${typeof localSettings.hooks}, expected array or object`,
          skipped: true
        });
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      // Log non-ENOENT errors (malformed JSON, etc.)
      console.warn(`Failed to parse ${localSettingsPath}: ${error.message}`);
      warnings.push({
        file: localSettingsPath,
        error: error.message,
        skipped: true
      });
    }
  }

  return { hooks, warnings };
}

/**
 * Gets MCP servers for a specific project (from .mcp.json and settings files)
 * @param {string} projectPath - Absolute project path
 * @returns {Promise<Object>} Object with mcp array and warnings array
 */
async function getProjectMCP(projectPath) {
  const mcpPath = path.join(projectPath, '.mcp.json');
  const settingsPath = path.join(projectPath, '.claude', 'settings.json');
  const localSettingsPath = path.join(projectPath, '.claude', 'settings.local.json');

  const mcp = [];
  const warnings = [];

  // Try reading .mcp.json
  try {
    const config = await readJSON(mcpPath);

    if (config && config.mcpServers) {
      // Type check before Object.entries()
      if (typeof config.mcpServers === 'object' && !Array.isArray(config.mcpServers)) {
        mcp.push(...Object.entries(config.mcpServers).map(([name, serverConfig]) => ({
          name,
          ...serverConfig,
          source: '.mcp.json'
        })));
      } else {
        // Unexpected type
        const actualType = Array.isArray(config.mcpServers) ? 'array' : typeof config.mcpServers;
        console.warn(`Unexpected mcpServers format in ${mcpPath}: ${actualType}`);
        warnings.push({
          file: mcpPath,
          error: `mcpServers is ${actualType}, expected object`,
          skipped: true
        });
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      // Log non-ENOENT errors (malformed JSON, etc.)
      console.warn(`Failed to parse ${mcpPath}: ${error.message}`);
      warnings.push({
        file: mcpPath,
        error: error.message,
        skipped: true
      });
    }
  }

  // Try reading .claude/settings.json for MCP servers
  try {
    const settings = await readJSON(settingsPath);

    if (settings && settings.mcpServers) {
      // Type check before Object.entries()
      if (typeof settings.mcpServers === 'object' && !Array.isArray(settings.mcpServers)) {
        mcp.push(...Object.entries(settings.mcpServers).map(([name, serverConfig]) => ({
          name,
          ...serverConfig,
          source: 'settings.json'
        })));
      } else {
        // Unexpected type
        const actualType = Array.isArray(settings.mcpServers) ? 'array' : typeof settings.mcpServers;
        console.warn(`Unexpected mcpServers format in ${settingsPath}: ${actualType}`);
        warnings.push({
          file: settingsPath,
          error: `mcpServers is ${actualType}, expected object`,
          skipped: true
        });
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      // Log non-ENOENT errors (malformed JSON, etc.)
      console.warn(`Failed to parse ${settingsPath}: ${error.message}`);
      warnings.push({
        file: settingsPath,
        error: error.message,
        skipped: true
      });
    }
  }

  // Try reading .claude/settings.local.json for MCP servers
  try {
    const localSettings = await readJSON(localSettingsPath);

    if (localSettings && localSettings.mcpServers) {
      // Type check before Object.entries()
      if (typeof localSettings.mcpServers === 'object' && !Array.isArray(localSettings.mcpServers)) {
        mcp.push(...Object.entries(localSettings.mcpServers).map(([name, serverConfig]) => ({
          name,
          ...serverConfig,
          source: 'settings.local.json'
        })));
      } else {
        // Unexpected type
        const actualType = Array.isArray(localSettings.mcpServers) ? 'array' : typeof localSettings.mcpServers;
        console.warn(`Unexpected mcpServers format in ${localSettingsPath}: ${actualType}`);
        warnings.push({
          file: localSettingsPath,
          error: `mcpServers is ${actualType}, expected object`,
          skipped: true
        });
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      // Log non-ENOENT errors (malformed JSON, etc.)
      console.warn(`Failed to parse ${localSettingsPath}: ${error.message}`);
      warnings.push({
        file: localSettingsPath,
        error: error.message,
        skipped: true
      });
    }
  }

  return { mcp, warnings };
}

/**
 * Gets user-level subagents from ~/.claude/agents/
 * @returns {Promise<Object>} Object with agents array and warnings array
 */
async function getUserAgents() {
  const agentsDir = expandHome('~/.claude/agents');

  try {
    const files = await listFiles(agentsDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    const agents = [];
    const warnings = [];

    for (const file of mdFiles) {
      const filePath = path.join(agentsDir, file);

      try {
        const parsed = await readMarkdownWithFrontmatter(filePath);

        if (parsed) {
          // Check if there was a YAML parse error
          if (parsed.hasError) {
            // Add warning but include the agent with partial data
            warnings.push({
              file: filePath,
              error: parsed.parseError,
              skipped: false // Not skipped, included with partial data
            });
          }

          // Handle tools field - can be string or array
          let tools = [];
          if (parsed.frontmatter.tools) {
            if (typeof parsed.frontmatter.tools === 'string') {
              // Split by comma and trim
              tools = parsed.frontmatter.tools.split(',').map(t => t.trim()).filter(Boolean);
            } else if (Array.isArray(parsed.frontmatter.tools)) {
              tools = parsed.frontmatter.tools;
            }
          }

          agents.push({
            name: file.replace('.md', ''),
            file: file,
            path: filePath,
            frontmatter: parsed.frontmatter,
            content: parsed.content,
            description: parsed.frontmatter.description || '',
            tools: tools,
            color: parsed.frontmatter.color || null,
            model: parsed.frontmatter.model || 'inherit',
            hasParseError: parsed.hasError || false
          });
        }
      } catch (parseError) {
        // Log warning for malformed file and continue processing
        console.warn(`Skipping user agent file ${filePath}: ${parseError.message}`);
        warnings.push({
          file: filePath,
          error: parseError.message,
          skipped: true
        });
      }
    }

    return { agents, warnings };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { agents: [], warnings: [] }; // No user agents directory
    }
    throw error;
  }
}

/**
 * Gets user-level slash commands from ~/.claude/commands/
 * @returns {Promise<Object>} Object with commands array and warnings array
 */
async function getUserCommands() {
  const commandsDir = expandHome('~/.claude/commands');

  try {
    const files = await listFilesRecursive(commandsDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    const commands = [];
    const warnings = [];

    for (const relFile of mdFiles) {
      const filePath = path.join(commandsDir, relFile);

      try {
        const parsed = await readMarkdownWithFrontmatter(filePath);

        if (parsed) {
          // Check if there was a YAML parse error
          if (parsed.hasError) {
            // Add warning but include the command with partial data
            warnings.push({
              file: filePath,
              error: parsed.parseError,
              skipped: false // Not skipped, included with partial data
            });
          }

          const commandName = relFile.replace('.md', '');

          // Handle allowed-tools field - can be string or array
          // Note: Slash commands use 'allowed-tools' per Claude Code spec
          let tools = [];
          const allowedTools = parsed.frontmatter['allowed-tools'];

          if (allowedTools) {
            if (typeof allowedTools === 'string') {
              // Split by comma and trim
              tools = allowedTools.split(',').map(t => t.trim()).filter(Boolean);
            } else if (Array.isArray(allowedTools)) {
              tools = allowedTools;
            }
          }

          commands.push({
            name: commandName,
            file: relFile,
            path: filePath,
            frontmatter: parsed.frontmatter,
            content: parsed.content,
            description: parsed.frontmatter.description || '',
            tools: tools,
            argumentHint: parsed.frontmatter['argument-hint'] || null,
            hasParseError: parsed.hasError || false
          });
        }
      } catch (parseError) {
        // Log warning for malformed file and continue processing
        console.warn(`Skipping user command file ${filePath}: ${parseError.message}`);
        warnings.push({
          file: filePath,
          error: parseError.message,
          skipped: true
        });
      }
    }

    return { commands, warnings };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { commands: [], warnings: [] }; // No user commands directory
    }
    throw error;
  }
}

/**
 * Gets user-level hooks from ~/.claude/settings.json
 * @returns {Promise<Object>} Object with hooks array and warnings array
 */
async function getUserHooks() {
  const settingsPath = expandHome('~/.claude/settings.json');

  const hooks = [];
  const warnings = [];

  try {
    const settings = await readJSON(settingsPath);

    if (settings && settings.hooks) {
      // Type check before .map()
      if (Array.isArray(settings.hooks)) {
        hooks.push(...settings.hooks.map(hook => ({
          ...hook,
          source: '~/.claude/settings.json'
        })));
      } else if (typeof settings.hooks === 'object') {
        // Handle object format: { "UserPromptSubmit": [...], "Notification": [...] }
        // Each event maps to an array of matcher configs
        for (const [event, matchers] of Object.entries(settings.hooks)) {
          if (Array.isArray(matchers)) {
            matchers.forEach((matcher, index) => {
              hooks.push({
                event,
                matcher: matcher.matcher || '',
                hooks: matcher.hooks || [],
                source: '~/.claude/settings.json',
                matcherIndex: index
              });
            });
          }
        }
      } else {
        // Unexpected type
        console.warn(`Unexpected hooks format in ${settingsPath}: ${typeof settings.hooks}`);
        warnings.push({
          file: settingsPath,
          error: `hooks is ${typeof settings.hooks}, expected array or object`,
          skipped: true
        });
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      // Log non-ENOENT errors (malformed JSON, etc.)
      console.warn(`Failed to parse ${settingsPath}: ${error.message}`);
      warnings.push({
        file: settingsPath,
        error: error.message,
        skipped: true
      });
    }
  }

  return { hooks, warnings };
}

/**
 * Gets user-level MCP servers from ~/.claude/settings.json
 * @returns {Promise<Object>} Object with mcp array and warnings array
 */
async function getUserMCP() {
  const settingsPath = expandHome('~/.claude/settings.json');

  const mcp = [];
  const warnings = [];

  try {
    const settings = await readJSON(settingsPath);

    if (settings && settings.mcpServers) {
      // Type check before Object.entries()
      if (typeof settings.mcpServers === 'object' && !Array.isArray(settings.mcpServers)) {
        mcp.push(...Object.entries(settings.mcpServers).map(([name, serverConfig]) => ({
          name,
          ...serverConfig,
          source: '~/.claude/settings.json'
        })));
      } else {
        // Unexpected type
        const actualType = Array.isArray(settings.mcpServers) ? 'array' : typeof settings.mcpServers;
        console.warn(`Unexpected mcpServers format in ${settingsPath}: ${actualType}`);
        warnings.push({
          file: settingsPath,
          error: `mcpServers is ${actualType}, expected object`,
          skipped: true
        });
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      // Log non-ENOENT errors (malformed JSON, etc.)
      console.warn(`Failed to parse ${settingsPath}: ${error.message}`);
      warnings.push({
        file: settingsPath,
        error: error.message,
        skipped: true
      });
    }
  }

  return { mcp, warnings };
}

/**
 * Counts configuration items for a project (for summary display)
 * @param {string} projectPath - Absolute project path
 * @returns {Promise<Object>} Object with counts
 */
async function getProjectCounts(projectPath) {
  try {
    const [agentsResult, commandsResult, hooksResult, mcpResult] = await Promise.all([
      getProjectAgents(projectPath),
      getProjectCommands(projectPath),
      getProjectHooks(projectPath),
      getProjectMCP(projectPath)
    ]);

    return {
      agents: agentsResult.agents.length,
      commands: commandsResult.commands.length,
      hooks: hooksResult.hooks.length,
      mcp: mcpResult.mcp.length
    };
  } catch (error) {
    return {
      agents: 0,
      commands: 0,
      hooks: 0,
      mcp: 0
    };
  }
}

module.exports = {
  discoverProjects,
  getProjectAgents,
  getProjectCommands,
  getProjectHooks,
  getProjectMCP,
  getUserAgents,
  getUserCommands,
  getUserHooks,
  getUserMCP,
  getProjectCounts
};
