<template>
  <n-card :bordered="false" class="page-card">
    <n-tabs type="line" animated>
      <!-- 仓库 -->
      <n-tab-pane name="warehouse" tab="仓库">
        <CrudTable
          :api="{
            list: warehouseApi.list,
            create: warehouseApi.create,
            update: warehouseApi.update,
            remove: warehouseApi.remove
          }"
          :columns="whColumns"
          :fields="whFields"
          search-placeholder="仓库名称"
        />
      </n-tab-pane>
      <!-- 库区 -->
      <n-tab-pane name="area" tab="库区">
        <CrudTable
          :api="{
            list: areaApi.list,
            create: areaApi.create,
            update: areaApi.update,
            remove: areaApi.remove
          }"
          :columns="areaColumns"
          :fields="areaFields"
          search-placeholder="库区名称"
        />
      </n-tab-pane>
      <!-- 库位 -->
      <n-tab-pane name="location" tab="库位">
        <CrudTable
          :api="{
            list: locationApi.list,
            create: locationApi.create,
            update: locationApi.update,
            remove: locationApi.remove
          }"
          :columns="locColumns"
          :fields="locFields"
          search-placeholder="库位名称"
        />
      </n-tab-pane>
    </n-tabs>
  </n-card>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import { NCard, NTabs, NTabPane } from 'naive-ui'
import CrudTable from '@/components/CrudPage.vue'
import { warehouseApi, areaApi, locationApi, selectApi } from '@/api'

const warehouseOptions = ref<Array<{ label: string; value: number }>>([])
const areaOptions = ref<Array<{ label: string; value: number }>>([])

// 库区属性：后端 area_property 为字节，取值与原版前端 AreaProperty 枚举一致（1-6）
const AREA_PROPERTY_OPTIONS = [
  { label: '拣货区', value: 1 },
  { label: '存储区', value: 2 },
  { label: '收货区', value: 3 },
  { label: '退货区', value: 4 },
  { label: '不良品区', value: 5 },
  { label: '盘点区', value: 6 }
]
const AREA_PROPERTY_LABELS: Record<number, string> = {
  1: '拣货区', 2: '存储区', 3: '收货区', 4: '退货区', 5: '不良品区', 6: '盘点区'
}

onMounted(async () => {
  try {
    const ws = await selectApi.warehouses()
    // /warehouse/select-item 返回 FormSelectItem {code,comments,name,value}，名称字段是 name
    warehouseOptions.value = ws.map((w: any) => ({ label: w.name, value: w.id }))
  } catch {
    warehouseOptions.value = []
  }
})

async function refreshAreas(warehouseId: number | null) {
  if (!warehouseId) { areaOptions.value = []; return }
  try {
    const as = await selectApi.areasByWarehouse(warehouseId)
    // /warehousearea/areas-by-warehouse_id 同样返回 FormSelectItem，名称字段是 name
    areaOptions.value = as.map((a: any) => ({ label: a.name, value: a.id }))
  } catch {
    areaOptions.value = []
  }
}

const whColumns = [
  { title: '仓库名称', key: 'warehouse_name' },
  { title: '城市', key: 'city' },
  { title: '地址', key: 'address', ellipsis: { tooltip: true } },
  { title: '负责人', key: 'manager' },
  { title: '联系电话', key: 'contact_tel' }
]
const whFields = [
  { key: 'warehouse_name', label: '仓库名称', required: true },
  { key: 'city', label: '城市' },
  { key: 'address', label: '地址', span: 2 },
  { key: 'manager', label: '负责人' },
  { key: 'contact_tel', label: '联系电话' },
  { key: 'email', label: '邮箱' }
]

// 库区层字段以后端 WarehouseareaViewModel 契约为准：
// warehouse_id/warehouse_name/area_name/area_property（原 warehouse_area_name/warehouse_area_property/describe 后端不存在）
const areaColumns = [
  { title: '所属仓库', key: 'warehouse_name' },
  { title: '库区名称', key: 'area_name' },
  {
    title: '库区属性',
    key: 'area_property',
    render: (r: any) => AREA_PROPERTY_LABELS[r.area_property] || '-'
  }
]
const areaFields = computed(() => [
  { key: 'warehouse_id', label: '所属仓库', type: 'select' as const, required: true, options: warehouseOptions.value },
  { key: 'warehouse_name', label: '仓库名称', required: true },
  { key: 'area_name', label: '库区名称', required: true },
  { key: 'area_property', label: '库区属性', type: 'select' as const, options: AREA_PROPERTY_OPTIONS }
])

const locColumns = [
  { title: '仓库', key: 'warehouse_name' },
  { title: '库区', key: 'warehouse_area_name' },
  { title: '库位名称', key: 'location_name' },
  { title: '长', key: 'location_length' },
  { title: '宽', key: 'location_width' },
  { title: '高', key: 'location_heigth' },
  { title: '巷道号', key: 'roadway_number' },
  { title: '货架号', key: 'shelf_number' },
  { title: '层号', key: 'layer_number' },
  { title: '标签号', key: 'tag_number' }
]
const locFields = computed(() => [
  { key: 'warehouse_id', label: '仓库', type: 'select' as const, required: true, options: warehouseOptions.value },
  { key: 'warehouse_area_id', label: '库区', type: 'select' as const, required: true, options: areaOptions.value },
  { key: 'warehouse_name', label: '仓库名称' },
  { key: 'warehouse_area_name', label: '库区名称' },
  { key: 'location_name', label: '库位名称', required: true },
  { key: 'location_length', label: '长(mm)', type: 'number' as const, defaultValue: 0 },
  { key: 'location_width', label: '宽(mm)', type: 'number' as const, defaultValue: 0 },
  { key: 'location_heigth', label: '高(mm)', type: 'number' as const, defaultValue: 0 },
  { key: 'location_volume', label: '体积', type: 'number' as const, defaultValue: 0 },
  { key: 'location_load', label: '承重', type: 'number' as const, defaultValue: 0 },
  { key: 'roadway_number', label: '巷道号' },
  { key: 'shelf_number', label: '货架号' },
  { key: 'layer_number', label: '层号' },
  { key: 'tag_number', label: '标签号' }
])
</script>
