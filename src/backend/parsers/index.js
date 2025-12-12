/**
 * Parser Module Index
 * Exports all configuration file parsers for Claude Code Config Manager
 */

const subagentParser = require('./subagentParser');
const commandParser = require('./commandParser');
const hookParser = require('./hookParser');
const mcpParser = require('./mcpParser');
const projectParser = require('./projectParser');

module.exports = {
  // Subagent Parser
  parseSubagent: subagentParser.parseSubagent,
  parseAllSubagents: subagentParser.parseAllSubagents,
  getAllSubagents: subagentParser.getAllSubagents,

  // Command Parser
  parseCommand: commandParser.parseCommand,
  parseAllCommands: commandParser.parseAllCommands,
  getAllCommands: commandParser.getAllCommands,

  // Hook Parser
  parseHooksFromFile: hookParser.parseHooksFromFile,
  parseProjectHooks: hookParser.parseProjectHooks,
  parseUserHooks: hookParser.parseUserHooks,
  getAllHooks: hookParser.getAllHooks,
  groupHooksByEvent: hookParser.groupHooksByEvent,

  // MCP Parser
  parseMcpJson: mcpParser.parseMcpJson,
  parseMcpFromSettings: mcpParser.parseMcpFromSettings,
  parseProjectMcpServers: mcpParser.parseProjectMcpServers,
  parseUserMcpServers: mcpParser.parseUserMcpServers,
  getAllMcpServers: mcpParser.getAllMcpServers,
  filterMcpServersByStatus: mcpParser.filterMcpServersByStatus,

  // Project Parser
  getClaudeJsonPath: projectParser.getClaudeJsonPath,
  parseProjects: projectParser.parseProjects,
  generateProjectId: projectParser.generateProjectId,
  getProjectById: projectParser.getProjectById,
  getProjectByPath: projectParser.getProjectByPath,
  getProjectConfigCounts: projectParser.getProjectConfigCounts,
  getProjectsWithCounts: projectParser.getProjectsWithCounts,
  isValidClaudeProject: projectParser.isValidClaudeProject
};
