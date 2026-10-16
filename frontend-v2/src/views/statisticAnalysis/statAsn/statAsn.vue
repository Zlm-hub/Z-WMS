<template>
  <n-card :bordered="false" class="page-card" title="入库统计">
    <n-space vertical size="large">
      <n-grid :cols="3" :x-gap="12">
        <n-grid-item><n-statistic label="入库单总数" :value="totalOrders" /></n-grid-item>
        <n-grid-item><n-statistic label="入库总件数" :value="totalQty" /></n-grid-item>
        <n-grid-item><n-statistic label="涉及 SKU 数" :value="skuKinds" /></n-grid-item>
      </n-grid>
      <VChart :option="trendOption" />
      <n-data-table :columns="cols" :data="rows" size="small" :max-height="360" :scroll-x="900" />
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { NCard, NGrid, NGridItem, NStatistic, NDataTable, createDiscreteApi } from 'naive-ui'
import VChart from '@/components/VChart.vue'
import { asnApi, pageSearch } from '@/api'

const { message } = createDiscreteApi(['message'])
const rows = ref<any[]>([])

const totalOrders = computed(() => rows.value.length)
const totalQty = computed(() => rows.value.reduce((s, r) => s + (r.asn_qty || 0), 0))
const skuKinds = computed(() => new Set(rows.value.map((r) => r.sku_code)).size)

const trendOption = computed(() => {
  // 按天聚合
  const byDay = new Map<string, number>()
  for (const r of rows.value) {
    const day = String(r.create_time || '').slice(0, 10)
    byDay.set(day, (byDay.get(day) || 0) + (r.asn_qty || 0))
  }
  const days = Array.from(byDay.keys()).sort()
  return {
    title: { text: '每日入库件数趋势', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 30, bottom: 40, top: 50 },
    xAxis: { type: 'category', data: days },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{ type: 'line', smooth: true, data: days.map((d) => byDay.get(d)), areaStyle: { opacity: 0.15 }, itemStyle: { color: '#2563eb' } }]
  }
})

const cols = [
  { title: 'ASN号', key: 'asn_no' },
  { title: '商品', key: 'spu_name', ellipsis: { tooltip: true } },
  { title: '规格', key: 'sku_name', ellipsis: { tooltip: true } },
  { title: '应收', key: 'asn_qty' },
  { title: '实收', key: 'actual_qty' },
  { title: '货主', key: 'goods_owner_name' },
  { title: '创建时间', key: 'create_time', width: 160 }
]

onMounted(async () => {
  try {
    const d = await asnApi.list(pageSearch({ pageIndex: 1, pageSize: 1000 }))
    rows.value = (d.rows as any[]) || []
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载失败')
  }
})
</script>
