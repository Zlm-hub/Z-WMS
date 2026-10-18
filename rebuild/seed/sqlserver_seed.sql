-- Z-WMS SQL Server seed 数据（由 SQLite seed 转换，列清单对齐 sqlserver_schema.sql）
SET IDENTITY_INSERT [action_log] ON;
SET IDENTITY_INSERT [action_log] OFF;
GO

SET IDENTITY_INSERT [asnmaster] ON;
INSERT INTO [asnmaster] ([id], [asn_no], [asn_batch], [estimated_arrival_time], [asn_status], [weight], [volume], [goods_owner_id], [goods_owner_name], [creator], [create_time], [last_update_time], [tenant_id]) VALUES (1, '20261016-0001', 'B001', '2026-10-16 00:00:00', 0, 0, 0, 1, '烟测货主', 'admin', '2026-10-16 10:44:37.0731749', '2026-10-16 10:45:34.6517214', 1);
SET IDENTITY_INSERT [asnmaster] OFF;
GO

SET IDENTITY_INSERT [asn] ON;
INSERT INTO [asn] ([id], [asnmaster_id], [asn_no], [asn_status], [spu_id], [sku_id], [asn_qty], [actual_qty], [arrival_time], [unload_time], [unload_person_id], [unload_person], [sorted_qty], [shortage_qty], [more_qty], [damage_qty], [weight], [volume], [supplier_id], [supplier_name], [goods_owner_id], [goods_owner_name], [creator], [create_time], [last_update_time], [is_valid], [tenant_id], [expiry_date], [price]) VALUES (1, 1, '20261016-0001', 4, 1, 1, 3, 3, '1900-01-01 00:00:00', '2026-10-16 01:00:00', 1, 'admin', 3, 0, 0, 0, '0.0', '0.0', 1, '烟测供应商', 1, '烟测货主', 'admin', '2026-10-16 10:44:37.0736777', '2026-10-16 10:47:02.1590311', 1, 1, '1900-01-01 00:00:00', 9.9);
SET IDENTITY_INSERT [asn] OFF;
GO

SET IDENTITY_INSERT [asnsort] ON;
INSERT INTO [asnsort] ([id], [asn_id], [sorted_qty], [series_number], [putaway_qty], [creator], [create_time], [last_update_time], [is_valid], [tenant_id]) VALUES (1, 1, 1, 'sn20261016-0001', 1, 'admin', '2026-10-16 10:45:34.7822675', '2026-10-16 10:45:34.7823165', 1, 1);
INSERT INTO [asnsort] ([id], [asn_id], [sorted_qty], [series_number], [putaway_qty], [creator], [create_time], [last_update_time], [is_valid], [tenant_id]) VALUES (2, 1, 1, 'sn20261016-0002', 1, 'admin', '2026-10-16 10:45:34.7823462', '2026-10-16 10:45:34.7823463', 1, 1);
INSERT INTO [asnsort] ([id], [asn_id], [sorted_qty], [series_number], [putaway_qty], [creator], [create_time], [last_update_time], [is_valid], [tenant_id]) VALUES (3, 1, 1, 'sn20261016-0003', 1, 'admin', '2026-10-16 10:45:34.7823464', '2026-10-16 10:45:34.7823465', 1, 1);
SET IDENTITY_INSERT [asnsort] OFF;
GO

SET IDENTITY_INSERT [category] ON;
INSERT INTO [category] ([id], [category_name], [parent_id], [creator], [create_time], [last_update_time], [is_valid], [tenant_id]) VALUES (1, '默认分类', 0, 'admin', '2026-10-16 10:42:15.6591956', '2026-10-16 10:42:15.6591964', 1, 1);
SET IDENTITY_INSERT [category] OFF;
GO

SET IDENTITY_INSERT [company] ON;
SET IDENTITY_INSERT [company] OFF;
GO

SET IDENTITY_INSERT [customer] ON;
SET IDENTITY_INSERT [customer] OFF;
GO

SET IDENTITY_INSERT [dispatchlist] ON;
SET IDENTITY_INSERT [dispatchlist] OFF;
GO

SET IDENTITY_INSERT [dispatchpicklist] ON;
SET IDENTITY_INSERT [dispatchpicklist] OFF;
GO

SET IDENTITY_INSERT [flowsetmain] ON;
SET IDENTITY_INSERT [flowsetmain] OFF;
GO

SET IDENTITY_INSERT [flowset] ON;
SET IDENTITY_INSERT [flowset] OFF;
GO

SET IDENTITY_INSERT [flowsetfilter] ON;
SET IDENTITY_INSERT [flowsetfilter] OFF;
GO

SET IDENTITY_INSERT [flowsetusers] ON;
SET IDENTITY_INSERT [flowsetusers] OFF;
GO

SET IDENTITY_INSERT [freightfee] ON;
SET IDENTITY_INSERT [freightfee] OFF;
GO

SET IDENTITY_INSERT [global_unique_serial] ON;
INSERT INTO [global_unique_serial] ([id], [table_name], [prefix_char], [reset_rule], [current_no], [last_update_time], [tenant_id]) VALUES (1, 'Asnmaster', '', 'yyyyMMdd', 2, '2026-10-16 10:44:37.0587424', 1);
INSERT INTO [global_unique_serial] ([id], [table_name], [prefix_char], [reset_rule], [current_no], [last_update_time], [tenant_id]) VALUES (2, 'Asnsort', 'sn', 'yyyyMMdd', 4, '2026-10-16 10:45:34.7811391', 1);
SET IDENTITY_INSERT [global_unique_serial] OFF;
GO

SET IDENTITY_INSERT [goodslocation] ON;
INSERT INTO [goodslocation] ([id], [warehouse_id], [warehouse_name], [warehouse_area_name], [warehouse_area_property], [location_name], [location_length], [location_width], [location_heigth], [location_volume], [location_load], [roadway_number], [shelf_number], [layer_number], [tag_number], [create_time], [last_update_time], [is_valid], [tenant_id], [warehouse_area_id]) VALUES (1, 1, '烟测仓', 'A区', 0, 'A-01-01', '1.0', '1.0', '1.0', '1.0', '100.0', '', '', '', '', '2026-10-16 10:44:36.9528669', '2026-10-16 10:44:36.9528671', 1, 1, 1);
SET IDENTITY_INSERT [goodslocation] OFF;
GO

SET IDENTITY_INSERT [goodsowner] ON;
INSERT INTO [goodsowner] ([id], [goods_owner_name], [city], [address], [manager], [contact_tel], [creator], [create_time], [last_update_time], [is_valid], [tenant_id]) VALUES (1, '烟测货主', '成都', '高新区', '张三', '123', 'admin', '2026-10-16 10:44:36.6210187', '2026-10-16 10:44:36.621019', 1, 1);
SET IDENTITY_INSERT [goodsowner] OFF;
GO

SET IDENTITY_INSERT [menu] ON;
INSERT INTO [menu] ([id], [menu_name], [module], [vue_path], [vue_path_detail], [vue_directory], [sort], [tenant_id], [menu_actions]) VALUES (20, 'companySetting', 'baseModule', 'companySetting', '', 'base/companySetting', 1, 1, '[]');
INSERT INTO [menu] ([id], [menu_name], [module], [vue_path], [vue_path_detail], [vue_directory], [sort], [tenant_id], [menu_actions]) VALUES (21, 'userRoleSetting', 'baseModule', 'userRoleSetting', '', 'base/userRoleSetting', 2, 1, '[]');
INSERT INTO [menu] ([id], [menu_name], [module], [vue_path], [vue_path_detail], [vue_directory], [sort], [tenant_id], [menu_actions]) VALUES (22, 'roleMenu', 'baseModule', 'roleMenu', '', 'base/roleMenu', 3, 1, '[]');
INSERT INTO [menu] ([id], [menu_name], [module], [vue_path], [vue_path_detail], [vue_directory], [sort], [tenant_id], [menu_actions]) VALUES (23, 'userManagement', 'baseModule', 'userManagement', '', 'base/userManagement', 4, 1, '[]');
INSERT INTO [menu] ([id], [menu_name], [module], [vue_path], [vue_path_detail], [vue_directory], [sort], [tenant_id], [menu_actions]) VALUES (24, 'commodityCategorySetting', 'baseModule', 'commodityCategorySetting', '', 'base/commodityCategorySetting', 5, 1, '[]');
INSERT INTO [menu] ([id], [menu_name], [module], [vue_path], [vue_path_detail], [vue_directory], [sort], [tenant_id], [menu_actions]) VALUES (25, 'commodityManagement', 'baseModule', 'commodityManagement', '', 'base/commodityManagement', 6, 1, '[]');
INSERT INTO [menu] ([id], [menu_name], [module], [vue_path], [vue_path_detail], [vue_directory], [sort], [tenant_id], [menu_actions]) VALUES (26, 'supplier', 'baseModule', 'supplier', '', 'base/supplier', 7, 1, '[]');
INSERT INTO [menu] ([id], [menu_name], [module], [vue_path], [vue_path_detail], [vue_directory], [sort], [tenant_id], [menu_actions]) VALUES (27, 'warehouseSetting', 'baseModule', 'warehouseSetting', '', 'base/warehouseSetting', 8, 1, '[]');
INSERT INTO [menu] ([id], [menu_name], [module], [vue_path], [vue_path_detail], [vue_directory], [sort], [tenant_id], [menu_actions]) VALUES (28, 'ownerOfCargo', 'baseModule', 'ownerOfCargo', '', 'base/ownerOfCargo', 9, 1, '[]');
INSERT INTO [menu] ([id], [menu_name], [module], [vue_path], [vue_path_detail], [vue_directory], [sort], [tenant_id], [menu_actions]) VALUES (29, 'freightSetting', 'baseModule', 'freightSetting', '', 'base/freightSetting', 10, 1, '[]');
INSERT INTO [menu] ([id], [menu_name], [module], [vue_path], [vue_path_detail], [vue_directory], [sort], [tenant_id], [menu_actions]) VALUES (30, 'customer', 'baseModule', 'customer', '', 'base/customer', 12, 1, '[]');
INSERT INTO [menu] ([id], [menu_name], [module], [vue_path], [vue_path_detail], [vue_directory], [sort], [tenant_id], [menu_actions]) VALUES (31, 'stockManagement', '', 'stockManagement', '', 'wms/stockManagement', 12, 1, '[]');
INSERT INTO [menu] ([id], [menu_name], [module], [vue_path], [vue_path_detail], [vue_directory], [sort], [tenant_id], [menu_actions]) VALUES (32, 'warehouseProcessing', 'warehouseWorkingModule', 'warehouseProcessing', '', 'warehouseWorking/warehouseProcessing', 13, 1, '[]');
INSERT INTO [menu] ([id], [menu_name], [module], [vue_path], [vue_path_detail], [vue_directory], [sort], [tenant_id], [menu_actions]) VALUES (33, 'warehouseMove', 'warehouseWorkingModule', 'warehouseMove', '', 'warehouseWorking/warehouseMove', 14, 1, '[]');
INSERT INTO [menu] ([id], [menu_name], [module], [vue_path], [vue_path_detail], [vue_directory], [sort], [tenant_id], [menu_actions]) VALUES (34, 'warehouseFreeze', 'warehouseWorkingModule', 'warehouseFreeze', '', 'warehouseWorking/warehouseFreeze', 15, 1, '[]');
INSERT INTO [menu] ([id], [menu_name], [module], [vue_path], [vue_path_detail], [vue_directory], [sort], [tenant_id], [menu_actions]) VALUES (35, 'warehouseAdjust', 'warehouseWorkingModule', 'warehouseAdjust', '', 'warehouseWorking/warehouseAdjust', 16, 1, '[]');
INSERT INTO [menu] ([id], [menu_name], [module], [vue_path], [vue_path_detail], [vue_directory], [sort], [tenant_id], [menu_actions]) VALUES (36, 'warehouseTaking', 'warehouseWorkingModule', 'warehouseTaking', '', 'warehouseWorking/warehouseTaking', 17, 1, '[]');
INSERT INTO [menu] ([id], [menu_name], [module], [vue_path], [vue_path_detail], [vue_directory], [sort], [tenant_id], [menu_actions]) VALUES (37, 'stockAsn', '', 'stockAsn', '', 'wms/stockAsn', 18, 1, '[]');
INSERT INTO [menu] ([id], [menu_name], [module], [vue_path], [vue_path_detail], [vue_directory], [sort], [tenant_id], [menu_actions]) VALUES (38, 'deliveryManagement', 'deliveryManagement', 'deliveryManagement', '', 'deliveryManagement/deliveryManagement', 19, 1, '[]');
SET IDENTITY_INSERT [menu] OFF;
GO

SET IDENTITY_INSERT [rolemenu] ON;
INSERT INTO [rolemenu] ([id], [userrole_id], [menu_id], [authority], [create_time], [last_update_time], [tenant_id], [menu_actions_authority]) VALUES (1, 1, 20, 1, '2023-01-06 14:14:34.3281933', '2023-01-06 14:14:34.3281933', 1, '[]');
INSERT INTO [rolemenu] ([id], [userrole_id], [menu_id], [authority], [create_time], [last_update_time], [tenant_id], [menu_actions_authority]) VALUES (2, 1, 21, 1, '2023-01-06 14:14:34.3281933', '2023-01-06 14:14:34.3281933', 1, '[]');
INSERT INTO [rolemenu] ([id], [userrole_id], [menu_id], [authority], [create_time], [last_update_time], [tenant_id], [menu_actions_authority]) VALUES (3, 1, 22, 1, '2023-01-06 14:14:34.3281933', '2023-01-06 14:14:34.3281933', 1, '[]');
INSERT INTO [rolemenu] ([id], [userrole_id], [menu_id], [authority], [create_time], [last_update_time], [tenant_id], [menu_actions_authority]) VALUES (4, 1, 23, 1, '2023-01-06 14:14:34.3281933', '2023-01-06 14:14:34.3281933', 1, '[]');
INSERT INTO [rolemenu] ([id], [userrole_id], [menu_id], [authority], [create_time], [last_update_time], [tenant_id], [menu_actions_authority]) VALUES (5, 1, 24, 1, '2023-01-06 14:14:34.3281933', '2023-01-06 14:14:34.3281933', 1, '[]');
INSERT INTO [rolemenu] ([id], [userrole_id], [menu_id], [authority], [create_time], [last_update_time], [tenant_id], [menu_actions_authority]) VALUES (6, 1, 25, 1, '2023-01-06 14:14:34.3281933', '2023-01-06 14:14:34.3281933', 1, '[]');
INSERT INTO [rolemenu] ([id], [userrole_id], [menu_id], [authority], [create_time], [last_update_time], [tenant_id], [menu_actions_authority]) VALUES (7, 1, 26, 1, '2023-01-06 14:14:34.3281933', '2023-01-06 14:14:34.3281933', 1, '[]');
INSERT INTO [rolemenu] ([id], [userrole_id], [menu_id], [authority], [create_time], [last_update_time], [tenant_id], [menu_actions_authority]) VALUES (8, 1, 27, 1, '2023-01-06 14:14:34.3281933', '2023-01-06 14:14:34.3281933', 1, '[]');
INSERT INTO [rolemenu] ([id], [userrole_id], [menu_id], [authority], [create_time], [last_update_time], [tenant_id], [menu_actions_authority]) VALUES (9, 1, 28, 1, '2023-01-06 14:14:34.3281933', '2023-01-06 14:14:34.3281933', 1, '[]');
INSERT INTO [rolemenu] ([id], [userrole_id], [menu_id], [authority], [create_time], [last_update_time], [tenant_id], [menu_actions_authority]) VALUES (10, 1, 29, 1, '2023-01-06 14:14:34.3281933', '2023-01-06 14:14:34.3281933', 1, '[]');
INSERT INTO [rolemenu] ([id], [userrole_id], [menu_id], [authority], [create_time], [last_update_time], [tenant_id], [menu_actions_authority]) VALUES (11, 1, 30, 1, '2023-01-06 14:14:34.3281933', '2023-01-06 14:14:34.3281933', 1, '[]');
INSERT INTO [rolemenu] ([id], [userrole_id], [menu_id], [authority], [create_time], [last_update_time], [tenant_id], [menu_actions_authority]) VALUES (12, 1, 31, 1, '2023-01-06 14:14:34.3281933', '2023-01-06 14:14:34.3281933', 1, '[]');
INSERT INTO [rolemenu] ([id], [userrole_id], [menu_id], [authority], [create_time], [last_update_time], [tenant_id], [menu_actions_authority]) VALUES (13, 1, 32, 1, '2023-01-06 14:14:34.3281933', '2023-01-06 14:14:34.3281933', 1, '[]');
INSERT INTO [rolemenu] ([id], [userrole_id], [menu_id], [authority], [create_time], [last_update_time], [tenant_id], [menu_actions_authority]) VALUES (14, 1, 33, 1, '2023-01-06 14:14:34.3281933', '2023-01-06 14:14:34.3281933', 1, '[]');
INSERT INTO [rolemenu] ([id], [userrole_id], [menu_id], [authority], [create_time], [last_update_time], [tenant_id], [menu_actions_authority]) VALUES (15, 1, 34, 1, '2023-01-06 14:14:34.3281933', '2023-01-06 14:14:34.3281933', 1, '[]');
INSERT INTO [rolemenu] ([id], [userrole_id], [menu_id], [authority], [create_time], [last_update_time], [tenant_id], [menu_actions_authority]) VALUES (16, 1, 35, 1, '2023-01-06 14:14:34.3281933', '2023-01-06 14:14:34.3281933', 1, '[]');
INSERT INTO [rolemenu] ([id], [userrole_id], [menu_id], [authority], [create_time], [last_update_time], [tenant_id], [menu_actions_authority]) VALUES (17, 1, 36, 1, '2023-01-06 14:14:34.3281933', '2023-01-06 14:14:34.3281933', 1, '[]');
INSERT INTO [rolemenu] ([id], [userrole_id], [menu_id], [authority], [create_time], [last_update_time], [tenant_id], [menu_actions_authority]) VALUES (18, 1, 37, 1, '2023-01-06 14:14:34.3281933', '2023-01-06 14:14:34.3281933', 1, '[]');
INSERT INTO [rolemenu] ([id], [userrole_id], [menu_id], [authority], [create_time], [last_update_time], [tenant_id], [menu_actions_authority]) VALUES (19, 1, 38, 1, '2023-01-06 14:14:34.3281933', '2023-01-06 14:14:34.3281933', 1, '[]');
SET IDENTITY_INSERT [rolemenu] OFF;
GO

SET IDENTITY_INSERT [spu] ON;
INSERT INTO [spu] ([id], [spu_code], [spu_name], [category_id], [spu_description], [supplier_id], [supplier_name], [brand], [origin], [length_unit], [volume_unit], [weight_unit], [creator], [create_time], [last_update_time], [is_valid], [tenant_id]) VALUES (1, 'SPU001', '烟测商品', 1, '', 0, '', '', '', 0, 0, 0, 'admin', '2026-10-16 10:44:06.4571484', '2026-10-16 10:44:06.4571484', 1, 1);
SET IDENTITY_INSERT [spu] OFF;
GO

SET IDENTITY_INSERT [sku] ON;
INSERT INTO [sku] ([id], [spu_id], [sku_code], [sku_name], [bar_code], [weight], [lenght], [width], [height], [volume], [unit], [cost], [price], [create_time], [last_update_time]) VALUES (1, 1, 'SKU001', '烟测商品-标准装', '6901234567890', '0.0', '0.0', '0.0', '0.0', '0.0', '件', '5.0', '9.9', '2026-10-16 10:44:06.4399967', '2026-10-16 10:44:06.4399969');
SET IDENTITY_INSERT [sku] OFF;
GO

SET IDENTITY_INSERT [sku_safety_stock] ON;
SET IDENTITY_INSERT [sku_safety_stock] OFF;
GO

SET IDENTITY_INSERT [stock] ON;
INSERT INTO [stock] ([id], [sku_id], [goods_location_id], [qty], [goods_owner_id], [is_freeze], [last_update_time], [tenant_id], [series_number], [expiry_date], [price], [putaway_date]) VALUES (1, 1, 1, 1, 1, 0, '2026-10-16 10:47:02.1679742', 1, 'sn20261016-0001', '1900-01-01 00:00:00', 9.9, '2026-10-16 00:00:00');
INSERT INTO [stock] ([id], [sku_id], [goods_location_id], [qty], [goods_owner_id], [is_freeze], [last_update_time], [tenant_id], [series_number], [expiry_date], [price], [putaway_date]) VALUES (2, 1, 1, 1, 1, 0, '2026-10-16 10:47:02.1848058', 1, 'sn20261016-0002', '1900-01-01 00:00:00', 9.9, '2026-10-16 00:00:00');
INSERT INTO [stock] ([id], [sku_id], [goods_location_id], [qty], [goods_owner_id], [is_freeze], [last_update_time], [tenant_id], [series_number], [expiry_date], [price], [putaway_date]) VALUES (3, 1, 1, 1, 1, 0, '2026-10-16 10:47:02.1850238', 1, 'sn20261016-0003', '1900-01-01 00:00:00', 9.9, '2026-10-16 00:00:00');
SET IDENTITY_INSERT [stock] OFF;
GO

SET IDENTITY_INSERT [stockadjust] ON;
SET IDENTITY_INSERT [stockadjust] OFF;
GO

SET IDENTITY_INSERT [stockfreeze] ON;
SET IDENTITY_INSERT [stockfreeze] OFF;
GO

SET IDENTITY_INSERT [stockmove] ON;
SET IDENTITY_INSERT [stockmove] OFF;
GO

SET IDENTITY_INSERT [stockprocess] ON;
SET IDENTITY_INSERT [stockprocess] OFF;
GO

SET IDENTITY_INSERT [stockprocessdetail] ON;
SET IDENTITY_INSERT [stockprocessdetail] OFF;
GO

SET IDENTITY_INSERT [stocktaking] ON;
SET IDENTITY_INSERT [stocktaking] OFF;
GO

SET IDENTITY_INSERT [supplier] ON;
INSERT INTO [supplier] ([id], [supplier_name], [city], [address], [email], [manager], [contact_tel], [creator], [create_time], [last_update_time], [is_valid], [tenant_id]) VALUES (1, '烟测供应商', '成都', '高新区', '', '李四', '123', 'admin', '2026-10-16 10:44:36.7147058', '2026-10-16 10:44:36.7147065', 1, 1);
SET IDENTITY_INSERT [supplier] OFF;
GO

SET IDENTITY_INSERT [user] ON;
INSERT INTO [user] ([id], [user_num], [user_name], [contact_tel], [user_role], [sex], [is_valid], [auth_string], [email], [creator], [create_time], [last_update_time], [tenant_id]) VALUES (1, 'admin', 'admin', '', 'admin', 'male', 1, 'c4ca4238a0b923820dcc509a6f75849b', '7908990404@qq.com', 'admin', '2023-01-06 14:14:34.3281933', '2023-01-06 14:14:34.3281933', 1);
SET IDENTITY_INSERT [user] OFF;
GO

SET IDENTITY_INSERT [user_defined_print_solution] ON;
SET IDENTITY_INSERT [user_defined_print_solution] OFF;
GO

SET IDENTITY_INSERT [userrole] ON;
INSERT INTO [userrole] ([id], [role_name], [is_valid], [create_time], [last_update_time], [tenant_id]) VALUES (1, 'admin', 1, '2023-01-06 14:14:34.3281933', '2023-01-06 14:14:34.3281933', 1);
SET IDENTITY_INSERT [userrole] OFF;
GO

SET IDENTITY_INSERT [warehouse] ON;
INSERT INTO [warehouse] ([id], [warehouse_name], [city], [address], [email], [manager], [contact_tel], [creator], [create_time], [last_update_time], [is_valid], [tenant_id]) VALUES (1, '烟测仓', '成都', '高新区', 'a@b.c', '烟测', '123', 'admin', '2026-10-16 10:44:36.7832678', '2026-10-16 10:44:36.7832685', 1, 1);
SET IDENTITY_INSERT [warehouse] OFF;
GO

SET IDENTITY_INSERT [warehousearea] ON;
INSERT INTO [warehousearea] ([id], [warehouse_id], [area_name], [parent_id], [create_time], [last_update_time], [is_valid], [tenant_id], [area_property]) VALUES (1, 1, 'A区', 0, '2026-10-16 10:44:36.8791273', '2026-10-16 10:44:36.8791278', 1, 1, 0);
SET IDENTITY_INSERT [warehousearea] OFF;
GO
