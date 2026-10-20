# ModernWMS 后端镜像：多阶段构建（sdk 编译 → aspnet 运行时）
# 构建上下文 = F:\WMS（ModernWMS 仓库的上级目录），见 deploy.sh
FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build
WORKDIR /src
COPY backend/ ./backend/
RUN dotnet publish backend/ModernWMS/ModernWMS.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:7.0
WORKDIR /app
COPY --from=build /app/publish .
# SQLite 种子库（含菜单 + admin 账号），发布产物不含它，需手动拷入 /app/data
# WMS_SEED 可选：wms.db（默认，烟测种子，CI 用）| wms_demo_mfg.db（制造业演示种子）
#   docker build --build-arg WMS_SEED=wms_demo_mfg.db ...
# 注意：运行数据在 named volume 里，重建镜像不会覆盖已有数据；要换种子需 docker compose down + docker volume rm
ARG WMS_SEED=wms.db
COPY rebuild/seed/${WMS_SEED} /app/data/wms.db
EXPOSE 20011
ENTRYPOINT ["dotnet", "ModernWMS.dll", "--urls", "http://0.0.0.0:20011"]
