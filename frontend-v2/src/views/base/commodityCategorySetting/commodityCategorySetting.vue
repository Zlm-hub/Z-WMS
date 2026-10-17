<template>
  <CrudPage :api="api" :columns="columns" :fields="fields" search-placeholder="类别名称" />
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NTag } from 'naive-ui'
import CrudPage from '@/components/CrudPage.vue'
import { categoryApi } from '@/api'

// 字段以后端 CategoryViewModel 契约为准：category_name/parent_id/is_valid/create_time
//（原 category_num/category_parent/describe 后端不存在，已移除；is_valid 补上，与 userRoleSetting 一致）

const api = {
  list: async (b: any) => {
    const all = await categoryApi.all()
    const kw = (b.searchValue || '').toLowerCase()
    const rows = kw ? all.filter((r: any) => (r.category_name || '').toLowerCase().includes(kw)) : all
    return { rows, total: rows.length }
  },
  create: categoryApi.create,
  update: categoryApi.update,
  remove: categoryApi.remove
}

const columns = [
  { title: '类别名称', key: 'category_name' },
  {
    title: '状态',
    key: 'is_valid',
    render: (r: any) =>
      h(NTag, { size: 'small', type: r.is_valid ? 'success' : 'error' }, { default: () => (r.is_valid ? '启用' : '禁用') })
  },
  { title: '创建时间', key: 'create_time' }
]

const fields = [
  { key: 'category_name', label: '类别名称', required: true },
  { key: 'is_valid', label: '是否启用', type: 'switch' as const }
]
</script>
