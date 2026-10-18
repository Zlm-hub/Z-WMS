<template>
  <QueryTable ref="tableRef" :fetch="fetch" :columns="columns" search-placeholder="盘点单号/商品">
    <template #toolbar-extra>
      <n-button type="primary" @click="openCreate">+ 新建盘点单</n-button>
    </template>
  </QueryTable>

  <n-modal v-model:show="showModal" title="新建盘点单" preset="card" style="width: 560px" :mask-closable="false">
    <n-form label-placement="left" label-width="100">
      <n-form-item label="盘点库存" required>
        <n-select
          v-model:value="form.stock_id"
          filterable
          :options="stockOptions"
          placeholder="选择仓库/库位/商品（序列号）"
          @update:value="onStockPicked"
        />
      </n-form-item>
      <n-descriptions v-if="picked" :column="2" size="small" bordered style="margin-bottom: 12px">
        <n-descriptions-item label="商品">{{ picked.spu_name }}</n-descriptions-item>
        <n-descriptions-item label="规格">{{ picked.sku_name }}</n-descriptions-item>
        <n-descriptions-item label="库位">{{ picked.warehouse_name }} / {{ picked.location_name }}</n-descriptions-item>
        <n-descriptions-item label="序列号">{{ picked.series_number || '-' }}</n-descriptions-item>
        <n-descriptions-item label="账面数量">{{ picked.qty }}</n-descriptions-item>
      </n-descriptions>
      <n-form-item label="实盘数量" required>
        <n-input-number v-model:value="form.counted_qty" :min="0" style="width: 100%" />
      </n-form-item>
      <n-alert v-if="picked" :type="diff >= 0 ? 'success' : 'error'" style="margin-bottom: 12px">
        差异数量：{{ diff >= 0 ? `+${diff}` : diff }}（实盘 − 账面）
      </n-alert>
    </n-form>
    <template #footer>
      <n-space justify="end">
        <n-button @click="showModal = false">取消</n-button>
        <n-button type="primary" :loading="saving" @click="save">提交</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from 'vue'
import { NAlert, NButton, NDescriptions, NDescriptionsItem, NForm, NFormItem, NInputNumber, NModal, NSelect, NSpace, NTag, createDiscreteApi } from 'naive-ui'
import QueryTable from '@/components/QueryTable.vue'
import { stocktakingApi } from '@/api'
import http from '@/api/http'

const { message, dialog } = createDiscreteApi(['message', 'dialog'])
const tableRef = ref<InstanceType<typeof QueryTable> | null>(null)
const showModal = ref(false)
const saving = ref(false)
const stockOptions = ref<Array<{ label: string; value: number }>>([])
const stockMap = ref<Record<number, any>>({})

const form = reactive({ stock_id: null as number | null, counted_qty: 0 })

// StocktakingViewModel（含基类 StocktakingBasicViewModel）字段：
// job_code/job_status(bool:true已完成,false待作业)/counted_qty/difference_qty/book_qty/
// spu_code/spu_name/sku_code/sku_name/warehouse_name/location_name/series_number/handler/create_time
//（原 taking_no/taking_qty/diff_qty/taking_status/goods_location_name 均不存在）
const columns = [
  { title: '盘点单号', key: 'job_code', width: 150 },
  { title: '商品名称', key: 'spu_name', ellipsis: { tooltip: true } },
  { title: '规格名称', key: 'sku_name', ellipsis: { tooltip: true } },
  { title: '仓库', key: 'warehouse_name' },
  { title: '库位', key: 'location_name' },
  { title: '账面数量', key: 'book_qty' },
  { title: '实盘数量', key: 'counted_qty' },
  {
    title: '差异',
    key: 'difference_qty',
    render: (r: any) => {
      const v = r.difference_qty ?? 0
      return h(NTag, { size: 'small', type: v > 0 ? 'success' : v < 0 ? 'error' : 'default' }, { default: () => (v > 0 ? `+${v}` : String(v)) })
    }
  },
  {
    title: '状态',
    key: 'job_status',
    render: (r: any) => h(NTag, { size: 'small', type: r.job_status ? 'success' : 'default' }, { default: () => (r.job_status ? '已完成' : '待作业') })
  },
  {
    title: '操作', key: '__act', width: 110, fixed: 'right',
    render(row: any) {
      if (row.job_status) return null
      return h(NButton, { size: 'small', quaternary: true, type: 'primary', onClick: () => confirmIt(row) }, { default: () => '差异过账' })
    }
  }
]

const picked = computed(() => (form.stock_id != null ? stockMap.value[form.stock_id] : null))
const diff = computed(() => (picked.value ? form.counted_qty - (picked.value.qty ?? 0) : 0))

function onStockPicked() {
  form.counted_qty = picked.value?.qty ?? 0
}

function openCreate() {
  form.stock_id = null
  form.counted_qty = 0
  showModal.value = true
}

async function save() {
  if (!form.stock_id) { message.error('请选择盘点库存'); return }
  const s = stockMap.value[form.stock_id]
  saving.value = true
  try {
    // 后端 AddAsync 收 StocktakingBasicViewModel：按库存五元组定位 stock，
    // 必需 sku_id/goods_owner_id/goods_location_id/series_number/expiry_date/price/putaway_date/book_qty/counted_qty
    await stocktakingApi.create({
      sku_id: s.sku_id,
      goods_owner_id: s.goods_owner_id,
      goods_location_id: s.goods_location_id,
      series_number: s.series_number,
      expiry_date: s.expiry_date,
      price: s.price,
      putaway_date: s.putaway_date,
      book_qty: s.qty,
      counted_qty: form.counted_qty,
      difference_qty: form.counted_qty - (s.qty ?? 0),
      warehouse_name: s.warehouse_name,
      location_name: s.location_name,
      spu_code: s.spu_code,
      spu_name: s.spu_name,
      sku_code: s.sku_code,
      sku_name: s.sku_name
    })
    message.success('盘点单已创建')
    showModal.value = false
    tableRef.value?.reload()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '提交失败')
  } finally {
    saving.value = false
  }
}

function confirmIt(row: any) {
  const diffV = row.difference_qty ?? 0
  dialog.warning({
    title: '差异过账',
    content: `按差异 ${diffV >= 0 ? '+' : ''}${diffV} 调整库存？过账后不可撤销。`,
    positiveText: '过账', negativeText: '取消',
    onPositiveClick: async () => {
      try {
        // 后端 adjustment-confirm 收单个 int id（查询串），不是数组 body
        await stocktakingApi.adjustConfirm(row.id)
        message.success('已过账')
        tableRef.value?.reload()
      } catch (e) {
        message.error(e instanceof Error ? e.message : '过账失败')
      }
    }
  })
}

onMounted(async () => {
  try {
    // /stock/select 返回带完整库存身份的行（含 goods_owner_id/is_freeze/series_number）
    const rows = ((await http.post('/stock/select', { pageIndex: 1, pageSize: 500, sqlTitle: '', searchValue: '' })).data?.data?.rows as any[]) || []
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
