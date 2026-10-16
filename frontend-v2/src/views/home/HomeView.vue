<template>
  <n-space vertical size="large">
    <!-- 欢迎横幅 -->
    <n-card :bordered="false" class="page-card hero">
      <div class="hero-inner">
        <div>
          <div class="hero-title">你好，{{ username }}</div>
          <div class="hero-sub">欢迎回来，今天也要顺利出货 📦</div>
        </div>
      </div>
    </n-card>

    <!-- 快捷入口 -->
    <n-grid :cols="4" :x-gap="12" :y-gap="12">
      <n-grid-item v-for="q in quickLinks" :key="q.path">
        <n-card size="small" hoverable class="quick-card" @click="$router.push(q.path)">
          <div class="quick-inner">
            <div class="quick-name">{{ q.name }}</div>
            <n-text depth="3">进入 →</n-text>
          </div>
        </n-card>
      </n-grid-item>
    </n-grid>

    <!-- 库存概览 -->
    <n-card :bordered="false" class="page-card" title="库存概览">
      <n-data-table :columns="overviewCols" :data="overviewRows" :loading="loading" size="small" :max-height="320" />
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import {
  NCard, NGrid, NGridItem, NDataTable, NSpace, NText, NTag, createDiscreteApi
} from 'naive-ui'
import { pageSearch, stockApi } from '@/api'
import { useAuthStore } from '@/stores/auth'

const { message } = createDiscreteApi(['message'])
const auth = useAuthStore()
const username = computed(() => (auth.user?.user_name as string) || 'admin')

const quickLinks = [
  { name: '入库通知', path: '/stockAsn' },
  { name: '发货管理', path: '/deliveryManagement' },
  { name: '库存管理', path: '/stockManagement' },
  { name: '商品管理', path: '/commodityManagement' },
  { name: '数据大屏', path: '/large-screen' },
  { name: '3D 库房', path: '/vwms' }
]

const loading = ref(false)
const overviewRows = ref<any[]>([])

const overviewCols = [
  { title: '商品', key: 'spu_name', ellipsis: { tooltip: true } },
  { title: '规格', key: 'sku_name', ellipsis: { tooltip: true } },
  { title: '库存量', key: 'qty', render: (r: any) => h(NTag, { size: 'small', type: r.qty > 0 ? 'success' : 'warning' }, { default: () => String(r.qty ?? 0) }) },
  { title: '可用量', key: 'qty_available' },
  { title: '锁定', key: 'qty_locked' },
  { title: '冻结', key: 'qty_frozen' },
  { title: '在途(待入库)', key: 'qty_asn' }
]

onMounted(async () => {
  loading.value = true
  try {
    const data = await stockApi.stockList(pageSearch({ pageIndex: 1, pageSize: 10 }))
    overviewRows.value = (data.rows as any[]) || []
  } catch (e) {
    message.error(e instanceof Error ? e.message : '库存概览加载失败')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.hero { background: linear-gradient(120deg, #2563eb 0%, #3b82f6 60%, #60a5fa 100%); border-radius: 8px; }
.hero-inner { color: #fff; padding: 8px 4px; }
.hero-title { font-size: 22px; font-weight: 700; }
.hero-sub { margin-top: 6px; opacity: 0.9; font-size: 13px; }
.quick-card { cursor: pointer; }
.quick-inner { display: flex; justify-content: space-between; align-items: center; }
.quick-name { font-weight: 600; }
</style>
