<template>
  <CrudPage :api="api" :columns="columns" :fields="fields" search-placeholder="运费名称/目的地" />
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

const columns = [
  { title: '运费名称', key: 'freight_name' },
  { title: '目的地', key: 'destination' },
  { title: '首重运费', key: 'first_heavy_freight' },
  { title: '首重重量', key: 'first_heavy_weight' },
  { title: '续重运费', key: 'continued_heavy_freight' },
  { title: '续重重量', key: 'continued_heavy_weight' },
  { title: '创建人', key: 'creator' }
]

const fields = [
  { key: 'freight_name', label: '运费名称', required: true },
  { key: 'destination', label: '目的地', required: true },
  { key: 'first_heavy_freight', label: '首重运费', type: 'number' as const, defaultValue: 0 },
  { key: 'first_heavy_weight', label: '首重重量', type: 'number' as const, defaultValue: 0 },
  { key: 'continued_heavy_freight', label: '续重运费', type: 'number' as const, defaultValue: 0 },
  { key: 'continued_heavy_weight', label: '续重重量', type: 'number' as const, defaultValue: 0 }
]
</script>
