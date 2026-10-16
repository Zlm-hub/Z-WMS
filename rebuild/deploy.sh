#!/bin/bash
# ModernWMS 干净重建版：构建镜像 + 启动
# 用法：cd ModernWMS-逆向工程/rebuild && bash deploy.sh
set -e

# 构建上下文 = 本目录的上一级（即 Z-WMS 仓库根，backend/frontend/rebuild 均在仓库内）
# Git Bash 下转成 Windows 路径（cygpath -m → F:/WMS），否则 Windows 版 docker CLI 不认 /f/WMS
RAW_CTX="$(cd "$(dirname "$0")/.." && pwd)"
CTX="$(cygpath -m "$RAW_CTX" 2>/dev/null || echo "$RAW_CTX")"
echo "构建上下文: $CTX"

echo "==> 构建后端镜像"
docker build -f "$(dirname "$0")/backend.Dockerfile" -t modernwms-backend:latest "$CTX"

echo "==> 构建前端镜像"
docker build -f "$(dirname "$0")/frontend.Dockerfile" -t modernwms-frontend:latest "$CTX"

echo "==> 启动服务"
docker compose up -d

echo "完成："
echo "  前端  http://localhost  (默认账号 admin / 1)"
echo "  后端  http://localhost:20011 (Swagger 同端口根路径)"
echo "  数据  docker volume wms-data (SQLite wms.db)"
