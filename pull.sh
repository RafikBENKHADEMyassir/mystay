#!/usr/bin/env bash
set -Eeuo pipefail

# Incremental deployment script for already-provisioned servers.
# Pulls latest code, installs deps, runs migrations/build, and reloads PM2.

APP_DIR="${APP_DIR:-/var/www/mystay}"
BRANCH="${BRANCH:-main}"
APP_USER="${APP_USER:-${SUDO_USER:-$USER}}"

RUN_NPM_CI="${RUN_NPM_CI:-true}"
RUN_DB_MIGRATIONS="${RUN_DB_MIGRATIONS:-true}"
RUN_DB_SEED="${RUN_DB_SEED:-false}"
RUN_BUILD="${RUN_BUILD:-true}"

if [[ "${EUID}" -eq 0 ]]; then
  SUDO=""
else
  SUDO="sudo"
fi

log() {
  printf '[pull] %s\n' "$*"
}

fatal() {
  printf '[pull] ERROR: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'EOF'
Usage: ./pull.sh [options]

Options:
  --app-dir <path>         Deploy directory (default: /var/www/mystay)
  --branch <name>          Branch to deploy (default: main)
  --app-user <user>        Linux user running PM2/app processes
  --skip-install           Skip npm ci
  --skip-migrate           Skip DB migrations
  --seed-db                Run DB seed after migrations
  --skip-build             Skip frontend/admin builds
  -h, --help               Show help

Environment variables:
  APP_DIR, BRANCH, APP_USER, RUN_NPM_CI, RUN_DB_MIGRATIONS, RUN_DB_SEED, RUN_BUILD
EOF
}

as_app_user() {
  local cmd="$1"
  if [[ "$(id -un)" == "${APP_USER}" ]]; then
    bash -lc "${cmd}"
  else
    ${SUDO} -u "${APP_USER}" bash -lc "${cmd}"
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app-dir)
      APP_DIR="$2"
      shift 2
      ;;
    --branch)
      BRANCH="$2"
      shift 2
      ;;
    --app-user)
      APP_USER="$2"
      shift 2
      ;;
    --skip-install)
      RUN_NPM_CI="false"
      shift
      ;;
    --skip-migrate)
      RUN_DB_MIGRATIONS="false"
      shift
      ;;
    --seed-db)
      RUN_DB_SEED="true"
      shift
      ;;
    --skip-build)
      RUN_BUILD="false"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fatal "Unknown option: $1"
      ;;
  esac
done

[[ -d "${APP_DIR}/.git" ]] || fatal "Missing git checkout at ${APP_DIR}"
[[ -f "${APP_DIR}/ecosystem.config.cjs" ]] || fatal "Missing ${APP_DIR}/ecosystem.config.cjs (run deploy.sh first)"

log "Updating repository"
as_app_user "cd '${APP_DIR}' && git fetch origin '${BRANCH}' && git checkout '${BRANCH}' && git pull --ff-only origin '${BRANCH}'"

if [[ "${RUN_NPM_CI}" == "true" ]]; then
  log "Installing dependencies"
  as_app_user "cd '${APP_DIR}' && npm ci"
fi

if [[ "${RUN_DB_MIGRATIONS}" == "true" ]]; then
  log "Running DB migrations"
  as_app_user "cd '${APP_DIR}' && npm run db:migrate"
fi

if [[ "${RUN_DB_SEED}" == "true" ]]; then
  log "Running DB seed"
  as_app_user "cd '${APP_DIR}' && npm run db:seed"
fi

if [[ "${RUN_BUILD}" == "true" ]]; then
  log "Building frontend/admin"
  as_app_user "cd '${APP_DIR}' && npm run build:frontend && npm run build:admin"
fi

log "Reloading PM2 services"
as_app_user "cd '${APP_DIR}' && pm2 startOrReload ecosystem.config.cjs --update-env"
as_app_user "pm2 save"

log "Update completed"
log "Status: sudo -u ${APP_USER} pm2 status"
