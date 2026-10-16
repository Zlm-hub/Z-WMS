<template>
  <n-card :bordered="false" class="page-card">
    <n-tabs type="segment" animated v-model:value="statusTab" @update:value="reload(1)">
      <n-tab-pane name="all" tab="全部" />
      <n-tab-pane name="0" tab="待确认" />
      <n-tab-pane name="1" tab="待卸货" />
      <n-tab-pane name="2" tab="待分拣" />
      <n-tab-pane name="3" tab="待上架" />
      <n-tab-pane name="4" tab="已上架" />
    </n-tabs>

    <div class="toolbar" style="margin-top: 12px">
      <n-space>
        <n-input v-model:value="search" placeholder="商品名称/ASN号" clearable style="width: 220px" @keyup.enter="reload(1)" @clear="reload(1)" />
        <n-button type="primary" secondary @click="reload(1)">查询</n-button>
      </n-space>
      <n-button type="primary" @click="openCreate">+ 新建入库单</n-button>
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

    <!-- 新建入库单 -->
    <n-modal v-model:show="showCreate" title="新建入库单" preset="card" style="width: 720px" :mask-closable="false">
      <n-form label-placement="left" label-width="90">
        <n-grid :cols="2" :x-gap="12">
          <n-form-item label="货主" required>
            <n-select v-model:value="createForm.goods_owner_id" :options="ownerOptions" @update:value="syncOwnerName" />
          </n-form-item>
          <n-form-item label="预计到货" required>
            <n-date-picker v-model:value="createForm.estimated_arrival_time" type="datetime" style="width: 100%" />
          </n-form-item>
        </n-grid>
        <n-divider title-placement="left">入库明细</n-divider>
        <n-space vertical>
          <n-card v-for="(d, i) in createForm.detailList" :key="i" size="small" :title="`明细 ${i + 1}`">
            <template #header-extra>
              <n-button v-if="createForm.detailList.length > 1" quaternary type="error" size="small" @click="createForm.detailList.splice(i, 1)">移除</n-button>
            </template>
            <n-grid :cols="2" :x-gap="10">
              <n-form-item label="商品规格" required>
                <n-select
                  v-model:value="d.sku_id"
                  filterable
                  :options="skuOptions"
                  placeholder="搜索规格"
                  @update:value="(v: number) => onSkuPick(d, v)"
                />
              </n-form-item>
              <n-form-item label="数量" required>
                <n-input-number v-model:value="d.asn_qty" :min="1" style="width: 100%" />
              </n-form-item>
              <n-form-item label="保质期(天)"><n-input-number v-model:value="d.expiry_date" :min="0" style="width: 100%" /></n-form-item>
              <n-form-item label="单价"><n-input-number v-model:value="d.price" :precision="2" :min="0" style="width: 100%" /></n-form-item>
            </n-grid>
          </n-card>
          <n-button dashed block @click="addDetail">+ 添加明细</n-button>
        </n-space>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreate = false">取消</n-button>
          <n-button type="primary" :loading="creating" @click="submitCreate">创建</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 卸货 -->
    <n-modal v-model:show="showUnload" title="确认卸货" preset="card" style="width: 420px">
      <n-form label-placement="left" label-width="80">
        <n-form-item label="卸货时间"><n-date-picker v-model:value="opTime" type="datetime" style="width: 100%" /></n-form-item>
        <n-form-item label="经手人">
          <n-select v-model:value="unloadPersonId" :options="userOptions" />
        </n-form-item>
      </n-form>
      <template #footer><n-space justify="end"><n-button @click="showUnload = false">取消</n-button><n-button type="primary" @click="doUnload">确认</n-button></n-space></template>
    </n-modal>

    <!-- 分拣 -->
    <n-modal v-model:show="showSort" title="分拣" preset="card" style="width: 420px">
      <n-form label-placement="left" label-width="110">
        <n-form-item label="分拣数量"><n-input-number v-model:value="sortQty" :min="1" :max="currentRow?.asn_qty || 9999" style="width: 100%" /></n-form-item>
        <n-form-item label="自动生成序列号"><n-switch v-model:value="autoSn" /></n-form-item>
      </n-form>
      <template #footer><n-space justify="end"><n-button @click="showSort = false">取消</n-button><n-button type="primary" @click="doSort">确认</n-button></n-space></template>
    </n-modal>

    <!-- 上架 -->
    <n-modal v-model:show="showPutaway" title="序列号上架" preset="card" style="width: 680px">
      <n-alert v-if="!putawayList.length" type="info">暂无待上架序列号</n-alert>
      <n-space v-else vertical>
        <n-card v-for="(p, i) in putawayList" :key="p.series_number" size="small">
          <n-grid :cols="3" :x-gap="10" style="align-items: center">
            <n-gi :span="2">
              <n-space vertical size="small">
                <n-text strong>序列号：{{ p.series_number }}</n-text>
                <n-text depth="3">数量 {{ p.sorted_qty }}</n-text>
                <n-select v-model:value="p.location_id" :options="locationOptions" placeholder="选择上架库位" size="small" />
              </n-space>
            </n-gi>
            <n-gi>
              <n-button type="primary" block :disabled="!p.location_id" @click="doPutaway(p)">上架</n-button>
            </n-gi>
          </n-grid>
        </n-card>
      </n-space>
    </n-modal>
  </n-card>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from 'vue'
import {
  NCard, NTabs, NTabPane, NDataTable, NInput, NButton, NSpace, NTag, NModal, NForm, NFormItem,
  NGrid, NFormItemGi, NGi, NSelect, NInputNumber, NDatePicker, NDivider, NSwitch, NAlert, NText,
  createDiscreteApi, type DataTableColumns, type PaginationProps
} from 'naive-ui'
import { pageSearch, asnApi, selectApi, ownerApi } from '@/api'
import http from '@/api/http'

const { message, dialog } = createDiscreteApi(['message', 'dialog'])

const STATUS: Record<number, { text: string; type: 'default' | 'info' | 'warning' | 'success' }> = {
  0: { text: '待确认', type: 'default' },
  1: { text: '待卸货', type: 'info' },
  2: { text: '待分拣', type: 'warning' },
  3: { text: '待上架', type: 'warning' },
  4: { text: '已上架', type: 'success' }
}

const loading = ref(false)
const rows = ref<any[]>([])
const total = ref(0)
const pageIndex = ref(1)
const search = ref('')
const statusTab = ref<string>('all')

const pagination = computed<PaginationProps>(() => ({
  page: pageIndex.value,
  pageSize: 20,
  itemCount: total.value,
  onChange: (p: number) => reload(p)
}))

const columns: DataTableColumns = [
  { title: 'ASN号', key: 'asn_no', width: 150 },
  { title: '状态', key: 'asn_status', width: 90, render: (r: any) => { const s = STATUS[r.asn_status] || STATUS[0]; return h(NTag, { size: 'small', type: s.type }, { default: () => s.text }) } },
  { title: '商品', key: 'spu_name', ellipsis: { tooltip: true } },
  { title: '规格', key: 'sku_name', ellipsis: { tooltip: true } },
  { title: '应收', key: 'asn_qty', width: 70 },
  { title: '实收', key: 'actual_qty', width: 70 },
  { title: '已分拣', key: 'sorted_qty', width: 70 },
  { title: '货主', key: 'goods_owner_name' },
  { title: '供应商', key: 'supplier_name' },
  {
    title: '操作', key: '__act', width: 150, fixed: 'right',
    render(row: any) {
      const btns: any[] = []
      if (row.asn_status === 0) btns.push(h(NButton, { size: 'small', type: 'primary', quaternary: true, onClick: () => doConfirm(row) }, { default: () => '确认到货' }))
      if (row.asn_status === 1) btns.push(h(NButton, { size: 'small', type: 'primary', quaternary: true, onClick: () => openUnload(row) }, { default: () => '卸货' }))
      if (row.asn_status === 2) btns.push(h(NButton, { size: 'small', type: 'warning', quaternary: true, onClick: () => openSort(row) }, { default: () => '分拣' }))
      if (row.asn_status === 3) btns.push(h(NButton, { size: 'small', type: 'success', quaternary: true, onClick: () => openPutaway(row) }, { default: () => '上架' }))
      if (row.asn_status === 0) btns.push(h(NButton, { size: 'small', type: 'error', quaternary: true, onClick: () => del(row) }, { default: () => '删除' }))
      return h(NSpace, { size: 4 }, { default: () => btns })
    }
  }
]

async function reload(page = pageIndex.value) {
  pageIndex.value = page
  loading.value = true
  try {
    const b: any = pageSearch({ pageIndex: page, pageSize: 20, searchValue: search.value })
    const data = await asnApi.list(b)
    let list = (data.rows as any[]) || []
    if (statusTab.value !== 'all') list = list.filter((r) => String(r.asn_status) === statusTab.value)
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
const ownerOptions = ref<Array<{ label: string; value: number }>>([])
const skuOptions = ref<Array<{ label: string; value: number }>>([])
const skuMap = ref<Record<number, any>>({})

const createForm = reactive<any>({
  goods_owner_id: null,
  goods_owner_name: '',
  estimated_arrival_time: Date.now(),
  detailList: [blankDetail()]
})

function blankDetail() {
  return { sku_id: null, spu_id: 0, spu_code: '', spu_name: '', sku_code: '', sku_name: '', asn_qty: 1, expiry_date: 0, price: 0 }
}

function addDetail() { createForm.detailList.push(blankDetail()) }

function syncOwnerName(v: number) {
  createForm.goods_owner_name = ownerOptions.value.find((o) => o.value === v)?.label || ''
}

function onSkuPick(d: any, skuId: number) {
  const s = skuMap.value[skuId]
  if (s) {
    d.spu_id = s.spu_id; d.spu_code = s.spu_code; d.spu_name = s.spu_name
    d.sku_code = s.sku_code; d.sku_name = s.sku_name
    d.expiry_date = s.expiry_date || 0
  }
}

function openCreate() {
  Object.assign(createForm, { goods_owner_id: null, goods_owner_name: '', estimated_arrival_time: Date.now(), detailList: [blankDetail()] })
  showCreate.value = true
}

async function submitCreate() {
  if (!createForm.goods_owner_id) { message.error('请选择货主'); return }
  if (createForm.detailList.some((d: any) => !d.sku_id || !d.asn_qty)) { message.error('明细需选择规格并填写数量'); return }
  creating.value = true
  try {
    await asnApi.masterCreate({
      asn_batch: '',
      estimated_arrival_time: new Date(createForm.estimated_arrival_time).toISOString(),
      goods_owner_id: createForm.goods_owner_id,
      goods_owner_name: createForm.goods_owner_name,
      detailList: createForm.detailList.map((d: any) => ({
        spu_id: d.spu_id, spu_code: d.spu_code, spu_name: d.spu_name,
        sku_id: d.sku_id, sku_code: d.sku_code, sku_name: d.sku_name,
        asn_qty: d.asn_qty, actual_qty: 0, weight: 0, volume: 0,
        supplier_id: 0, supplier_name: '',
        expiry_date: new Date(Date.now() + (d.expiry_date || 0) * 86400000).toISOString(),
        price: d.price || 0
      }))
    })
    message.success('入库单已创建')
    showCreate.value = false
    reload(1)
  } catch (e) {
    message.error(e instanceof Error ? e.message : '创建失败')
  } finally {
    creating.value = false
  }
}

// ---- 确认到货 ----
async function doConfirm(row: any) {
  dialog.info({
    title: '确认到货',
    content: `确认 ASN ${row.asn_no} 已到货？`,
    positiveText: '确认', negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await asnApi.confirm([{ id: row.id, arrival_time: new Date().toISOString() }])
        message.success('已确认到货')
        reload()
      } catch (e) {
        message.error(e instanceof Error ? e.message : '操作失败')
      }
    }
  })
}

// ---- 卸货 ----
const showUnload = ref(false)
const opTime = ref(Date.now())
const unloadPersonId = ref<number | null>(null)
const userOptions = ref<Array<{ label: string; value: number }>>([])
const currentRow = ref<any>(null)

function openUnload(row: any) {
  currentRow.value = row
  opTime.value = Date.now()
  showUnload.value = true
}

async function doUnload() {
  const person = userOptions.value.find((u) => u.value === unloadPersonId.value)
  try {
    await asnApi.unload([{
      id: currentRow.value.id,
      unload_time: new Date(opTime.value).toISOString(),
      unload_person_id: person?.value || 0,
      unload_person: person?.label || ''
    }])
    message.success('卸货完成')
    showUnload.value = false
    reload()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '操作失败')
  }
}

// ---- 分拣 ----
const showSort = ref(false)
const sortQty = ref(1)
const autoSn = ref(true)

function openSort(row: any) {
  currentRow.value = row
  sortQty.value = row.asn_qty || 1
  autoSn.value = true
  showSort.value = true
}

async function doSort() {
  try {
    await asnApi.sorting([{ asn_id: currentRow.value.id, sorted_qty: sortQty.value, is_auto_num: autoSn.value }])
    // 分拣后必须推进 sorted（状态 2 → 3）
    await asnApi.sorted([currentRow.value.id])
    message.success('分拣完成（已生成序列号）')
    showSort.value = false
    reload()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '分拣失败')
  }
}

// ---- 上架 ----
const showPutaway = ref(false)
const putawayList = ref<Array<{ asn_id: number; goods_owner_id: number; series_number: string; sorted_qty: number; location_id: number | null }>>([])
const locationOptions = ref<Array<{ label: string; value: number }>>([])

async function openPutaway(row: any) {
  currentRow.value = row
  try {
    const pending = await asnApi.pendingPutaway(row.id)
    putawayList.value = pending.map((p: any) => ({ ...p, location_id: null }))
    showPutaway.value = true
    // 加载全部库位
    const locs = await http.post('/stock/location-list', pageSearch({ pageIndex: 1, pageSize: 200 }))
    locationOptions.value = ((locs.data?.data?.rows as any[]) || []).map((l: any) => ({
      label: `${l.warehouse_name || ''} / ${l.warehouse_area_name || ''} / ${l.location_name}`,
      value: l.id
    }))
  } catch (e) {
    message.error(e instanceof Error ? e.message : '获取待上架数据失败')
  }
}

async function doPutaway(p: any) {
  try {
    await asnApi.putaway([{
      asn_id: p.asn_id,
      goods_owner_id: p.goods_owner_id,
      series_number: p.series_number,
      goods_location_id: p.location_id,
      putaway_qty: p.sorted_qty
    }])
    message.success(`序列号 ${p.series_number} 上架成功`)
    putawayList.value = putawayList.value.filter((x) => x.series_number !== p.series_number)
    if (!putawayList.value.length) {
      showPutaway.value = false
      reload()
    }
  } catch (e) {
    message.error(e instanceof Error ? e.message : '上架失败')
  }
}

function del(row: any) {
  dialog.warning({
    title: '删除确认',
    content: `删除 ASN ${row.asn_no}？`,
    positiveText: '删除', negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await asnApi.remove(row.id)
        message.success('已删除')
        reload()
      } catch (e) {
        message.error(e instanceof Error ? e.message : '删除失败')
      }
    }
  })
}

onMounted(async () => {
  reload(1)
  try {
    const owners = await ownerApi.all()
    ownerOptions.value = owners.map((o: any) => ({ label: o.goods_owner_name, value: o.id }))
    const users = await selectApi.users()
    userOptions.value = users.map((u: any) => ({ label: u.user_name, value: u.id }))
    // SKU 下拉：用 stock sku-select 或 spu list；这里取 spu 列表展开
    const spus = await http.post('/spu/list', pageSearch({ pageIndex: 1, pageSize: 500 }))
    const skuList: any[] = []
    for (const s of (spus.data?.data?.rows as any[]) || []) {
      try {
        const full = await spuApi.get(s.id)
        for (const d of full.detailList || []) {
          const sid = d.id ?? d.sku_id
          skuList.push({ id: sid, spu_id: s.id, spu_code: s.spu_code, spu_name: s.spu_name, sku_code: d.sku_code, sku_name: d.sku_name, expiry_date: d.expiry_date })
          skuMap.value[sid] = skuList[skuList.length - 1]
        }
      } catch { /* skip */ }
    }
    skuOptions.value = skuList.map((s) => ({ label: `${s.spu_name} / ${s.sku_name}（${s.sku_code}）`, value: s.id }))
  } catch { /* 下拉为空不阻塞 */ }
})
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
</style>
