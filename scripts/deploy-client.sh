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
  SKIP_BACKUP="false"
  SKIP_RELOAD="false"

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
  ssh -p "${DEPLOY_PORT}" "${DEPLOY_USER}@${DEPLOY_HOST}" "${remote_cmd}"
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

  echo "[INFO] 正在创建远端备份：${backup_dir}"

  run_remote "if [ -d \"${DEPLOY_REMOTE_DIR}\" ]; then sudo cp -a \"${DEPLOY_REMOTE_DIR}\" \"${backup_dir}\"; fi"

  echo "[INFO] 远端备份完成。"
}

# 第一步：把本地 dist 上传到远端临时目录，避免直接改线上目录导致短暂不可用。
sync_dist_to_staging() {
  echo "[INFO] 开始同步 dist 到远端临时目录：${DEPLOY_STAGING_DIR}"
  run_remote "mkdir -p \"${DEPLOY_STAGING_DIR}\""
  rsync -avz --delete -e "ssh -p ${DEPLOY_PORT}" \
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
reload_and_verify() {
  if [[ "${SKIP_RELOAD}" == "true" ]]; then
    echo "[INFO] 已按参数要求跳过 nginx reload。"
    return
  fi

  echo "[INFO] 开始执行 nginx 配置校验与重载..."
  run_remote "sudo nginx -t && sudo systemctl reload nginx"
  echo "[INFO] nginx 重载完成。"
  run_remote "curl -I \"http://${DEPLOY_HOST}/\""
}

# 主函数：串联参数解析、依赖检查、构建、备份、同步等完整流程。
main() {
  # main 的形式参数单独一行，接收脚本全部命令行参数。
  # $1...$n：传给脚本的全部选项；即使为空也要安全传递，避免 set -u 触发未绑定错误。
  parse_args "$@"
  check_requirements
  build_client
  backup_remote_if_needed "${SKIP_BACKUP}"
  sync_dist_to_staging
  promote_staging_to_remote
  reload_and_verify

  echo "[INFO] 发布完成：${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_REMOTE_DIR}"
  echo "[INFO] 建议验证：curl -I http://${DEPLOY_HOST}/"
}

# 执行入口：把脚本参数完整传给 main。
main "$@"
