#!/bin/bash
#===============================================================================
# kill-servers.sh
#===============================================================================
# PURPOSE:
#   Stop all development servers (backend and frontend) without restarting them.
#   This is useful when you need to free up ports, stop background processes
#   before switching tasks, or shut down the development environment cleanly.
#
# BACKGROUND:
#   During development, servers may be left running in background processes.
#   This script provides a clean way to stop all server processes using multiple
#   identification patterns to ensure complete shutdown.
#
# USAGE:
#   ./scripts/kill-servers.sh                # Kill all servers (minimal output)
#   ./scripts/kill-servers.sh --verbose      # Show detailed progress
#   ./scripts/kill-servers.sh --backend      # Kill backend only
#   ./scripts/kill-servers.sh --frontend     # Kill frontend only
#   ./scripts/kill-servers.sh --force        # Use SIGKILL instead of SIGTERM
#   ./scripts/kill-servers.sh --dry-run      # Show what would be killed (no action)
#   ./scripts/kill-servers.sh --help         # Show this help message
#
# OUTPUT:
#   Default: Single result line (e.g., "Servers stopped" or "Backend stopped")
#   Verbose: Step-by-step progress with process details
#
# EXIT CODES:
#   0 - All target servers stopped successfully (or none were running)
#   1 - Failed to stop one or more servers
#   2 - Invalid arguments provided
#
# EXAMPLES:
#   # Stop everything before switching projects
#   ./scripts/kill-servers.sh
#
#   # See what's running before killing
#   ./scripts/kill-servers.sh --dry-run --verbose
#
#   # Force kill unresponsive servers
#   ./scripts/kill-servers.sh --force
#
# RELATED SCRIPTS:
#   - ensure-server-running.sh : Start server if not running
#   - restart-backend.sh       : Kill and restart backend in one step
#   - check-server-status.sh   : Check server health without changes
#
# AUTHOR: Generated from workflow analysis of December 8, 2025 sessions
# DATE: December 9, 2025
#===============================================================================

#-------------------------------------------------------------------------------
# Configuration
#-------------------------------------------------------------------------------

BACKEND_PORT=8420
BACKEND_NAME="Backend"

FRONTEND_PORT=5173
FRONTEND_NAME="Frontend"

# Process identification patterns
BACKEND_PATTERNS=(
    "node.*backend"
    "node.*server\.js"
    "node.*${BACKEND_PORT}"
)

FRONTEND_PATTERNS=(
    "vite"
    "node.*vite"
    "node.*${FRONTEND_PORT}"
)

KILL_WAIT_SECONDS=2
FORCE_WAIT_SECONDS=1

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

KILL_BACKEND=true
KILL_FRONTEND=true
FORCE_MODE=false
DRY_RUN=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --backend|-b)
            KILL_BACKEND=true
            KILL_FRONTEND=false
            shift
            ;;
        --frontend|-f)
            KILL_BACKEND=false
            KILL_FRONTEND=true
            shift
            ;;
        --force)
            FORCE_MODE=true
            shift
            ;;
        --dry-run|-n)
            DRY_RUN=true
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
# Output helpers
#-------------------------------------------------------------------------------

log() {
    if [ "$VERBOSE" = true ]; then
        echo -e "$@"
    fi
}

result() {
    echo -e "$@"
}

error() {
    echo -e "$@" >&2
}

#-------------------------------------------------------------------------------
# Helper Functions
#-------------------------------------------------------------------------------

get_pid_by_port() {
    local port=$1
    lsof -ti:"${port}" 2>/dev/null
}

get_pids_by_pattern() {
    local pattern=$1
    pgrep -f "${pattern}" 2>/dev/null | tr '\n' ' '
}

get_process_info() {
    local pid=$1
    ps -p "$pid" -o args= 2>/dev/null | head -c 60
}

kill_pid() {
    local pid=$1
    local signal=${2:-TERM}
    if [ "$signal" = "KILL" ]; then
        kill -9 "$pid" 2>/dev/null
    else
        kill "$pid" 2>/dev/null
    fi
}

collect_server_pids() {
    local port=$1
    shift
    local patterns=("$@")
    local all_pids=""

    local port_pid
    port_pid=$(get_pid_by_port "$port")
    if [ -n "$port_pid" ]; then
        all_pids="$port_pid"
    fi

    for pattern in "${patterns[@]}"; do
        local pattern_pids
        pattern_pids=$(get_pids_by_pattern "$pattern")
        if [ -n "$pattern_pids" ]; then
            all_pids="$all_pids $pattern_pids"
        fi
    done

    echo "$all_pids" | tr ' ' '\n' | sort -u | tr '\n' ' '
}

#-------------------------------------------------------------------------------
# Kill Functions
#-------------------------------------------------------------------------------

# kill_server: Kills all processes for a server type
# Args: $1 = server name, $2 = port, $3+ = patterns
# Returns: 0 if all killed, 1 if some remain
# Sets: KILLED_PIDS (for result output)
kill_server() {
    local name=$1
    local port=$2
    shift 2
    local patterns=("$@")

    log "${YELLOW}Stopping ${name}...${NC}"

    local pids
    pids=$(collect_server_pids "$port" "${patterns[@]}")
    pids=$(echo "$pids" | xargs)

    if [ -z "$pids" ]; then
        log "  ${CYAN}No processes found${NC}"
        KILLED_PIDS=""
        return 0
    fi

    log "  Found processes: ${CYAN}${pids}${NC}"

    for pid in $pids; do
        local cmd
        cmd=$(get_process_info "$pid")
        log "    PID ${pid}: ${cmd}"
    done

    if [ "$DRY_RUN" = true ]; then
        log "  ${BLUE}[DRY RUN] Would kill: ${pids}${NC}"
        KILLED_PIDS="$pids"
        return 0
    fi

    local signal="TERM"
    local wait_time=$KILL_WAIT_SECONDS
    if [ "$FORCE_MODE" = true ]; then
        signal="KILL"
        wait_time=$FORCE_WAIT_SECONDS
        log "  ${YELLOW}Using force kill (SIGKILL)${NC}"
    fi

    for pid in $pids; do
        kill_pid "$pid" "$signal"
    done

    sleep "$wait_time"

    local remaining
    remaining=$(collect_server_pids "$port" "${patterns[@]}")
    remaining=$(echo "$remaining" | xargs)

    if [ -n "$remaining" ]; then
        log "  ${RED}✗ Some processes still running: ${remaining}${NC}"
        KILLED_PIDS=""
        return 1
    fi

    log "  ${GREEN}✓ ${name} stopped${NC}"
    KILLED_PIDS="$pids"
    return 0
}

#-------------------------------------------------------------------------------
# Main Execution
#-------------------------------------------------------------------------------

log "${BLUE}=== Kill Servers ===${NC}"
if [ "$DRY_RUN" = true ]; then
    log "${CYAN}(Dry run mode - no processes will be killed)${NC}"
fi
log ""

RESULT=0
BACKEND_KILLED=""
FRONTEND_KILLED=""

if [ "$KILL_BACKEND" = true ]; then
    if kill_server "$BACKEND_NAME" "$BACKEND_PORT" "${BACKEND_PATTERNS[@]}"; then
        BACKEND_KILLED="$KILLED_PIDS"
    else
        RESULT=1
    fi
    log ""
fi

if [ "$KILL_FRONTEND" = true ]; then
    if kill_server "$FRONTEND_NAME" "$FRONTEND_PORT" "${FRONTEND_PATTERNS[@]}"; then
        FRONTEND_KILLED="$KILLED_PIDS"
    else
        RESULT=1
    fi
    log ""
fi

#-------------------------------------------------------------------------------
# Result Output
#-------------------------------------------------------------------------------

if [ "$DRY_RUN" = true ]; then
    # Dry run output
    if [ "$KILL_BACKEND" = true ] && [ "$KILL_FRONTEND" = true ]; then
        if [ -n "$BACKEND_KILLED" ] || [ -n "$FRONTEND_KILLED" ]; then
            result "Would kill: Backend(${BACKEND_KILLED:-none}) Frontend(${FRONTEND_KILLED:-none})"
        else
            result "No servers running"
        fi
    elif [ "$KILL_BACKEND" = true ]; then
        if [ -n "$BACKEND_KILLED" ]; then
            result "Would kill backend: PID ${BACKEND_KILLED}"
        else
            result "Backend not running"
        fi
    else
        if [ -n "$FRONTEND_KILLED" ]; then
            result "Would kill frontend: PID ${FRONTEND_KILLED}"
        else
            result "Frontend not running"
        fi
    fi
elif [ $RESULT -eq 0 ]; then
    # Success output
    if [ "$KILL_BACKEND" = true ] && [ "$KILL_FRONTEND" = true ]; then
        if [ -n "$BACKEND_KILLED" ] || [ -n "$FRONTEND_KILLED" ]; then
            result "Servers stopped"
        else
            result "No servers were running"
        fi
    elif [ "$KILL_BACKEND" = true ]; then
        if [ -n "$BACKEND_KILLED" ]; then
            result "Backend stopped (was PID ${BACKEND_KILLED})"
        else
            result "Backend was not running"
        fi
    else
        if [ -n "$FRONTEND_KILLED" ]; then
            result "Frontend stopped (was PID ${FRONTEND_KILLED})"
        else
            result "Frontend was not running"
        fi
    fi
else
    # Error output
    error "Failed to stop some servers (try --force)"
fi

exit $RESULT
