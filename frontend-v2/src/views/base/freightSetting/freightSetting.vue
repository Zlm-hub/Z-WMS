<template>
  <CrudPage :api="api" :columns="columns" :fields="fields" search-placeholder="承运商/城市" />
</template>

<script setup lang="ts">
import CrudPage from '@/components/CrudPage.vue'
import { freightApi } from '@/api'

const api = {
  list: freightApi.list,
  create: freightApi.create,
  update: freightApi.update,
  remove: freightApi.remove
}

// 字段以后端 FreightfeeViewModel 契约为准：carrier/departure_city/arrival_city/
// price_per_weight/price_per_volume/min_payment
// （原 freight_name/destination/first_heavy_*/continued_heavy_* 后端不存在，已移除）
const columns = [
  { title: '承运商', key: 'carrier' },
  { title: '出发城市', key: 'departure_city' },
  { title: '到达城市', key: 'arrival_city' },
  { title: '每公斤运费', key: 'price_per_weight' },
  { title: '每立方米运费', key: 'price_per_volume' },
  { title: '最低消费', key: 'min_payment' },
  { title: '创建人', key: 'creator' }
]

const fields = [
  { key: 'carrier', label: '承运商', required: true },
  { key: 'departure_city', label: '出发城市' },
  { key: 'arrival_city', label: '到达城市' },
  { key: 'price_per_weight', label: '每公斤运费', type: 'number' as const, defaultValue: 0 },
  { key: 'price_per_volume', label: '每立方米运费', type: 'number' as const, defaultValue: 0 },
  { key: 'min_payment', label: '最低消费', type: 'number' as const, defaultValue: 0 }
]
</script>
