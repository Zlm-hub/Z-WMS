import axios from 'axios'

const http = axios.create({ baseURL: '/api', timeout: 10000 })

http.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

export const api = {
  async register(username: string, password: string) {
    return (await http.post('/auth/register', { username, password })).data
  },
  async login(username: string, password: string) {
    const r = (await http.post('/auth/login', { username, password })).data
    localStorage.setItem('token', r.token)
    return r
  },
  logout() {
    localStorage.removeItem('token')
  },
  async skus() {
    return (await http.get('/master/skus')).data
  },
  async locations() {
    return (await http.get('/master/locations')).data
  },
  async stock() {
    return (await http.get('/stock')).data
  },
  async adjust(skuId: number, locationId: number, qty: number) {
    return (await http.post('/stock/adjust', { skuId, locationId, qty })).data
  },
  async createInbound(supplier: string, items: { skuId: number; qty: number }[]) {
    return (await http.post('/inbound', { supplier, items })).data
  },
  async confirmInbound(id: number) {
    return (await http.post(`/inbound/${id}/confirm`)).data
  },
  async createOutbound(customer: string, items: { skuId: number; qty: number }[]) {
    return (await http.post('/outbound', { customer, items })).data
  },
  async confirmOutbound(id: number) {
    return (await http.post(`/outbound/${id}/confirm`)).data
  },
  async pickOutbound(id: number) {
    return (await http.post(`/outbound/${id}/pick`)).data
  }
}
