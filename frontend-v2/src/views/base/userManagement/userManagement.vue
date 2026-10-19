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
  { key: 'contact_tel', label: '联系电话' },
  {
    key: 'password',
    label: '初始密码',
    type: 'password' as const,
    placeholder: '至少 6 位；编辑时留空表示不修改'
  }
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
  // 新增时由管理员自定义初始密码（后端 password 字段，PBKDF2 哈希存储）；留空则后端生成随机密码
  create: async (d: any) => {
    const pwd = String(d?.password || '').trim()
    if (!pwd) {
      message.error('请设置初始密码（至少 6 位）')
      throw new Error('password required')
    }
    if (pwd.length < 6) {
      message.error('初始密码至少 6 位')
      throw new Error('password too short')
    }
    const id = await userApi.create({ ...d, password: pwd })
    dialog.success({
      title: '用户创建成功',
      content: `账号「${d?.user_name || ''}」已创建，初始密码为你设置的密码。\n请提醒使用者首次登录后修改密码。`,
      positiveText: '知道了'
    })
    return id
  },
  update: async (d: any) => {
    // 编辑时密码留空 = 不修改；填写则同步改密
    const pwd = String(d?.password || '').trim()
    if (pwd && pwd.length < 6) {
      message.error('新密码至少 6 位')
      throw new Error('password too short')
    }
    const payload = { ...d }
    if (!pwd) delete payload.password
    return userApi.update(payload)
  },
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
