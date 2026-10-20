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
  const { api, report, cfg } = ctx
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

  // ---------- 人员下拉必须是「用户」而非「角色」（经手人等字段的回归） ----------
  // 背景：/user/select-item 返回的是角色（code=user_role），曾被误当作人员下拉数据源，
  // 导致「经手人」列出 admin/test 这种角色名，事后无法追到具体是谁经手
  const userItems = await api.req('GET', '/user/select-user-item')
  const pickItems = Array.isArray(userItems.data) ? userItems.data : []
  const allAreUser = pickItems.length > 0
    && pickItems.every((i) => i.code === 'user' && /^\d+$/.test(String(i.value)) && !!i.name)
  const userTotals = (await api.req('POST', '/user/list', { pageIndex: 1, pageSize: 1, searchValue: '' })).data?.totals
  report.step(S, 'get/user/select-user-item(用户非角色)', allAreUser && pickItems.length === userTotals,
    allAreUser ? `users=${pickItems.length}/${userTotals} ${pickItems.map((i) => i.name).join(' / ')}` : '返回为空或 code 不是 user')

  const roleItems = await api.req('GET', '/user/select-item')
  const roleOk = Array.isArray(roleItems.data) && roleItems.data.every((i) => i.code === 'user_role')
  report.step(S, 'get/user/select-item(角色，契约不变)', roleOk, roleOk ? `roles=${roleItems.data.length}` : '角色下拉契约被改动')

  // ---------- 角色权限可改（回归：曾因前端只走 POST + 后端「已分配」校验，导致角色只能授权一次） ----------
  const roleName = cfg.tag + '-RM'
  let tempRoleId = 0
  try {
    tempRoleId = await api.call('POST', '/userrole', { role_name: roleName, is_valid: true }, 'userrole/create')
    const menuNames = ['stockAsn', 'stockManagement', 'deliveryManagement']
    const idOf = {}
    for (const m of menus.data) idOf[m.menu_name] = m.id
    const grant = (ids) => api.call('PUT', '/rolemenu', {
      userrole_id: tempRoleId,
      role_name: roleName,
      detailList: ids.map((id) => ({ id: 0, menu_id: id, menu_name: '', authority: 1 }))
    }, 'rolemenu/put')
    const granted = async () => {
      const d = await api.req('GET', `/rolemenu?userrole_id=${tempRoleId}`)
      return (d.data?.detailList || []).map((x) => x.menu_id).sort()
    }

    const first = menuNames.map((n) => idOf[n])
    await grant(first)
    const afterFirst = await granted()
    report.step(S, 'rolemenu/grant', afterFirst.length === first.length,
      `menus=${afterFirst.length}`)

    // 追加一个菜单：必须能改（旧实现此处报「用户角色xx已分配权限」）
    const second = [...first, idOf.warehouseSetting]
    const addResp = await api.req('PUT', '/rolemenu', {
      userrole_id: tempRoleId,
      role_name: roleName,
      detailList: second.map((id) => ({ id: 0, menu_id: id, menu_name: '', authority: 1 }))
    })
    const afterAdd = await granted()
    report.step(S, 'rolemenu/append', addResp.isSuccess === true && afterAdd.length === second.length,
      addResp.isSuccess ? `menus=${afterAdd.length}` : `改permission失败: ${addResp.errorMessage}`)

    // 取消一个勾选：必须真的删掉（旧实现只增不删）
    const third = second.filter((id) => id !== idOf.warehouseSetting)
    await grant(third)
    const afterRemove = await granted()
    report.step(S, 'rolemenu/revoke', afterRemove.length === third.length,
      `menus=${afterRemove.length}（取消勾选应移除）`)

    // 超级管理员角色锁定：admin 的权限不允许通过接口改
    const adminRole = (await api.allUserroles()).find((r) => (r.role_name || '').trim().toLowerCase() === 'admin')
    const locked = await api.req('PUT', '/rolemenu', {
      userrole_id: adminRole ? adminRole.id : 1,
      role_name: 'admin',
      detailList: [{ id: 0, menu_id: idOf.stockAsn, menu_name: '', authority: 1 }]
    })
    report.step(S, 'rolemenu/admin-locked', locked.isSuccess === false && locked.code === 403,
      locked.isSuccess ? 'admin 角色权限被改动了（应拒绝）' : `${locked.code} ${locked.errorMessage}`)
  } finally {
    // 自清洁：先删授权再删角色
    if (tempRoleId > 0) {
      await api.req('DELETE', `/rolemenu?userrole_id=${tempRoleId}`)
      await api.req('DELETE', `/userrole?id=${tempRoleId}`)
    }
  }
}
