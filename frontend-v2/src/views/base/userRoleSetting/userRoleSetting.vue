<template>
  <CrudPage :api="api" :columns="columns" :fields="fields" search-placeholder="角色名" />
</template>

<script setup lang="ts">
import CrudPage from '@/components/CrudPage.vue'
import { userroleApi } from '@/api'

const api = {
  list: userroleApi.list,
  create: userroleApi.create,
  update: userroleApi.update,
  remove: userroleApi.remove
}

const columns = [
  { title: '角色名', key: 'role_name' },
  { title: '角色描述', key: 'role_describe', ellipsis: { tooltip: true } },
  { title: '创建人', key: 'creator' },
  { title: '创建时间', key: 'create_time' }
]

const fields = [
  { key: 'role_name', label: '角色名', required: true },
  { key: 'role_describe', label: '角色描述', span: 2 }
]
</script>
