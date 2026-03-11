#!/usr/bin/env bash
set -Eeuo pipefail

# Quick fix: Add missing mock servers (Opera PMS + SpaBooker) to an
# already-deployed PM2 setup.  Run once on the remote server, then
# pull.sh will keep them running on future deploys.
#
# Usage:
#   ./fix-mocks.sh                          # defaults
#   ./fix-mocks.sh --app-dir /var/www/mystay --app-user deploy

APP_DIR="${APP_DIR:-/var/www/mystay}"
APP_USER="${APP_USER:-${SUDO_USER:-$USER}}"
PM2_PREFIX="${PM2_PREFIX:-mystay}"

if [[ "${EUID}" -eq 0 ]]; then
  SUDO=""
else
  SUDO="sudo"
fi

log() { printf '[fix-mocks] %s\n' "$*"; }
fatal() { printf '[fix-mocks] ERROR: %s\n' "$*" >&2; exit 1; }

as_app_user() {
  local cmd="$1"
  if [[ "$(id -un)" == "${APP_USER}" ]]; then
    bash -lc "${cmd}"
  else
    ${SUDO} -u "${APP_USER}" bash -lc "${cmd}"
  fi
}

usage() {
  cat <<'EOF'
Usage: ./fix-mocks.sh [options]

Adds Opera PMS mock (port 4010) and SpaBooker mock (port 4011) to PM2.
These mock servers are required for reservation creation, check-in, and
spa features to work.

Options:
  --app-dir <path>     Deploy directory (default: /var/www/mystay)
  --app-user <user>    Linux user running PM2 (default: current user)
  --pm2-prefix <name>  PM2 app name prefix (default: mystay)
  -h, --help           Show help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app-dir)    APP_DIR="$2";    shift 2 ;;
    --app-user)   APP_USER="$2";   shift 2 ;;
    --pm2-prefix) PM2_PREFIX="$2"; shift 2 ;;
    -h|--help)    usage; exit 0 ;;
    *)            fatal "Unknown option: $1" ;;
  esac
done

[[ -d "${APP_DIR}/mock-servers" ]] || fatal "Missing ${APP_DIR}/mock-servers (is APP_DIR correct?)"
[[ -f "${APP_DIR}/mock-servers/opera-mock.mjs" ]] || fatal "Missing opera-mock.mjs"
[[ -f "${APP_DIR}/mock-servers/spabooker-mock.mjs" ]] || fatal "Missing spabooker-mock.mjs"

log "Regenerating ecosystem.config.cjs with mock servers..."
cat > "${APP_DIR}/ecosystem.config.cjs" <<EOF_PM2
module.exports = {
  apps: [
    {
      name: "${PM2_PREFIX}-mock-opera",
      cwd: "${APP_DIR}",
      script: "mock-servers/opera-mock.mjs",
      env: { NODE_ENV: "production" }
    },
    {
      name: "${PM2_PREFIX}-mock-spabooker",
      cwd: "${APP_DIR}",
      script: "mock-servers/spabooker-mock.mjs",
      env: { NODE_ENV: "production" }
    },
    {
      name: "${PM2_PREFIX}-backend",
      cwd: "${APP_DIR}",
      script: "npm",
      args: "run start:backend",
      env: { NODE_ENV: "production" }
    },
    {
      name: "${PM2_PREFIX}-worker",
      cwd: "${APP_DIR}",
      script: "npm",
      args: "run worker:notifications",
      env: { NODE_ENV: "production" }
    },
    {
      name: "${PM2_PREFIX}-frontend",
      cwd: "${APP_DIR}",
      script: "npm",
      args: "run start:frontend",
      env: { NODE_ENV: "production" }
    },
    {
      name: "${PM2_PREFIX}-admin",
      cwd: "${APP_DIR}",
      script: "npm",
      args: "run start:admin",
      env: { NODE_ENV: "production" }
    }
  ]
};
EOF_PM2
${SUDO} chown "${APP_USER}:${APP_USER}" "${APP_DIR}/ecosystem.config.cjs" 2>/dev/null || true

log "Reloading PM2 with mock servers..."
as_app_user "cd '${APP_DIR}' && pm2 startOrReload ecosystem.config.cjs --update-env"
as_app_user "pm2 save"

log ""
log "Done! Mock servers added to PM2."
log ""
log "Verify with: sudo -u ${APP_USER} pm2 status"
log ""
log "Expected services:"
log "  ${PM2_PREFIX}-mock-opera      (port 4010)"
log "  ${PM2_PREFIX}-mock-spabooker  (port 4011)"
log "  ${PM2_PREFIX}-backend         (port 4000)"
log "  ${PM2_PREFIX}-worker"
log "  ${PM2_PREFIX}-frontend        (port 3000)"
log "  ${PM2_PREFIX}-admin           (port 3001)"
