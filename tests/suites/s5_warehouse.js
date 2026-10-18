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
    await ui.gotoPage('#/warehouseMove')
    const locs = await api.locations()
    const dest = locs.find((l) => l.id !== 1) // A-01-02
    if (!dest) report.abort(S, 'move-setup', '需要第二个库位')

    for (const [destId, destName, leg] of [[dest.id, dest.location_name, 'go'], [1, 'A-01-01', 'back']]) {
      await ui.clickText('body', '新建移库', false)
      await sleep(cfg.stepWait)
      let r = await ui.pickOption('.n-modal', 0, T2)
      if (r !== 'OK') report.abort(S, `move-${leg}-pick-src`, r)
      r = await ui.pickOption('.n-modal', 1, destName)
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
      report.step(S, `move-${leg}`, s?.location_name === destName,
        `location=${s?.location_name} 期望=${destName}`)
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
