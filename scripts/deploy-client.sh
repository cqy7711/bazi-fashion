#!/usr/bin/env bash

# 开启严格模式：命令报错即退出，未定义变量报错，管道任一失败即失败。
set -euo pipefail

# 获取脚本所在目录，确保从任意路径执行都能定位到项目根目录。
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 项目根目录为 scripts 的上一级目录。
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# 前端项目目录。
CLIENT_DIR="${PROJECT_ROOT}/client"

# 默认服务器 IP，可通过参数覆盖。
DEFAULT_HOST="81.71.122.48"

# 默认 SSH 端口，可通过参数覆盖。
DEFAULT_PORT="22"

# 默认登录用户，可通过参数覆盖。
DEFAULT_USER="root"

# 默认远端部署目录，可通过参数覆盖。
DEFAULT_REMOTE_DIR="/var/www/bazi-fashion"

# 默认远端临时目录：先上传到该目录，再由服务器本地 sudo rsync 到正式目录。
DEFAULT_STAGING_DIR="/home/ubuntu/bazi-fashion-dist"

# 默认健康检查地址，可通过参数覆盖。
DEFAULT_HEALTH_URL=""

# 健康检查重试次数。
DEFAULT_HEALTH_RETRIES="5"

# 健康检查重试间隔（秒）。
DEFAULT_HEALTH_INTERVAL="2"

# 反馈错误信息并退出的函数，便于统一处理异常场景。
die() {
  # $1 为错误提示文本。
  local message="$1"
  echo "[ERROR] ${message}" >&2
  exit 1
}

# 打印脚本用法说明，帮助快速理解参数含义。
print_usage() {
  cat <<'EOF'
用法：
  bash scripts/deploy-client.sh [选项]

选项：
  --host <IP或域名>         服务器地址，默认 81.71.122.48
  --port <SSH端口>          SSH 端口，默认 22
  --user <用户名>           SSH 登录用户名，默认 root
  --remote-dir <远端目录>   前端发布目录，默认 /var/www/bazi-fashion
  --staging-dir <远端临时目录>  中转目录，默认 /home/ubuntu/bazi-fashion-dist
  --skip-backup             跳过远端目录备份步骤
  --skip-reload             跳过 nginx reload（仅同步文件）
  --health-url <URL>        健康检查 URL（默认 http://<host>/）
  --health-retries <次数>    健康检查重试次数，默认 5
  --health-interval <秒>     健康检查重试间隔秒数，默认 2
  --help                    显示帮助

示例：
  bash scripts/deploy-client.sh --user ubuntu
  bash scripts/deploy-client.sh --user ubuntu --port 2222
  bash scripts/deploy-client.sh --host example.com --remote-dir /var/www/html
EOF
}

# 解析命令行参数并赋值到对应变量。
parse_args() {
  # 函数形式参数逐行定义，便于阅读与维护。
  # $1...$n：用户传入的全部命令行参数。
  local args=("$@")

  # 初始化部署变量为默认值。
  DEPLOY_HOST="${DEFAULT_HOST}"
  DEPLOY_PORT="${DEFAULT_PORT}"
  DEPLOY_USER="${DEFAULT_USER}"
  DEPLOY_REMOTE_DIR="${DEFAULT_REMOTE_DIR}"
  DEPLOY_STAGING_DIR="${DEFAULT_STAGING_DIR}"
  DEPLOY_HEALTH_URL="${DEFAULT_HEALTH_URL}"
  DEPLOY_HEALTH_RETRIES="${DEFAULT_HEALTH_RETRIES}"
  DEPLOY_HEALTH_INTERVAL="${DEFAULT_HEALTH_INTERVAL}"
  SKIP_BACKUP="false"
  SKIP_RELOAD="false"
  LAST_BACKUP_DIR=""

  # 使用 while + case 逐项解析参数。
  local i=0
  while [[ $i -lt ${#args[@]} ]]; do
    case "${args[$i]}" in
      --host)
        i=$((i + 1))
        [[ $i -lt ${#args[@]} ]] || die "--host 缺少参数值"
        DEPLOY_HOST="${args[$i]}"
        ;;
      --port)
        i=$((i + 1))
        [[ $i -lt ${#args[@]} ]] || die "--port 缺少参数值"
        DEPLOY_PORT="${args[$i]}"
        ;;
      --user)
        i=$((i + 1))
        [[ $i -lt ${#args[@]} ]] || die "--user 缺少参数值"
        DEPLOY_USER="${args[$i]}"
        ;;
      --remote-dir)
        i=$((i + 1))
        [[ $i -lt ${#args[@]} ]] || die "--remote-dir 缺少参数值"
        DEPLOY_REMOTE_DIR="${args[$i]}"
        ;;
      --staging-dir)
        i=$((i + 1))
        [[ $i -lt ${#args[@]} ]] || die "--staging-dir 缺少参数值"
        DEPLOY_STAGING_DIR="${args[$i]}"
        ;;
      --skip-backup)
        SKIP_BACKUP="true"
        ;;
      --skip-reload)
        SKIP_RELOAD="true"
        ;;
      --health-url)
        i=$((i + 1))
        [[ $i -lt ${#args[@]} ]] || die "--health-url 缺少参数值"
        DEPLOY_HEALTH_URL="${args[$i]}"
        ;;
      --health-retries)
        i=$((i + 1))
        [[ $i -lt ${#args[@]} ]] || die "--health-retries 缺少参数值"
        DEPLOY_HEALTH_RETRIES="${args[$i]}"
        ;;
      --health-interval)
        i=$((i + 1))
        [[ $i -lt ${#args[@]} ]] || die "--health-interval 缺少参数值"
        DEPLOY_HEALTH_INTERVAL="${args[$i]}"
        ;;
      --help)
        print_usage
        exit 0
        ;;
      *)
        die "未知参数：${args[$i]}，可使用 --help 查看帮助"
        ;;
    esac
    i=$((i + 1))
  done
}

# 校验本机依赖是否齐全，避免执行到中途失败。
check_requirements() {
  command -v npm >/dev/null 2>&1 || die "未找到 npm，请先安装 Node.js 与 npm"
  command -v rsync >/dev/null 2>&1 || die "未找到 rsync，请先安装 rsync"
  command -v ssh >/dev/null 2>&1 || die "未找到 ssh，请先安装 OpenSSH 客户端"
  command -v curl >/dev/null 2>&1 || die "未找到 curl，请先安装 curl"
}

# 统一的 SSH 选项：开启连接复用，避免多次输入密码。
# 说明：ControlMaster/ControlPersist 会在第一次 SSH 连接后复用同一条 TCP 连接给后续 ssh/rsync 使用。
init_ssh_opts() {
  # ControlPath 长度有系统限制（通常 104 字符左右），用 /tmp 下的短路径更稳。
  SSH_CONTROL_PATH="/tmp/wuxing-ssh-%r@%h:%p"
  SSH_BASE_OPTS=(
    -p "${DEPLOY_PORT}"
    -o ControlMaster=auto
    -o ControlPersist=600
    -o "ControlPath=${SSH_CONTROL_PATH}"
    -o ServerAliveInterval=30
    -o ServerAliveCountMax=3
    -o StrictHostKeyChecking=accept-new
  )

  # rsync 的 -e 只接受字符串；这里把 SSH_BASE_OPTS 安全地转成可执行的 ssh 命令串，
  # 确保 rsync 与 ssh 使用同一套 ControlPath（从而复用连接，避免多次输入密码）。
  local q=()
  local opt
  for opt in "${SSH_BASE_OPTS[@]}"; do
    q+=("$(printf '%q' "${opt}")")
  done
  RSYNC_SSH_CMD="ssh ${q[*]}"
}

# 在 client 目录执行构建，产出 dist 静态文件。
build_client() {
  echo "[INFO] 开始构建前端..."
  cd "${CLIENT_DIR}"
  npm run build
  echo "[INFO] 前端构建完成。"
}

# 通过 SSH 在远端执行命令，统一命令入口便于维护。
run_remote() {
  # $1：要在远端执行的完整 shell 命令字符串。
  local remote_cmd="$1"
  ssh "${SSH_BASE_OPTS[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" "${remote_cmd}"
}

# 在远端创建备份目录并备份现有版本，防止发布后回滚困难。
backup_remote_if_needed() {
  # $1：是否跳过备份，值为 true/false。
  local skip_backup="$1"

  if [[ "${skip_backup}" == "true" ]]; then
    echo "[INFO] 已按参数要求跳过远端备份。"
    return
  fi

  # 生成远端备份目录名，包含时间戳方便追溯版本。
  local timestamp
  timestamp="$(date +%Y%m%d-%H%M%S)"
  local backup_dir="${DEPLOY_REMOTE_DIR%/}-backup-${timestamp}"
  LAST_BACKUP_DIR="${backup_dir}"

  echo "[INFO] 正在创建远端备份：${backup_dir}"

  run_remote "if [ -d \"${DEPLOY_REMOTE_DIR}\" ]; then sudo cp -a \"${DEPLOY_REMOTE_DIR}\" \"${backup_dir}\"; fi"

  echo "[INFO] 远端备份完成。"
}

# 第一步：把本地 dist 上传到远端临时目录，避免直接改线上目录导致短暂不可用。
sync_dist_to_staging() {
  echo "[INFO] 开始同步 dist 到远端临时目录：${DEPLOY_STAGING_DIR}"
  run_remote "mkdir -p \"${DEPLOY_STAGING_DIR}\""
  rsync -avz --delete -e "${RSYNC_SSH_CMD}" \
    "${CLIENT_DIR}/dist/" \
    "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_STAGING_DIR}/"
  echo "[INFO] 临时目录同步完成。"
}

# 第二步：在服务器本地用 sudo rsync 把临时目录覆盖到线上目录，确保权限和一致性。
promote_staging_to_remote() {
  echo "[INFO] 开始把临时目录发布到线上目录..."
  run_remote "sudo mkdir -p \"${DEPLOY_REMOTE_DIR}\""
  run_remote "sudo rsync -av --delete \"${DEPLOY_STAGING_DIR}/\" \"${DEPLOY_REMOTE_DIR}/\""
  run_remote "sudo chown -R www-data:www-data \"${DEPLOY_REMOTE_DIR}\""
  run_remote "sudo chmod -R a+rX \"${DEPLOY_REMOTE_DIR}\""
  echo "[INFO] 已完成线上目录覆盖与权限修复。"
}

# 第三步：重载 Nginx 并做远端 HTTP 状态验证。
reload_nginx_if_needed() {
  if [[ "${SKIP_RELOAD}" == "true" ]]; then
    echo "[INFO] 已按参数要求跳过 nginx reload。"
    return
  fi

  echo "[INFO] 开始执行 nginx 配置校验与重载..."
  run_remote "sudo nginx -t && sudo systemctl reload nginx"
  echo "[INFO] nginx 重载完成。"
}

# 发布完成后在本机执行 HTTP 健康检查，并支持重试。
health_check() {
  local health_url="${DEPLOY_HEALTH_URL}"
  local retries="${DEPLOY_HEALTH_RETRIES}"
  local interval="${DEPLOY_HEALTH_INTERVAL}"
  local attempt=1

  if [[ -z "${health_url}" ]]; then
    health_url="http://${DEPLOY_HOST}/"
  fi

  echo "[INFO] 开始健康检查：${health_url}"
  while [[ "${attempt}" -le "${retries}" ]]; do
    if curl --silent --show-error --fail --max-time 8 "${health_url}" >/dev/null; then
      echo "[INFO] 健康检查通过（第 ${attempt}/${retries} 次）。"
      return
    fi
    echo "[WARN] 健康检查失败（第 ${attempt}/${retries} 次），${interval}s 后重试..."
    attempt=$((attempt + 1))
    sleep "${interval}"
  done

  echo "[ERROR] 健康检查最终失败：${health_url}" >&2
  echo "[ERROR] 回滚建议：" >&2
  if [[ -n "${LAST_BACKUP_DIR}" ]]; then
    echo "        bash scripts/rollback-client.sh --user ${DEPLOY_USER} --port ${DEPLOY_PORT} --backup-dir \"${LAST_BACKUP_DIR}\"" >&2
  else
    echo "        bash scripts/rollback-client.sh --user ${DEPLOY_USER} --port ${DEPLOY_PORT} --list" >&2
  fi
  exit 1
}

# 主函数：串联参数解析、依赖检查、构建、备份、同步等完整流程。
main() {
  # main 的形式参数单独一行，接收脚本全部命令行参数。
  # $1...$n：传给脚本的全部选项；即使为空也要安全传递，避免 set -u 触发未绑定错误。
  parse_args "$@"
  check_requirements
  init_ssh_opts
  build_client
  backup_remote_if_needed "${SKIP_BACKUP}"
  sync_dist_to_staging
  promote_staging_to_remote
  reload_nginx_if_needed
  health_check

  echo "[INFO] 发布完成：${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_REMOTE_DIR}"
  echo "[INFO] 建议验证：curl -I ${DEPLOY_HEALTH_URL:-http://${DEPLOY_HOST}/}"
  if [[ -n "${LAST_BACKUP_DIR}" ]]; then
    echo "[INFO] 最近备份：${LAST_BACKUP_DIR}"
  fi
}

# 执行入口：把脚本参数完整传给 main。
main "$@"
