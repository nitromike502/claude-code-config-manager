#!/bin/bash
#===============================================================================
# restart-backend.sh
#===============================================================================
# PURPOSE:
#   Reliably restart the backend server for development. This script consolidates
#   multiple restart patterns observed in Claude Code sessions into a single,
#   robust operation.
#
# BACKGROUND:
#   Analysis of development sessions revealed a common "4-command restart dance":
#   1. pkill -f "node.*backend"     (kill by process name)
#   2. pkill -f "node.*8420"        (kill by port pattern)
#   3. sleep 2 && curl health       (verify)
#   4. ensure-server-running.sh     (fallback)
#
#   This script consolidates all four steps into one pre-approvable command,
#   reducing restart time from ~23 seconds to ~5 seconds.
#
# USAGE:
#   ./scripts/restart-backend.sh              # Standard restart (minimal output)
#   ./scripts/restart-backend.sh --verbose    # Show detailed progress
#   ./scripts/restart-backend.sh --quick      # Skip health check (faster)
#   ./scripts/restart-backend.sh --force      # Force kill with SIGKILL if needed
#   ./scripts/restart-backend.sh --help       # Show this help message
#
# OUTPUT:
#   Default: Single result line (e.g., "Backend restarted: PID 12345")
#   Verbose: Step-by-step progress with colors
#
# EXIT CODES:
#   0 - Server restarted successfully
#   1 - Server failed to restart (health check failed)
#   2 - Invalid arguments provided
#
# EXAMPLES:
#   # Basic restart after code changes
#   ./scripts/restart-backend.sh
#
#   # Restart with detailed output for debugging
#   ./scripts/restart-backend.sh --verbose
#
#   # Quick restart during rapid iteration (skips verification)
#   ./scripts/restart-backend.sh --quick
#
#   # Force restart when server is unresponsive
#   ./scripts/restart-backend.sh --force
#
# RELATED SCRIPTS:
#   - ensure-server-running.sh : Start server if not running (non-destructive)
#   - check-server-status.sh   : Check server health without changes
#   - kill-servers.sh          : Stop all servers without restarting
#
# AUTHOR: Generated from workflow analysis of December 8, 2025 sessions
# DATE: December 9, 2025
#===============================================================================

#-------------------------------------------------------------------------------
# Configuration
#-------------------------------------------------------------------------------

# Server settings
SERVER_PORT=8420
SERVER_URL="http://localhost:${SERVER_PORT}"
HEALTH_ENDPOINT="${SERVER_URL}/api/health"

# Project paths
PROJECT_DIR="/home/claude/manager"
LOG_DIR="${PROJECT_DIR}/.claude/logs"
LOG_FILE="${LOG_DIR}/server.log"

# Timing settings
KILL_WAIT_SECONDS=1           # Time to wait after kill for port release
HEALTH_CHECK_RETRIES=10       # Number of health check attempts
HEALTH_CHECK_INTERVAL=0.5     # Seconds between health check attempts

# Process matching patterns (used to identify backend server processes)
PATTERN_BY_NAME="node.*backend"
PATTERN_BY_PORT="node.*${SERVER_PORT}"

#-------------------------------------------------------------------------------
# Terminal colors (only used in verbose mode)
#-------------------------------------------------------------------------------

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

#-------------------------------------------------------------------------------
# Command line argument parsing
#-------------------------------------------------------------------------------

QUICK_MODE=false      # Skip health check verification
FORCE_MODE=false      # Use SIGKILL if SIGTERM fails
VERBOSE=false         # Show detailed progress output

while [[ $# -gt 0 ]]; do
    case $1 in
        --quick)
            QUICK_MODE=true
            shift
            ;;
        --force|-f)
            FORCE_MODE=true
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            head -55 "$0" | grep -E "^#" | sed 's/^# \?//'
            exit 0
            ;;
        *)
            echo "Error: Unknown argument '$1'" >&2
            echo "Use --help for usage information" >&2
            exit 2
            ;;
    esac
done

#-------------------------------------------------------------------------------
# Output helpers - respects VERBOSE flag
#-------------------------------------------------------------------------------

# log: Print message only in verbose mode
log() {
    if [ "$VERBOSE" = true ]; then
        echo -e "$@"
    fi
}

# result: Print final result (always shown)
result() {
    echo -e "$@"
}

# error: Print error message (always shown, to stderr)
error() {
    echo -e "$@" >&2
}

#-------------------------------------------------------------------------------
# Helper Functions
#-------------------------------------------------------------------------------

check_port() {
    lsof -ti:${SERVER_PORT} 2>/dev/null
}

check_health() {
    curl -s -o /dev/null -w "%{http_code}" "${HEALTH_ENDPOINT}" 2>/dev/null
}

kill_process() {
    local pid=$1
    local force=$2
    if [ "$force" = "force" ]; then
        kill -9 "$pid" 2>/dev/null
    else
        kill "$pid" 2>/dev/null
    fi
}

wait_for_health() {
    local attempt=0
    while [ $attempt -lt $HEALTH_CHECK_RETRIES ]; do
        local http_code
        http_code=$(check_health)
        if [ "$http_code" = "200" ]; then
            return 0
        fi
        sleep $HEALTH_CHECK_INTERVAL
        ((attempt++))
    done
    return 1
}

#-------------------------------------------------------------------------------
# Main Execution
#-------------------------------------------------------------------------------

log "${BLUE}=== Backend Server Restart ===${NC}"
log "${CYAN}Port: ${SERVER_PORT} | Quick: ${QUICK_MODE} | Force: ${FORCE_MODE}${NC}"
log ""

mkdir -p "${LOG_DIR}"

#-------------------------------------------------------------------------------
# Step 1: Kill existing server process(es)
#-------------------------------------------------------------------------------

log "${YELLOW}Step 1: Stopping existing server...${NC}"

OLD_PID=$(check_port)

if [ -n "$OLD_PID" ]; then
    log "  Found process on port ${SERVER_PORT}: PID ${OLD_PID}"

    pkill -f "${PATTERN_BY_NAME}" 2>/dev/null
    pkill -f "${PATTERN_BY_PORT}" 2>/dev/null
    sleep $KILL_WAIT_SECONDS

    if check_port >/dev/null 2>&1; then
        if [ "$FORCE_MODE" = true ]; then
            log "  ${YELLOW}Process still running, using force kill (SIGKILL)...${NC}"
            kill_process "$OLD_PID" "force"
            sleep 1
        else
            log "  ${YELLOW}Process still running, attempting direct kill...${NC}"
            kill_process "$OLD_PID"
            sleep 1
        fi
    fi

    if check_port >/dev/null 2>&1; then
        error "Failed to stop server process (PID ${OLD_PID})"
        error "Try running with --force flag"
        exit 1
    fi

    log "${GREEN}  ✓ Server stopped (was PID ${OLD_PID})${NC}"
else
    log "  ${CYAN}No existing server process found${NC}"
fi

log ""

#-------------------------------------------------------------------------------
# Step 2: Start new server instance
#-------------------------------------------------------------------------------

log "${YELLOW}Step 2: Starting new server instance...${NC}"

cd "${PROJECT_DIR}" || {
    error "Failed to change to project directory: ${PROJECT_DIR}"
    exit 1
}

nohup node src/backend/server.js > "${LOG_FILE}" 2>&1 &
NEW_PID=$!

log "  Started with PID: ${NEW_PID}"
log "  Log file: ${LOG_FILE}"
log ""

#-------------------------------------------------------------------------------
# Step 3: Verify server is running (unless --quick mode)
#-------------------------------------------------------------------------------

if [ "$QUICK_MODE" = true ]; then
    log "${CYAN}Step 3: Skipping health check (--quick mode)${NC}"
    FINAL_PID=$(check_port)
    result "Backend started: PID ${FINAL_PID:-$NEW_PID} (health check skipped)"
    exit 0
fi

log "${YELLOW}Step 3: Verifying server health...${NC}"
sleep 1

if wait_for_health; then
    FINAL_PID=$(check_port)
    log "${GREEN}  ✓ Server is healthy${NC}"

    if [ -n "$OLD_PID" ]; then
        result "Backend restarted: PID ${OLD_PID} → ${FINAL_PID}"
    else
        result "Backend started: PID ${FINAL_PID}"
    fi
    exit 0
else
    error "Backend failed to start (health check failed after ${HEALTH_CHECK_RETRIES} attempts)"
    error "Check logs: ${LOG_FILE}"
    exit 1
fi
