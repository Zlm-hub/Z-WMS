<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { api } from './api'

const token = ref(localStorage.getItem('token') || '')
const username = ref('')
const password = ref('')
const msg = ref('')

const stock = ref<any[]>([])
const skus = ref<any[]>([])
const locations = ref<any[]>([])

const inSkuId = ref(1)
const inLocId = ref(1)
const inQty = ref(10)
const outSkuId = ref(1)
const outQty = ref(5)

const loggedIn = computed(() => !!token.value)

async function refresh() {
  stock.value = await api.stock()
  skus.value = await api.skus()
  locations.value = await api.locations()
}

async function doLogin(register: boolean) {
  try {
    if (register) await api.register(username.value, password.value)
    await api.login(username.value, password.value)
    token.value = localStorage.getItem('token') || ''
    msg.value = '登录成功'
    await refresh()
  } catch (e: any) {
    msg.value = e?.response?.data?.msg ?? '登录失败'
  }
}

async function doInbound() {
  const r = await api.createInbound('演示供应商', [{ skuId: inSkuId.value, qty: inQty.value }])
  await api.confirmInbound(r.data.id)
  msg.value = `入库单 ${r.data.orderNo} 已确认（上架请调 API 或自行接页面）`
  await refresh()
}

async function doOutbound() {
  const r = await api.createOutbound('演示客户', [{ skuId: outSkuId.value, qty: outQty.value }])
  await api.confirmOutbound(r.data.id)
  await api.pickOutbound(r.data.id)
  msg.value = `出库单 ${r.data.orderNo} 已拣货扣库`
  await refresh()
}

function doLogout() {
  api.logout()
  token.value = ''
}

onMounted(async () => {
  if (loggedIn.value) await refresh()
})
</script>

<template>
  <main style="max-width: 720px; margin: 40px auto; font-family: sans-serif">
    <h1>WMS Scaffold</h1>

    <section v-if="!loggedIn">
      <h2>登录 / 注册</h2>
      <input v-model="username" placeholder="用户名" />
      <input v-model="password" type="password" placeholder="密码" />
      <button @click="doLogin(false)">登录</button>
      <button @click="doLogin(true)">注册并登录</button>
    </section>

    <section v-else>
      <button @click="doLogout">退出</button>
      <h2>库存</h2>
      <table border="1" cellpadding="6">
        <tr><th>商品</th><th>库位</th><th>数量</th><th>冻结</th></tr>
        <tr v-for="s in stock" :key="s.skuId + s.location">
          <td>{{ s.skuName }}</td><td>{{ s.location }}</td><td>{{ s.qty }}</td><td>{{ s.isFreeze ? '是' : '否' }}</td>
        </tr>
        <tr v-if="!stock.length"><td colspan="4">暂无库存（先用下方入库）</td></tr>
      </table>

      <h2>快速入库（创建+确认）</h2>
      <select v-model.number="inSkuId"><option v-for="k in skus" :key="k.id" :value="k.id">{{ k.name }}</option></select>
      <select v-model.number="inLocId"><option v-for="l in locations" :key="l.id" :value="l.id">{{ l.name }}</option></select>
      <input v-model.number="inQty" type="number" min="1" style="width: 80px" />
      <button @click="doInbound">入库</button>

      <h2>快速出库（创建+确认+拣货扣库）</h2>
      <select v-model.number="outSkuId"><option v-for="k in skus" :key="k.id" :value="k.id">{{ k.name }}</option></select>
      <input v-model.number="outQty" type="number" min="1" style="width: 80px" />
      <button @click="doOutbound">出库</button>
    </section>

    <p v-if="msg" style="color: #c60">{{ msg }}</p>
  </main>
</template>
