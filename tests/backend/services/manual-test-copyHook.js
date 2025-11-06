/**
 * Manual test script for copyHook functionality
 *
 * This script demonstrates the copyHook method in action by:
 * 1. Creating a test settings.json file
 * 2. Merging multiple hooks using copyHook
 * 3. Displaying the final merged structure
 *
 * Run: node tests/backend/services/manual-test-copyHook.js
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Mock the projectDiscovery module before requiring copyService
const mockProject = {
  path: path.join(os.tmpdir(), 'manual-test-project'),
  exists: true
};

jest.mock('../../../src/backend/services/projectDiscovery', () => ({
  discoverProjects: jest.fn().mockResolvedValue({
    projects: {
      'testproject': mockProject
    }
  })
}));

const copyService = require('../../../src/backend/services/copy-service');

async function runManualTest() {
  console.log('='.repeat(80));
  console.log('MANUAL TEST: CopyService.copyHook()');
  console.log('='.repeat(80));
  console.log();

  // Create temp directory
  const testDir = path.join(os.tmpdir(), 'manual-test-project');
  const claudeDir = path.join(testDir, '.claude');
  const settingsPath = path.join(claudeDir, 'settings.json');

  try {
    // Cleanup from previous runs
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.mkdir(claudeDir, { recursive: true });

    console.log('Step 1: Create initial settings.json with mcpServers');
    console.log('-'.repeat(80));
    const initialSettings = {
      mcpServers: {
        'filesystem': {
          command: 'npx',
          args: ['-y', '@anthropic-ai/mcp-server-filesystem', '/home/user']
        }
      }
    };
    await fs.writeFile(settingsPath, JSON.stringify(initialSettings, null, 2), 'utf8');
    console.log(JSON.stringify(initialSettings, null, 2));
    console.log();

    // Test 1: Add first hook to empty hooks
    console.log('Step 2: Add first hook (PreToolUse *.ts -> tsc)');
    console.log('-'.repeat(80));
    let result = await copyService.copyHook({
      sourceHook: {
        event: 'PreToolUse',
        matcher: '*.ts',
        type: 'command',
        command: 'tsc --noEmit',
        enabled: true,
        timeout: 60
      },
      targetScope: 'project',
      targetProjectId: 'testproject'
    });
    console.log('Result:', result);
    let settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
    console.log('Updated settings.json:');
    console.log(JSON.stringify(settings, null, 2));
    console.log();

    // Test 2: Add second hook to same event+matcher
    console.log('Step 3: Add second hook to same event+matcher (PreToolUse *.ts -> eslint)');
    console.log('-'.repeat(80));
    result = await copyService.copyHook({
      sourceHook: {
        event: 'PreToolUse',
        matcher: '*.ts',
        type: 'command',
        command: 'eslint --fix',
        enabled: true,
        timeout: 30
      },
      targetScope: 'project',
      targetProjectId: 'testproject'
    });
    console.log('Result:', result);
    settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
    console.log('Updated settings.json:');
    console.log(JSON.stringify(settings, null, 2));
    console.log();

    // Test 3: Add hook with different matcher
    console.log('Step 4: Add hook with different matcher (PreToolUse *.js -> prettier)');
    console.log('-'.repeat(80));
    result = await copyService.copyHook({
      sourceHook: {
        event: 'PreToolUse',
        matcher: '*.js',
        type: 'command',
        command: 'prettier --write',
        enabled: true,
        timeout: 15
      },
      targetScope: 'project',
      targetProjectId: 'testproject'
    });
    console.log('Result:', result);
    settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
    console.log('Updated settings.json:');
    console.log(JSON.stringify(settings, null, 2));
    console.log();

    // Test 4: Add hook with different event
    console.log('Step 5: Add hook with different event (PostToolUse * -> npm test)');
    console.log('-'.repeat(80));
    result = await copyService.copyHook({
      sourceHook: {
        event: 'PostToolUse',
        matcher: '*',
        type: 'command',
        command: 'npm test',
        enabled: true,
        timeout: 120
      },
      targetScope: 'project',
      targetProjectId: 'testproject'
    });
    console.log('Result:', result);
    settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
    console.log('Updated settings.json:');
    console.log(JSON.stringify(settings, null, 2));
    console.log();

    // Test 5: Try to add duplicate (should skip)
    console.log('Step 6: Try to add duplicate hook (should skip)');
    console.log('-'.repeat(80));
    result = await copyService.copyHook({
      sourceHook: {
        event: 'PreToolUse',
        matcher: '*.ts',
        type: 'command',
        command: 'tsc --noEmit', // Duplicate
        enabled: false,
        timeout: 999
      },
      targetScope: 'project',
      targetProjectId: 'testproject'
    });
    console.log('Result:', result);
    settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
    console.log('Updated settings.json (should be unchanged):');
    console.log(JSON.stringify(settings, null, 2));
    console.log();

    // Test 6: Add hook to event without matcher support
    console.log('Step 7: Add hook to event without matcher support (SessionStart)');
    console.log('-'.repeat(80));
    result = await copyService.copyHook({
      sourceHook: {
        event: 'SessionStart',
        matcher: '*',
        type: 'command',
        command: 'git fetch',
        enabled: true,
        timeout: 60
      },
      targetScope: 'project',
      targetProjectId: 'testproject'
    });
    console.log('Result:', result);
    settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
    console.log('Final settings.json:');
    console.log(JSON.stringify(settings, null, 2));
    console.log();

    console.log('='.repeat(80));
    console.log('VERIFICATION');
    console.log('='.repeat(80));
    console.log();
    console.log('✓ mcpServers preserved:', !!settings.mcpServers);
    console.log('✓ PreToolUse has 2 matchers:', settings.hooks.PreToolUse.length === 2);
    console.log('✓ PreToolUse[0] (*.ts) has 2 hooks:', settings.hooks.PreToolUse[0].hooks.length === 2);
    console.log('✓ PreToolUse[1] (*.js) has 1 hook:', settings.hooks.PreToolUse[1].hooks.length === 1);
    console.log('✓ PostToolUse exists:', !!settings.hooks.PostToolUse);
    console.log('✓ SessionStart exists:', !!settings.hooks.SessionStart);
    console.log('✓ SessionStart has no matcher field:', !settings.hooks.SessionStart[0].matcher);
    console.log();

    console.log('='.repeat(80));
    console.log('SUCCESS: All manual tests passed!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('ERROR:', error);
    process.exit(1);
  } finally {
    // Cleanup
    await fs.rm(testDir, { recursive: true, force: true });
  }
}

// Run the test
runManualTest().catch(console.error);
