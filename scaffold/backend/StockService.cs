using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace WmsScaffold;

/// <summary>
/// 库存记账服务：唯一允许修改 Stock 的入口（对应 ModernWMS 的 stock + stockadjust 模型）
/// </summary>
public class StockService
{
    private readonly AppDbContext _db;

    public StockService(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>入库记账：Stock 增量 + StockAdjust 流水</summary>
    public async Task AddStockAsync(int skuId, int locationId, int qty, string seriesNumber,
        decimal price, string jobCode, int sourceTable, int sourceId, string creator)
    {
        var stock = await _db.Stocks.FirstOrDefaultAsync(s =>
            s.SkuId == skuId && s.LocationId == locationId && s.SeriesNumber == seriesNumber);

        if (stock == null)
        {
            stock = new Stock
            {
                SkuId = skuId,
                LocationId = locationId,
                SeriesNumber = seriesNumber,
                Qty = qty,
                Price = price,
                PutawayDate = DateTime.Now
            };
            _db.Stocks.Add(stock);
        }
        else
        {
            stock.Qty += qty;
        }

        _db.StockAdjusts.Add(new StockAdjust
        {
            JobCode = jobCode, SkuId = skuId, LocationId = locationId,
            Qty = qty, SourceTable = sourceTable, SourceId = sourceId,
            Creator = creator, CreateTime = DateTime.Now
        });
        await _db.SaveChangesAsync();
    }

    /// <summary>出库记账：从指定库位扣减（冻结库存拒扣），写负数流水</summary>
    public async Task DeductStockAsync(int skuId, int locationId, int qty,
        string jobCode, int sourceTable, int sourceId, string creator)
    {
        var stock = await _db.Stocks.FirstOrDefaultAsync(s =>
            s.SkuId == skuId && s.LocationId == locationId && !s.IsFreeze)
            ?? throw new InvalidOperationException($"库位 {locationId} 无可用库存");

        if (stock.Qty < qty)
            throw new InvalidOperationException($"库存不足：现有 {stock.Qty}，需要 {qty}");

        stock.Qty -= qty;
        _db.StockAdjusts.Add(new StockAdjust
        {
            JobCode = jobCode, SkuId = skuId, LocationId = locationId,
            Qty = -qty, SourceTable = sourceTable, SourceId = sourceId,
            Creator = creator, CreateTime = DateTime.Now
        });
        await _db.SaveChangesAsync();
    }

    /// <summary>按 FIFO（上架时间早的先用）给一个 SKU 分配库位，返回 (库位, 可用量) 列表</summary>
    public async Task<List<(int LocationId, int Available)>> AllocateAsync(int skuId, int needQty)
    {
        var stocks = await _db.Stocks
            .Where(s => s.SkuId == skuId && !s.IsFreeze && s.Qty > 0)
            .OrderBy(s => s.PutawayDate)
            .ToListAsync();

        var result = new List<(int, int)>();
        foreach (var s in stocks)
        {
            if (needQty <= 0) break;
            var take = Math.Min(s.Qty, needQty);
            result.Add((s.LocationId, take));
            needQty -= take;
        }
        if (needQty > 0) throw new InvalidOperationException($"SKU {skuId} 可用库存不足，还缺 {needQty}");
        return result;
    }
}

/// <summary>密码：PBKDF2-HMAC-SHA256（修正原项目 MD5 的问题）</summary>
public static class PasswordUtil
{
    private const int Iterations = 100_000;

    public static (string Hash, string Salt) Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, HashAlgorithmName.SHA256, 32);
        return (Convert.ToBase64String(hash), Convert.ToBase64String(salt));
    }

    public static bool Verify(string password, string hash, string salt)
    {
        var expected = Convert.FromBase64String(hash);
        var actual = Rfc2898DeriveBytes.Pbkdf2(password, Convert.FromBase64String(salt),
            Iterations, HashAlgorithmName.SHA256, 32);
        return CryptographicOperations.FixedTimeEquals(expected, actual);
    }
}
