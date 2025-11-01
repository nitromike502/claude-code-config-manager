# CRITICAL-006: Update Vite to Fix Security Vulnerability

**Priority:** CRITICAL
**Status:** ✅ Complete
**Effort:** 5 minutes
**Created:** November 1, 2025
**Related:** PR #58 Code Review - CRITICAL-004

---

## Problem

Vite has a known security vulnerability (CVE) affecting Windows users - path traversal bypass via backslash characters.

**Evidence:**
- Current version: `vite@7.1.0`
- Vulnerability: Path traversal on Windows (GHSA-93m4-6634-74q7)
- Severity: Moderate
- Fixed in: `vite@7.1.12`

**NPM Audit Output:**
```
vite@7.1.0 - 7.1.10
Severity: moderate
vite allows server.fs.deny bypass via backslash on Windows
CVE: https://github.com/advisories/GHSA-93m4-6634-74q7
```

## Impact

**Security Vulnerability:**
- Windows users could bypass file system restrictions
- Attackers could access files outside allowed directories via backslash path traversal
- Dev server vulnerability (does not affect production builds)
- Moderate severity but trivial to fix

**Professional Standards:**
- Production applications should not ship with known CVEs
- NPM audit should return 0 vulnerabilities
- Security best practices require staying current with patches

## Files Affected

- `/home/claude/manager/package.json` (Vite version bump)
- `/home/claude/manager/package-lock.json` (dependency tree update)

## Solution

Run `npm audit fix` to automatically update Vite to patched version.

**Implementation:**

```bash
# Update Vite to fix security vulnerability
npm audit fix

# Verify update applied
npm list vite
# Should show: vite@7.1.12 (or later)

# Verify no remaining vulnerabilities
npm audit
# Should show: 0 vulnerabilities
```

**Expected Changes:**
- `package.json`: No changes (uses caret `^7.1.0` semver)
- `package-lock.json`: Updated with vite@7.1.12 and dependencies

## Testing

**Pre-Update Verification:**

```bash
# Verify current version
npm list vite
# Shows: vite@7.1.0

# Check audit status
npm audit
# Shows: 1 moderate vulnerability
```

**Post-Update Testing (Required):**

```bash
# 1. Verify update applied
npm list vite
# Should show: vite@7.1.12 or later

# 2. Verify no vulnerabilities
npm audit
# Should show: 0 vulnerabilities

# 3. Run full backend test suite
npm run test:backend
# Expected: 276/276 tests passing

# 4. Run full frontend test suite
npm run test:frontend
# Expected: 313/313 tests passing

# 5. Test development build
npm run dev
# Visit http://localhost:5173 - verify app loads

# 6. Test production build
npm run build
# Should succeed without errors

# 7. Verify build output
ls -la dist/
# Should contain index.html, assets/, etc.
```

**Regression Testing:**
- All existing functionality must continue to work
- Build process must succeed
- Dev server must start correctly
- All tests must pass

## Acceptance Criteria

- [x] `npm audit fix` executed successfully
- [x] Vite updated to 7.1.12 or later
- [x] `npm audit` shows 0 vulnerabilities
- [x] All backend tests passing (276/276)
- [x] All frontend tests passing (313/313)
- [x] `npm run build` succeeds
- [x] `npm run dev` starts correctly
- [x] Application functionality unchanged
- [x] Changes committed to git

## Implementation Steps

**Step 1: Update Dependencies (1 minute)**

```bash
npm audit fix
```

**Step 2: Verify Update (1 minute)**

```bash
npm list vite
npm audit
```

**Step 3: Run Full Test Suite (2 minutes)**

```bash
npm run test:backend
npm run test:frontend
```

**Step 4: Test Builds (1 minute)**

```bash
npm run build
npm run dev  # Ctrl+C to stop
```

**Step 5: Commit Changes (30 seconds)**

```bash
git add package-lock.json
git commit -m "fix(deps): update Vite to 7.1.12 to fix security vulnerability"
```

## Definition of Done

- Vite updated to 7.1.12 or later
- Zero NPM audit vulnerabilities
- All 589 tests passing (276 backend + 313 frontend)
- Production build succeeds
- Development server starts
- Changes committed with proper message

---

## Commit Message Template

```
fix(deps): update Vite to 7.1.12 to fix security vulnerability

Update Vite from 7.1.0 to 7.1.12 to address path traversal
vulnerability on Windows (CVE GHSA-93m4-6634-74q7).

- Run npm audit fix
- Update vite@7.1.0 → vite@7.1.12
- Fixes moderate severity security vulnerability
- Zero npm audit vulnerabilities after update

Resolves CRITICAL-006
Related: PR #58 Code Review

Test: 589/589 tests passing (276 backend + 313 frontend)
Build: Production and development builds verified
Security: 0 vulnerabilities (npm audit clean)
```

---

## Vulnerability Details

**CVE Information:**
- **ID:** GHSA-93m4-6634-74q7
- **Severity:** Moderate (CVSS score varies)
- **Affected:** vite@7.1.0 - 7.1.10
- **Fixed:** vite@7.1.12
- **Vector:** Path traversal via backslash on Windows
- **Scope:** Development server only (not production builds)

**Attack Scenario:**
1. Attacker on Windows connects to Vite dev server
2. Uses backslash in path: `http://localhost:5173/..\..\..\sensitive-file`
3. Bypasses `server.fs.deny` restrictions
4. Accesses files outside project directory

**Mitigation:**
- Update to vite@7.1.12 or later
- Vulnerability only affects dev server (not production)
- Low risk for local development tool but should be fixed

## Notes

**Why Critical:**
- Known security vulnerability (CVE published)
- Trivial to fix (2 minutes + testing)
- Professional applications ship with zero vulnerabilities
- Windows users at risk (this project targets Windows/Mac/Linux)

**No Breaking Changes Expected:**
- Patch version update (7.1.0 → 7.1.12)
- Semantic versioning guarantees compatibility
- Only security fixes and bug fixes
- No API changes

**Post-Update Confidence:**
- High confidence - patch version
- Vite is well-tested dependency
- Our test suite will catch any issues
- 589 tests provide comprehensive coverage

**Reference:**
- CVE Details: https://github.com/advisories/GHSA-93m4-6634-74q7
- Original finding: PR #58 Code Review, CRITICAL-004
- NPM Audit: https://docs.npmjs.com/cli/v10/commands/npm-audit

---

**Created:** November 1, 2025
**Epic:** Phase 2.3 - Production Readiness Fixes
**Estimated Completion:** 5 minutes
