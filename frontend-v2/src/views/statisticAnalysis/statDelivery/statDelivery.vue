<template>
  <n-card :bordered="false" class="page-card" title="发货统计">
    <n-space vertical size="large">
      <VChart :option="statusOption" />
      <n-data-table :columns="cols" :data="rows" size="small" :max-height="360" :scroll-x="900" />
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { NCard, NDataTable, createDiscreteApi } from 'naive-ui'
import VChart from '@/components/VChart.vue'
import { dispatchApi, pageSearch } from '@/api'

const { message } = createDiscreteApi(['message'])
const rows = ref<any[]>([])

const STATUS = ['新订单', '待拣货', '待打包', '待称重', '待发运', '待签收', '已签收']

const statusOption = computed(() => {
  const byStatus = new Array(7).fill(0)
  for (const r of rows.value) {
    const s = Number(r.dispatch_status) || 0
    if (s >= 0 && s <= 6) byStatus[s]++
  }
  return {
    title: { text: '发货单状态分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 30, bottom: 40, top: 50 },
    xAxis: { type: 'category', data: STATUS },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{ type: 'bar', data: byStatus, itemStyle: { color: '#2563eb', borderRadius: [4, 4, 0, 0] } }]
  }
})

const cols = [
  { title: '发货单号', key: 'dispatch_no' },
  { title: '状态', key: 'dispatch_status', render: (r: any) => STATUS[Number(r.dispatch_status) || 0] },
  { title: '客户', key: 'customer_name' },
  { title: '商品', key: 'spu_name', ellipsis: { tooltip: true } },
  { title: '规格', key: 'sku_name', ellipsis: { tooltip: true } },
  { title: '数量', key: 'qty' },
  { title: '创建人', key: 'creator' }
]

onMounted(async () => {
  try {
    const d = await dispatchApi.list(pageSearch({ pageIndex: 1, pageSize: 1000 }))
    rows.value = (d.rows as any[]) || []
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载失败')
  }
})
</script>
