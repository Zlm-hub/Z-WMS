/**
 * MySQL 建表脚本生成器：复用后端 EF 模型（反射自动注册 BaseModel 实体）+ Pomelo，
 * GenerateCreateScript 产出权威 MySQL DDL（精确类型/主键/索引），杜绝手译 SQLite 的失真。
 * 用法：dotnet run --project schemagen -- <输出路径>
 */
using Microsoft.EntityFrameworkCore;
using ModernWMS.Core.DBContext;

var outPath = args.Length > 0 ? args[0] : "mysql_schema.sql";
var opts = new DbContextOptionsBuilder<SqlDBContext>()
    .UseMySql(
        "Server=localhost;Database=wms;User=root;Password=placeholder;",
        new MySqlServerVersion(new Version(8, 0, 36)))
    .Options;
using var ctx = new SqlDBContext(opts);
var sql = ctx.Database.GenerateCreateScript();
File.WriteAllText(outPath, sql);
Console.WriteLine($"written {outPath} ({sql.Length} chars, {sql.Split("CREATE TABLE").Length - 1} tables)");
