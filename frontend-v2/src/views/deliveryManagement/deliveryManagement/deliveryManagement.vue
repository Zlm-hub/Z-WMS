<template>
  <n-card :bordered="false" class="page-card">
    <n-tabs type="segment" animated v-model:value="statusTab" @update:value="reload(1)">
      <n-tab-pane name="all" tab="全部" />
      <n-tab-pane name="0" tab="新订单" />
      <n-tab-pane name="2" tab="待拣货" />
      <n-tab-pane name="3" tab="待打包" />
      <n-tab-pane name="4" tab="待称重" />
      <n-tab-pane name="5" tab="待发运" />
      <n-tab-pane name="6" tab="待签收" />
      <n-tab-pane name="7" tab="已签收" />
    </n-tabs>

    <div class="toolbar" style="margin-top: 12px">
      <n-space>
        <n-input v-model:value="search" placeholder="发货单号/客户/商品" clearable style="width: 220px" @keyup.enter="reload(1)" @clear="reload(1)" />
        <n-button type="primary" secondary @click="reload(1)">查询</n-button>
      </n-space>
      <n-button type="primary" @click="openCreate">+ 新建发货单</n-button>
    </div>

    <n-data-table
      remote
      :columns="columns"
      :data="rows"
      :loading="loading"
      :pagination="pagination"
      :row-key="(r: any) => r.id"
      :scroll-x="1250"
      size="small"
      style="margin-top: 12px"
    />

    <!-- 新建发货单 -->
    <n-modal v-model:show="showCreate" title="新建发货单" preset="card" style="width: 640px" :mask-closable="false">
      <n-form label-placement="left" label-width="90">
        <n-form-item label="客户" required>
          <n-select v-model:value="createForm.customer_id" :options="customerOptions" @update:value="syncCustomer" />
        </n-form-item>
        <n-divider title-placement="left">发货明细</n-divider>
        <n-space vertical>
          <n-card v-for="(d, i) in createForm.detailList" :key="i" size="small" :title="`明细 ${i + 1}`">
            <template #header-extra>
              <n-button v-if="createForm.detailList.length > 1" quaternary type="error" size="small" @click="createForm.detailList.splice(i, 1)">移除</n-button>
            </template>
            <n-grid :cols="2" :x-gap="10">
              <!-- 注意：n-grid 只认 n-gi / n-form-item-gi 子元素，直接写 n-form-item 会被静默丢弃 -->
              <n-form-item-gi label="商品规格" required>
                <n-select v-model:value="d.sku_id" filterable :options="skuOptions" placeholder="搜索规格" />
              </n-form-item-gi>
              <n-form-item-gi label="数量" required>
                <n-input-number v-model:value="d.qty" :min="1" style="width: 100%" />
              </n-form-item-gi>
            </n-grid>
          </n-card>
          <n-button dashed block @click="createForm.detailList.push(blankDetail())">+ 添加明细</n-button>
        </n-space>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreate = false">取消</n-button>
          <n-button type="primary" :loading="creating" @click="submitCreate">创建</n-button>
        </n-space>
      </template>
    </n-modal>
  </n-card>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from 'vue'
import {
  NCard, NTabs, NTabPane, NDataTable, NInput, NButton, NSpace, NTag, NModal, NForm, NFormItem,
  NGrid, NFormItemGi, NSelect, NInputNumber, NDivider, createDiscreteApi, type DataTableColumns, type PaginationProps
} from 'naive-ui'
import { pageSearch, dispatchApi, selectApi } from '@/api'
import http from '@/api/http'

const { message, dialog } = createDiscreteApi(['message', 'dialog'])

// 后端 dispatchlist 表状态机：0 新订单 → 2 确认订单(锁库存生成拣货单) → 3 拣货完成
// → 4 打包 → 5 称重 → 6 发运(扣库存) → 7 签收；1 为库存不足时 confirm-order 拆分出的缺货行
const STATUS: Record<number, { text: string; type: 'default' | 'info' | 'warning' | 'success' | 'error' }> = {
  0: { text: '新订单', type: 'default' },
  1: { text: '待确认', type: 'info' },
  2: { text: '待拣货', type: 'info' },
  3: { text: '待打包', type: 'warning' },
  4: { text: '待称重', type: 'warning' },
  5: { text: '待发运', type: 'warning' },
  6: { text: '待签收', type: 'warning' },
  7: { text: '已签收', type: 'success' }
}

const loading = ref(false)
const rows = ref<any[]>([])
const total = ref(0)
const pageIndex = ref(1)
const search = ref('')
const statusTab = ref('all')

const pagination = computed<PaginationProps>(() => ({
  page: pageIndex.value,
  pageSize: 20,
  itemCount: total.value,
  onChange: (p: number) => reload(p)
}))

const columns: DataTableColumns = [
  { title: '发货单号', key: 'dispatch_no', width: 160 },
  { title: '状态', key: 'dispatch_status', width: 90, render: (r: any) => { const s = STATUS[r.dispatch_status] || STATUS[0]; return h(NTag, { size: 'small', type: s.type }, { default: () => s.text }) } },
  { title: '客户', key: 'customer_name' },
  { title: '商品', key: 'spu_name', ellipsis: { tooltip: true } },
  { title: '规格', key: 'sku_name', ellipsis: { tooltip: true } },
  { title: '数量', key: 'qty', width: 70 },
  { title: '拣货', key: 'picked_qty', width: 70 },
  { title: '打包', key: 'package_qty', width: 70 },
  { title: '重量', key: 'weighing_weight', width: 80 },
  { title: '创建人', key: 'creator' },
  {
    title: '操作', key: '__act', width: 160, fixed: 'right',
    render(row: any) {
      const btns: any[] = []
      const st = row.dispatch_status
      if (st === 0) {
        btns.push(h(NButton, { size: 'small', type: 'primary', quaternary: true, onClick: () => confirmOrder(row) }, { default: () => '确认订单' }))
        btns.push(h(NButton, { size: 'small', type: 'error', quaternary: true, onClick: () => cancelOrder(row) }, { default: () => '取消' }))
      }
      if (st === 2) btns.push(h(NButton, { size: 'small', type: 'primary', quaternary: true, onClick: () => pick(row) }, { default: () => '拣货' }))
      if (st === 3) btns.push(h(NButton, { size: 'small', type: 'warning', quaternary: true, onClick: () => simpleStep(row, 'package', '打包') }, { default: () => '打包' }))
      if (st === 4) btns.push(h(NButton, { size: 'small', type: 'warning', quaternary: true, onClick: () => weigh(row) }, { default: () => '称重' }))
      if (st === 5) btns.push(h(NButton, { size: 'small', type: 'info', quaternary: true, onClick: () => simpleStep(row, 'delivery', '发运') }, { default: () => '发运' }))
      if (st === 6) btns.push(h(NButton, { size: 'small', type: 'success', quaternary: true, onClick: () => sign(row) }, { default: () => '签收' }))
      return h(NSpace, { size: 4 }, { default: () => btns })
    }
  }
]

async function reload(page = pageIndex.value) {
  pageIndex.value = page
  loading.value = true
  try {
    const data = await dispatchApi.list(pageSearch({ pageIndex: page, pageSize: 20, searchValue: search.value }))
    let list = (data.rows as any[]) || []
    if (statusTab.value !== 'all') list = list.filter((r) => String(r.dispatch_status) === statusTab.value)
    rows.value = list
    total.value = (data.total as number) || list.length
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

// ---- 新建 ----
const showCreate = ref(false)
const creating = ref(false)
const customerOptions = ref<Array<{ label: string; value: number }>>([])
const skuOptions = ref<Array<{ label: string; value: number }>>([])
const skuMap = ref<Record<number, any>>({})

const blankDetail = () => ({ sku_id: null as number | null, qty: 1 })
const createForm = reactive({ customer_id: null as number | null, customer_name: '', detailList: [blankDetail()] })

function syncCustomer(v: number) {
  createForm.customer_name = customerOptions.value.find((c) => c.value === v)?.label || ''
}

function openCreate() {
  Object.assign(createForm, { customer_id: null, customer_name: '', detailList: [blankDetail()] })
  showCreate.value = true
}

async function submitCreate() {
  if (!createForm.customer_id) { message.error('请选择客户'); return }
  if (createForm.detailList.some((d) => !d.sku_id || !d.qty)) { message.error('明细需选择规格并填写数量'); return }
  creating.value = true
  try {
    await dispatchApi.create(createForm.detailList.map((d) => ({
      customer_id: createForm.customer_id,
      customer_name: createForm.customer_name,
      sku_id: d.sku_id,
      qty: d.qty,
      weight: 0,
      volume: 0
    })))
    message.success('发货单已创建')
    showCreate.value = false
    reload(1)
  } catch (e) {
    message.error(e instanceof Error ? e.message : '创建失败')
  } finally {
    creating.value = false
  }
}

// ---- 状态流转 ----
async function confirmOrder(row: any) {
  dialog.info({
    title: '确认订单',
    content: `确认订单 ${row.dispatch_no}（将按库存生成拣货任务）？`,
    positiveText: '确认', negativeText: '取消',
    onPositiveClick: async () => {
      try {
        // 先取库存分配方案（DispatchlistConfirmDetailViewModel：dispatchlist_id + pick_list 五元组），
        // 再整体带 confirm:true 提交——by-dispatch_no 的 DetailViewModel 没有这些字段，锁不了库存
        const plan = await dispatchApi.confirmCheck(row.dispatch_no)
        const list = (Array.isArray(plan) ? plan : [plan]) as any[]
        await dispatchApi.confirmOrder(list.map((d) => ({ ...d, confirm: true })))
        message.success('订单已确认')
        reload()
      } catch (e) {
        message.error(e instanceof Error ? e.message : '确认失败')
      }
    }
  })
}

async function cancelOrder(row: any) {
  dialog.warning({
    title: '取消订单',
    content: `取消订单 ${row.dispatch_no}？`,
    positiveText: '取消订单', negativeText: '返回',
    onPositiveClick: async () => {
      try {
        // 新订单（status 0）取消 = 删除整单：DELETE /dispatchlist?dispatch_no=
        // 原调的 PUT cancel-order?id= 是「取消打包/称重明细」，收单个 id，整单取消用它是错的
        await dispatchApi.removeByNo(row.dispatch_no)
        message.success('已取消')
        reload()
      } catch (e) {
        message.error(e instanceof Error ? e.message : '操作失败')
      }
    }
  })
}

async function pick(row: any) {
  try {
    await http.put(`/dispatchlist/confirm-pick-dispatchlistno?dispatch_no=${encodeURIComponent(row.dispatch_no)}`)
    message.success('拣货完成')
    reload()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '拣货失败')
  }
}

async function simpleStep(row: any, step: 'package' | 'delivery', label: string) {
  dialog.info({
    title: `确认${label}`,
    content: `确认对 ${row.dispatch_no} 执行${label}？`,
    positiveText: '确认', negativeText: '取消',
    onPositiveClick: async () => {
      try {
        if (step === 'package') {
          await dispatchApi.package([{ id: row.id, dispatch_no: row.dispatch_no, dispatch_status: row.dispatch_status, package_qty: row.qty, picked_qty: row.picked_qty || row.qty }])
        } else {
          await dispatchApi.delivery([{ id: row.id, dispatch_no: row.dispatch_no, dispatch_status: row.dispatch_status, picked_qty: row.picked_qty || row.qty }])
        }
        message.success(`${label}完成`)
        reload()
      } catch (e) {
        message.error(e instanceof Error ? e.message : '操作失败')
      }
    }
  })
}

async function weigh(row: any) {
  const w = window.prompt(`输入 ${row.dispatch_no} 的称重重量(kg)`, '1.0')
  if (w === null) return
  try {
    await dispatchApi.weight([{
      id: row.id, dispatch_no: row.dispatch_no, dispatch_status: row.dispatch_status,
      weighing_qty: row.qty, weighing_weight: Number(w) || 0, picked_qty: row.picked_qty || row.qty
    }])
    message.success('称重完成')
    reload()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '称重失败')
  }
}

async function sign(row: any) {
  const dmg = window.prompt(`输入 ${row.dispatch_no} 的破损数量（无则填 0）`, '0')
  if (dmg === null) return
  try {
    await dispatchApi.sign([{ id: row.id, dispatch_no: row.dispatch_no, dispatch_status: row.dispatch_status, damage_qty: Number(dmg) || 0 }])
    message.success('签收完成')
    reload()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '签收失败')
  }
}

onMounted(async () => {
  reload(1)
  try {
    const cs = await selectApi.customers()
    customerOptions.value = cs.map((c: any) => ({ label: c.customer_name, value: c.id }))
    const spus = await http.post('/spu/list', pageSearch({ pageIndex: 1, pageSize: 500 }))
    for (const s of (spus.data?.data?.rows as any[]) || []) {
      try {
        const full = (await http.get('/spu', { params: { id: s.id } })).data?.data
        for (const d of full?.detailList || []) {
          skuMap.value[d.id ?? d.sku_id] = s
          skuOptions.value.push({ label: `${s.spu_name} / ${d.sku_name}（${d.sku_code}）`, value: d.id ?? d.sku_id })
        }
      } catch { /* skip */ }
    }
  } catch { /* 非阻塞 */ }
})
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
</style>
