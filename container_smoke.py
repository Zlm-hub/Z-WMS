# -*- coding: utf-8 -*-
"""Container smoke test: full inbound flow on dockerized ModernWMS (:20011)."""
import json
import urllib.request

BASE = "http://localhost:20011"
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))  # bypass Clash

PASS = []
FAIL = []

def api(name, method, path, body=None, token=None, expect_ok=True):
    req = urllib.request.Request(BASE + path, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    data = json.dumps(body).encode() if body is not None else None
    try:
        with OPENER.open(req, data=data, timeout=30) as r:
            d = json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            d = json.loads(e.read().decode())
        except Exception:
            d = {"isSuccess": False, "errorMessage": "HTTP %s" % e.code}
    ok = bool(d.get("isSuccess")) if expect_ok else True
    (PASS if ok else FAIL).append((name, d.get("errorMessage", "")))
    print(("PASS" if ok else "FAIL"), name, "->", json.dumps(d, ensure_ascii=False)[:220])
    if not ok:
        raise SystemExit("STOP at: " + name)
    return d["data"]

# 1. login
token = api("login", "POST", "/login", {"user_name": "admin", "password": "1"})["access_token"]
H = token

# 2. create SPU (+sku, expiry 30 days)
spu = api("spu/create", "POST", "/spu", {
    "spu_code": "CTEST-%d" % __import__("random").randint(1000, 9999),
    "spu_name": "容器冒烟测试品",
    "category_id": 1, "category_name": "默认分类",
    "supplier_id": 0, "supplier_name": "",
    "pack_specification": 1, "distribution_type": 1, "uniformly_marked": 1,
    "detailList": [{
        "sku_code": "SKU-CTEST-%d" % __import__("random").randint(1000, 9999),
        "sku_name": "容器冒烟测试品",
        "barcode": "", "bar_code": "",
        "length": 10, "width": 10, "height": 10, "weight": 100,
        "length_unit": 0, "volume_unit": 0, "weight_unit": 0,
        "cost_price": 1.5, "sale_price": 3.0,
        "expiry_date": 30, "tax_rate": 0, "is_valid": True,
    }],
})
spu_id = spu["id"] if isinstance(spu, dict) and "id" in spu else spu
# spu add returns int (spu id)
full = api("spu/get", "GET", "/spu?id=%s" % spu_id, token=H)
sku = full["detailList"][0]
sku_id, sku_code, spu_code = sku["sku_id"] if "sku_id" in sku else sku["id"], sku.get("sku_code"), full.get("spu_code")
print("  spu_id=%s sku_id=%s sku_code=%s" % (spu_id, sku_id, sku_code))

# 3. ASN master
MIN = "0001-01-01T00:00:00"
master = api("asnmaster/create", "POST", "/asn/asnmaster", {
    "asn_no": "", "asn_batch": "",
    "estimated_arrival_time": "2026-10-16T08:00:00", "asn_status": 0,
    "weight": 0, "volume": 0,
    "goods_owner_id": 1, "goods_owner_name": "货主1",
    "detailList": [{
        "spu_id": spu_id, "spu_code": spu_code, "spu_name": "容器冒烟测试品",
        "sku_id": sku_id, "sku_code": sku_code, "sku_name": "容器冒烟测试品",
        "origin": "", "length_unit": 0, "volume_unit": 0, "weight_unit": 0,
        "asn_qty": 3, "actual_qty": 0, "weight": 0, "volume": 0,
        "supplier_id": 0, "supplier_name": "",
        "expiry_date": "2027-01-01T00:00:00", "price": 1.5,
    }],
})
master_id = master if isinstance(master, int) else master.get("id")
print("  master_id=%s" % master_id)

# 4. ASN detail
asn_id = api("asn/create", "POST", "/asn", {
    "asnmaster_id": master_id, "asn_no": "", "asn_batch": "",
    "estimated_arrival_time": "2026-10-16T08:00:00", "asn_status": 0,
    "spu_id": spu_id, "spu_code": spu_code, "spu_name": "容器冒烟测试品",
    "sku_id": sku_id, "sku_code": sku_code, "sku_name": "容器冒烟测试品",
    "origin": "", "length_unit": 0, "volume_unit": 0, "weight_unit": 0,
    "asn_qty": 3, "actual_qty": 0,
    "arrival_time": MIN, "unload_time": MIN,
    "unload_person_id": 0, "unload_person": "",
    "sorted_qty": 0, "shortage_qty": 0, "more_qty": 0, "damage_qty": 0,
    "weight": 0, "volume": 0, "supplier_id": 0, "supplier_name": "",
    "goods_owner_id": 1, "goods_owner_name": "货主1",
    "expiry_date": "2027-01-01T00:00:00", "price": 1.5,
})
print("  asn_id=%s" % asn_id)

# 5. flow: confirm -> unload -> sorting -> sorted
api("confirm", "PUT", "/asn/confirm", [{"id": asn_id, "arrival_time": "2026-10-16T09:00:00"}], token=H)
api("unload", "PUT", "/asn/unload", [{"id": asn_id, "unload_time": "2026-10-16T09:30:00", "unload_person_id": 1, "unload_person": "admin"}], token=H)
api("sorting", "PUT", "/asn/sorting", [{"asn_id": asn_id, "sorted_qty": 3, "is_auto_num": True}], token=H)
api("sorted", "PUT", "/asn/sorted", [asn_id], token=H)

# 6. pending putaway -> get serial numbers
pending = api("pending-putaway", "GET", "/asn/pending-putaway?id=%s" % asn_id, token=H)
print("  pending serials:", [p["series_number"] for p in pending])
assert len(pending) == 3, "expect 3 serials, got %d" % len(pending)

# 7. putaway each serial to location 1
for p in pending:
    api("putaway/sn=%s" % p["series_number"], "PUT", "/asn/putaway", [{
        "asn_id": asn_id, "goods_owner_id": p["goods_owner_id"],
        "series_number": p["series_number"], "goods_location_id": 1,
        "putaway_qty": p["sorted_qty"],
    }], token=H)

# 8. verify stock
stock = api("stock-list", "POST", "/stock/stock-list",
            {"pageIndex": 1, "pageSize": 20, "sqlTitle": "", "searchValue": ""}, token=H)
items = stock.get("rows") or stock.get("datas") or stock.get("items") or []
total_qty = sum(s.get("qty", 0) for s in items if s.get("sku_id") == sku_id or s.get("spu_id") == spu_id)
print("  stock rows for sku:", json.dumps([s for s in items if s.get("sku_id") == sku_id or s.get("spu_id") == spu_id], ensure_ascii=False)[:400])
print("RESULT: %s" % ("ALL PASS (qty=%s)" % total_qty if total_qty == 3 else "CHECK qty=%s" % total_qty))
