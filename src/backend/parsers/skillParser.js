/**
 * Skill Parser
 * Parses skill directories with SKILL.md files from .claude/skills/*
 * Skills contain multiple files and subdirectories, not just a single markdown file
 */

const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const config = require('../config/config');

/**
 * Detect external file references in skill content
 * Identifies references that escape the skill directory
 *
 * @param {string} skillPath - Absolute path to skill directory
 * @param {string} content - Content to scan for references
 * @returns {Array} External references with file, line, reference, type, severity
 */
function detectExternalReferences(skillPath, content) {
  const references = [];
  const lines = content.split('\n');

  // Patterns to detect various types of external references
  const patterns = [
    // Absolute paths starting with /
    { regex: /(?:^|\s)(\/[^\s'"<>]+)/g, type: 'absolute', severity: 'error' },
    // Home directory references ~/
    { regex: /(?:^|\s)(~\/[^\s'"<>]+)/g, type: 'home', severity: 'warning' },
    // Parent directory escapes ../
    { regex: /(?:^|\s)(\.\.[/\\][^\s'"<>]*)/g, type: 'relative', severity: 'warning' },
    // Script executions with paths: node ../shared/run.js, python ~/script.py
    { regex: /(?:node|python|bash|sh)\s+([~./][^\s'"<>]+)/gi, type: 'script', severity: 'error' }
  ];

  lines.forEach((line, lineIndex) => {
    patterns.forEach(({ regex, type, severity }) => {
      // Reset regex state
      regex.lastIndex = 0;

      let match;
      while ((match = regex.exec(line)) !== null) {
        const reference = match[1];

        // Skip false positives
        // URLs (http://, https://, ftp://)
        if (reference.match(/^https?:\/\/|^ftp:\/\//)) {
          continue;
        }

        // Resolve reference relative to skill directory
        let resolvedPath;
        try {
          if (reference.startsWith('~')) {
            // Home directory reference - cannot validate scope
            resolvedPath = null; // Mark as external (cannot verify)
          } else if (reference.startsWith('/')) {
            // Absolute path
            resolvedPath = reference;
          } else if (reference.startsWith('..')) {
            // Relative path with parent traversal
            resolvedPath = path.resolve(skillPath, reference);
          } else {
            // Relative path within skill dir
            resolvedPath = path.resolve(skillPath, reference);
          }

          // Check if resolved path is within skill directory
          if (resolvedPath) {
            const normalizedSkillPath = path.normalize(skillPath);
            const normalizedResolved = path.normalize(resolvedPath);

            // If path is within skill directory, skip it
            if (normalizedResolved.startsWith(normalizedSkillPath)) {
              continue;
            }
          }

          // External reference detected
          references.push({
            file: 'SKILL.md',
            line: lineIndex + 1,
            reference: reference,
            type: type,
            severity: severity
          });

        } catch (error) {
          // If path resolution fails, treat as potential external reference
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
 * Parse a single skill directory
 * @param {string} skillPath - Absolute path to skill directory
 * @param {string} scope - 'project' or 'user'
 * @returns {Promise<Object|null>} Parsed skill object or null on error
 */
async function parseSkill(skillPath, scope = 'project') {
  try {
    // 1. Verify skillPath is a directory
    const stats = await fs.stat(skillPath);
    if (!stats.isDirectory()) {
      return null;
    }

    // 2. Read SKILL.md from the skill directory
    const skillMdPath = path.join(skillPath, 'SKILL.md');
    let content;
    let parsed;
    let parseError = null;

    try {
      content = await fs.readFile(skillMdPath, 'utf-8');
    } catch (error) {
      // SKILL.md doesn't exist or cannot be read
      console.warn(`Skill directory ${skillPath} is missing SKILL.md`);
      return {
        name: path.basename(skillPath),
        description: 'Missing SKILL.md file',
        allowedTools: [],
        content: '',
        directoryPath: skillPath,
        scope: scope,
        hasError: true,
        parseError: 'Missing SKILL.md file',
        subdirectories: [],
        fileCount: 0,
        files: [],
        externalReferences: []
      };
    }

    // 3. Parse YAML frontmatter
    try {
      parsed = matter(content);
    } catch (yamlError) {
      console.warn(`YAML parsing error in ${skillMdPath}:`, yamlError.message);
      parseError = yamlError.message;

      return {
        name: path.basename(skillPath),
        description: 'Error parsing YAML frontmatter',
        allowedTools: [],
        content: content,
        directoryPath: skillPath,
        scope: scope,
        hasError: true,
        parseError: parseError,
        subdirectories: [],
        fileCount: 0,
        files: [],
        externalReferences: []
      };
    }

    // 4. Extract frontmatter fields
    const { data, content: markdownContent } = parsed;

    // Extract name from frontmatter or directory name
    const name = data.name || path.basename(skillPath);

    // Extract description
    const description = data.description || '';

    // Extract allowed-tools (skills use 'allowed-tools' like commands)
    let allowedTools = [];
    if (data['allowed-tools']) {
      if (typeof data['allowed-tools'] === 'string') {
        allowedTools = data['allowed-tools'].split(',').map(t => t.trim()).filter(Boolean);
      } else if (Array.isArray(data['allowed-tools'])) {
        allowedTools = data['allowed-tools'];
      }
    }

    // 5. Count subdirectories and files in skill directory
    const entries = await fs.readdir(skillPath, { withFileTypes: true });
    const subdirectories = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);

    // Count all files recursively
    const fileCount = await countFilesRecursive(skillPath);

    // Get full file list with relative paths (for tree view)
    const files = await getFilesRecursive(skillPath, skillPath);

    // 6. Detect external references in SKILL.md content
    const externalReferences = detectExternalReferences(skillPath, content);

    // 7. Return parsed skill object
    return {
      name: name,
      description: description,
      allowedTools: allowedTools,
      content: markdownContent.trim(),
      directoryPath: skillPath,
      scope: scope,
      hasError: false,
      parseError: null,
      subdirectories: subdirectories,
      fileCount: fileCount,
      files: files,
      externalReferences: externalReferences
    };

  } catch (error) {
    console.error(`Error parsing skill ${skillPath}:`, error.message);
    return null;
  }
}

/**
 * Recursively count files in a directory
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
 * Recursively get all files in a directory with relative paths
 * Returns a tree-like structure for JSTree-style display
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
 * Parse all skill directories in a skills directory
 * @param {string} skillsDir - Absolute path to skills directory (.claude/skills/)
 * @param {string} scope - 'project' or 'user'
 * @returns {Promise<Array>} Array of parsed skill objects
 */
async function parseAllSkills(skillsDir, scope = 'project') {
  try {
    // Check if directory exists
    try {
      await fs.access(skillsDir);
    } catch {
      return []; // Directory doesn't exist, return empty array
    }

    // Read subdirectories in skills directory
    const entries = await fs.readdir(skillsDir, { withFileTypes: true });
    const skillDirs = entries
      .filter(entry => entry.isDirectory())
      .map(entry => path.join(skillsDir, entry.name));

    // Parse each skill directory
    const skills = await Promise.all(
      skillDirs.map(skillDir => parseSkill(skillDir, scope))
    );

    // Filter out null results (failed parses)
    return skills.filter(skill => skill !== null);

  } catch (error) {
    console.error(`Error reading skills directory ${skillsDir}:`, error.message);
    return [];
  }
}

/**
 * Get both project and user skills
 * @param {string} projectPath - Absolute path to project root
 * @param {string} userHomePath - Absolute path to user home directory
 * @returns {Promise<Object>} Object with projectSkills and userSkills arrays
 */
async function getAllSkills(projectPath, userHomePath) {
  const projectSkillsPath = config.paths.getProjectSkillsDir(projectPath);
  const userSkillsPath = config.paths.getUserSkillsDir();

  const [projectSkills, userSkills] = await Promise.all([
    parseAllSkills(projectSkillsPath, 'project'),
    parseAllSkills(userSkillsPath, 'user')
  ]);

  return {
    projectSkills: projectSkills,
    userSkills: userSkills
  };
}

module.exports = {
  parseSkill,
  parseAllSkills,
  getAllSkills,
  detectExternalReferences
};
