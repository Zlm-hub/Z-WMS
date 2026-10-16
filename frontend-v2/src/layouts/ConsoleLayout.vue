<template>
  <n-layout has-sider style="height: 100vh">
    <!-- 侧边导航 -->
    <n-layout-sider
      bordered
      collapse-mode="width"
      :collapsed="collapsed"
      :collapsed-width="64"
      :width="220"
      show-trigger
      @collapse="collapsed = true"
      @expand="collapsed = false"
      :native-scrollbar="false"
      style="background: #fff"
    >
      <div class="logo" :class="{ collapsed }">
        <div class="logo-badge">W</div>
        <span v-if="!collapsed" class="logo-text">ModernWMS</span>
      </div>
      <n-menu
        :collapsed="collapsed"
        :collapsed-width="64"
        :options="menuOptions"
        :value="activeKey"
        @update:value="onMenuSelect"
      />
    </n-layout-sider>

    <n-layout>
      <!-- 顶栏 -->
      <n-layout-header bordered style="height: 56px; background: #fff; display: flex; align-items: center; padding: 0 24px; justify-content: space-between">
        <n-breadcrumb>
          <n-breadcrumb-item v-for="c in breadcrumbs" :key="c">{{ c }}</n-breadcrumb-item>
        </n-breadcrumb>
        <n-space align="center" :size="16">
          <n-text depth="3">v2.0</n-text>
          <n-dropdown :options="userOptions" @select="onUserAction">
            <n-button quaternary>
              <template #icon><n-icon><PersonOutline /></n-icon></template>
              {{ username }}
            </n-button>
          </n-dropdown>
        </n-space>
      </n-layout-header>

      <n-layout-content content-style="padding: 16px; height: calc(100vh - 56px); overflow: auto">
        <router-view />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NLayout, NLayoutSider, NLayoutHeader, NLayoutContent, NMenu, NBreadcrumb, NBreadcrumbItem, NSpace, NButton, NIcon, NDropdown, NText, createDiscreteApi } from 'naive-ui'
import { PersonOutline, LogOutOutline } from '@vicons/ionicons5'
import { useAuthStore } from '@/stores/auth'
import { MODULE_LABELS, menuStore } from '@/router/dynamic'
import { menuLabel } from '@/constants/menuNames'

interface MenuNode {
  id: number
  menu_name: string
  module: string
  path: string
}

const collapsed = ref(false)
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { message } = createDiscreteApi(['message'])

const username = computed(() => (auth.user?.user_name as string) || 'admin')

// 菜单来自动态路由注册时写入的响应式 store，按 module 分组
const allMenus = computed<MenuNode[]>(() =>
  menuStore.list
    .map((m) => ({ id: m.id, menu_name: menuLabel(m.menu_name), module: m.module, path: '/' + m.vue_path }))
    .sort((a, b) => a.id - b.id)
)

const menuOptions = computed(() => {
  const groups = new Map<string, MenuNode[]>()
  for (const m of allMenus.value) {
    const key = m.module || ''
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(m)
  }
  const options: Array<Record<string, unknown>> = []
  // 有分组的模块
  for (const [mod, items] of groups) {
    if (mod) {
      options.push({
        type: 'group',
        label: MODULE_LABELS[mod] || mod,
        key: 'group-' + mod,
        children: items.map((i) => ({ label: i.menu_name, key: i.path }))
      })
    } else {
      for (const i of items) options.push({ label: i.menu_name, key: i.path })
    }
  }
  // 首页固定置顶；总览（全屏页）与统计分析为静态路由分组
  options.unshift({ label: '工作台', key: '/home' })
  options.push({
    type: 'group',
    label: '总览',
    key: 'group-overview',
    children: [
      { label: '数据大屏', key: '/large-screen' },
      { label: '3D 库房', key: '/vwms' }
    ]
  })
  options.push({
    type: 'group',
    label: '统计分析',
    key: 'group-stats',
    children: [
      { label: '入库统计', key: '/stat-asn' },
      { label: '发货统计', key: '/stat-delivery' },
      { label: '安全库存', key: '/stat-safety' },
      { label: '库龄统计', key: '/stat-age' }
    ]
  })
  return options
})

const activeKey = computed(() => route.path)
const breadcrumbs = computed(() => {
  const parts: string[] = []
  const menu = route.meta?.menu as { menu_name: string } | undefined
  if (route.path !== '/home') {
    if (menu?.menu_name) parts.push(menu.menu_name)
  } else {
    parts.push('工作台')
  }
  return parts.length ? parts : ['ModernWMS']
})

function onMenuSelect(key: string) {
  router.push(key)
}

const userOptions = [{ label: '退出登录', key: 'logout', icon: () => h(NIcon, null, { default: () => h(LogOutOutline) }) }]

function onUserAction(key: string) {
  if (key === 'logout') {
    auth.logout()
    message.success('已退出')
    router.push('/login')
  }
}
</script>

<style scoped>
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
  overflow: hidden;
}
.logo-badge {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 8px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #fff;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-text { font-weight: 700; font-size: 16px; color: #1f2329; white-space: nowrap; }
</style>
