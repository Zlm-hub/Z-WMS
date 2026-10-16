namespace WmsScaffold;

// ============ 领域模型（从 ModernWMS 逆向提炼的核心记账模型） ============
// 核心思想：Stock 是唯一事实，StockAdjust 是统一流水（可溯源）。

public abstract class Entity
{
    public int Id { get; set; }
}

public class Warehouse : Entity
{
    public string Name { get; set; } = "";
}

/// <summary>库位</summary>
public class GoodsLocation : Entity
{
    public int WarehouseId { get; set; }
    public string Name { get; set; } = "";
}

/// <summary>商品（SKU）</summary>
public class Sku : Entity
{
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string BarCode { get; set; } = "";
    public string Unit { get; set; } = "";
    public decimal Price { get; set; }
}

/// <summary>库存：粒度 = SKU × 库位 × 序列号（批次/效期可在此维度上扩展）</summary>
public class Stock : Entity
{
    public int SkuId { get; set; }
    public int LocationId { get; set; }
    public int Qty { get; set; }
    public string SeriesNumber { get; set; } = "";
    public bool IsFreeze { get; set; }
    public decimal Price { get; set; }
    public DateTime PutawayDate { get; set; }
}

/// <summary>库存流水：所有 Stock 变动的唯一入口，Qty 正=入 负=出，可按来源单据溯源</summary>
public class StockAdjust : Entity
{
    public string JobCode { get; set; } = "";
    public int SkuId { get; set; }
    public int LocationId { get; set; }
    public int Qty { get; set; }
    /// <summary>来源：1=入库 2=出库 3=盘点 4=调整</summary>
    public int SourceTable { get; set; }
    public int SourceId { get; set; }
    public string Creator { get; set; } = "";
    public DateTime CreateTime { get; set; } = DateTime.Now;
}

// ============ 入库 ============

public class InboundOrder : Entity
{
    public string OrderNo { get; set; } = "";
    /// <summary>0 待确认 1 已确认 2 已上架(完成)</summary>
    public int Status { get; set; }
    public string Supplier { get; set; } = "";
    public DateTime CreateTime { get; set; } = DateTime.Now;
    public List<InboundItem> Items { get; set; } = new();
}

public class InboundItem : Entity
{
    public int OrderId { get; set; }
    public int SkuId { get; set; }
    public int Qty { get; set; }
    public int ActualQty { get; set; }
    /// <summary>0 待确认 1 待上架 2 已上架</summary>
    public int Status { get; set; }
    public int PutawayLocationId { get; set; }
}

// ============ 出库 ============

public class OutboundOrder : Entity
{
    public string OrderNo { get; set; } = "";
    public string Customer { get; set; } = "";
    /// <summary>1 待拣货 2 已拣货(完成) 3 已取消</summary>
    public int Status { get; set; }
    public DateTime CreateTime { get; set; } = DateTime.Now;
    public List<OutboundItem> Items { get; set; } = new();
}

public class OutboundItem : Entity
{
    public int OrderId { get; set; }
    public int SkuId { get; set; }
    public int Qty { get; set; }
    public int PickedQty { get; set; }
    /// <summary>确认订单时按 FIFO 分配的库位</summary>
    public int LocationId { get; set; }
    public bool IsUpdateStock { get; set; }
}

// ============ 盘点 ============

public class StockTake : Entity
{
    public string JobCode { get; set; } = "";
    public int SkuId { get; set; }
    public int LocationId { get; set; }
    public int BookQty { get; set; }
    public int CountedQty { get; set; }
    public bool Confirmed { get; set; }
    public string Creator { get; set; } = "";
}

// ============ 用户 ============

public class User : Entity
{
    public string Username { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string Salt { get; set; } = "";
}
