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

// 字段以后端 CompanyViewModel 契约为准：company_name/city/address/manager/contact_tel
// （原 company_telephone/company_email/corporate_name/remarks 后端不存在，已移除）
const columns = [
  { title: '公司名称', key: 'company_name' },
  { title: '城市', key: 'city' },
  { title: '地址', key: 'address', ellipsis: { tooltip: true } },
  { title: '负责人', key: 'manager' },
  { title: '联系电话', key: 'contact_tel' }
]

const fields = [
  { key: 'company_name', label: '公司名称', required: true },
  { key: 'city', label: '城市' },
  { key: 'address', label: '地址', span: 2 },
  { key: 'manager', label: '负责人' },
  { key: 'contact_tel', label: '联系电话' }
]
</script>
