#!/usr/bin/env python3
"""
SQLite seed (wms.db) -> MySQL seed 数据转换器。
列清单以 mysql_schema.sql（EF 生成的权威 DDL）为准，逐表生成显式列 INSERT。
特殊处理：MinDate '0001-01-01...' -> '1000-01-01...'（MySQL DATETIME 下限 1000 年）。
用法：python seed2mysql.py <wms.db> <mysql_schema.sql> <输出.sql>
"""
import sqlite3
import re
import sys

db_path, ddl_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3]

ddl = open(ddl_path, encoding='utf-8').read()
tables = {}  # name -> [columns]
for m in re.finditer(r'CREATE TABLE `(\w+)` \((.*?)\n\) CHARACTER SET=utf8mb4;', ddl, re.S):
    name, body = m.group(1), m.group(2)
    cols = re.findall(r'^\s*`(\w+)`', body, re.M)
    tables[name] = cols

con = sqlite3.connect(db_path)
con.row_factory = sqlite3.Row
sq_tables = set(r[0] for r in con.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"))

MIN_DATE_FIX = ("0001-01-01", "1000-01-01")

def esc(v):
    if v is None:
        return 'NULL'
    if isinstance(v, bytes):
        return "X'" + v.hex() + "'"
    if isinstance(v, (int, float)):
        return repr(v)
    s = str(v)
    for old, new in (MIN_DATE_FIX,):
        if s.startswith(old):
            s = new + s[len(old):]
    return "'" + s.replace('\\', '\\\\').replace("'", "''") + "'"

out = ["-- Z-WMS MySQL seed 数据（由 SQLite seed 转换，列清单对齐 mysql_schema.sql）",
       "SET NAMES utf8mb4;",
       "SET FOREIGN_KEY_CHECKS = 0;",
       "SET UNIQUE_CHECKS = 0;",
       "BEGIN;"]
skipped, rows_total = [], 0
for name in sorted(tables):
    if name == '__EFMigrationsHistory':
        skipped.append(name)
        continue
    cols = tables[name]
    if name not in sq_tables:
        skipped.append(name + ' (not in sqlite)')
        continue
    sq_cols = [r[1] for r in con.execute(f'PRAGMA table_info("{name}")')]
    use = [c for c in cols if c in sq_cols]
    missing = [c for c in cols if c not in sq_cols]
    if missing:
        skipped.append(f'{name} (missing cols: {missing})')
    n = 0
    for row in con.execute(f'SELECT {", ".join(chr(34)+c+chr(34) for c in use)} FROM "{name}"'):
        vals = ', '.join(esc(row[c]) for c in use)
        out.append(f'INSERT INTO `{name}` ({", ".join("`"+c+"`" for c in use)}) VALUES ({vals});')
        n += 1
    rows_total += n
    out.append('')

out += ['COMMIT;', 'SET FOREIGN_KEY_CHECKS = 1;', 'SET UNIQUE_CHECKS = 1;']
open(out_path, 'w', encoding='utf-8', newline='\n').write('\n'.join(out))
print(f'tables={len(tables)-1} rows={rows_total} -> {out_path}')
if skipped:
    print('skipped:', skipped)
