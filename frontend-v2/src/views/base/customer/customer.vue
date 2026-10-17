<template>
  <CrudPage :api="api" :columns="columns" :fields="fields" search-placeholder="客户名称" />
</template>

<script setup lang="ts">
import CrudPage from '@/components/CrudPage.vue'
import { customerApi } from '@/api'

const api = {
  list: customerApi.list,
  create: customerApi.create,
  update: customerApi.update,
  remove: customerApi.remove
}

// 字段以后端 CustomerViewModel 契约为准：customer_name/manager/contact_tel/email/city/address
//（原 customer_num 后端不存在；联系人字段名为 manager 而非 contact_people）
const columns = [
  { title: '客户名称', key: 'customer_name' },
  { title: '联系人', key: 'manager' },
  { title: '联系电话', key: 'contact_tel' },
  { title: '邮箱', key: 'email', ellipsis: { tooltip: true } },
  { title: '城市', key: 'city' },
  { title: '地址', key: 'address', ellipsis: { tooltip: true } }
]

const fields = [
  { key: 'customer_name', label: '客户名称', required: true },
  { key: 'manager', label: '联系人' },
  { key: 'contact_tel', label: '联系电话' },
  { key: 'email', label: '邮箱' },
  { key: 'city', label: '城市' },
  { key: 'address', label: '地址', span: 2 }
]
</script>
