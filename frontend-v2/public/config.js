// 运行时 API 基址：容器启动时由 entrypoint.sh 把下方占位符渲染为环境变量 WMS_API 的值
// 未注入时保留空串，前端回退到 VITE_API_BASE 或默认 hostname:20011（SQLite 档兼容）
window.__WMS_API__ = "__WMS_API_PLACEHOLDER__";
