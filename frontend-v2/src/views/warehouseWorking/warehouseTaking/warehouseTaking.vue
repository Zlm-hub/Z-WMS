<template>
  <QueryTable ref="tableRef" :fetch="fetch" :columns="columns" search-placeholder="盘点单号/商品">
    <template #toolbar-extra>
      <n-button type="primary" @click="openCreate">+ 新建盘点单</n-button>
    </template>
  </QueryTable>

  <n-modal v-model:show="showModal" title="新建盘点单" preset="card" style="width: 520px" :mask-closable="false">
    <n-form label-placement="left" label-width="100">
      <n-form-item label="商品规格" required>
        <n-select v-model:value="form.sku_id" filterable :options="skuOptions" placeholder="搜索规格" />
      </n-form-item>
      <n-form-item label="盘点库位" required><n-select v-model:value="form.location_id" :options="locationOptions" /></n-form-item>
      <n-form-item label="实盘数量" required><n-input-number v-model:value="form.taking_qty" :min="0" style="width: 100%" /></n-form-item>
      <n-form-item label="备注"><n-input v-model:value="form.remarks" type="textarea" :rows="2" /></n-form-item>
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
import { h, onMounted, reactive, ref } from 'vue'
import { NButton, NSpace, NModal, NForm, NFormItem, NSelect, NInputNumber, NInput, NTag, createDiscreteApi } from 'naive-ui'
import QueryTable from '@/components/QueryTable.vue'
import { stocktakingApi } from '@/api'
import http from '@/api/http'

const { message, dialog } = createDiscreteApi(['message', 'dialog'])
const tableRef = ref<InstanceType<typeof QueryTable> | null>(null)
const showModal = ref(false)
const saving = ref(false)
const skuOptions = ref<Array<{ label: string; value: number }>>([])
const locationOptions = ref<Array<{ label: string; value: number }>>([])

const form = reactive({ sku_id: null as number | null, location_id: null as number | null, taking_qty: 0, remarks: '' })

const fetch = (b: any) => stocktakingApi.list(b)

const columns = [
  { title: '盘点单号', key: 'taking_no', width: 150 },
  { title: '商品名称', key: 'spu_name', ellipsis: { tooltip: true } },
  { title: '规格名称', key: 'sku_name', ellipsis: { tooltip: true } },
  { title: '库位', key: 'goods_location_name' },
  { title: '账面数量', key: 'book_qty' },
  { title: '实盘数量', key: 'taking_qty' },
  {
    title: '差异', key: 'diff_qty',
    render: (r: any) => {
      const diff = (r.taking_qty ?? 0) - (r.book_qty ?? 0)
      return h(NTag, { size: 'small', type: diff > 0 ? 'success' : diff < 0 ? 'error' : 'default' }, { default: () => (diff > 0 ? `+${diff}` : String(diff)) })
    }
  },
  {
    title: '状态', key: 'taking_status',
    render: (r: any) => h(NTag, { size: 'small', type: r.taking_status === 1 ? 'success' : 'default' }, { default: () => (r.taking_status === 1 ? '已过账' : '待过账') })
  },
  {
    title: '操作', key: '__act', width: 110, fixed: 'right',
    render(row: any) {
      if (row.taking_status === 1) return null
      return h(NButton, { size: 'small', quaternary: true, type: 'primary', onClick: () => confirmIt(row) }, { default: () => '差异过账' })
    }
  }
]

function openCreate() {
  form.sku_id = null; form.location_id = null; form.taking_qty = 0; form.remarks = ''
  showModal.value = true
}

async function save() {
  if (!form.sku_id || !form.location_id) { message.error('请完整选择规格与库位'); return }
  saving.value = true
  try {
    await stocktakingApi.create({ ...form })
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
  const diff = (row.taking_qty ?? 0) - (row.book_qty ?? 0)
  dialog.warning({
    title: '差异过账',
    content: `按差异 ${diff >= 0 ? '+' : ''}${diff} 调整库存？过账后不可撤销。`,
    positiveText: '过账', negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await stocktakingApi.adjustConfirm([{ id: row.id }])
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
    const locs = await http.post('/stock/location-list', { pageIndex: 1, pageSize: 500, sqlTitle: '', searchValue: '' })
    locationOptions.value = ((locs.data?.data?.rows as any[]) || []).map((l: any) => ({
      label: `${l.warehouse_name || ''} / ${l.location_name}`,
      value: l.id
    }))
    const spus = await http.post('/spu/list', { pageIndex: 1, pageSize: 500, sqlTitle: '', searchValue: '' })
    for (const s of (spus.data?.data?.rows as any[]) || []) {
      try {
        const full = (await http.get('/spu', { params: { id: s.id } })).data?.data
        for (const d of full?.detailList || []) {
          skuOptions.value.push({ label: `${s.spu_name} / ${d.sku_name}（${d.sku_code}）`, value: d.id ?? d.sku_id })
        }
      } catch { /* skip */ }
    }
  } catch { /* 非阻塞 */ }
})
</script>
