/**
 * 后端 API 客户端：自动登录 + 统一请求封装 + 常用查询助手
 */
class Api {
  constructor(cfg) {
    this.cfg = cfg
    this.token = null
  }

  async login() {
    const d = await this.req('POST', '/login', { user_name: this.cfg.user, password: this.cfg.pass })
    this.token = d.data?.access_token
    if (!this.token) throw new Error('login failed: no access_token, resp=' + JSON.stringify(d).slice(0, 200))
    return d.data
  }

  async req(method, path, body, extraHeaders = {}) {
    const r = await fetch(this.cfg.api + path, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}`, ...extraHeaders },
      body: body !== undefined ? JSON.stringify(body) : undefined
    })
    let d
    try { d = await r.json() } catch { d = { isSuccess: false, errorMessage: `HTTP ${r.status} non-json` } }
    return d
  }

  /** 断言成功的请求（失败抛错） */
  async call(method, path, body, name) {
    const d = await this.req(method, path, body)
    if (!d.isSuccess) throw new Error(`${name || method + ' ' + path} failed: ${d.errorMessage || JSON.stringify(d).slice(0, 200)}`)
    return d.data
  }

  // ---------- 查询助手 ----------
  /** 分页 list */
  list(endpoint, pageSize = 50) {
    return this.req('POST', `/${endpoint}/list`, { pageIndex: 1, pageSize, sqlTitle: '', searchValue: '' })
  }
  /** userrole 无 /list 路由（v0.1.2 坑），走 GET /all + 客户端过滤，与前端 listFromAll 适配器一致 */
  async allUserroles() {
    const d = await this.req('GET', '/userrole/all')
    return d.data || []
  }
  /** /stock/select 可用库存池（sqlTitle='' 过滤 qty_available>0） */
  async stockAvail() {
    // pageSize 2000：真实库（实测 600+ 条）超过 500 时目标行会掉出第一页，stockBySerial 会误判为不存在
    const d = await this.req('POST', '/stock/select', { pageIndex: 1, pageSize: 2000, sqlTitle: '', searchValue: '' })
    return d.data?.rows || []
  }
  /** /stock/select 已冻结池 */
  async stockFrozen() {
    const d = await this.req('POST', '/stock/select', { pageIndex: 1, pageSize: 2000, sqlTitle: 'frozen', searchValue: '' })
    return d.data?.rows || []
  }
  /** 按序列号在两个池中找库存行 */
  async stockBySerial(sn) {
    return (await this.stockAvail()).find((r) => r.series_number === sn)
      || (await this.stockFrozen()).find((r) => r.series_number === sn)
      || null
  }
  /** 目标库位全量（含真实 id；/stock/location-list 的 goods_location_id 恒 0 不可用） */
  async locations() {
    const d = await this.req('GET', '/goodslocation/all')
    return d.data || []
  }
}

module.exports = { Api }
