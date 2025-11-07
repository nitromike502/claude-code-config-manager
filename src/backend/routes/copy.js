const express = require('express');
const router = express.Router();

/**
 * Copy API Routes
 *
 * This router handles all copy operations for configuration items:
 * - POST /api/copy/agent - Copy subagent
 * - POST /api/copy/command - Copy slash command
 * - POST /api/copy/hook - Copy hook
 * - POST /api/copy/mcp - Copy MCP server
 *
 * Each endpoint delegates to a specialized handler that:
 * 1. Validates request parameters
 * 2. Calls copy-service methods
 * 3. Returns standardized response format
 *
 * Architecture:
 * - Modular design with separate handler files per endpoint
 * - Shared validation middleware in ./copy/validation.js
 * - All routes use POST method with JSON body
 *
 * Request Body Format:
 * {
 *   sourcePath: string,          // Absolute path to source config
 *   targetScope: 'user'|'project', // Target scope
 *   targetProjectId?: string,    // Required if targetScope is 'project'
 *   conflictStrategy?: 'skip'|'overwrite'|'rename' // Default: 'skip'
 * }
 */

// Import endpoint handlers
const agentHandler = require('./copy/agent');
const commandHandler = require('./copy/command');
const hookHandler = require('./copy/hook');
const mcpHandler = require('./copy/mcp');

// Register routes
router.post('/agent', agentHandler);
router.post('/command', commandHandler);
router.post('/hook', hookHandler);
router.post('/mcp', mcpHandler);

module.exports = router;
