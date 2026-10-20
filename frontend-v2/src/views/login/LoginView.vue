<template>
  <div class="login-page">
    <div class="login-card">
      <div class="brand">
        <div class="brand-badge">W</div>
        <div>
          <div class="brand-title">ModernWMS</div>
          <div class="brand-sub">仓库管理系统 · 控制台</div>
        </div>
      </div>

      <n-form ref="formRef" :model="form" :rules="rules" size="large" :show-label="false">
        <n-form-item path="user_name">
          <n-input v-model:value="form.user_name" placeholder="用户名" @keydown.enter="submit" />
        </n-form-item>
        <n-form-item path="password">
          <n-input v-model:value="form.password" type="password" show-password-on="click" placeholder="密码" @keydown.enter="submit" />
        </n-form-item>
        <n-button type="primary" block size="large" :loading="loading" @click="submit">登 录</n-button>
      </n-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NForm, NFormItem, NInput, NButton, createDiscreteApi, type FormInst, type FormRules } from 'naive-ui'
import { request } from '@/api/http'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const { message } = createDiscreteApi(['message'])

const formRef = ref<FormInst | null>(null)
const loading = ref(false)
const form = reactive({ user_name: 'admin', password: '' })
const rules: FormRules = {
  user_name: { required: true, message: '请输入用户名', trigger: 'blur' },
  password: { required: true, message: '请输入密码', trigger: 'blur' }
}

interface LoginOutput {
  access_token: string
  refresh_token: string
  user_name: string
  user_num: string
  user_role: string
  tenant_id: number
}

async function submit() {
  await formRef.value?.validate()
  loading.value = true
  try {
    const data = await request<LoginOutput>({ url: '/login', method: 'POST', data: { ...form } })
    auth.setLogin(data, { user_id: data.user_id, user_name: data.user_name, user_num: data.user_num, user_role: data.user_role, tenant_id: data.tenant_id })
    message.success('欢迎回来')
    router.push('/home')
  } catch (e) {
    message.error(e instanceof Error ? e.message : '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #eef2ff 0%, #f5f6f8 45%, #e0e9fb 100%);
}
.login-card {
  width: 380px;
  background: #fff;
  border-radius: 12px;
  padding: 40px 36px 32px;
  box-shadow: 0 8px 32px rgba(30, 41, 59, 0.08);
}
.brand { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
.brand-badge {
  width: 44px; height: 44px; border-radius: 10px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #fff; font-size: 22px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.brand-title { font-size: 20px; font-weight: 700; color: #1f2329; }
.brand-sub { font-size: 12px; color: #86909c; margin-top: 2px; }
</style>
