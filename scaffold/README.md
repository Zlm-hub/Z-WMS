# WMS 核心脚手架

从 ModernWMS 逆向提炼的**可插拔二次开发骨架**：只保留核心记账模型与流程，全部重写为干净的最小实现，`dotnet run` 即用。

## 保留的核心思想（源自逆向结论）

| ModernWMS 原设计 | 脚手架实现 |
|---|---|
| `stock` 是唯一库存事实（SKU×库位×序列号 粒度，含冻结位） | `Stock` 实体，同粒度 + 唯一索引 |
| `stockadjust` 统一流水（job_code/source_table_id 溯源） | `StockAdjust`，所有库存变动**必须**经 `StockService` 留痕 |
| 入库状态机 0确认→1卸货→2分拣→3上架 | 简化为 0确认→1上架（序列号/分拣留了扩展点） |
| 出库锁定库存 + FIFO 拣货扣库 | `AllocateAsync` FIFO 分配库位 → pick 扣库 |
| 盘点差异过账 | `StockTake` 创建快照 → confirm 按差异过账 |
| JWT + 多租户字段 | JWT（PBKDF2 密码，修正原项目 MD5） |

## 运行

```bash
# 后端（需 .NET 7 SDK）
cd scaffold/backend
dotnet run            # http://localhost:5000，Swagger 在根路径，启动自动建表+种子数据

# 前端（可选，Node 16+）
cd scaffold/frontend
npm install && npm run dev   # http://localhost:5175，已配 /api 代理到 5000
```

首次使用：调 `POST /api/auth/register` 注册账号（或用前端页面"注册并登录"）。

## 结构

```
scaffold/backend/
├── Program.cs      宿主：SQLite 自动建表、JWT、CORS、Swagger
├── Domain.cs       领域模型（9 个核心实体）
├── Data.cs         DbContext + 种子数据（1 仓库 2 库位 2 商品）
├── StockService.cs 库存记账服务（唯一改库存入口）+ PBKDF2 密码工具
└── Endpoints.cs    Minimal API：auth / master / stock / inbound / outbound / stocktake
scaffold/frontend/  Vue3+Vite 最小界面（登录、库存表、快速出入库）
```

## API 速览

| 端点 | 说明 |
|---|---|
| POST /api/auth/register、/api/auth/login | 注册 / 登录（返回 JWT） |
| GET /api/master/skus、/api/master/locations | 商品、库位 |
| GET /api/stock | 库存查询 |
| POST /api/stock/adjust | 手工调整（正入负出，留流水） |
| POST /api/inbound → /{id}/confirm → /{id}/putaway | 入库三步 |
| POST /api/outbound → /{id}/confirm → /{id}/pick（或 /cancel） | 出库：创建→锁库分配→拣货扣库 |
| POST /api/stocktake → /{id}/confirm | 盘点：快照→差异过账 |

## 二次开发指引

1. **加一个业务单据**：Domain.cs 加实体 → Data.cs 加 DbSet → StockService 记账（禁止直接改 Stock）→ Endpoints.cs 加端点，四步完成。
2. **序列号/批次/效期**：Stock.SeriesNumber 已在唯一索引里，入库 putaway 时带上即可。
3. **冻结**：把 `Stock.IsFreeze` 置位，扣库自动拒绝冻结库存。
4. **换数据库**：Program.cs 里 `UseSqlite` 换成 `UseMySql`/`UseNpgsql` 即可（和原项目一致的四库可切换思路）。
5. **与原项目的差异**：去掉了多租户/Hangfire/审批流（原项目也未完成），需要时按报告第 2.2 节的自动装配思路加回。
