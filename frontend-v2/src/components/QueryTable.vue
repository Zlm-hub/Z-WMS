<template>
  <div class="crud-page">
    <n-card :bordered="false" class="page-card">
      <div class="toolbar">
        <n-space>
          <n-input v-model:value="search" :placeholder="placeholder" clearable style="width: 220px" @keyup.enter="reload(1)" @clear="reload(1)" />
          <n-button type="primary" secondary @click="reload(1)">查询</n-button>
        </n-space>
        <slot name="toolbar-extra" />
      </div>
      <n-data-table
        remote
        :columns="columns"
        :data="rows"
        :loading="loading"
        :pagination="pagination"
        :row-key="(r: any) => r.id"
        :scroll-x="1100"
        size="small"
        style="margin-top: 12px"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, type PropType } from 'vue'
import { NCard, NDataTable, NInput, NButton, NSpace, createDiscreteApi, type DataTableColumns, type PaginationProps } from 'naive-ui'
import { pageSearch, type PageData } from '@/api'

const props = defineProps({
  fetch: { type: Function as PropType<(b: any) => Promise<PageData<any>>>, required: true },
  columns: { type: Array as PropType<DataTableColumns>, required: true },
  placeholder: { type: String, default: '关键词' }
})

const { message } = createDiscreteApi(['message'])
const loading = ref(false)
const rows = ref<any[]>([])
const total = ref(0)
const pageIndex = ref(1)
const pageSize = ref(20)
const search = ref('')

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
  loading.value = true
  try {
    const data = await props.fetch(pageSearch({ pageIndex: page, pageSize: pageSize.value, searchValue: search.value }))
    rows.value = data.rows || []
    total.value = (data.total as number) || rows.value.length
  } catch (e) {
    message.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

defineExpose({ reload })
onMounted(() => reload(1))
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
</style>
