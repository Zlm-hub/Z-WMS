/**
 * 套件 s7：出库取消/回滚链路 round-trip（API 驱动，上游 CancelOrderOpration 全路径）
 * A 锁定释放链：建单→确认订单(锁库+生成拣货单)→取消锁定→拣货单删除、库存回池
 * B 逐级回退链：打包→取消打包→取消拣货→取消锁定→删除整单，每级断言状态与数量归零
 * C 取消零流水：全程 stockadjust 总数不变（取消不碰库存账）
 * 自清洁：盘点清零 2 条测试库存
 * 契约备忘（上游）：
 * - POST /dispatchlist/cancel-order {dispatch_no, dispatch_status}：status=2→1 释放锁；
 *   status=3→2 清 picked_qty。收单个对象
 * - PUT /dispatchlist/cancel-order?id=：取消打包/称重明细（4→3 或 5；5→3 或 4）
 * - DELETE /dispatchlist?dispatch_no=：删整单（仅 status≤1）
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

module.exports = async function run(ctx) {
  const { api, report, cfg } = ctx
  const S = 's7_cancel'

  // ---- 前置：客户（复用/自建） + 2 条 qty=1 测试库存 ----
  let customers = await api.call('GET', '/customer/all', undefined, 'customer/all').catch(() => [])
  let customer = (customers || []).find((c) => c.customer_name === 'RT测试客户')
  if (!customer) {
    await api.req('POST', '/customer', { customer_name: 'RT测试客户', city: '成都', address: '测试地址', manager: 'admin', email: '', contact_tel: '', is_valid: true })
    customers = await api.call('GET', '/customer/all', undefined, 'customer/all2')
    customer = (customers || []).find((c) => c.customer_name === 'RT测试客户')
  }
  report.step(S, 'prereq/customer', !!customer, customer ? `id=${customer.id}` : '未找到')

  const td = await require('../lib/inbound').buildInboundStock(ctx, 2, S, cfg.tag + 'C')
  const [sn1, sn2] = td.serials
  report.step(S, 'prereq/stock', td.stocks.length === 2, `${sn1} ${sn2} 各 qty=1`)

  // 流水基线（入库会产生流水，从现在起取消操作不应再新增）
  const adjBase = (await api.list('stockadjust', 1)).data.totals

  /** 建单并返回 dispatch_no（对比建单前后的 dispatch_no 差集） */
  const knownNos = async () => new Set(((await api.list('dispatchlist', 100)).data.rows || []).map((r) => r.dispatch_no))
  const createOrder = async () => {
    const before = await knownNos()
    await api.call('POST', '/dispatchlist', [{
      customer_id: customer.id, customer_name: customer.customer_name,
      sku_id: td.skuId, qty: 1, weight: 0, volume: 0
    }], 'dispatch/create')
    await sleep(500)
    const after = (await api.list('dispatchlist', 100)).data.rows || []
    return after.filter((r) => !before.has(r.dispatch_no) && r.dispatch_status === 0).sort((a, b) => b.id - a.id)[0]
  }
  const rowsOf = async (no) => ((await api.list('dispatchlist', 100)).data.rows || []).filter((r) => r.dispatch_no === no)
  const confirmOrder = async (no) => {
    const plan = await api.call('GET', `/dispatchlist/confirm-check?dispatch_no=${encodeURIComponent(no)}`, undefined, 'confirm-check')
    await api.call('POST', '/dispatchlist/confirm-order', (Array.isArray(plan) ? plan : [plan]).map((d) => ({ ...d, confirm: true })), 'confirm-order')
    await sleep(500)
  }

  // ================= A. 锁定释放链 =================
  const rowA = await createOrder()
  report.step(S, 'A/create', !!rowA && rowA.dispatch_status === 0, `no=${rowA?.dispatch_no}`)
  await confirmOrder(rowA.dispatch_no)
  let rows = await rowsOf(rowA.dispatch_no)
  const pickAfterConfirm = await api.call('GET', `/dispatchlist/pick-list?dispatch_id=${rows[0].id}`, undefined, 'pick-list')
  const stockLocked = await api.stockBySerial(sn1)
  // 失败时把可见行的实际数量带上，便于区分「锁没落库」还是「可用量算错」
  const lockDiag = stockLocked
    ? `（qty=${stockLocked.qty} avail=${stockLocked.qty_available} freeze=${stockLocked.is_freeze}）`
    : ''
  report.step(S, 'A/confirm-lock', rows.every((r) => r.dispatch_status === 2 && r.lock_qty === 1)
    && Array.isArray(pickAfterConfirm) && pickAfterConfirm.length > 0 && !stockLocked,
    `status=2 lock=1 picklist=${pickAfterConfirm?.length} 库存可见=${!!stockLocked}${lockDiag}（锁定应隐藏）`)

  await api.call('POST', '/dispatchlist/cancel-order', { dispatch_no: rowA.dispatch_no, dispatch_status: 2 }, 'cancel-lock')
  await sleep(500)
  rows = await rowsOf(rowA.dispatch_no)
  const pickAfterCancel = await api.call('GET', `/dispatchlist/pick-list?dispatch_id=${rows[0].id}`, undefined, 'pick-list2')
  const stockReleased = await api.stockBySerial(sn1)
  report.step(S, 'A/cancel-release', rows.every((r) => r.dispatch_status === 1 && r.lock_qty === 0)
    && Array.isArray(pickAfterCancel) && pickAfterCancel.length === 0 && stockReleased && stockReleased.qty === 1,
    `status=1 lock=0 picklist=${pickAfterCancel?.length} 库存回池 qty=${stockReleased?.qty}`)

  // ================= B. 逐级回退链 =================
  const rowB = await createOrder()
  await confirmOrder(rowB.dispatch_no)
  await api.req('PUT', `/dispatchlist/confirm-pick-dispatchlistno?dispatch_no=${encodeURIComponent(rowB.dispatch_no)}`)
  await sleep(500)
  let b = (await rowsOf(rowB.dispatch_no))[0]
  report.step(S, 'B/pick', b.dispatch_status === 3 && b.picked_qty === 1, `status=${b.dispatch_status} picked=${b.picked_qty}`)

  // 打包 → 4
  await api.call('POST', '/dispatchlist/package', [{
    id: b.id, dispatch_no: b.dispatch_no, dispatch_status: b.dispatch_status,
    package_qty: 1, picked_qty: b.picked_qty
  }], 'package')
  await sleep(500)
  b = (await rowsOf(rowB.dispatch_no))[0]
  report.step(S, 'B/package', b.dispatch_status === 4 && b.package_qty === 1, `status=${b.dispatch_status} package=${b.package_qty}`)

  // 取消打包（PUT ?id=）→ 回 3
  await api.call('PUT', `/dispatchlist/cancel-order?id=${b.id}`, undefined, 'cancel-package')
  await sleep(500)
  b = (await rowsOf(rowB.dispatch_no))[0]
  report.step(S, 'B/cancel-package', b.dispatch_status === 3 && b.package_qty === 0, `status=${b.dispatch_status} package=${b.package_qty}`)

  // 取消拣货（POST status=3）→ 回 2
  await api.call('POST', '/dispatchlist/cancel-order', { dispatch_no: b.dispatch_no, dispatch_status: 3 }, 'cancel-pick')
  await sleep(500)
  b = (await rowsOf(rowB.dispatch_no))[0]
  report.step(S, 'B/cancel-pick', b.dispatch_status === 2 && b.picked_qty === 0, `status=${b.dispatch_status} picked=${b.picked_qty}`)

  // 取消锁定（POST status=2）→ 回 1；随后 DELETE 整单（status≤1 可删）
  await api.call('POST', '/dispatchlist/cancel-order', { dispatch_no: b.dispatch_no, dispatch_status: 2 }, 'cancel-lock2')
  await sleep(500)
  b = (await rowsOf(rowB.dispatch_no))[0]
  const stockB = await api.stockBySerial(sn2)
  report.step(S, 'B/cancel-lock', b.dispatch_status === 1 && b.lock_qty === 0 && stockB && stockB.qty === 1,
    `status=${b.dispatch_status} lock=${b.lock_qty} 库存回池 qty=${stockB?.qty}`)

  await api.call('DELETE', `/dispatchlist?dispatch_no=${encodeURIComponent(b.dispatch_no)}`, undefined, 'delete-order')
  await sleep(500)
  const bGone = (await rowsOf(rowB.dispatch_no)).length === 0
  report.step(S, 'B/delete', bGone, `整单删除 rows=${bGone ? 0 : '残留'}`)

  // ================= C. 取消零流水 =================
  const adjAfter = (await api.list('stockadjust', 1)).data.totals
  report.step(S, 'C/no-stockadjust', adjAfter === adjBase, `stockadjust ${adjBase} -> ${adjAfter}`)

  // ================= 自清洁：盘点清零 sn1/sn2 =================
  for (const sn of [sn1, sn2]) {
    try {
      const s = await api.stockBySerial(sn)
      if (!s || s.qty === 0) { report.step(S, `cleanup/${sn.slice(-4)}`, true, '已是 0'); continue }
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
      report.step(S, `cleanup/${sn.slice(-4)}`, !after || after.qty === 0 || after.qty_available === 0, `qty=${after?.qty ?? 'gone'}`)
    } catch (e) {
      report.step(S, `cleanup/${sn.slice(-4)}`, false, e.message)
    }
  }
}
