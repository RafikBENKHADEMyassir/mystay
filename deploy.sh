#!/usr/bin/env bash
set -Eeuo pipefail

# First-time deployment script for a fresh Ubuntu droplet.
# It installs dependencies, clones/updates the repo, builds apps,
# configures PM2, and optionally sets up Nginx + SSL.

REPO_URL="${REPO_URL:-}"
BRANCH="${BRANCH:-main}"
APP_DIR="${APP_DIR:-/var/www/mystay}"
APP_USER="${APP_USER:-${SUDO_USER:-$USER}}"
APP_GROUP="${APP_GROUP:-$APP_USER}"
NODE_MAJOR="${NODE_MAJOR:-20}"

INSTALL_POSTGRES="${INSTALL_POSTGRES:-true}"
PG_DB="${PG_DB:-mystay}"
PG_USER="${PG_USER:-postgres}"
PG_PASSWORD="${PG_PASSWORD:-postgres}"

RUN_DB_MIGRATIONS="${RUN_DB_MIGRATIONS:-true}"
RUN_DB_SEED="${RUN_DB_SEED:-false}"

SETUP_NGINX="${SETUP_NGINX:-true}"
FRONTEND_DOMAIN="${FRONTEND_DOMAIN:-}"
ADMIN_DOMAIN="${ADMIN_DOMAIN:-}"
API_DOMAIN="${API_DOMAIN:-}"

ENABLE_SSL="${ENABLE_SSL:-false}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}"

CONFIGURE_UFW="${CONFIGURE_UFW:-false}"
PM2_PREFIX="${PM2_PREFIX:-mystay}"

INTERACTIVE="${INTERACTIVE:-auto}"
GIT_AUTH_METHOD="${GIT_AUTH_METHOD:-}"
GIT_AUTH_USERNAME="${GIT_AUTH_USERNAME:-}"
GIT_AUTH_TOKEN="${GIT_AUTH_TOKEN:-}"
STORE_GIT_CREDENTIALS="${STORE_GIT_CREDENTIALS:-false}"
GENERATE_SSH_KEY="${GENERATE_SSH_KEY:-true}"

if [[ "${EUID}" -eq 0 ]]; then
  SUDO=""
else
  SUDO="sudo"
fi

log() {
  printf '[deploy] %s\n' "$*"
}

fatal() {
  printf '[deploy] ERROR: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'EOF_USAGE'
Usage: ./deploy.sh [options]

Modes:
  - Interactive wizard (recommended on fresh droplets): run with no flags
  - Non-interactive: pass all required flags/env values

Core options:
  --repo <url>                 Git repository URL (HTTPS or SSH)
  --branch <name>              Git branch (default: main)
  --app-dir <path>             Deploy directory (default: /var/www/mystay)
  --app-user <user>            Linux user owning app files/processes
  --app-group <group>          Linux group owning app files/processes
  --node-major <version>       Node.js major version (default: 20)

Interactive behavior:
  --interactive                Force interactive wizard
  --non-interactive            Disable wizard and require all inputs upfront

Git auth options:
  --git-auth <mode>            one of: none, https-token, ssh
  --git-username <name>        username for https-token auth (defaults to x-access-token for github.com)
  --git-token <token>          personal access token for https-token auth
  --store-git-credentials      store HTTPS credentials in ~/.git-credentials
  --generate-ssh-key           generate/show SSH key for deploy-key setup (default: true)

Database options:
  --skip-postgres              Skip Postgres installation and provisioning
  --pg-db <name>               Postgres database name (default: mystay)
  --pg-user <name>             Postgres user (default: postgres)
  --pg-password <password>     Postgres password (default: postgres)
  --skip-migrate               Skip DB migrations
  --seed-db                    Run DB seed after migrations

Web/server options:
  --skip-nginx                 Skip Nginx config
  --frontend-domain <host>     Public domain for guest frontend
  --admin-domain <host>        Public domain for admin app
  --api-domain <host>          Public domain for backend API
  --enable-ssl                 Run certbot (requires domains + --email)
  --email <email>              Email for Let's Encrypt
  --configure-ufw              Open SSH + Nginx and enable UFW
  -h, --help                   Show this help

Environment variables can also be used:
  REPO_URL, BRANCH, APP_DIR, APP_USER, APP_GROUP, NODE_MAJOR,
  INSTALL_POSTGRES, PG_DB, PG_USER, PG_PASSWORD,
  RUN_DB_MIGRATIONS, RUN_DB_SEED, SETUP_NGINX,
  FRONTEND_DOMAIN, ADMIN_DOMAIN, API_DOMAIN,
  ENABLE_SSL, LETSENCRYPT_EMAIL, CONFIGURE_UFW, PM2_PREFIX,
  INTERACTIVE, GIT_AUTH_METHOD, GIT_AUTH_USERNAME, GIT_AUTH_TOKEN,
  STORE_GIT_CREDENTIALS, GENERATE_SSH_KEY
EOF_USAGE
}

as_app_user() {
  local cmd="$1"
  if [[ "$(id -un)" == "${APP_USER}" ]]; then
    bash -lc "${cmd}"
  else
    ${SUDO} -u "${APP_USER}" bash -lc "${cmd}"
  fi
}

set_env_value() {
  local file="$1"
  local key="$2"
  local value="$3"
  if grep -q "^${key}=" "${file}"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "${file}"
  else
    printf '%s=%s\n' "${key}" "${value}" >> "${file}"
  fi
}

random_secret() {
  openssl rand -hex 32
}

normalize_bool_value() {
  local raw="${1:-}"
  case "${raw,,}" in
    true|1|yes|y|on)
      printf 'true'
      ;;
    false|0|no|n|off)
      printf 'false'
      ;;
    *)
      return 1
      ;;
  esac
}

normalize_bool_var() {
  local var_name="$1"
  local current_value="${!var_name:-}"
  local normalized
  normalized="$(normalize_bool_value "${current_value}")" || fatal "Invalid boolean value for ${var_name}: ${current_value}"
  printf -v "${var_name}" '%s' "${normalized}"
}

prompt_text() {
  local var_name="$1"
  local question="$2"
  local default_value="${3:-}"
  local answer=""

  if [[ -n "${default_value}" ]]; then
    read -r -p "${question} [${default_value}]: " answer
  else
    read -r -p "${question}: " answer
  fi

  if [[ -z "${answer}" ]]; then
    answer="${default_value}"
  fi
  printf -v "${var_name}" '%s' "${answer}"
}

prompt_secret() {
  local var_name="$1"
  local question="$2"
  local answer=""

  while [[ -z "${answer}" ]]; do
    read -r -s -p "${question}: " answer
    printf '\n'
  done
  printf -v "${var_name}" '%s' "${answer}"
}

prompt_yes_no() {
  local var_name="$1"
  local question="$2"
  local default_value="$3"
  local default_normalized
  local hint
  local answer
  local result

  default_normalized="$(normalize_bool_value "${default_value}")" || default_normalized="false"
  if [[ "${default_normalized}" == "true" ]]; then
    hint="Y/n"
  else
    hint="y/N"
  fi

  while true; do
    read -r -p "${question} [${hint}]: " answer
    if [[ -z "${answer}" ]]; then
      result="${default_normalized}"
      break
    fi
    case "${answer,,}" in
      y|yes)
        result="true"
        break
        ;;
      n|no)
        result="false"
        break
        ;;
      *)
        printf 'Please answer y or n.\n'
        ;;
    esac
  done

  printf -v "${var_name}" '%s' "${result}"
}

extract_git_host() {
  local url="$1"
  if [[ "${url}" =~ ^https?://([^/]+)/.+$ ]]; then
    printf '%s\n' "${BASH_REMATCH[1]}"
    return 0
  fi
  if [[ "${url}" =~ ^git@([^:]+):.+$ ]]; then
    printf '%s\n' "${BASH_REMATCH[1]}"
    return 0
  fi
  if [[ "${url}" =~ ^ssh://git@([^/]+)/.+$ ]]; then
    printf '%s\n' "${BASH_REMATCH[1]}"
    return 0
  fi
  return 1
}

to_ssh_repo_url() {
  local url="$1"
  if [[ "${url}" =~ ^https?://([^/]+)/(.+)$ ]]; then
    printf 'git@%s:%s\n' "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}"
    return 0
  fi
  if [[ "${url}" =~ ^ssh://git@([^/]+)/(.+)$ ]]; then
    printf 'git@%s:%s\n' "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}"
    return 0
  fi
  printf '%s\n' "${url}"
}

to_https_repo_url() {
  local url="$1"
  if [[ "${url}" =~ ^git@([^:]+):(.+)$ ]]; then
    printf 'https://%s/%s\n' "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}"
    return 0
  fi
  if [[ "${url}" =~ ^ssh://git@([^/]+)/(.+)$ ]]; then
    printf 'https://%s/%s\n' "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}"
    return 0
  fi
  printf '%s\n' "${url}"
}

run_git_https_authenticated() {
  local cmd="$1"
  local askpass
  local status

  [[ -n "${GIT_AUTH_TOKEN}" ]] || fatal "GIT token is required for https-token mode"

  askpass="$(mktemp /tmp/mystay-git-askpass.XXXXXX)"
  cat > "${askpass}" <<'EOF_ASKPASS'
#!/usr/bin/env bash
case "$1" in
  *sername*) printf '%s\n' "${GIT_AUTH_USERNAME}" ;;
  *) printf '%s\n' "${GIT_AUTH_TOKEN}" ;;
esac
EOF_ASKPASS
  chmod 700 "${askpass}"
  ${SUDO} chown "${APP_USER}:${APP_GROUP}" "${askpass}" >/dev/null 2>&1 || true

  set +e
  if [[ "$(id -un)" == "${APP_USER}" ]]; then
    env \
      GIT_TERMINAL_PROMPT=0 \
      GIT_ASKPASS="${askpass}" \
      GIT_AUTH_USERNAME="${GIT_AUTH_USERNAME}" \
      GIT_AUTH_TOKEN="${GIT_AUTH_TOKEN}" \
      bash -lc "${cmd}"
    status=$?
  else
    ${SUDO} -u "${APP_USER}" env \
      GIT_TERMINAL_PROMPT=0 \
      GIT_ASKPASS="${askpass}" \
      GIT_AUTH_USERNAME="${GIT_AUTH_USERNAME}" \
      GIT_AUTH_TOKEN="${GIT_AUTH_TOKEN}" \
      bash -lc "${cmd}"
    status=$?
  fi
  set -e

  rm -f "${askpass}"
  return "${status}"
}

run_git_command_as_app_user() {
  local cmd="$1"
  if [[ "${GIT_AUTH_METHOD}" == "https-token" ]]; then
    run_git_https_authenticated "${cmd}"
  else
    as_app_user "${cmd}"
  fi
}

store_git_https_credentials() {
  local host="$1"
  local app_home
  local cred_file
  local entry
  local tmp_file

  [[ -n "${host}" ]] || return 0

  app_home="$(eval echo "~${APP_USER}")"
  cred_file="${app_home}/.git-credentials"
  entry="https://${GIT_AUTH_USERNAME}:${GIT_AUTH_TOKEN}@${host}"
  tmp_file="$(mktemp /tmp/mystay-git-cred.XXXXXX)"

  printf '%s\n' "${entry}" > "${tmp_file}"
  ${SUDO} chown "${APP_USER}:${APP_GROUP}" "${tmp_file}" >/dev/null 2>&1 || true

  as_app_user "git config --global credential.helper store"
  as_app_user "touch '${cred_file}' && chmod 600 '${cred_file}'"
  as_app_user "cat '${tmp_file}' >> '${cred_file}'"

  rm -f "${tmp_file}"
}

setup_ssh_for_git() {
  local host="$1"
  local app_home
  local ssh_dir
  local key_file
  local known_hosts_file

  app_home="$(eval echo "~${APP_USER}")"
  ssh_dir="${app_home}/.ssh"
  key_file="${ssh_dir}/id_ed25519"
  known_hosts_file="${ssh_dir}/known_hosts"

  as_app_user "mkdir -p '${ssh_dir}' && chmod 700 '${ssh_dir}'"

  if [[ ! -f "${key_file}" ]]; then
    log "Generating SSH key for ${APP_USER}"
    as_app_user "ssh-keygen -t ed25519 -C '${APP_USER}@$(hostname)' -f '${key_file}' -N ''"
  fi

  as_app_user "touch '${known_hosts_file}' && chmod 600 '${known_hosts_file}'"
  if [[ -n "${host}" ]]; then
    as_app_user "ssh-keyscan -H '${host}' >> '${known_hosts_file}' 2>/dev/null || true"
  fi

  if [[ "${INTERACTIVE}" == "true" ]]; then
    log "Add this SSH public key as a read-only deploy key in your git provider:"
    as_app_user "cat '${key_file}.pub'"
    printf '\n'
    read -r -p "Press Enter after adding the key..."
  fi
}

interactive_wizard() {
  local auth_choice=""
  local convert_to_https=""
  local proceed="true"

  log "Interactive setup enabled"

  prompt_text REPO_URL "Repository URL (HTTPS or SSH)" "${REPO_URL}"
  [[ -n "${REPO_URL}" ]] || fatal "Repository URL is required"

  prompt_text BRANCH "Git branch" "${BRANCH}"
  prompt_text APP_DIR "Application directory" "${APP_DIR}"
  prompt_text APP_USER "Linux app user" "${APP_USER}"
  prompt_text APP_GROUP "Linux app group" "${APP_GROUP}"
  prompt_text NODE_MAJOR "Node.js major version" "${NODE_MAJOR}"

  if [[ -z "${GIT_AUTH_METHOD}" ]]; then
    cat <<'EOF_GIT_AUTH'
[deploy] Git authentication method:
  1) HTTPS + personal access token (recommended on fresh droplet)
  2) SSH deploy key
  3) No auth (public repo)
EOF_GIT_AUTH
    read -r -p "Choose [1/2/3] (default: 1): " auth_choice
    case "${auth_choice}" in
      ""|1)
        GIT_AUTH_METHOD="https-token"
        ;;
      2)
        GIT_AUTH_METHOD="ssh"
        ;;
      3)
        GIT_AUTH_METHOD="none"
        ;;
      *)
        fatal "Invalid git auth choice: ${auth_choice}"
        ;;
    esac
  fi

  if [[ "${GIT_AUTH_METHOD}" == "https-token" ]]; then
    if [[ "${REPO_URL}" != https://* ]]; then
      prompt_yes_no convert_to_https "Convert repository URL to HTTPS for token auth?" "true"
      if [[ "${convert_to_https}" == "true" ]]; then
        REPO_URL="$(to_https_repo_url "${REPO_URL}")"
      else
        fatal "https-token mode requires an HTTPS repository URL"
      fi
    fi

    if [[ -z "${GIT_AUTH_TOKEN}" ]]; then
      prompt_secret GIT_AUTH_TOKEN "Git personal access token"
    fi

    if [[ -z "${GIT_AUTH_USERNAME}" ]]; then
      if [[ "$(extract_git_host "${REPO_URL}" || true)" != "github.com" ]]; then
        prompt_text GIT_AUTH_USERNAME "Git username" "${GIT_AUTH_USERNAME}"
      fi
    fi

    prompt_yes_no STORE_GIT_CREDENTIALS "Store git credentials for future pulls on this server?" "${STORE_GIT_CREDENTIALS}"
  fi

  if [[ "${GIT_AUTH_METHOD}" == "ssh" ]]; then
    REPO_URL="$(to_ssh_repo_url "${REPO_URL}")"
    prompt_yes_no GENERATE_SSH_KEY "Generate SSH key if missing and show it now?" "${GENERATE_SSH_KEY}"
  fi

  prompt_yes_no INSTALL_POSTGRES "Install and configure PostgreSQL?" "${INSTALL_POSTGRES}"
  if [[ "${INSTALL_POSTGRES}" == "true" ]]; then
    prompt_text PG_DB "Postgres database name" "${PG_DB}"
    prompt_text PG_USER "Postgres user" "${PG_USER}"
    prompt_secret PG_PASSWORD "Postgres password"
  fi

  prompt_yes_no RUN_DB_MIGRATIONS "Run database migrations during deploy?" "${RUN_DB_MIGRATIONS}"
  prompt_yes_no RUN_DB_SEED "Run DB seed data (demo/dev)?" "${RUN_DB_SEED}"

  prompt_yes_no SETUP_NGINX "Configure Nginx reverse proxy?" "${SETUP_NGINX}"
  if [[ "${SETUP_NGINX}" == "true" ]]; then
    prompt_text FRONTEND_DOMAIN "Frontend domain (leave empty to skip)" "${FRONTEND_DOMAIN}"
    prompt_text ADMIN_DOMAIN "Admin domain (leave empty to skip)" "${ADMIN_DOMAIN}"
    prompt_text API_DOMAIN "API domain (leave empty to skip)" "${API_DOMAIN}"

    if [[ -n "${FRONTEND_DOMAIN}${ADMIN_DOMAIN}${API_DOMAIN}" ]]; then
      prompt_yes_no ENABLE_SSL "Enable HTTPS with Let's Encrypt?" "${ENABLE_SSL}"
      if [[ "${ENABLE_SSL}" == "true" ]]; then
        prompt_text LETSENCRYPT_EMAIL "Let's Encrypt email" "${LETSENCRYPT_EMAIL}"
      fi
    else
      ENABLE_SSL="false"
    fi
  else
    ENABLE_SSL="false"
  fi

  prompt_yes_no CONFIGURE_UFW "Configure UFW firewall (allow SSH + Nginx)?" "${CONFIGURE_UFW}"

  cat <<EOF_SUMMARY

[deploy] Summary:
  repo:              ${REPO_URL}
  branch:            ${BRANCH}
  app-dir:           ${APP_DIR}
  app-user/group:    ${APP_USER}:${APP_GROUP}
  git-auth:          ${GIT_AUTH_METHOD}
  postgres install:  ${INSTALL_POSTGRES}
  db migrate/seed:   ${RUN_DB_MIGRATIONS}/${RUN_DB_SEED}
  nginx:             ${SETUP_NGINX}
  frontend domain:   ${FRONTEND_DOMAIN:-<none>}
  admin domain:      ${ADMIN_DOMAIN:-<none>}
  api domain:        ${API_DOMAIN:-<none>}
  ssl:               ${ENABLE_SSL}
  ufw:               ${CONFIGURE_UFW}
EOF_SUMMARY

  prompt_yes_no proceed "Proceed with deployment?" "true"
  if [[ "${proceed}" != "true" ]]; then
    log "Deployment cancelled"
    exit 0
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)
      REPO_URL="$2"
      shift 2
      ;;
    --branch)
      BRANCH="$2"
      shift 2
      ;;
    --app-dir)
      APP_DIR="$2"
      shift 2
      ;;
    --app-user)
      APP_USER="$2"
      shift 2
      ;;
    --app-group)
      APP_GROUP="$2"
      shift 2
      ;;
    --node-major)
      NODE_MAJOR="$2"
      shift 2
      ;;
    --interactive)
      INTERACTIVE="true"
      shift
      ;;
    --non-interactive)
      INTERACTIVE="false"
      shift
      ;;
    --git-auth)
      GIT_AUTH_METHOD="$2"
      shift 2
      ;;
    --git-username)
      GIT_AUTH_USERNAME="$2"
      shift 2
      ;;
    --git-token)
      GIT_AUTH_TOKEN="$2"
      shift 2
      ;;
    --store-git-credentials)
      STORE_GIT_CREDENTIALS="true"
      shift
      ;;
    --generate-ssh-key)
      GENERATE_SSH_KEY="true"
      shift
      ;;
    --skip-postgres)
      INSTALL_POSTGRES="false"
      shift
      ;;
    --pg-db)
      PG_DB="$2"
      shift 2
      ;;
    --pg-user)
      PG_USER="$2"
      shift 2
      ;;
    --pg-password)
      PG_PASSWORD="$2"
      shift 2
      ;;
    --skip-migrate)
      RUN_DB_MIGRATIONS="false"
      shift
      ;;
    --seed-db)
      RUN_DB_SEED="true"
      shift
      ;;
    --skip-nginx)
      SETUP_NGINX="false"
      shift
      ;;
    --frontend-domain)
      FRONTEND_DOMAIN="$2"
      shift 2
      ;;
    --admin-domain)
      ADMIN_DOMAIN="$2"
      shift 2
      ;;
    --api-domain)
      API_DOMAIN="$2"
      shift 2
      ;;
    --enable-ssl)
      ENABLE_SSL="true"
      shift
      ;;
    --email)
      LETSENCRYPT_EMAIL="$2"
      shift 2
      ;;
    --configure-ufw)
      CONFIGURE_UFW="true"
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

if [[ "${INTERACTIVE}" == "auto" ]]; then
  if [[ -t 0 && -t 1 && -z "${REPO_URL}" ]]; then
    INTERACTIVE="true"
  else
    INTERACTIVE="false"
  fi
fi

if [[ "${INTERACTIVE}" != "true" && "${INTERACTIVE}" != "false" ]]; then
  fatal "INTERACTIVE must be true, false, or auto"
fi

for bool_var in \
  INSTALL_POSTGRES RUN_DB_MIGRATIONS RUN_DB_SEED SETUP_NGINX ENABLE_SSL \
  CONFIGURE_UFW STORE_GIT_CREDENTIALS GENERATE_SSH_KEY; do
  normalize_bool_var "${bool_var}"
done

if [[ "${INTERACTIVE}" == "true" ]]; then
  interactive_wizard
fi

for bool_var in \
  INSTALL_POSTGRES RUN_DB_MIGRATIONS RUN_DB_SEED SETUP_NGINX ENABLE_SSL \
  CONFIGURE_UFW STORE_GIT_CREDENTIALS GENERATE_SSH_KEY; do
  normalize_bool_var "${bool_var}"
done

[[ -n "${REPO_URL}" ]] || fatal "Missing repository URL. Use --repo <url> or interactive mode"
[[ -n "${APP_USER}" ]] || fatal "APP_USER cannot be empty"
[[ -n "${APP_GROUP}" ]] || fatal "APP_GROUP cannot be empty"

case "${GIT_AUTH_METHOD}" in
  "")
    if [[ "${REPO_URL}" == git@* || "${REPO_URL}" == ssh://* ]]; then
      GIT_AUTH_METHOD="ssh"
    else
      GIT_AUTH_METHOD="none"
    fi
    ;;
  none|https-token|ssh)
    ;;
  *)
    fatal "Invalid --git-auth value: ${GIT_AUTH_METHOD} (allowed: none, https-token, ssh)"
    ;;
esac

if [[ "${GIT_AUTH_METHOD}" == "ssh" ]]; then
  REPO_URL="$(to_ssh_repo_url "${REPO_URL}")"
fi

REPO_HOST="$(extract_git_host "${REPO_URL}" || true)"
[[ -n "${REPO_HOST}" ]] || fatal "Could not parse git host from REPO_URL: ${REPO_URL}"

if [[ "${GIT_AUTH_METHOD}" == "https-token" ]]; then
  if [[ "${REPO_URL}" != https://* ]]; then
    fatal "https-token mode requires HTTPS repository URL"
  fi
  [[ -n "${GIT_AUTH_TOKEN}" ]] || fatal "Missing git token. Set --git-token or GIT_AUTH_TOKEN"
  if [[ -z "${GIT_AUTH_USERNAME}" ]]; then
    if [[ "${REPO_HOST}" == "github.com" ]]; then
      GIT_AUTH_USERNAME="x-access-token"
    else
      fatal "Missing git username for host ${REPO_HOST}. Set --git-username"
    fi
  fi
fi

if [[ "${SETUP_NGINX}" == "true" ]]; then
  if [[ -n "${FRONTEND_DOMAIN}" && "${FRONTEND_DOMAIN}" == "${ADMIN_DOMAIN}" ]]; then
    fatal "frontend/admin domain must be different for host-based routing"
  fi
  if [[ -n "${FRONTEND_DOMAIN}" && "${FRONTEND_DOMAIN}" == "${API_DOMAIN}" ]]; then
    fatal "frontend/api domain must be different for host-based routing"
  fi
  if [[ -n "${ADMIN_DOMAIN}" && "${ADMIN_DOMAIN}" == "${API_DOMAIN}" ]]; then
    fatal "admin/api domain must be different for host-based routing"
  fi
fi

if [[ "${ENABLE_SSL}" == "true" ]]; then
  [[ -n "${LETSENCRYPT_EMAIL}" ]] || fatal "ENABLE_SSL requires --email"
  [[ -n "${FRONTEND_DOMAIN}${ADMIN_DOMAIN}${API_DOMAIN}" ]] || fatal "ENABLE_SSL requires at least one domain"
fi

if ! id -u "${APP_USER}" >/dev/null 2>&1; then
  fatal "Linux user '${APP_USER}' does not exist"
fi

log "Installing base packages"
${SUDO} apt-get update
${SUDO} DEBIAN_FRONTEND=noninteractive apt-get install -y \
  ca-certificates curl gnupg git build-essential nginx ufw openssh-client

if [[ "${INSTALL_POSTGRES}" == "true" ]]; then
  log "Installing PostgreSQL"
  ${SUDO} DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib
  ${SUDO} systemctl enable --now postgresql
fi

log "Ensuring Node.js ${NODE_MAJOR}.x and PM2"
if ! command -v node >/dev/null 2>&1 || [[ "$(node -p 'Number(process.versions.node.split(".")[0])')" -lt "${NODE_MAJOR}" ]]; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | ${SUDO} -E bash -
  ${SUDO} DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
fi
${SUDO} npm install -g pm2

if [[ "${INSTALL_POSTGRES}" == "true" ]]; then
  log "Provisioning PostgreSQL database and user"
  ${SUDO} -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${PG_USER}') THEN
    CREATE ROLE ${PG_USER} LOGIN PASSWORD '${PG_PASSWORD}';
  ELSE
    ALTER ROLE ${PG_USER} WITH LOGIN PASSWORD '${PG_PASSWORD}';
  END IF;
END
\$\$;
SQL
  if ! ${SUDO} -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${PG_DB}'" | grep -q 1; then
    ${SUDO} -u postgres createdb -O "${PG_USER}" "${PG_DB}"
  fi
  ${SUDO} -u postgres psql -v ON_ERROR_STOP=1 -c "GRANT ALL PRIVILEGES ON DATABASE \"${PG_DB}\" TO \"${PG_USER}\";"
fi

log "Preparing application directory"
${SUDO} mkdir -p "$(dirname "${APP_DIR}")"
${SUDO} mkdir -p "${APP_DIR}"
${SUDO} chown -R "${APP_USER}:${APP_GROUP}" "${APP_DIR}"

if [[ "${GIT_AUTH_METHOD}" == "ssh" && "${GENERATE_SSH_KEY}" == "true" ]]; then
  setup_ssh_for_git "${REPO_HOST}"
fi

if [[ ! -d "${APP_DIR}/.git" ]]; then
  if [[ -n "$(ls -A "${APP_DIR}" 2>/dev/null)" ]]; then
    fatal "${APP_DIR} exists and is not a git checkout"
  fi
  log "Cloning repository"
  run_git_command_as_app_user "git clone --branch '${BRANCH}' '${REPO_URL}' '${APP_DIR}'"
else
  log "Repository already exists. Pulling latest branch ${BRANCH}"
  run_git_command_as_app_user "cd '${APP_DIR}' && git fetch origin '${BRANCH}' && git checkout '${BRANCH}' && git pull --ff-only origin '${BRANCH}'"
fi

if [[ "${GIT_AUTH_METHOD}" == "https-token" && "${STORE_GIT_CREDENTIALS}" == "true" ]]; then
  log "Storing git credentials for future pulls"
  store_git_https_credentials "${REPO_HOST}"
fi

log "Ensuring .env files"
for app in backend frontend admin; do
  if [[ ! -f "${APP_DIR}/${app}/.env" && -f "${APP_DIR}/${app}/.env.example" ]]; then
    as_app_user "cp '${APP_DIR}/${app}/.env.example' '${APP_DIR}/${app}/.env'"
  fi
done

SCHEME="http"
if [[ "${ENABLE_SSL}" == "true" ]]; then
  SCHEME="https"
fi

BACKEND_ENV="${APP_DIR}/backend/.env"
FRONTEND_ENV="${APP_DIR}/frontend/.env"
ADMIN_ENV="${APP_DIR}/admin/.env"

if [[ -f "${BACKEND_ENV}" ]]; then
  if [[ "${INSTALL_POSTGRES}" == "true" ]]; then
    set_env_value "${BACKEND_ENV}" "DATABASE_URL" "postgresql://${PG_USER}:${PG_PASSWORD}@127.0.0.1:5432/${PG_DB}"
  fi
  if grep -Eq '^AUTH_SECRET=dev-secret-change-me$|^AUTH_SECRET=$' "${BACKEND_ENV}"; then
    set_env_value "${BACKEND_ENV}" "AUTH_SECRET" "$(random_secret)"
  fi

  CORS_VALUES=()
  if [[ -n "${FRONTEND_DOMAIN}" ]]; then
    CORS_VALUES+=("${SCHEME}://${FRONTEND_DOMAIN}")
  fi
  if [[ -n "${ADMIN_DOMAIN}" ]]; then
    CORS_VALUES+=("${SCHEME}://${ADMIN_DOMAIN}")
  fi
  if [[ "${#CORS_VALUES[@]}" -gt 0 ]]; then
    set_env_value "${BACKEND_ENV}" "CORS_ORIGINS" "$(IFS=,; echo "${CORS_VALUES[*]}")"
  fi
fi

if [[ -f "${FRONTEND_ENV}" ]]; then
  if [[ -n "${FRONTEND_DOMAIN}" ]]; then
    set_env_value "${FRONTEND_ENV}" "NEXT_PUBLIC_APP_URL" "${SCHEME}://${FRONTEND_DOMAIN}"
  fi
  if [[ -n "${API_DOMAIN}" ]]; then
    set_env_value "${FRONTEND_ENV}" "NEXT_PUBLIC_API_BASE_URL" "${SCHEME}://${API_DOMAIN}"
  fi
  if [[ -n "${ADMIN_DOMAIN}" ]]; then
    set_env_value "${FRONTEND_ENV}" "NEXT_PUBLIC_ADMIN_URL" "${SCHEME}://${ADMIN_DOMAIN}"
  fi
  if grep -Eq '^SESSION_SECRET=""$|^SESSION_SECRET=$' "${FRONTEND_ENV}"; then
    set_env_value "${FRONTEND_ENV}" "SESSION_SECRET" "\"$(random_secret)\""
  fi
fi

if [[ -f "${ADMIN_ENV}" ]]; then
  if [[ -n "${ADMIN_DOMAIN}" ]]; then
    set_env_value "${ADMIN_ENV}" "NEXT_PUBLIC_APP_URL" "${SCHEME}://${ADMIN_DOMAIN}"
  fi
  if [[ -n "${API_DOMAIN}" ]]; then
    set_env_value "${ADMIN_ENV}" "BACKEND_URL" "${SCHEME}://${API_DOMAIN}"
  fi
fi

log "Installing npm dependencies"
as_app_user "cd '${APP_DIR}' && npm ci"

if [[ "${RUN_DB_MIGRATIONS}" == "true" ]]; then
  log "Running database migrations"
  as_app_user "cd '${APP_DIR}' && npm run db:migrate"
fi

if [[ "${RUN_DB_SEED}" == "true" ]]; then
  log "Running database seed"
  as_app_user "cd '${APP_DIR}' && npm run db:seed"
fi

log "Building frontend/admin"
as_app_user "cd '${APP_DIR}' && npm run build:frontend && npm run build:admin"

log "Creating PM2 ecosystem config"
cat > "${APP_DIR}/ecosystem.config.cjs" <<EOF_PM2
module.exports = {
  apps: [
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
${SUDO} chown "${APP_USER}:${APP_GROUP}" "${APP_DIR}/ecosystem.config.cjs"

log "Starting services with PM2"
as_app_user "cd '${APP_DIR}' && pm2 startOrReload ecosystem.config.cjs --update-env"
as_app_user "pm2 save"
APP_HOME="$(eval echo "~${APP_USER}")"
${SUDO} env PATH="$PATH" pm2 startup systemd -u "${APP_USER}" --hp "${APP_HOME}" >/dev/null 2>&1 || true

if [[ "${SETUP_NGINX}" == "true" ]]; then
  log "Configuring Nginx"
  if [[ -z "${FRONTEND_DOMAIN}${ADMIN_DOMAIN}${API_DOMAIN}" ]]; then
    log "No domains set; skipping Nginx virtual hosts"
  else
    NGINX_CONF="/etc/nginx/sites-available/mystay.conf"
    TMP_NGINX="$(mktemp)"

    append_server_block() {
      local domain="$1"
      local port="$2"
      cat >> "${TMP_NGINX}" <<EOF_NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${domain};

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:${port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

EOF_NGINX
    }

    : > "${TMP_NGINX}"
    if [[ -n "${FRONTEND_DOMAIN}" ]]; then
      append_server_block "${FRONTEND_DOMAIN}" "3000"
    fi
    if [[ -n "${ADMIN_DOMAIN}" ]]; then
      append_server_block "${ADMIN_DOMAIN}" "3001"
    fi
    if [[ -n "${API_DOMAIN}" ]]; then
      append_server_block "${API_DOMAIN}" "4000"
    fi

    ${SUDO} cp "${TMP_NGINX}" "${NGINX_CONF}"
    rm -f "${TMP_NGINX}"
    ${SUDO} ln -sf "${NGINX_CONF}" /etc/nginx/sites-enabled/mystay.conf
    ${SUDO} rm -f /etc/nginx/sites-enabled/default
    ${SUDO} nginx -t
    ${SUDO} systemctl restart nginx
  fi
fi

if [[ "${ENABLE_SSL}" == "true" ]]; then
  log "Requesting Let's Encrypt certificates"
  ${SUDO} DEBIAN_FRONTEND=noninteractive apt-get install -y certbot python3-certbot-nginx
  CERTBOT_ARGS=(--nginx --non-interactive --agree-tos --redirect -m "${LETSENCRYPT_EMAIL}")
  [[ -n "${FRONTEND_DOMAIN}" ]] && CERTBOT_ARGS+=(-d "${FRONTEND_DOMAIN}")
  [[ -n "${ADMIN_DOMAIN}" ]] && CERTBOT_ARGS+=(-d "${ADMIN_DOMAIN}")
  [[ -n "${API_DOMAIN}" ]] && CERTBOT_ARGS+=(-d "${API_DOMAIN}")
  ${SUDO} certbot "${CERTBOT_ARGS[@]}"
fi

if [[ "${CONFIGURE_UFW}" == "true" ]]; then
  log "Configuring UFW firewall"
  ${SUDO} ufw allow OpenSSH
  ${SUDO} ufw allow "Nginx Full"
  ${SUDO} ufw --force enable
fi

log "Deployment completed"
log "PM2 status: sudo -u ${APP_USER} pm2 status"
log "PM2 logs:   sudo -u ${APP_USER} pm2 logs"
log "Update app: ./pull.sh --app-dir '${APP_DIR}' --branch '${BRANCH}'"
