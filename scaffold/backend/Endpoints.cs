using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace WmsScaffold;

public record RegisterInput(string Username, string Password);
public record LoginInput(string Username, string Password);
public record InboundCreateInput(string Supplier, List<InboundItemInput> Items);
public record InboundItemInput(int SkuId, int Qty);
public record PutawayInput(int ItemId, int LocationId);
public record OutboundCreateInput(string Customer, List<OutboundItemInput> Items);
public record OutboundItemInput(int SkuId, int Qty);
public record StockTakeCreateInput(int SkuId, int LocationId, int CountedQty);
public record AdjustInput(int SkuId, int LocationId, int Qty, string SeriesNumber = "");

public static class Endpoints
{
    public static RouteGroupBuilder MapApi(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("/api");

        // ---------- 认证 ----------
        var auth = api.MapGroup("/auth");
        auth.MapPost("/register", async Task<IResult> (RegisterInput input, AppDbContext db) =>
        {
            if (await db.Users.AnyAsync(u => u.Username == input.Username))
                return Results.BadRequest(new { msg = "用户已存在" });
            var (hash, salt) = PasswordUtil.Hash(input.Password);
            var user = new User { Username = input.Username, PasswordHash = hash, Salt = salt };
            db.Users.Add(user);
            await db.SaveChangesAsync();
            return Results.Ok(new { data = user.Id });
        });

        auth.MapPost("/login", async Task<IResult> (LoginInput input, AppDbContext db, IConfiguration cfg) =>
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Username == input.Username);
            if (user == null || !PasswordUtil.Verify(input.Password, user.PasswordHash, user.Salt))
                return Results.Unauthorized();
            return Results.Ok(new { token = GenerateJwt(user, cfg) });
        });

        // ---------- 基础资料 ----------
        var master = api.MapGroup("/master").RequireAuthorization();
        master.MapGet("/locations", async (AppDbContext db) =>
            await db.Locations.Select(l => new { l.Id, l.Name, l.WarehouseId }).ToListAsync());

        master.MapGet("/skus", async (AppDbContext db) =>
            await db.Skus.Select(s => new { s.Id, s.Code, s.Name, s.Unit, s.Price }).ToListAsync());

        // ---------- 库存 ----------
        var stock = api.MapGroup("/stock").RequireAuthorization();
        stock.MapGet("", async (AppDbContext db) =>
            await (from s in db.Stocks
                   join k in db.Skus on s.SkuId equals k.Id
                   join l in db.Locations on s.LocationId equals l.Id
                   select new { s.SkuId, SkuName = k.Name, Location = l.Name, s.Qty, s.SeriesNumber, s.IsFreeze })
                  .ToListAsync());

        stock.MapPost("/adjust", async (AdjustInput input, AppDbContext db, StockService svc, ClaimsPrincipal me) =>
        {
            var qty = input.Qty;
            if (qty > 0)
                await svc.AddStockAsync(input.SkuId, input.LocationId, qty, input.SeriesNumber, 0, "ADJ", 4, 0, me.Identity?.Name ?? "");
            else if (qty < 0)
                await svc.DeductStockAsync(input.SkuId, input.LocationId, -qty, "ADJ", 4, 0, me.Identity?.Name ?? "");
            return Results.Ok(new { msg = "ok" });
        });

        // ---------- 入库 ----------
        var inbound = api.MapGroup("/inbound").RequireAuthorization();
        inbound.MapPost("", async (InboundCreateInput input, AppDbContext db) =>
        {
            var order = new InboundOrder
            {
                OrderNo = $"ASN{DateTime.Now:yyyyMMddHHmmss}",
                Supplier = input.Supplier,
                Status = 0
            };
            foreach (var i in input.Items)
                order.Items.Add(new InboundItem { SkuId = i.SkuId, Qty = i.Qty, ActualQty = i.Qty });
            db.InboundOrders.Add(order);
            await db.SaveChangesAsync();
            return Results.Ok(new { data = new { order.Id, order.OrderNo } });
        });

        inbound.MapPost("/{id}/confirm", async Task<IResult> (int id, AppDbContext db) =>
        {
            var order = await db.InboundOrders.Include(o => o.Items).FirstAsync(o => o.Id == id);
            if (order.Status != 0) return Results.BadRequest(new { msg = "状态不允许确认" });
            order.Status = 1;
            order.Items.ForEach(i => i.Status = 1);
            await db.SaveChangesAsync();
            return Results.Ok(new { msg = "已确认，待上架" });
        });

        inbound.MapPost("/{id}/putaway", async Task<IResult> (int id, PutawayInput input, AppDbContext db, StockService svc, ClaimsPrincipal me) =>
        {
            var order = await db.InboundOrders.Include(o => o.Items).FirstAsync(o => o.Id == id);
            if (order.Status != 1) return Results.BadRequest(new { msg = "订单未确认" });
            var item = order.Items.First(i => i.Id == input.ItemId);

            var jobCode = order.OrderNo;
            await svc.AddStockAsync(item.SkuId, input.LocationId, item.ActualQty, "",
                0, jobCode, 1, item.Id, me.Identity?.Name ?? "");

            item.Status = 2;
            item.PutawayLocationId = input.LocationId;
            if (order.Items.All(i => i.Status == 2)) order.Status = 2;
            await db.SaveChangesAsync();
            return Results.Ok(new { msg = "上架成功" });
        });

        // ---------- 出库 ----------
        var outbound = api.MapGroup("/outbound").RequireAuthorization();
        outbound.MapPost("", async (OutboundCreateInput input, AppDbContext db) =>
        {
            var order = new OutboundOrder
            {
                OrderNo = $"SO{DateTime.Now:yyyyMMddHHmmss}",
                Customer = input.Customer,
                Status = 1
            };
            foreach (var i in input.Items)
                order.Items.Add(new OutboundItem { SkuId = i.SkuId, Qty = i.Qty });
            db.OutboundOrders.Add(order);
            await db.SaveChangesAsync();
            return Results.Ok(new { data = new { order.Id, order.OrderNo } });
        });

        // 确认订单：按 FIFO 分配库位（相当于 ModernWMS 的 lock_qty 锁定）
        outbound.MapPost("/{id}/confirm", async Task<IResult> (int id, AppDbContext db, StockService svc) =>
        {
            var order = await db.OutboundOrders.Include(o => o.Items).FirstAsync(o => o.Id == id);
            if (order.Status != 1) return Results.BadRequest(new { msg = "状态不允许确认" });
            foreach (var item in order.Items)
            {
                var allocations = await svc.AllocateAsync(item.SkuId, item.Qty);
                // 脚手架简化：单库位分配；多库位拆行可在此扩展
                item.LocationId = allocations[0].Item1;
                item.IsUpdateStock = true;
            }
            await db.SaveChangesAsync();
            return Results.Ok(new { msg = "已确认并分配库位，待拣货" });
        });

        // 拣货出库：扣库存
        outbound.MapPost("/{id}/pick", async Task<IResult> (int id, AppDbContext db, StockService svc, ClaimsPrincipal me) =>
        {
            var order = await db.OutboundOrders.Include(o => o.Items).FirstAsync(o => o.Id == id);
            if (order.Status != 1) return Results.BadRequest(new { msg = "订单未确认" });
            foreach (var item in order.Items.Where(i => i.IsUpdateStock))
                await svc.DeductStockAsync(item.SkuId, item.LocationId, item.Qty,
                    order.OrderNo, 2, item.Id, me.Identity?.Name ?? "");
            order.Status = 2;
            await db.SaveChangesAsync();
            return Results.Ok(new { msg = "拣货完成，库存已扣减" });
        });

        outbound.MapPost("/{id}/cancel", async Task<IResult> (int id, AppDbContext db) =>
        {
            var order = await db.OutboundOrders.FirstAsync(o => o.Id == id);
            if (order.Status == 2) return Results.BadRequest(new { msg = "已拣货不可取消" });
            order.Status = 3;
            await db.SaveChangesAsync();
            return Results.Ok(new { msg = "已取消" });
        });

        // ---------- 盘点 ----------
        var take = api.MapGroup("/stocktake").RequireAuthorization();
        take.MapPost("", async (StockTakeCreateInput input, AppDbContext db, ClaimsPrincipal me) =>
        {
            var bookQty = await db.Stocks.Where(s => s.SkuId == input.SkuId && s.LocationId == input.LocationId)
                                         .SumAsync(s => s.Qty);
            var job = new StockTake
            {
                JobCode = $"TAKE{DateTime.Now:yyyyMMddHHmmss}",
                SkuId = input.SkuId, LocationId = input.LocationId,
                BookQty = bookQty, CountedQty = input.CountedQty,
                Creator = me.Identity?.Name ?? ""
            };
            db.StockTakes.Add(job);
            await db.SaveChangesAsync();
            return Results.Ok(new { data = new { job.Id, job.JobCode, job.BookQty, diff = input.CountedQty - bookQty } });
        });

        take.MapPost("/{id}/confirm", async Task<IResult> (int id, AppDbContext db, StockService svc, ClaimsPrincipal me) =>
        {
            var job = await db.StockTakes.FirstAsync(t => t.Id == id);
            if (job.Confirmed) return Results.BadRequest(new { msg = "已处理" });
            var diff = job.CountedQty - job.BookQty;
            if (diff > 0)
                await svc.AddStockAsync(job.SkuId, job.LocationId, diff, "", 0, job.JobCode, 3, job.Id, me.Identity?.Name ?? "");
            else if (diff < 0)
                await svc.DeductStockAsync(job.SkuId, job.LocationId, -diff, job.JobCode, 3, job.Id, me.Identity?.Name ?? "");
            job.Confirmed = true;
            await db.SaveChangesAsync();
            return Results.Ok(new { msg = $"盘点差异 {diff} 已过账" });
        });

        return api;
    }

    private static string GenerateJwt(User user, IConfiguration cfg)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            cfg["Jwt:Key"] ?? "wms-scaffold-dev-key-change-me-32chars!"));
        var claims = new List<Claim> { new(ClaimTypes.Name, user.Username) };
        var token = new JwtSecurityToken(
            issuer: cfg["Jwt:Issuer"] ?? "wms-scaffold",
            audience: cfg["Jwt:Audience"] ?? "wms-scaffold",
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(120),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
