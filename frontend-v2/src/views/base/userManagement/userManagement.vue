<template>
  <div>
    <CrudPage :api="api" :columns="columns" :fields="fields" search-placeholder="用户名/工号" :row-to-form="rowToForm">
      <template #toolbar-extra>
        <n-button @click="resetSelectedPwd">重置选中用户密码</n-button>
      </template>
    </CrudPage>
  </div>
</template>

<script setup lang="ts">
import { h, ref } from 'vue'
import { NButton, NSpace, NTag, createDiscreteApi } from 'naive-ui'
import CrudPage from '@/components/CrudPage.vue'
import { userApi } from '@/api'

const { message, dialog } = createDiscreteApi(['message', 'dialog'])
const crudRef = ref<InstanceType<typeof CrudPage> | null>(null)

function toRoleTag(role: string) {
  return h(NTag, { size: 'small', type: role === 'admin' ? 'success' : 'info' }, { default: () => role })
}

const api = {
  list: userApi.list,
  create: userApi.create,
  update: userApi.update,
  remove: userApi.remove
}

const columns = [
  { title: '工号', key: 'user_num' },
  { title: '用户名', key: 'user_name' },
  { title: '角色', key: 'user_role', render: (r: any) => toRoleTag(r.user_role) },
  { title: '性别', key: 'sex' },
  { title: '邮箱', key: 'email', ellipsis: { tooltip: true } },
  { title: '联系电话', key: 'contact_tel' },
  { title: '创建人', key: 'creator' }
]

const fields = [
  { key: 'user_num', label: '工号', required: true },
  { key: 'user_name', label: '用户名', required: true },
  { key: 'user_role', label: '角色', type: 'select' as const, required: true, options: [
    { label: 'admin', value: 'admin' },
    { label: 'user', value: 'user' }
  ] },
  { key: 'sex', label: '性别', type: 'select' as const, options: [{ label: '男', value: 'male' }, { label: '女', value: 'female' }] },
  { key: 'email', label: '邮箱' },
  { key: 'contact_tel', label: '联系电话' }
]

function rowToForm(row: any) {
  return { ...row }
}

async function resetSelectedPwd() {
  dialog.warning({
    title: '重置密码',
    content: '将重置该用户密码为随机密码（返回值显示一次）？输入用户 id：',
    positiveText: '重置 id=1 的演示',
    negativeText: '取消',
    onPositiveClick: async () => {
      // 重置流程需要先选中行；此处提供按 id 重置的入口
      const id = Number(window.prompt('输入要重置密码的用户 id'))
      if (!id) return
      try {
        const pwd = await userApi.resetPwd([id])
        message.success(`新密码：${pwd}（请立即记录）`)
      } catch (e) {
        message.error(e instanceof Error ? e.message : '重置失败')
      }
    }
  })
}
</script>
