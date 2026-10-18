/**
 * 套件 s1：API 冒烟 —— 登录 + 全部读接口（list/all/menus/select 等）逐个探活
 * 任何接口非 200 即失败。接口清单来自 frontend-v2/src/api/index.ts 实际调用。
 */
const LIST_ENDPOINTS = [
  'actionlog', 'asn/asnmaster', 'asn', 'customer', 'dispatchlist', 'freightfee',
  'goodslocation', 'goodsowner', 'spu', 'stockadjust', 'stockfreeze', 'stockmove',
  'stockprocess', 'stocktaking', 'supplier', 'user', 'warehouse', 'warehousearea'
]

const ALL_ENDPOINTS = ['category/all', 'company/all', 'goodsowner/all', 'freightfee/all', 'supplier/all', 'userrole/all']

module.exports = async function run(ctx) {
  const { api, report } = ctx
  const S = 's1_api_smoke'

  // 登录
  try {
    const d = await api.login()
    report.step(S, 'login', !!api.token, `user=${d.user_name} role=${d.user_role}`)
  } catch (e) {
    report.abort(S, 'login', e.message)
  }

  // 分页 list 接口
  for (const ep of LIST_ENDPOINTS) {
    const d = await api.req('POST', `/${ep}/list`, { pageIndex: 1, pageSize: 5, sqlTitle: '', searchValue: '' })
    report.step(S, `list/${ep}`, d.isSuccess === true && d.code === 200, d.isSuccess ? `totals=${d.data?.totals}` : d.errorMessage)
  }

  // all 类全量接口
  for (const ep of ALL_ENDPOINTS) {
    const d = await api.req('GET', `/${ep}`)
    report.step(S, `get/${ep}`, d.isSuccess === true && d.code === 200, d.isSuccess ? `rows=${Array.isArray(d.data) ? d.data.length : '?'}` : d.errorMessage)
  }

  // 特殊结构接口
  const menus = await api.req('GET', '/rolemenu/menus')
  report.step(S, 'get/rolemenu/menus', menus.isSuccess === true && Array.isArray(menus.data) && menus.data.length > 0,
    menus.isSuccess ? `menus=${menus.data.length}` : menus.errorMessage)

  const sel = await api.req('GET', '/user/select-item')
  report.step(S, 'get/user/select-item', sel.isSuccess === true, sel.isSuccess ? 'ok' : sel.errorMessage)

  const stockSel = await api.req('POST', '/stock/select', { pageIndex: 1, pageSize: 5, sqlTitle: '', searchValue: '' })
  report.step(S, 'post/stock/select', stockSel.isSuccess === true, stockSel.isSuccess ? `avail=${stockSel.data?.totals}` : stockSel.errorMessage)

  const stockFrozen = await api.req('POST', '/stock/select', { pageIndex: 1, pageSize: 5, sqlTitle: 'frozen', searchValue: '' })
  report.step(S, 'post/stock/select(frozen)', stockFrozen.isSuccess === true, stockFrozen.isSuccess ? `frozen=${stockFrozen.data?.totals}` : stockFrozen.errorMessage)

  const locs = await api.req('GET', '/goodslocation/all')
  const locOk = locs.isSuccess === true && Array.isArray(locs.data) && locs.data.every((l) => l.id > 0)
  report.step(S, 'get/goodslocation/all(含真实id)', locOk, locOk ? `locations=${locs.data.length}` : '存在 id=0 的库位行（上游坑）')
}
