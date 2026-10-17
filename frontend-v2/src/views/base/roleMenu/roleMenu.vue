<template>
  <n-card :bordered="false" class="page-card" title="角色菜单授权">
    <n-space vertical size="large">
      <n-space align="center">
        <n-select
          v-model:value="selectedRole"
          :options="roleOptions"
          placeholder="选择角色"
          style="width: 240px"
          @update:value="loadRoleMenu"
        />
        <n-button type="primary" :disabled="!selectedRole" :loading="saving" @click="save">保存授权</n-button>
      </n-space>
      <n-tree
        v-if="menuTree.length"
        checkable
        cascade
        block-line
        :data="menuTree"
        key-field="key"
        label-field="label"
        children-field="children"
        v-model:checked-keys="checkedKeys"
        default-expand-all
        style="max-width: 560px"
      />
      <n-empty v-else description="无菜单数据" />
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { NCard, NSelect, NButton, NTree, NEmpty, NSpace, createDiscreteApi } from 'naive-ui'
import { menuApi, userroleApi } from '@/api'
import { MODULE_LABELS } from '@/router/dynamic'
import { menuLabel } from '@/constants/menuNames'

const { message } = createDiscreteApi(['message'])
const roleOptions = ref<Array<{ label: string; value: number }>>([])
const selectedRole = ref<number | null>(null)
const menuTree = ref<Array<{ key: number | string; label: string; children?: any[] }>>([])
const checkedKeys = ref<Array<number | string>>([])
const menuNameMap = ref<Record<number, string>>({})
const saving = ref(false)

onMounted(async () => {
  try {
    const roles = await userroleApi.all()
    roleOptions.value = roles.map((r: any) => ({ label: r.role_name, value: r.id }))
    const menus = await menuApi.menus()
    // 按 module 分组成树
    const groups = new Map<string, any[]>()
    for (const m of menus as any[]) {
      menuNameMap.value[m.id] = menuLabel(m.menu_name)
      const mod = MODULE_LABELS[m.module as string] || m.module || '其他'
      if (!groups.has(mod)) groups.set(mod, [])
      groups.get(mod)!.push({ key: m.id, label: menuLabel(m.menu_name) })
    }
    let gid = 100000
    menuTree.value = Array.from(groups.entries()).map(([mod, children]) => ({
      key: 'g' + gid++,
      label: mod,
      children
    }))
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载失败')
  }
})

async function loadRoleMenu(roleId: number) {
  try {
    const data = await menuApi.get(roleId)
    const details = ((data as any)?.detailList || []) as Array<{ menu_id: number }>
    checkedKeys.value = details.map((d) => d.menu_id).filter((i) => typeof i === 'number')
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载角色菜单失败')
  }
}

async function save() {
  if (!selectedRole.value) return
  saving.value = true
  try {
    const menuIds = checkedKeys.value.filter((k) => typeof k === 'number') as number[]
    // 后端契约：RolemenuBothViewModel { userrole_id, role_name, detailList: [{menu_id, menu_name, authority}] }
    const roleName = roleOptions.value.find((r) => r.value === selectedRole.value)?.label || ''
    await menuApi.save({
      userrole_id: selectedRole.value,
      role_name: roleName,
      detailList: menuIds.map((id) => ({
        id: 0,
        menu_id: id,
        menu_name: (menuNameMap.value[id] as string) || '',
        authority: 1
      }))
    })
    message.success('授权已保存')
  } catch (e) {
    message.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}
</script>
