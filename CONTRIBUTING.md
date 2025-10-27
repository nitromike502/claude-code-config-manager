# Contributing to Claude Code Manager

Thank you for your interest in contributing! This guide provides essential information for contributors.

## Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd manager
npm install
./scripts/setup-git-hooks.sh  # Enforces feature branch workflow

# Development (requires 2 terminals)
npm run dev          # Terminal 1: Frontend (Vite dev server on :5173)
npm run dev:backend  # Terminal 2: Backend (Express API on :8420)
```

Open http://localhost:5173 to see the application.

---

## Tech Stack

### Frontend
- **Vite 7.1.10** - Build system with Hot Module Replacement (HMR)
- **Vue 3.5.22** - Single File Components (.vue files)
- **Vue Router 4.6.3** - Client-side routing
- **Pinia 3.0.3** - State management

### Backend
- **Node.js 18+** - JavaScript runtime
- **Express 4.18** - API server

### Testing
- **Jest 30.2.0** - Backend tests (270 tests)
- **Playwright 1.56.0** - Frontend tests (311 tests)

---

## Development Workflow

### 1. Feature Branch Workflow (Mandatory)

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes, test, commit frequently
git add <files>
git commit -m "type: description"
git push -u origin feature/your-feature-name

# Create PR when ready
gh pr create --title "..." --body "..."
```

**Rules:**
- All work must be on feature branches
- Direct commits to main are blocked by pre-push hook
- One commit per completed task (15-30 min work)
- Test immediately after each change

### 2. Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <brief description>

[optional body]
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Adding or updating tests
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks
- `style:` - Code style/formatting changes

**Examples:**
```
feat: add project discovery service
fix: resolve sidebar scrolling issue
docs: update API endpoint documentation
test: add [Test 06] sidebar interaction tests
```

### 3. Testing

**Run tests before creating PR:**
```bash
npm test                    # Run all tests (backend + frontend)
npm run test:backend        # Jest tests only
npm run test:frontend       # Playwright tests only
```

**All tests must pass (100% pass rate required).**

### 4. Code Review

- Address all reviewer feedback
- Keep PRs focused (one feature/fix per PR)
- Update documentation for new features
- Ensure tests still pass after changes

---

## Project Structure

```
manager/
├── src/
│   ├── backend/              # Express API server
│   │   ├── routes/          # API route handlers
│   │   ├── services/        # Business logic
│   │   └── parsers/         # File parsing utilities
│   ├── components/           # Vue Single File Components
│   ├── stores/              # Pinia state stores
│   ├── api/                 # API client
│   └── main.js              # Vue app entry point
├── tests/
│   ├── backend/             # Jest backend tests
│   ├── frontend/            # Playwright component tests
│   ├── e2e/                 # Playwright E2E tests
│   └── fixtures/            # Shared test fixtures
├── docs/                     # All project documentation
│   ├── prd/                 # Phase requirement documents
│   ├── testing/             # Test documentation
│   ├── wireframes/          # UI/UX specifications
│   └── tickets/             # Work item tracking
└── .claude/                  # Claude Code configuration
    ├── agents/              # Specialized subagents
    └── commands/            # Custom slash commands
```

---

## Coding Standards

### Vue Components (Single File Components)

```vue
<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update', 'close'])
</script>

<template>
  <div class="component-name">
    <h3>{{ data.title }}</h3>
  </div>
</template>

<style scoped>
.component-name {
  padding: var(--spacing-md);
  background: var(--bg-card);
}
</style>
```

**Guidelines:**
- Use `<script setup>` syntax (Composition API)
- Props and emits should be typed
- Use CSS custom properties for colors/spacing
- Keep components focused (single responsibility)

### JavaScript/Node.js

```javascript
// Use modern ES6+ features
const projectData = await getProjectAgents(projectPath)
const agentNames = projectData.agents.map(a => a.name)

// Error handling with try/catch
try {
  const data = await fetchData()
  return { success: true, data }
} catch (error) {
  return { success: false, error: error.message }
}
```

**Guidelines:**
- ES6+ features (const/let, arrow functions, async/await)
- 2-space indentation
- Descriptive variable names
- Handle errors gracefully

### CSS

```css
/* Use CSS custom properties */
.project-card {
  padding: var(--spacing-md);
  background: var(--bg-card);
  border-radius: var(--border-radius);
  color: var(--text-primary);
}

/* Responsive design */
@media (max-width: 768px) {
  .project-card {
    padding: var(--spacing-sm);
  }
}
```

**Guidelines:**
- Use CSS variables defined in `/src/styles/variables.css`
- Mobile-first responsive design
- BEM-style naming for component classes
- Avoid `!important` unless necessary

---

## Testing Guidelines

### Backend Tests (Jest)

```javascript
describe('GET /api/projects/:projectId/agents', () => {
  it('should return agents for valid project', async () => {
    const response = await request(app)
      .get('/api/projects/testproject/agents')
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(Array.isArray(response.body.data)).toBe(true)
  })
})
```

### Frontend Tests (Playwright)

```javascript
test('should display project list on dashboard', async ({ page }) => {
  await page.goto('http://localhost:5173')
  await expect(page.locator('.project-card')).toHaveCount(3)
  await expect(page.locator('.project-card').first()).toContainText('Test Project')
})
```

**Test Checklist:**
- [ ] All new features have tests
- [ ] Tests pass locally before pushing
- [ ] Test edge cases and error scenarios
- [ ] Use fixtures for consistent test data

---

## Development Strategies

This project uses three proven development strategies:

### 1. Development Approved
**When:** Complex features, architectural decisions, multiple approaches exist
**Pattern:** Propose → Approve → Implement
**Benefit:** Prevents rework by getting approval first

### 2. Rapid Iteration
**When:** Simple changes, obvious fixes, established patterns
**Pattern:** Implement → Test → Commit
**Benefit:** Fast execution with minimal overhead

### 3. Parallel Execution
**When:** 4+ independent tasks, no dependencies, no file conflicts
**Pattern:** Plan → Launch All → Validate
**Benefit:** 50-87% time savings vs sequential

Select strategy at session start:
```bash
/dev-strategy approved   # For complex features
/dev-strategy rapid      # For straightforward changes
/dev-strategy parallel   # For independent tasks
```

**Reference:** See `.claude/templates/development-strategies.md` for detailed guidance.

---

## Documentation

### Update Documentation When:
- Adding new API endpoints → Update `docs/API.md`
- Adding new features → Update relevant PRD
- Changing architecture → Update `CLAUDE.md`
- Adding new tests → Update test file index

### Documentation Structure
- **User-facing:** `README.md` (project overview, installation, usage)
- **Developer-facing:** `CLAUDE.md` (architecture, workflows, guidelines)
- **API Reference:** `docs/API.md` (endpoint documentation)
- **Requirements:** `docs/prd/` (phase specifications)
- **Complete Index:** `docs/README.md` (navigation guide)

---

## SWARM Methodology

This project uses specialized subagents for different tasks. Available agents include:

- **backend-architect** - API design, server implementation
- **frontend-developer** - Vue components, UI implementation
- **test-automation-engineer** - Test creation and maintenance
- **git-workflow-specialist** - Version control, PR management
- **documentation-engineer** - Documentation creation

Invoke with `/swarm` command to coordinate multi-agent work.

**See:** `.claude/agents/` for all agent definitions.

---

## Getting Help

- **Documentation:** Check `docs/README.md` for navigation
- **API Reference:** See `docs/API.md`
- **Development Guide:** See `CLAUDE.md`
- **Issues:** Create GitHub issue with detailed description
- **Questions:** Use GitHub Discussions

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Claude Code Manager!**
