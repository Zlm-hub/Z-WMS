<template>
  <QueryTable ref="tableRef" :fetch="fetch" :columns="columns" search-placeholder="商品/库位">
    <template #toolbar-extra>
      <n-button type="warning" @click="openCreate">+ 新建冻结</n-button>
    </template>
  </QueryTable>

  <n-modal v-model:show="showModal" title="新建冻结" preset="card" style="width: 520px" :mask-closable="false">
    <n-form label-placement="left" label-width="100">
      <n-form-item label="商品规格" required>
        <n-select v-model:value="form.sku_id" filterable :options="skuOptions" placeholder="搜索规格" />
      </n-form-item>
      <n-form-item label="冻结库位" required><n-select v-model:value="form.location_id" :options="locationOptions" /></n-form-item>
      <n-form-item label="冻结数量" required><n-input-number v-model:value="form.qty" :min="1" style="width: 100%" /></n-form-item>
      <n-form-item label="冻结原因"><n-input v-model:value="form.reason" type="textarea" :rows="2" /></n-form-item>
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
import { NButton, NModal, NForm, NFormItem, NSelect, NInputNumber, NInput, NTag, NSpace, createDiscreteApi } from 'naive-ui'
import QueryTable from '@/components/QueryTable.vue'
import { stockfreezeApi } from '@/api'
import http from '@/api/http'

const { message, dialog } = createDiscreteApi(['message', 'dialog'])
const tableRef = ref<InstanceType<typeof QueryTable> | null>(null)
const showModal = ref(false)
const saving = ref(false)
const skuOptions = ref<Array<{ label: string; value: number }>>([])
const locationOptions = ref<Array<{ label: string; value: number }>>([])

const form = reactive({ sku_id: null as number | null, location_id: null as number | null, qty: 1, reason: '' })

const fetch = (b: any) => stockfreezeApi.list(b)

const columns = [
  { title: '商品名称', key: 'spu_name', ellipsis: { tooltip: true } },
  { title: '规格名称', key: 'sku_name', ellipsis: { tooltip: true } },
  { title: '库位', key: 'goods_location_name' },
  { title: '冻结数量', key: 'qty' },
  {
    title: '状态', key: 'is_freeze',
    render: (r: any) => h(NTag, { size: 'small', type: r.is_freeze ? 'error' : 'default' }, { default: () => (r.is_freeze ? '冻结中' : '已解冻') })
  },
  { title: '原因', key: 'reason', ellipsis: { tooltip: true } },
  { title: '经手人', key: 'creator' },
  {
    title: '操作', key: '__act', width: 90, fixed: 'right',
    render(row: any) {
      if (!row.is_freeze) return null
      return h(NButton, { size: 'small', quaternary: true, type: 'success', onClick: () => unfreeze(row) }, { default: () => '解冻' })
    }
  }
]

function openCreate() {
  form.sku_id = null; form.location_id = null; form.qty = 1; form.reason = ''
  showModal.value = true
}

async function save() {
  if (!form.sku_id || !form.location_id) { message.error('请完整选择规格与库位'); return }
  saving.value = true
  try {
    await stockfreezeApi.create({ ...form })
    message.success('冻结已提交')
    showModal.value = false
    tableRef.value?.reload()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '提交失败')
  } finally {
    saving.value = false
  }
}

function unfreeze(row: any) {
  dialog.info({
    title: '解冻确认',
    content: `解冻该批库存（${row.qty}）？`,
    positiveText: '解冻', negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await stockfreezeApi.update({ ...row, is_freeze: false })
        message.success('已解冻')
        tableRef.value?.reload()
      } catch (e) {
        message.error(e instanceof Error ? e.message : '解冻失败')
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
