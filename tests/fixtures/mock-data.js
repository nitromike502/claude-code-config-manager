/**
 * Test Mock Data Fixtures
 *
 * Centralized mock data for all frontend tests
 * Provides consistent test data across component, E2E, and responsive tests
 *
 * Usage:
 * const { mockProjects, mockProjectDetails, setupMocks } = require('../fixtures/mock-data');
 *
 * In tests:
 * await setupMocks(page);
 */

const mockProjects = [
  {
    id: 'homeusertestproject',
    name: 'Test Project',
    path: '/home/user/test-project',
    stats: { agents: 3, commands: 5, skills: 0, hooks: 2, mcp: 1 }
  },
  {
    id: 'testproject',
    name: 'Test Project',
    path: '/test/project',
    stats: { agents: 0, commands: 0, skills: 0, hooks: 0, mcp: 0 }
  },
  {
    id: 'myproject',
    name: 'My Awesome Project',
    path: '/home/user/projects/awesome',
    stats: { agents: 2, commands: 3, skills: 0, hooks: 1, mcp: 0 }
  },
  {
    id: 'configproject',
    name: 'Configuration Project',
    path: '/home/user/config-project',
    stats: { agents: 5, commands: 12, skills: 0, hooks: 3, mcp: 2 }
  },
  {
    id: 'project1',
    name: 'Project 1',
    path: '/project/one',
    stats: { agents: 1, commands: 2, skills: 0, hooks: 1, mcp: 0 }
  },
  {
    id: 'project2',
    name: 'Project 2',
    path: '/project/two',
    stats: { agents: 3, commands: 5, skills: 0, hooks: 2, mcp: 1 }
  },
  {
    id: 'emptyproject',
    name: 'Empty Project',
    path: '/empty/project',
    stats: { agents: 0, commands: 0, skills: 0, hooks: 0, mcp: 0 }
  },
  {
    id: 'searchproject',
    name: 'Search Project',
    path: '/search/project',
    stats: { agents: 2, commands: 4, skills: 0, hooks: 1, mcp: 0 }
  },
  {
    id: 'integrityproject',
    name: 'Integrity Project',
    path: '/integrity/project',
    stats: { agents: 1, commands: 3, skills: 0, hooks: 0, mcp: 0 }
  },
  {
    id: 'iconproject',
    name: 'Icon Project',
    path: '/icon/project',
    stats: { agents: 4, commands: 8, skills: 0, hooks: 2, mcp: 1 }
  },
  {
    id: 'largeproject',
    name: 'Large Project',
    path: '/large/project',
    stats: { agents: 10, commands: 20, skills: 0, hooks: 5, mcp: 3 }
  },
  {
    id: 'responsiveproject',
    name: 'Responsive Project',
    path: '/responsive/project',
    stats: { agents: 2, commands: 4, skills: 0, hooks: 1, mcp: 0 }
  },
  {
    id: 'cleanproject',
    name: 'Clean Project',
    path: '/clean/project',
    stats: { agents: 1, commands: 2, skills: 0, hooks: 0, mcp: 0 }
  },
  {
    id: 'copyproject',
    name: 'Copy Project',
    path: '/copy/project',
    stats: { agents: 2, commands: 3, skills: 0, hooks: 1, mcp: 0 }
  },
  {
    id: 'retryproject',
    name: 'Retry Project',
    path: '/retry/project',
    stats: { agents: 0, commands: 0, skills: 0, hooks: 0, mcp: 0 }
  },
  {
    id: 'mobileproject',
    name: 'Mobile Project',
    path: '/mobile/project',
    stats: { agents: 2, commands: 3, skills: 0, hooks: 1, mcp: 1 }
  },
  {
    id: 'tabletproject',
    name: 'Tablet Project',
    path: '/tablet/project',
    stats: { agents: 3, commands: 5, skills: 0, hooks: 2, mcp: 1 }
  },
  {
    id: 'desktopproject',
    name: 'Desktop Project',
    path: '/desktop/project',
    stats: { agents: 4, commands: 6, skills: 0, hooks: 2, mcp: 2 }
  },
  {
    id: 'statsproject',
    name: 'Stats Project',
    path: '/stats/project',
    stats: { agents: 2, commands: 3, skills: 0, hooks: 1, mcp: 1 }
  },
  {
    id: 'consoletestproject',
    name: 'Console Test Project',
    path: '/console/test/project',
    stats: { agents: 2, commands: 3, skills: 0, hooks: 1, mcp: 1 }
  },
  {
    id: 'warningproject',
    name: 'Warning Project',
    path: '/warning/project',
    stats: { agents: 1, commands: 0, skills: 0, hooks: 0, mcp: 0 }
  },
  {
    id: 'extractedid',
    name: 'Extracted Project',
    path: '/extracted/id',
    stats: { agents: 0, commands: 0, skills: 0, hooks: 0, mcp: 0 }
  },
  {
    id: 'homeusermyprojectswithdashnumber123',
    name: 'Dash Project 123',
    path: '/home/user/my-projects-with-dash-number-123',
    stats: { agents: 1, commands: 2, skills: 0, hooks: 0, mcp: 0 }
  },
  {
    id: 'navtest',
    name: 'Nav Test Project',
    path: '/nav/test',
    stats: { agents: 1, commands: 1, skills: 0, hooks: 0, mcp: 0 }
  },
  {
    id: 'navtest2',
    name: 'Nav Test 2 Project',
    path: '/nav/test2',
    stats: { agents: 0, commands: 0, skills: 0, hooks: 0, mcp: 0 }
  },
  {
    id: 'themetest',
    name: 'Theme Test Project',
    path: '/theme/test',
    stats: { agents: 1, commands: 0, skills: 0, hooks: 0, mcp: 0 }
  },
  {
    id: '%2Fpersist%2Ftest',
    name: 'Persist Test',
    path: '/persist/test',
    stats: { agents: 0, commands: 0, skills: 0, hooks: 0, mcp: 0 }
  },
  {
    id: '%2Fload%2Ftest',
    name: 'Load Test',
    path: '/load/test',
    stats: { agents: 0, commands: 0, skills: 0, hooks: 0, mcp: 0 }
  },
  {
    id: '%2Ffull%2Fpath%2Fto%2Fproject',
    name: 'Full Path Project',
    path: '/full/path/to/project',
    stats: { agents: 2, commands: 4, skills: 0, hooks: 1, mcp: 0 }
  },
  {
    id: 'loadingproject',
    name: 'Loading Project',
    path: '/loading/project',
    stats: { agents: 0, commands: 0, skills: 0, hooks: 0, mcp: 0 }
  },
  {
    id: 'spinnerproject',
    name: 'Spinner Project',
    path: '/spinner/project',
    stats: { agents: 0, commands: 0, skills: 0, hooks: 0, mcp: 0 }
  },
  {
    id: 'anyproject',
    name: 'Any Project',
    path: '/any/project',
    stats: { agents: 1, commands: 1, skills: 0, hooks: 0, mcp: 0 }
  },
];

const mockProjectDetails = {
  homeusertestproject: {
    agents: [
      { id: 'agent1', name: 'Test Agent', description: 'Test agent for testing' }
    ],
    commands: [
      { id: 'cmd1', name: 'test-command', path: 'commands/test.md' }
    ],
    skills: [],
    hooks: [
      { id: 'hook1', name: 'pre-commit', condition: 'always' }
    ],
    mcp: [
      { id: 'mcp1', name: 'test-mcp', type: 'stdio' }
    ]
  },
  testproject: {
    agents: [],
    commands: [],
    skills: [],
    hooks: [],
    mcp: []
  },
  myproject: {
    agents: [
      { id: 'agent1', name: 'Agent A' },
      { id: 'agent2', name: 'Agent B' }
    ],
    commands: [
      { id: 'cmd1', name: 'build' },
      { id: 'cmd2', name: 'test' },
      { id: 'cmd3', name: 'deploy' }
    ],
    skills: [],
    hooks: [
      { id: 'hook1', name: 'pre-commit' }
    ],
    mcp: []
  },
  configproject: {
    agents: [
      { id: 'a1', name: 'Agent 1' },
      { id: 'a2', name: 'Agent 2' },
      { id: 'a3', name: 'Agent 3' },
      { id: 'a4', name: 'Agent 4' },
      { id: 'a5', name: 'Agent 5' }
    ],
    commands: Array.from({ length: 12 }, (_, i) => ({ id: `cmd${i+1}`, name: `Command ${i+1}` })),
    skills: [],
    hooks: [
      { id: 'h1', name: 'Hook 1' },
      { id: 'h2', name: 'Hook 2' },
      { id: 'h3', name: 'Hook 3' }
    ],
    mcp: [
      { id: 'm1', name: 'MCP 1' },
      { id: 'm2', name: 'MCP 2' }
    ]
  },
  emptyproject: {
    agents: [],
    commands: [],
    skills: [],
    hooks: [],
    mcp: []
  },
  retryproject: {
    agents: [],
    commands: [],
    skills: [],
    hooks: [],
    mcp: []
  },
  statsproject: {
    agents: [
      { id: 'agent1', name: 'Stats Agent 1' },
      { id: 'agent2', name: 'Stats Agent 2' }
    ],
    commands: [
      { id: 'cmd1', name: 'stats-command-1' },
      { id: 'cmd2', name: 'stats-command-2' },
      { id: 'cmd3', name: 'stats-command-3' }
    ],
    skills: [],
    hooks: [
      { id: 'hook1', name: 'stats-hook' }
    ],
    mcp: [
      { id: 'mcp1', name: 'stats-mcp-server' }
    ]
  },
  mobileproject: {
    agents: [
      { id: 'agent1', name: 'Mobile Agent 1' },
      { id: 'agent2', name: 'Mobile Agent 2' }
    ],
    commands: [
      { id: 'cmd1', name: 'mobile-cmd-1' },
      { id: 'cmd2', name: 'mobile-cmd-2' },
      { id: 'cmd3', name: 'mobile-cmd-3' }
    ],
    skills: [],
    hooks: [
      { id: 'hook1', name: 'mobile-hook' }
    ],
    mcp: [
      { id: 'mcp1', name: 'mobile-mcp' }
    ]
  },
  tabletproject: {
    agents: [
      { id: 'agent1', name: 'Tablet Agent 1' },
      { id: 'agent2', name: 'Tablet Agent 2' },
      { id: 'agent3', name: 'Tablet Agent 3' }
    ],
    commands: [
      { id: 'cmd1', name: 'tablet-cmd-1' },
      { id: 'cmd2', name: 'tablet-cmd-2' },
      { id: 'cmd3', name: 'tablet-cmd-3' },
      { id: 'cmd4', name: 'tablet-cmd-4' },
      { id: 'cmd5', name: 'tablet-cmd-5' }
    ],
    skills: [],
    hooks: [
      { id: 'hook1', name: 'tablet-hook-1' },
      { id: 'hook2', name: 'tablet-hook-2' }
    ],
    mcp: [
      { id: 'mcp1', name: 'tablet-mcp' }
    ]
  },
  desktopproject: {
    agents: [
      { id: 'agent1', name: 'Desktop Agent 1' },
      { id: 'agent2', name: 'Desktop Agent 2' },
      { id: 'agent3', name: 'Desktop Agent 3' },
      { id: 'agent4', name: 'Desktop Agent 4' }
    ],
    commands: [
      { id: 'cmd1', name: 'desktop-cmd-1' },
      { id: 'cmd2', name: 'desktop-cmd-2' },
      { id: 'cmd3', name: 'desktop-cmd-3' },
      { id: 'cmd4', name: 'desktop-cmd-4' },
      { id: 'cmd5', name: 'desktop-cmd-5' },
      { id: 'cmd6', name: 'desktop-cmd-6' }
    ],
    skills: [],
    hooks: [
      { id: 'hook1', name: 'desktop-hook-1' },
      { id: 'hook2', name: 'desktop-hook-2' }
    ],
    mcp: [
      { id: 'mcp1', name: 'desktop-mcp-1' },
      { id: 'mcp2', name: 'desktop-mcp-2' }
    ]
  },
  consoletestproject: {
    agents: [
      { id: 'agent1', name: 'Console Agent 1' },
      { id: 'agent2', name: 'Console Agent 2' }
    ],
    commands: [
      { id: 'cmd1', name: 'console-cmd-1' },
      { id: 'cmd2', name: 'console-cmd-2' },
      { id: 'cmd3', name: 'console-cmd-3' }
    ],
    skills: [],
    hooks: [
      { id: 'hook1', name: 'console-hook' }
    ],
    mcp: [
      { id: 'mcp1', name: 'console-mcp-server' }
    ]
  },
  warningproject: {
    agents: [
      { id: 'agent1', name: 'Warning Agent', description: 'Agent with warnings', warnings: ['Warning 1: Could not parse agent file'] }
    ],
    commands: [],
    skills: [],
    hooks: [],
    mcp: []
  },
  navtest: {
    agents: [
      { id: 'agent1', name: 'Nav Agent 1' },
      { id: 'agent2', name: 'Nav Agent 2' }
    ],
    commands: [
      { id: 'cmd1', name: 'nav-cmd-1' },
      { id: 'cmd2', name: 'nav-cmd-2' },
      { id: 'cmd3', name: 'nav-cmd-3' }
    ],
    skills: [],
    hooks: [
      { id: 'hook1', name: 'nav-hook' }
    ],
    mcp: [
      { id: 'mcp1', name: 'nav-mcp' }
    ]
  },
  navtest2: {
    agents: [
      { id: 'agent1', name: 'Nav2 Agent 1' }
    ],
    commands: [
      { id: 'cmd1', name: 'nav2-cmd-1' },
      { id: 'cmd2', name: 'nav2-cmd-2' }
    ],
    skills: [],
    hooks: [],
    mcp: []
  },
  themetest: {
    agents: [
      { id: 'agent1', name: 'Theme Agent' }
    ],
    commands: [
      { id: 'cmd1', name: 'theme-cmd' }
    ],
    skills: [],
    hooks: [],
    mcp: []
  },
  anyproject: {
    agents: [
      { id: 'agent1', name: 'Any Agent' }
    ],
    commands: [
      { id: 'cmd1', name: 'any-cmd' }
    ],
    skills: [],
    hooks: [],
    mcp: []
  },
};

const mockUserConfig = {
  agents: [
    { id: 'user-agent', name: 'User Agent', description: 'Global agent' }
  ],
  commands: [
    { id: 'user-cmd', name: 'global-command' }
  ],
  skills: [],
  hooks: [
    { id: 'user-hook', name: 'global-hook' }
  ],
  mcp: [
    { id: 'user-mcp', name: 'global-mcp' }
  ]
};

/**
 * Setup all mock routes for a test
 * IMPORTANT: Call this BEFORE navigating to any page
 *
 * @param {Page} page - Playwright page object
 * @param {Object} options - Configuration options
 * @param {string} options.projectId - Specific project to mock (optional)
 * @param {Array} options.projects - Custom projects list (optional, defaults to mockProjects)
 */
async function setupMocks(page, options = {}) {
  const { projectId, projects = mockProjects } = options;

  // IMPORTANT: Set specific routes BEFORE generic wildcard routes
  // This prevents the wildcard from catching detail endpoint calls

  // 1. Mock user configuration endpoints (before projects)
  await page.route('**/api/user/agents', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, agents: mockUserConfig.agents })
    });
  });

  await page.route('**/api/user/commands', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, commands: mockUserConfig.commands })
    });
  });

  await page.route('**/api/user/hooks', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, hooks: mockUserConfig.hooks })
    });
  });

  await page.route('**/api/user/mcp', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, mcp: mockUserConfig.mcp })
    });
  });

  await page.route('**/api/user/skills', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, skills: mockUserConfig.skills })
    });
  });

  // 2. Mock specific project detail endpoints for each project
  for (const proj of projects) {
    const details = mockProjectDetails[proj.id] || {
      agents: [],
      commands: [],
      skills: [],
      hooks: [],
      mcp: []
    };

    // Mock agents endpoint for this project
    await page.route(`**/api/projects/${proj.id}/agents`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, agents: details.agents })
      });
    });

    // Mock commands endpoint for this project
    await page.route(`**/api/projects/${proj.id}/commands`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, commands: details.commands })
      });
    });

    // Mock hooks endpoint for this project
    await page.route(`**/api/projects/${proj.id}/hooks`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, hooks: details.hooks })
      });
    });

    // Mock MCP endpoint for this project
    await page.route(`**/api/projects/${proj.id}/mcp`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mcp: details.mcp })
      });
    });

    // Mock skills endpoint for this project
    await page.route(`**/api/projects/${proj.id}/skills`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, skills: details.skills || [] })
      });
    });
  }

  // 3. Mock projects list endpoint LAST (most general wildcard)
  await page.route('**/api/projects', (route) => {
    // Only intercept GET requests to avoid interfering with POSTs
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, projects })
      });
    } else {
      route.continue();
    }
  });
}

/**
 * Get a specific project by ID from fixtures
 */
function getProject(projectId) {
  return mockProjects.find(p => p.id === projectId);
}

/**
 * Get details for a specific project
 */
function getProjectDetails(projectId) {
  return mockProjectDetails[projectId] || {
    agents: [],
    commands: [],
    skills: [],
    hooks: [],
    mcp: []
  };
}

module.exports = {
  mockProjects,
  mockProjectDetails,
  mockUserConfig,
  setupMocks,
  getProject,
  getProjectDetails
};
