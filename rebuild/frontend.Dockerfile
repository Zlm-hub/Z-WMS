# ModernWMS 前端镜像：node16 编译 → nginx 托管静态文件
# 构建上下文 = F:\WMS（ModernWMS 仓库的上级目录），见 deploy.sh
# 关键点：把 VITE_BASE_PATH 置空，axios baseURL 变成 ":20011"，
# 请求自动打到「当前访问域名:20011」，无需构建时写死服务器 IP。
FROM node:16-bullseye AS build
WORKDIR /src
COPY frontend/package.json frontend/yarn.lock ./
# node:16 镜像自带 yarn（npm install -g yarn 会报 EEXIST）；上游 lockfile 与 package.json 不同步，不能用 --frozen-lockfile
RUN yarn install
COPY frontend/ ./
# 跳过 vue-tsc：上游代码类型检查本来就不过（几百个 $t 类型报错），vite build 不受影响
RUN sed -i "s#^VITE_BASE_PATH=.*#VITE_BASE_PATH=#" .env.production \
    && yarn vite build

FROM nginx:1.24-alpine
COPY rebuild/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /src/dist /usr/share/nginx/html
EXPOSE 80
