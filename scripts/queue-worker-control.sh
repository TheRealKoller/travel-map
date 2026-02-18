#!/bin/bash
# Queue Worker Control Script for TravelMap
# Usage: ./queue-worker-control.sh {start|stop|restart|status}

# Note: Do not use 'set -e' here; this script intentionally tolerates some command failures.

# Determine script and project directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
# PID file stored in storage/framework following Laravel conventions for runtime files
PID_FILE="$PROJECT_DIR/storage/framework/queue-worker.pid"
LOG_FILE="$PROJECT_DIR/storage/logs/queue-worker.log"

# Ensure directories exist
mkdir -p "$(dirname "$PID_FILE")"
mkdir -p "$(dirname "$LOG_FILE")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Note: This log file will grow over time. Consider implementing log rotation via:
# - Server-side logrotate configuration
# - Laravel's daily logging (LOG_CHANNEL=daily)
# - Manual archival of old logs in this script

function start() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo -e "${YELLOW}Queue worker is already running (PID: $PID)${NC}"
            return 0
        else
            echo -e "${YELLOW}Stale PID file found, removing...${NC}"
            rm -f "$PID_FILE"
        fi
    fi

    echo -e "${GREEN}Starting queue worker...${NC}"
    cd "$PROJECT_DIR"
    
    # Start queue worker in background with nohup
    # Production options:
    # --connection=database: Explicitly use database queue connection
    # --queue=default: Process jobs from the default queue
    # --sleep=3: Wait 3 seconds when no jobs available (prevents CPU spinning)
    # --tries=3: Retry failed jobs up to 3 times
    # --max-jobs=1000: Restart worker after 1000 jobs (prevents memory leaks)
    # --timeout=60: Job timeout in seconds. MUST be less than retry_after (default 90s)
    #                to prevent job overlap. Jobs running longer than 60s will be terminated.
    nohup php artisan queue:work --connection=database --queue=default --sleep=3 --tries=3 --max-jobs=1000 --timeout=60 >> "$LOG_FILE" 2>&1 &
    WORKER_PID=$!
    
    # Save PID to file
    echo "$WORKER_PID" > "$PID_FILE"
    
    # Give it a moment to start
    sleep 1
    
    # Verify it's running
    if ps -p "$WORKER_PID" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Queue worker started successfully (PID: $WORKER_PID)${NC}"
        echo -e "${GREEN}   Log file: $LOG_FILE${NC}"
    else
        echo -e "${RED}❌ Failed to start queue worker${NC}"
        rm -f "$PID_FILE"
        return 1
    fi
}

function stop() {
    if [ ! -f "$PID_FILE" ]; then
        echo -e "${YELLOW}No PID file found. Checking for running queue workers...${NC}"
        
        # Try to find and kill any running queue workers
        # More specific pattern to avoid matching unrelated processes
        PIDS=$(pgrep -f "php artisan queue:work --connection=database" || true)
        if [ -z "$PIDS" ]; then
            echo -e "${YELLOW}No queue workers running${NC}"
            return 0
        else
            echo -e "${YELLOW}Found queue workers, stopping them...${NC}"
            echo "$PIDS" | xargs kill -TERM 2>/dev/null || true
            sleep 2
            echo -e "${GREEN}✅ Queue workers stopped${NC}"
            return 0
        fi
    fi

    PID=$(cat "$PID_FILE")
    
    if ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}Stopping queue worker (PID: $PID)...${NC}"
        kill -TERM "$PID" 2>/dev/null || true
        
        # Wait for graceful shutdown (max 65 seconds to accommodate 60s job timeout)
        # This allows running jobs to complete before force-killing
        for i in {1..65}; do
            if ! ps -p "$PID" > /dev/null 2>&1; then
                break
            fi
            sleep 1
        done
        
        # Force kill if still running after grace period
        if ps -p "$PID" > /dev/null 2>&1; then
            echo -e "${YELLOW}Worker did not stop gracefully after 65s, forcing shutdown...${NC}"
            kill -9 "$PID" 2>/dev/null || true
        fi
        
        echo -e "${GREEN}✅ Queue worker stopped${NC}"
    else
        echo -e "${YELLOW}Queue worker not running (PID: $PID)${NC}"
    fi
    
    rm -f "$PID_FILE"
}

function restart() {
    echo -e "${YELLOW}Restarting queue worker gracefully...${NC}"

    # If we have a PID file and the process is running, ask Laravel to restart workers gracefully
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")

        if ps -p "$PID" > /dev/null 2>&1; then
            # Trigger Laravel's graceful queue restart mechanism
            (
                cd "$PROJECT_DIR"
                php artisan queue:restart >> "$LOG_FILE" 2>&1
            )

            echo -e "${YELLOW}Waiting for current queue worker (PID: $PID) to finish current jobs...${NC}"

            # Wait up to 65 seconds for the worker to exit gracefully (matches stop() timeout)
            # This allows current jobs to complete (60s timeout + 5s buffer)
            MAX_WAIT=65
            WAITED=0
            while ps -p "$PID" > /dev/null 2>&1 && [ "$WAITED" -lt "$MAX_WAIT" ]; do
                sleep 1
                WAITED=$((WAITED + 1))
            done

            if ps -p "$PID" > /dev/null 2>&1; then
                echo -e "${YELLOW}Worker PID $PID still running after ${MAX_WAIT}s; forcing shutdown...${NC}"
                kill -9 "$PID" 2>/dev/null || true
                rm -f "$PID_FILE"
            else
                echo -e "${GREEN}Previous worker PID $PID stopped gracefully.${NC}"
                rm -f "$PID_FILE"
            fi
        else
            echo -e "${YELLOW}No running worker found for PID file (PID: $PID). Starting a new worker...${NC}"
            rm -f "$PID_FILE"
        fi
    else
        echo -e "${YELLOW}No PID file found; starting a new worker...${NC}"
    fi
    
    # Start new worker
    start
}

function status() {
    if [ ! -f "$PID_FILE" ]; then
        echo -e "${RED}❌ Queue worker not running (no PID file)${NC}"
        
        # Check for orphaned processes - more specific pattern
        PIDS=$(pgrep -f "php artisan queue:work --connection=database" || true)
        if [ -n "$PIDS" ]; then
            echo -e "${YELLOW}⚠️  Found orphaned queue worker processes:${NC}"
            echo "$PIDS" | while read pid; do
                echo -e "   PID: $pid"
            done
            echo -e "${YELLOW}   Run 'stop' to clean them up${NC}"
        fi
        return 1
    fi

    PID=$(cat "$PID_FILE")
    
    if ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Queue worker is running${NC}"
        echo -e "   PID: $PID"
        echo -e "   Log: $LOG_FILE"
        
        # Show last 5 lines of log
        if [ -f "$LOG_FILE" ]; then
            echo -e "\n${YELLOW}Recent log entries:${NC}"
            tail -n 5 "$LOG_FILE" | sed 's/^/   /'
        fi
    else
        echo -e "${RED}❌ Queue worker not running (stale PID: $PID)${NC}"
        echo -e "${YELLOW}   Run 'start' to restart it${NC}"
        return 1
    fi
}

# Main script logic
case "${1:-}" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the queue worker in background"
        echo "  stop    - Stop all running queue workers"
        echo "  restart - Stop and restart the queue worker gracefully"
        echo "  status  - Show queue worker status and recent logs"
        exit 1
        ;;
esac

exit 0
