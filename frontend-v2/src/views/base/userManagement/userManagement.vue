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
import { h, onMounted, ref } from 'vue'
import { NButton, NSpace, NTag, createDiscreteApi } from 'naive-ui'
import CrudPage from '@/components/CrudPage.vue'
import { userApi, userroleApi } from '@/api'

const { message, dialog } = createDiscreteApi(['message', 'dialog'])
const crudRef = ref<InstanceType<typeof CrudPage> | null>(null)

function toRoleTag(role: string) {
  return h(NTag, { size: 'small', type: role === 'admin' ? 'success' : 'info' }, { default: () => role })
}

const columns = [
  { title: '工号', key: 'user_num' },
  { title: '用户名', key: 'user_name' },
  { title: '角色', key: 'user_role', render: (r: any) => toRoleTag(r.user_role) },
  { title: '性别', key: 'sex' },
  { title: '联系电话', key: 'contact_tel' },
  { title: '创建人', key: 'creator' }
]

const fields = [
  { key: 'user_num', label: '工号', required: true },
  { key: 'user_name', label: '用户名', required: true },
  { key: 'user_role', label: '角色', type: 'select' as const, required: true, options: [
    { label: 'admin', value: 'admin' },
    { label: 'user', value: 'user' }
  ] as Array<{ label: string; value: string }> },
  { key: 'sex', label: '性别', type: 'select' as const, options: [{ label: '男', value: 'male' }, { label: '女', value: 'female' }] },
  { key: 'contact_tel', label: '联系电话' }
]

// 角色下拉从后端动态加载：角色管理里新建的角色（如 test）必须能选到
onMounted(async () => {
  try {
    const roles = await userroleApi.all()
    const opts = roles
      .filter((r: any) => r.is_valid !== false)
      .map((r: any) => ({ label: String(r.role_name), value: String(r.role_name) }))
    if (opts.length) {
      const roleField: any = fields.find((f) => f.key === 'user_role')
      if (roleField) roleField.options = opts
    }
  } catch { /* 拉取失败时保留默认选项，不阻塞页面 */ }
})

const api = {
  list: userApi.list,
  // 后端创建用户时随机生成初始密码并通过返回消息带回（前端通用封装会丢弃该消息），
  // 这里创建后立即调用重置密码接口取回新密码，并明确弹窗展示（仅显示这一次）
  create: async (d: any) => {
    const id = await userApi.create(d)
    let pwd = ''
    try { pwd = await userApi.resetPwd([Number(id)]) } catch { /* 取不到密码时提示走重置入口 */ }
    dialog.success({
      title: '用户创建成功',
      content: pwd
        ? `账号「${d?.user_name || ''}」已创建。\n初始密码：${pwd}\n仅显示这一次，请立即记录（之后只能重置，无法找回）。`
        : '账号已创建，但未能获取初始密码，请用「重置选中用户密码」获取新密码。',
      positiveText: '我已记录'
    })
    return id
  },
  update: userApi.update,
  remove: userApi.remove
}

function rowToForm(row: any) {
  return { ...row }
}

function resetSelectedPwd() {
  const id = Number(window.prompt('输入要重置密码的用户 id') || 0)
  if (!id) return
  dialog.warning({
    title: '重置密码',
    content: `确认将用户 id=${id} 的密码重置为随机密码？重置后旧密码立即失效。`,
    positiveText: '确认重置',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const pwd = await userApi.resetPwd([id])
        dialog.success({
          title: '密码已重置',
          content: `新密码：${pwd}\n仅显示这一次，请立即记录。`,
          positiveText: '我已记录'
        })
      } catch (e) {
        message.error(e instanceof Error ? e.message : '重置失败')
      }
    }
  })
}
</script>
