/**
 * Z-WMS 全量自动化测试总入口
 * 用法：
 *   node run-all.js            # 全部套件
 *   node run-all.js s1 s3      # 只跑指定套件
 * 环境变量见 config.js（WMS_API/WMS_BASE/WMS_USER/WMS_PASS/WMS_CHROME/...）
 * 前置：backend(:20011) 与 frontend-v2(:8081) 已启动
 */
const path = require('path')
const cfg = require('./config')
const { Report } = require('./lib/report')
const { Api } = require('./lib/api')
const { Browser } = require('./lib/cdp')
const { Ui } = require('./lib/ui')

const ALL = {
  s1: './suites/s1_api_smoke.js',
  s2: './suites/s2_pages.js',
  s3: './suites/s3_crud.js',
  s4: './suites/s4_inbound.js',
  s5: './suites/s5_warehouse.js',
  s6: './suites/s6_dispatch.js'
}

async function main() {
  const wanted = process.argv.slice(2).filter((a) => ALL[a])
  const suites = wanted.length ? wanted : Object.keys(ALL)
  const report = new Report()
  const api = new Api(cfg)
  const b = new Browser(cfg)
  const ui = new Ui(b, cfg)
  const ctx = { cfg, report, api, b, ui }

  console.log(`Z-WMS TEST RUN @ ${new Date().toLocaleString()}`)
  console.log(`  api=${cfg.api} base=${cfg.base} user=${cfg.user} tag=${cfg.tag}`)
  console.log(`  suites=${suites.join(', ')}\n`)

  // 全套件共用一次登录
  await api.login()

  let aborted = false
  for (const key of suites) {
    console.log(`\n----- ${key} -----`)
    try {
      // 需要 UI 的套件：确保浏览器已起 + 已注入登录态（同会话复用）
      if (['s2', 's3', 's5', 's6'].includes(key)) {
        if (!b.ws) await b.start()
        await b.loginAndWarm(api.token, cfg.base, cfg.pageSettle)
      }
      // s5 依赖 s4 的测试库存
      if (key === 's5' && !ctx.testData) {
        console.log('  [skip] s5 依赖 s4 产出的测试库存，请连同 s4 一起跑')
        report.step('s5_warehouse', 'prerequisite', false, '缺 s4 测试数据，已跳过')
        continue
      }
      const run = require(path.resolve(__dirname, ALL[key]))
      const out = await run(ctx)
      if (key === 's4') ctx.testData = out
    } catch (e) {
      aborted = true
      console.log(`  !! suite ${key} aborted: ${e.message}`)
      // 把 abort 记成失败步骤，防止汇总误报 ALL GREEN
      report.step(key, 'suite-aborted', false, e.message)
      if (['s2', 's3', 's5', 's6'].includes(key)) {
        try { await b.screenshot(cfg.outDir + `/abort_${key}.png`) } catch { /* ignore */ }
      }
    }
  }

  b.close()
  const { fail } = report.summary()
  report.writeJson(cfg.outDir)
  console.log(`\n  artifacts: ${cfg.outDir}`)
  process.exit(aborted || fail > 0 ? 1 : 0)
}

main()
