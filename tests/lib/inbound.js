/**
 * 入库建数助手：走完整入库流程（SPU→ASN master→ASN detail→confirm→unload→
 * sorting(自动序列号)→sorted→putaway×N），产出指定条数的 qty=1 测试库存
 * 供 s4（仓内作业）与 s6（出库）复用；序列号由后端自动编号，精确回传无歧义
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const MIN = '0001-01-01T00:00:00'

/**
 * @param {object} ctx  run-all 上下文 { api, report, cfg, ... }
 * @param {number} count 产出的库存条数（每条 qty=1）
 * @param {string} suiteName 报告归属套件名
 * @param {string} [tagOverride] 覆盖数据前缀（同一次 run 多个套件各建 SPU 时必须互异，spu_code 有唯一约束）
 * @returns {{ tag, spuId, skuId, asnId, serials, stocks }}
 */
async function buildInboundStock(ctx, count, suiteName, tagOverride) {
  const { api, report, cfg } = ctx
  const S = suiteName
  const tag = tagOverride || cfg.tag

  // 1. SPU + SKU（效期 30 天）
  const spuId = await api.call('POST', '/spu', {
    spu_code: `${tag}-SPU`,
    spu_name: `测试品-${tag}`,
    category_id: 1, category_name: '默认分类',
    supplier_id: 0, supplier_name: '',
    pack_specification: 1, distribution_type: 1, uniformly_marked: 1,
    detailList: [{
      sku_code: `${tag}-SKU`,
      sku_name: `测试规格-${tag}`,
      barcode: '', bar_code: '',
      length: 10, width: 10, height: 10, weight: 100,
      length_unit: 0, volume_unit: 0, weight_unit: 0,
      cost_price: 1.5, sale_price: 3.0,
      expiry_date: 30, tax_rate: 0, is_valid: true
    }]
  }, 'spu/create')
  const full = await api.call('GET', `/spu?id=${spuId}`, undefined, 'spu/get')
  const sku = full.detailList[0]
  const skuId = sku.sku_id ?? sku.id
  report.step(S, 'spu+sku', true, `spu=${spuId} sku=${skuId} code=${full.spu_code}`)

  // 2. ASN master（应收 count 条）
  const masterId = await api.call('POST', '/asn/asnmaster', {
    asn_no: '', asn_batch: '',
    estimated_arrival_time: '2026-10-18T08:00:00', asn_status: 0,
    weight: 0, volume: 0,
    goods_owner_id: 1, goods_owner_name: '烟测货主',
    detailList: [{
      spu_id: spuId, spu_code: full.spu_code, spu_name: full.spu_name,
      sku_id: skuId, sku_code: sku.sku_code, sku_name: sku.sku_name,
      origin: '', length_unit: 0, volume_unit: 0, weight_unit: 0,
      asn_qty: count, actual_qty: 0, weight: 0, volume: 0,
      supplier_id: 0, supplier_name: '',
      expiry_date: '2027-01-01T00:00:00', price: 1.5
    }]
  }, 'asnmaster/create')

  // 3. ASN detail
  const asnId = await api.call('POST', '/asn', {
    asnmaster_id: masterId, asn_no: '', asn_batch: '',
    estimated_arrival_time: '2026-10-18T08:00:00', asn_status: 0,
    spu_id: spuId, spu_code: full.spu_code, spu_name: full.spu_name,
    sku_id: skuId, sku_code: sku.sku_code, sku_name: sku.sku_name,
    origin: '', length_unit: 0, volume_unit: 0, weight_unit: 0,
    asn_qty: count, actual_qty: 0,
    arrival_time: MIN, unload_time: MIN,
    unload_person_id: 0, unload_person: '',
    sorted_qty: 0, shortage_qty: 0, more_qty: 0, damage_qty: 0,
    weight: 0, volume: 0, supplier_id: 0, supplier_name: '',
    goods_owner_id: 1, goods_owner_name: '烟测货主',
    expiry_date: '2027-01-01T00:00:00', price: 1.5
  }, 'asn/create')
  report.step(S, 'asn', true, `master=${masterId} asn=${asnId}`)

  // 4. 流转：确认→卸货→分拣（自动序列号）→分拣完成
  await api.call('PUT', '/asn/confirm', [{ id: asnId, arrival_time: '2026-10-18T09:00:00' }], 'confirm')
  await api.call('PUT', '/asn/unload', [{ id: asnId, unload_time: '2026-10-18T09:30:00', unload_person_id: 1, unload_person: 'admin' }], 'unload')
  await api.call('PUT', '/asn/sorting', [{ asn_id: asnId, sorted_qty: count, is_auto_num: true }], 'sorting')
  await api.call('PUT', '/asn/sorted', [asnId], 'sorted')
  report.step(S, 'flow(confirm/unload/sorting/sorted)', true, 'asn_status 已到 3')

  // 5. 待上架 → 逐序列号上架到库位 1
  const pending = await api.call('GET', `/asn/pending-putaway?id=${asnId}`, undefined, 'pending-putaway')
  report.step(S, 'pending-putaway', Array.isArray(pending) && pending.length === count,
    `serials=${pending.map((p) => p.series_number).join(',')}`)

  for (const p of pending) {
    await api.call('PUT', '/asn/putaway', [{
      asn_id: asnId, goods_owner_id: p.goods_owner_id,
      series_number: p.series_number, goods_location_id: 1,
      putaway_qty: p.sorted_qty
    }], 'putaway/' + p.series_number)
  }

  // 6. 核对库存落账
  await sleep(1000)
  const serials = pending.map((p) => p.series_number)
  const stocks = []
  for (const sn of serials) {
    const s = await api.stockBySerial(sn)
    if (s) stocks.push(s)
  }
  report.step(S, 'stock落账', stocks.length === count && stocks.every((s) => s.qty === 1),
    stocks.map((s) => `${s.series_number.slice(-4)}:qty${s.qty}`).join(' '))

  return { tag, spuId, skuId, asnId, serials, stocks, spu: full, sku }
}

module.exports = { buildInboundStock }
