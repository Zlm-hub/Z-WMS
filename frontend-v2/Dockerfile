# ModernWMS 前端 v2 — 本机构建 + nginx 托管
# 用法：先在本目录执行  npm run build  生成 dist/，再：
#   docker build -t modernwms-frontend-v2:latest .
# （容器内不装 node 依赖，构建快且不受 Docker Hub 网络影响）
FROM nginx:latest
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
