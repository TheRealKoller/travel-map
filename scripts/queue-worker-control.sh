#!/bin/bash
# Queue Worker Control Script for TravelMap
# Usage: ./queue-worker-control.sh {start|stop|restart|status}

set -e

# Determine script and project directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PID_FILE="$PROJECT_DIR/storage/queue-worker.pid"
LOG_FILE="$PROJECT_DIR/storage/logs/queue-worker.log"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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
    nohup php artisan queue:work --tries=3 --timeout=90 >> "$LOG_FILE" 2>&1 &
    WORKER_PID=$!
    
    # Save PID to file
    echo $WORKER_PID > "$PID_FILE"
    
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
        PIDS=$(pgrep -f "php artisan queue:work" || true)
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
        
        # Wait for graceful shutdown (max 5 seconds)
        for i in {1..5}; do
            if ! ps -p "$PID" > /dev/null 2>&1; then
                break
            fi
            sleep 1
        done
        
        # Force kill if still running
        if ps -p "$PID" > /dev/null 2>&1; then
            echo -e "${YELLOW}Forcing queue worker to stop...${NC}"
            kill -9 "$PID" 2>/dev/null || true
        fi
        
        echo -e "${GREEN}✅ Queue worker stopped${NC}"
    else
        echo -e "${YELLOW}Queue worker not running (PID: $PID)${NC}"
    fi
    
    rm -f "$PID_FILE"
}

function restart() {
    echo -e "${YELLOW}Restarting queue worker...${NC}"
    stop
    sleep 1
    start
}

function status() {
    if [ ! -f "$PID_FILE" ]; then
        echo -e "${RED}❌ Queue worker not running (no PID file)${NC}"
        
        # Check for orphaned processes
        PIDS=$(pgrep -f "php artisan queue:work" || true)
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
        echo "  restart - Stop and restart the queue worker"
        echo "  status  - Show queue worker status and recent logs"
        exit 1
        ;;
esac

exit 0
