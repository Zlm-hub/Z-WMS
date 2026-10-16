<template>
  <n-card :bordered="false" class="page-card">
    <div class="toolbar">
      <n-space>
        <n-input v-model:value="search" placeholder="商品名称/编码" clearable style="width: 220px" @keyup.enter="reload(1)" @clear="reload(1)" />
        <n-button type="primary" secondary @click="reload(1)">查询</n-button>
      </n-space>
      <n-button type="primary" @click="openCreate">+ 新增商品</n-button>
    </div>

    <n-data-table
      remote
      :columns="columns"
      :data="rows"
      :loading="loading"
      :pagination="pagination"
      :row-key="(r: any) => r.id"
      :scroll-x="1000"
      size="small"
      style="margin-top: 12px"
    />

    <!-- 新增/编辑：SPU 主信息 + SKU 明细 -->
    <n-modal v-model:show="showModal" :title="editing ? '编辑商品' : '新增商品'" preset="card" style="width: 780px" :mask-closable="false">
      <n-form label-placement="left" label-width="90">
        <n-grid :cols="2" :x-gap="12">
          <n-form-item label="商品编码" required><n-input v-model:value="form.spu_code" :disabled="editing" /></n-form-item>
          <n-form-item label="商品名称" required><n-input v-model:value="form.spu_name" /></n-form-item>
          <n-form-item label="商品类别" required>
            <n-select v-model:value="form.category_id" :options="categoryOptions" @update:value="onCategoryChange" />
          </n-form-item>
          <n-form-item label="供应商">
            <n-select v-model:value="form.supplier_id" :options="supplierOptions" clearable />
          </n-form-item>
          <n-form-item label="品牌"><n-input v-model:value="form.brand" /></n-form-item>
          <n-form-item label="产地"><n-input v-model:value="form.origin" /></n-form-item>
          <n-form-item label="描述" span="2"><n-input v-model:value="form.spu_description" type="textarea" :rows="2" /></n-form-item>
        </n-grid>

        <n-divider title-placement="left">SKU 规格明细</n-divider>
        <n-space vertical>
          <n-card v-for="(d, i) in form.detailList" :key="i" size="small" :title="`规格 ${i + 1}`">
            <template #header-extra>
              <n-button v-if="form.detailList.length > 1" quaternary type="error" size="small" @click="form.detailList.splice(i, 1)">移除</n-button>
            </template>
            <n-grid :cols="3" :x-gap="10">
              <n-form-item label="规格编码" required><n-input v-model:value="d.sku_code" :disabled="editing" /></n-form-item>
              <n-form-item label="规格名称" required><n-input v-model:value="d.sku_name" /></n-form-item>
              <n-form-item label="条码"><n-input v-model:value="d.bar_code" /></n-form-item>
              <n-form-item label="长(mm)"><n-input-number v-model:value="d.lenght" style="width: 100%" /></n-form-item>
              <n-form-item label="宽(mm)"><n-input-number v-model:value="d.width" style="width: 100%" /></n-form-item>
              <n-form-item label="高(mm)"><n-input-number v-model:value="d.height" style="width: 100%" /></n-form-item>
              <n-form-item label="重量(g)"><n-input-number v-model:value="d.weight" style="width: 100%" /></n-form-item>
              <n-form-item label="成本价"><n-input-number v-model:value="d.cost" :precision="2" style="width: 100%" /></n-form-item>
              <n-form-item label="销售价"><n-input-number v-model:value="d.price" :precision="2" style="width: 100%" /></n-form-item>
              <n-form-item label="保质期(天)"><n-input-number v-model:value="d.expiry_date" style="width: 100%" /></n-form-item>
            </n-grid>
          </n-card>
          <n-button dashed block @click="addDetail">+ 添加规格</n-button>
        </n-space>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showModal = false">取消</n-button>
          <n-button type="primary" :loading="saving" @click="save">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </n-card>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from 'vue'
import {
  NCard, NDataTable, NButton, NInput, NInputNumber, NSelect, NModal, NForm, NFormItem,
  NGrid, NFormItemGi, NSpace, NDivider, createDiscreteApi, type DataTableColumns, type PaginationProps
} from 'naive-ui'
import { pageSearch, spuApi, selectApi } from '@/api'

const { message, dialog } = createDiscreteApi(['message', 'dialog'])

const loading = ref(false)
const rows = ref<any[]>([])
const total = ref(0)
const pageIndex = ref(1)
const search = ref('')
const categoryOptions = ref<Array<{ label: string; value: number }>>([])
const supplierOptions = ref<Array<{ label: string; value: number }>>([])

const pagination = computed<PaginationProps>(() => ({
  page: pageIndex.value,
  pageSize: 20,
  itemCount: total.value,
  onChange: (p: number) => reload(p)
}))

const columns: DataTableColumns = [
  { title: '商品编码', key: 'spu_code' },
  { title: '商品名称', key: 'spu_name' },
  { title: '类别', key: 'category_name' },
  { title: '供应商', key: 'supplier_name' },
  { title: '品牌', key: 'brand' },
  { title: '产地', key: 'origin' },
  { title: '创建人', key: 'creator' },
  {
    title: '操作', key: '__act', width: 130, fixed: 'right',
    render(row: any) {
      return h(NSpace, { size: 8 }, {
        default: () => [
          h(NButton, { size: 'small', quaternary: true, type: 'primary', onClick: () => openEdit(row) }, { default: () => '编辑' }),
          h(NButton, { size: 'small', quaternary: true, type: 'error', onClick: () => del(row) }, { default: () => '删除' })
        ]
      })
    }
  }
]

async function reload(page = pageIndex.value) {
  pageIndex.value = page
  loading.value = true
  try {
    const data = await spuApi.list(pageSearch({ pageIndex: page, pageSize: 20, searchValue: search.value }))
    rows.value = (data.rows as any[]) || []
    total.value = (data.total as number) || rows.value.length
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

const showModal = ref(false)
const editing = ref(false)
const saving = ref(false)
const editId = ref(0)

const blankDetail = () => ({
  id: 0, sku_code: '', sku_name: '', bar_code: '',
  lenght: 0, width: 0, height: 0, weight: 0, volume: 0,
  cost: 0, price: 0, expiry_date: 0
})

const form = reactive<any>({
  spu_code: '', spu_name: '', category_id: null, category_name: '',
  supplier_id: null, supplier_name: '', brand: '', origin: '', spu_description: '',
  detailList: [blankDetail()]
})

function addDetail() { form.detailList.push(blankDetail()) }

function onCategoryChange(v: number) {
  const c = categoryOptions.value.find((o) => o.value === v)
  form.category_name = c?.label || ''
}

function openCreate() {
  editing.value = false
  Object.assign(form, {
    id: 0, spu_code: '', spu_name: '', category_id: null, category_name: '',
    supplier_id: null, supplier_name: '', brand: '', origin: '', spu_description: '',
    detailList: [blankDetail()]
  })
  showModal.value = true
}

async function openEdit(row: any) {
  try {
    const full = await spuApi.get(row.id)
    editing.value = true
    editId.value = row.id
    Object.assign(form, {
      ...full,
      detailList: (full.detailList || []).map((d: any) => ({ ...d }))
    })
    showModal.value = true
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载商品失败')
  }
}

async function save() {
  if (!form.spu_code || !form.spu_name || !form.category_id) {
    message.error('商品编码/名称/类别必填')
    return
  }
  if (!form.detailList.length || form.detailList.some((d: any) => !d.sku_code || !d.sku_name)) {
    message.error('每个规格的编码/名称必填')
    return
  }
  saving.value = true
  try {
    const payload = {
      ...form,
      id: editing.value ? editId.value : 0,
      supplier_name: supplierOptions.value.find((s) => s.value === form.supplier_id)?.label || ''
    }
    if (editing.value) {
      await spuApi.update(payload)
    } else {
      await spuApi.create(payload)
    }
    message.success('保存成功')
    showModal.value = false
    reload(1)
  } catch (e) {
    message.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}

function del(row: any) {
  dialog.warning({
    title: '删除确认',
    content: `确定删除商品「${row.spu_name}」及其全部规格？`,
    positiveText: '删除', negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await spuApi.remove(row.id)
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
    const cats = await selectApi.categories()
    categoryOptions.value = cats.map((c: any) => ({ label: c.category_name, value: c.id }))
    const sups = await selectApi.suppliers()
    supplierOptions.value = sups.map((s: any) => ({ label: s.supplier_name, value: s.id }))
  } catch { /* 下拉为空不阻塞 */ }
})
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
</style>
