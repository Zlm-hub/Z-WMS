/*
 * 库存流水写入器（stockadjust 的唯一出口）
 */

using System;
using ModernWMS.WMS.Entities.Models;

namespace ModernWMS.WMS.Services
{
    /// <summary>
    /// stockadjust 库存流水写入器。
    ///
    /// 口径：只要一张作业单让 stock 表的 qty 发生变化，就必须留下一行流水，
    /// qty 带符号（减少为负），job_code 指向来源单号、source_table_id 指向来源单据主键。
    ///
    /// 上游只在盘点（job_type=1）和仓内加工（job_type=2）里写了流水，入库上架、出库发运、
    /// 移库这三类同样改库存的作业一行都不写，导致「库存调整」页永远看不到它们的痕迹，
    /// 账实对不上时只能靠翻各自的单据表人工比对。这里把三类补齐。
    ///
    /// 调用约定：只 Add 到 DbContext，不自己 SaveChanges —— 必须和库存变更在同一个事务里落库，
    /// 否则会出现「库存动了、流水没动」或反之的半截数据。
    /// </summary>
    public static class StockadjustWriter
    {
        /// <summary>
        /// 盘点
        /// </summary>
        public const byte JOB_TYPE_STOCKTAKING = 1;

        /// <summary>
        /// 仓内加工
        /// </summary>
        public const byte JOB_TYPE_PROCESS = 2;

        /// <summary>
        /// 拆分加工（历史枚举，当前加工单统一写 2，保留以免既有数据错位）
        /// </summary>
        public const byte JOB_TYPE_SPLIT = 3;

        /// <summary>
        /// 移库
        /// </summary>
        public const byte JOB_TYPE_MOVE = 4;

        /// <summary>
        /// 入库上架（qty 为正）
        /// </summary>
        public const byte JOB_TYPE_PUTAWAY = 5;

        /// <summary>
        /// 出库发运（qty 为负）
        /// </summary>
        public const byte JOB_TYPE_DELIVERY = 6;

        /// <summary>
        /// 构造一条库存流水
        /// </summary>
        /// <param name="job_code">来源单号</param>
        /// <param name="job_type">作业类型</param>
        /// <param name="source_table_id">来源单据主键</param>
        /// <param name="sku_id">规格 id</param>
        /// <param name="goods_owner_id">货主 id</param>
        /// <param name="goods_location_id">库位 id（发生变动的那一侧）</param>
        /// <param name="qty">变动数量，减少为负</param>
        /// <param name="series_number">序列号</param>
        /// <param name="expiry_date">效期</param>
        /// <param name="price">单价</param>
        /// <param name="putaway_date">入库日期</param>
        /// <param name="creator">操作人</param>
        /// <param name="tenant_id">租户</param>
        /// <param name="now_time">发生时间</param>
        /// <returns>待写入的流水实体</returns>
        public static StockadjustEntity Build(
            string job_code,
            byte job_type,
            int source_table_id,
            int sku_id,
            int goods_owner_id,
            int goods_location_id,
            int qty,
            string series_number,
            DateTime expiry_date,
            decimal price,
            DateTime putaway_date,
            string creator,
            long tenant_id,
            DateTime now_time)
        {
            return new StockadjustEntity
            {
                job_code = job_code ?? string.Empty,
                job_type = job_type,
                source_table_id = source_table_id,
                sku_id = sku_id,
                goods_owner_id = goods_owner_id,
                goods_location_id = goods_location_id,
                qty = qty,
                series_number = series_number ?? string.Empty,
                expiry_date = expiry_date,
                price = price,
                putaway_date = putaway_date,
                creator = creator ?? string.Empty,
                create_time = now_time,
                last_update_time = now_time,
                tenant_id = tenant_id,
                is_update_stock = true,
            };
        }
    }
}
