<template>
  <CrudPage :api="api" :columns="columns" :fields="fields" search-placeholder="货主名称/编号" />
</template>

<script setup lang="ts">
import CrudPage from '@/components/CrudPage.vue'
import { ownerApi } from '@/api'

const api = {
  list: ownerApi.list,
  create: ownerApi.create,
  update: ownerApi.update,
  remove: ownerApi.remove
}

const columns = [
  { title: '货主名称', key: 'goods_owner_name' },
  { title: '联系人', key: 'manager' },
  { title: '联系电话', key: 'contact_tel' },
  { title: '城市', key: 'city' },
  { title: '地址', key: 'address', ellipsis: { tooltip: true } },
  { title: '创建人', key: 'creator' }
]

const fields = [
  { key: 'goods_owner_name', label: '货主名称', required: true },
  { key: 'manager', label: '负责人' },
  { key: 'contact_tel', label: '联系电话' },
  { key: 'city', label: '城市' },
  { key: 'address', label: '地址', span: 2 }
]
</script>
