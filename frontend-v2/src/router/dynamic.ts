/**
 * 动态路由：�? /rolemenu/menus 返回的菜单映射到 src/views 下按约定组织的组�?
 * 约定：组件路�? = src/views/<vue_directory>/<vue_path>.vue（与后端字段一一对应�?
 */
import { reactive } from 'vue'
import type { Router } from 'vue-router'
import { request } from '@/api/http'
import { menuLabel } from '@/constants/menuNames'

export interface MenuItem {
  id: number
  menu_name: string
  module: string
  vue_path: string
  vue_directory: string
  sort: number
  menu_actions: string[]
}

/** 已加载的动态菜单（响应式，侧边栏读取） */
export const menuStore = reactive<{ list: MenuItem[]; loaded: boolean }>({ list: [], loaded: false })

// 模块分组（侧边栏分组顺序 + 中文名）
export const MODULE_LABELS: Record<string, string> = {
  '': '总览',
  baseModule: '基础资料',
  wms: '库存与入�?',
  warehouseWorkingModule: '库内作业',
  deliveryManagement: '发货管理',
  statisticAnalysis: '统计分析'
}

const views = import.meta.glob('../views/**/*.vue')

export function componentFor(menu: MenuItem): () => Promise<unknown> | null {
  const key = `../views/${menu.vue_directory}/${menu.vue_path}.vue`
  const loader = views[key] || views[key.replace('../views', '@/views')] || views[key.replace('../views', '/src/views')]
  if (loader) return loader as () => Promise<unknown>
  // 兜底：未实现的页面给占位页，避免白屏
  return () => import('@/views/PlaceholderView.vue')
}

export function menuToRoute(menu: MenuItem) {
  return {
    path: '/' + menu.vue_path,
    name: menu.vue_path,
    meta: { title: menuLabel(menu.menu_name), menu, module: menu.module },
    component: componentFor(menu)
  }
}

export async function fetchMenus(): Promise<MenuItem[]> {
  return request<MenuItem[]>({ url: '/rolemenu/menus', method: 'GET' })
}

export function setupDynamicRoutes(router: Router) {
  router.beforeEach(async (to) => {
    // 登录�? / 未登录（由全局守卫处理跳转）不注册动态路�?
    if (to.path === '/login') return true
    const saved = JSON.parse(localStorage.getItem('wms2_auth') || '{}')
    if (!saved.accessToken) return true
    if (menuStore.loaded) return true
    try {
      const menus = await fetchMenus()
      menuStore.list = menus
      menuStore.loaded = true
      for (const m of menus) {
        const r = menuToRoute(m)
        if (!router.hasRoute(r.name)) router.addRoute('console', r)
      }
      return to.fullPath // 重新导航以命中新注册的动态路�?
    } catch {
      return true
    }
  })
}
