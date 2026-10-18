/**
 * 测试报告：收集各套件步骤结果，控制台汇总 + JSON 落盘
 */
const fs = require('fs')
const path = require('path')

class Report {
  constructor() {
    this.steps = [] // {suite, step, ok, detail}
    this.suites = new Map() // suite -> {pass, fail}
  }

  step(suite, name, ok, detail = '') {
    this.steps.push({ suite, step: name, ok, detail: String(detail).slice(0, 500) })
    const s = this.suites.get(suite) || { pass: 0, fail: 0 }
    ok ? s.pass++ : s.fail++
    this.suites.set(suite, s)
    console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${suite}/${name}${detail ? ' :: ' + String(detail).slice(0, 220) : ''}`)
    return ok
  }

  /** 套件级中止（前置失败，后续步骤无意义） */
  abort(suite, name, detail) {
    this.step(suite, name, false, detail)
    throw new Error(`[${suite}] ABORT at ${name}: ${detail}`)
  }

  summary() {
    console.log('\n========== Z-WMS TEST SUMMARY ==========')
    let pass = 0, fail = 0
    for (const [suite, s] of this.suites) {
      console.log(`  ${suite.padEnd(16)} pass=${s.pass} fail=${s.fail}`)
      pass += s.pass
      fail += s.fail
    }
    console.log(`  ------------------------------`)
    console.log(`  TOTAL: ${pass + fail} steps, ${pass} pass, ${fail} fail`)
    console.log(`  RESULT: ${fail === 0 ? 'ALL GREEN ✓' : 'HAS FAILURES ✗'}`)
    return { pass, fail }
  }

  writeJson(outDir) {
    const file = path.join(outDir, `report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
    fs.writeFileSync(file, JSON.stringify({ steps: this.steps, suites: Object.fromEntries(this.suites) }, null, 2))
    console.log(`  report: ${file}`)
    return file
  }
}

module.exports = { Report }
