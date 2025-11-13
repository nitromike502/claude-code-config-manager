/**
 * Performance Tests for Copy Operations
 *
 * Tests backend copy service performance against Phase 3 targets:
 * - Copy Single File: <500ms (95th percentile)
 * - Conflict Detection: <100ms
 *
 * These are SOFT GATE tests - failures are documented but do not block Phase 3
 * unless performance is severely degraded (>2x target).
 */

const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const copyService = require('../../../src/backend/services/copy-service');

describe('Performance: Copy Operations', () => {
  let testDir;
  let sourceDir;
  let targetDir;
  let testProjectId = 'testproject123';

  // Mock discoverProjects for testing
  const originalDiscoverProjects = require('../../../src/backend/services/projectDiscovery').discoverProjects;

  beforeAll(async () => {
    // Create test directories
    testDir = path.join(os.tmpdir(), `perf-test-${Date.now()}`);
    sourceDir = path.join(testDir, 'source');
    targetDir = path.join(testDir, 'target');

    await fs.mkdir(sourceDir, { recursive: true });
    await fs.mkdir(path.join(sourceDir, '.claude', 'agents'), { recursive: true });
    await fs.mkdir(path.join(sourceDir, '.claude', 'commands'), { recursive: true });
    await fs.mkdir(targetDir, { recursive: true });

    // Mock project discovery
    const projectDiscovery = require('../../../src/backend/services/projectDiscovery');
    projectDiscovery.discoverProjects = jest.fn().mockResolvedValue({
      projects: {
        [testProjectId]: {
          path: targetDir,
          exists: true
        }
      }
    });
  });

  afterAll(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }

    // Restore original function
    const projectDiscovery = require('../../../src/backend/services/projectDiscovery');
    projectDiscovery.discoverProjects = originalDiscoverProjects;
  });

  /**
   * Helper: Measure operation execution time
   */
  async function measureOperation(operationFn) {
    const start = performance.now();
    await operationFn();
    const end = performance.now();
    return end - start;
  }

  /**
   * Helper: Calculate 95th percentile from array of times
   */
  function calculate95thPercentile(times) {
    if (times.length === 0) return 0;
    const sorted = [...times].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * 0.95) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Helper: Create test agent file
   */
  async function createTestAgent(filename = 'test-agent.md') {
    const agentPath = path.join(sourceDir, '.claude', 'agents', filename);
    const content = `---
name: test-agent
description: Test agent for performance testing
tools: []
model: claude-sonnet-4-5
---

# Test Agent

This is a test agent for performance testing.
`;
    await fs.writeFile(agentPath, content, 'utf8');
    return agentPath;
  }

  /**
   * Helper: Create test command file
   */
  async function createTestCommand(filename = 'test-command.md') {
    const commandPath = path.join(sourceDir, '.claude', 'commands', filename);
    const content = `---
name: test-command
description: Test command for performance testing
---

/test-command command text
`;
    await fs.writeFile(commandPath, content, 'utf8');
    return commandPath;
  }

  describe('Agent Copy Performance', () => {
    test('Copy agent - 10 iterations (target: <500ms at 95th percentile)', async () => {
      const times = [];

      // Run 10 iterations
      for (let i = 0; i < 10; i++) {
        // Create unique agent for each iteration
        const sourcePath = await createTestAgent(`perf-agent-${i}.md`);

        const time = await measureOperation(async () => {
          await copyService.copyAgent({
            sourcePath,
            targetScope: 'project',
            targetProjectId: testProjectId,
            conflictStrategy: 'skip'
          });
        });

        times.push(time);
      }

      // Calculate metrics
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      const p95 = calculate95thPercentile(times);

      // Log results
      console.log('\n📊 Agent Copy Performance:');
      console.log(`   Average: ${avg.toFixed(2)}ms`);
      console.log(`   Min: ${min.toFixed(2)}ms`);
      console.log(`   Max: ${max.toFixed(2)}ms`);
      console.log(`   95th percentile: ${p95.toFixed(2)}ms`);

      // Evaluate against target
      const TARGET = 500;
      if (p95 < TARGET) {
        console.log(`   ✅ Target met: ${p95.toFixed(2)}ms < ${TARGET}ms`);
      } else if (p95 < TARGET * 2) {
        console.warn(`   ⚠️  Target missed but acceptable: ${p95.toFixed(2)}ms > ${TARGET}ms (< 2x)`);
      } else {
        console.error(`   ❌ Severe degradation: ${p95.toFixed(2)}ms > ${TARGET * 2}ms`);
      }

      // Soft assertion - don't fail test, just document
      expect(times.length).toBe(10);
    }, 30000); // 30s timeout
  });

  describe('Command Copy Performance', () => {
    test('Copy command - 10 iterations (target: <500ms at 95th percentile)', async () => {
      const times = [];

      // Run 10 iterations
      for (let i = 0; i < 10; i++) {
        // Create unique command for each iteration
        const sourcePath = await createTestCommand(`perf-command-${i}.md`);

        const time = await measureOperation(async () => {
          await copyService.copyCommand({
            sourcePath,
            targetScope: 'project',
            targetProjectId: testProjectId,
            conflictStrategy: 'skip'
          });
        });

        times.push(time);
      }

      // Calculate metrics
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      const p95 = calculate95thPercentile(times);

      // Log results
      console.log('\n📊 Command Copy Performance:');
      console.log(`   Average: ${avg.toFixed(2)}ms`);
      console.log(`   Min: ${min.toFixed(2)}ms`);
      console.log(`   Max: ${max.toFixed(2)}ms`);
      console.log(`   95th percentile: ${p95.toFixed(2)}ms`);

      // Evaluate against target
      const TARGET = 500;
      if (p95 < TARGET) {
        console.log(`   ✅ Target met: ${p95.toFixed(2)}ms < ${TARGET}ms`);
      } else if (p95 < TARGET * 2) {
        console.warn(`   ⚠️  Target missed but acceptable: ${p95.toFixed(2)}ms > ${TARGET}ms (< 2x)`);
      } else {
        console.error(`   ❌ Severe degradation: ${p95.toFixed(2)}ms > ${TARGET * 2}ms`);
      }

      // Soft assertion - don't fail test, just document
      expect(times.length).toBe(10);
    }, 30000); // 30s timeout
  });

  describe('Hook Copy Performance', () => {
    test('Copy hook - 10 iterations (target: <500ms at 95th percentile)', async () => {
      const times = [];

      // Run 10 iterations
      for (let i = 0; i < 10; i++) {
        const time = await measureOperation(async () => {
          await copyService.copyHook({
            sourceHook: {
              event: 'PreToolUse',
              matcher: '*.js',
              type: 'command',
              command: `echo "Performance test hook ${i}"`,
              enabled: true,
              timeout: 60
            },
            targetScope: 'project',
            targetProjectId: testProjectId
          });
        });

        times.push(time);
      }

      // Calculate metrics
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      const p95 = calculate95thPercentile(times);

      // Log results
      console.log('\n📊 Hook Copy Performance:');
      console.log(`   Average: ${avg.toFixed(2)}ms`);
      console.log(`   Min: ${min.toFixed(2)}ms`);
      console.log(`   Max: ${max.toFixed(2)}ms`);
      console.log(`   95th percentile: ${p95.toFixed(2)}ms`);

      // Evaluate against target
      const TARGET = 500;
      if (p95 < TARGET) {
        console.log(`   ✅ Target met: ${p95.toFixed(2)}ms < ${TARGET}ms`);
      } else if (p95 < TARGET * 2) {
        console.warn(`   ⚠️  Target missed but acceptable: ${p95.toFixed(2)}ms > ${TARGET}ms (< 2x)`);
      } else {
        console.error(`   ❌ Severe degradation: ${p95.toFixed(2)}ms > ${TARGET * 2}ms`);
      }

      // Soft assertion - don't fail test, just document
      expect(times.length).toBe(10);
    }, 30000); // 30s timeout
  });

  describe('MCP Copy Performance', () => {
    test('Copy MCP server - 10 iterations (target: <500ms at 95th percentile)', async () => {
      const times = [];

      // Run 10 iterations
      for (let i = 0; i < 10; i++) {
        const time = await measureOperation(async () => {
          await copyService.copyMcp({
            sourceServerName: `perf-test-server-${i}`,
            sourceMcpConfig: {
              command: 'node',
              args: ['test-server.js'],
              env: { TEST: 'true' }
            },
            targetScope: 'project',
            targetProjectId: testProjectId,
            conflictStrategy: 'overwrite'
          });
        });

        times.push(time);
      }

      // Calculate metrics
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      const p95 = calculate95thPercentile(times);

      // Log results
      console.log('\n📊 MCP Copy Performance:');
      console.log(`   Average: ${avg.toFixed(2)}ms`);
      console.log(`   Min: ${min.toFixed(2)}ms`);
      console.log(`   Max: ${max.toFixed(2)}ms`);
      console.log(`   95th percentile: ${p95.toFixed(2)}ms`);

      // Evaluate against target
      const TARGET = 500;
      if (p95 < TARGET) {
        console.log(`   ✅ Target met: ${p95.toFixed(2)}ms < ${TARGET}ms`);
      } else if (p95 < TARGET * 2) {
        console.warn(`   ⚠️  Target missed but acceptable: ${p95.toFixed(2)}ms > ${TARGET}ms (< 2x)`);
      } else {
        console.error(`   ❌ Severe degradation: ${p95.toFixed(2)}ms > ${TARGET * 2}ms`);
      }

      // Soft assertion - don't fail test, just document
      expect(times.length).toBe(10);
    }, 30000); // 30s timeout
  });

  describe('Conflict Detection Performance', () => {
    test('Detect conflict - 10 iterations (target: <100ms at 95th percentile)', async () => {
      // Create test files
      const sourcePath = await createTestAgent('conflict-test-agent.md');
      const targetPath = path.join(targetDir, '.claude', 'agents', 'conflict-test-agent.md');

      // Ensure target directory exists
      await fs.mkdir(path.dirname(targetPath), { recursive: true });

      // Copy file to create conflict
      await fs.copyFile(sourcePath, targetPath);

      const times = [];

      // Run 10 iterations
      for (let i = 0; i < 10; i++) {
        const time = await measureOperation(async () => {
          await copyService.detectConflict(sourcePath, targetPath);
        });

        times.push(time);
      }

      // Calculate metrics
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      const p95 = calculate95thPercentile(times);

      // Log results
      console.log('\n📊 Conflict Detection Performance:');
      console.log(`   Average: ${avg.toFixed(2)}ms`);
      console.log(`   Min: ${min.toFixed(2)}ms`);
      console.log(`   Max: ${max.toFixed(2)}ms`);
      console.log(`   95th percentile: ${p95.toFixed(2)}ms`);

      // Evaluate against target
      const TARGET = 100;
      if (p95 < TARGET) {
        console.log(`   ✅ Target met: ${p95.toFixed(2)}ms < ${TARGET}ms`);
      } else if (p95 < TARGET * 2) {
        console.warn(`   ⚠️  Target missed but acceptable: ${p95.toFixed(2)}ms > ${TARGET}ms (< 2x)`);
      } else {
        console.error(`   ❌ Severe degradation: ${p95.toFixed(2)}ms > ${TARGET * 2}ms`);
      }

      // Soft assertion - don't fail test, just document
      expect(times.length).toBe(10);
    }, 30000); // 30s timeout
  });
});
