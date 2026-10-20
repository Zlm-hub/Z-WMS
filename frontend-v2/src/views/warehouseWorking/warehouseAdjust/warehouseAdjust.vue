<template>
  <n-alert type="info" style="margin-bottom: 12px">
    库存调整流水（只读）：入库上架、出库发运、移库、盘点、仓内加工等所有改动库存数量的作业都在这里留痕，减少为负数，可按来源单号溯源。
  </n-alert>
  <QueryTable ref="tableRef" :fetch="fetch" :columns="columns" search-placeholder="商品/来源单号">
    <template #toolbar-extra>
      <n-select
        v-model:value="jobType"
        :options="jobTypeOptions"
        placeholder="全部作业类型"
        clearable
        style="width: 170px"
        @update:value="reloadFirst"
      />
    </template>
  </QueryTable>
</template>

<script setup lang="ts">
import { NAlert, NSelect, NTag } from 'naive-ui'
import { h, ref } from 'vue'
import QueryTable from '@/components/QueryTable.vue'
import { stockadjustApi } from '@/api'

const tableRef = ref<InstanceType<typeof QueryTable> | null>(null)

// StockadjustViewModel 字段：job_type(1盘点/2仓内加工/3拆分加工/4移库/5入库上架/6出库发运)/job_code/spu_code/spu_name/
// sku_code/sku_name/qty(调整差异量，带正负)/warehouse_name/location_name/source_table_id/creator/create_time
//（原 change_qty/current_qty 后端不存在，qty 即差异量；无"调整后库存"）
const ADJUST_JOB_TYPES: Record<number, string> = {
  1: '盘点',
  2: '仓内加工',
  3: '仓内加工',
  4: '移库',
  5: '入库上架',
  6: '出库发运'
}

// 3（拆分加工）是历史死枚举，从不写入，不在筛选项里给用户选
const jobTypeOptions = [5, 6, 4, 1, 2].map((v) => ({ label: ADJUST_JOB_TYPES[v], value: v }))

const jobType = ref<number | null>(null)

// 后端 PageSearch 只认 searchObjects（没有 searchValue 字段），
// 所以类型筛选走 searchObjects：{ name, text, operator: 1=Equal, value }
const fetch = (b: any) =>
  stockadjustApi.list({
    ...b,
    searchObjects: jobType.value
      ? [{ name: 'job_type', type: 'select', operator: 1, text: String(jobType.value), value: jobType.value }]
      : []
  })

const reloadFirst = () => tableRef.value?.reload(1)

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
