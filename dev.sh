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
    - opera mock  (http://localhost:4010)
    - spabooker mock (http://localhost:4011)
    - backend  (http://localhost:4000)
    - worker   (notifications outbox)
    - frontend (http://localhost:3000)
    - admin    (http://localhost:3001)
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

if [[ ! -f backend/.env ]]; then
  echo "Warning: missing backend/.env (copy from backend/.env.example)." >&2
fi
if [[ ! -f frontend/.env ]]; then
  echo "Warning: missing frontend/.env (copy from frontend/.env.example)." >&2
fi
if [[ ! -f admin/.env ]]; then
  echo "Warning: missing admin/.env (copy from admin/.env.example)." >&2
fi

if [[ "$SKIP_DB" -eq 0 ]]; then
  if [[ "$RESET_DB" -eq 1 ]]; then
    echo "Resetting database…"
    npm run db:reset
  else
    if [[ "$SKIP_MIGRATE" -eq 0 ]]; then
      echo "Migrating database…"
      if ! npm run db:migrate; then
        echo "Migration failed. If you are upgrading from the legacy schema, rerun with: ./dev.sh --reset-db" >&2
        exit 1
      fi
    fi
    if [[ "$SKIP_SEED" -eq 0 ]]; then
      echo "Seeding database…"
      if ! npm run db:seed; then
        echo "Seeding failed. If you changed schema recently, rerun with: ./dev.sh --reset-db" >&2
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
  echo "Stopping dev servers…"
  for pid in "${pids[@]:-}"; do
    kill "$pid" >/dev/null 2>&1 || true
  done
  wait >/dev/null 2>&1 || true
}

trap stop_all INT TERM EXIT

if [[ "$SKIP_MOCKS" -eq 0 ]]; then
  echo "Starting Opera PMS mock…"
  (npm run dev:mock:opera) &
  pids+=("$!")

  echo "Starting SpaBooker mock…"
  (npm run dev:mock:spabooker) &
  pids+=("$!")
fi

echo "Starting backend…"
(npm run dev:backend) &
pids+=("$!")

echo "Starting notifications worker…"
(npm run dev:worker:notifications) &
pids+=("$!")

echo "Starting frontend…"
(npm run dev:frontend) &
pids+=("$!")

echo "Starting admin…"
(npm run dev:admin) &
pids+=("$!")

echo ""
echo "Dev servers running:"
if [[ "$SKIP_MOCKS" -eq 0 ]]; then
  echo "  - Opera mock: http://localhost:4010 (health: http://localhost:4010/health)"
  echo "  - SpaBooker mock: http://localhost:4011 (health: http://localhost:4011/health)"
fi
echo "  - Backend:  http://localhost:4000 (health: http://localhost:4000/health)"
echo "  - Worker:   notifications outbox (logs in this terminal)"
echo "  - Frontend: http://localhost:3000"
echo "  - Admin:    http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop."

wait
