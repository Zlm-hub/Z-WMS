<template>
  <QueryTable ref="tableRef" :fetch="fetch" :columns="columns" search-placeholder="商品/单号">
    <template #toolbar-extra>
      <n-button type="primary" @click="openCreate">+ 新建加工单</n-button>
    </template>
  </QueryTable>

  <n-modal v-model:show="showModal" title="新建加工单" preset="card" style="width: 560px" :mask-closable="false">
    <n-form label-placement="left" label-width="110">
      <n-form-item label="加工类型" required>
        <n-select v-model:value="form.process_type" :options="[
          { label: '加工（消耗原料产出成品）', value: 'process' },
          { label: '调整（直接增减库存）', value: 'adjustment' }
        ]" />
      </n-form-item>
      <n-form-item label="商品规格" required>
        <n-select v-model:value="form.sku_id" filterable :options="skuOptions" placeholder="搜索规格" />
      </n-form-item>
      <n-form-item label="库位" required><n-select v-model:value="form.location_id" :options="locationOptions" /></n-form-item>
      <n-form-item :label="form.process_type === 'process' ? '消耗数量' : '调整数量'" required>
        <n-input-number v-model:value="form.qty" :min="1" style="width: 100%" />
      </n-form-item>
      <n-form-item v-if="form.process_type === 'adjustment'" label="正负（加/减）" required>
        <n-select v-model:value="form.is_add" :options="[{ label: '增加', value: 1 }, { label: '减少', value: 0 }]" />
      </n-form-item>
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
import { stockprocessApi } from '@/api'
import http from '@/api/http'

const { message, dialog } = createDiscreteApi(['message', 'dialog'])
const tableRef = ref<InstanceType<typeof QueryTable> | null>(null)
const showModal = ref(false)
const saving = ref(false)
const skuOptions = ref<Array<{ label: string; value: number }>>([])
const locationOptions = ref<Array<{ label: string; value: number }>>([])

const form = reactive({
  process_type: 'process' as 'process' | 'adjustment',
  sku_id: null as number | null,
  location_id: null as number | null,
  qty: 1,
  is_add: 1,
  remarks: ''
})

const fetch = (b: any) => stockprocessApi.list(b)

const columns = [
  { title: '单号', key: 'process_no', width: 150 },
  { title: '商品名称', key: 'spu_name', ellipsis: { tooltip: true } },
  { title: '规格名称', key: 'sku_name', ellipsis: { tooltip: true } },
  { title: '数量', key: 'qty' },
  {
    title: '类型', key: 'process_type',
    render: (r: any) => h(NTag, { size: 'small', type: r.process_type === 'process' ? 'info' : 'warning' }, { default: () => (r.process_type === 'process' ? '加工' : '调整') })
  },
  {
    title: '状态', key: 'process_status',
    render: (r: any) => h(NTag, { size: 'small', type: r.process_status === 1 ? 'success' : 'default' }, { default: () => (r.process_status === 1 ? '已确认' : '待确认') })
  },
  { title: '备注', key: 'remarks', ellipsis: { tooltip: true } },
  {
    title: '操作', key: '__act', width: 110, fixed: 'right',
    render(row: any) {
      if (row.process_status === 1) return null
      return h(NSpace, { size: 4 }, {
        default: () => [
          h(NButton, { size: 'small', quaternary: true, type: 'primary', onClick: () => confirmIt(row) }, {
            default: () => (row.process_type === 'process' ? '确认加工' : '确认调整')
          })
        ]
      })
    }
  }
]

function openCreate() {
  form.sku_id = null; form.location_id = null; form.qty = 1; form.is_add = 1; form.remarks = ''
  showModal.value = true
}

async function save() {
  if (!form.sku_id || !form.location_id) { message.error('请完整选择规格与库位'); return }
  saving.value = true
  try {
    await stockprocessApi.create({ ...form })
    message.success('加工单已创建')
    showModal.value = false
    tableRef.value?.reload()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '提交失败')
  } finally {
    saving.value = false
  }
}

function confirmIt(row: any) {
  const isProcess = row.process_type === 'process'
  dialog.info({
    title: isProcess ? '确认加工' : '确认调整',
    content: `确认执行该单据并过账库存？（数量 ${row.qty}）`,
    positiveText: '确认过账', negativeText: '取消',
    onPositiveClick: async () => {
      try {
        if (isProcess) {
          await stockprocessApi.processConfirm([{ id: row.id }])
        } else {
          await stockprocessApi.adjustConfirm([{ id: row.id }])
        }
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
