/**
 * CDP（Chrome DevTools Protocol）封装：
 * - 自动拉起 headless Chrome（每次全新临时 profile，规避 vite 内容哈希更新后旧 profile 命中旧 index.html 的缓存坑）
 * - 裸 WebSocket 注入 localStorage token / 导航 / 取 DOM / 截图
 * - close() 精确清理自己拉起的浏览器与临时目录
 */
const { spawn } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const http = require('http')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function httpGetJson(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname + u.search, method }, (res) => {
      let buf = ''
      res.on('data', (c) => (buf += c))
      res.on('end', () => { try { resolve(JSON.parse(buf)) } catch (e) { reject(e) } })
    })
    req.on('error', reject)
    req.end()
  })
}

class Browser {
  constructor(cfg) {
    this.cfg = cfg
    this.chrome = null
    this.profileDir = null
    this.ws = null
    this.msgId = 0
    this.pending = new Map()
  }

  /** 启动浏览器并建立页面会话；若目标端口已有调试实例则直接复用（不负责其生命周期） */
  async start() {
    const ver = `http://127.0.0.1:${this.cfg.cdpPort}/json/version`
    let existing = null
    try { existing = await httpGetJson(ver) } catch { /* not running */ }
    if (!existing) {
      this.profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zwms_prof_'))
      this.chrome = spawn(this.cfg.chromePath, [
        this.cfg.headless ? '--headless=new' : '',
        '--disable-gpu', '--no-first-run', '--no-default-browser-check',
        `--remote-debugging-port=${this.cfg.cdpPort}`,
        `--user-data-dir=${this.profileDir}`,
        'about:blank'
      ].filter(Boolean), { stdio: 'ignore' })
      // 等调试端口就绪
      let ok = false
      for (let i = 0; i < 30; i++) {
        try { await httpGetJson(ver); ok = true; break } catch { await sleep(300) }
      }
      if (!ok) throw new Error('chrome debug port not ready: ' + this.cfg.cdpPort)
    }
    await this.attachPage()
  }

  async attachPage() {
    const targets = await httpGetJson(`http://127.0.0.1:${this.cfg.cdpPort}/json`)
    let page = targets.find((t) => t.type === 'page')
    if (!page) {
      // 新开一个 tab（Chrome 111+ 需要 PUT）
      await new Promise((resolve) => {
        const u = new URL(`http://127.0.0.1:${this.cfg.cdpPort}/json/new?about:blank`)
        const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname + u.search, method: 'PUT' }, resolve)
        req.end()
      })
      const t2 = await httpGetJson(`http://127.0.0.1:${this.cfg.cdpPort}/json`)
      page = t2.find((t) => t.type === 'page')
    }
    if (!page) throw new Error('no page target')
    this.pageUrl = page.webSocketDebuggerUrl
    return this.connectWs()
  }

  connectWs() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.pageUrl)
      this.ws.onopen = () => resolve()
      this.ws.onerror = (e) => reject(new Error('ws error'))
      this.ws.onmessage = (ev) => {
        const m = JSON.parse(ev.data)
        if (m.id && this.pending.has(m.id)) { this.pending.get(m.id)(m); this.pending.delete(m.id) }
      }
    })
  }

  send(method, params = {}) {
    return new Promise((resolve) => {
      const i = ++this.msgId
      this.pending.set(i, resolve)
      this.ws.send(JSON.stringify({ id: i, method, params }))
    })
  }

  /** 页面内执行 JS，异常上抛；awaitPromise 支持异步表达式 */
  async evaluate(expression) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (r.result?.exceptionDetails) {
      throw new Error('eval exception: ' + JSON.stringify(r.result.exceptionDetails).slice(0, 300))
    }
    return r.result?.result?.value
  }

  async navigate(url, settleMs = 1000) {
    await this.send('Page.navigate', { url })
    await sleep(settleMs)
  }

  async screenshot(file) {
    const r = await this.send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(file, Buffer.from(r.result.data, 'base64'))
  }

  /** 注入登录态并预热控制台首页（动态路由注册需要时间）；同会话只做一次 */
  async loginAndWarm(token, base, settleMs) {
    if (this.warmed) return
    await this.navigate(base + '/#/login', 2500)
    await this.evaluate(`localStorage.setItem('wms2_auth', ${JSON.stringify(JSON.stringify({ accessToken: token, refreshToken: '', user: { user_name: 'admin' } }))})`)
    // 必须整页重载：pinia store 在登录页渲染时已创建并读到空 token，
    // 只改 hash 不会重建 store，后续请求就不带 Authorization，后端启用 [Authorize] 后会 401 踢回登录页
    await this.send('Page.reload', { ignoreCache: true })
    await sleep(2000)
    await this.navigate(base + '/#/', settleMs)
    this.warmed = true
  }

  /** 等待数据表格出现 */
  async waitTable(timeout = 10000) {
    const t0 = Date.now()
    while (Date.now() - t0 < timeout) {
      if (await this.evaluate(`document.querySelectorAll('.n-data-table th').length > 0`)) return true
      await sleep(400)
    }
    return false
  }

  close() {
    try { this.ws && this.ws.close() } catch { /* ignore */ }
    if (this.chrome) {
      try { this.chrome.kill() } catch { /* ignore */ }
      // kill 只是 SIGTERM，headless chrome 偶有残留子进程，稍后强杀
      setTimeout(() => { try { this.chrome.kill('SIGKILL') } catch { /* ignore */ } }, 800)
    }
    if (this.profileDir) {
      setTimeout(() => { try { fs.rmSync(this.profileDir, { recursive: true, force: true }) } catch { /* ignore */ } }, 1500)
    }
  }
}

module.exports = { Browser, sleep }
