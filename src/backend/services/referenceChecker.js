const path = require('path');
const fs = require('fs').promises;

/**
 * ReferenceChecker - Finds references to configuration items across project
 *
 * This service scans all configuration files in a project to find references
 * to a specific item (agent, command, skill, hook, or MCP server). This is
 * useful for determining dependencies before deletion or modification.
 *
 * Key responsibilities:
 * - Scan multiple config file types in parallel
 * - Find exact matches with line numbers
 * - Handle timeouts gracefully
 * - Return partial results on timeout
 */

/**
 * Searches a file for references to an item name
 *
 * @param {string} filePath - Absolute path to file to search
 * @param {string} itemName - Name to search for (exact match)
 * @returns {Promise<Array<number>>} Array of line numbers where item is referenced
 */
async function searchFileForReferences(filePath, itemName) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    const matchingLines = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(itemName)) {
        matchingLines.push(i + 1); // Line numbers are 1-indexed
      }
    }

    return matchingLines;
  } catch (error) {
    // If file can't be read, return empty array (file may not exist)
    return [];
  }
}

/**
 * Scans a directory recursively for files matching a pattern
 *
 * @param {string} dirPath - Directory to scan
 * @param {string} pattern - File extension or pattern to match (e.g., '.md')
 * @returns {Promise<Array<string>>} Array of absolute file paths
 */
async function scanDirectory(dirPath, pattern) {
  try {
    // Check if directory exists
    try {
      await fs.access(dirPath, fs.constants.F_OK);
    } catch {
      return []; // Directory doesn't exist
    }

    const stats = await fs.stat(dirPath);
    if (!stats.isDirectory()) {
      return []; // Not a directory
    }

    const files = [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        const subFiles = await scanDirectory(fullPath, pattern);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith(pattern)) {
        files.push(fullPath);
      }
    }

    return files;
  } catch (error) {
    // If directory can't be read, return empty array
    return [];
  }
}

/**
 * Finds all references to a configuration item across a project
 *
 * Scans the following locations:
 * - .claude/agents/*.md - agent files
 * - .claude/commands/**\/*.md - command files (recursive)
 * - .claude/skills/*\/SKILL.md - skill files
 * - .claude/settings.json - hooks
 * - .mcp.json - MCP servers
 *
 * Note: Self-references are excluded (e.g., an agent file won't be listed as
 * referencing itself just because the agent name appears in its frontmatter)
 *
 * @param {string} itemType - Type of item ('agent', 'command', 'skill', 'hook', 'mcp')
 * @param {string} itemName - Name of item to search for
 * @param {string} projectPath - Absolute path to project root
 * @returns {Promise<Array<{type: string, name: string, location: string, lines: Array<number>}>>} Array of references
 */
async function findReferences(itemType, itemName, projectPath) {
  // Validate inputs
  if (!itemType || typeof itemType !== 'string') {
    throw new Error('Invalid itemType: must be a non-empty string');
  }

  if (!itemName || typeof itemName !== 'string') {
    throw new Error('Invalid itemName: must be a non-empty string');
  }

  if (!projectPath || typeof projectPath !== 'string') {
    throw new Error('Invalid projectPath: must be a non-empty string');
  }

  // Validate itemType
  const validTypes = ['agent', 'command', 'skill', 'hook', 'mcp'];
  if (!validTypes.includes(itemType)) {
    throw new Error(`Invalid itemType: must be one of ${validTypes.join(', ')}`);
  }

  // Define scan locations
  const claudeDir = path.join(projectPath, '.claude');
  const scanTasks = [];
  const references = [];

  // Timeout protection (5 seconds)
  const timeout = 5000;
  let timedOut = false;

  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => {
      timedOut = true;
      resolve([]);
    }, timeout);
  });

  // Determine the self-reference file to exclude
  // For agents: exclude the agent's own file (agentName.md)
  // For other types, we'll handle similarly
  const selfFileName = itemType === 'agent' ? `${itemName}.md` : null;

  try {
    // Scan .claude/agents/*.md
    const agentFiles = await scanDirectory(path.join(claudeDir, 'agents'), '.md');
    for (const filePath of agentFiles) {
      // Skip self-reference for agents
      if (itemType === 'agent' && path.basename(filePath) === selfFileName) {
        continue;
      }

      scanTasks.push(
        searchFileForReferences(filePath, itemName).then(lines => {
          if (lines.length > 0) {
            references.push({
              type: 'agent',
              name: path.basename(filePath, '.md'),
              location: filePath,
              lines
            });
          }
        })
      );
    }

    // Scan .claude/commands/**/*.md (recursive)
    const commandFiles = await scanDirectory(path.join(claudeDir, 'commands'), '.md');
    for (const filePath of commandFiles) {
      scanTasks.push(
        searchFileForReferences(filePath, itemName).then(lines => {
          if (lines.length > 0) {
            references.push({
              type: 'command',
              name: path.basename(filePath, '.md'),
              location: filePath,
              lines
            });
          }
        })
      );
    }

    // Scan .claude/skills/*/SKILL.md
    const skillsDir = path.join(claudeDir, 'skills');
    try {
      await fs.access(skillsDir, fs.constants.F_OK);
      const skillDirs = await fs.readdir(skillsDir, { withFileTypes: true });

      for (const dir of skillDirs) {
        if (dir.isDirectory()) {
          const skillFilePath = path.join(skillsDir, dir.name, 'SKILL.md');
          scanTasks.push(
            searchFileForReferences(skillFilePath, itemName).then(lines => {
              if (lines.length > 0) {
                references.push({
                  type: 'skill',
                  name: dir.name,
                  location: skillFilePath,
                  lines
                });
              }
            })
          );
        }
      }
    } catch {
      // Skills directory doesn't exist, skip
    }

    // Scan .claude/settings.json (hooks)
    const settingsPath = path.join(claudeDir, 'settings.json');
    scanTasks.push(
      searchFileForReferences(settingsPath, itemName).then(lines => {
        if (lines.length > 0) {
          references.push({
            type: 'settings',
            name: 'settings.json',
            location: settingsPath,
            lines
          });
        }
      })
    );

    // Scan .mcp.json (MCP servers)
    const mcpPath = path.join(projectPath, '.mcp.json');
    scanTasks.push(
      searchFileForReferences(mcpPath, itemName).then(lines => {
        if (lines.length > 0) {
          references.push({
            type: 'mcp',
            name: '.mcp.json',
            location: mcpPath,
            lines
          });
        }
      })
    );

    // Execute all scans in parallel with timeout
    await Promise.race([
      Promise.all(scanTasks),
      timeoutPromise
    ]);

    // If timed out, return partial results
    if (timedOut) {
      console.warn(`Reference scan timed out after ${timeout}ms, returning partial results`);
    }

    return references;
  } catch (error) {
    // Return partial results even on error
    console.error('Error during reference scan:', error);
    return references;
  }
}

module.exports = {
  findReferences
};
