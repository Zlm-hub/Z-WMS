<template>
  <QueryTable ref="tableRef" :fetch="fetch" :columns="columns" search-placeholder="商品/库位">
    <template #toolbar-extra>
      <n-button type="primary" @click="openCreate">+ 新建移库</n-button>
    </template>
  </QueryTable>

  <n-modal v-model:show="showModal" title="新建移库" preset="card" style="width: 560px" :mask-closable="false">
    <n-form label-placement="left" label-width="100">
      <n-form-item label="移出库存" required>
        <n-select
          v-model:value="form.stock_id"
          filterable
          :options="stockOptions"
          placeholder="选择仓库/库位/商品（序列号）"
          @update:value="onStockPicked"
        />
      </n-form-item>
      <n-form-item label="移入库位" required>
        <n-select v-model:value="form.dest_location_id" :options="destOptions" placeholder="选择目标库位" />
      </n-form-item>
      <n-form-item label="移库数量" required>
        <n-input-number v-model:value="form.qty" :min="1" :max="picked?.qty_available ?? undefined" style="width: 100%" />
      </n-form-item>
      <n-alert v-if="picked" type="info" style="margin-bottom: 12px">
        {{ picked.spu_name }} / {{ picked.sku_name }}｜可用 {{ picked.qty_available }}（{{ picked.warehouse_name }} / {{ picked.location_name }}）
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
import { NAlert, NButton, NForm, NFormItem, NInputNumber, NModal, NSelect, NSpace, NTag, createDiscreteApi } from 'naive-ui'
import QueryTable from '@/components/QueryTable.vue'
import { stockmoveApi } from '@/api'
import http from '@/api/http'

const { message, dialog } = createDiscreteApi(['message', 'dialog'])
const tableRef = ref<InstanceType<typeof QueryTable> | null>(null)
const showModal = ref(false)
const saving = ref(false)
const stockOptions = ref<Array<{ label: string; value: number }>>([])
const stockMap = ref<Record<number, any>>({})
const destOptions = ref<Array<{ label: string; value: number }>>([])
const destMap = ref<Record<number, any>>({})

const form = reactive({ stock_id: null as number | null, dest_location_id: null as number | null, qty: 1 })

// StockmoveViewModel 字段：job_code/move_status(0未调整,1已调整)/orig_goods_warehouse/
// orig_goods_location_name/dest_googs_warehouse/dest_googs_location_name（后端拼写 googs）/qty/
// spu_code/spu_name/sku_code/sku_name/creator/create_time
//（原 from_location_name/to_location_name 不存在）
const MOVE_STATUS: Record<number, string> = { 0: '未调整', 1: '已调整' }

const columns = [
  { title: '单号', key: 'job_code', width: 150 },
  { title: '商品名称', key: 'spu_name', ellipsis: { tooltip: true } },
  { title: '规格名称', key: 'sku_name', ellipsis: { tooltip: true } },
  { title: '来源仓库', key: 'orig_goods_warehouse' },
  { title: '来源库位', key: 'orig_goods_location_name' },
  { title: '目标仓库', key: 'dest_googs_warehouse' },
  { title: '目标库位', key: 'dest_googs_location_name' },
  { title: '数量', key: 'qty' },
  {
    title: '状态',
    key: 'move_status',
    render: (r: any) => h(NTag, { size: 'small', type: r.move_status === 1 ? 'success' : 'default' }, { default: () => MOVE_STATUS[r.move_status] ?? '-' })
  },
  { title: '创建人', key: 'creator' },
  { title: '创建时间', key: 'create_time', width: 160 },
  {
    title: '操作', key: '__act', width: 110, fixed: 'right',
    render(row: any) {
      if (row.move_status !== 0) return null
      return h(NButton, { size: 'small', quaternary: true, type: 'primary', onClick: () => confirmIt(row) }, { default: () => '确认移库' })
    }
  }
]

const picked = computed(() => (form.stock_id != null ? stockMap.value[form.stock_id] : null))

function onStockPicked() {
  const p = picked.value
  form.qty = p?.qty_available ?? 1
}

function openCreate() {
  form.stock_id = null
  form.dest_location_id = null
  form.qty = 1
  showModal.value = true
}

async function save() {
  if (!form.stock_id || !form.dest_location_id) { message.error('请完整选择移出库存与移入库位'); return }
  const s = stockMap.value[form.stock_id]
  const d = destMap.value[form.dest_location_id]
  if (form.dest_location_id === s.goods_location_id) { message.error('移出/移入库位不能相同'); return }
  if (form.qty > (s.qty_available ?? 0)) { message.error('移库数量不可超过可用数量'); return }
  saving.value = true
  try {
    // 后端 AddAsync 按库存五元组定位 stock，来源身份必须完整带上
    await stockmoveApi.create({
      sku_id: s.sku_id,
      goods_owner_id: s.goods_owner_id,
      series_number: s.series_number,
      expiry_date: s.expiry_date,
      price: s.price,
      putaway_date: s.putaway_date,
      orig_goods_location_id: s.goods_location_id,
      orig_goods_warehouse: s.warehouse_name,
      orig_goods_location_name: s.location_name,
      dest_googs_location_id: d.goods_location_id,
      dest_googs_warehouse: d.warehouse_name,
      dest_googs_location_name: d.location_name,
      qty: form.qty,
      spu_code: s.spu_code,
      spu_name: s.spu_name,
      sku_code: s.sku_code,
      sku_name: s.sku_name
    })
    message.success('移库单已创建')
    showModal.value = false
    tableRef.value?.reload()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '提交失败')
  } finally {
    saving.value = false
  }
}

function confirmIt(row: any) {
  dialog.warning({
    title: '确认移库',
    content: `确认执行移库并过账库存？（数量 ${row.qty}）`,
    positiveText: '确认过账', negativeText: '取消',
    onPositiveClick: async () => {
      try {
        // PUT /stockmove 收单个 int id（查询串）
        await stockmoveApi.confirm(row.id)
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
    // 来源库存：/stock/select 带完整库存身份（含 goods_owner_id/series_number/expiry_date 等）
    const rows = ((await http.post('/stock/select', { pageIndex: 1, pageSize: 500, sqlTitle: '', searchValue: '' })).data?.data?.rows as any[]) || []
    for (const s of rows) {
      stockMap.value[s.id] = s
      stockOptions.value.push({
        label: `${s.warehouse_name} / ${s.location_name} / ${s.spu_name} / ${s.sku_name}${s.series_number ? `（${s.series_number}）` : ''}`,
        value: s.id
      })
    }
    // 目标库位：/stock/location-list 按 goods_location_id 去重
    const locs = ((await http.post('/stock/location-list', { pageIndex: 1, pageSize: 500, sqlTitle: '', searchValue: '' })).data?.data?.rows as any[]) || []
    for (const l of locs) {
      if (destMap.value[l.goods_location_id]) continue
      destMap.value[l.goods_location_id] = l
      destOptions.value.push({ label: `${l.warehouse_name} / ${l.location_name}`, value: l.goods_location_id })
    }
  } catch { /* 非阻塞 */ }
})
</script>
