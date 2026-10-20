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
          :consistent-menu-width="false"
          :options="stockOptions"
          :placeholder="form.job_type ? '输入序列号/商品搜索可冻结库存' : '输入序列号/商品搜索已冻结库存'"
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
import { sortStockRows, stockOptionLabel } from '@/utils/stockOption'
import http from '@/api/http'

const { message } = createDiscreteApi(['message', 'dialog'])
const tableRef = ref<InstanceType<typeof QueryTable> | null>(null)
const showModal = ref(false)
const saving = ref(false)
// 两类库存源：可用库存（默认过滤 qty_available>0）与已冻结库存（sqlTitle=frozen）
// 冻结后 avail=0 会从默认查询消失，解冻弹窗必须查 frozen（与上游 commoditySqlTitle 同机制）
const availStocks = ref<any[]>([])
const frozenStocks = ref<any[]>([])
const stockOptions = ref<Array<{ label: string; value: number }>>([])

// StockfreezeViewModel 字段：job_code/job_type(bool:true冻结,false解冻)/sku_id/goods_owner_id/
// goods_location_id/series_number/warehouse_name/location_name/spu_code/spu_name/sku_code/handler/handle_time
//（原 sku_name/goods_location_name/qty/is_freeze/reason/creator 均不存在）
const form = reactive({ job_type: true, stock_id: null as number | null })

// QueryTable 数据源（勿删：QueryTable props.fetch 必需，缺失会导致表格无法加载）
const fetch = (b: any) => stockfreezeApi.list(b)

const picked = computed(() => {
  const pool = form.job_type ? availStocks.value : frozenStocks.value
  return pool.find((s) => s.id === form.stock_id) || null
})

// 按当前作业类型切换库存池：冻结→可用库存；解冻→已冻结库存
watch(() => form.job_type, () => { form.stock_id = null; refreshOptions() })

function refreshOptions() {
  const pool = form.job_type ? availStocks.value : frozenStocks.value
  stockOptions.value = sortStockRows(pool).map((s) => ({
    label: stockOptionLabel(s),
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

async function openCreate(jobType: boolean) {
  form.job_type = jobType
  form.stock_id = null
  // 打开弹窗时重拉两池：冻结/解冻会即时改变 is_freeze 归属，
  // onMounted 的一次性快照会让「冻结完立刻解冻」选不到目标库存
  try {
    const [avail, frozen] = await Promise.all([
      http.post('/stock/select', { pageIndex: 1, pageSize: 2000, sqlTitle: '', searchValue: '' }),
      http.post('/stock/select', { pageIndex: 1, pageSize: 2000, sqlTitle: 'frozen', searchValue: '' })
    ])
    availStocks.value = (avail.data?.data?.rows as any[]) || []
    frozenStocks.value = (frozen.data?.data?.rows as any[]) || []
  } catch { /* 沿用旧池 */ }
  refreshOptions()
  showModal.value = true
}

async function save() {
  if (!form.stock_id) { message.error('请选择库存'); return }
  const pool = form.job_type ? availStocks.value : frozenStocks.value
  const s = pool.find((t) => t.id === form.stock_id)
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
    // 两类查询：默认 sqlTitle 过滤 qty_available>0（可冻结的）；sqlTitle=frozen 拿已冻结的（解冻用）
    const [avail, frozen] = await Promise.all([
      http.post('/stock/select', { pageIndex: 1, pageSize: 2000, sqlTitle: '', searchValue: '' }),
      http.post('/stock/select', { pageIndex: 1, pageSize: 2000, sqlTitle: 'frozen', searchValue: '' })
    ])
    availStocks.value = (avail.data?.data?.rows as any[]) || []
    frozenStocks.value = (frozen.data?.data?.rows as any[]) || []
    refreshOptions()
  } catch { /* 非阻塞 */ }
})
</script>
