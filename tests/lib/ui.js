/**
 * UI 原子操作：基于 CDP evaluate 的 Naive UI 组件交互
 * 经验约定：
 * - 保存类点击后必须验证「模态关闭 + 数据变化」双信号
 * - n-select 选项按可见 option 文本匹配，选中后停留 300ms
 * - 弹窗内 .n-base-selection 顺序 = DOM 顺序（含明细行内的下拉）
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

class Ui {
  constructor(browser, cfg) {
    this.b = browser
    this.cfg = cfg
  }

  /** 在 scope 内按文本点按钮；exact=true 全等，false 包含 */
  async clickText(scope, text, exact = true) {
    return this.b.evaluate(`(() => {
      const root = document.querySelector(${JSON.stringify(scope)})
      if (!root) return 'NO_SCOPE'
      const b = [...root.querySelectorAll('button')].find(x => {
        const t = x.textContent.trim()
        return ${exact} ? t === ${JSON.stringify(text)} : t.includes(${JSON.stringify(text)})
      })
      if (!b) return 'NOT_FOUND'
      b.click(); return 'OK'
    })()`)
  }

  /** scope 内第 idx 个 .n-base-selection 下拉：点开并按文本选 option */
  async pickOption(scope, idx, optSubstr) {
    return this.b.evaluate(`(async () => {
      const sleep = ms => new Promise(r => setTimeout(r, ms))
      const root = document.querySelector(${JSON.stringify(scope)})
      if (!root) return 'NO_SCOPE'
      const sel = [...root.querySelectorAll('.n-base-selection')][${JSON.stringify(idx) * 1}]
      if (!sel) return 'NO_SELECT'
      sel.click(); await sleep(500)
      const opts = [...document.querySelectorAll('.n-base-select-option')].filter(o => o.offsetParent !== null)
      const o = opts.find(x => x.textContent.includes(${JSON.stringify(optSubstr)}))
      if (!o) { document.body.click(); return 'NO_OPTION:' + opts.map(x => x.textContent.slice(0, 16)).join('|') }
      o.click(); await sleep(300)
      return 'OK'
    })()`)
  }

  /** n-input-number / n-input 填值：按 label 找同 form-item 的输入框 */
  async fillByLabel(label, value) {
    return this.b.evaluate(`(() => {
      const items = [...document.querySelectorAll('.n-form-item')]
      const norm = (t) => (t || '').replace(/[\\s*]*\\*[\\s*]*$/, '').trim()  // 剥掉必填星号
      const it = items.find(x => norm(x.querySelector('.n-form-item-label')?.textContent) === ${JSON.stringify(label)})
      if (!it) return 'NO_LABEL:' + items.map(x => norm(x.querySelector('.n-form-item-label')?.textContent)).filter(Boolean).join(',')
      const num = it.querySelector('.n-input-number input')
      const input = it.querySelector('input')
      const el = num || input
      if (!el) return 'NO_INPUT'
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      setter.call(el, ${JSON.stringify(String(value))})
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
      return 'OK'
    })()`)
  }

  /** 所有 .n-modal 是否已关闭 */
  async modalGone() {
    return this.b.evaluate(`document.querySelectorAll('.n-modal').length === 0 || [...document.querySelectorAll('.n-modal')].every(m => !m.offsetParent)`)
  }

  /** 最后一条 n-message 文本（提交反馈） */
  async lastMessage() {
    return this.b.evaluate(`(() => { const m = [...document.querySelectorAll('.n-message__content')].pop(); return m ? m.textContent.trim() : '' })()`)
  }

  /** 确认/警告 dialog（n-dialog 非 n-modal）里按文本点按钮 */
  async clickDialog(text, exact = true) {
    return this.b.evaluate(`(() => {
      const b = [...document.querySelectorAll('.n-dialog button')].find(x => ${exact} ? x.textContent.trim() === ${JSON.stringify(text)} : x.textContent.trim().includes(${JSON.stringify(text)}))
      if (!b) return 'NOT_FOUND'
      b.click(); return 'OK'
    })()`)
  }

  /** 表格表头与行文本（截断 200 字/行） */
  async tableInfo() {
    return this.b.evaluate(`(() => ({
      heads: [...document.querySelectorAll('.n-data-table th')].map(th => th.textContent.trim()).filter(Boolean),
      rows: [...document.querySelectorAll('.n-data-table tbody tr')].map(tr => tr.textContent.replace(/\\s+/g, ' ').trim().slice(0, 200))
    }))()`)
  }

  /** 导航到菜单页并等表格就绪 */
  async gotoPage(hash, settleMs) {
    await this.b.navigate(this.cfg.base + '/' + hash, settleMs || this.cfg.pageSettle)
    await this.b.waitTable()
  }
}

module.exports = { Ui }
