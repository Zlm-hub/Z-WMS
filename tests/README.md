# Z-WMS 自动化测试套件

可重复跑的全链路自动化测试：API 冒烟 → 全页面渲染 → CRUD → 入库建数 → 仓内作业 round-trip → 出库 round-trip。
技术栈：Node 22（fetch / WebSocket 原生）+ 裸 CDP 驱动 headless Chrome，无第三方依赖。
**CI**：`.github/workflows/tests.yml`，push(main/develop) 与 PR 自动跑全套，报告落 artifact。

## 运行

前置：backend(:20011) 与 frontend-v2(:8081) 已启动。

```bash
node run-all.js          # 全部 6 个套件
node run-all.js s1 s3    # 只跑指定套件（s5 依赖 s4，须同跑；s6 自建数据可单跑）
```

环境变量（见 `config.js`）：`WMS_API` `WMS_BASE` `WMS_USER` `WMS_PASS` `WMS_CHROME` `WMS_CDP_PORT` `WMS_TEST_OUT` 等。
产物（截图/报告 JSON）落 `config.outDir`（默认 `%TEMP%/zwms_test_out`）。

## 套件

| 套件 | 内容 | 方式 |
|---|---|---|
| s1_api_smoke | 登录 + 18 个 list + all/menus/select 类读接口探活，库位 id 非 0 校验 | API |
| s2_pages | 动态拉 `/rolemenu/menus` 逐页导航：表格/树渲染、统计 4 静态路由 | CDP UI |
| s3_crud | 角色设置 建→改(开关持久化)→删 round-trip（回归 CrudPage 丢主键） | CDP UI |
| s4_inbound | SPU→ASN→confirm→unload→sorting→sorted→putaway×4 建测试库存（复用 lib/inbound.js） | API |
| s5_warehouse | 冻结/解冻、移库 A→B→A、盘点零差异、加工三步 + 盘点清零自清洁 | UI+API |
| s6_dispatch | 出库 7 态 round-trip：新建(0)→确认订单(2 锁库)→拣货(3)→打包(4)→称重(5)→发运(6 扣库存)→签收(7)；自建 1 条 qty=1 库存被出库消耗，无残留 | UI+API |

## 测试数据策略（自给自足 + 自清洁）

- s4 每次运行创建带唯一前缀 `RT<tag>` 的 SPU/SKU 与 4 条库存（qty=1，库位 1）
- s5 用完这些库存后通过「盘点 counted=0 → 差异过账」把每条清零——stock 行保留作审计但 qty=0，从可用池消失，环境无可见残留
- 库存身份核对一律用 `series_number`（移库确认后 stock 行删旧建新，id 会变）

## 已沉淀的关键经验（改代码前先读）

1. **vite 内容哈希缓存坑**：验证新构建必须用全新 Chrome profile（本框架每次运行自动 mkdtemp 临时 profile）
2. **SPA 动态路由预热**：注入 token 后必须先导航 `/#/` 预热（约 4.5s），直接深跳业务页会落中间态
3. **保存类操作双信号**：验证「模态关闭 + API 数据变化」，只看 message 不可靠
4. **上游接口陷阱**（详见 `lib/api.js` 注释）：
   - `/stock/location-list` 的 `goods_location_id` 恒 0，目标库位一律用 `/goodslocation/all`
   - `StockprocessViewModel.process_status` 默认 true，建单必须显式传 false
   - `/stock/select` 默认池隐藏被未过账作业单占用的库存；冻结库存用 `sqlTitle=frozen` 查
   - 移库单 dest id=0 时被列表 inner join 隐身（dest 必须是真实库位 id）
   - 盘点建单 VM 无 counted_qty，录实盘走 `PUT /stocktaking {id, counted_qty}`
   - 仓内确认类接口（process-confirm / adjustment-confirm / stockmove PUT）收查询串 `?id=`，不是数组 body
   - `/userrole/list` 不存在（404），userrole/category 走 `GET /xxx/all` + 前端过滤
5. **CrudPage 组件文案约定**：工具栏「+ 新增」、模态确认「保存」、删除 dialog positiveText「删除」（不是"确定"）
6. **表单 label 匹配**：Naive UI 必填项 label 文本带 ` *` 后缀，按 label 定位输入框时需剥离
7. **Naive UI n-grid 只认 n-gi / n-form-item-gi 子元素**：直接写 n-form-item 会被静默丢弃（不报错、不渲染），明细表单整块消失
8. **wms.db 是 WAL 模式**：`docker exec cat wms.db` 单拷主文件是旧快照，排查数据必须连 `-wal/-shm` 一起拷或停容器
