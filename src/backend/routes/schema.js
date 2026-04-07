/**
 * Schema API Routes
 *
 * Serves configuration schema data for the frontend.
 * Endpoints provide hook events, settings keys, and frontmatter field definitions.
 */

const express = require('express');
const router = express.Router();
const schemaService = require('../services/schemaService');

/**
 * GET /api/schema/hooks
 * Returns hook events, types, and field definitions from the official schema
 */
router.get('/hooks', (req, res) => {
  try {
    const hookSchema = schemaService.getHookSchema();
    res.json({
      success: true,
      data: hookSchema
    });
  } catch (error) {
    console.error('Error fetching hook schema:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hook schema',
      details: error.message
    });
  }
});

/**
 * GET /api/schema/settings
 * Returns all settings keys and their metadata from the official schema
 */
router.get('/settings', (req, res) => {
  try {
    const settings = schemaService.getSettingsKeys();
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings schema:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings schema',
      details: error.message
    });
  }
});

/**
 * GET /api/schema/agents
 * Returns agent frontmatter field definitions from our schema
 */
router.get('/agents', (req, res) => {
  try {
    const fields = schemaService.getFrontmatterFields('agent');
    const schema = schemaService.getFrontmatterSchema('agent');
    res.json({
      success: true,
      data: {
        fields,
        schema
      }
    });
  } catch (error) {
    console.error('Error fetching agent schema:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent schema',
      details: error.message
    });
  }
});

/**
 * GET /api/schema/skills
 * Returns skill frontmatter field definitions from our schema
 */
router.get('/skills', (req, res) => {
  try {
    const fields = schemaService.getFrontmatterFields('skill');
    const schema = schemaService.getFrontmatterSchema('skill');
    res.json({
      success: true,
      data: {
        fields,
        schema
      }
    });
  } catch (error) {
    console.error('Error fetching skill schema:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch skill schema',
      details: error.message
    });
  }
});

/**
 * GET /api/schema/rules
 * Returns rule frontmatter field definitions from our schema
 */
router.get('/rules', (req, res) => {
  try {
    const fields = schemaService.getFrontmatterFields('rule');
    const schema = schemaService.getFrontmatterSchema('rule');
    res.json({
      success: true,
      data: {
        fields,
        schema
      }
    });
  } catch (error) {
    console.error('Error fetching rule schema:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rule schema',
      details: error.message
    });
  }
});

/**
 * POST /api/schema/refresh
 * Force re-fetch of the official schema
 */
router.post('/refresh', async (req, res) => {
  try {
    const result = await schemaService.refresh();
    res.json({
      success: result.success,
      message: result.message,
      cacheStatus: schemaService.getCacheStatus()
    });
  } catch (error) {
    console.error('Error refreshing schema:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh schema',
      details: error.message
    });
  }
});

/**
 * GET /api/schema/status
 * Returns cache status information
 */
router.get('/status', (req, res) => {
  try {
    res.json({
      success: true,
      data: schemaService.getCacheStatus()
    });
  } catch (error) {
    console.error('Error fetching schema status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schema status',
      details: error.message
    });
  }
});

module.exports = router;
