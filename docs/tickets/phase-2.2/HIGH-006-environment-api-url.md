# HIGH-006: Environment-Based API URL Support

**Issue ID:** HIGH-006
**Epic:** Phase 2.2 - Cleanup & Optimization
**Status:** ✅ COMPLETED (Merged PR #53 - 2025-10-31)
**Priority:** 🚀 HIGH (Deployment) - **PRIORITIZED SECOND**
**Effort:** 15 minutes
**Labels:** `high`, `deployment`, `phase-2.2`, `priority-high-b`, `frontend`, `configuration`

---

## Problem Description

The API client hardcodes the backend port (8420) for development mode, which fails in containerized or proxied environments (Docker, Kubernetes, reverse proxies). This prevents deployment flexibility and forces manual code changes for different environments.

**Current Behavior:**
```javascript
// src/api/client.js
function getBaseUrl() {
  if (window.location.hostname === 'localhost' && window.location.port === '5173') {
    return 'http://localhost:8420'  // ❌ Hardcoded port
  }
  return window.location.origin
}
```

**Deployment Scenarios That Fail:**
1. **Docker Compose:** Backend on `http://backend:8420`, not `localhost:8420`
2. **Kubernetes:** Backend service name like `http://manager-api:8420`
3. **Reverse Proxy:** API at `/api` path, not separate port
4. **Custom Ports:** Developer using port 3000 instead of 8420

**Impact:**
- Cannot deploy to Docker/Kubernetes without code changes
- Manual environment-specific builds required
- No support for reverse proxy deployments
- Developer flexibility limited

---

## Solution Design

**Use Vite Environment Variables:**

Vite provides `import.meta.env` for environment-specific configuration. Add support for `VITE_API_BASE_URL` environment variable with sensible fallbacks.

**Updated Implementation:**
```javascript
// src/api/client.js
function getBaseUrl() {
  // Priority 1: Explicit environment variable (deployment override)
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  if (envApiUrl) {
    return envApiUrl;
  }

  // Priority 2: Development mode detection (Vite dev server)
  if (import.meta.env.DEV && window.location.port === '5173') {
    return 'http://localhost:8420'  // Default dev backend
  }

  // Priority 3: Same origin (production default)
  return window.location.origin
}
```

**Environment File Examples:**

`.env.development` (local development - default):
```bash
# Optional override for local dev (uses hardcoded default if not set)
# VITE_API_BASE_URL=http://localhost:8420
```

`.env.production` (production build):
```bash
# Production: API served from same origin
# VITE_API_BASE_URL not needed (uses window.location.origin)
```

`.env.docker` (Docker Compose):
```bash
# Docker Compose: Backend container service
VITE_API_BASE_URL=http://backend:8420
```

`.env.kubernetes` (Kubernetes):
```bash
# Kubernetes: Service discovery
VITE_API_BASE_URL=http://manager-api.default.svc.cluster.local:8420
```

---

## Technical Details

**File to Modify:**
- `/home/claude/manager/src/api/client.js`

**Environment Files to Create:**
- `.env.example` - Template for developers
- `.env.docker.example` - Docker Compose template
- `.env.kubernetes.example` - Kubernetes template

**Vite Environment Variable Rules:**
1. Must start with `VITE_` prefix to be exposed to client
2. Read from `.env` files at build time
3. Different `.env.*` files for different modes
4. Can be overridden at build time: `VITE_API_BASE_URL=... npm run build`

**Backwards Compatibility:**
- ✅ Existing development workflow unchanged (uses default `localhost:8420`)
- ✅ Existing production builds unchanged (uses `window.location.origin`)
- ✅ Only adds new capability (environment variable override)

---

## Acceptance Criteria

**Must Complete:**
- [x] `getBaseUrl()` checks `import.meta.env.VITE_API_BASE_URL` first
- [x] Falls back to dev server detection (`import.meta.env.DEV`)
- [x] Falls back to same origin for production
- [x] `.env.example` created with documentation
- [x] `.env.docker.example` created for Docker Compose
- [x] `.env.kubernetes.example` created for Kubernetes
- [x] README.md updated with deployment instructions
- [x] All 311 frontend tests passing
- [x] Manual testing in dev, production, and Docker modes

**Testing Scenarios:**
1. **Local Dev (default):** No env var → Uses `localhost:8420`
2. **Local Dev (override):** Set env var → Uses custom URL
3. **Production:** No env var → Uses `window.location.origin`
4. **Docker:** Env var set → Uses backend container URL
5. **Kubernetes:** Env var set → Uses service discovery URL

---

## Implementation Steps

**1. Update getBaseUrl Function (5 minutes)**

File: `/home/claude/manager/src/api/client.js`

```javascript
/**
 * Get API base URL based on environment
 *
 * Priority order:
 * 1. VITE_API_BASE_URL environment variable (deployment override)
 * 2. Development mode: localhost:8420 (Vite dev server)
 * 3. Same origin (production default)
 *
 * @returns {string} Base URL for API requests
 */
function getBaseUrl() {
  // Priority 1: Explicit environment variable
  // Allows deployment-specific configuration (Docker, Kubernetes, etc.)
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  if (envApiUrl) {
    console.log('[API Client] Using env-specified base URL:', envApiUrl);
    return envApiUrl;
  }

  // Priority 2: Development mode (Vite dev server on port 5173)
  if (import.meta.env.DEV && window.location.port === '5173') {
    const devUrl = 'http://localhost:8420';
    console.log('[API Client] Using dev mode base URL:', devUrl);
    return devUrl;
  }

  // Priority 3: Same origin (production)
  const origin = window.location.origin;
  console.log('[API Client] Using same-origin base URL:', origin);
  return origin;
}
```

**2. Create Environment File Templates (5 minutes)**

`.env.example`:
```bash
# Claude Code Manager - Environment Configuration Template
# Copy this file to .env and configure for your environment

# API Base URL (optional)
# Leave commented for default behavior:
# - Development: http://localhost:8420
# - Production: same origin as frontend
#
# Uncomment and set for custom deployments:
# VITE_API_BASE_URL=http://localhost:8420

# Example configurations:
# VITE_API_BASE_URL=http://localhost:3000  # Custom dev port
# VITE_API_BASE_URL=http://backend:8420    # Docker Compose
# VITE_API_BASE_URL=http://manager-api.default.svc.cluster.local:8420  # Kubernetes
```

`.env.docker.example`:
```bash
# Docker Compose Deployment Configuration
# Copy to .env when deploying with Docker Compose

# Backend service URL (Docker Compose service name)
VITE_API_BASE_URL=http://backend:8420
```

`.env.kubernetes.example`:
```bash
# Kubernetes Deployment Configuration
# Copy to .env when deploying to Kubernetes

# Backend service URL (Kubernetes service discovery)
# Format: http://<service-name>.<namespace>.svc.cluster.local:<port>
VITE_API_BASE_URL=http://manager-api.default.svc.cluster.local:8420
```

**3. Update Documentation (3 minutes)**

Add to `README.md` (Deployment section):

```markdown
## Deployment

### Environment Configuration

The application supports environment-based API URL configuration for different deployment scenarios.

**Local Development (default):**
```bash
npm run dev
# Frontend: http://localhost:5173
# Backend: http://localhost:8420 (automatic)
```

**Docker Compose:**
```bash
# Copy environment template
cp .env.docker.example .env

# Edit .env to set backend URL
# VITE_API_BASE_URL=http://backend:8420

# Build and deploy
npm run build
docker-compose up
```

**Kubernetes:**
```bash
# Copy environment template
cp .env.kubernetes.example .env

# Edit .env to set service URL
# VITE_API_BASE_URL=http://manager-api.default.svc.cluster.local:8420

# Build and deploy
npm run build
kubectl apply -f k8s/
```

**Custom Deployment:**
```bash
# Set environment variable at build time
VITE_API_BASE_URL=https://api.example.com npm run build
```
```

**4. Test All Scenarios (2 minutes)**

```bash
# Test 1: Default dev mode (no env var)
unset VITE_API_BASE_URL
npm run dev
# Browser console should show: "Using dev mode base URL: http://localhost:8420"

# Test 2: Custom env var
echo "VITE_API_BASE_URL=http://custom:9999" > .env
npm run dev
# Browser console should show: "Using env-specified base URL: http://custom:9999"

# Test 3: Production build
npm run build
npm start
# Browser console should show: "Using same-origin base URL: <actual origin>"

# Clean up test env
rm .env
```

---

## Dependencies

**Blocking:**
- None (independent feature)

**Related Issues:**
- HIGH-005 (security - both improve robustness)
- CRITICAL-002 (cleanup - good time for improvements)

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing dev workflow | Medium | Maintain default behavior (no .env required) |
| Environment variable typos | Low | Clear documentation and examples |
| Build cache issues | Low | Document need to rebuild after .env changes |
| Confusing URL detection | Low | Add console.log for debugging |

**Mitigation Strategy:**
- **Backwards Compatible:** Existing workflows unchanged
- **Clear Defaults:** Works out-of-box for 90% of users
- **Documentation:** Multiple examples for common scenarios
- **Debugging:** Console logs show which URL is selected

---

## Commit Message Template

```
feat: add environment-based API URL configuration

Add support for VITE_API_BASE_URL environment variable to enable
flexible deployment across Docker, Kubernetes, and reverse proxy
environments.

Changes:
- Updated getBaseUrl() to check import.meta.env.VITE_API_BASE_URL
- Maintains backwards compatibility (dev and prod modes unchanged)
- Added .env.example with configuration templates
- Added .env.docker.example for Docker Compose
- Added .env.kubernetes.example for Kubernetes
- Updated README.md with deployment instructions
- Added console.log debugging for URL selection

Priority order:
1. VITE_API_BASE_URL (explicit override)
2. Development mode (localhost:8420)
3. Same origin (production)

Resolves HIGH-006

Test: All 311 frontend tests passing
Manual: Verified in dev, production, and Docker scenarios
```

---

## Definition of Done

- [x] Code changes committed
- [x] Environment templates created (.env.example, .env.docker.example, .env.kubernetes.example)
- [x] README.md deployment section updated
- [x] All 311 frontend tests passing
- [x] Manual testing in 3+ scenarios
- [x] Console logging added for debugging
- [x] Code review completed
- [x] Merged to feature branch

---

## Notes

**Why This Matters:**
- **Deployment Flexibility:** Single build works in multiple environments
- **DevOps Best Practice:** Configuration via environment variables (12-factor app)
- **Docker/Kubernetes Ready:** Native support for containerized deployments
- **Developer Experience:** Easy to customize for local development

**Expected Outcomes:**
- No code changes needed for different deployments
- Simple `.env` file configuration
- Works out-of-box for local dev
- Production-ready for modern deployment platforms

**Reference:**
- Original discovery: Cleanup Review (October 26, 2025)
- Review report: `/home/claude/manager/CLEANUP-AND-OPTIMIZATION-REPORT-2025-10-26.md`
- 12-Factor App: https://12factor.net/config

---

**Created:** October 26, 2025
**Assigned To:** TBD (via `/swarm` command)
**Epic:** Phase 2.2 Cleanup & Optimization
