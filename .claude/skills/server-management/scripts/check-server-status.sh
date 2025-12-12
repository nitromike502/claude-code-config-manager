#!/bin/bash
#===============================================================================
# check-server-status.sh
#===============================================================================
# PURPOSE:
#   Check the status of development servers (backend and frontend) without
#   making any changes. This is a read-only diagnostic script.
#
# BACKGROUND:
#   During development sessions, agents frequently need to verify server state
#   before running tests or making API calls. This script consolidates common
#   status check patterns into a single pre-approvable command.
#
# USAGE:
#   ./scripts/check-server-status.sh              # Check all servers (minimal output)
#   ./scripts/check-server-status.sh --verbose    # Show detailed status report
#   ./scripts/check-server-status.sh --backend    # Check backend only
#   ./scripts/check-server-status.sh --frontend   # Check frontend only
#   ./scripts/check-server-status.sh --json       # Output as JSON (for scripting)
#   ./scripts/check-server-status.sh --help       # Show this help message
#
# OUTPUT:
#   Default: Single line per server (e.g., "Backend: running (PID 12345)")
#   Verbose: Detailed status report with colors and health info
#   JSON:    Machine-readable JSON object
#
# EXIT CODES:
#   0 - All checked servers are running and healthy
#   1 - One or more servers are not running or unhealthy
#   2 - Invalid arguments provided
#
# EXAMPLES:
#   # Quick status check before running tests
#   ./scripts/check-server-status.sh && npm test
#
#   # Detailed status for debugging
#   ./scripts/check-server-status.sh --verbose
#
#   # Get JSON for parsing
#   ./scripts/check-server-status.sh --json | jq '.backend.status'
#
# RELATED SCRIPTS:
#   - ensure-server-running.sh : Start server if not running
#   - restart-backend.sh       : Force restart backend server
#   - kill-servers.sh          : Stop all servers
#
# AUTHOR: Generated from workflow analysis of December 8, 2025 sessions
# DATE: December 9, 2025
#===============================================================================

#-------------------------------------------------------------------------------
# Configuration
#-------------------------------------------------------------------------------

BACKEND_PORT=8420
BACKEND_URL="http://localhost:${BACKEND_PORT}"
BACKEND_HEALTH="${BACKEND_URL}/api/health"

FRONTEND_PORT=5173
FRONTEND_URL="http://localhost:${FRONTEND_PORT}"

CURL_TIMEOUT=5

#-------------------------------------------------------------------------------
# Terminal colors (only used in verbose mode)
#-------------------------------------------------------------------------------

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

#-------------------------------------------------------------------------------
# Command line argument parsing
#-------------------------------------------------------------------------------

CHECK_BACKEND=true
CHECK_FRONTEND=true
JSON_OUTPUT=false
VERBOSE=false

OVERALL_STATUS=0

while [[ $# -gt 0 ]]; do
    case $1 in
        --backend|-b)
            CHECK_BACKEND=true
            CHECK_FRONTEND=false
            shift
            ;;
        --frontend|-f)
            CHECK_BACKEND=false
            CHECK_FRONTEND=true
            shift
            ;;
        --json|-j)
            JSON_OUTPUT=true
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            head -50 "$0" | grep -E "^#" | sed 's/^# \?//'
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
# Helper Functions
#-------------------------------------------------------------------------------

get_pid() {
    local port=$1
    lsof -ti:"${port}" 2>/dev/null
}

check_health() {
    local url=$1
    curl -s -o /dev/null -w "%{http_code}" --connect-timeout $CURL_TIMEOUT "${url}" 2>/dev/null || echo "000"
}

get_uptime() {
    local pid=$1
    ps -p "$pid" -o etime= 2>/dev/null | tr -d ' '
}

get_command() {
    local pid=$1
    ps -p "$pid" -o args= 2>/dev/null | head -c 80
}

#-------------------------------------------------------------------------------
# Server Check Functions
#-------------------------------------------------------------------------------

check_backend_server() {
    BACKEND_PID=$(get_pid $BACKEND_PORT)
    BACKEND_HEALTH_CODE=""
    BACKEND_UPTIME=""
    BACKEND_COMMAND=""

    if [ -n "$BACKEND_PID" ]; then
        BACKEND_HEALTH_CODE=$(check_health "$BACKEND_HEALTH")
        BACKEND_UPTIME=$(get_uptime "$BACKEND_PID")
        BACKEND_COMMAND=$(get_command "$BACKEND_PID")

        if [ "$BACKEND_HEALTH_CODE" = "200" ]; then
            BACKEND_STATUS="running"
        else
            BACKEND_STATUS="unhealthy"
            OVERALL_STATUS=1
        fi
    else
        BACKEND_STATUS="stopped"
        OVERALL_STATUS=1
    fi
}

check_frontend_server() {
    FRONTEND_PID=$(get_pid $FRONTEND_PORT)
    FRONTEND_UPTIME=""
    FRONTEND_COMMAND=""

    if [ -n "$FRONTEND_PID" ]; then
        FRONTEND_UPTIME=$(get_uptime "$FRONTEND_PID")
        FRONTEND_COMMAND=$(get_command "$FRONTEND_PID")

        local response
        response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $CURL_TIMEOUT "${FRONTEND_URL}" 2>/dev/null || echo "000")

        if [ "$response" = "000" ]; then
            FRONTEND_STATUS="unhealthy"
            OVERALL_STATUS=1
        else
            FRONTEND_STATUS="running"
        fi
    else
        FRONTEND_STATUS="stopped"
        OVERALL_STATUS=1
    fi
}

#-------------------------------------------------------------------------------
# Output Functions
#-------------------------------------------------------------------------------

print_simple() {
    if [ "$CHECK_BACKEND" = true ]; then
        case $BACKEND_STATUS in
            "running")
                echo "Backend: running (PID ${BACKEND_PID})"
                ;;
            "unhealthy")
                echo "Backend: unhealthy (PID ${BACKEND_PID}, health: ${BACKEND_HEALTH_CODE})"
                ;;
            "stopped")
                echo "Backend: stopped"
                ;;
        esac
    fi

    if [ "$CHECK_FRONTEND" = true ]; then
        case $FRONTEND_STATUS in
            "running")
                echo "Frontend: running (PID ${FRONTEND_PID})"
                ;;
            "unhealthy")
                echo "Frontend: unhealthy (PID ${FRONTEND_PID})"
                ;;
            "stopped")
                echo "Frontend: stopped"
                ;;
        esac
    fi
}

print_verbose() {
    echo -e "${BLUE}${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}${BOLD}║              Server Status Report                            ║${NC}"
    echo -e "${BLUE}${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    if [ "$CHECK_BACKEND" = true ]; then
        echo -e "${BOLD}Backend API Server${NC}"
        echo -e "  Port:   ${CYAN}${BACKEND_PORT}${NC}"

        case $BACKEND_STATUS in
            "running")
                echo -e "  Status: ${GREEN}● RUNNING${NC}"
                echo -e "  PID:    ${BACKEND_PID}"
                echo -e "  Health: ${GREEN}${BACKEND_HEALTH_CODE} OK${NC}"
                echo -e "  Uptime: ${BACKEND_UPTIME:-unknown}"
                ;;
            "unhealthy")
                echo -e "  Status: ${YELLOW}◐ UNHEALTHY${NC}"
                echo -e "  PID:    ${BACKEND_PID}"
                echo -e "  Health: ${RED}${BACKEND_HEALTH_CODE}${NC}"
                echo -e "  ${YELLOW}→ Process running but not responding${NC}"
                ;;
            "stopped")
                echo -e "  Status: ${RED}○ NOT RUNNING${NC}"
                echo -e "  ${RED}→ No process on port ${BACKEND_PORT}${NC}"
                ;;
        esac

        if [ -n "$BACKEND_COMMAND" ]; then
            echo -e "  Command: ${CYAN}${BACKEND_COMMAND}${NC}"
        fi
        echo ""
    fi

    if [ "$CHECK_FRONTEND" = true ]; then
        echo -e "${BOLD}Frontend Dev Server (Vite)${NC}"
        echo -e "  Port:   ${CYAN}${FRONTEND_PORT}${NC}"

        case $FRONTEND_STATUS in
            "running")
                echo -e "  Status: ${GREEN}● RUNNING${NC}"
                echo -e "  PID:    ${FRONTEND_PID}"
                echo -e "  URL:    ${FRONTEND_URL}"
                echo -e "  Uptime: ${FRONTEND_UPTIME:-unknown}"
                ;;
            "unhealthy")
                echo -e "  Status: ${YELLOW}◐ UNHEALTHY${NC}"
                echo -e "  PID:    ${FRONTEND_PID}"
                echo -e "  ${YELLOW}→ Process running but not responding${NC}"
                ;;
            "stopped")
                echo -e "  Status: ${RED}○ NOT RUNNING${NC}"
                echo -e "  ${RED}→ No process on port ${FRONTEND_PORT}${NC}"
                ;;
        esac

        if [ -n "$FRONTEND_COMMAND" ]; then
            echo -e "  Command: ${CYAN}${FRONTEND_COMMAND}${NC}"
        fi
        echo ""
    fi

    echo -e "${BLUE}──────────────────────────────────────────────────────────────────${NC}"
    if [ $OVERALL_STATUS -eq 0 ]; then
        echo -e "${GREEN}${BOLD}✓ All checked servers are healthy${NC}"
    else
        echo -e "${RED}${BOLD}✗ One or more servers need attention${NC}"
    fi
}

print_json() {
    local json="{"

    if [ "$CHECK_BACKEND" = true ]; then
        json+="\"backend\":{"
        json+="\"port\":${BACKEND_PORT},"
        json+="\"status\":\"${BACKEND_STATUS}\","
        json+="\"pid\":${BACKEND_PID:-null},"
        json+="\"health_code\":\"${BACKEND_HEALTH_CODE:-null}\","
        json+="\"uptime\":\"${BACKEND_UPTIME:-null}\""
        json+="}"
    fi

    if [ "$CHECK_BACKEND" = true ] && [ "$CHECK_FRONTEND" = true ]; then
        json+=","
    fi

    if [ "$CHECK_FRONTEND" = true ]; then
        json+="\"frontend\":{"
        json+="\"port\":${FRONTEND_PORT},"
        json+="\"status\":\"${FRONTEND_STATUS}\","
        json+="\"pid\":${FRONTEND_PID:-null},"
        json+="\"uptime\":\"${FRONTEND_UPTIME:-null}\""
        json+="}"
    fi

    json+=",\"healthy\":$([ $OVERALL_STATUS -eq 0 ] && echo "true" || echo "false")}"

    echo "$json"
}

#-------------------------------------------------------------------------------
# Main Execution
#-------------------------------------------------------------------------------

if [ "$CHECK_BACKEND" = true ]; then
    check_backend_server
fi

if [ "$CHECK_FRONTEND" = true ]; then
    check_frontend_server
fi

if [ "$JSON_OUTPUT" = true ]; then
    print_json
elif [ "$VERBOSE" = true ]; then
    print_verbose
else
    print_simple
fi

exit $OVERALL_STATUS
