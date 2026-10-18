/**
 * 套件 s4：入库链路自建测试数据（复用 lib/inbound.js）
 * 走完整入库 14 步，产出 4 条 qty=1 的 RT<tag> 测试库存，供 s5 仓内作业使用
 */
module.exports = async function run(ctx) {
  const { report } = ctx
  return require('../lib/inbound').buildInboundStock(ctx, 4, 's4_inbound')
    .then((d) => { report.step('s4_inbound', 'done', true, `tag=${d.tag} stocks=${d.stocks.length}`); return d })
}
