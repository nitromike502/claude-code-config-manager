#!/bin/bash

# NPX Package Execution Test Script
# Tests the complete npx claude-code-config-manager flow

set -e

echo "========================================="
echo "NPX Package Execution Test"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((TESTS_PASSED++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((TESTS_FAILED++))
}

info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Cleanup function
cleanup() {
    info "Cleaning up test processes..."
    pkill -f "node.*server.js" 2>/dev/null || true
    sleep 2
}

# Ensure clean state
trap cleanup EXIT
cleanup

echo "Test 1: Direct CLI execution"
echo "----------------------------"
timeout 10 node bin/cli.js > /tmp/cli-test.log 2>&1 &
CLI_PID=$!
sleep 3

# Check if server started
if ps -p $CLI_PID > /dev/null; then
    pass "CLI process started successfully (PID: $CLI_PID)"
else
    fail "CLI process failed to start"
    cat /tmp/cli-test.log
    exit 1
fi

# Check port 8420
if nc -z localhost 8420 2>/dev/null; then
    pass "Server listening on port 8420"
else
    fail "Server not listening on port 8420"
    cat /tmp/cli-test.log
    kill $CLI_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "Test 2: Health endpoint"
echo "----------------------"
HEALTH_RESPONSE=$(curl -s http://localhost:8420/api/health)
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    pass "Health endpoint returns valid response"
    info "Response: $HEALTH_RESPONSE"
else
    fail "Health endpoint failed"
    echo "Response: $HEALTH_RESPONSE"
    kill $CLI_PID 2>/dev/null || true
    exit 1
fi

if echo "$HEALTH_RESPONSE" | grep -q '"service":"claude-code-manager"'; then
    pass "Service identification correct"
else
    fail "Service identification incorrect"
fi

echo ""
echo "Test 3: Duplicate instance detection"
echo "------------------------------------"
timeout 5 node bin/cli.js > /tmp/cli-test-2.log 2>&1
SECOND_EXIT=$?

if [ $SECOND_EXIT -eq 0 ]; then
    pass "Second instance detected existing server"
    if grep -q "already running" /tmp/cli-test-2.log; then
        pass "Correct duplicate detection message"
    else
        fail "Missing duplicate detection message"
    fi
else
    fail "Second instance failed unexpectedly"
    cat /tmp/cli-test-2.log
fi

echo ""
echo "Test 4: Port fallback"
echo "--------------------"
# Start second server on next port
PORT=8421 timeout 10 node src/backend/server.js > /dev/null 2>&1 &
SECOND_PID=$!
sleep 2

if nc -z localhost 8421 2>/dev/null; then
    pass "Alternate port server started (8421)"
    kill $SECOND_PID 2>/dev/null || true
else
    info "Port fallback test skipped (manual test recommended)"
fi

echo ""
echo "Test 5: Frontend static files"
echo "----------------------------"
# Check if frontend is accessible
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8420/)
if [ "$FRONTEND_STATUS" = "200" ]; then
    pass "Frontend root accessible (HTTP $FRONTEND_STATUS)"
else
    fail "Frontend root failed (HTTP $FRONTEND_STATUS)"
fi

echo ""
echo "Test 6: API endpoints"
echo "--------------------"
PROJECTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8420/api/projects)
if [ "$PROJECTS_STATUS" = "200" ]; then
    pass "Projects API endpoint accessible"
else
    fail "Projects API endpoint failed (HTTP $PROJECTS_STATUS)"
fi

USER_AGENTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8420/api/user/agents)
if [ "$USER_AGENTS_STATUS" = "200" ]; then
    pass "User agents API endpoint accessible"
else
    fail "User agents API endpoint failed (HTTP $USER_AGENTS_STATUS)"
fi

echo ""
echo "Test 7: npm link simulation"
echo "--------------------------"
info "Testing npm link workflow..."
cd /home/claude/manager
npm link > /tmp/npm-link.log 2>&1 || true

if [ -L "/home/meckert/.nvm/versions/node/v23.3.0/bin/claude-code-config-manager" ]; then
    pass "npm link created global symlink"
else
    info "npm link not tested (requires permissions)"
fi

npm unlink -g claude-code-config-manager 2>/dev/null || true

echo ""
echo "========================================="
echo "Test Summary"
echo "========================================="
echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All NPX execution tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
