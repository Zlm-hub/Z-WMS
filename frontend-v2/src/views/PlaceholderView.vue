<template>
  <n-result status="404" title="页面施工中" :description="`「${title}」页面尚未迁移完成`">
    <template #footer>
      <n-button type="primary" @click="$router.push('/home')">返回工作台</n-button>
    </template>
  </n-result>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { NResult, NButton } from 'naive-ui'

const route = useRoute()
const title = computed(() => (route.meta?.title as string) || '该页面')
</script>
