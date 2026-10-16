<template>
  <CrudPage :api="api" :columns="columns" :fields="fields" search-placeholder="类别名称" />
</template>

<script setup lang="ts">
import CrudPage from '@/components/CrudPage.vue'
import { categoryApi } from '@/api'

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
  { title: '类别编号', key: 'category_num' },
  { title: '父类别', key: 'category_parent' },
  { title: '描述', key: 'describe', ellipsis: { tooltip: true } }
]

const fields = [
  { key: 'category_name', label: '类别名称', required: true },
  { key: 'category_num', label: '类别编号' },
  { key: 'describe', label: '描述', type: 'textarea' as const, span: 2 }
]
</script>
