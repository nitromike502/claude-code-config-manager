/**
 * Parser Test Script
 * Tests all parsers with the current project's configuration files
 */

const parsers = require('./index');
const os = require('os');

async function testParsers() {
  console.log('=== Testing Claude Code Config Manager Parsers ===\n');

  const projectPath = '/home/claude/manager';
  const userHomePath = os.homedir();

  // Test 1: Project Discovery
  console.log('1. Testing Project Parser...');
  try {
    const projects = await parsers.parseProjects();
    console.log(`   Found ${projects.length} projects`);
    if (projects.length > 0) {
      console.log('   Sample project:', projects[0].name);
    }
  } catch (error) {
    console.error('   Error:', error.message);
  }

  // Test 2: Subagent Parser
  console.log('\n2. Testing Subagent Parser...');
  try {
    const agents = await parsers.parseAllSubagents(projectPath + '/.claude/agents', 'project');
    console.log(`   Found ${agents.length} subagents`);
    if (agents.length > 0) {
      console.log('   Sample subagent:', agents[0].name);
      console.log('   - Description:', agents[0].description.substring(0, 60) + '...');
      console.log('   - Tools:', agents[0].tools.join(', '));
      console.log('   - Model:', agents[0].model);
    }
  } catch (error) {
    console.error('   Error:', error.message);
  }

  // Test 3: Command Parser
  console.log('\n3. Testing Command Parser...');
  try {
    const commands = await parsers.parseAllCommands(projectPath + '/.claude/commands', 'project');
    console.log(`   Found ${commands.length} commands`);
    if (commands.length > 0) {
      console.log('   Sample command:', commands[0].name);
      console.log('   - Namespace:', commands[0].namespace || '(root)');
      console.log('   - Description:', commands[0].description.substring(0, 60) + '...');
    }
  } catch (error) {
    console.error('   Error:', error.message);
  }

  // Test 4: Hook Parser
  console.log('\n4. Testing Hook Parser...');
  try {
    const hooks = await parsers.parseProjectHooks(projectPath);
    console.log(`   Found ${hooks.length} hooks`);
    if (hooks.length > 0) {
      console.log('   Sample hook:', hooks[0].event);
      console.log('   - Command:', hooks[0].command);
      console.log('   - Matcher:', hooks[0].matcher);
      console.log('   - Scope:', hooks[0].scope);
    }

    // Test grouping
    const grouped = parsers.groupHooksByEvent(hooks);
    console.log('   Hook events:', Object.keys(grouped).join(', '));
  } catch (error) {
    console.error('   Error:', error.message);
  }

  // Test 5: MCP Parser
  console.log('\n5. Testing MCP Parser...');
  try {
    const mcpServers = await parsers.parseProjectMcpServers(projectPath);
    console.log(`   Found ${mcpServers.length} MCP servers`);
    if (mcpServers.length > 0) {
      console.log('   Sample MCP server:', mcpServers[0].name);
      console.log('   - Command:', mcpServers[0].command);
      console.log('   - Transport:', mcpServers[0].transportType);
      console.log('   - Enabled:', mcpServers[0].enabled);
    }
  } catch (error) {
    console.error('   Error:', error.message);
  }

  // Test 6: Project Validation
  console.log('\n6. Testing Project Validation...');
  try {
    const isValid = await parsers.isValidClaudeProject(projectPath);
    console.log('   Is valid Claude project:', isValid);

    const counts = await parsers.getProjectConfigCounts(projectPath);
    console.log('   Configuration counts:');
    console.log('   - Agents:', counts.agents);
    console.log('   - Commands:', counts.commands);
    console.log('   - Hooks:', counts.hooks);
    console.log('   - MCP Servers:', counts.mcpServers);
  } catch (error) {
    console.error('   Error:', error.message);
  }

  // Test 7: All Parsers Combined
  console.log('\n7. Testing Combined Parsing...');
  try {
    const [agents, commands, hooks, mcpServers] = await Promise.all([
      parsers.getAllSubagents(projectPath, userHomePath),
      parsers.getAllCommands(projectPath, userHomePath),
      parsers.getAllHooks(projectPath, userHomePath),
      parsers.getAllMcpServers(projectPath, userHomePath)
    ]);

    console.log('   Combined results:');
    console.log('   - Project agents:', agents.project.length, '| User agents:', agents.user.length);
    console.log('   - Project commands:', commands.project.length, '| User commands:', commands.user.length);
    console.log('   - Project hooks:', hooks.project.length, '| User hooks:', hooks.user.length);
    console.log('   - Project MCP:', mcpServers.project.length, '| User MCP:', mcpServers.user.length);
  } catch (error) {
    console.error('   Error:', error.message);
  }

  console.log('\n=== Parser Testing Complete ===');
}

// Run tests
testParsers().catch(console.error);
