#!/usr/bin/env python3
"""
SQLite seed (wms.db) -> 任意方言 seed 数据转换器（mysql | sqlserver | postgres）。
列清单以对应 *_schema.sql（EF GenerateCreateScript 权威 DDL）为准，逐表显式列 INSERT。
方言处理：
  mysql     : 反引号 + 反斜杠转义 + MinDate 0001->1000 + X'' blob + FOREIGN_KEY_CHECKS=0
  sqlserver : [] 标识符 + IDENTITY_INSERT ON/OFF（显式 id）+ bit 接受 0/1 + datetime2 原样 0001
  postgres  : "" 标识符 + boolean 列 0/1 -> TRUE/FALSE + 插入后 setval 同步 identity 序列
插入顺序：按 FK 依赖拓扑排序（8 条 FK，防止违反约束）。
用法：python seed2sql.py <wms.db> <schema.sql> <mysql|sqlserver|postgres> <输出.sql>
"""
import sqlite3
import re
import sys

db_path, ddl_path, dialect, out_path = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
assert dialect in ('mysql', 'sqlserver', 'postgres'), dialect

ddl = open(ddl_path, encoding='utf-8').read()

tables = {}   # name -> [columns]
coltypes = {}  # (table, col) -> type token
fks = []      # (child, parent)

if dialect == 'mysql':
    for m in re.finditer(r'CREATE TABLE `(\w+)` \((.*?)\n\) CHARACTER SET=utf8mb4;', ddl, re.S):
        name, body = m.group(1), m.group(2)
        cols = re.findall(r'^\s*`(\w+)`', body, re.M)
        tables[name] = cols
        for c in re.finditer(r'^\s*`(\w+)` (\w+)', body, re.M):
            coltypes[(name, c.group(1))] = c.group(2)
else:
    if dialect == 'sqlserver':
        tbl_re = re.compile(r'CREATE TABLE \[(\w+)\] \((.*?)\n\);', re.S)
        col_re = re.compile(r'^\s*\[(\w+)\] (\w+)', re.M)
        fk_re = re.compile(r'FOREIGN KEY \(\[\w+\]\) REFERENCES \[(\w+)\]')
    else:
        # 注意：user 等保留字表名会被 EF 加双引号（CREATE TABLE "user"）
        tbl_re = re.compile(r'CREATE TABLE "?(\w+)"? \((.*?)\n\);', re.S)
        col_re = re.compile(r'^\s{4}"?(\w+)"? (\w+)', re.M)
        fk_re = re.compile(r'FOREIGN KEY \(\w+\) REFERENCES "?(\w+)"?')
    for m in tbl_re.finditer(ddl):
        name, body = m.group(1), m.group(2)
        cols = []
        for cm in col_re.finditer(body):
            col, typ = cm.group(1), cm.group(2)
            if col.upper() in ('CONSTRAINT', 'PRIMARY', 'UNIQUE', 'FOREIGN', 'CHECK'):
                continue
            cols.append(col)
            coltypes[(name, col)] = typ
        tables[name] = cols
        for fm in fk_re.finditer(body):
            fks.append((name, fm.group(1)))

# --- 拓扑排序：parent 先插 ---
def topo_order(names, edges):
    indeg = {n: 0 for n in names}
    adj = {n: [] for n in names}
    for child, parent in edges:
        if child in indeg and parent in indeg:
            adj[parent].append(child)
            indeg[child] += 1
    order, ready = [], sorted([n for n in names if indeg[n] == 0])
    import heapq
    heapq.heapify(ready)
    while ready:
        n = heapq.heappop(ready)
        order.append(n)
        for c in adj[n]:
            indeg[c] -= 1
            if indeg[c] == 0:
                heapq.heappush(ready, c)
    if len(order) != len(names):
        raise SystemExit('FK cycle? ' + str(set(names) - set(order)))
    return order

con = sqlite3.connect(db_path)
con.row_factory = sqlite3.Row
sq_tables = set(r[0] for r in con.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"))

def qid(name):   # 标识符引用
    if dialect == 'mysql':
        return '`' + name + '`'
    if dialect == 'sqlserver':
        return '[' + name + ']'
    return '"' + name + '"'

def esc(v, col=None, table=None):
    if v is None:
        return 'NULL'
    if isinstance(v, bytes):
        if dialect == 'mysql':
            return "X'" + v.hex() + "'"
        if dialect == 'sqlserver':
            return '0x' + v.hex()
        return "'\\x" + v.hex() + "'::bytea"
    if isinstance(v, (int, float)):
        if dialect == 'postgres' and col and coltypes.get((table, col)) == 'boolean':
            return 'TRUE' if v else 'FALSE'
        return repr(v)
    s = str(v)
    if dialect == 'mysql' and s.startswith('0001-01-01'):
        s = '1000-01-01' + s[len('0001-01-01'):]
    return "'" + s.replace("'", "''") + "'" if dialect != 'mysql' \
        else "'" + s.replace('\\', '\\\\').replace("'", "''") + "'"

out = []
if dialect == 'mysql':
    out += ['-- Z-WMS MySQL seed 数据（由 SQLite seed 转换，列清单对齐 mysql_schema.sql）',
            'SET NAMES utf8mb4;', 'SET FOREIGN_KEY_CHECKS = 0;', 'SET UNIQUE_CHECKS = 0;', 'BEGIN;']
elif dialect == 'sqlserver':
    out += ['-- Z-WMS SQL Server seed 数据（由 SQLite seed 转换，列清单对齐 sqlserver_schema.sql）']
else:
    out += ['-- Z-WMS PostgreSQL seed 数据（由 SQLite seed 转换，列清单对齐 postgres_schema.sql）', 'BEGIN;']

rows_total, skipped = 0, []
order = topo_order(sorted(tables), fks)
for name in order:
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
    if dialect == 'sqlserver':
        out.append(f'SET IDENTITY_INSERT {qid(name)} ON;')
    n = 0
    for row in con.execute(f'SELECT {", ".join(chr(34)+c+chr(34) for c in use)} FROM "{name}"'):
        vals = ', '.join(esc(row[c], c, name) for c in use)
        out.append(f'INSERT INTO {qid(name)} ({", ".join(qid(c) for c in use)}) VALUES ({vals});')
        n += 1
    rows_total += n
    if dialect == 'sqlserver':
        out += [f'SET IDENTITY_INSERT {qid(name)} OFF;', 'GO']
    out.append('')

if dialect == 'postgres':
    out.append('-- 同步 identity 序列（显式插 id 后必须 setval，否则后续自增主键冲突）')
    for name in order:
        if name == '__EFMigrationsHistory' or 'id' not in tables[name]:
            continue
        out.append(
            f"SELECT setval(pg_get_serial_sequence('{name}','id'), "
            f"COALESCE((SELECT MAX(id) FROM {qid(name)}), 0) + 1, false);")

if dialect == 'mysql':
    out += ['COMMIT;', 'SET FOREIGN_KEY_CHECKS = 1;', 'SET UNIQUE_CHECKS = 1;']
elif dialect == 'postgres':
    out.append('COMMIT;')

open(out_path, 'w', encoding='utf-8', newline='\n').write('\n'.join(out))
print(f'dialect={dialect} tables={len(tables)-1} rows={rows_total} -> {out_path}')
if skipped:
    print('skipped:', skipped)
