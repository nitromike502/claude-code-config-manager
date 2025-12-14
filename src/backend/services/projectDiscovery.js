const path = require('path');
const fs = require('fs').promises;
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
            color: parsed.frontmatter.color || null,
            model: parsed.frontmatter.model || null,
            argumentHint: parsed.frontmatter['argument-hint'] || null,
            disableModelInvocation: parsed.frontmatter['disable-model-invocation'] || null,
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
              for (let hookIndex = 0; hookIndex < validHooks.length; hookIndex++) {
                const hook = validHooks[hookIndex];
                const matcher = matcherEntry.matcher || '';

                // Generate hookId: event::matcher::index
                // For matcher-based events, index is per-matcher-group
                // For non-matcher events, index is global within event
                const hookId = `${event}::${matcher}::${hookIndex}`;

                hooks.push({
                  hookId,
                  event,
                  matcher: matcher || '*',
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
            color: parsed.frontmatter.color || null,
            model: parsed.frontmatter.model || null,
            argumentHint: parsed.frontmatter['argument-hint'] || null,
            disableModelInvocation: parsed.frontmatter['disable-model-invocation'] || null,
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
 * Gets skills for a specific project (from .claude/skills/)
 * @param {string} projectPath - Absolute project path
 * @returns {Promise<Object>} Object with skills array and warnings array
 */
async function getProjectSkills(projectPath) {
  const skillsDir = path.join(projectPath, '.claude', 'skills');

  try {
    // Check if directory exists
    try {
      await fs.access(skillsDir);
    } catch {
      return { skills: [], warnings: [] }; // Directory doesn't exist
    }

    // Read subdirectories in skills directory
    const entries = await fs.readdir(skillsDir, { withFileTypes: true });
    const skillDirNames = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);

    const skills = [];
    const warnings = [];

    // Parse each skill directory
    for (const skillDirName of skillDirNames) {
      const skillDirPath = path.join(skillsDir, skillDirName);

      try {
        // Read SKILL.md
        const skillMdPath = path.join(skillDirPath, 'SKILL.md');
        let content;

        try {
          content = await fs.readFile(skillMdPath, 'utf-8');
        } catch (error) {
          warnings.push({
            file: skillDirPath,
            error: `Missing SKILL.md file in skill directory`,
            skipped: true
          });
          continue;
        }

        // Parse frontmatter
        const matter = require('gray-matter');
        let parsed;
        let parseError = null;

        try {
          parsed = matter(content);
        } catch (yamlError) {
          console.warn(`YAML parsing error in ${skillMdPath}:`, yamlError.message);
          parseError = yamlError.message;
          warnings.push({
            file: skillMdPath,
            error: parseError,
            skipped: false
          });

          // Create partial skill object with error
          skills.push({
            name: skillDirName,
            description: 'Error parsing YAML frontmatter',
            allowedTools: [],
            content: content,
            directoryPath: skillDirPath,
            hasParseError: true,
            subdirectories: [],
            fileCount: 0,
            externalReferences: []
          });
          continue;
        }

        // Extract frontmatter and content
        const { data, content: skillContent } = parsed;

        // Handle allowed-tools field
        let tools = [];
        if (data['allowed-tools']) {
          if (typeof data['allowed-tools'] === 'string') {
            tools = data['allowed-tools'].split(',').map(t => t.trim()).filter(Boolean);
          } else if (Array.isArray(data['allowed-tools'])) {
            tools = data['allowed-tools'];
          }
        }

        // Count subdirectories
        const skillEntries = await fs.readdir(skillDirPath, { withFileTypes: true });
        const subdirectories = skillEntries
          .filter(entry => entry.isDirectory())
          .map(entry => entry.name);

        // Count files recursively
        const fileCount = await countFilesRecursive(skillDirPath);

        // Get full file list with relative paths (for tree view)
        const files = await getFilesRecursive(skillDirPath, skillDirPath);

        // Detect external references
        const externalReferences = detectExternalReferences(skillDirPath, content);

        skills.push({
          name: data.name || skillDirName,
          description: data.description || '',
          allowedTools: tools,
          content: skillContent.trim(),
          directoryPath: skillDirPath,
          hasParseError: false,
          subdirectories: subdirectories,
          fileCount: fileCount,
          files: files,
          externalReferences: externalReferences
        });

      } catch (parseError) {
        console.warn(`Skipping skill directory ${skillDirPath}: ${parseError.message}`);
        warnings.push({
          file: skillDirPath,
          error: parseError.message,
          skipped: true
        });
      }
    }

    return { skills, warnings };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { skills: [], warnings: [] };
    }
    throw error;
  }
}

/**
 * Gets user-level skills from ~/.claude/skills/
 * @returns {Promise<Object>} Object with skills array and warnings array
 */
async function getUserSkills() {
  const skillsDir = expandHome('~/.claude/skills');

  try {
    // Check if directory exists
    try {
      await fs.access(skillsDir);
    } catch {
      return { skills: [], warnings: [] }; // Directory doesn't exist
    }

    // Read subdirectories in skills directory
    const entries = await fs.readdir(skillsDir, { withFileTypes: true });
    const skillDirNames = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);

    const skills = [];
    const warnings = [];

    // Parse each skill directory
    for (const skillDirName of skillDirNames) {
      const skillDirPath = path.join(skillsDir, skillDirName);

      try {
        // Read SKILL.md
        const skillMdPath = path.join(skillDirPath, 'SKILL.md');
        let content;

        try {
          content = await fs.readFile(skillMdPath, 'utf-8');
        } catch (error) {
          warnings.push({
            file: skillDirPath,
            error: `Missing SKILL.md file in skill directory`,
            skipped: true
          });
          continue;
        }

        // Parse frontmatter
        const matter = require('gray-matter');
        let parsed;
        let parseError = null;

        try {
          parsed = matter(content);
        } catch (yamlError) {
          console.warn(`YAML parsing error in ${skillMdPath}:`, yamlError.message);
          parseError = yamlError.message;
          warnings.push({
            file: skillMdPath,
            error: parseError,
            skipped: false
          });

          // Create partial skill object with error
          skills.push({
            name: skillDirName,
            description: 'Error parsing YAML frontmatter',
            allowedTools: [],
            content: content,
            directoryPath: skillDirPath,
            hasParseError: true,
            subdirectories: [],
            fileCount: 0,
            externalReferences: []
          });
          continue;
        }

        // Extract frontmatter and content
        const { data, content: skillContent } = parsed;

        // Handle allowed-tools field
        let tools = [];
        if (data['allowed-tools']) {
          if (typeof data['allowed-tools'] === 'string') {
            tools = data['allowed-tools'].split(',').map(t => t.trim()).filter(Boolean);
          } else if (Array.isArray(data['allowed-tools'])) {
            tools = data['allowed-tools'];
          }
        }

        // Count subdirectories
        const skillEntries = await fs.readdir(skillDirPath, { withFileTypes: true });
        const subdirectories = skillEntries
          .filter(entry => entry.isDirectory())
          .map(entry => entry.name);

        // Count files recursively
        const fileCount = await countFilesRecursive(skillDirPath);

        // Get full file list with relative paths (for tree view)
        const files = await getFilesRecursive(skillDirPath, skillDirPath);

        // Detect external references
        const externalReferences = detectExternalReferences(skillDirPath, content);

        skills.push({
          name: data.name || skillDirName,
          description: data.description || '',
          allowedTools: tools,
          content: skillContent.trim(),
          directoryPath: skillDirPath,
          hasParseError: false,
          subdirectories: subdirectories,
          fileCount: fileCount,
          files: files,
          externalReferences: externalReferences
        });

      } catch (parseError) {
        console.warn(`Skipping user skill directory ${skillDirPath}: ${parseError.message}`);
        warnings.push({
          file: skillDirPath,
          error: parseError.message,
          skipped: true
        });
      }
    }

    return { skills, warnings };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { skills: [], warnings: [] };
    }
    throw error;
  }
}

/**
 * Recursively get all files in a directory with relative paths
 * Returns a flat structure for JSTree-style display
 * @param {string} dirPath - Directory path to scan
 * @param {string} basePath - Base path for calculating relative paths
 * @param {string} prefix - Current path prefix (for relative path building)
 * @returns {Promise<Array>} Array of file objects with relativePath
 */
async function getFilesRecursive(dirPath, basePath, prefix = '') {
  const files = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    // Sort entries: directories first, then files, both alphabetically
    entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (entry.isFile()) {
        files.push({
          name: entry.name,
          relativePath: relativePath,
          type: 'file'
        });
      } else if (entry.isDirectory()) {
        // Add directory entry
        files.push({
          name: entry.name,
          relativePath: relativePath,
          type: 'directory'
        });
        // Recursively get files in subdirectory
        const subFiles = await getFilesRecursive(fullPath, basePath, relativePath);
        files.push(...subFiles);
      }
    }
  } catch (error) {
    console.error(`Error getting files in ${dirPath}:`, error.message);
  }

  return files;
}

/**
 * Helper function to count files recursively in a directory
 * @param {string} dirPath - Directory path
 * @returns {Promise<number>} Total file count
 */
async function countFilesRecursive(dirPath) {
  let count = 0;

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isFile()) {
        count++;
      } else if (entry.isDirectory()) {
        count += await countFilesRecursive(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error counting files in ${dirPath}:`, error.message);
  }

  return count;
}

/**
 * Helper function to detect external references in skill content
 * @param {string} skillPath - Absolute path to skill directory
 * @param {string} content - Content to scan
 * @returns {Array} External references
 */
function detectExternalReferences(skillPath, content) {
  const references = [];
  const lines = content.split('\n');

  const patterns = [
    { regex: /(?:^|\s)(\/[^\s'"<>]+)/g, type: 'absolute', severity: 'error' },
    { regex: /(?:^|\s)(~\/[^\s'"<>]+)/g, type: 'home', severity: 'warning' },
    { regex: /(?:^|\s)(\.\.[/\\][^\s'"<>]*)/g, type: 'relative', severity: 'warning' },
    { regex: /(?:node|python|bash|sh)\s+([~./][^\s'"<>]+)/gi, type: 'script', severity: 'error' }
  ];

  lines.forEach((line, lineIndex) => {
    patterns.forEach(({ regex, type, severity }) => {
      regex.lastIndex = 0;

      let match;
      while ((match = regex.exec(line)) !== null) {
        const reference = match[1];

        if (reference.match(/^https?:\/\/|^ftp:\/\//)) {
          continue;
        }

        let resolvedPath;
        try {
          if (reference.startsWith('~')) {
            resolvedPath = null;
          } else if (reference.startsWith('/')) {
            resolvedPath = reference;
          } else {
            resolvedPath = path.resolve(skillPath, reference);
          }

          if (resolvedPath) {
            const normalizedSkillPath = path.normalize(skillPath);
            const normalizedResolved = path.normalize(resolvedPath);

            if (normalizedResolved.startsWith(normalizedSkillPath)) {
              continue;
            }
          }

          references.push({
            file: 'SKILL.md',
            line: lineIndex + 1,
            reference: reference,
            type: type,
            severity: severity
          });

        } catch (error) {
          references.push({
            file: 'SKILL.md',
            line: lineIndex + 1,
            reference: reference,
            type: type,
            severity: severity
          });
        }
      }
    });
  });

  return references;
}

/**
 * Counts configuration items for a project (for summary display)
 * @param {string} projectPath - Absolute project path
 * @returns {Promise<Object>} Object with counts
 */
async function getProjectCounts(projectPath) {
  try {
    const [agentsResult, commandsResult, hooksResult, mcpResult, skillsResult] = await Promise.all([
      getProjectAgents(projectPath),
      getProjectCommands(projectPath),
      getProjectHooks(projectPath),
      getProjectMCP(projectPath),
      getProjectSkills(projectPath)
    ]);

    return {
      agents: agentsResult.agents.length,
      commands: commandsResult.commands.length,
      hooks: hooksResult.hooks.length,
      mcp: mcpResult.mcp.length,
      skills: skillsResult.skills.length
    };
  } catch (error) {
    return {
      agents: 0,
      commands: 0,
      hooks: 0,
      mcp: 0,
      skills: 0
    };
  }
}

module.exports = {
  discoverProjects,
  getProjectAgents,
  getProjectCommands,
  getProjectHooks,
  getProjectMCP,
  getProjectSkills,
  getUserAgents,
  getUserCommands,
  getUserHooks,
  getUserMCP,
  getUserSkills,
  getProjectCounts
};
