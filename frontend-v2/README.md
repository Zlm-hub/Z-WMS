# ModernWMS 前端 v2（Vue3 + Naive UI 重做版）

原版前端（Vuetify3 + Vuex4 + vxe-table，157 个 vue）的完全重做：浅色简洁控制台风，Pinia + Vue Router + Naive UI，体积从 3.8MB 降到 1.3MB。

## 快速开始

```bash
npm install        # node 18+ 本地开发
npm run dev        # 开发模式 :5173，VITE_API_BASE 可覆盖 API 地址

# 部署（本机构建 + nginx 托管，不依赖 Docker Hub 拉 node 镜像）
npm run build
docker build -t modernwms-frontend-v2:latest .
# compose 里 frontend-v2 服务映射 8081
```

## 架构

- `src/api/http.ts`：axios + ResultModel 解包 + JWT + 401 自动刷新重放（/refresh-token）
- `src/api/index.ts`：全部后端接口模块（对齐 API_REFERENCE.md）
- `src/router/dynamic.ts`：菜单驱动动态路由——`GET /rolemenu/menus` 返回 `vue_directory/vue_path`，映射到 `src/views/<directory>/<path>.vue`（与原版机制一致）
- `src/components/CrudPage.vue`：声明式 CRUD 页面（搜索/分页/表格/新增编辑弹窗），配置 fields 即得一个完整页面
- `src/constants/menuNames.ts`：菜单中文映射（提取自原版 cn.json）

## 页面清单（对齐原版 19 个菜单 + 首页）

基础资料 11 页（公司/角色/权限/用户/类别/商品/供应商/仓库/货主/运费/客户）+ 收货管理（入库全流程）+ 库存管理（库存/库位/库龄）+ 库内作业 5 页（加工/移动/冻结/调整/盘点）+ 发货管理（7 状态流转）+ 统计分析 4 页（入库/发货/安全库存/库龄，ECharts）+ 全屏独立页 2 个：数据大屏 `/large-screen`（深色 ECharts 多图，真实库存/出入库数据）、3D 库房 `/vwms`（CSS 3D 货架 + 库位热力着色 + 点击详情，`/stock/location-list` 真实数据驱动——改进原版 mock）。入口挂在工作台快捷卡与侧边栏「总览」组。

## 已验证（2026-10-16）

- 构建通过（vite 4，1.3MB）；31 个后端依赖接口全部 PASS
- 浏览器层：登录 → 动态菜单渲染 → 首页库存概览 → 收货管理页真实数据 + 状态操作按钮 → 统计分析页（ECharts 趋势图）→ 数据大屏 + 3D 库房真实渲染，截图见 ../docs/
- 3D 库房库位名解析：5 段式（mn-1-1-5-45）取末三位 排/列/层，3 段式（A-01-01）取末两位 排/列，同名库位记录合并计总量
- 后端配套安全修复：JWT 密钥环境变量化（WMS_JWT_SIGNINGKEY）、密码 MD5→PBKDF2（存量登录自动升级）、Hangfire 面板 Basic 认证（WMS_HANGFIRE_USER/PASS）

## 踩坑记录

1. axios `http.get<T, R>` 的泛型只是类型断言，运行时返回 AxiosResponse——必须走 request() 封装解包
2. 动态路由注册标记不能放在"首次进入"就置位（未登录的首次访问会把菜单注册烧掉），要在确认已登录后再注册
3. API 基址固定打后端端口 20011，不要取当前页面端口（前端在 8081/8080，后端在 20011）
4. 种子库 menu.menu_actions / rolemenu.menu_actions_authority 为 NULL 会让 /rolemenu/menus 直接 operation_failed（已修 seed）
