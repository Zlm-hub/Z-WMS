<template>
  <QueryTable ref="tableRef" :fetch="fetch" :columns="columns" search-placeholder="商品/库位">
    <template #toolbar-extra>
      <n-button type="warning" @click="openCreate(true)">+ 新建冻结</n-button>
      <n-button type="success" @click="openCreate(false)">+ 新建解冻</n-button>
    </template>
  </QueryTable>

  <n-modal v-model:show="showModal" :title="form.job_type ? '新建冻结' : '新建解冻'" preset="card" style="width: 560px" :mask-closable="false">
    <n-form label-placement="left" label-width="100">
      <n-form-item label="作业类型" required>
        <n-radio-group v-model:value="form.job_type">
          <n-radio :value="true">冻结</n-radio>
          <n-radio :value="false">解冻</n-radio>
        </n-radio-group>
      </n-form-item>
      <n-form-item label="库存" required>
        <n-select
          v-model:value="form.stock_id"
          filterable
          :options="stockOptions"
          :placeholder="form.job_type ? '选择可冻结库存' : '选择已冻结库存'"
        />
      </n-form-item>
      <n-alert v-if="picked" type="info" style="margin-bottom: 12px">
        {{ picked.spu_name }} / {{ picked.sku_name }}｜{{ picked.warehouse_name }} / {{ picked.location_name }}｜序列号 {{ picked.series_number || '-' }}｜当前{{ picked.is_freeze ? '已冻结' : '未冻结' }}
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
import { computed, h, onMounted, reactive, ref, watch } from 'vue'
import { NAlert, NButton, NForm, NFormItem, NModal, NRadio, NRadioGroup, NSelect, NSpace, NTag, createDiscreteApi } from 'naive-ui'
import QueryTable from '@/components/QueryTable.vue'
import { stockfreezeApi } from '@/api'
import http from '@/api/http'

const { message } = createDiscreteApi(['message', 'dialog'])
const tableRef = ref<InstanceType<typeof QueryTable> | null>(null)
const showModal = ref(false)
const saving = ref(false)
const allStocks = ref<any[]>([])
const stockOptions = ref<Array<{ label: string; value: number }>>([])

// StockfreezeViewModel 字段：job_code/job_type(bool:true冻结,false解冻)/sku_id/goods_owner_id/
// goods_location_id/series_number/warehouse_name/location_name/spu_code/spu_name/sku_code/handler/handle_time
//（原 sku_name/goods_location_name/qty/is_freeze/reason/creator 均不存在）
const form = reactive({ job_type: true, stock_id: null as number | null })

const picked = computed(() => allStocks.value.find((s) => s.id === form.stock_id) || null)

// 按当前作业类型过滤：冻结→未冻结库存；解冻→已冻结库存
watch(() => form.job_type, () => { form.stock_id = null; refreshOptions() })

function refreshOptions() {
  stockOptions.value = allStocks.value
    .filter((s) => (form.job_type ? !s.is_freeze : s.is_freeze))
    .map((s) => ({
      label: `${s.warehouse_name} / ${s.location_name} / ${s.spu_name} / ${s.sku_name}${s.series_number ? `（${s.series_number}）` : ''}`,
      value: s.id
    }))
}

const columns = [
  { title: '作业单号', key: 'job_code', width: 150 },
  {
    title: '类型',
    key: 'job_type',
    render: (r: any) => h(NTag, { size: 'small', type: r.job_type ? 'error' : 'success' }, { default: () => (r.job_type ? '冻结' : '解冻') })
  },
  { title: '仓库', key: 'warehouse_name' },
  { title: '库位', key: 'location_name' },
  { title: '商品编码', key: 'spu_code' },
  { title: '商品名称', key: 'spu_name', ellipsis: { tooltip: true } },
  { title: '规格编码', key: 'sku_code' },
  { title: '序列号', key: 'series_number' },
  { title: '操作人', key: 'handler' },
  { title: '操作时间', key: 'handle_time', width: 160 }
]

function openCreate(jobType: boolean) {
  form.job_type = jobType
  form.stock_id = null
  showModal.value = true
}

async function save() {
  if (!form.stock_id) { message.error('请选择库存'); return }
  const s = allStocks.value.find((t) => t.id === form.stock_id)
  saving.value = true
  try {
    // 后端 AddAsync 按库存五元组定位 stock 并置 is_freeze=job_type；解冻同样是新建一条 job_type=false 的记录
    await stockfreezeApi.create({
      job_type: form.job_type,
      sku_id: s.sku_id,
      goods_owner_id: s.goods_owner_id,
      goods_location_id: s.goods_location_id,
      series_number: s.series_number,
      warehouse_name: s.warehouse_name,
      location_name: s.location_name,
      spu_code: s.spu_code,
      spu_name: s.spu_name,
      sku_code: s.sku_code
    })
    message.success(form.job_type ? '冻结已提交' : '解冻已提交')
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
    // /stock/select 返回带完整库存身份的行（含 goods_owner_id/is_freeze/series_number）
    const rows = ((await http.post('/stock/select', { pageIndex: 1, pageSize: 500, sqlTitle: '', searchValue: '' })).data?.data?.rows as any[]) || []
    allStocks.value = rows
    refreshOptions()
  } catch { /* 非阻塞 */ }
})
</script>
