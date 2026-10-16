<template>
  <div class="vwms">
    <!-- 工具栏 -->
    <header class="vwms-header">
      <button class="tool-btn" @click="$router.push('/home')">‹ 返回控制台</button>
      <h1 class="vwms-title">3D 库房可视化</h1>
      <div class="legend">
        <span v-for="l in legend" :key="l.label" class="legend-item">
          <i :style="{ background: l.color }" />{{ l.label }}
        </span>
        <span class="legend-stat">{{ occupiedCells }}/{{ totalCells }} 库位有货 · 最大占用 {{ maxQty }}</span>
      </div>
      <button class="tool-btn" @click="toggleFullscreen">⛶ 全屏</button>
    </header>

    <!-- 加载 / 空态 -->
    <div v-if="loading" class="state-hint">库房数据加载中…</div>
    <div v-else-if="!shelves.length" class="state-hint">暂无库存数据 —— 请先完成入库上架，库房将随真实库位数据生成</div>

    <!-- 3D 场景 -->
    <div v-else class="scene-wrap" ref="sceneWrap">
      <div class="scene">
        <div class="floor" />
        <div
          v-for="shelf in shelves"
          :key="shelf.row"
          class="shelf"
          :style="shelfStyle(shelf)"
        >
          <div class="shelf-label">{{ shelfPrefix }}-{{ shelf.row }} 号货架</div>
          <div class="shelf-grid" :style="{ gridTemplateColumns: `repeat(${shelf.maxCol}, 1fr)` }">
            <div
              v-for="cell in shelf.cells"
              :key="cell.key"
              class="cell"
              :class="{ empty: !cell.qty, active: selected && selected.key === cell.key }"
              :style="{ background: heatColor(cell.qty) }"
              :title="cell.tooltip"
              @click="selectCell(cell)"
            >
              <span v-if="cell.qty" class="cell-qty">{{ cell.qty }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情弹层 -->
    <div v-if="selected" class="modal-mask" @click.self="selected = null">
      <div class="modal">
        <div class="modal-head">
          <span class="modal-title">库位详情</span>
          <button class="tool-btn" @click="selected = null">✕</button>
        </div>
        <div class="modal-body">
          <div class="detail-row"><span class="detail-label">库位</span><b>{{ selected.name }}</b></div>
          <div v-for="(items, key) in selected.contents" :key="key" class="detail-block">
            <div class="detail-row">
              <span class="detail-label">SKU</span><b>{{ key }}</b>
              <span class="detail-label" style="margin-left: auto">总数量</span><b class="qty">{{ sumQty(items) }}</b>
            </div>
            <div v-for="it in items" :key="it.series_number + it.qty" class="detail-line">
              序列号 {{ it.series_number || '—' }} · 可用 {{ it.qty_available ?? it.qty }} · 锁定 {{ it.qty_locked ?? 0 }} · 冻结 {{ it.qty_frozen ?? 0 }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { stockApi, pageSearch } from '@/api'

interface StockLocationRow {
  location_name: string
  spu_name?: string
  sku_name?: string
  series_number?: string
  qty?: number
  qty_available?: number
  qty_locked?: number
  qty_frozen?: number
}

interface Cell {
  key: string
  name: string
  qty: number
  tooltip: string
  contents: Map<string, StockLocationRow[]>
}
interface Shelf {
  row: number
  maxCol: number
  cells: Cell[]
}

const loading = ref(false)
const shelves = ref<Shelf[]>([])
const shelfPrefix = ref('')
const selected = ref<Cell | null>(null)
const sceneWrap = ref<HTMLElement | null>(null)

const legend = [
  { label: '空闲', color: '#1f2937' },
  { label: '低占用', color: '#22c55e' },
  { label: '中占用', color: '#eab308' },
  { label: '高占用', color: '#ef4444' }
]

const totalCells = computed(() => shelves.value.reduce((s, sh) => s + sh.cells.length, 0))
const occupiedCells = computed(() => shelves.value.reduce((s, sh) => s + sh.cells.filter((c) => c.qty > 0).length, 0))
const maxQty = computed(() => Math.max(1, ...shelves.value.flatMap((sh) => sh.cells.map((c) => c.qty))))

// ---- 热力着色：绿→黄→红 ----
function heatColor(qty: number): string {
  if (!qty) return '#1f2937'
  const t = Math.min(qty / maxQty.value, 1)
  // 0 → 绿(34,197,94)，0.5 → 黄(234,179,8)，1 → 红(239,68,68)
  const r = t < 0.5 ? Math.round(34 + (234 - 34) * (t / 0.5)) : 234 + Math.round((239 - 234) * ((t - 0.5) / 0.5))
  const g = t < 0.5 ? Math.round(197 + (179 - 197) * (t / 0.5)) : Math.round(179 + (68 - 179) * ((t - 0.5) / 0.5))
  const b = t < 0.5 ? Math.round(94 + (8 - 94) * (t / 0.5)) : 8 + Math.round((68 - 8) * ((t - 0.5) / 0.5))
  return `rgb(${r},${g},${b})`
}

/**
 * 库位名解析：
 * - 5 段式 `前缀-排-列-层-位`（如 mn-1-1-5-45）→ 取末三位为 排/列/层
 * - 3 段式 `前缀-排-列`（如 A-01-01）→ 取两位为 排/列
 * - 其余按名称哈希兜底散列，保证同名库位稳定落在同一格
 */
function parseLocation(name: string): { prefix: string; row: number; col: number; level: number } {
  const parts = name.split('-')
  const nums = parts.map((p) => parseInt(p, 10)).filter((n) => !Number.isNaN(n))
  if (parts.length >= 4 && nums.length >= 3) {
    const prefix = parts.slice(0, Math.max(1, parts.length - nums.length)).join('-') || parts[0]
    const [row, col, level] = nums.slice(-3)
    return { prefix, row: row || 1, col: col || 1, level: level || 1 }
  }
  if (parts.length >= 3 && nums.length >= 2) {
    const prefix = parts.slice(0, Math.max(1, parts.length - nums.length)).join('-') || parts[0]
    const [row, col] = nums.slice(-2)
    return { prefix, row: row || 1, col: col || 1, level: 1 }
  }
  return { prefix: 'W', row: Math.floor(Math.abs(hash(name)) % 8) + 1, col: (Math.abs(hash(name)) % 8) + 1, level: 1 }
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}

function shelfStyle(shelf: Shelf): Record<string, string> {
  // 货架交替朝向产生纵深错落感；排号决定旋转方向
  const flip = shelf.row % 2 === 0 ? 1 : -1
  return { transform: `rotateX(8deg) rotateY(${16 * flip}deg)` }
}

function selectCell(cell: Cell) {
  if (!cell.qty) return
  selected.value = cell
}

function sumQty(items: StockLocationRow[]): number {
  return items.reduce((s, it) => s + (Number(it.qty) || 0), 0)
}

function toggleFullscreen() {
  const el = sceneWrap.value
  if (!el) return
  if (document.fullscreenElement) document.exitFullscreen()
  else el.requestFullscreen?.()
}

async function load() {
  loading.value = true
  try {
    const d = await stockApi.locationList(pageSearch({ pageIndex: 1, pageSize: 2000 }))
    const rows = ((d.rows as any[]) || []) as StockLocationRow[]
    const byRow = new Map<number, Map<string, Cell>>()
    for (const r of rows) {
      const name = String(r.location_name || '')
      if (!name) continue
      const { prefix, row, col, level } = parseLocation(name)
      shelfPrefix.value = prefix
      if (!byRow.has(row)) byRow.set(row, new Map())
      const cols = byRow.get(row)!
      const key = `${col}-${level}`
      let cell = cols.get(key)
      if (!cell) {
        cell = { key, name: `${prefix}-${row}-${key}`, qty: 0, tooltip: '', contents: new Map() }
        cols.set(key, cell)
      }
      cell.qty += Number(r.qty) || 0
      const sku = String(r.sku_name || r.spu_name || '未知')
      if (!cell.contents.has(sku)) cell.contents.set(sku, [])
      cell.contents.get(sku)!.push(r)
    }
    const list: Shelf[] = []
    for (const [row, cols] of [...byRow.entries()].sort((a, b) => a[0] - b[0])) {
      const sorted = [...cols.entries()].sort((a, b) => {
        const [ca, la] = a[0].split('-').map(Number)
        const [cb, lb] = b[0].split('-').map(Number)
        return ca - cb || la - lb
      })
      const maxCol = Math.max(...sorted.map(([k]) => Number(k.split('-')[0])))
      const cells: Cell[] = []
      for (let c = 1; c <= maxCol; c++) {
        const colCells = sorted.filter(([k]) => Number(k.split('-')[0]) === c).map(([, cell]) => cell)
        // 一列展示为一格（取该列总量），列内多层时 tooltip 汇总
        const merged: Cell = {
          key: String(c),
          name: colCells[0]?.name || '',
          qty: colCells.reduce((s, cc) => s + cc.qty, 0),
          tooltip: colCells.map((cc) => `${cc.name}: ${cc.qty}`).join('\n'),
          contents: new Map()
        }
        for (const cc of colCells) for (const [sku, items] of cc.contents) {
          if (!merged.contents.has(sku)) merged.contents.set(sku, [])
          merged.contents.get(sku)!.push(...items)
        }
        cells.push(merged)
      }
      list.push({ row, maxCol, cells })
    }
    shelves.value = list
  } finally {
    loading.value = false
  }
}

onMounted(load)
onBeforeUnmount(() => {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
})
</script>

<style scoped>
.vwms {
  width: 100%;
  height: 100vh;
  background: radial-gradient(ellipse at 50% 20%, #1a2436 0%, #101825 60%, #0b111c 100%);
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.vwms-header {
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 24px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
}
.vwms-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #7dd3fc;
}
.tool-btn {
  background: transparent;
  border: 1px solid rgba(148, 163, 184, 0.35);
  color: #cbd5e1;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}
.tool-btn:hover { background: rgba(148, 163, 184, 0.12); }
.legend { margin-left: auto; display: flex; align-items: center; gap: 14px; font-size: 12px; color: #94a3b8; }
.legend-item { display: inline-flex; align-items: center; gap: 5px; }
.legend-item i { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }

.state-hint {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 14px;
}

/* 3D 场景 */
.scene-wrap { flex: 1; overflow: auto; padding: 40px 60px; }
.scene {
  position: relative;
  min-width: 1100px;
  min-height: 640px;
  perspective: 1400px;
  display: flex;
  flex-wrap: wrap;
  gap: 36px 44px;
  align-content: flex-start;
}
.floor {
  position: absolute;
  inset: -60px;
  background:
    linear-gradient(rgba(56, 189, 248, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(56, 189, 248, 0.06) 1px, transparent 1px);
  background-size: 60px 60px;
  border-radius: 12px;
  pointer-events: none;
}
.shelf {
  position: relative;
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 8px;
  padding: 26px 12px 12px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
}
.shelf-label {
  position: absolute;
  top: 5px;
  left: 12px;
  font-size: 11px;
  color: #7dd3fc;
  letter-spacing: 1px;
}
.shelf-grid { display: grid; gap: 6px; }
.cell {
  width: 34px;
  height: 30px;
  border-radius: 4px;
  border: 1px solid rgba(15, 23, 42, 0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.cell:hover { transform: translateY(-3px) scale(1.08); box-shadow: 0 6px 14px rgba(0, 0, 0, 0.5); z-index: 2; }
.cell.empty { cursor: default; }
.cell.active { outline: 2px solid #38bdf8; outline-offset: 1px; }
.cell-qty { font-size: 10px; font-weight: 700; color: rgba(15, 23, 42, 0.85); }

/* 详情弹层 */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}
.modal {
  width: 520px;
  max-height: 70vh;
  background: #16202f;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
}
.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
}
.modal-title { font-weight: 700; color: #7dd3fc; }
.modal-body { padding: 14px 18px; overflow: auto; }
.detail-row { display: flex; align-items: baseline; gap: 8px; padding: 6px 0; }
.detail-label { color: #94a3b8; font-size: 12px; }
.qty { color: #38bdf8; font-size: 16px; }
.detail-block { border-top: 1px dashed rgba(148, 163, 184, 0.15); margin-top: 6px; padding-top: 6px; }
.detail-line { font-size: 12px; color: #94a3b8; padding: 2px 0 2px 14px; }
</style>
