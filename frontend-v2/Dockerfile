# ModernWMS 前端 v2 — 本机构建 + nginx 托管
# 用法：先在本目录执行  npm run build  生成 dist/，再：
#   docker build -t modernwms-frontend-v2:latest .
# （容器内不装 node 依赖，构建快且不受 Docker Hub 网络影响）
# 运行时配置：通过环境变量 WMS_API 注入后端地址（如 http://host:20011）；
# 未设置则前端回退默认 hostname:20011（SQLite 档兼容）
FROM nginx:latest
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
