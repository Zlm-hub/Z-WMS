/**
 * 套件 s5：仓内作业四链路 round-trip（UI 驱动 + API 核对）
 * 使用 s4 产出的 4 条测试库存（同 SPU 库位 1，各 qty=1）：
 *   T1: 冻结→解冻（可逆）→ 作为加工成品行被 +1 → 盘点清零（自清洁）
 *   T2: 移库 A→B→A（可逆）→ 盘点清零（自清洁，同时验证差异 -1 过账路径）
 *   T3: 盘点零差异（建单→录实盘→过账，qty 不变）→ 盘点清零（自清洁）
 *   T4: 作为加工原料被消耗（qty→0）
 * 清洁后 4 条库存 qty 全为 0（行保留作审计，可从默认池不可见）
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

module.exports = async function run(ctx) {
  const { api, ui, b, report, cfg } = ctx
  const S = 's5_warehouse'
  const [T1, T2, T3, T4] = ctx.testData.serials
  const postWait = cfg.postWait

  // ============ 1. 冻结→解冻（T1，可逆） ============
  {
    await ui.gotoPage('#/warehouseFreeze')
    await ui.clickText('body', '新建冻结', false)
    await sleep(cfg.stepWait)
    let r = await ui.pickOption('.n-modal', 0, T1)
    if (r !== 'OK') report.abort(S, 'freeze-pick', r)
    await b.screenshot(cfg.outDir + '/s5_freeze.png')
    await ui.clickText('.n-modal', '提交')
    await sleep(postWait)
    let s = await api.stockBySerial(T1)
    report.step(S, 'freeze', await ui.modalGone() && s?.is_freeze === true, `is_freeze=${s?.is_freeze}`)

    await ui.clickText('body', '新建解冻', false)
    await sleep(cfg.stepWait)
    r = await ui.pickOption('.n-modal', 0, T1)
    if (r !== 'OK') report.abort(S, 'unfreeze-pick', r)
    await ui.clickText('.n-modal', '提交')
    await sleep(postWait)
    s = await api.stockBySerial(T1)
    report.step(S, 'unfreeze', await ui.modalGone() && s?.is_freeze === false, `is_freeze=${s?.is_freeze}`)
  }

  // ============ 2. 移库 A→B→A（T2，可逆；openCreate 重拉快照支持连续作业） ============
  {
    // 前置先备齐第二库位：必须在导航进移库页之前——页面 onMounted 只拉一次库位下拉，
    // 进页后再建库位不会出现在选项里（CI 首跑暴露）
    const locs = await api.locations()
    const src0 = await api.stockBySerial(T2)
    const srcLoc = locs.find((l) => l.id === src0?.goods_location_id)

    // 目标库位必须「库位名唯一」：开发库中可能同时存在多个叫 A-01-01 的库位（烟测仓 / 智造一号仓），
    // 而 pickOption 按文本 contains 匹配第一个，很容易选中来源库位本身 → 页面弹
    // 「移出/移入库位不能相同」、建单静默失败，而 location_name 前后一致又让断言假绿（真实踩过）
    const nameCount = locs.reduce((m, l) => { m[l.location_name] = (m[l.location_name] || 0) + 1; return m }, {})
    let dest = locs.find((l) => l.id !== srcLoc?.id && nameCount[l.location_name] === 1)
    if (!dest) {
      // 全新种子库只有 1 个库位：自建第二个（仅 location_name 有唯一约束）
      const d = await api.req('POST', '/goodslocation', {
        warehouse_id: 1, warehouse_name: '烟测仓', warehouse_area_id: 0,
        warehouse_area_name: 'A-01', warehouse_area_property: 0,
        location_name: 'A-01-RT', location_length: 10, location_width: 10,
        location_heigth: 10, location_volume: 1000, location_load: 100,
        roadway_number: '', shelf_number: '', is_valid: true
      })
      if (!d.isSuccess) report.abort(S, 'move-setup', '自建第二库位失败: ' + d.errorMessage)
      dest = (await api.locations()).find((l) => l.location_name === 'A-01-RT')
      report.step(S, 'move-setup/seed-loc', !!dest, '自建第二库位 A-01-RT')
    }
    if (!srcLoc || !dest) report.abort(S, 'move-setup/loc', `来源库位=${srcLoc?.id} 目标库位=${dest?.id}`)

    await ui.gotoPage('#/warehouseMove')

    // 库位下拉 label 是「仓库 / 库位」（warehouseMove.vue 的 destOptions），按完整 label 匹配才唯一
    const locLabel = (l) => `${l.warehouse_name} / ${l.location_name}`
    for (const [leg, target] of [['go', dest], ['back', srcLoc]]) {
      await ui.clickText('body', '新建移库', false)
      await sleep(cfg.stepWait)
      let r = await ui.pickOption('.n-modal', 0, T2)
      if (r !== 'OK') report.abort(S, `move-${leg}-pick-src`, r)
      r = await ui.pickOption('.n-modal', 1, locLabel(target))
      if (r !== 'OK') report.abort(S, `move-${leg}-pick-dest`, r)
      if (leg === 'go') await b.screenshot(cfg.outDir + '/s5_move.png')
      await ui.clickText('.n-modal', '提交')
      await sleep(postWait)
      // 确认移库
      await ui.clickText('.n-data-table', '确认移库', false)
      await sleep(cfg.stepWait)
      await ui.clickDialog('确认过账', true)
      await sleep(postWait + 500)
      const s = await api.stockBySerial(T2)
      report.step(S, `move-${leg}`, s?.goods_location_id === target.id,
        `loc=${s?.warehouse_name}/${s?.location_name}(${s?.goods_location_id}) 期望=${locLabel(target)}(${target.id})`)

      // 移库必须落库存流水（job_type=4：来源库位 -N、目标库位 +N 各一条）。
      // 上游 Confirm 全程不碰 stockadjust，这类「改了库存却查不到痕迹」的作业是本轮要补的
      const mvRows = (await api.list('stockmove')).data.rows
        .filter((m) => m.series_number === T2 && m.move_status === 1)
      const mv = mvRows.sort((a, b) => b.id - a.id)[0]
      const adj = mv ? await api.adjustsBySource(4, mv.id) : []
      report.step(S, `move-${leg}-adjust`,
        !!mv && adj.length === 2
          && adj.some((x) => x.qty === -mv.qty) && adj.some((x) => x.qty === mv.qty)
          && new Set(adj.map((x) => x.goods_location_id)).size === 2,
        `move=${mv?.id ?? '缺失'} job_type=4 流水 ${adj.length} 条 qty=[${adj.map((x) => x.qty).join(',')}] loc=[${adj.map((x) => x.location_name).join(',')}]`)

      // 关键词检索（后端 PageSearch 原本没有 searchValue 字段，列表页搜索框一直是摆设）
      const byKw = mv ? await api.req('POST', '/stockadjust/list', {
        pageIndex: 1, pageSize: 2000, sqlTitle: '', searchValue: mv.job_code
      }) : null
      const kwRows = byKw?.data?.rows || []
      report.step(S, `move-${leg}-adjust-search`,
        kwRows.length >= 2 && kwRows.every((x) => x.job_code === mv.job_code),
        `关键词=${mv?.job_code} 命中 ${kwRows.length} 条，单号集合=[${[...new Set(kwRows.map((x) => x.job_code))].join(',')}]`)
    }
  }

  // ============ 3. 盘点零差异（T3：建单→录实盘=账面→过账，qty 不变） ============
  {
    await ui.gotoPage('#/warehouseTaking')
    await ui.clickText('body', '新建盘点单', false)
    await sleep(cfg.stepWait)
    let r = await ui.pickOption('.n-modal', 0, T3)
    if (r !== 'OK') report.abort(S, 'taking-pick', r)
    await ui.clickText('.n-modal', '提交')
    await sleep(postWait)

    r = await ui.clickText('.n-data-table', '录实盘数', false)
    await sleep(cfg.stepWait)
    await b.screenshot(cfg.outDir + '/s5_taking_count.png')
    await ui.clickText('.n-modal', '提交') // 默认=账面 → 零差异
    await sleep(postWait)
    const list = (await api.list('stocktaking')).data
    const row = list.rows.find((x) => x.series_number === T3)
    report.step(S, 'taking-zero-diff', row?.job_status === true && row?.difference_qty === 0,
      `job_status=${row?.job_status} diff=${row?.difference_qty}`)

    // 差异过账（零差异：库存不变，stockadjust 生成）
    await ui.clickText('.n-data-table', '差异过账', false)
    await sleep(cfg.stepWait)
    await ui.clickDialog('过账', true)
    await sleep(postWait + 500)
    const row2 = (await api.list('stocktaking')).data.rows.find((x) => x.series_number === T3)
    const s = await api.stockBySerial(T3)
    report.step(S, 'taking-post', row2?.adjust_status === true && s?.qty === 1,
      `adjust_status=${row2?.adjust_status} qty=${s?.qty}`)
  }

  // ============ 4. 加工（T4 原料消耗 + T1 成品产出；process_status=false 显式传入） ============
  {
    const t1Before = await api.stockBySerial(T1)
    await ui.gotoPage('#/warehouseProcessing')
    await ui.clickText('body', '新建加工单', false)
    await sleep(cfg.stepWait + 400) // openCreate 异步重拉库存池
    // 弹窗内下拉顺序：行1库存(0)/行1类型(1)/行2库存(2)/行2类型(3)，类型默认正确
    let r = await ui.pickOption('.n-modal', 0, T4)
    if (r !== 'OK') report.abort(S, 'proc-pick-src', r)
    r = await ui.pickOption('.n-modal', 2, T1)
    if (r !== 'OK') report.abort(S, 'proc-pick-dest', r)
    await b.screenshot(cfg.outDir + '/s5_proc.png')
    await ui.clickText('.n-modal', '提交')
    await sleep(postWait)
    let row = (await api.list('stockprocess')).data.rows[0]
    report.step(S, 'proc-create', await ui.modalGone() && row?.process_status === false,
      `row0.process_status=${row?.process_status}（必须 false，上游 VM 默认 true 的坑）`)

    // 明细查看：列表页只回主表字段，明细靠 GET /stockprocess?id= 单独取
    await ui.clickText('.n-data-table', '查看明细', false)
    await sleep(cfg.stepWait + 400)
    const detailOk = await b.evaluate(`(() => {
      const t = document.querySelector('.n-modal')?.innerText || ''
      return t.includes('原料（过账扣减）') && t.includes('成品（过账增加）')
        && t.includes('${T4}') && t.includes('${T1}')
    })()`)
    report.step(S, 'proc-detail', detailOk === true, `弹窗含原料/成品分区与 ${T4}/${T1} 明细=${detailOk}`)
    await ui.clickText('.n-modal', '关闭')
    await sleep(cfg.stepWait)

    await ui.clickText('.n-data-table', '确认加工', false)
    await sleep(cfg.stepWait)
    await ui.clickDialog('确认', true)
    await sleep(postWait)
    row = (await api.list('stockprocess')).data.rows[0]
    report.step(S, 'proc-confirm', row?.process_status === true, `process_status=${row?.process_status}`)

    await ui.clickText('.n-data-table', '确认调整过账', false)
    await sleep(cfg.stepWait)
    await ui.clickDialog('确认过账', true)
    await sleep(postWait + 500)
    const s4after = await api.stockBySerial(T4)
    const s1after = await api.stockBySerial(T1)
    row = (await api.list('stockprocess')).data.rows[0]
    const consumed = s4after == null || s4after.qty === 0 || s4after.qty_available === 0
    const produced = s1after?.qty === (t1Before?.qty ?? 1) + 1
    report.step(S, 'proc-adjust', consumed && produced && row?.adjust_status === true,
      `T4(${consumed ? '已消耗' : 'qty=' + s4after?.qty}) T1(${t1Before?.qty}->${s1after?.qty}) adjust=${row?.adjust_status}`)
  }

  // ============ 4b. 未确认加工不得直接过账（后端强制，不只是 UI 隐藏按钮） ============
  {
    const t2 = await api.stockBySerial(T2)
    if (!t2) {
      report.step(S, 'proc-guard/setup', false, 'T2 库存行不存在，无法构造未确认加工单')
    } else {
      const created = await api.req('POST', '/stockprocess', {
        job_type: true,
        process_status: false,
        detailList: [{
          sku_id: t2.sku_id, goods_owner_id: t2.goods_owner_id, goods_location_id: t2.goods_location_id,
          series_number: t2.series_number, expiry_date: t2.expiry_date, price: t2.price, putaway_date: t2.putaway_date,
          qty: 1, is_source: true,
          spu_code: t2.spu_code ?? '', spu_name: t2.spu_name ?? '', sku_code: t2.sku_code ?? '', location_name: t2.location_name ?? ''
        }]
      })
      const pid = created.data
      const blocked = pid > 0 ? await api.req('PUT', `/stockprocess/adjustment-confirm?id=${pid}`) : {}
      // 未确认加工的原料行会被计入可用量占用（StockService 的 pl = process_locked），
      // 该行会退出「可用库存」池（sqlTitle='' 过滤 qty_available>0），要看真实数量需查 sqlTitle='all'
      const rawRows = (await api.req('POST', '/stock/select', { pageIndex: 1, pageSize: 2000, sqlTitle: 'all', searchValue: '' })).data?.rows || []
      const locked = rawRows.find((r) => r.series_number === T2) || null
      const availGone = (await api.stockBySerial(T2)) === null
      report.step(S, 'proc-guard/unconfirmed',
        created.isSuccess === true && pid > 0 && blocked.isSuccess === false
        && locked?.qty === t2.qty && locked?.qty_available === 0 && availGone,
        `建单=${created.isSuccess} 跳过确认直接过账被拒=${blocked.isSuccess === false} msg=${blocked.errorMessage || '-'} qty未变=${locked?.qty} 可用量=${locked?.qty_available}(占用) 已退出可用池=${availGone}`)
      if (pid > 0) await api.req('DELETE', `/stockprocess?id=${pid}`) // 自清洁：未确认单可删
    }
  }

  // ============ 4c. 连续部分移库必须合并到同一目标行 ============
  // 上游 Confirm 里目标行条件误写成 t.sku_id != entity.sku_id：合并永远命中不了，
  // 每次确认都新建一行 → 同一批货被拆成多条重复库存行（下游按 7 键 FirstOrDefault 会误判库存不足），
  // 极端情况下还会把数量加到「同库位同价格同入库日期的另一个 SKU」上。
  {
    const t3 = await api.stockBySerial(T3)
    const locs = await api.locations()
    const destLoc = t3 ? locs.find((l) => l.id !== t3.goods_location_id) : null
    if (!t3 || !destLoc) {
      report.step(S, 'move-merge/setup', false, '缺少 T3 库存行或第二库位')
    } else {
      const rawAll = async () => (await api.req('POST', '/stock/select', { pageIndex: 1, pageSize: 2000, sqlTitle: 'all', searchValue: '' })).data?.rows || []
      const mkMove = (st, dest, qty) => ({
        sku_id: st.sku_id, goods_owner_id: st.goods_owner_id,
        series_number: st.series_number, expiry_date: st.expiry_date,
        price: st.price, putaway_date: st.putaway_date,
        orig_goods_location_id: st.goods_location_id,
        orig_goods_warehouse: st.warehouse_name, orig_goods_location_name: st.location_name,
        dest_googs_location_id: dest.id,
        dest_googs_warehouse: dest.warehouse_name, dest_googs_location_name: dest.location_name,
        qty,
        spu_code: st.spu_code ?? '', spu_name: st.spu_name ?? '',
        sku_code: st.sku_code ?? '', sku_name: st.sku_name ?? ''
      })
      const doMove = async (st, dest, qty, tag) => {
        await api.call('POST', '/stockmove', mkMove(st, dest, qty), tag + '/create')
        const row = (await api.list('stockmove')).data.rows.find((r) => r.move_status === 0)
        if (!row) throw new Error(tag + ': 找不到待移库单')
        await api.call('PUT', `/stockmove?id=${row.id}`, undefined, tag + '/confirm')
      }

      // 把 T3 账面拉到 5（建单 → 录实盘 5 → 差异过账），才有"部分移库"的可能
      const createdTK = await api.call('POST', '/stocktaking', {
        sku_id: t3.sku_id, goods_owner_id: t3.goods_owner_id, goods_location_id: t3.goods_location_id,
        series_number: t3.series_number, expiry_date: t3.expiry_date, price: t3.price, putaway_date: t3.putaway_date,
        book_qty: t3.qty,
        warehouse_name: t3.warehouse_name, location_name: t3.location_name,
        spu_code: t3.spu_code ?? '', spu_name: t3.spu_name ?? '', sku_code: t3.sku_code ?? '', sku_name: t3.sku_name ?? ''
      }, 'move-merge/inflate-create')
      const inflateId = typeof createdTK === 'number' && createdTK > 0
        ? createdTK
        : (await api.list('stocktaking')).data.rows.find((x) => x.series_number === T3).id
      await api.call('PUT', '/stocktaking', { id: inflateId, counted_qty: 5 }, 'move-merge/inflate-count')
      await api.call('PUT', `/stocktaking/adjustment-confirm?id=${inflateId}`, undefined, 'move-merge/inflate-post')

      // 连续两次移 2 件到同一库位：正确实现应合并成「目标 1 行 qty=4」
      const after5 = (await rawAll()).find((r) => r.series_number === T3) || t3
      await doMove(after5, destLoc, 2, 'move-merge/first')
      const afterFirst = (await rawAll()).find((r) => r.series_number === T3 && r.goods_location_id === after5.goods_location_id) || after5
      await doMove(afterFirst, destLoc, 2, 'move-merge/second')

      const destRows = (await rawAll()).filter((r) => r.series_number === T3 && r.goods_location_id === destLoc.id)
      report.step(S, 'move-merge/partial',
        destRows.length === 1 && destRows[0].qty === 4,
        `目标库位 ${destLoc.location_name} 行数=${destRows.length}（应为 1）qty=${destRows.map((r) => r.qty).join('+')}（应为 4）`)

      // 移回去，交给第 5 段盘点清零，避免残留
      const back = (await rawAll()).find((r) => r.series_number === T3 && r.goods_location_id === destLoc.id)
      if (back) await doMove(back, { ...destLoc, id: after5.goods_location_id, warehouse_name: after5.warehouse_name, location_name: after5.location_name }, back.qty, 'move-merge/restore')
    }
  }

  // ============ 5. 自清洁：盘点清零 T1/T2/T3（API 走与 UI 相同的三步接口） ============
  for (const sn of [T1, T2, T3]) {
    try {
      const s = await api.stockBySerial(sn)
      if (!s || s.qty === 0) { report.step(S, `cleanup/${sn.slice(-4)}`, true, '已是 0'); continue }
      // 与 UI 相同的三步：建单(账面) → 录实盘 0 → 差异过账
      await api.call('POST', '/stocktaking', {
        sku_id: s.sku_id, goods_owner_id: s.goods_owner_id, goods_location_id: s.goods_location_id,
        series_number: s.series_number, expiry_date: s.expiry_date, price: s.price, putaway_date: s.putaway_date,
        book_qty: s.qty,
        warehouse_name: s.warehouse_name, location_name: s.location_name,
        spu_code: s.spu_code ?? '', spu_name: s.spu_name ?? '', sku_code: s.sku_code ?? '', sku_name: s.sku_name ?? ''
      }, 'cleanup/create/' + sn)
      const row = (await api.list('stocktaking')).data.rows.find((x) => x.series_number === sn)
      await api.call('PUT', '/stocktaking', { id: row.id, counted_qty: 0 }, 'cleanup/count/' + sn)
      await api.call('PUT', `/stocktaking/adjustment-confirm?id=${row.id}`, undefined, 'cleanup/post/' + sn)
      const after = await api.stockBySerial(sn)
      report.step(S, `cleanup/${sn.slice(-4)}`, !after || after.qty === 0 || after.qty_available === 0,
        `qty=${after?.qty ?? 'gone'}`)
    } catch (e) {
      report.step(S, `cleanup/${sn.slice(-4)}`, false, e.message)
    }
  }
}
