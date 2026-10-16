<template>
  <div class="screen">
    <!-- 顶栏 -->
    <header class="screen-header">
      <button class="back-btn" @click="$router.push('/home')">‹ 返回控制台</button>
      <div class="screen-title">
        <span class="deco left" />
        <h1>ModernWMS 数据大屏</h1>
        <span class="deco right" />
      </div>
      <div class="screen-clock">
        <div class="clock-time">{{ clock }}</div>
        <div class="clock-date">{{ today }}</div>
      </div>
    </header>

    <!-- 主体三栏 -->
    <div class="screen-body">
      <!-- 左列 -->
      <section class="col">
        <div class="panel">
          <div class="panel-title">库存 Top10（按 SKU）</div>
          <VChart :option="topOption" height="calc(100% - 34px)" />
        </div>
        <div class="panel">
          <div class="panel-title">库龄分布</div>
          <VChart :option="ageOption" height="calc(100% - 34px)" />
        </div>
      </section>

      <!-- 中列 -->
      <section class="col col-center">
        <div class="kpi-row">
          <div v-for="k in kpis" :key="k.label" class="kpi-card">
            <div class="kpi-num">{{ k.value }}</div>
            <div class="kpi-label">{{ k.label }}</div>
          </div>
        </div>
        <div class="panel panel-grow">
          <div class="panel-title">近 14 天出入库趋势</div>
          <VChart :option="trendOption" height="calc(100% - 34px)" />
        </div>
      </section>

      <!-- 右列 -->
      <section class="col">
        <div class="panel">
          <div class="panel-title">入库单状态分布</div>
          <VChart :option="asnStatusOption" height="calc(100% - 34px)" />
        </div>
        <div class="panel">
          <div class="panel-title">发货单状态分布</div>
          <VChart :option="dispatchStatusOption" height="calc(100% - 34px)" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import VChart from '@/components/VChart.vue'
import { stockApi, asnApi, dispatchApi, pageSearch } from '@/api'

// ---- 状态枚举（与原版一致）----
const ASN_STATUS: Record<number, string> = { 0: '待到货', 1: '待卸货', 2: '待分拣', 3: '待上架', 4: '已入库' }
const DISPATCH_STATUS: Record<number, string> = { 0: '新订单', 1: '待拣货', 2: '待打包', 3: '待称重', 4: '待发运', 5: '待签收', 6: '已签收' }
const AGE_BUCKETS = ['0-30天', '31-90天', '91-180天', '181-365天', '365天以上']

// ---- 主题色 ----
const CYAN = '#38bdf8'
const AMBER = '#fbbf24'
const GREEN = '#34d399'
const PURPLE = '#a78bfa'
const PINK = '#f472b6'
const PALETTE = [CYAN, GREEN, AMBER, PURPLE, PINK, '#60a5fa', '#f87171', '#4ade80', '#fb923c', '#22d3ee']

const darkText = { color: '#cbd5e1' }

// ---- 数据 ----
const stockRows = ref<any[]>([])
const ageRows = ref<any[]>([])
const asnRows = ref<any[]>([])
const dispatchRows = ref<any[]>([])

// ---- 时钟 ----
const clock = ref('')
const today = ref('')
let clockTimer: number | undefined
function tick() {
  const d = new Date()
  clock.value = d.toLocaleTimeString('zh-CN', { hour12: false })
  today.value = d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
}

// ---- KPI ----
const kpis = computed(() => {
  const totalQty = stockRows.value.reduce((s, r) => s + (Number(r.qty) || 0), 0)
  const skuCount = new Set(stockRows.value.map((r) => r.sku_name || r.spu_name).filter(Boolean)).size
  const openAsn = asnRows.value.filter((r) => Number(r.asn_status) < 4).length
  const openDispatch = dispatchRows.value.filter((r) => Number(r.dispatch_status) < 6).length
  return [
    { label: '库存总量', value: fmt(totalQty) },
    { label: 'SKU 种类', value: fmt(skuCount) },
    { label: '在途入库单', value: fmt(openAsn) },
    { label: '在途发货单', value: fmt(openDispatch) }
  ]
})

function fmt(n: number): string {
  return n >= 10000 ? (n / 10000).toFixed(1) + 'w' : String(n)
}

// ---- 库存 Top10 ----
const topOption = computed(() => {
  const sums = new Map<string, number>()
  for (const r of stockRows.value) {
    const key = String(r.sku_name || r.spu_name || '未知')
    sums.set(key, (sums.get(key) || 0) + (Number(r.qty) || 0))
  }
  const top = [...sums.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).reverse()
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 10, right: 40, top: 10, bottom: 10, containLabel: true },
    xAxis: { type: 'value', axisLabel: { ...darkText }, splitLine: { lineStyle: { color: 'rgba(56,189,248,0.12)' } } },
    yAxis: { type: 'category', data: top.map((t) => t[0]), axisLabel: { ...darkText, width: 90, overflow: 'truncate' } },
    series: [{
      type: 'bar',
      data: top.map((t) => t[1]),
      barWidth: 12,
      itemStyle: {
        borderRadius: [0, 6, 6, 0],
        color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#0ea5e9' }, { offset: 1, color: CYAN }] }
      },
      label: { show: true, position: 'right', color: '#7dd3fc', fontSize: 11 }
    }]
  }
})

// ---- 库龄分布 ----
const ageOption = computed(() => {
  const sums = new Array(5).fill(0)
  for (const r of ageRows.value) {
    const days = Number(r.age ?? r.stock_age ?? 0)
    const i = days <= 30 ? 0 : days <= 90 ? 1 : days <= 180 ? 2 : days <= 365 ? 3 : 4
    sums[i] += Number(r.qty) || 0
  }
  return {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { ...darkText, fontSize: 11 }, itemWidth: 12, itemHeight: 8 },
    series: [{
      type: 'pie',
      radius: ['42%', '68%'],
      center: ['50%', '44%'],
      label: { ...darkText, fontSize: 11, formatter: '{b}\n{c}' },
      itemStyle: { borderColor: '#0a1628', borderWidth: 2 },
      data: AGE_BUCKETS.map((name, i) => ({ name, value: sums[i] })).filter((d) => d.value > 0),
      color: [GREEN, CYAN, AMBER, '#fb923c', '#f87171']
    }]
  }
})

// ---- 出入库趋势 ----
function last14Days(): string[] {
  const days: string[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

const trendOption = computed(() => {
  const days = last14Days()
  const inCounts = new Map<string, number>()
  const outCounts = new Map<string, number>()
  for (const r of asnRows.value) {
    const day = String(r.create_time || '').slice(0, 10)
    inCounts.set(day, (inCounts.get(day) || 0) + 1)
  }
  for (const r of dispatchRows.value) {
    const day = String(r.create_time || '').slice(0, 10)
    outCounts.set(day, (outCounts.get(day) || 0) + 1)
  }
  return {
    tooltip: { trigger: 'axis' },
    legend: { top: 4, textStyle: { ...darkText, fontSize: 11 }, itemWidth: 14 },
    grid: { left: 44, right: 20, top: 36, bottom: 30 },
    xAxis: {
      type: 'category',
      data: days.map((d) => d.slice(5)),
      axisLabel: { ...darkText },
      boundaryGap: false
    },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { ...darkText }, splitLine: { lineStyle: { color: 'rgba(56,189,248,0.12)' } } },
    series: [
      {
        name: '入库单',
        type: 'line',
        smooth: true,
        data: days.map((d) => inCounts.get(d) || 0),
        lineStyle: { color: CYAN, width: 2 },
        itemStyle: { color: CYAN },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(56,189,248,0.35)' }, { offset: 1, color: 'rgba(56,189,248,0)' }] } }
      },
      {
        name: '发货单',
        type: 'line',
        smooth: true,
        data: days.map((d) => outCounts.get(d) || 0),
        lineStyle: { color: AMBER, width: 2 },
        itemStyle: { color: AMBER },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(251,191,36,0.3)' }, { offset: 1, color: 'rgba(251,191,36,0)' }] } }
      }
    ]
  }
})

// ---- 状态分布（入库 / 发货）----
function statusPie(rows: any[], getStatus: (r: any) => number, enumMap: Record<number, string>, colors: string[]) {
  const counts = new Map<string, number>()
  for (const r of rows) {
    const name = enumMap[getStatus(r)] || '未知'
    counts.set(name, (counts.get(name) || 0) + 1)
  }
  return {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { ...darkText, fontSize: 11 }, itemWidth: 12, itemHeight: 8 },
    series: [{
      type: 'pie',
      radius: ['42%', '68%'],
      center: ['50%', '44%'],
      label: { ...darkText, fontSize: 11, formatter: '{b}: {c}' },
      itemStyle: { borderColor: '#0a1628', borderWidth: 2 },
      data: [...counts.entries()].map(([name, value]) => ({ name, value })),
      color: colors
    }]
  }
}

const asnStatusOption = computed(() =>
  statusPie(asnRows.value, (r) => Number(r.asn_status), ASN_STATUS, ['#64748b', '#60a5fa', CYAN, AMBER, GREEN])
)

const dispatchStatusOption = computed(() =>
  statusPie(dispatchRows.value, (r) => Number(r.dispatch_status), DISPATCH_STATUS, ['#64748b', '#60a5fa', CYAN, AMBER, '#fb923c', PINK, GREEN])
)

// ---- 加载 ----
async function load() {
  const [stock, age, asn, dispatch] = await Promise.allSettled([
    stockApi.stockList(pageSearch({ pageIndex: 1, pageSize: 1000 })),
    stockApi.stockAgeList(pageSearch({ pageIndex: 1, pageSize: 1000 })),
    asnApi.masterList(pageSearch({ pageIndex: 1, pageSize: 500 })),
    dispatchApi.list(pageSearch({ pageIndex: 1, pageSize: 500 }))
  ])
  if (stock.status === 'fulfilled') stockRows.value = (stock.value.rows as any[]) || []
  if (age.status === 'fulfilled') ageRows.value = (age.value.rows as any[]) || []
  if (asn.status === 'fulfilled') asnRows.value = (asn.value.rows as any[]) || []
  if (dispatch.status === 'fulfilled') dispatchRows.value = (dispatch.value.rows as any[]) || []
}

onMounted(() => {
  tick()
  clockTimer = window.setInterval(tick, 1000)
  load()
})

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer)
})
</script>

<style scoped>
.screen {
  width: 100vw;
  height: 100vh;
  background: radial-gradient(ellipse at 50% 0%, #10233f 0%, #0a1628 55%, #060f1f 100%);
  color: #cbd5e1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶栏 */
.screen-header {
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid rgba(56, 189, 248, 0.18);
  background: linear-gradient(180deg, rgba(56, 189, 248, 0.08), transparent);
}
.screen-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
}
.screen-title h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 4px;
  color: #e0f2fe;
  text-shadow: 0 0 18px rgba(56, 189, 248, 0.5);
}
.deco {
  width: 90px;
  height: 3px;
  background: linear-gradient(90deg, transparent, #38bdf8);
}
.deco.right { transform: rotate(180deg); }
.back-btn {
  background: transparent;
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: #7dd3fc;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}
.back-btn:hover { background: rgba(56, 189, 248, 0.12); }
.screen-clock { text-align: right; }
.clock-time { font-size: 20px; font-weight: 700; color: #7dd3fc; font-variant-numeric: tabular-nums; }
.clock-date { font-size: 12px; opacity: 0.7; }

/* 主体 */
.screen-body {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1.3fr 1fr;
  gap: 14px;
  padding: 14px;
  min-height: 0;
}
.col {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 14px;
  min-height: 0;
}
.col-center { grid-template-rows: auto 1fr; }
.panel {
  background: rgba(15, 35, 65, 0.55);
  border: 1px solid rgba(56, 189, 248, 0.18);
  border-radius: 10px;
  padding: 12px;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.panel-grow { flex: 1; }
.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #7dd3fc;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(56, 189, 248, 0.15);
  flex-shrink: 0;
}
.panel-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 12px;
  margin-right: 8px;
  background: #38bdf8;
  border-radius: 2px;
  vertical-align: -1px;
}

/* KPI */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  flex-shrink: 0;
}
.kpi-card {
  background: linear-gradient(160deg, rgba(56, 189, 248, 0.12), rgba(15, 35, 65, 0.6));
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 10px;
  text-align: center;
  padding: 16px 8px 12px;
}
.kpi-num {
  font-size: 30px;
  font-weight: 700;
  color: #38bdf8;
  text-shadow: 0 0 14px rgba(56, 189, 248, 0.45);
  font-variant-numeric: tabular-nums;
}
.kpi-label { margin-top: 6px; font-size: 13px; color: #94a3b8; }
</style>
