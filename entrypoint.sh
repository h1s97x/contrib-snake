#!/usr/bin/env bash
set -euo pipefail

# CNB 插件约定：pipeline 中的 settings 以 PLUGIN_<NAME> 形式注入。
# 兼容旧 cnb-snake 插件的 settings：username / days / metric / theme / output。

platform="${PLUGIN_PLATFORM:-cnb}"
username="${PLUGIN_USERNAME:-${CNB_BUILD_USER:-}}"
days="${PLUGIN_DAYS:-365}"
metric="${PLUGIN_METRIC:-score}"
theme="${PLUGIN_THEME:-both}"
output="${PLUGIN_OUTPUT:-snake.svg}"

if [ -z "$username" ]; then
  echo "contribution-snake: 未设置 'username'（也可在本仓库中回退到 CNB_BUILD_USER）" >&2
  exit 1
fi

args=(--platform="$platform" --user="$username" --metric="$metric" --days="$days")
if [ -n "${PLUGIN_TOKEN:-}" ]; then args+=(--token="$PLUGIN_TOKEN"); fi
if [ -n "${PLUGIN_BASE_URL:-}" ]; then args+=(--base_url="$PLUGIN_BASE_URL"); fi

# PLUGIN_OUTPUTS 支持多文件 + 查询参数，交给 CLI 直接解析。
if [ -z "${PLUGIN_OUTPUTS:-}" ]; then
  out_dir="$(dirname "$output")"
  base="$(basename "$output")"
  name_no_ext="${base%.svg}"
  dark_output="${out_dir}/${name_no_ext}-dark.svg"
  dark_palette="${PLUGIN_PALETTE_DARK:-${platform}-dark}"

  case "$theme" in
    both)
      args+=(--output="$output")
      args+=(--output="${dark_output}?palette=${dark_palette}")
      ;;
    light)
      args+=(--output="$output")
      ;;
    dark)
      args+=(--output="${dark_output}?palette=${dark_palette}")
      ;;
    *)
      echo "contribution-snake: 无效的 theme '$theme'（应为 light|dark|both）" >&2
      exit 1
      ;;
  esac
fi

cd /app
exec bun src/cli.ts "${args[@]}"
