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
# 用 rebuild/seed/wms.db：官方 wms.db 的 schema 严重过期（缺 asnmaster/global_unique_serial 等表、
# spu 残留 bar_code NOT NULL、stock/stocktaking 等缺序列号/效期列），本文件已用脚本对齐当前实体模型
COPY rebuild/seed/wms.db /app/data/wms.db
EXPOSE 20011
ENTRYPOINT ["dotnet", "ModernWMS.dll", "--urls", "http://0.0.0.0:20011"]
