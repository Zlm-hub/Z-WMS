# ModernWMS 后端 API 路由清单（自动提取）

## Account

- `POST /account//login` → c
- `POST /account//refresh-token` → n
- `POST /account//hello-world` → d

## ActionLog

- `POST /actionlog/list` → c

## Asn

- `POST /asn/asnmaster/list` → c
- `GET /asn/asnmaster` → c
- `POST /asn/asnmaster` → c
- `PUT /asn/asnmaster` → c
- `DELETE /asn/asnmaster` → c
- `POST /asn/list` → c
- `GET /asn/` → c
- `POST /asn/` → c
- `PUT /asn/` → c
- `DELETE /asn/` → c
- `PUT /asn/bulk-modify-goods-owner` → c
- `PUT /asn/confirm` → c
- `PUT /asn/confirm-cancel` → c
- `PUT /asn/unload` → c
- `PUT /asn/unload-cancel` → c
- `PUT /asn/sorting` → c
- `GET /asn/sorting` → c
- `PUT /asn/sorting-modify` → c
- `PUT /asn/sorted` → c
- `PUT /asn/sorted-cancel` → c
- `GET /asn/pending-putaway` → c
- `PUT /asn/putaway` → c
- `POST /asn/print-sn` → c

## Customer

- `POST /customer/list` → c
- `GET /customer/all` → c
- `GET /customer/` → c
- `POST /customer/` → c
- `PUT /customer/` → c
- `DELETE /customer/` → c
- `POST /customer/excel` → c

## Dispatchlist

- `POST /dispatchlist/list` → c
- `POST /dispatchlist/advanced-list` → c
- `POST /dispatchlist/` → c
- `PUT /dispatchlist/` → n
- `GET /dispatchlist/by-dispatch_no` → o
- `GET /dispatchlist/confirm-check` → k
- `GET /dispatchlist/pick-list` → D
- `DELETE /dispatchlist/` → c
- `POST /dispatchlist/confirm-order` → r
- `PUT /dispatchlist/confirm-pick-dispatchlistno` → o
- `POST /dispatchlist/confirm-pick-detail` → l
- `POST /dispatchlist/cancel-confirm-pick-detail` → l
- `POST /dispatchlist/package` → e
- `POST /dispatchlist/weight` → t
- `POST /dispatchlist/delivery` → y
- `POST /dispatchlist/freightfee` → e
- `POST /dispatchlist/sign` → l
- `POST /dispatchlist/cancel-order` → n
- `PUT /dispatchlist/cancel-order` → n
- `POST /dispatchlist/import` → t

## Freightfee

- `POST /freightfee/list` → c
- `GET /freightfee/all` → c
- `GET /freightfee/` → c
- `POST /freightfee/` → c
- `PUT /freightfee/` → c
- `DELETE /freightfee/` → c
- `POST /freightfee/excel` → c

## Goodsowner

- `POST /goodsowner/list` → c
- `GET /goodsowner/all` → c
- `GET /goodsowner/` → c
- `POST /goodsowner/` → c
- `PUT /goodsowner/` → c
- `DELETE /goodsowner/` → c
- `POST /goodsowner/excel` → c

## Goodslocation

- `GET /goodslocation/location-by-warehouseare_id` → c
- `POST /goodslocation/list` → c
- `GET /goodslocation/all` → c
- `GET /goodslocation/` → c
- `POST /goodslocation/` → c
- `PUT /goodslocation/` → c
- `DELETE /goodslocation/` → c

## PrintSolution

- `POST /PrintSolution/list` → c
- `GET /PrintSolution/all` → c
- `GET /PrintSolution/` → c
- `POST /PrintSolution/get-by-path` → c
- `POST /PrintSolution/` → c
- `PUT /PrintSolution/` → c
- `DELETE /PrintSolution/` → c

## Rolemenu

- `GET /rolemenu/authority` → d
- `GET /rolemenu/all` → c
- `GET /rolemenu/menus` → c
- `GET /rolemenu/` → c
- `POST /rolemenu/` → c
- `PUT /rolemenu/` → c
- `DELETE /rolemenu/` → c

## Category

- `GET /category/all` → c
- `GET /category/` → c
- `POST /category/` → c
- `PUT /category/` → c
- `DELETE /category/` → c

## Spu

- `POST /spu/list` → c
- `GET /spu/` → c
- `GET /spu/sku` → c
- `GET /spu/sku-bar-code` → c
- `POST /spu/` → c
- `PUT /spu/` → c
- `DELETE /spu/` → c
- `PUT /spu/sku-safety-stock` → c

## Stock

- `POST /stock/stock-list` → c
- `POST /stock/safety-list` → c
- `POST /stock/location-list` → c
- `POST /stock/select` → c
- `POST /stock/sku-select` → c
- `POST /stock/qrcode-list` → c
- `POST /stock/delivery-list` → c
- `POST /stock/stock-age-list` → c

## Stockadjust

- `POST /stockadjust/list` → c

## Stockfreeze

- `POST /stockfreeze/list` → c
- `GET /stockfreeze/all` → c
- `GET /stockfreeze/` → c
- `POST /stockfreeze/` → c
- `PUT /stockfreeze/` → c
- `DELETE /stockfreeze/` → c

## Stockmove

- `POST /stockmove/list` → c
- `GET /stockmove/all` → c
- `GET /stockmove/` → c
- `POST /stockmove/` → c
- `PUT /stockmove/` → m
- `DELETE /stockmove/` → c

## Stockprocess

- `POST /stockprocess/list` → c
- `GET /stockprocess/all` → c
- `GET /stockprocess/` → c
- `POST /stockprocess/` → c
- `PUT /stockprocess/` → c
- `DELETE /stockprocess/` → c
- `PUT /stockprocess/process-confirm` → s
- `PUT /stockprocess/adjustment-confirm` → t

## Stocktaking

- `POST /stocktaking/list` → c
- `GET /stocktaking/` → c
- `POST /stocktaking/` → c
- `PUT /stocktaking/` → c
- `PUT /stocktaking/adjustment-confirm` → c
- `DELETE /stocktaking/` → c

## Warehouse

- `GET /warehouse/select-item` → c
- `POST /warehouse/list` → c
- `GET /warehouse/all` → c
- `GET /warehouse/` → c
- `POST /warehouse/` → c
- `PUT /warehouse/` → c
- `DELETE /warehouse/` → c
- `POST /warehouse/excel` → c

## Warehousearea

- `GET /warehousearea/areas-by-warehouse_id` → c
- `POST /warehousearea/list` → c
- `GET /warehousearea/all` → c
- `GET /warehousearea/` → c
- `POST /warehousearea/` → c
- `PUT /warehousearea/` → c
- `DELETE /warehousearea/` → c

## Company

- `GET /company/all` → c
- `GET /company/` → c
- `POST /company/` → c
- `PUT /company/` → c
- `DELETE /company/` → c

## Supplier

- `POST /supplier/list` → c
- `GET /supplier/all` → c
- `GET /supplier/` → c
- `POST /supplier/` → c
- `PUT /supplier/` → c
- `DELETE /supplier/` → c
- `POST /supplier/excel` → c

## User

- `GET /user/select-item` → c
- `POST /user/list` → c
- `GET /user/all` → c
- `GET /user/` → c
- `POST /user/` → c
- `POST /user/register` → r
- `POST /user/excel` → c
- `PUT /user/` → c
- `DELETE /user/` → c
- `POST /user/reset-pwd` → d
- `POST /user/change-pwd` → d

## Userrole

- `POST /userrole/save` → c
- `GET /userrole/all` → c
- `GET /userrole/` → c
- `POST /userrole/` → c
- `PUT /userrole/` → c
- `DELETE /userrole/` → c

