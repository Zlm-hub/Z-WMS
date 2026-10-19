<template>
  <div class="crud-page">
    <n-card :bordered="false" class="page-card">
      <!-- 工具栏 -->
      <div class="toolbar">
        <n-space align="center">
          <n-input
            v-model:value="searchValue"
            :placeholder="searchPlaceholder"
            clearable
            style="width: 240px"
            @keyup.enter="reload(1)"
            @clear="reload(1)"
          />
          <n-button type="primary" secondary @click="reload(1)">查询</n-button>
        </n-space>
        <n-space>
          <slot name="toolbar-extra" />
          <n-button type="primary" @click="openCreate">+ 新增</n-button>
        </n-space>
      </div>

      <!-- 表格 -->
      <n-data-table
        remote
        :columns="tableColumns"
        :data="rows"
        :loading="loading"
        :pagination="pagination"
        :row-key="(r: any) => r.id"
        :scroll-x="1200"
        size="small"
        style="margin-top: 12px"
      />
    </n-card>

    <!-- 新增/编辑弹窗 -->
    <n-modal
      v-model:show="showModal"
      :title="editing ? '编辑' : '新增'"
      preset="card"
      style="width: 640px"
      :mask-closable="false"
    >
      <n-form ref="formRef" :model="formModel" :rules="formRules" label-placement="left" label-width="110">
        <n-grid :cols="2" :x-gap="12">
          <n-form-item-gi v-for="f in fields" :key="f.key" :span="f.span || 1" :path="f.key" :label="f.label">
            <n-input
              v-if="!f.type || f.type === 'text'"
              v-model:value="formModel[f.key]"
              :placeholder="'请输入' + f.label"
              :disabled="f.disabled"
            />
            <n-input-number
              v-else-if="f.type === 'number'"
              v-model:value="formModel[f.key]"
              style="width: 100%"
              :disabled="f.disabled"
            />
            <n-switch v-else-if="f.type === 'switch'" v-model:value="formModel[f.key]" />
            <n-select
              v-else-if="f.type === 'select'"
              v-model:value="formModel[f.key]"
              :options="f.options || []"
              :placeholder="'请选择' + f.label"
              clearable
              filterable
            />
            <n-input
              v-else-if="f.type === 'textarea'"
              v-model:value="formModel[f.key]"
              type="textarea"
              :rows="2"
              :placeholder="'请输入' + f.label"
            />
            <n-input
              v-else-if="f.type === 'password'"
              v-model:value="formModel[f.key]"
              type="password"
              show-password-on="click"
              :placeholder="f.placeholder || '请输入' + f.label"
              :disabled="f.disabled"
            />
          </n-form-item-gi>
        </n-grid>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showModal = false">取消</n-button>
          <n-button type="primary" :loading="saving" @click="save">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref } from 'vue'
import {
  NCard, NDataTable, NButton, NInput, NInputNumber, NSwitch, NSelect, NModal, NForm,
  NFormItem, NFormItemGi, NGrid, NSpace, NSwitch as NSwitch2, createDiscreteApi, type DataTableColumns, type FormInst, type FormRules, type PaginationProps
} from 'naive-ui'
import { pageSearch, type PageSearch } from '@/api'

export interface CrudApi {
  list?: (b: PageSearch) => Promise<{ rows?: any[]; total?: number }>
  all?: () => Promise<any[]>
  get?: (id: number) => Promise<any>
  create: (d: any) => Promise<any>
  update: (d: any) => Promise<any>
  remove?: (id: number) => Promise<unknown>
}

export interface FieldDef {
  key: string
  label: string
  type?: 'text' | 'number' | 'switch' | 'select' | 'textarea' | 'password'
  options?: Array<{ label: string; value: any }>
  required?: boolean
  disabled?: boolean
  span?: number
  placeholder?: string
  defaultValue?: unknown
}

const props = defineProps<{
  api: CrudApi
  columns: DataTableColumns
  fields: FieldDef[]
  searchPlaceholder?: string
  rowToForm?: (row: any) => Record<string, unknown>
  canDelete?: boolean
}>()

const { message, dialog } = createDiscreteApi(['message', 'dialog'])

const loading = ref(false)
const rows = ref<any[]>([])
const total = ref(0)
const pageIndex = ref(1)
const pageSize = ref(20)
const searchValue = ref('')

const pagination = computed<PaginationProps>(() => ({
  page: pageIndex.value,
  pageSize: pageSize.value,
  itemCount: total.value,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  onChange: (p: number) => reload(p),
  onUpdatePageSize: (s: number) => { pageSize.value = s; reload(1) }
}))

async function reload(page = pageIndex.value) {
  pageIndex.value = page
  if (!props.api.list) return
  loading.value = true
  try {
    const data = await props.api.list(pageSearch({ pageIndex: page, pageSize: pageSize.value, searchValue: searchValue.value }))
    rows.value = data.rows || []
    total.value = (data.total as number) || rows.value.length
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

// ---- 弹窗表单 ----
const showModal = ref(false)
const editing = ref(false)
const saving = ref(false)
const formRef = ref<FormInst | null>(null)
const formModel = reactive<Record<string, unknown>>({})

const formRules = computed<FormRules>(() => {
  const rules: FormRules = {}
  for (const f of props.fields) {
    if (f.required) rules[f.key] = { required: true, message: `${f.label}必填`, trigger: 'blur', type: f.type === 'number' || f.type === 'select' ? 'any' : 'string' }
  }
  return rules
})

function openCreate() {
  editing.value = false
  Object.keys(formModel).forEach((k) => delete formModel[k])
  for (const f of props.fields) {
    formModel[f.key] = f.defaultValue !== undefined ? f.defaultValue : f.type === 'switch' ? true : f.type === 'number' ? 0 : ''
  }
  showModal.value = true
}

function openEdit(row: any) {
  editing.value = true
  Object.keys(formModel).forEach((k) => delete formModel[k])
  const data = props.rowToForm ? props.rowToForm(row) : row
  for (const f of props.fields) {
    formModel[f.key] = data[f.key] ?? (f.type === 'switch' ? false : f.type === 'number' ? 0 : '')
  }
  // id 不在 fields 声明里，但更新必须带上主键，否则后端无法定位记录
  if (data?.id !== undefined) formModel.id = data.id
  showModal.value = true
}

async function save() {
  await formRef.value?.validate()
  saving.value = true
  try {
    if (editing.value) {
      await props.api.update({ ...formModel })
      message.success('保存成功')
    } else {
      await props.api.create({ ...formModel })
      message.success('新增成功')
    }
    showModal.value = false
    reload()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}

function confirmDelete(row: any) {
  if (!props.api.remove) return
  dialog.warning({
    title: '删除确认',
    content: `确定删除该条记录吗？（id=${row.id}）`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await props.api.remove!(row.id)
        message.success('已删除')
        reload()
      } catch (e) {
        message.error(e instanceof Error ? e.message : '删除失败')
      }
    }
  })
}

const tableColumns = computed<DataTableColumns>(() => [
  ...(props.columns as DataTableColumns),
  {
    title: '操作',
    key: '__actions',
    width: 130,
    fixed: 'right',
    render(row: any) {
      return h(NSpace, { size: 8 }, {
        default: () => [
          h(NButton, { size: 'small', quaternary: true, type: 'primary', onClick: () => openEdit(row) }, { default: () => '编辑' }),
          props.api.remove
            ? h(NButton, { size: 'small', quaternary: true, type: 'error', onClick: () => confirmDelete(row) }, { default: () => '删除' })
            : null
        ]
      })
    }
  }
])

defineExpose({ reload })
onMounted(() => reload(1))
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
</style>
