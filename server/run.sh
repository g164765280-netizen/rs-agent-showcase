#!/bin/bash
# RS-Agent 实机演示后端启动脚本
cd "$(dirname "$0")"
[ -f .env ] && set -a && source .env && set +a
exec ./.venv/bin/python main.py
