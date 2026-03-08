/**
 * Rules Parser
 * Parses rule markdown files from .claude/rules directory recursively
 * Supports nested directory structures for rule namespacing
 */

const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const config = require('../config/config');

/**
 * Extract description from rule content
 * Returns first heading (# stripped) or first non-empty line
 * @param {string} content - Markdown content
 * @returns {string} Extracted description
 */
function extractDescription(content) {
  if (!content || !content.trim()) return '';
  const lines = content.trim().split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Strip markdown heading markers
    if (trimmed.startsWith('#')) {
      return trimmed.replace(/^#+\s*/, '');
    }
    return trimmed;
  }
  return '';
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
 * Parse a single rule markdown file
 * @param {string} filePath - Absolute path to the rule .md file
 * @param {string} baseDir - Base rules directory path for name calculation
 * @param {string} scope - 'project' or 'user'
 * @returns {Promise<Object>} Parsed rule object
 */
async function parseRule(filePath, baseDir, scope = 'project') {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');

    let frontmatter = {};
    let content = raw;
    let parseError = null;

    try {
      const parsed = matter(raw);
      frontmatter = parsed.data;
      content = parsed.content;
    } catch (yamlError) {
      console.warn(`YAML parsing error in ${filePath}:`, yamlError.message);
      parseError = yamlError.message;

      // Calculate name even on error
      const relativePath = path.relative(baseDir, filePath);
      const name = relativePath.replace(/\.md$/i, '').replace(/\\/g, '/');

      return {
        name,
        description: extractDescription(raw),
        paths: null,
        isConditional: false,
        content: raw,
        filePath,
        scope,
        hasError: true,
        parseError
      };
    }

    // Name = relative path without .md extension
    const relativePath = path.relative(baseDir, filePath);
    const name = relativePath.replace(/\.md$/i, '').replace(/\\/g, '/');

    const description = extractDescription(content);

    // paths frontmatter: non-empty array → conditional, otherwise null
    const rulePaths = Array.isArray(frontmatter.paths) && frontmatter.paths.length > 0
      ? frontmatter.paths
      : null;
    const isConditional = rulePaths !== null;

    return {
      name,
      description,
      paths: rulePaths,
      isConditional,
      content: content.trim(),
      filePath,
      scope,
      hasError: false,
      parseError: null
    };
  } catch (error) {
    console.error(`Error parsing rule ${filePath}:`, error.message);
    const relativePath = path.relative(baseDir, filePath);
    const name = relativePath.replace(/\.md$/i, '').replace(/\\/g, '/');
    return {
      name,
      description: '',
      paths: null,
      isConditional: false,
      content: '',
      filePath,
      scope,
      hasError: true,
      parseError: error.message
    };
  }
}

/**
 * Parse all rule files in a directory (including nested)
 * @param {string} directoryPath - Absolute path to the rules directory
 * @param {string} scope - 'project' or 'user'
 * @returns {Promise<{rules: Array, warnings: Array}>} Parsed rules and any warnings
 */
async function parseAllRules(directoryPath, scope = 'project') {
  try {
    // Check if directory exists
    try {
      await fs.access(directoryPath);
    } catch {
      return { rules: [], warnings: [] };
    }

    const mdFiles = await findMarkdownFiles(directoryPath);

    const parsed = await Promise.all(
      mdFiles.map(file => parseRule(file, directoryPath, scope))
    );

    const rules = [];
    const warnings = [];

    for (const rule of parsed) {
      if (rule.hasError && rule.parseError) {
        warnings.push(`Warning: could not fully parse ${rule.filePath}: ${rule.parseError}`);
      }
      rules.push(rule);
    }

    return { rules, warnings };
  } catch (error) {
    console.error(`Error reading rules directory ${directoryPath}:`, error.message);
    return { rules: [], warnings: [] };
  }
}

/**
 * Get both project and user rules
 * @param {string} projectPath - Absolute path to project root
 * @returns {Promise<{project: Array, user: Array}>} Object with project and user rule arrays
 */
async function getAllRules(projectPath) {
  const projectRulesPath = config.paths.getProjectRulesDir(projectPath);
  const userRulesPath = config.paths.getUserRulesDir();

  const [projectResult, userResult] = await Promise.all([
    parseAllRules(projectRulesPath, 'project'),
    parseAllRules(userRulesPath, 'user')
  ]);

  return {
    project: projectResult.rules,
    user: userResult.rules
  };
}

module.exports = {
  parseRule,
  findMarkdownFiles,
  extractDescription,
  parseAllRules,
  getAllRules
};
