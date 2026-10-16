<template>
  <QueryTable ref="tableRef" :fetch="fetch" :columns="columns" search-placeholder="商品/库位">
    <template #toolbar-extra>
      <n-button type="primary" @click="openCreate">+ 新建移库</n-button>
    </template>
  </QueryTable>

  <n-modal v-model:show="showModal" title="新建移库" preset="card" style="width: 520px" :mask-closable="false">
    <n-form label-placement="left" label-width="100">
      <n-form-item label="商品规格" required>
        <n-select v-model:value="form.sku_id" filterable :options="skuOptions" placeholder="搜索规格" />
      </n-form-item>
      <n-form-item label="移出库位" required><n-select v-model:value="form.from_location_id" :options="locationOptions" /></n-form-item>
      <n-form-item label="移入库位" required><n-select v-model:value="form.to_location_id" :options="locationOptions" /></n-form-item>
      <n-form-item label="移库数量" required><n-input-number v-model:value="form.qty" :min="1" style="width: 100%" /></n-form-item>
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
import { NButton, NSpace, NModal, NForm, NFormItem, NSelect, NInputNumber, createDiscreteApi } from 'naive-ui'
import QueryTable from '@/components/QueryTable.vue'
import { stockmoveApi } from '@/api'
import http from '@/api/http'

const { message } = createDiscreteApi(['message'])
const tableRef = ref<InstanceType<typeof QueryTable> | null>(null)
const showModal = ref(false)
const saving = ref(false)
const skuOptions = ref<Array<{ label: string; value: number }>>([])
const locationOptions = ref<Array<{ label: string; value: number }>>([])
const skuMap = ref<Record<number, any>>({})

const form = reactive({ sku_id: null as number | null, from_location_id: null as number | null, to_location_id: null as number | null, qty: 1 })

const fetch = (b: any) => stockmoveApi.list(b)

const columns = [
  { title: '商品名称', key: 'spu_name', ellipsis: { tooltip: true } },
  { title: '规格名称', key: 'sku_name', ellipsis: { tooltip: true } },
  { title: '移出库位', key: 'from_location_name' },
  { title: '移入库位', key: 'to_location_name' },
  { title: '数量', key: 'qty' },
  { title: '经手人', key: 'creator' },
  { title: '时间', key: 'create_time', width: 160 }
]

function openCreate() {
  form.sku_id = null; form.from_location_id = null; form.to_location_id = null; form.qty = 1
  showModal.value = true
}

async function save() {
  if (!form.sku_id || !form.from_location_id || !form.to_location_id) { message.error('请完整选择规格与库位'); return }
  if (form.from_location_id === form.to_location_id) { message.error('移出/移入库位不能相同'); return }
  saving.value = true
  try {
    const s = skuMap.value[form.sku_id]
    await stockmoveApi.create({
      ...form,
      from_location_name: locationOptions.value.find((l) => l.value === form.from_location_id)?.label || '',
      to_location_name: locationOptions.value.find((l) => l.value === form.to_location_id)?.label || ''
    })
    message.success('移库已提交')
    showModal.value = false
    tableRef.value?.reload()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '提交失败')
  } finally {
    saving.value = false
  }
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
          const sid = d.id ?? d.sku_id
          skuMap.value[sid] = s
          skuOptions.value.push({ label: `${s.spu_name} / ${d.sku_name}（${d.sku_code}）`, value: sid })
        }
      } catch { /* skip */ }
    }
  } catch { /* 非阻塞 */ }
})
</script>
