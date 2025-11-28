const express = require('express');
const router = express.Router();
const {
  getUserAgents,
  getUserCommands,
  getUserHooks,
  getUserMCP,
  getUserSkills
} = require('../services/projectDiscovery');

/**
 * GET /api/user/agents
 * Returns user-level subagents from ~/.claude/agents/
 */
router.get('/agents', async (req, res) => {
  try {
    const result = await getUserAgents();

    res.json({
      success: true,
      agents: result.agents,
      warnings: result.warnings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/user/commands
 * Returns user-level slash commands from ~/.claude/commands/
 */
router.get('/commands', async (req, res) => {
  try {
    const result = await getUserCommands();

    res.json({
      success: true,
      commands: result.commands,
      warnings: result.warnings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/user/hooks
 * Returns user-level hooks from ~/.claude/settings.json
 */
router.get('/hooks', async (req, res) => {
  try {
    const result = await getUserHooks();

    res.json({
      success: true,
      hooks: result.hooks,
      warnings: result.warnings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/user/mcp
 * Returns user-level MCP servers from ~/.claude/settings.json
 */
router.get('/mcp', async (req, res) => {
  try {
    const result = await getUserMCP();

    res.json({
      success: true,
      mcp: result.mcp,
      warnings: result.warnings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/user/skills
 * Returns user-level skills from ~/.claude/skills/
 */
router.get('/skills', async (req, res) => {
  try {
    const result = await getUserSkills();

    res.json({
      success: true,
      skills: result.skills,
      warnings: result.warnings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
