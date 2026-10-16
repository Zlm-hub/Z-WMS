# ModernWMS 干净重建版

对原项目「部署环节」的重做：官方 docker 是 ubuntu 大杂烩单容器（nginx + dotnet + node 全塞一起），这里重构成 **三镜像 compose**（后端 / 前端 / 可选 MySQL），多阶段构建、职责分离、一键部署。

## 与原版的差异

| 项 | 原版 | 重建版 |
|---|---|---|
| 镜像 | ubuntu:22.04 单容器（装 nginx+dotnet+node） | `aspnet:7.0` 后端 + `nginx:alpine` 前端，各司其职 |
| 前端构建 | 手动 yarn build + 拷贝 + sed 改 IP | Dockerfile 内置，`VITE_BASE_PATH` 置空 → 自动请求 `当前域名:20011`，**不用写死 IP** |
| 数据库 | 手动装 MySQL | 默认 SQLite（种子库自动带菜单和 admin），可选 MySQL 8 服务 |
| 初始化 | 手动 8 步 | `bash deploy.sh` 一条命令 |

## 使用

```bash
cd Z-WMS/rebuild（仓库根下的 rebuild/）
bash deploy.sh          # 构建两个镜像并启动（构建上下文 = 仓库根，backend/frontend 均在仓库内）
```

- 前端：http://localhost:8080 （默认账号 `admin / 1`；本机 80 被其它服务占用时用 8080，无冲突可改回 compose 里的 "80:80"）
- 后端：http://localhost:20011 （Swagger 在根路径）
- 数据持久化：docker volume `wms-data`（SQLite wms.db）

## 已实测验证（2026-10-15，完整业务流）

- 部署链路：镜像构建 → compose 起服务 → admin/1 登录签发 JWT → 前端页面与产物加载正常。
- **完整入库业务流（容器内端到端）**：建 SPU/SKU → 建 ASNmaster → 建 ASN → confirm → unload → sorting（自动生成 3 个序列号 sn20261016-0004~6）→ sorted → pending-putaway → putaway×3 → 库存核对 **qty=3 / qty_available=3** 全 PASS。冒烟脚本：`../container_smoke.py`。
- 关键接口约定（冒烟时踩过的坑）：
  - 状态推进接口全是 **PUT** 不是 POST：`PUT /asn/confirm`、`/asn/unload`、`/asn/sorting`、`/asn/sorted`、`/asn/putaway`，且收 **JSON 数组**（如 `[{"id":1,...}]`）；
  - `sorting` 只记录明细，**必须再调 `/asn/sorted` 才把状态推到 3（已分拣）**，否则 putaway 会被拒；
  - `POST /spu` 收完整 ViewModel：`spu_code`/`category_name`/`sku_code` 等必填（空串不行），`detailList` 里的 SKU 需带 `expiry_date`（天数）；
  - `pending-putaway?id=<asn明细id>` 返回每个序列号一条记录，逐条上架；
  - 默认账号 `admin / 1`（MD5("1")）。

## 种子库 schema 修复（重要）

官方 `wms.db` 种子库 schema 严重过期，与代码里的 EF 实体不匹配，直接用会在创建 SPU 等写操作时报 `NOT NULL constraint failed: spu.bar_code` / `no such table: asnmaster` 等。`seed/wms.db` 已修复（对齐实体模型）：
- 补齐数十列（asn/asnsort/dispatch*/stock*/sku/menu/rolemenu 等）；
- 删除 spu 残留脏列 `bar_code`，给 sku 补 `bar_code`；
- 新建 9 张缺失表：action_log、asnmaster、flowset、flowsetfilter、flowsetmain、flowsetusers、global_unique_serial、sku_safety_stock、user_defined_print_solution。

**Volume 陷阱**：seed 是构建时 `COPY` 进镜像、首次启动填充到 named volume 的。之后改了 seed 再重建镜像，**已存在的 volume 不会自动更新**（Docker 只在 volume 为空时填充）。必须：

```bash
docker compose down
docker volume rm rebuild_wms-data   # 或 docker volume ls | grep wms 找实际卷名
docker compose up -d
```

判断容器内 schema 是否为修复版，最可靠的方式是对比 md5（当前修复版 = `e4db129fb8add4a844aa306b2c219387`），或 `docker cp` 出来本地 `PRAGMA table_info(sku)` 看有没有 `bar_code`。

## 构建期修掉的三个坑（Dockerfile/deploy.sh 已内置）

1. Git Bash 下构建上下文路径要 `cygpath -m` 转成 Windows 格式；
2. node:16 镜像自带 yarn，`npm install -g yarn` 会 EEXIST；
3. 上游 yarn.lock 与 package.json 不同步（不能 --frozen-lockfile）+ `vue-tsc` 类型检查本身就不过（几百个 $t 报错）→ 直接 `yarn vite build` 跳过类型检查。

## 切 MySQL（可选）

1. 取消 `docker-compose.yml` 里 mysql 服务和 backend 的 MySQL 环境变量注释；
2. **先建表**：原项目没有 EF 迁移、启动也不会自动建表（`EnsureCreated` 未被调用），需在容器里执行一次建表，或用官方文档的 SQL 脚本导入 `wms` 库。

## 镜像重建说明（国内网络）

- `backend`（mcr.microsoft.com 基础镜像）与 `frontend-v2`（nginx:latest）本地可正常重建，已验证；
- `frontend`（v1）需要从 Docker Hub 拉 `node:16-bullseye`，国内直连常报 `auth.docker.io Bad Gateway`——v1 为冻结的上游参考代码，拉不动时保留现有镜像即可，不影响 backend 与 frontend-v2；
- 首次 clone 后若本地无任何镜像，先跑 `docker pull nginx:latest` 与 backend 构建，v1 可跳过（compose 里 v1 服务注释掉即可）。

## 文件说明

| 文件 | 作用 |
|---|---|
| docker-compose.yml | 服务编排（backend / frontend / 可选 mysql） |
| backend.Dockerfile | sdk:7.0 编译 → aspnet:7.0 运行，拷入 wms.db 种子库 |
| frontend.Dockerfile | node:16 yarn build → nginx 托管 dist |
| nginx.conf | 前端静态托管 + hash 路由回退 |
| deploy.sh | 构建 + 启动一条龙 |

## 已知注意点（继承自原项目，生产前必改）

- JWT SigningKey 是默认值 `ModernWMS_SigningKey`（appsettings.json / TokenSettings）；
- Hangfire Dashboard（/hangfire）无鉴权；
- 密码是 MD5 存储与传输；
- 这些属于原项目问题，重建版未改动业务代码，只重做部署。
