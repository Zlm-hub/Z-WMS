#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把历史单据补写成 stockadjust 库存流水（一次性数据修复工具，幂等）。

背景
----
v0.1.13 之前，stockadjust 只在盘点(job_type=1)和仓内加工(2)里写过；
入库上架(5)、出库发运(6)、移库(4)这三类同样改动 stock.qty 的作业一行都不写，
「库存调整」页看不到它们，账实不符时只能翻各自的单据表人工比对。

本工具按来源单据把缺的流水补出来：
    移库   ← stockmove（move_status=1，来源库位 -N / 目标库位 +N 各一条）
    入库   ← asnsort.putaway_qty（+N，库位取该序列号最终落到的 stock 行）
    出库   ← dispatchpicklist（is_update_stock=1 的 picked_qty 汇总后取负）

幂等：按 (job_type, source_table_id) 查已有流水，只补差额，重复执行不会重复写。

用法
----
    python backfill_stockadjust.py --db rebuild/seed/wms_demo_mfg.db --dry-run
    python backfill_stockadjust.py --db rebuild/seed/wms_demo_mfg.db

    # 容器里的库先拷出来（backend 容器内的 /app/data/wms.db）
    docker cp modernwms-backend:/app/data/wms.db ./wms.db
    python backfill_stockadjust.py --db ./wms.db --dry-run

注意
----
- 只支持 SQLite。MySQL / PostgreSQL / SQL Server 请对 SQLite 种子库补完后
  用 tools/seed2sql.py --dialect 重新生成对应方言的 seed SQL。
- 补写是"事后重建"，时间取来源单据的处理时间；一次作业里多次部分上架会被合并成一条。
- 补写不会动 stock 表，只新增 stockadjust 行。
"""

import argparse
import sqlite3
import sys
from collections import defaultdict

JOB_MOVE = 4
JOB_PUTAWAY = 5
JOB_DELIVERY = 6

COLUMNS = (
    "job_code", "sku_id", "goods_owner_id", "goods_location_id", "qty", "creator",
    "create_time", "last_update_time", "tenant_id", "is_update_stock", "job_type",
    "source_table_id", "series_number", "expiry_date", "price", "putaway_date",
)


def _s(v):
    return "" if v is None else str(v)


def existing(con, job_type, source_id):
    """该来源单据已有的流水：条数 + 数量合计"""
    row = con.execute(
        "select count(*), coalesce(sum(qty), 0) from stockadjust where job_type = ? and source_table_id = ?",
        (job_type, source_id),
    ).fetchone()
    return int(row[0]), int(row[1])


def insert_row(con, row, dry_run=False):
    if dry_run:
        return
    con.execute(
        "insert into stockadjust (%s) values (%s)" % (", ".join(COLUMNS), ",".join(["?"] * len(COLUMNS))),
        row,
    )


def mk(job_code, sku_id, owner_id, loc_id, qty, creator, when, tenant_id, job_type, source_id,
       series_number="", expiry_date="1900-01-01 00:00:00", price=0, putaway_date="1900-01-01 00:00:00"):
    return (
        _s(job_code), sku_id, owner_id, loc_id, qty, _s(creator),
        _s(when), _s(when), tenant_id, 1, job_type, source_id,
        _s(series_number), _s(expiry_date), price, _s(putaway_date),
    )


def backfill_moves(con, dry_run):
    """移库：一张已确认的移库单 = 来源库位 -N + 目标库位 +N"""
    done, skip, rows = 0, 0, 0
    moves = con.execute(
        "select id, job_code, sku_id, goods_owner_id, orig_goods_location_id, dest_googs_location_id,"
        "       qty, handler, creator, handle_time, last_update_time, tenant_id,"
        "       series_number, expiry_date, price, putaway_date"
        "  from stockmove where move_status = 1 order by id"
    ).fetchall()
    for m in moves:
        cnt, _ = existing(con, JOB_MOVE, m["id"])
        if cnt:
            skip += 1
            continue
        when = m["handle_time"] or m["last_update_time"]
        who = m["handler"] or m["creator"]
        insert_row(con, mk(m["job_code"], m["sku_id"], m["goods_owner_id"], m["orig_goods_location_id"],
                           -m["qty"], who, when, m["tenant_id"], JOB_MOVE, m["id"],
                           m["series_number"], m["expiry_date"], m["price"], m["putaway_date"]), dry_run)
        insert_row(con, mk(m["job_code"], m["sku_id"], m["goods_owner_id"], m["dest_googs_location_id"],
                           m["qty"], who, when, m["tenant_id"], JOB_MOVE, m["id"],
                           m["series_number"], m["expiry_date"], m["price"], m["putaway_date"]), dry_run)
        done += 1
        rows += 2
    return done, skip, rows


def backfill_putaways(con, dry_run):
    """入库上架：按 asnsort.putaway_qty 补正数流水，库位取该序列号最终落到的 stock 行。
    允许"部分已补"（代码上线后又有上架的老单据），只补差额。"""
    done, skip, rows, unknown = 0, 0, 0, []
    asns = con.execute(
        "select id, asn_no, sku_id, goods_owner_id, tenant_id, creator from asn order by id"
    ).fetchall()
    for a in asns:
        sorts = con.execute(
            "select id, series_number, putaway_qty, creator, last_update_time from asnsort"
            " where asn_id = ? and putaway_qty > 0 order by id",
            (a["id"],),
        ).fetchall()
        if not sorts:
            skip += 1
            continue
        expected = sum(int(s["putaway_qty"] or 0) for s in sorts)
        cnt, have = existing(con, JOB_PUTAWAY, a["id"])
        delta = expected - have
        if cnt and delta <= 0:
            skip += 1
            continue
        remaining = delta
        for s in sorts:
            if remaining <= 0:
                break
            qty = min(int(s["putaway_qty"] or 0), remaining)
            stock = con.execute(
                "select goods_location_id, expiry_date, price, putaway_date from stock"
                " where sku_id = ? and goods_owner_id = ? and series_number = ?"
                " order by case when qty > 0 then 0 else 1 end, id limit 1",
                (a["sku_id"], a["goods_owner_id"], _s(s["series_number"])),
            ).fetchone()
            if not stock:
                unknown.append("%s/%s" % (a["asn_no"], _s(s["series_number"]) or "(整批)"))
                continue
            insert_row(con, mk(a["asn_no"], a["sku_id"], a["goods_owner_id"], stock["goods_location_id"],
                               qty, s["creator"] or a["creator"], s["last_update_time"], a["tenant_id"],
                               JOB_PUTAWAY, a["id"], s["series_number"], stock["expiry_date"],
                               stock["price"], stock["putaway_date"]), dry_run)
            remaining -= qty
            rows += 1
        done += 1
    return done, skip, rows, unknown


def backfill_deliveries(con, dry_run):
    """出库发运：发运是整单原子操作，按出库单汇总 is_update_stock 的拣货量为负数流水"""
    done, skip, rows = 0, 0, 0
    orders = con.execute(
        "select id, dispatch_no, creator, last_update_time, tenant_id from dispatchlist"
        " where dispatch_status >= 6 order by id"
    ).fetchall()
    for d in orders:
        picks = con.execute(
            "select goods_owner_id, goods_location_id, sku_id, series_number, expiry_date, price,"
            "       putaway_date, sum(picked_qty) as qty"
            "  from dispatchpicklist"
            " where dispatchlist_id = ? and is_update_stock = 1 and picked_qty > 0"
            " group by goods_owner_id, goods_location_id, sku_id, series_number, expiry_date, price, putaway_date",
            (d["id"],),
        ).fetchall()
        if not picks:
            skip += 1
            continue
        cnt, _ = existing(con, JOB_DELIVERY, d["id"])
        if cnt:
            skip += 1
            continue
        for p in picks:
            insert_row(con, mk(d["dispatch_no"], p["sku_id"], p["goods_owner_id"], p["goods_location_id"],
                               -int(p["qty"]), d["creator"], d["last_update_time"], d["tenant_id"],
                               JOB_DELIVERY, d["id"], p["series_number"], p["expiry_date"],
                               p["price"], p["putaway_date"]), dry_run)
            rows += 1
        done += 1
    return done, skip, rows


def main():
    ap = argparse.ArgumentParser(description="把历史移库/入库/出库补写成 stockadjust 流水（幂等）")
    ap.add_argument("--db", required=True, help="SQLite 数据库文件路径")
    ap.add_argument("--dry-run", action="store_true", help="只统计不落库")
    args = ap.parse_args()

    con = sqlite3.connect(args.db)
    con.row_factory = sqlite3.Row
    before = con.execute("select count(*) from stockadjust").fetchone()[0]

    print("库：%s%s" % (args.db, "（dry-run，不落库）" if args.dry_run else ""))
    print("补写前 stockadjust 行数：%d" % before)

    m_done, m_skip, m_rows = backfill_moves(con, args.dry_run)
    p_done, p_skip, p_rows, p_unknown = backfill_putaways(con, args.dry_run)
    d_done, d_skip, d_rows = backfill_deliveries(con, args.dry_run)

    if not args.dry_run:
        con.commit()
    after = con.execute("select count(*) from stockadjust").fetchone()[0]

    print()
    print("%-8s %-10s %-10s %-10s" % ("作业", "补写单据", "跳过单据", "新增流水"))
    print("%-8s %-10d %-10d %-10d" % ("移库", m_done, m_skip, m_rows))
    print("%-8s %-10d %-10d %-10d" % ("入库上架", p_done, p_skip, p_rows))
    print("%-8s %-10d %-10d %-10d" % ("出库发运", d_done, d_skip, d_rows))
    print()
    if p_unknown:
        print("入库无法定位库位（跳过，需人工确认）：%s" % ", ".join(p_unknown[:20]))
    print("补写后 stockadjust 行数：%d（+%d）" % (after, after - before))

    dist = con.execute("select job_type, count(*) from stockadjust group by job_type order by job_type").fetchall()
    print("分布：" + ", ".join("job_type=%d:%d" % (r[0], r[1]) for r in dist))
    return 0


if __name__ == "__main__":
    sys.exit(main())
