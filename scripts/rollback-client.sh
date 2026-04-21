#!/usr/bin/env bash

# 开启严格模式，避免脚本在异常情况下继续执行导致误操作。
set -euo pipefail

# 获取脚本目录，确保从任意工作目录执行都能正确定位项目根目录。
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 项目根目录为 scripts 目录的上一级。
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# 默认服务器地址，可通过命令行参数覆盖。
DEFAULT_HOST="81.71.122.48"

# 默认 SSH 端口，可通过命令行参数覆盖。
DEFAULT_PORT="22"

# 默认 SSH 用户名，可通过命令行参数覆盖。
DEFAULT_USER="root"

# 默认线上目录（当前正在被 Nginx 使用的目录）。
DEFAULT_REMOTE_DIR="/var/www/bazi-fashion"

# 统一错误输出函数，便于快速定位失败原因。
die() {
  # $1：错误信息文本。
  local message="$1"
  echo "[ERROR] ${message}" >&2
  exit 1
}

# 打印脚本使用说明。
print_usage() {
  cat <<'EOF'
用法：
  bash scripts/rollback-client.sh [选项]

选项：
  --host <IP或域名>         服务器地址，默认 81.71.122.48
  --port <SSH端口>          SSH 端口，默认 22
  --user <用户名>           SSH 登录用户名，默认 root
  --remote-dir <远端目录>   当前线上目录，默认 /var/www/bazi-fashion
  --timestamp <时间戳>      回滚目标时间戳，例如 20260421-103000
  --backup-dir <完整目录>   回滚目标完整备份目录（优先级高于 --timestamp）
  --list                    只列出可回滚备份，不执行回滚
  --yes                     跳过二次确认，适合自动化
  --help                    显示帮助

说明：
  1) 备份目录命名规则来自 deploy 脚本：
     /var/www/bazi-fashion-backup-YYYYMMDD-HHMMSS
  2) 回滚前会先备份当前线上目录，避免二次误操作无法恢复。

示例：
  bash scripts/rollback-client.sh --list
  bash scripts/rollback-client.sh --timestamp 20260421-103000
  bash scripts/rollback-client.sh --backup-dir /var/www/bazi-fashion-backup-20260421-103000
EOF
}

# 解析命令行参数并初始化运行变量。
parse_args() {
  # $1...$n：脚本接收的全部参数。
  local args=("$@")

  # 设置默认值，便于用户零配置运行。
  ROLLBACK_HOST="${DEFAULT_HOST}"
  ROLLBACK_PORT="${DEFAULT_PORT}"
  ROLLBACK_USER="${DEFAULT_USER}"
  ROLLBACK_REMOTE_DIR="${DEFAULT_REMOTE_DIR}"
  ROLLBACK_TIMESTAMP=""
  ROLLBACK_BACKUP_DIR=""
  LIST_ONLY="false"
  AUTO_YES="false"

  # 使用下标循环解析参数，兼容含空格的参数值。
  local i=0
  while [[ $i -lt ${#args[@]} ]]; do
    case "${args[$i]}" in
      --host)
        i=$((i + 1))
        [[ $i -lt ${#args[@]} ]] || die "--host 缺少参数值"
        ROLLBACK_HOST="${args[$i]}"
        ;;
      --port)
        i=$((i + 1))
        [[ $i -lt ${#args[@]} ]] || die "--port 缺少参数值"
        ROLLBACK_PORT="${args[$i]}"
        ;;
      --user)
        i=$((i + 1))
        [[ $i -lt ${#args[@]} ]] || die "--user 缺少参数值"
        ROLLBACK_USER="${args[$i]}"
        ;;
      --remote-dir)
        i=$((i + 1))
        [[ $i -lt ${#args[@]} ]] || die "--remote-dir 缺少参数值"
        ROLLBACK_REMOTE_DIR="${args[$i]}"
        ;;
      --timestamp)
        i=$((i + 1))
        [[ $i -lt ${#args[@]} ]] || die "--timestamp 缺少参数值"
        ROLLBACK_TIMESTAMP="${args[$i]}"
        ;;
      --backup-dir)
        i=$((i + 1))
        [[ $i -lt ${#args[@]} ]] || die "--backup-dir 缺少参数值"
        ROLLBACK_BACKUP_DIR="${args[$i]}"
        ;;
      --list)
        LIST_ONLY="true"
        ;;
      --yes)
        AUTO_YES="true"
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

# 校验本机依赖命令是否存在。
check_requirements() {
  command -v ssh >/dev/null 2>&1 || die "未找到 ssh，请先安装 OpenSSH 客户端"
}

# 列出远端所有可回滚备份目录，按名字排序展示。
list_remote_backups() {
  echo "[INFO] 正在读取可回滚备份列表..."
  ssh -p "${ROLLBACK_PORT}" "${ROLLBACK_USER}@${ROLLBACK_HOST}" \
    "ls -1d \"${ROLLBACK_REMOTE_DIR%/}\"-backup-* 2>/dev/null || true"
}

# 根据参数构造最终要回滚到的远端备份目录。
resolve_target_backup_dir() {
  # 如果用户传了完整目录，直接使用该目录。
  if [[ -n "${ROLLBACK_BACKUP_DIR}" ]]; then
    TARGET_BACKUP_DIR="${ROLLBACK_BACKUP_DIR}"
    return
  fi

  # 如果用户只传时间戳，按既定命名规则拼接完整目录。
  if [[ -n "${ROLLBACK_TIMESTAMP}" ]]; then
    TARGET_BACKUP_DIR="${ROLLBACK_REMOTE_DIR%/}-backup-${ROLLBACK_TIMESTAMP}"
    return
  fi

  die "请提供 --timestamp 或 --backup-dir，或者使用 --list 查看可用备份"
}

# 检查目标备份目录是否真实存在，避免回滚到错误路径。
validate_target_backup_exists() {
  ssh -p "${ROLLBACK_PORT}" "${ROLLBACK_USER}@${ROLLBACK_HOST}" \
    "[ -d \"${TARGET_BACKUP_DIR}\" ]" \
    || die "目标备份目录不存在：${TARGET_BACKUP_DIR}"
}

# 打印回滚操作摘要并请求用户确认，降低误操作风险。
confirm_if_needed() {
  if [[ "${AUTO_YES}" == "true" ]]; then
    echo "[INFO] 已启用 --yes，跳过交互确认。"
    return
  fi

  echo "[WARN] 即将执行回滚："
  echo "       服务器：${ROLLBACK_USER}@${ROLLBACK_HOST}:${ROLLBACK_PORT}"
  echo "       当前目录：${ROLLBACK_REMOTE_DIR}"
  echo "       回滚来源：${TARGET_BACKUP_DIR}"
  echo "       回滚前会先备份当前目录。"
  read -r -p "确认继续？输入 yes 继续： " confirm_text
  [[ "${confirm_text}" == "yes" ]] || die "用户取消回滚。"
}

# 执行真正的远端回滚：先备份当前目录，再覆盖为目标备份。
perform_remote_rollback() {
  # 生成“回滚前现场”备份目录，便于回滚后再次撤销。
  local now_timestamp
  now_timestamp="$(date +%Y%m%d-%H%M%S)"
  local rollback_snapshot_dir="${ROLLBACK_REMOTE_DIR%/}-pre-rollback-${now_timestamp}"

  echo "[INFO] 开始远端回滚..."

  ssh -p "${ROLLBACK_PORT}" "${ROLLBACK_USER}@${ROLLBACK_HOST}" "
    set -e
    if [ -d \"${ROLLBACK_REMOTE_DIR}\" ]; then
      cp -a \"${ROLLBACK_REMOTE_DIR}\" \"${rollback_snapshot_dir}\"
    fi
    rm -rf \"${ROLLBACK_REMOTE_DIR}\"
    cp -a \"${TARGET_BACKUP_DIR}\" \"${ROLLBACK_REMOTE_DIR}\"
  "

  echo "[INFO] 回滚完成。"
  echo "[INFO] 回滚前快照：${rollback_snapshot_dir}"
}

# 主流程：解析参数、校验依赖、可选列备份、执行回滚。
main() {
  # $1...$n：脚本入口接收的全部命令行参数。
  local all_args=("$@")

  parse_args "${all_args[@]}"
  check_requirements

  if [[ "${LIST_ONLY}" == "true" ]]; then
    list_remote_backups
    exit 0
  fi

  resolve_target_backup_dir
  validate_target_backup_exists
  confirm_if_needed
  perform_remote_rollback

  echo "[INFO] 建议验证：curl -I http://${ROLLBACK_HOST}/"
}

# 执行脚本入口。
main "$@"
