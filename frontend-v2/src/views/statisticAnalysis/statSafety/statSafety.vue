<template>
  <n-card :bordered="false" class="page-card" title="安全库存预警">
    <n-alert v-if="lowCount > 0" type="warning" style="margin-bottom: 12px">
      {{ lowCount }} 个规格库存低于安全线，请及时补货
    </n-alert>
    <n-alert v-else type="success" style="margin-bottom: 12px">所有规格库存充足</n-alert>
    <n-data-table :columns="cols" :data="rows" :loading="loading" size="small" :max-height="520" :scroll-x="900" />
  </n-card>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import { NCard, NDataTable, NAlert, NTag, createDiscreteApi } from 'naive-ui'
import { stockApi, pageSearch } from '@/api'

const { message } = createDiscreteApi(['message'])
const rows = ref<any[]>([])
const loading = ref(false)

const lowCount = computed(() => rows.value.filter((r) => (r.qty ?? 0) <= (r.min_qty ?? r.safety_stock ?? 0)).length)

const cols = [
  { title: '商品名称', key: 'spu_name', ellipsis: { tooltip: true } },
  { title: '规格名称', key: 'sku_name', ellipsis: { tooltip: true } },
  { title: '当前库存', key: 'qty', render: (r: any) => h(NTag, { size: 'small', type: (r.qty ?? 0) <= (r.min_qty ?? r.safety_stock ?? 0) ? 'error' : 'success' }, { default: () => String(r.qty ?? 0) }) },
  { title: '安全线', key: 'min_qty', render: (r: any) => String(r.min_qty ?? r.safety_stock ?? '-') },
  { title: '可用量', key: 'qty_available' },
  { title: '在途', key: 'qty_asn' }
]

onMounted(async () => {
  loading.value = true
  try {
    const d = await stockApi.safetyList(pageSearch({ pageIndex: 1, pageSize: 1000 }))
    rows.value = (d.rows as any[]) || []
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
})
</script>
