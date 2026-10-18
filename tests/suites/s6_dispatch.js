/**
 * 套件 s6：出库（dispatch）写入链路 round-trip —— UI 驱动完整 7 态流转
 * 前置：无（自建 1 条 qty=1 测试库存 + 必要时自建客户）
 * 流转：新建发货单(0) → 确认订单(2 锁库存) → 拣货(3) → 打包(4) → 称重(5)
 *       → 发运(6 扣库存：stock qty-=picked_qty) → 签收(7)
 * 自清洁：唯一测试库存被出库消耗到 0，可用池自然消失，无残留
 */
const path = require('path')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

module.exports = async function run(ctx) {
  const { api, report, cfg, b, ui } = ctx
  const S = 's6_dispatch'
  const OUT = path.join(cfg.outDir, 's6')
  require('fs').mkdirSync(OUT, { recursive: true })
  const results = []
  const rec = (step, ok, detail) => { results.push({ step, ok, detail }); report.step(S, step, ok, String(detail).slice(0, 200)) }
  const shot = async (name) => { try { await b.screenshot(path.join(OUT, name)) } catch { /* ignore */ } }

  // ---- 0. 前置数据：客户（种子库为空则自建）+ 1 条 qty=1 测试库存 ----
  let customers = await api.call('GET', '/customer/all', undefined, 'customer/all').catch(() => [])
  let customer = (customers || []).find((c) => c.customer_name === 'RT测试客户')
  if (!customer) {
    const d = await api.req('POST', '/customer', { customer_name: 'RT测试客户', city: '成都', address: '测试地址', manager: 'admin', email: '', contact_tel: '', is_valid: true })
    if (!d.isSuccess) { rec('prereq/customer', false, d.errorMessage); return results }
    customers = await api.call('GET', '/customer/all', undefined, 'customer/all2')
    customer = (customers || []).find((c) => c.customer_name === 'RT测试客户')
  }
  rec('prereq/customer', !!customer, customer ? `id=${customer.id}` : '未找到')

  const td = await require('../lib/inbound').buildInboundStock(ctx, 1, S, cfg.tag + 'D')
  const skuId = td.skuId
  const sn = td.serials[0]
  const before = await api.stockBySerial(sn)
  rec('prereq/stock', !!before && before.qty === 1, `${sn} qty=${before?.qty}`)

  // ---- 1. UI：进入发货管理页（菜单 vue_path=deliveryManagement）----
  await b.navigate(`${cfg.base}/#/deliveryManagement`, cfg.pageSettle)
  await b.waitTable()
  // 覆写 window.prompt：第 1 次是称重重量 1.0kg，第 2 次是签收破损数 0
  await b.evaluate('window.__pc = 0; window.prompt = () => (++window.__pc === 1 ? "1.0" : "0")')

  /** 在含 tag 文本的行里点指定按钮 */
  const rowBtn = (btnText, tagStr) => b.evaluate(`(() => {
    const tr = [...document.querySelectorAll('.n-data-table tbody tr')].find(r => r.textContent.includes(${JSON.stringify(tagStr)}))
    if (!tr) return 'NO_ROW'
    const btn = [...tr.querySelectorAll('button')].find(x => x.textContent.trim() === ${JSON.stringify(btnText)})
    if (!btn) return 'NO_BTN:' + tr.textContent.slice(0, 60)
    btn.click(); return 'OK'
  })()`)
  /** 行内状态标签文本 */
  const rowStatus = (tagStr) => b.evaluate(`(() => {
    const tr = [...document.querySelectorAll('.n-data-table tbody tr')].find(r => r.textContent.includes(${JSON.stringify(tagStr)}))
    return tr ? (tr.querySelector('.n-tag')?.textContent.trim() || 'NO_TAG') : 'NO_ROW'
  })()`)
  /** 等待行状态变为期望值（UI 刷新 + 轮询） */
  const waitStatus = async (tagStr, expect, tries = 10) => {
    for (let i = 0; i < tries; i++) {
      const s = await rowStatus(tagStr)
      if (s === expect) return s
      await sleep(700)
    }
    return rowStatus(tagStr)
  }

  // ---- 2. 新建发货单 ----
  const r0 = await ui.clickText('body', '新建发货单', false)
  if (r0 !== 'OK') { rec('create/open-modal', false, r0); await shot('fail_create.png'); return results }
  await sleep(1200)
  const rc = await ui.pickOption('.n-modal', 0, 'RT测试客户')
  if (rc !== 'OK') { rec('create/customer-select', false, rc); await shot('fail_create.png'); return results }
  // SKU 下拉：选项 label = "spu_name / sku_name（sku_code）"，等选项加载（mounted 异步逐个 SPU 拉取，可能较慢）
  let rs = 'NO_OPTION:loading'
  for (let i = 0; i < 15; i++) {
    rs = await ui.pickOption('.n-modal', 1, td.tag)
    if (rs === 'OK') break
    if (!String(rs).startsWith('NO_OPTION')) break
    await sleep(800)
    await ui.clickText('.n-modal', '商品规格', false).catch(() => {})
  }
  if (rs !== 'OK') { rec('create/sku-select', false, rs); await shot('fail_create.png'); return results }
  rec('create/selects', true, `customer+sku(${td.tag})`)

  await ui.clickText('.n-modal', '创建', true)
  await sleep(cfg.postWait + 500)
  const gone = await ui.modalGone()
  const msg = await ui.lastMessage()
  const st0 = await waitStatus(td.tag, '新订单')
  rec('create', gone && st0 === '新订单', `modalGone=${gone} msg="${msg}" status=${st0}`)
  await shot('01_created.png')

  // ---- 3. 确认订单（confirm-check → confirm-order，锁库存生成拣货单）----
  await rowBtn('确认订单', td.tag); await sleep(800)
  await ui.clickDialog('确认', true)
  await sleep(cfg.postWait)
  const st2 = await waitStatus(td.tag, '待拣货')
  const pickList = await api.call('GET', `/dispatchlist/pick-list?id=0&dispatch_no=`, undefined, '').catch(() => null)
  const dRow = await api.req('POST', '/dispatchlist/list', { pageIndex: 1, pageSize: 20, sqlTitle: '', searchValue: td.tag })
  const row2 = (dRow.data?.rows || []).find((r) => String(r.sku_id) === String(skuId) && r.dispatch_status === 2)
  rec('confirm-order', st2 === '待拣货' && !!row2 && row2.lock_qty === 1,
    `ui=${st2} api_status=${row2?.dispatch_status} lock_qty=${row2?.lock_qty}`)
  await shot('02_confirmed.png')

  // ---- 4. 拣货（PUT confirm-pick-dispatchlistno）----
  await rowBtn('拣货', td.tag)
  await sleep(cfg.postWait)
  const st3 = await waitStatus(td.tag, '待打包')
  const row3 = (dRow.data?.rows || []).length >= 0 ? await refreshRow(api, skuId) : null
  rec('pick', st3 === '待打包' && row3?.dispatch_status === 3 && row3?.picked_qty === 1,
    `ui=${st3} api_status=${row3?.dispatch_status} picked_qty=${row3?.picked_qty}`)

  // ---- 5. 打包 ----
  await rowBtn('打包', td.tag); await sleep(800)
  await ui.clickDialog('确认', true)
  await sleep(cfg.postWait)
  const st4 = await waitStatus(td.tag, '待称重')
  const row4 = await refreshRow(api, skuId)
  rec('package', st4 === '待称重' && row4?.dispatch_status === 4 && row4?.package_qty === 1,
    `ui=${st4} api_status=${row4?.dispatch_status} package_qty=${row4?.package_qty}`)
  await shot('03_packaged.png')

  // ---- 6. 称重（window.prompt 已覆写）----
  await rowBtn('称重', td.tag)
  await sleep(cfg.postWait)
  const st5 = await waitStatus(td.tag, '待发运')
  const row5 = await refreshRow(api, skuId)
  rec('weight', st5 === '待发运' && row5?.dispatch_status === 5 && row5?.weighing_qty === 1,
    `ui=${st5} api_status=${row5?.dispatch_status} weighing_qty=${row5?.weighing_qty}`)

  // ---- 7. 发运（Delivery：状态 3/4/5→6 且扣库存）----
  await rowBtn('发运', td.tag); await sleep(800)
  await ui.clickDialog('确认', true)
  await sleep(cfg.postWait + 500)
  const st6 = await waitStatus(td.tag, '待签收')
  const row6 = await refreshRow(api, skuId)
  const after = await api.stockBySerial(sn)
  rec('delivery', st6 === '待签收' && row6?.dispatch_status === 6 && row6?.actual_qty === 1 && (!after || after.qty === 0),
    `ui=${st6} api_status=${row6?.dispatch_status} actual_qty=${row6?.actual_qty} stock(${sn}) ${before?.qty}->${after ? after.qty : 'gone'}`)
  await shot('04_delivered.png')

  // ---- 8. 签收 ----
  await rowBtn('签收', td.tag)
  await sleep(cfg.postWait)
  const st7 = await waitStatus(td.tag, '已签收')
  const row7 = await refreshRow(api, skuId)
  rec('sign', st7 === '已签收' && row7?.dispatch_status === 7 && row7?.sign_qty === 1,
    `ui=${st7} api_status=${row7?.dispatch_status} sign_qty=${row7?.sign_qty}`)
  await shot('05_signed.png')

  const pass = results.filter((x) => x.ok).length
  console.log(`===== S6 SUMMARY: ${pass}/${results.length} PASS =====`)
  return results
}

/** 从 list 接口刷新该 sku 的最新一行（dispatchlist list 按页返回，目标行应在第一页） */
async function refreshRow(api, skuId) {
  const d = await api.req('POST', '/dispatchlist/list', { pageIndex: 1, pageSize: 50, sqlTitle: '', searchValue: '' })
  return (d.data?.rows || []).filter((r) => String(r.sku_id) === String(skuId)).sort((a, b2) => b2.id - a.id)[0] || null
}
