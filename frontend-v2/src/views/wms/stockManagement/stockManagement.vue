<template>
  <n-card :bordered="false" class="page-card">
    <n-tabs type="line" animated>
      <n-tab-pane name="stock" tab="库存">
        <QueryTable :fetch="fetchStock" :columns="stockCols" search-placeholder="商品/规格名称" />
      </n-tab-pane>
      <n-tab-pane name="location" tab="库位库存">
        <QueryTable :fetch="fetchLocation" :columns="locCols" search-placeholder="库位名称" />
      </n-tab-pane>
      <n-tab-pane name="detail" tab="库存明细">
        <QueryTable :fetch="fetchDetail" :columns="detailCols" search-placeholder="商品/规格/序列号/库位" />
      </n-tab-pane>
      <n-tab-pane name="age" tab="库龄">
        <QueryTable :fetch="fetchAge" :columns="ageCols" search-placeholder="商品名称" />
      </n-tab-pane>
    </n-tabs>
  </n-card>
</template>

<script setup lang="ts">
import { NCard, NTabs, NTabPane, NTag } from 'naive-ui'
import { h } from 'vue'
import QueryTable from '@/components/QueryTable.vue'
import { stockApi } from '@/api'

const qtyTag = (key: string) => (r: any) => h(NTag, { size: 'small', type: (r[key] ?? 0) > 0 ? 'success' : 'default' }, { default: () => String(r[key] ?? 0) })

// 冻结状态：冻结和解冻不改 qty，只在 stock.is_freeze 上打标，
// 所以不进「库存调整」流水，而是在每一行货品上直接显示状态（冻结历史看「库内冻结」单据）
const freezeTag = (frozen: number, total: number) => {
  if (!frozen || frozen <= 0) return h(NTag, { size: 'small', type: 'default' }, { default: () => '未冻结' })
  if (frozen >= total) return h(NTag, { size: 'small', type: 'error' }, { default: () => '已冻结' })
  return h(NTag, { size: 'small', type: 'warning' }, { default: () => '部分冻结' })
}

// /stock/stock-list 实际返回：spu_code/spu_name/sku_code/sku_id/qty/qty_available/
// qty_locked/qty_frozen/qty_asn/qty_to_unload/qty_to_sort/qty_sorted/shortage_qty/expiry_date
//（无 sku_name/goods_owner_name，已删）
const stockCols = [
  { title: '商品编码', key: 'spu_code' },
  { title: '商品名称', key: 'spu_name', ellipsis: { tooltip: true } },
  { title: '规格编码', key: 'sku_code' },
  { title: '库存量', key: 'qty', render: qtyTag('qty') },
  { title: '可用', key: 'qty_available' },
  { title: '锁定', key: 'qty_locked' },
  { title: '冻结数量', key: 'qty_frozen' },
  { title: '冻结状态', key: '__freeze', render: (r: any) => freezeTag(Number(r.qty_frozen ?? 0), Number(r.qty ?? 0)) },
  { title: '在途', key: 'qty_asn' },
  { title: '保质期(天)', key: 'expiry_date' }
]

const locCols = [
  { title: '仓库', key: 'warehouse_name' },
  { title: '库位', key: 'location_name' },
  { title: '商品名称', key: 'spu_name', ellipsis: { tooltip: true } },
  { title: '规格名称', key: 'sku_name', ellipsis: { tooltip: true } },
  { title: '库存量', key: 'qty', render: qtyTag('qty') },
  { title: '可用', key: 'qty_available' },
  { title: '冻结数量', key: 'qty_frozen' },
  { title: '冻结状态', key: '__freeze', render: (r: any) => freezeTag(Number(r.qty_frozen ?? 0), Number(r.qty ?? 0)) }
]

// 库存明细：来自 /stock/select（StockViewModel），每个批次/序列号一行，
// 冻结是行级标记（stock.is_freeze），这里才看得到「具体是哪一件被冻」
const detailCols = [
  { title: '仓库', key: 'warehouse_name' },
  { title: '库位', key: 'location_name' },
  { title: '商品名称', key: 'spu_name', ellipsis: { tooltip: true } },
  { title: '规格名称', key: 'sku_name', ellipsis: { tooltip: true } },
  { title: '序列号', key: 'series_number', width: 150 },
  { title: '数量', key: 'qty', render: qtyTag('qty') },
  { title: '可用', key: 'qty_available' },
  {
    title: '冻结状态',
    key: 'is_freeze',
    render: (r: any) => freezeTag(r.is_freeze ? Number(r.qty ?? 0) : 0, Number(r.qty ?? 0))
  },
  { title: '效期', key: 'expiry_date', width: 120 },
  { title: '货主', key: 'goods_owner_name' }
]

// StockAgeViewModel 字段：warehouse_name/location_name/spu_code/spu_name/sku_id/sku_code/
// sku_name/qty/goods_owner_name/series_number/goods_location_id/expiry_date/price/putaway_date/stock_age
//（入库时间是 putaway_date、库龄是 stock_age，原 in_date/age 不存在）
const ageCols = [
  { title: '商品名称', key: 'spu_name', ellipsis: { tooltip: true } },
  { title: '规格名称', key: 'sku_name', ellipsis: { tooltip: true } },
  { title: '库存量', key: 'qty', render: qtyTag('qty') },
  { title: '入库时间', key: 'putaway_date' },
  { title: '库龄(天)', key: 'stock_age' }
]

const fetchStock = (b: any) => stockApi.stockList(b)
const fetchLocation = (b: any) => stockApi.locationList(b)
const fetchAge = (b: any) => stockApi.stockAgeList(b)
// 不带 sqlTitle 的话后端默认只返回「可用 > 0」的行，已冻结和清零的批次会消失
const fetchDetail = (b: any) => stockApi.selectList({ ...b, sqlTitle: 'all' })
</script>
