/**
 * 套件 s3：CRUD 写入链路 —— 角色设置页（userRoleSetting，CrudPage 配置驱动）建→改→删 round-trip
 * 选角色设置因为它无副作用、可清理、覆盖模态表单+开关+列表操作全要素
 * 关键回归点：CrudPage.openEdit 必须携带 id（v0.1.4 曾丢主键致编辑静默失败）
 * 注意 CrudPage 组件约定：工具栏「+ 新增」、模态确认「保存」、删除 dialog「确定」
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

module.exports = async function run(ctx) {
  const { api, ui, b, report, cfg } = ctx
  const S = 's3_crud'
  const roleName = 'RT测试角色' + cfg.tag.slice(-6)

  await ui.gotoPage('#/userRoleSetting')

  // ---------- 建 ----------
  let r = await ui.clickText('body', '新增', false)
  await sleep(cfg.stepWait)
  r = await ui.fillByLabel('角色名', roleName)
  if (r !== 'OK') report.abort(S, 'create-fill', r)
  await b.screenshot(cfg.outDir + '/s3_create.png')
  r = await ui.clickText('.n-modal', '保存', true)
  await sleep(cfg.postWait)
  const afterCreate = (await api.allUserroles())
  const created = afterCreate.find((x) => x.role_name === roleName)
  report.step(S, 'create', (await ui.modalGone()) && !!created,
    created ? `id=${created.id}` : `rows=${afterCreate.length} msg="${await ui.lastMessage()}"`)
  if (!created) return

  // ---------- 改（启用→禁用，验证 update 带主键且持久化） ----------
  r = await b.evaluate(`(() => {
    const tr = [...document.querySelectorAll('.n-data-table tbody tr')].find(t => t.textContent.includes(${JSON.stringify(roleName)}))
    if (!tr) return 'NO_ROW'
    const b = [...tr.querySelectorAll('button')].find(x => x.textContent.includes('编辑'))
    if (!b) return 'NO_BTN'
    b.click(); return 'OK'
  })()`)
  if (r !== 'OK') report.abort(S, 'edit-open', r)
  await sleep(cfg.stepWait)
  // 关掉「是否启用」开关
  await b.evaluate(`(() => { const sw = [...document.querySelectorAll('.n-modal .n-switch')][0]; if (sw) sw.click() })()`)
  r = await ui.clickText('.n-modal', '保存', true)
  await sleep(cfg.postWait)
  let row = (await api.allUserroles()).find((x) => x.id === created.id)
  report.step(S, 'update-disable', row && row.is_valid === false, `is_valid=${row?.is_valid}`)

  // ---------- 删 ----------
  r = await b.evaluate(`(() => {
    const tr = [...document.querySelectorAll('.n-data-table tbody tr')].find(t => t.textContent.includes(${JSON.stringify(roleName)}))
    if (!tr) return 'NO_ROW'
    const b = [...tr.querySelectorAll('button')].find(x => x.textContent.includes('删除'))
    if (!b) return 'NO_BTN'
    b.click(); return 'OK'
  })()`)
  if (r !== 'OK') report.abort(S, 'delete-open', r)
  await sleep(cfg.stepWait)
  await ui.clickDialog('删除', true) // CrudPage 删除 dialog 的 positiveText 是「删除」
  await sleep(cfg.postWait)
  row = (await api.allUserroles()).find((x) => x.id === created.id)
  report.step(S, 'delete', !row, row ? '仍存在' : '已删除')
}
