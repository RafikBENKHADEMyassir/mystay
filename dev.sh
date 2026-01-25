#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

RESET_DB=0
SKIP_DB=0
SKIP_MIGRATE=0
SKIP_SEED=0
SKIP_MOCKS=0

usage() {
  cat <<'EOF'
Usage: ./dev.sh [options]

Options:
  --reset-db     Drop + recreate schema, then seed (dev only)
  --skip-db      Do not run migrate/seed
  --no-migrate   Skip migrations
  --no-seed      Skip seed data
  --skip-mocks   Do not start Opera/SpaBooker mock servers
  -h, --help     Show this help

Defaults:
  Runs `npm run db:migrate` and `npm run db:seed`, then starts:
    - Opera PMS mock  (http://localhost:4010)
    - SpaBooker mock  (http://localhost:4011)
    - Backend API     (http://localhost:4000)
    - Worker          (notifications outbox)
    - Frontend        (http://localhost:3000)
    - Admin           (http://localhost:3001)

Demo Accounts:
  Platform Admin: admin@mystay.com / admin123
  Hotel Manager:  manager@fourseasons.demo / admin123
  Guest:          sophie.martin@email.com / admin123
  Quick Demo:     Use confirmation number "DEMO123456"

See demo.md for complete documentation.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --reset-db) RESET_DB=1 ;;
    --skip-db) SKIP_DB=1 ;;
    --no-migrate) SKIP_MIGRATE=1 ;;
    --no-seed) SKIP_SEED=1 ;;
    --skip-mocks) SKIP_MOCKS=1 ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
  shift
done

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    MyStay Development Server                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check for .env files
if [[ ! -f backend/.env ]]; then
  echo "⚠️  Warning: missing backend/.env (copy from backend/.env.example)"
  if [[ -f backend/.env.example ]]; then
    echo "   Creating from .env.example..."
    cp backend/.env.example backend/.env
  fi
fi
if [[ ! -f frontend/.env ]]; then
  echo "⚠️  Warning: missing frontend/.env (copy from frontend/.env.example)"
  if [[ -f frontend/.env.example ]]; then
    echo "   Creating from .env.example..."
    cp frontend/.env.example frontend/.env
  fi
fi
if [[ ! -f admin/.env ]]; then
  echo "⚠️  Warning: missing admin/.env (copy from admin/.env.example)"
  if [[ -f admin/.env.example ]]; then
    echo "   Creating from .env.example..."
    cp admin/.env.example admin/.env
  fi
fi

# Database setup
if [[ "$SKIP_DB" -eq 0 ]]; then
  if [[ "$RESET_DB" -eq 1 ]]; then
    echo "🗄️  Resetting database..."
    npm run db:reset
  else
    if [[ "$SKIP_MIGRATE" -eq 0 ]]; then
      echo "🗄️  Running migrations..."
      if ! npm run db:migrate; then
        echo "❌ Migration failed. Try: ./dev.sh --reset-db" >&2
        exit 1
      fi
    fi
    if [[ "$SKIP_SEED" -eq 0 ]]; then
      echo "🌱 Seeding database..."
      if ! npm run db:seed; then
        echo "❌ Seeding failed. Try: ./dev.sh --reset-db" >&2
        exit 1
      fi
    fi
  fi
fi

pids=()
stopping=0

stop_all() {
  if [[ "$stopping" -eq 1 ]]; then
    return
  fi
  stopping=1

  echo ""
  echo "🛑 Stopping all services..."
  for pid in "${pids[@]:-}"; do
    kill "$pid" >/dev/null 2>&1 || true
  done
  wait >/dev/null 2>&1 || true
  echo "✅ All services stopped."
}

trap stop_all INT TERM EXIT

echo ""
echo "🚀 Starting services..."
echo ""

# Start mock servers
if [[ "$SKIP_MOCKS" -eq 0 ]]; then
  echo "   🏨 Starting Opera PMS mock (port 4010)..."
  (npm run dev:mock:opera) &
  pids+=("$!")

  echo "   💆 Starting SpaBooker mock (port 4011)..."
  (npm run dev:mock:spabooker) &
  pids+=("$!")
fi

# Start backend
echo "   🔧 Starting Backend API (port 4000)..."
(npm run dev:backend) &
pids+=("$!")

# Start notifications worker
echo "   📧 Starting Notifications worker..."
(npm run dev:worker:notifications) &
pids+=("$!")

# Start frontend
echo "   🌐 Starting Frontend (port 3000)..."
(npm run dev:frontend) &
pids+=("$!")

# Start admin
echo "   👔 Starting Admin Dashboard (port 3001)..."
(npm run dev:admin) &
pids+=("$!")

# Wait for services to start
sleep 3

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                     Services Running                           ║"
echo "╠════════════════════════════════════════════════════════════════╣"
if [[ "$SKIP_MOCKS" -eq 0 ]]; then
echo "║  🏨 Opera PMS Mock:    http://localhost:4010                   ║"
echo "║  💆 SpaBooker Mock:    http://localhost:4011                   ║"
fi
echo "║  🔧 Backend API:       http://localhost:4000                   ║"
echo "║  🌐 Guest Frontend:    http://localhost:3000                   ║"
echo "║  👔 Admin Dashboard:   http://localhost:3001                   ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║                     Quick Start                                ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║  Guest App:     http://localhost:3000                          ║"
echo "║    → Quick demo: Use confirmation \"DEMO123456\"                 ║"
echo "║    → Full login: sophie.martin@email.com / admin123            ║"
echo "║                                                                ║"
echo "║  Admin Panel:   http://localhost:3001                          ║"
echo "║    → Platform:  admin@mystay.com / admin123                    ║"
echo "║    → Hotel:     manager@fourseasons.demo / admin123            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Press Ctrl+C to stop all services."
echo ""

wait
