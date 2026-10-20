/**
 * 库存下拉选项文案（库内作业四个页面共用）
 *
 * 背景：/stock/select 返回的是「库存行」，同一商品在同一库位可能有几十上百行
 * （序列号管理时每个序列号一行、不同效期/价格/入库日期也各一行）。
 * 原先的文案是 `仓库 / 库位 / 商品 / 规格（序列号）`，序列号排在最后，
 * 被下拉宽度一截就完全看不见，用户会看到一屏"一模一样"的选项。
 *
 * 现在的原则：**把区分度最高的字段放最前**，保证截断先牺牲仓库和商品名，不会牺牲序列号。
 */

export interface StockOptionSource {
  id: number
  warehouse_name?: string
  location_name?: string
  spu_name?: string
  sku_name?: string
  series_number?: string
  qty_available?: number
}

/** 例：`sn20261020-0501 ｜ 深沟球轴承 6205-2RS ｜ 智造一号仓/B-01-02 ｜ 可用 1`
 *  无序列号（整批）→ `整批 ｜ 深沟球轴承 6205-2RS ｜ 智造一号仓/B-01-02 ｜ 可用 640`
 */
export function stockOptionLabel(s: StockOptionSource): string {
  const head = s.series_number ? String(s.series_number) : '整批'
  const name = s.spu_name || s.sku_name || ''
  const loc = [s.warehouse_name, s.location_name].filter(Boolean).join('/')
  const avail = `可用 ${s.qty_available ?? 0}`
  return [head, name, loc, avail].filter(Boolean).join(' ｜ ')
}

/**
 * 库存池排序：整批行（无序列号）排最前，其余按序列号升序。
 * 序列号管理时同一商品可能有上百行，用户大多数时候要点的是那条「整批」，
 * 不排序的话它会被埋在几十行单件里翻不到。
 */
export function sortStockRows<T extends StockOptionSource>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const sa = a.series_number || ''
    const sb = b.series_number || ''
    if (!sa && sb) return -1
    if (sa && !sb) return 1
    if (sa !== sb) return sa < sb ? -1 : 1
    return (a.id || 0) - (b.id || 0)
  })
}
