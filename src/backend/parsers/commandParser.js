/**
 * Command Parser
 * Parses slash command markdown files from .claude/commands/** /*.md
 * Supports nested directory structures for command namespacing
 */

const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const config = require('../config/config');

/**
 * Parse a single command markdown file
 * @param {string} filePath - Absolute path to the command .md file
 * @param {string} baseDir - Base commands directory path for namespace calculation
 * @param {string} scope - 'project' or 'user'
 * @returns {Promise<Object|null>} Parsed command object or null on error
 */
async function parseCommand(filePath, baseDir, scope = 'project') {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const filename = path.basename(filePath, '.md');

    // Calculate namespace from directory structure
    const relativePath = path.relative(baseDir, path.dirname(filePath));
    const namespace = relativePath === '' ? null : relativePath.replace(path.sep, '/');

    let parsed;
    let parseError = null;

    try {
      parsed = matter(content);
    } catch (yamlError) {
      // YAML parsing failed - still create an entry with error indicator
      console.warn(`YAML parsing error in ${filePath}:`, yamlError.message);
      parseError = yamlError.message;

      // Extract description from first non-empty line as fallback
      let description = 'Error parsing YAML frontmatter';
      const firstLine = content.split('\n').find(line => line.trim() !== '' && !line.trim().startsWith('---'));
      if (firstLine) {
        description = firstLine.replace(/^#+\s*/, '').trim();
      }

      return {
        name: filename,
        namespace: namespace,
        description: description,
        content: content,
        filePath: filePath,
        scope: scope,
        parseError: parseError,
        hasError: true
      };
    }

    // Extract frontmatter and content
    const { data, content: commandContent } = parsed;

    // Extract description from frontmatter or first non-empty line
    let description = data.description || '';
    if (!description && commandContent) {
      const firstLine = commandContent.split('\n').find(line => line.trim() !== '');
      if (firstLine) {
        // Remove markdown heading markers if present
        description = firstLine.replace(/^#+\s*/, '').trim();
      }
    }

    // Per Claude Code spec (https://docs.claude.com/slash-commands#metadata):
    // Slash commands use 'allowed-tools' property (agents use 'tools')
    // Map to 'tools' field in API response for frontend consistency
    let tools = [];
    if (data['allowed-tools']) {
      if (typeof data['allowed-tools'] === 'string') {
        // Split by comma and trim
        tools = data['allowed-tools'].split(',').map(t => t.trim()).filter(Boolean);
      } else if (Array.isArray(data['allowed-tools'])) {
        tools = data['allowed-tools'];
      }
    }

    return {
      name: data.name || filename,
      namespace: namespace,
      description: description,
      tools: tools,
      color: data.color || null,
      model: data.model || null,
      argumentHint: data['argument-hint'] || null,
      disableModelInvocation: data['disable-model-invocation'] || null,
      content: commandContent.trim(),
      filePath: filePath,
      scope: scope,
      parseError: null,
      hasError: false
    };
  } catch (error) {
    console.error(`Error parsing command ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Recursively find all .md files in a directory
 * @param {string} directoryPath - Directory to search
 * @param {Array} fileList - Accumulator for found files
 * @returns {Promise<Array>} Array of file paths
 */
async function findMarkdownFiles(directoryPath, fileList = []) {
  try {
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        await findMarkdownFiles(fullPath, fileList);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        fileList.push(fullPath);
      }
    }

    return fileList;
  } catch (error) {
    console.error(`Error reading directory ${directoryPath}:`, error.message);
    return fileList;
  }
}

/**
 * Parse all command files in a directory (including nested)
 * @param {string} directoryPath - Absolute path to the commands directory
 * @param {string} scope - 'project' or 'user'
 * @returns {Promise<Array>} Array of parsed command objects
 */
async function parseAllCommands(directoryPath, scope = 'project') {
  try {
    // Check if directory exists
    try {
      await fs.access(directoryPath);
    } catch {
      return []; // Directory doesn't exist, return empty array
    }

    const mdFiles = await findMarkdownFiles(directoryPath);

    const commands = await Promise.all(
      mdFiles.map(file => parseCommand(file, directoryPath, scope))
    );

    // Filter out null results (failed parses)
    return commands.filter(cmd => cmd !== null);
  } catch (error) {
    console.error(`Error reading commands directory ${directoryPath}:`, error.message);
    return [];
  }
}

/**
 * Get both project and user commands
 * @param {string} projectPath - Absolute path to project root
 * @param {string} userHomePath - Absolute path to user home directory
 * @returns {Promise<Object>} Object with project and user command arrays
 */
async function getAllCommands(projectPath, userHomePath) {
  const projectCommandsPath = config.paths.getProjectCommandsDir(projectPath);
  const userCommandsPath = config.paths.getUserCommandsDir();

  const [projectCommands, userCommands] = await Promise.all([
    parseAllCommands(projectCommandsPath, 'project'),
    parseAllCommands(userCommandsPath, 'user')
  ]);

  return {
    project: projectCommands,
    user: userCommands
  };
}

module.exports = {
  parseCommand,
  parseAllCommands,
  getAllCommands
};
