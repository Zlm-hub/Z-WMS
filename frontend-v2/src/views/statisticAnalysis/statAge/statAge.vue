<template>
  <n-card :bordered="false" class="page-card" title="库龄统计">
    <n-space vertical size="large">
      <VChart :option="ageOption" />
      <n-data-table :columns="cols" :data="rows" :loading="loading" size="small" :max-height="360" :scroll-x="900" />
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import { NCard, NDataTable, NTag, createDiscreteApi } from 'naive-ui'
import VChart from '@/components/VChart.vue'
import { stockApi, pageSearch } from '@/api'

const { message } = createDiscreteApi(['message'])
const rows = ref<any[]>([])
const loading = ref(false)

const BUCKETS = ['0-30天', '31-90天', '91-180天', '181-365天', '365天以上']

function bucketOf(days: number): number {
  if (days <= 30) return 0
  if (days <= 90) return 1
  if (days <= 180) return 2
  if (days <= 365) return 3
  return 4
}

const ageOption = computed(() => {
  const sums = new Array(5).fill(0)
  for (const r of rows.value) {
    const days = Number(r.age ?? r.stock_age ?? 0)
    sums[bucketOf(days)] += r.qty ?? 0
  }
  return {
    title: { text: '库存量按库龄分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 30, bottom: 40, top: 50 },
    xAxis: { type: 'category', data: BUCKETS },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{ type: 'bar', data: sums, itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] } }]
  }
})

const ageTag = (r: any) => {
  const days = Number(r.age ?? r.stock_age ?? 0)
  const type = days > 365 ? 'error' : days > 180 ? 'warning' : 'success'
  return h(NTag, { size: 'small', type }, { default: () => `${days}天` })
}

const cols = [
  { title: '商品名称', key: 'spu_name', ellipsis: { tooltip: true } },
  { title: '规格名称', key: 'sku_name', ellipsis: { tooltip: true } },
  { title: '库存量', key: 'qty' },
  { title: '库龄', key: 'age', render: ageTag },
  { title: '入库时间', key: 'in_date', width: 160 }
]

onMounted(async () => {
  loading.value = true
  try {
    const d = await stockApi.stockAgeList(pageSearch({ pageIndex: 1, pageSize: 1000 }))
    rows.value = (d.rows as any[]) || []
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
})
</script>
