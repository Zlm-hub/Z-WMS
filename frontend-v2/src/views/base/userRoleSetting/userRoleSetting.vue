<template>
  <CrudPage :api="api" :columns="columns" :fields="fields" search-placeholder="角色名" />
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NTag } from 'naive-ui'
import CrudPage from '@/components/CrudPage.vue'
import { userroleApi } from '@/api'

// 字段以后端 UserroleEntity/ViewModel 契约为准：role_name / is_valid / create_time
// （原 role_describe、creator 后端不存在，已移除；is_valid 补上，与上游 v1 一致）
const api = {
  list: userroleApi.list,
  create: userroleApi.create,
  update: userroleApi.update,
  remove: userroleApi.remove
}

const columns = [
  { title: '角色名', key: 'role_name' },
  {
    title: '状态',
    key: 'is_valid',
    render: (r: any) =>
      h(NTag, { size: 'small', type: r.is_valid ? 'success' : 'error' }, { default: () => (r.is_valid ? '启用' : '禁用') })
  },
  { title: '创建时间', key: 'create_time' }
]

const fields = [
  { key: 'role_name', label: '角色名', required: true },
  { key: 'is_valid', label: '是否启用', type: 'switch' as const }
]
</script>
