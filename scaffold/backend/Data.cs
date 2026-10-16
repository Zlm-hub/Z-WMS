using Microsoft.EntityFrameworkCore;

namespace WmsScaffold;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Warehouse> Warehouses => Set<Warehouse>();
    public DbSet<GoodsLocation> Locations => Set<GoodsLocation>();
    public DbSet<Sku> Skus => Set<Sku>();
    public DbSet<Stock> Stocks => Set<Stock>();
    public DbSet<StockAdjust> StockAdjusts => Set<StockAdjust>();
    public DbSet<InboundOrder> InboundOrders => Set<InboundOrder>();
    public DbSet<InboundItem> InboundItems => Set<InboundItem>();
    public DbSet<OutboundOrder> OutboundOrders => Set<OutboundOrder>();
    public DbSet<OutboundItem> OutboundItems => Set<OutboundItem>();
    public DbSet<StockTake> StockTakes => Set<StockTake>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        // 库存唯一维度：SKU × 库位 × 序列号（沿用 ModernWMS 的 stock 记账粒度）
        mb.Entity<Stock>()
          .HasIndex(s => new { s.SkuId, s.LocationId, s.SeriesNumber })
          .IsUnique();

        // 显式声明单据明细外键（否则 EF 生成影子外键，OrderId 不会被写入）
        mb.Entity<InboundOrder>().HasMany(o => o.Items).WithOne().HasForeignKey(i => i.OrderId);
        mb.Entity<OutboundOrder>().HasMany(o => o.Items).WithOne().HasForeignKey(i => i.OrderId);

        Seed(mb);
        base.OnModelCreating(mb);
    }

    private static void Seed(ModelBuilder mb)
    {
        mb.Entity<Warehouse>().HasData(new Warehouse { Id = 1, Name = "默认仓库" });
        mb.Entity<GoodsLocation>().HasData(
            new GoodsLocation { Id = 1, WarehouseId = 1, Name = "A-01-01" },
            new GoodsLocation { Id = 2, WarehouseId = 1, Name = "A-01-02" });
        mb.Entity<Sku>().HasData(
            new Sku { Id = 1, Code = "SKU001", Name = "示例商品A", BarCode = "690000000001", Unit = "件", Price = 10m },
            new Sku { Id = 2, Code = "SKU002", Name = "示例商品B", BarCode = "690000000002", Unit = "箱", Price = 55m });
    }
}
