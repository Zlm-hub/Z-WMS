<template>
  <n-alert type="info" style="margin-bottom: 12px">库存调整流水（只读）：所有增减都源于入库/出库/盘点/加工等作业，此处按 job_code 溯源。</n-alert>
  <QueryTable :fetch="fetch" :columns="columns" search-placeholder="商品/来源单号" />
</template>

<script setup lang="ts">
import { NAlert, NTag } from 'naive-ui'
import { h } from 'vue'
import QueryTable from '@/components/QueryTable.vue'
import { stockadjustApi } from '@/api'

const fetch = (b: any) => stockadjustApi.list(b)

// StockadjustViewModel 字段：job_type(1盘点/2仓内加工/3拆分加工/4移库)/job_code/spu_code/spu_name/
// sku_code/sku_name/qty(调整差异量，带正负)/warehouse_name/location_name/source_table_id/creator/create_time
//（原 change_qty/current_qty 后端不存在，qty 即差异量；无"调整后库存"）
const ADJUST_JOB_TYPES: Record<number, string> = { 1: '盘点', 2: '仓内加工', 3: '仓内加工', 4: '移库' }

const diffTag = (r: any) => {
  const v = r.qty ?? 0
  return h(NTag, { size: 'small', type: v >= 0 ? 'success' : 'error' }, { default: () => (v >= 0 ? `+${v}` : String(v)) })
}

const columns = [
  { title: '商品名称', key: 'spu_name', ellipsis: { tooltip: true } },
  { title: '规格名称', key: 'sku_name', ellipsis: { tooltip: true } },
  { title: '变动数量', key: 'qty', render: diffTag },
  { title: '来源作业', key: 'job_type', render: (r: any) => ADJUST_JOB_TYPES[r.job_type] || '-' },
  { title: '来源单号', key: 'job_code' },
  { title: '来源单据', key: 'source_table_id' },
  { title: '仓库', key: 'warehouse_name' },
  { title: '库位', key: 'location_name' },
  { title: '经手人', key: 'creator' },
  { title: '时间', key: 'create_time', width: 160 }
]
</script>
