/**
 * 多数据库建表脚本生成器：复用后端 EF 模型（反射自动注册 BaseModel 实体），
 * GenerateCreateScript 产出权威 DDL（精确类型/主键/索引），杜绝手译 SQLite 的失真。
 * 用法：dotnet run --project schemagen -- <mysql|sqlserver|postgresql> [输出路径]
 * 连接串仅占位（GenerateCreateScript 不真正连库），provider 包由后端 csproj 传递引入。
 */
using Microsoft.EntityFrameworkCore;
using ModernWMS.Core.DBContext;

var provider = (args.Length > 0 ? args[0] : "mysql").ToLower();
var outPath = args.Length > 1 ? args[1] : $"{provider}_schema.sql";

var opts = new DbContextOptionsBuilder<SqlDBContext>();
switch (provider)
{
    case "mysql":
        opts.UseMySql(
            "Server=localhost;Database=wms;User=root;Password=placeholder;",
            new MySqlServerVersion(new Version(8, 0, 36)));
        break;
    case "sqlserver":
        opts.UseSqlServer("Server=localhost;Database=wms;User Id=sa;Password=placeholder;");
        break;
    case "postgresql":
    case "postgres":
        opts.UseNpgsql("Host=localhost;Database=wms;Username=postgres;Password=placeholder;");
        break;
    default:
        throw new ArgumentException($"unknown provider: {provider} (mysql|sqlserver|postgresql)");
}

using var ctx = new SqlDBContext(opts.Options);
var sql = ctx.Database.GenerateCreateScript();
File.WriteAllText(outPath, sql);
Console.WriteLine($"written {outPath} ({sql.Length} chars, {sql.Split("CREATE TABLE").Length - 1} tables)");
