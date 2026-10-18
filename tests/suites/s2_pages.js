/**
 * 套件 s2：全页面渲染 —— 动态拉菜单（/rolemenu/menus），逐页导航验证：
 * 表格渲染（表头非空）或树/表单内容存在，无 404/白屏
 * 已知特例：统计页为静态路由（/#/stat-safety 等），不在菜单表，单独补测
 */
module.exports = async function run(ctx) {
  const { api, ui, b, report, cfg } = ctx
  const S = 's2_pages'

  const menus = (await api.call('GET', '/rolemenu/menus', undefined, 'menus')).filter((m) => m.vue_path)

  // 登录态注入 + 预热
  await b.loginAndWarm(api.token, cfg.base, cfg.pageSettle)

  for (const m of menus) {
    await b.navigate(`${cfg.base}/#/${m.vue_path}`, cfg.pageSettle)
    const info = await ui.tableInfo()
    // roleMenu（权限设置）是树组件无表格；其余菜单页都应有数据表格
    const hasTable = info.heads.length > 0
    const hasTree = await b.evaluate(`!!document.querySelector('.n-tree, .n-tree-node')`)
    const ok = hasTable || hasTree
    report.step(S, m.vue_path, ok, ok
      ? (hasTable ? `heads=${info.heads.length} rows=${info.rows.length}` : 'tree 组件渲染')
      : 'NO_CONTENT（无表格也无树）')
  }

  // 静态路由补测：统计分析 4 页（不在菜单表）
  const statPages = ['stat-safety', 'stat-asn', 'stat-delivery', 'stat-inventory']
  for (const p of statPages) {
    await b.navigate(`${cfg.base}/#/${p}`, cfg.pageSettle)
    const ok = await b.evaluate(`document.body.innerText.trim().length > 100 && !document.body.innerText.includes('404')`)
    report.step(S, `static/${p}`, !!ok, ok ? 'rendered' : 'EMPTY/404')
  }
}
