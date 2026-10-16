<template>
  <CrudPage :api="api" :columns="columns" :fields="fields" search-placeholder="公司名称" />
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NTag } from 'naive-ui'
import CrudPage from '@/components/CrudPage.vue'
import { companyApi } from '@/api'

const api = {
  create: companyApi.create,
  update: companyApi.update,
  remove: companyApi.remove,
  // company 只有 all 接口：包装成 list
  list: async (b: any) => {
    const all = await companyApi.all()
    const kw = (b.searchValue || '').toLowerCase()
    const rows = kw ? all.filter((r: any) => (r.company_name || '').toLowerCase().includes(kw)) : all
    return { rows, total: rows.length }
  }
}

const columns = [
  { title: '公司名称', key: 'company_name' },
  { title: '公司电话', key: 'company_telephone' },
  { title: '公司邮箱', key: 'company_email' },
  { title: '法人', key: 'corporate_name' },
  { title: '地址', key: 'company_address', ellipsis: { tooltip: true } },
  { title: '备注', key: 'remarks', ellipsis: { tooltip: true } }
]

const fields = [
  { key: 'company_name', label: '公司名称', required: true },
  { key: 'company_telephone', label: '公司电话' },
  { key: 'company_email', label: '公司邮箱' },
  { key: 'corporate_name', label: '法人' },
  { key: 'company_address', label: '公司地址', span: 2 },
  { key: 'remarks', label: '备注', type: 'textarea' as const, span: 2 }
]
</script>
