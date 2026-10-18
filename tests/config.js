/**
 * Z-WMS 自动化测试套件 - 环境配置
 * 全部支持环境变量覆盖，默认指向本机 docker 部署（frontend-v2:8081 / backend:20011）
 */
const os = require('os')
const path = require('path')
const fs = require('fs')

const cfg = {
  // 后端 API 与前端基址
  api: process.env.WMS_API || 'http://localhost:20011',
  base: process.env.WMS_BASE || 'http://localhost:8081',
  // 登录账号
  user: process.env.WMS_USER || 'admin',
  pass: process.env.WMS_PASS || '1',
  // headless Chrome
  chromePath:
    process.env.WMS_CHROME ||
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
  cdpPort: parseInt(process.env.WMS_CDP_PORT || '9223', 10),
  headless: process.env.WMS_HEADLESS !== '0',
  // 临时产物目录（截图/报告）
  outDir: process.env.WMS_TEST_OUT || path.join(os.tmpdir(), 'zwms_test_out'),
  // 各类等待（ms）
  pageSettle: parseInt(process.env.WMS_PAGE_SETTLE || '4500', 10), // SPA 首跳预热
  stepWait: parseInt(process.env.WMS_STEP_WAIT || '800', 10), // 点开弹窗等
  postWait: parseInt(process.env.WMS_POST_WAIT || '2500', 10), // 提交后落库
  // 测试数据前缀（序列号/编码）
  tag: 'RT' + Date.now().toString(36).toUpperCase()
}

fs.mkdirSync(cfg.outDir, { recursive: true })

module.exports = cfg
