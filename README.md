# Z-WMS

基于开源 ModernWMS（Apache 2.0）全面逆向后的二开项目：修复上游安全硬伤、重做前端、重构部署方案。

> 上游：https://github.com/fjykTec/ModernWMS （Apache 2.0，`backend/` 与 `frontend/` 继承自上游，安全修复为本地提交）
> 逆向结论详见 `ModernWMS逆向工程报告.md`。

## 仓库结构

| 目录 | 说明 |
|---|---|
| `backend/` | 后端 .NET 7（继承上游 + 安全修复：PBKDF2 密码 / JWT 密钥环境变量化 / Hangfire 鉴权） |
| `frontend/` | 前端 v1（上游原版，仅作对照与 v1 镜像构建源） |
| `frontend-v2/` | **主攻前端**：Vue3 + Pinia + Naive UI 全功能重做版（26+ 页，含统计分析 / 数据大屏 / 3D 库房） |
| `rebuild/` | 部署方案：docker-compose 三镜像 + seed 修复库 + `.env.example` |
| `scaffold/` | 从逆向结论提炼的最小可跑 WMS 骨架（.NET 7 + SQLite） |
| `docs/` | 验证截图 + `环境配置与启动指南.md` |

## 快速启动

```bash
cd rebuild
cp .env.example .env
bash deploy.sh
# 前端 v2  http://localhost:8081   （推荐）
# 前端 v1  http://localhost:8080
# 后端 API http://localhost:20011  （Swagger 在根路径）
# 默认账号 admin / 1
```

环境要求与源码运行方式见 `docs/环境配置与启动指南.md`。

## Git 开发流程（严格遵守）

分支模型：

```
main      稳定发布线：只接受 PR 合入，合并即发布，打 tag（v*）
develop   集成分支：日常开发的目标分支，功能验证通过后才 PR 进 main
feature/* 功能分支：从 develop 拉出，命名 feature/<模块>-<简述>，完成后 PR → develop
hotfix/*  线上修复：从 main 拉出，修复后 PR → main，并回合并到 develop
```

日常节奏：

```bash
git checkout develop && git pull origin develop
git checkout -b feature/frontend-xxx     # 1. 从 develop 拉功能分支
# ...开发...
git add <文件> && git commit -m "feat(frontend): xxx"   # 2. 小步提交
git push -u origin feature/frontend-xxx  # 3. 推分支
# 4. GitHub 上开 PR → develop，评审合并；禁止直接 push main/develop
```

Commit 规范：`type(scope): 简述`，type 取 `feat / fix / docs / refactor / test / chore / deploy`。

## 已知注意点

- 原项目无 EF 迁移，启动不自动建表：SQLite 走 `rebuild/seed/wms.db`（已修 schema）；换 MySQL/SqlServer/PostGres 必须先手工建表
- 生产上线前必改：`.env` 中 `WMS_JWT_SIGNINGKEY`、`WMS_HANGFIRE_PASS`、admin 默认密码（清单见启动指南）
