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

const diffTag = (r: any) => {
  const v = r.change_qty ?? r.adjust_qty ?? 0
  return h(NTag, { size: 'small', type: v >= 0 ? 'success' : 'error' }, { default: () => (v >= 0 ? `+${v}` : String(v)) })
}

const columns = [
  { title: '商品名称', key: 'spu_name', ellipsis: { tooltip: true } },
  { title: '规格名称', key: 'sku_name', ellipsis: { tooltip: true } },
  { title: '变动数量', key: 'change_qty', render: diffTag },
  { title: '调整后库存', key: 'current_qty' },
  { title: '来源作业', key: 'job_code' },
  { title: '来源单据', key: 'source_table_id' },
  { title: '经手人', key: 'creator' },
  { title: '时间', key: 'create_time', width: 160 }
]
</script>
