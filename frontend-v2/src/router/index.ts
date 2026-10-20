/**
 * 路由：静态（登录）+ 动态（后端 /rolemenu/menus 驱动，vue_directory/vue_path 映射到 views 目录）
 * 与原版机制一致：import.meta.glob 按约定目录自动注册
 */
import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { setupDynamicRoutes } from './dynamic'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/views/login/LoginView.vue') },
    // 全屏独立页（脱离控制台容器，登录守卫覆盖）；requiredMenu = 菜单表记录，无权限则回落工作台
    { path: '/large-screen', name: 'large-screen', meta: { title: '数据大屏', requiredMenu: 'largeScreen' }, component: () => import('@/views/largeScreen/LargeScreenView.vue') },
    { path: '/vwms', name: 'vwms', meta: { title: '3D 库房', requiredMenu: 'vwms' }, component: () => import('@/views/vwms/VwmsView.vue') },
    {
      path: '/',
      name: 'console',
      component: () => import('@/layouts/ConsoleLayout.vue'),
      children: [
        { path: '', redirect: '/home' },
        { path: 'home', name: 'home', meta: { title: '工作台' }, component: () => import('@/views/home/HomeView.vue') },
        // 统计分析（后端 menu 表已收录，静态注册 + requiredMenu 按角色过滤）
        { path: 'stat-asn', name: 'stat-asn', meta: { title: '入库统计', requiredMenu: 'statAsn' }, component: () => import('@/views/statisticAnalysis/statAsn/statAsn.vue') },
        { path: 'stat-delivery', name: 'stat-delivery', meta: { title: '发货统计', requiredMenu: 'statDelivery' }, component: () => import('@/views/statisticAnalysis/statDelivery/statDelivery.vue') },
        { path: 'stat-safety', name: 'stat-safety', meta: { title: '安全库存', requiredMenu: 'statSafety' }, component: () => import('@/views/statisticAnalysis/statSafety/statSafety.vue') },
        { path: 'stat-age', name: 'stat-age', meta: { title: '库龄统计', requiredMenu: 'statAge' }, component: () => import('@/views/statisticAnalysis/statAge/statAge.vue') }
      ]
    },
    { path: '/:pathMatch(.*)*', redirect: '/home' }
  ] as RouteRecordRaw[]
})

router.beforeEach((to) => {
  const auth = JSON.parse(localStorage.getItem('wms2_auth') || '{}')
  if (to.path !== '/login' && !auth.accessToken) {
    return '/login'
  }
  if (to.path === '/login' && auth.accessToken) {
    return '/home'
  }
  return true
})

// 动态菜单路由在登录后由 menu store 注入
setupDynamicRoutes(router)

export default router
