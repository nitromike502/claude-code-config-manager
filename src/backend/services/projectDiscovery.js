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
 * Valid Claude Code hook events per official specification
 * @see https://docs.claude.com/en/docs/claude-code/hooks
 * @see https://json.schemastore.org/claude-code-settings.json
 */
const VALID_HOOK_EVENTS = [
  'PreToolUse', 'PostToolUse', 'UserPromptSubmit',
  'Notification', 'Stop', 'SubagentStop',
  'PreCompact', 'SessionStart', 'SessionEnd'
];

/**
 * Hook events that support matchers (can filter by tool name)
 * Only PreToolUse and PostToolUse support the matcher field per official specification
 * @see https://docs.claude.com/en/docs/claude-code/hooks
 * @see https://json.schemastore.org/claude-code-settings.json
 */
const MATCHER_EVENTS = ['PreToolUse', 'PostToolUse'];

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
          // STEP 2: Validate event name against Claude Code specification
          if (!VALID_HOOK_EVENTS.includes(event)) {
            warnings.push({
              file: settingsPath,
              error: `Invalid hook event: "${event}". Valid events are: ${VALID_HOOK_EVENTS.join(', ')}`,
              severity: 'error',
              skipped: true,
              helpText: 'See https://docs.claude.com/en/docs/claude-code/hooks for valid event names'
            });
            continue;
          }

          // Check if event supports matchers
          const supportsMatchers = MATCHER_EVENTS.includes(event);

          // STEP 3: Validate top-level structure (must be array)
          if (!Array.isArray(matchers)) {
            warnings.push({
              file: settingsPath,
              error: `Hook event "${event}" must be an array of hook objects, got ${typeof matchers}`,
              severity: 'error',
              skipped: true,
              helpText: 'See https://json.schemastore.org/claude-code-settings.json for valid format'
            });
            continue;
          }

          // STEP 3: Validate each matcher entry
          matchers.forEach((matcherEntry, index) => {
            // Validate matcher entry is an object
            if (!matcherEntry || typeof matcherEntry !== 'object') {
              warnings.push({
                file: settingsPath,
                error: `Each hook entry for "${event}" must be an object with "hooks" property`,
                severity: 'error',
                skipped: true
              });
              return;
            }

            // Validate hooks property exists and is array
            if (!Array.isArray(matcherEntry.hooks)) {
              warnings.push({
                file: settingsPath,
                error: `Hook entry for "${event}" missing required "hooks" array`,
                severity: 'error',
                skipped: true
              });
              return;
            }

            // Warn if matcher used on non-matcher event
            if (matcherEntry.matcher && !supportsMatchers) {
              warnings.push({
                file: settingsPath,
                error: `Event "${event}" does not support matchers. Matcher field will be ignored.`,
                severity: 'warning',
                skipped: false
              });
            }

            // STEP 3: Validate each hook command
            const validHooks = [];
            for (const hook of matcherEntry.hooks) {
              // Validate hook is object
              if (!hook || typeof hook !== 'object') {
                warnings.push({
                  file: settingsPath,
                  error: `Hook command must be an object with "type" and "command" fields`,
                  severity: 'error',
                  skipped: true
                });
                continue;
              }

              // Validate type field (must be "command")
              if (hook.type && hook.type !== 'command') {
                warnings.push({
                  file: settingsPath,
                  error: `Hook type must be "command", got "${hook.type}". Defaulting to "command".`,
                  severity: 'warning',
                  skipped: false
                });
                hook.type = 'command';
              } else if (!hook.type) {
                // Auto-fix missing type
                hook.type = 'command';
              }

              // Validate command field (required, must be string)
              if (!hook.command || typeof hook.command !== 'string') {
                warnings.push({
                  file: settingsPath,
                  error: `Hook missing required "command" field (string)`,
                  severity: 'error',
                  skipped: true
                });
                continue;
              }

              // Validate timeout if present
              if (hook.timeout !== undefined && (typeof hook.timeout !== 'number' || hook.timeout <= 0)) {
                warnings.push({
                  file: settingsPath,
                  error: `Hook timeout must be a positive number, got ${hook.timeout}. Using default (60s).`,
                  severity: 'warning',
                  skipped: false
                });
                hook.timeout = 60;
              }

              // Hook passed validation
              validHooks.push(hook);
            }

            // STEP 4: Flatten response structure - create one object per hook command
            // This makes it easier for the UI to consume without nested arrays
            if (validHooks.length > 0) {
              for (const hook of validHooks) {
                hooks.push({
                  event,
                  matcher: matcherEntry.matcher || '*',
                  type: hook.type || 'command',
                  command: hook.command,
                  timeout: hook.timeout || 60,
                  enabled: hook.enabled !== undefined ? hook.enabled : true,
                  source: 'settings.json'
                });
              }
            }
          });
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
          // STEP 2: Validate event name against Claude Code specification
          if (!VALID_HOOK_EVENTS.includes(event)) {
            warnings.push({
              file: localSettingsPath,
              error: `Invalid hook event: "${event}". Valid events are: ${VALID_HOOK_EVENTS.join(', ')}`,
              severity: 'error',
              skipped: true,
              helpText: 'See https://docs.claude.com/en/docs/claude-code/hooks for valid event names'
            });
            continue;
          }

          // Check if event supports matchers
          const supportsMatchers = MATCHER_EVENTS.includes(event);

          // STEP 3: Validate top-level structure (must be array)
          if (!Array.isArray(matchers)) {
            warnings.push({
              file: localSettingsPath,
              error: `Hook event "${event}" must be an array of hook objects, got ${typeof matchers}`,
              severity: 'error',
              skipped: true,
              helpText: 'See https://json.schemastore.org/claude-code-settings.json for valid format'
            });
            continue;
          }

          // STEP 3: Validate each matcher entry
          matchers.forEach((matcherEntry, index) => {
            // Validate matcher entry is an object
            if (!matcherEntry || typeof matcherEntry !== 'object') {
              warnings.push({
                file: localSettingsPath,
                error: `Each hook entry for "${event}" must be an object with "hooks" property`,
                severity: 'error',
                skipped: true
              });
              return;
            }

            // Validate hooks property exists and is array
            if (!Array.isArray(matcherEntry.hooks)) {
              warnings.push({
                file: localSettingsPath,
                error: `Hook entry for "${event}" missing required "hooks" array`,
                severity: 'error',
                skipped: true
              });
              return;
            }

            // Warn if matcher used on non-matcher event
            if (matcherEntry.matcher && !supportsMatchers) {
              warnings.push({
                file: localSettingsPath,
                error: `Event "${event}" does not support matchers. Matcher field will be ignored.`,
                severity: 'warning',
                skipped: false
              });
            }

            // STEP 3: Validate each hook command
            const validHooks = [];
            for (const hook of matcherEntry.hooks) {
              // Validate hook is object
              if (!hook || typeof hook !== 'object') {
                warnings.push({
                  file: localSettingsPath,
                  error: `Hook command must be an object with "type" and "command" fields`,
                  severity: 'error',
                  skipped: true
                });
                continue;
              }

              // Validate type field (must be "command")
              if (hook.type && hook.type !== 'command') {
                warnings.push({
                  file: localSettingsPath,
                  error: `Hook type must be "command", got "${hook.type}". Defaulting to "command".`,
                  severity: 'warning',
                  skipped: false
                });
                hook.type = 'command';
              } else if (!hook.type) {
                // Auto-fix missing type
                hook.type = 'command';
              }

              // Validate command field (required, must be string)
              if (!hook.command || typeof hook.command !== 'string') {
                warnings.push({
                  file: localSettingsPath,
                  error: `Hook missing required "command" field (string)`,
                  severity: 'error',
                  skipped: true
                });
                continue;
              }

              // Validate timeout if present
              if (hook.timeout !== undefined && (typeof hook.timeout !== 'number' || hook.timeout <= 0)) {
                warnings.push({
                  file: localSettingsPath,
                  error: `Hook timeout must be a positive number, got ${hook.timeout}. Using default (60s).`,
                  severity: 'warning',
                  skipped: false
                });
                hook.timeout = 60;
              }

              // Hook passed validation
              validHooks.push(hook);
            }

            // STEP 4: Flatten response structure - create one object per hook command
            // This makes it easier for the UI to consume without nested arrays
            if (validHooks.length > 0) {
              for (const hook of validHooks) {
                hooks.push({
                  event,
                  matcher: matcherEntry.matcher || '*',
                  type: hook.type || 'command',
                  command: hook.command,
                  timeout: hook.timeout || 60,
                  enabled: hook.enabled !== undefined ? hook.enabled : true,
                  source: 'settings.local.json'
                });
              }
            }
          });
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

  // STEP 5: Apply deduplication before returning
  const deduplicatedHooks = deduplicateHooks(hooks);

  return { hooks: deduplicatedHooks, warnings };
}

/**
 * Gets MCP servers for a specific project (from .mcp.json only)
 * Per Claude Code spec: project MCP servers are stored in .mcp.json
 * User-level MCP servers are stored in ~/.claude/settings.json
 * @param {string} projectPath - Absolute project path
 * @returns {Promise<Object>} Object with mcp array and warnings array
 */
async function getProjectMCP(projectPath) {
  const mcpPath = path.join(projectPath, '.mcp.json');

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
          // STEP 2: Validate event name against Claude Code specification
          if (!VALID_HOOK_EVENTS.includes(event)) {
            warnings.push({
              file: settingsPath,
              error: `Invalid hook event: "${event}". Valid events are: ${VALID_HOOK_EVENTS.join(', ')}`,
              severity: 'error',
              skipped: true,
              helpText: 'See https://docs.claude.com/en/docs/claude-code/hooks for valid event names'
            });
            continue;
          }

          // Check if event supports matchers
          const supportsMatchers = MATCHER_EVENTS.includes(event);

          // STEP 3: Validate top-level structure (must be array)
          if (!Array.isArray(matchers)) {
            warnings.push({
              file: settingsPath,
              error: `Hook event "${event}" must be an array of hook objects, got ${typeof matchers}`,
              severity: 'error',
              skipped: true,
              helpText: 'See https://json.schemastore.org/claude-code-settings.json for valid format'
            });
            continue;
          }

          // STEP 3: Validate each matcher entry
          matchers.forEach((matcherEntry, index) => {
            // Validate matcher entry is an object
            if (!matcherEntry || typeof matcherEntry !== 'object') {
              warnings.push({
                file: settingsPath,
                error: `Each hook entry for "${event}" must be an object with "hooks" property`,
                severity: 'error',
                skipped: true
              });
              return;
            }

            // Validate hooks property exists and is array
            if (!Array.isArray(matcherEntry.hooks)) {
              warnings.push({
                file: settingsPath,
                error: `Hook entry for "${event}" missing required "hooks" array`,
                severity: 'error',
                skipped: true
              });
              return;
            }

            // Warn if matcher used on non-matcher event
            if (matcherEntry.matcher && !supportsMatchers) {
              warnings.push({
                file: settingsPath,
                error: `Event "${event}" does not support matchers. Matcher field will be ignored.`,
                severity: 'warning',
                skipped: false
              });
            }

            // STEP 3: Validate each hook command
            const validHooks = [];
            for (const hook of matcherEntry.hooks) {
              // Validate hook is object
              if (!hook || typeof hook !== 'object') {
                warnings.push({
                  file: settingsPath,
                  error: `Hook command must be an object with "type" and "command" fields`,
                  severity: 'error',
                  skipped: true
                });
                continue;
              }

              // Validate type field (must be "command")
              if (hook.type && hook.type !== 'command') {
                warnings.push({
                  file: settingsPath,
                  error: `Hook type must be "command", got "${hook.type}". Defaulting to "command".`,
                  severity: 'warning',
                  skipped: false
                });
                hook.type = 'command';
              } else if (!hook.type) {
                // Auto-fix missing type
                hook.type = 'command';
              }

              // Validate command field (required, must be string)
              if (!hook.command || typeof hook.command !== 'string') {
                warnings.push({
                  file: settingsPath,
                  error: `Hook missing required "command" field (string)`,
                  severity: 'error',
                  skipped: true
                });
                continue;
              }

              // Validate timeout if present
              if (hook.timeout !== undefined && (typeof hook.timeout !== 'number' || hook.timeout <= 0)) {
                warnings.push({
                  file: settingsPath,
                  error: `Hook timeout must be a positive number, got ${hook.timeout}. Using default (60s).`,
                  severity: 'warning',
                  skipped: false
                });
                hook.timeout = 60;
              }

              // Hook passed validation
              validHooks.push(hook);
            }

            // STEP 4: Flatten response structure - create one object per hook command
            // This makes it easier for the UI to consume without nested arrays
            if (validHooks.length > 0) {
              for (const hook of validHooks) {
                hooks.push({
                  event,
                  matcher: matcherEntry.matcher || '*',
                  type: hook.type || 'command',
                  command: hook.command,
                  timeout: hook.timeout || 60,
                  enabled: hook.enabled !== undefined ? hook.enabled : true,
                  source: '~/.claude/settings.json'
                });
              }
            }
          });
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

  // STEP 5: Apply deduplication before returning
  const deduplicatedHooks = deduplicateHooks(hooks);

  return { hooks: deduplicatedHooks, warnings };
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
 * STEP 5: Deduplicates hooks based on event, matcher, and command
 * Per Claude Code spec: "Identical hook commands are automatically deduplicated"
 * @param {Array} hooks - Array of hook objects
 * @returns {Array} Deduplicated array of hooks
 */
function deduplicateHooks(hooks) {
  const seen = new Set();
  return hooks.filter(hook => {
    // Create unique key from event, matcher, and command
    const key = `${hook.event}::${hook.matcher}::${hook.command}`;
    if (seen.has(key)) {
      return false; // Skip duplicate
    }
    seen.add(key);
    return true; // Keep first occurrence
  });
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
