/** 菜单名中文映射（提取自原版 i18n cn.json） */
export const MENU_NAMES: Record<string, string> = {
  stockManagement: '库存管理',
  stockAsn: '收货管理',
  companySetting: '公司信息',
  userRoleSetting: '角色设置',
  roleMenu: '权限设置',
  userManagement: '用户管理',
  commodityCategorySetting: '商品类别设置',
  commodityManagement: '商品管理',
  supplier: '供应商信息',
  warehouseSetting: '仓库设置',
  ownerOfCargo: '货主信息',
  freightSetting: '运费设置',
  customer: '客户信息',
  deliveryManagement: '发货管理',
  warehouseProcessing: '仓内加工',
  warehouseMove: '库存移动',
  warehouseFreeze: '库存冻结',
  warehouseAdjust: '库存调整',
  warehouseTaking: '库存盘点',
  largeScreen: '数据大屏',
  vwms: '3D 库房',
  statAsn: '入库统计',
  statDelivery: '发货统计',
  statSafety: '安全库存',
  statAge: '库龄统计',
  home: '工作台',
  homepage: '首页'
}

export const menuLabel = (name: string) => MENU_NAMES[name] || name
