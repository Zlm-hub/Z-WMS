/**
 * API 模块：与后端 Controller 一一对应（完整清单见 API_REFERENCE.md）
 * 所有函数返回解包后的 data（ResultModel.data）
 */
import { request } from './http'

export interface PageSearch {
  pageIndex?: number
  pageSize?: number
  sqlTitle?: string
  searchValue?: string
}
export interface PageData<T> {
  rows?: T[]
  total?: number
  pageIndex?: number
  pageSize?: number
  [k: string]: unknown
}

export const pageSearch = (extra: Record<string, unknown> = {}): PageSearch => ({
  pageIndex: 1,
  pageSize: 20,
  sqlTitle: '',
  searchValue: '',
  ...extra
})

// ---------- CRUD 通用 ----------
export const list = <T,>(path: string, body: PageSearch) =>
  request<PageData<T>>({ url: path, method: 'POST', data: body })
export const getOne = <T,>(path: string, id: number) =>
  request<T>({ url: path, method: 'GET', params: { id } })
export const create = <T,>(path: string, data: unknown) =>
  request<T>({ url: path, method: 'POST', data })
export const update = <T,>(path: string, data: unknown) =>
  request<T>({ url: path, method: 'PUT', data })
export const remove = (path: string, id: number) =>
  request<string>({ url: path, method: 'DELETE', params: { id } })

/**
 * 后端只有 /all（全量、无分页）的模块：包装成 CrudPage 需要的 { rows, total }
 * userrole / category 等控制器未提供 list 分页接口（与原版一致，前端侧适配）
 */
export const listFromAll = <T,>(path: string, nameKey: string) =>
  async (b: PageSearch = {}): Promise<PageData<T>> => {
    const all = await request<T[]>({ url: path, method: 'GET' })
    const kw = (b.searchValue || '').trim().toLowerCase()
    const rows = kw
      ? all.filter((r) => String((r as Record<string, unknown>)[nameKey] ?? '').toLowerCase().includes(kw))
      : all
    return { rows, total: rows.length }
  }

// ---------- 认证 ----------
export const authApi = {
  login: (user_name: string, password: string) =>
    request<Record<string, unknown>>({ url: '/login', method: 'POST', data: { user_name, password } })
}

// ---------- 下拉数据 ----------
export const selectApi = {
  users: () => request<Array<{ id: number; user_name: string }>>({ url: '/user/select-item', method: 'GET' }),
  warehouses: () => request<Array<{ id: number; warehouse_name: string }>>({ url: '/warehouse/select-item', method: 'GET' }),
  areasByWarehouse: (warehouse_id: number) =>
    request<Array<{ id: number; warehouse_area_name: string }>>({ url: '/warehousearea/areas-by-warehouse_id', method: 'GET', params: { warehouse_id } }),
  locationsByArea: (warehouse_area_id: number) =>
    request<Array<{ id: number; location_name: string }>>({ url: '/goodslocation/location-by-warehouseare_id', method: 'GET', params: { warehouse_area_id } }),
  owners: () => request<Array<{ id: number; goods_owner_name: string }>>({ url: '/goodsowner/all', method: 'GET' }),
  suppliers: () => request<Array<{ id: number; supplier_name: string }>>({ url: '/supplier/all', method: 'GET' }),
  customers: () => request<Array<{ id: number; customer_name: string }>>({ url: '/customer/all', method: 'GET' }),
  categories: () => request<Array<{ id: number; category_name: string }>>({ url: '/category/all', method: 'GET' }),
  companies: () => request<Array<{ id: number; company_name: string }>>({ url: '/company/all', method: 'GET' }),
  userroles: () => request<Array<{ id: number; role_name: string }>>({ url: '/userrole/all', method: 'GET' }),
  freights: () => request<Array<{ id: number; freight_name: string }>>({ url: '/freightfee/all', method: 'GET' })
}

// ---------- 菜单 / 权限 ----------
export const menuApi = {
  menus: () => request<Array<Record<string, unknown>>>({ url: '/rolemenu/menus', method: 'GET' }),
  all: () => request<Array<Record<string, unknown>>>({ url: '/rolemenu/all', method: 'GET' }),
  authority: () => request<Record<string, unknown>>({ url: '/rolemenu/authority', method: 'GET' }),
  get: (userrole_id: number) => request<Record<string, unknown>>({ url: '/rolemenu', method: 'GET', params: { userrole_id } }),
  save: (data: unknown) => request<unknown>({ url: '/rolemenu', method: 'POST', data })
}

// ---------- 商品 ----------
export const spuApi = {
  list: (b: PageSearch) => list<Record<string, unknown>>('/spu/list', b),
  get: (id: number) => getOne<Record<string, unknown>>('/spu', id),
  sku: (sku_id: number) => getOne<Record<string, unknown>>('/spu/sku', 0) && request<Record<string, unknown>>({ url: '/spu/sku', method: 'GET', params: { sku_id } }),
  create: (d: unknown) => create<number>('/spu', d),
  update: (d: unknown) => update<unknown>('/spu', d),
  remove: (id: number) => remove('/spu', id),
  saveSafetyStock: (d: unknown) => update<unknown>('/spu/sku-safety-stock', d)
}
export const categoryApi = {
  list: listFromAll<Record<string, unknown>>('/category/all', 'category_name'),
  all: () => request<Array<Record<string, unknown>>>({ url: '/category/all', method: 'GET' }),
  get: (id: number) => getOne<Record<string, unknown>>('/category', id),
  create: (d: unknown) => create<number>('/category', d),
  update: (d: unknown) => update<unknown>('/category', d),
  remove: (id: number) => remove('/category', id)
}

// ---------- 基础资料 ----------
export const companyApi = {
  all: () => request<Array<Record<string, unknown>>>({ url: '/company/all', method: 'GET' }),
  get: (id: number) => getOne<Record<string, unknown>>('/company', id),
  create: (d: unknown) => create<number>('/company', d),
  update: (d: unknown) => update<unknown>('/company', d),
  remove: (id: number) => remove('/company', id)
}
export const supplierApi = {
  list: (b: PageSearch) => list<Record<string, unknown>>('/supplier/list', b),
  all: () => request<Array<Record<string, unknown>>>({ url: '/supplier/all', method: 'GET' }),
  get: (id: number) => getOne<Record<string, unknown>>('/supplier', id),
  create: (d: unknown) => create<number>('/supplier', d),
  update: (d: unknown) => update<unknown>('/supplier', d),
  remove: (id: number) => remove('/supplier', id)
}
export const customerApi = {
  list: (b: PageSearch) => list<Record<string, unknown>>('/customer/list', b),
  all: () => request<Array<Record<string, unknown>>>({ url: '/customer/all', method: 'GET' }),
  get: (id: number) => getOne<Record<string, unknown>>('/customer', id),
  create: (d: unknown) => create<number>('/customer', d),
  update: (d: unknown) => update<unknown>('/customer', d),
  remove: (id: number) => remove('/customer', id)
}
export const ownerApi = {
  list: (b: PageSearch) => list<Record<string, unknown>>('/goodsowner/list', b),
  all: () => request<Array<Record<string, unknown>>>({ url: '/goodsowner/all', method: 'GET' }),
  get: (id: number) => getOne<Record<string, unknown>>('/goodsowner', id),
  create: (d: unknown) => create<number>('/goodsowner', d),
  update: (d: unknown) => update<unknown>('/goodsowner', d),
  remove: (id: number) => remove('/goodsowner', id)
}
export const freightApi = {
  list: (b: PageSearch) => list<Record<string, unknown>>('/freightfee/list', b),
  all: () => request<Array<Record<string, unknown>>>({ url: '/freightfee/all', method: 'GET' }),
  get: (id: number) => getOne<Record<string, unknown>>('/freightfee', id),
  create: (d: unknown) => create<number>('/freightfee', d),
  update: (d: unknown) => update<unknown>('/freightfee', d),
  remove: (id: number) => remove('/freightfee', id)
}
export const warehouseApi = {
  list: (b: PageSearch) => list<Record<string, unknown>>('/warehouse/list', b),
  get: (id: number) => getOne<Record<string, unknown>>('/warehouse', id),
  create: (d: unknown) => create<number>('/warehouse', d),
  update: (d: unknown) => update<unknown>('/warehouse', d),
  remove: (id: number) => remove('/warehouse', id)
}
export const areaApi = {
  list: (b: PageSearch) => list<Record<string, unknown>>('/warehousearea/list', b),
  get: (id: number) => getOne<Record<string, unknown>>('/warehousearea', id),
  create: (d: unknown) => create<number>('/warehousearea', d),
  update: (d: unknown) => update<unknown>('/warehousearea', d),
  remove: (id: number) => remove('/warehousearea', id)
}
export const locationApi = {
  list: (b: PageSearch) => list<Record<string, unknown>>('/goodslocation/list', b),
  get: (id: number) => getOne<Record<string, unknown>>('/goodslocation', id),
  create: (d: unknown) => create<number>('/goodslocation', d),
  update: (d: unknown) => update<unknown>('/goodslocation', d),
  remove: (id: number) => remove('/goodslocation', id)
}

// ---------- 用户 / 角色 ----------
export const userApi = {
  list: (b: PageSearch) => list<Record<string, unknown>>('/user/list', b),
  get: (id: number) => getOne<Record<string, unknown>>('/user', id),
  create: (d: unknown) => create<Record<string, unknown>>('/user', d),
  update: (d: unknown) => update<unknown>('/user', d),
  remove: (id: number) => remove('/user', id),
  resetPwd: (id_list: number[]) => request<string>({ url: '/user/reset-pwd', method: 'POST', data: { id_list } }),
  changePwd: (d: unknown) => request<string>({ url: '/user/change-pwd', method: 'POST', data: d })
}
export const userroleApi = {
  list: listFromAll<Record<string, unknown>>('/userrole/all', 'role_name'),
  all: () => request<Array<Record<string, unknown>>>({ url: '/userrole/all', method: 'GET' }),
  get: (id: number) => getOne<Record<string, unknown>>('/userrole', id),
  create: (d: unknown) => create<number>('/userrole', d),
  update: (d: unknown) => update<unknown>('/userrole', d),
  remove: (id: number) => remove('/userrole', id)
}
export const actionLogApi = {
  list: (b: PageSearch) => list<Record<string, unknown>>('/actionlog/list', b)
}

// ---------- 入库 ----------
export const asnApi = {
  masterList: (b: PageSearch) => list<Record<string, unknown>>('/asn/asnmaster/list', b),
  masterGet: (id: number) => getOne<Record<string, unknown>>('/asn/asnmaster', id),
  masterCreate: (d: unknown) => create<number>('/asn/asnmaster', d),
  list: (b: PageSearch) => list<Record<string, unknown>>('/asn/list', b),
  get: (id: number) => getOne<Record<string, unknown>>('/asn', id),
  create: (d: unknown) => create<number>('/asn', d),
  remove: (id: number) => remove('/asn', id),
  confirm: (items: Array<{ id: number; arrival_time: string }>) => update<string>('/asn/confirm', items),
  unload: (items: Array<{ id: number; unload_time: string; unload_person_id: number; unload_person: string }>) => update<string>('/asn/unload', items),
  sorting: (items: Array<{ asn_id: number; sorted_qty: number; is_auto_num: boolean }>) => update<string>('/asn/sorting', items),
  sorted: (idList: number[]) => update<string>('/asn/sorted', idList),
  pendingPutaway: (id: number) => request<Array<{ asn_id: number; goods_owner_id: number; series_number: string; sorted_qty: number }>>({ url: '/asn/pending-putaway', method: 'GET', params: { id } }),
  putaway: (items: Array<{ asn_id: number; goods_owner_id: number; series_number: string; goods_location_id: number; putaway_qty: number }>) => update<string>('/asn/putaway', items)
}

// ---------- 库存中心 ----------
export const stockApi = {
  stockList: (b: PageSearch) => list<Record<string, unknown>>('/stock/stock-list', b),
  safetyList: (b: PageSearch) => list<Record<string, unknown>>('/stock/safety-list', b),
  locationList: (b: PageSearch) => list<Record<string, unknown>>('/stock/location-list', b),
  stockAgeList: (b: PageSearch) => list<Record<string, unknown>>('/stock/stock-age-list', b)
}
export const stockadjustApi = { list: (b: PageSearch) => list<Record<string, unknown>>('/stockadjust/list', b) }
export const stockfreezeApi = {
  list: (b: PageSearch) => list<Record<string, unknown>>('/stockfreeze/list', b),
  create: (d: unknown) => create<number>('/stockfreeze', d),
  update: (d: unknown) => update<unknown>('/stockfreeze', d),
  remove: (id: number) => remove('/stockfreeze', id)
}
export const stockmoveApi = {
  list: (b: PageSearch) => list<Record<string, unknown>>('/stockmove/list', b),
  all: () => request<Array<Record<string, unknown>>>({ url: '/stockmove/all', method: 'GET' }),
  create: (d: unknown) => create<number>('/stockmove', d),
  update: (d: unknown) => update<unknown>('/stockmove', d),
  remove: (id: number) => remove('/stockmove', id),
  // PUT /stockmove 收单个 int id（查询串），过账移库
  confirm: (id: number) => request<boolean>({ url: '/stockmove', method: 'PUT', params: { id } })
}
export const stockprocessApi = {
  list: (b: PageSearch) => list<Record<string, unknown>>('/stockprocess/list', b),
  create: (d: unknown) => create<number>('/stockprocess', d),
  update: (d: unknown) => update<unknown>('/stockprocess', d),
  remove: (id: number) => remove('/stockprocess', id),
  // process-confirm/adjustment-confirm 均收单个 int id（查询串），不是数组 body
  processConfirm: (id: number) => request<string>({ url: '/stockprocess/process-confirm', method: 'PUT', params: { id } }),
  adjustConfirm: (id: number) => request<string>({ url: '/stockprocess/adjustment-confirm', method: 'PUT', params: { id } })
}
export const stocktakingApi = {
  list: (b: PageSearch) => list<Record<string, unknown>>('/stocktaking/list', b),
  get: (id: number) => getOne<Record<string, unknown>>('/stocktaking', id),
  // 建单只收账面信息（StocktakingBasicViewModel 无 counted_qty/difference_qty 字段，发了也被丢弃）
  create: (d: unknown) => create<number>('/stocktaking', d),
  // 录实盘数：PUT 收 {id, counted_qty}（StocktakingConfirmViewModel），
  // 后端同时置 difference_qty=counted-book_qty 并翻 job_status=true
  update: (d: unknown) => update<unknown>('/stocktaking', d),
  remove: (id: number) => remove('/stocktaking', id),
  // adjustment-confirm 收单个 int id（查询串），不是数组 body
  adjustConfirm: (id: number) => request<string>({ url: '/stocktaking/adjustment-confirm', method: 'PUT', params: { id } })
}

// ---------- 发货 ----------
export const dispatchApi = {
  list: (b: PageSearch) => list<Record<string, unknown>>('/dispatchlist/list', b),
  create: (d: unknown) => create<Record<string, unknown>>('/dispatchlist', d),
  update: (d: unknown) => update<unknown>('/dispatchlist', d),
  remove: (id: number) => remove('/dispatchlist', id),
  // 删除整单：后端 DELETE 收 dispatch_no 查询串（仅 status≤1 可删）
  removeByNo: (dispatch_no: string) => request<string>({ url: '/dispatchlist', method: 'DELETE', params: { dispatch_no } }),
  // 取消作业（CancelOrderOpration）：status=2 释放拣货锁定回 1；status=3 回 2。收单个对象，不是数组
  cancelOpration: (dispatch_no: string, dispatch_status: number) => request<string>({ url: '/dispatchlist/cancel-order', method: 'POST', data: { dispatch_no, dispatch_status } }),
  // 注意：PUT cancel-order?id= 是「取消打包/称重明细」，与上面整单取消不是一回事
  cancelDetail: (id: number) => request<string>({ url: '/dispatchlist/cancel-order', method: 'PUT', params: { id } }),
  byNo: (dispatch_no: string) => request<Record<string, unknown>>({ url: '/dispatchlist/by-dispatch_no', method: 'GET', params: { dispatch_no } }),
  // 确认订单前先取库存分配方案（含 pick_list，按五元组定位 stock）——
  // byNo 的 DetailViewModel 无 pick_list/dispatchlist_id，直接喂 confirm-order 会锁不到库存
  confirmCheck: (dispatch_no: string) => request<Record<string, unknown>>({ url: '/dispatchlist/confirm-check', method: 'GET', params: { dispatch_no } }),
  confirmOrder: (d: unknown) => request<string>({ url: '/dispatchlist/confirm-order', method: 'POST', data: d }),
  cancelOrder: (d: unknown) => request<string>({ url: '/dispatchlist/cancel-order', method: 'PUT', data: d }),
  pickList: (d: unknown) => request<Record<string, unknown>>({ url: '/dispatchlist/pick-list', method: 'GET', params: d }),
  confirmPick: (d: unknown) => request<string>({ url: '/dispatchlist/confirm-pick-detail', method: 'POST', data: d }),
  package: (d: unknown) => request<string>({ url: '/dispatchlist/package', method: 'POST', data: d }),
  weight: (d: unknown) => request<string>({ url: '/dispatchlist/weight', method: 'POST', data: d }),
  delivery: (d: unknown) => request<string>({ url: '/dispatchlist/delivery', method: 'POST', data: d }),
  sign: (d: unknown) => request<string>({ url: '/dispatchlist/sign', method: 'POST', data: d }),
  freightfee: (d: unknown) => request<string>({ url: '/dispatchlist/freightfee', method: 'POST', data: d })
}
