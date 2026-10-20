<template>
  <QueryTable ref="tableRef" :fetch="fetch" :columns="columns" search-placeholder="作业单号">
    <template #toolbar-extra>
      <n-button type="primary" @click="openCreate">+ 新建加工单</n-button>
    </template>
  </QueryTable>

  <n-modal v-model:show="showModal" title="新建加工单" preset="card" style="width: 860px" :mask-closable="false">
    <n-form label-placement="left" label-width="100">
      <n-form-item label="作业类型" required>
        <n-radio-group v-model:value="form.job_type">
          <n-radio :value="true">组合加工（消耗原料，产出成品）</n-radio>
          <n-radio :value="false">拆分加工（拆分来源，产出多个）</n-radio>
        </n-radio-group>
      </n-form-item>
      <n-form-item label="加工明细" required>
        <n-data-table
          :columns="detailCols"
          :data="form.detailList"
          :row-key="(r: any) => r._key"
          size="small"
          :scroll-x="720"
          style="width: 100%"
        />
      </n-form-item>
      <n-button dashed block @click="addDetail">+ 添加明细</n-button>
      <n-alert type="info" style="margin-top: 12px">
        原料行过账时扣减库存，成品行过账时增加库存；确认加工仅标记状态，确认调整才会过账库存。
        原料数量默认取该行可用量（可改小），成品数量默认 1，按实际产出填。
      </n-alert>
    </n-form>
    <template #footer>
      <n-space justify="end">
        <n-button @click="showModal = false">取消</n-button>
        <n-button type="primary" :loading="saving" @click="save">提交</n-button>
      </n-space>
    </template>
  </n-modal>

  <n-modal v-model:show="showDetail" title="加工单明细" preset="card" style="width: 820px">
    <n-spin :show="detailLoading">
      <n-descriptions :column="2" size="small" label-placement="left" bordered>
        <n-descriptions-item label="作业单号">{{ detail.job_code || '-' }}</n-descriptions-item>
        <n-descriptions-item label="作业类型">{{ detail.job_type ? '组合加工' : '拆分加工' }}</n-descriptions-item>
        <n-descriptions-item label="加工状态">{{ detail.process_status ? '已加工' : '待加工' }}</n-descriptions-item>
        <n-descriptions-item label="是否已调整">{{ detail.adjust_status ? '已调整' : '未调整' }}</n-descriptions-item>
        <n-descriptions-item label="操作人">{{ detail.processor || '-' }}</n-descriptions-item>
        <n-descriptions-item label="创建人">{{ detail.creator || '-' }}</n-descriptions-item>
      </n-descriptions>
      <n-divider title-placement="left">原料（过账扣减）</n-divider>
      <n-data-table :columns="readonlyDetailCols" :data="detail.source_detail_list || []" size="small" :bordered="false" />
      <n-divider title-placement="left">成品（过账增加）</n-divider>
      <n-data-table :columns="readonlyDetailCols" :data="detail.target_detail_list || []" size="small" :bordered="false" />
    </n-spin>
    <template #footer>
      <n-space justify="end">
        <n-button @click="showDetail = false">关闭</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { h, onMounted, reactive, ref } from 'vue'
import { NAlert, NButton, NDataTable, NDescriptions, NDescriptionsItem, NDivider, NForm, NFormItem, NInputNumber, NModal, NRadio, NRadioGroup, NSpace, NSelect, NSpin, NTag, createDiscreteApi, type DataTableColumns } from 'naive-ui'
import QueryTable from '@/components/QueryTable.vue'
import { stockprocessApi } from '@/api'
import http from '@/api/http'

const { message, dialog } = createDiscreteApi(['message', 'dialog'])
const tableRef = ref<InstanceType<typeof QueryTable> | null>(null)
const showModal = ref(false)
const saving = ref(false)
const showDetail = ref(false)
const detailLoading = ref(false)
const detail = ref<Record<string, any>>({})
const stockOptions = ref<Array<{ label: string; value: number }>>([])
const stockMap = ref<Record<number, any>>({})
let detailKeySeq = 0

// StockprocessGetViewModel 字段：job_code/job_type(bool:true组合,false拆分)/process_status(bool)/
// adjust_status(bool)/processor/process_time/creator/create_time
//（原 process_no/spu_name/sku_name/qty/process_type/remarks 均不存在；商品数量在明细里）
const form = reactive<{ job_type: boolean; detailList: any[] }>({ job_type: true, detailList: [] })

// QueryTable 数据源（勿删：QueryTable props.fetch 必需，缺失会导致表格无法加载）
const fetch = (b: any) => stockprocessApi.list(b)

const columns = [
  { title: '作业单号', key: 'job_code', width: 150 },
  {
    title: '作业类型',
    key: 'job_type',
    render: (r: any) => h(NTag, { size: 'small', type: r.job_type ? 'info' : 'warning' }, { default: () => (r.job_type ? '组合加工' : '拆分加工') })
  },
  {
    title: '加工状态',
    key: 'process_status',
    render: (r: any) => h(NTag, { size: 'small', type: r.process_status ? 'success' : 'default' }, { default: () => (r.process_status ? '已加工' : '待加工') })
  },
  {
    title: '是否已调整',
    key: 'adjust_status',
    render: (r: any) => h(NTag, { size: 'small', type: r.adjust_status ? 'success' : 'default' }, { default: () => (r.adjust_status ? '已调整' : '未调整') })
  },
  { title: '操作人', key: 'processor' },
  { title: '操作时间', key: 'process_time', width: 160 },
  { title: '创建人', key: 'creator' },
  { title: '创建时间', key: 'create_time', width: 160 },
  {
    title: '操作', key: '__act', width: 250, fixed: 'right',
    render(row: any) {
      // 列表页只回主表字段，明细要单独查 GET /stockprocess?id=
      const btns: any[] = [
        h(NButton, { size: 'small', quaternary: true, onClick: () => openDetail(row) }, { default: () => '查看明细' })
      ]
      if (!row.process_status) {
        btns.push(h(NButton, { size: 'small', quaternary: true, type: 'primary', onClick: () => confirmProcess(row) }, { default: () => '确认加工' }))
      }
      if (row.process_status && !row.adjust_status) {
        btns.push(h(NButton, { size: 'small', quaternary: true, type: 'warning', onClick: () => confirmAdjust(row) }, { default: () => '确认调整过账' }))
      }
      return h(NSpace, { size: 4 }, { default: () => btns })
    }
  }
]

// 明细只读表（查看弹窗用）：原料/成品列表共用同一套列
const readonlyDetailCols: DataTableColumns = [
  { title: '商品', key: 'spu_name', minWidth: 180 },
  { title: '规格', key: 'sku_name', width: 180, render: (r: any) => r.sku_name || r.sku_code || '-' },
  { title: '库位', key: 'location_name', width: 110, render: (r: any) => r.location_name || '-' },
  { title: '序列号', key: 'series_number', width: 140, render: (r: any) => r.series_number || '-' },
  { title: '数量', key: 'qty', width: 100, render: (r: any) => `${r.qty}${r.unit ? ' ' + r.unit : ''}` }
]

const detailCols: DataTableColumns = [
  {
    title: '库存',
    key: 'stock_id',
    width: 300,
    render: (row: any) =>
      h(NSelect, {
        value: row.stock_id,
        options: stockOptions.value,
        placeholder: '选择仓库/库位/商品（序列号）',
        filterable: true,
        'onUpdate:value': (v: number) => { row.stock_id = v; applyStock(row) }
      })
  },
  {
    title: '类型',
    key: 'is_source',
    width: 130,
    render: (row: any) =>
      h(NSelect, {
        value: row.is_source,
        options: [{ label: '原料（消耗）', value: true }, { label: '成品（产出）', value: false }],
        'onUpdate:value': (v: boolean) => { row.is_source = v; if (row.stock_id) applyStock(row) }
      })
  },
  {
    title: '数量',
    key: 'qty',
    width: 130,
    render: (row: any) =>
      h(NInputNumber, {
        value: row.qty,
        min: 1,
        // 只有原料受来源可用量约束；成品是产出，跟来源行余量无关
        // Math.max(1, ...) 防止可用量为 0 时出现 max<min 的非法输入框
        max: row.is_source ? Math.max(1, Number(row.qty_available ?? 1)) : undefined,
        'onUpdate:value': (v: number) => { row.qty = v }
      })
  },
  {
    title: '操作',
    key: '_op',
    width: 70,
    render: (row: any) =>
      h(NButton, { size: 'small', quaternary: true, type: 'error', onClick: () => removeDetail(row) }, { default: () => '删除' })
  }
]

function applyStock(row: any) {
  const s = stockMap.value[row.stock_id]
  if (!s) return
  row.sku_id = s.sku_id
  row.goods_owner_id = s.goods_owner_id
  row.goods_location_id = s.goods_location_id
  row.series_number = s.series_number
  row.expiry_date = s.expiry_date
  row.price = s.price
  row.putaway_date = s.putaway_date
  row.qty_available = s.qty_available
  // 原料默认取满可用量（用户可改小）；成品是产出，默认 1 且不受来源行可用量约束
  // —— 旧实现两行都填 qty_available，成品行选到可用量为 0 的库存会卡死在 0
  row.qty = row.is_source ? (Number(s.qty_available) > 0 ? Number(s.qty_available) : 1) : 1
}

function addDetail() {
  form.detailList.push({ _key: ++detailKeySeq, stock_id: null, is_source: true, qty: 1 })
}

function removeDetail(row: any) {
  form.detailList = form.detailList.filter((d) => d._key !== row._key)
}

async function openCreate() {
  form.job_type = true
  form.detailList = [{ _key: ++detailKeySeq, stock_id: null, is_source: true, qty: 1 }, { _key: ++detailKeySeq, stock_id: null, is_source: false, qty: 1 }]
  // 打开弹窗时重拉库存：过账后 qty_available 即时变化，旧快照的数量上限会失真
  try {
    const rows2 = ((await http.post('/stock/select', { pageIndex: 1, pageSize: 2000, sqlTitle: '', searchValue: '' })).data?.data?.rows as any[]) || []
    stockMap.value = {}
    stockOptions.value = []
    for (const s of rows2) {
      stockMap.value[s.id] = s
      stockOptions.value.push({
        label: `${s.warehouse_name} / ${s.location_name} / ${s.spu_name} / ${s.sku_name}${s.series_number ? `（${s.series_number}）` : ''}`,
        value: s.id
      })
    }
  } catch { /* 沿用旧快照 */ }
  showModal.value = true
}

async function save() {
  if (form.detailList.length < 2) { message.error('至少需要两条明细（原料与成品）'); return }
  for (const d of form.detailList) {
    if (!d.stock_id) { message.error('请为每条明细选择库存'); return }
  }
  saving.value = true
  try {
    // 后端 AddAsync 收 StockprocessViewModel：master + detailList，
    // 明细按库存五元组定位 stock，is_source=true 为消耗、false 为产出。
    // process_status 必须显式传 false：上游 VM 该字段默认 true（建单即"已加工"），
    // 不传会导致「确认加工」环节永远不出现，与上游流程不符
    await stockprocessApi.create({
      job_type: form.job_type,
      process_status: false,
      detailList: form.detailList.map((d) => {
        const s = stockMap.value[d.stock_id]
        return {
          sku_id: s.sku_id,
          goods_owner_id: s.goods_owner_id,
          goods_location_id: s.goods_location_id,
          series_number: s.series_number,
          expiry_date: s.expiry_date,
          price: s.price,
          putaway_date: s.putaway_date,
          qty: d.qty,
          is_source: d.is_source,
          spu_code: s.spu_code,
          spu_name: s.spu_name,
          sku_code: s.sku_code,
          location_name: s.location_name
        }
      })
    })
    message.success('加工单已创建')
    showModal.value = false
    tableRef.value?.reload()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '提交失败')
  } finally {
    saving.value = false
  }
}

async function openDetail(row: any) {
  showDetail.value = true
  detailLoading.value = true
  detail.value = { ...row }
  try {
    // 后端 GetAsync 返回 source_detail_list / target_detail_list，已带 spu/sku/库位名
    detail.value = (await stockprocessApi.get(row.id)) || row
  } catch (e) {
    message.error(e instanceof Error ? e.message : '明细加载失败')
  } finally {
    detailLoading.value = false
  }
}

function confirmProcess(row: any) {
  dialog.info({
    title: '确认加工',
    content: '确认加工仅标记作业状态，不过账库存。确认？',
    positiveText: '确认', negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await stockprocessApi.processConfirm(row.id)
        message.success('已确认加工')
        tableRef.value?.reload()
      } catch (e) {
        message.error(e instanceof Error ? e.message : '操作失败')
      }
    }
  })
}

function confirmAdjust(row: any) {
  dialog.warning({
    title: '确认调整过账',
    content: '将按明细过账库存（原料扣减、成品增加），过账后不可撤销。确认？',
    positiveText: '确认过账', negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await stockprocessApi.adjustConfirm(row.id)
        message.success('已过账')
        tableRef.value?.reload()
      } catch (e) {
        message.error(e instanceof Error ? e.message : '操作失败')
      }
    }
  })
}

onMounted(async () => {
  try {
    // /stock/select 返回带完整库存身份的行（含 goods_owner_id/series_number/expiry_date 等）
    const rows = ((await http.post('/stock/select', { pageIndex: 1, pageSize: 2000, sqlTitle: '', searchValue: '' })).data?.data?.rows as any[]) || []
    for (const s of rows) {
      stockMap.value[s.id] = s
      stockOptions.value.push({
        label: `${s.warehouse_name} / ${s.location_name} / ${s.spu_name} / ${s.sku_name}${s.series_number ? `（${s.series_number}）` : ''}`,
        value: s.id
      })
    }
  } catch { /* 非阻塞 */ }
})
</script>
