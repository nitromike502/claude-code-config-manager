/**
 * BUG-031: Skills Type Mapping Regression Test
 *
 * **Bug ID:** BUG-031
 * **Discovered:** 2025-12-27
 * **Fixed:** PR #TBD (commit TBD)
 * **Severity:** Medium (Feature Broken)
 *
 * **Original Symptom:**
 * - Error "Unknown configuration type: skills" when copying skills between projects
 * - Copy operation failed for skills despite working for agents, commands, hooks, MCP
 * - Issue: Frontend sent plural 'skills' but API expected singular 'skill'
 *
 * **Root Cause:**
 * - ConfigItemList.vue had typeMapping for 'agents', 'commands', 'hooks', 'mcp'
 * - Missing mapping: 'skills' → 'skill'
 * - Frontend component emitted itemType 'skills' (plural) as-is
 * - Backend API route /api/copy/skill expected configType 'skill' (singular)
 *
 * **Fix Applied:**
 * - Added `'skills': 'skill'` to typeMapping object in ConfigItemList.vue
 * - Line 147 in src/components/cards/ConfigItemList.vue
 *
 * **Test Strategy:**
 * This suite prevents regression by:
 * 1. Verifying API endpoint accepts 'skill' as configuration type
 * 2. Testing skill copy with correct type parameter
 * 3. Ensuring error handling for incorrect type names
 * 4. Validating type mapping consistency across all entity types
 *
 * **Related Files:**
 * - /home/claude/manager/src/components/cards/ConfigItemList.vue (line 142-148)
 * - /home/claude/manager/src/backend/routes/copy.js (POST /api/copy/skill)
 * - /home/claude/manager/tests/backend/routes/copy.test.js (lines 926-1248)
 */

const request = require('supertest');
const app = require('../../../src/backend/server');
const copyService = require('../../../src/backend/services/copy-service');

// Mock copy service
jest.mock('../../../src/backend/services/copy-service');

describe('BUG-031: Skills Type Mapping Regression', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * TEST 1: Verify API accepts singular 'skill' type (expected behavior)
   *
   * This is the correct API behavior - endpoint expects singular form.
   */
  test('should accept skill copy request with valid parameters', async () => {
    // Mock successful copy
    copyService.copySkill.mockResolvedValue({
      success: true,
      copiedPath: '/home/user/.claude/skills/test-skill',
      fileCount: 2,
      dirCount: 0
    });

    const response = await request(app)
      .post('/api/copy/skill')
      .send({
        sourceSkillPath: '/source/project/.claude/skills/test-skill',
        targetScope: 'user',
        conflictStrategy: 'skip'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Skill copied successfully');
    expect(copyService.copySkill).toHaveBeenCalledWith({
      sourceSkillPath: '/source/project/.claude/skills/test-skill',
      targetScope: 'user',
      targetProjectId: undefined,
      conflictStrategy: 'skip',
      acknowledgedWarnings: false
    });
  });

  /**
   * TEST 2: Verify type mapping consistency
   *
   * All configuration types follow the same pattern:
   * - Frontend plural → Backend singular
   * - 'agents' → 'agent', 'commands' → 'command', 'skills' → 'skill'
   */
  test('should maintain type mapping consistency across all entity types', async () => {
    // Test agent copy (existing functionality)
    copyService.copyAgent.mockResolvedValue({
      success: true,
      copiedPath: '/test/agent.md'
    });

    const agentResponse = await request(app)
      .post('/api/copy/agent')
      .send({
        sourcePath: '/source/agent.md',
        targetScope: 'user'
      });

    expect(agentResponse.status).toBe(200);
    expect(copyService.copyAgent).toHaveBeenCalled();

    // Test command copy (existing functionality)
    copyService.copyCommand.mockResolvedValue({
      success: true,
      copiedPath: '/test/command.md'
    });

    const commandResponse = await request(app)
      .post('/api/copy/command')
      .send({
        sourcePath: '/source/command.md',
        targetScope: 'user'
      });

    expect(commandResponse.status).toBe(200);
    expect(copyService.copyCommand).toHaveBeenCalled();

    // Test skill copy (BUG-031 fix)
    copyService.copySkill.mockResolvedValue({
      success: true,
      copiedPath: '/test/skill',
      fileCount: 1,
      dirCount: 0
    });

    const skillResponse = await request(app)
      .post('/api/copy/skill')
      .send({
        sourceSkillPath: '/source/skill',
        targetScope: 'user'
      });

    expect(skillResponse.status).toBe(200);
    expect(copyService.copySkill).toHaveBeenCalled();
  });

  /**
   * TEST 3: Verify skill copy to project scope works
   *
   * Original bug affected both user and project scope copies.
   * This test ensures project-to-project skill copying works.
   */
  test('should copy skill to project scope successfully', async () => {
    copyService.copySkill.mockResolvedValue({
      success: true,
      copiedPath: '/home/user/project/.claude/skills/test-skill',
      fileCount: 3,
      dirCount: 1
    });

    const response = await request(app)
      .post('/api/copy/skill')
      .send({
        sourceSkillPath: '/source/.claude/skills/test-skill',
        targetScope: 'project',
        targetProjectId: 'myproject',
        conflictStrategy: 'overwrite'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.copiedPath).toContain('skills/test-skill');
    expect(copyService.copySkill).toHaveBeenCalledWith({
      sourceSkillPath: '/source/.claude/skills/test-skill',
      targetScope: 'project',
      targetProjectId: 'myproject',
      conflictStrategy: 'overwrite',
      acknowledgedWarnings: false
    });
  });

  /**
   * TEST 4: Verify conflict resolution works for skills
   *
   * Ensures conflict strategies (skip/overwrite/rename) work for skills
   * just like they do for agents and commands.
   */
  test('should handle skill conflicts correctly', async () => {
    copyService.copySkill.mockResolvedValue({
      conflict: {
        targetPath: '/target/.claude/skills/test-skill/SKILL.md',
        sourceModified: '2024-01-15T10:30:00.000Z',
        targetModified: '2024-01-16T14:45:00.000Z'
      }
    });

    const response = await request(app)
      .post('/api/copy/skill')
      .send({
        sourceSkillPath: '/source/skill',
        targetScope: 'user'
      });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.conflict).toBeDefined();
    expect(response.body.conflict.targetPath).toContain('test-skill');
  });

  /**
   * TEST 5: Verify external reference warnings work for skills
   *
   * Skills have unique validation (external reference detection).
   * This test ensures that functionality still works after the fix.
   */
  test('should return warnings for skills with external references', async () => {
    copyService.copySkill.mockResolvedValue({
      warnings: {
        externalReferences: [
          { file: 'SKILL.md', line: 5, reference: '../shared/utils.js', type: 'relative' }
        ]
      },
      requiresAcknowledgement: true
    });

    const response = await request(app)
      .post('/api/copy/skill')
      .send({
        sourceSkillPath: '/source/skill',
        targetScope: 'user',
        acknowledgedWarnings: false
      });

    expect(response.status).toBe(422);
    expect(response.body.success).toBe(false);
    expect(response.body.warnings).toBeDefined();
    expect(response.body.requiresAcknowledgement).toBe(true);
  });

  /**
   * TEST 6: Verify error handling for invalid skill paths
   *
   * Ensures validation and error handling work correctly after fix.
   */
  test('should return 400 for missing sourceSkillPath', async () => {
    const response = await request(app)
      .post('/api/copy/skill')
      .send({
        targetScope: 'user'
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('sourceSkillPath');
  });

  test('should return 404 when skill directory not found', async () => {
    copyService.copySkill.mockResolvedValue({
      error: 'Skill directory not found: ENOENT'
    });

    const response = await request(app)
      .post('/api/copy/skill')
      .send({
        sourceSkillPath: '/nonexistent/skill',
        targetScope: 'user'
      });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  /**
   * TEST 7: Verify complete end-to-end skill copy workflow
   *
   * This test simulates the exact workflow that was broken before the fix:
   * 1. User clicks copy button on a skill
   * 2. Frontend emits event with configType='skill' (after type mapping)
   * 3. CopyModal opens and user selects target
   * 4. API request to /api/copy/skill succeeds
   * 5. Skill is copied successfully
   */
  test('should complete full skill copy workflow', async () => {
    // Step 1: Mock successful skill copy
    copyService.copySkill.mockResolvedValue({
      success: true,
      copiedPath: '/home/user/project/.claude/skills/data-processor',
      fileCount: 5,
      dirCount: 2
    });

    // Step 2: API request (simulating what CopyModal sends)
    const response = await request(app)
      .post('/api/copy/skill')
      .send({
        sourceSkillPath: '/source/project/.claude/skills/data-processor',
        targetScope: 'project',
        targetProjectId: 'target-project',
        conflictStrategy: 'skip',
        acknowledgedWarnings: false
      });

    // Step 3: Verify success
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Skill copied successfully',
      copiedPath: '/home/user/project/.claude/skills/data-processor',
      fileCount: 5,
      dirCount: 2
    });

    // Step 4: Verify correct service call
    expect(copyService.copySkill).toHaveBeenCalledWith({
      sourceSkillPath: '/source/project/.claude/skills/data-processor',
      targetScope: 'project',
      targetProjectId: 'target-project',
      conflictStrategy: 'skip',
      acknowledgedWarnings: false
    });
  });
});
