/**
 * axios 封装：ResultModel 统一解包 + JWT + 401 自动刷新重放
 * 后端契约：{ isSuccess, code, errorMessage, data }
 */
import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth'

// API 基址解析优先级（与原版一致，前端直连后端端口）：
//   1. 运行时注入 window.__WMS_API__（容器 entrypoint 渲染 public/config.js，支持各数据库档端口不同）
//   2. 构建时 VITE_API_BASE（本地开发覆盖，如 http://localhost:20011）
//   3. 默认回退：当前域名 + 20011（SQLite 档兼容）
function resolveBaseURL(): string {
  const runtimeApi = (window as unknown as { __WMS_API__?: string }).__WMS_API__
  if (runtimeApi) return runtimeApi
  if (import.meta.env.VITE_API_BASE) return import.meta.env.VITE_API_BASE as string
  return `${window.location.protocol}//${window.location.hostname}:20011`
}

const http = axios.create({ baseURL: resolveBaseURL(), timeout: 30000 })

export interface ResultModel<T = unknown> {
  isSuccess: boolean
  code: number
  errorMessage: string
  data: T
}

// ---- 请求拦截：附 JWT ----
http.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`
  }
  return config
})

// ---- 响应拦截：401 时用 refresh_token 换新后重放 ----
let refreshing: Promise<string | null> | null = null

async function tryRefresh(): Promise<string | null> {
  const auth = useAuthStore()
  if (!auth.refreshToken) return null
  try {
    const resp = await axios.post<ResultModel<string>>(
      `${http.defaults.baseURL}/refresh-token`,
      { refresh_token: auth.refreshToken }
    )
    if (resp.data.isSuccess && resp.data.data) {
      auth.setAccessToken(resp.data.data)
      return resp.data.data
    }
  } catch {
    /* ignore */
  }
  return null
}

http.interceptors.response.use(
  (resp) => resp,
  async (error: AxiosError<ResultModel>) => {
    const auth = useAuthStore()
    const original = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined
    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true
      refreshing = refreshing || tryRefresh()
      const newToken = await refreshing
      refreshing = null
      if (newToken) {
        original.headers = { ...(original.headers || {}), Authorization: `Bearer ${newToken}` }
        return http.request(original)
      }
      auth.logout()
      if (!location.hash.includes('/login')) {
        location.hash = '#/login'
      }
    }
    return Promise.reject(error)
  }
)

/** 通用请求：解包 ResultModel，失败时抛出后端 errorMessage */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const resp = await http.request<ResultModel<T>>(config)
    const body = resp.data
    if (!body || body.isSuccess === false) {
      throw new Error(body?.errorMessage || '请求失败')
    }
    return body.data as T
  } catch (e) {
    const msg = e instanceof Error ? e.message : '网络错误'
    const axiosErr = e as AxiosError<ResultModel>
    if (axiosErr.response?.data?.errorMessage && axiosErr.response.data.isSuccess === false) {
      throw new Error(axiosErr.response.data.errorMessage)
    }
    throw new Error(msg)
  }
}

export default http
