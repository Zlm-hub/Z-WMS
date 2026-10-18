CREATE TABLE [action_log] (
    [id] int NOT NULL IDENTITY,
    [vue_path] nvarchar(max) NOT NULL,
    [user_name] nvarchar(max) NOT NULL,
    [action_content] nvarchar(max) NOT NULL,
    [action_time] datetime2 NOT NULL,
    [tenant_id] bigint NOT NULL,
    CONSTRAINT [PK_action_log] PRIMARY KEY ([id])
);
GO


CREATE TABLE [asnmaster] (
    [id] int NOT NULL IDENTITY,
    [asn_no] nvarchar(max) NOT NULL,
    [asn_batch] nvarchar(max) NOT NULL,
    [estimated_arrival_time] datetime2 NOT NULL,
    [asn_status] tinyint NOT NULL,
    [weight] decimal(18,2) NOT NULL,
    [volume] decimal(18,2) NOT NULL,
    [goods_owner_id] int NOT NULL,
    [goods_owner_name] nvarchar(max) NOT NULL,
    [creator] nvarchar(max) NOT NULL,
    [create_time] datetime2 NOT NULL,
    [last_update_time] datetime2 NOT NULL,
    [tenant_id] bigint NOT NULL,
    CONSTRAINT [PK_asnmaster] PRIMARY KEY ([id])
);
GO


CREATE TABLE [asnsort] (
    [id] int NOT NULL IDENTITY,
    [asn_id] int NOT NULL,
    [sorted_qty] int NOT NULL,
    [series_number] nvarchar(max) NOT NULL,
    [putaway_qty] int NOT NULL,
    [creator] nvarchar(max) NOT NULL,
    [create_time] datetime2 NOT NULL,
    [last_update_time] datetime2 NOT NULL,
    [is_valid] bit NOT NULL,
    [tenant_id] bigint NOT NULL,
    CONSTRAINT [PK_asnsort] PRIMARY KEY ([id])
);
GO


CREATE TABLE [category] (
    [id] int NOT NULL IDENTITY,
    [category_name] nvarchar(max) NOT NULL,
    [parent_id] int NOT NULL,
    [creator] nvarchar(max) NOT NULL,
    [create_time] datetime2 NOT NULL,
    [last_update_time] datetime2 NOT NULL,
    [is_valid] bit NOT NULL,
    [tenant_id] bigint NOT NULL,
    CONSTRAINT [PK_category] PRIMARY KEY ([id])
);
GO


CREATE TABLE [company] (
    [id] int NOT NULL IDENTITY,
    [company_name] nvarchar(max) NOT NULL,
    [city] nvarchar(max) NOT NULL,
    [address] nvarchar(max) NOT NULL,
    [manager] nvarchar(max) NOT NULL,
    [contact_tel] nvarchar(max) NOT NULL,
    [create_time] datetime2 NOT NULL,
    [last_update_time] datetime2 NOT NULL,
    [tenant_id] bigint NOT NULL,
    CONSTRAINT [PK_company] PRIMARY KEY ([id])
);
GO


CREATE TABLE [customer] (
    [id] int NOT NULL IDENTITY,
    [customer_name] nvarchar(max) NOT NULL,
    [city] nvarchar(max) NOT NULL,
    [address] nvarchar(max) NOT NULL,
    [email] nvarchar(max) NOT NULL,
    [manager] nvarchar(max) NOT NULL,
    [contact_tel] nvarchar(max) NOT NULL,
    [creator] nvarchar(max) NOT NULL,
    [create_time] datetime2 NOT NULL,
    [last_update_time] datetime2 NOT NULL,
    [is_valid] bit NOT NULL,
    [tenant_id] bigint NOT NULL,
    CONSTRAINT [PK_customer] PRIMARY KEY ([id])
);
GO


CREATE TABLE [dispatchlist] (
    [id] int NOT NULL IDENTITY,
    [dispatch_no] nvarchar(max) NOT NULL,
    [dispatch_status] tinyint NOT NULL,
    [customer_id] int NOT NULL,
    [customer_name] nvarchar(max) NOT NULL,
    [sku_id] int NOT NULL,
    [qty] int NOT NULL,
    [weight] decimal(18,2) NOT NULL,
    [volume] decimal(18,2) NOT NULL,
    [creator] nvarchar(max) NOT NULL,
    [create_time] datetime2 NOT NULL,
    [damage_qty] int NOT NULL,
    [lock_qty] int NOT NULL,
    [picked_qty] int NOT NULL,
    [intrasit_qty] int NOT NULL,
    [package_qty] int NOT NULL,
    [weighing_qty] int NOT NULL,
    [actual_qty] int NOT NULL,
    [sign_qty] int NOT NULL,
    [package_no] nvarchar(max) NOT NULL,
    [package_person] nvarchar(max) NOT NULL,
    [package_time] datetime2 NOT NULL,
    [weighing_no] nvarchar(max) NOT NULL,
    [weighing_person] nvarchar(max) NOT NULL,
    [weighing_weight] decimal(18,2) NOT NULL,
    [waybill_no] nvarchar(max) NOT NULL,
    [carrier] nvarchar(max) NOT NULL,
    [freightfee] decimal(18,2) NOT NULL,
    [last_update_time] datetime2 NOT NULL,
    [tenant_id] bigint NOT NULL,
    [pick_checker_id] int NOT NULL,
    [pick_checker] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_dispatchlist] PRIMARY KEY ([id])
);
GO


CREATE TABLE [flowsetmain] (
    [id] int NOT NULL IDENTITY,
    [menu] nvarchar(max) NOT NULL,
    [flow_name] nvarchar(max) NOT NULL,
    [creator] nvarchar(max) NOT NULL,
    [create_time] datetime2 NOT NULL,
    [tenant_id] bigint NOT NULL,
    CONSTRAINT [PK_flowsetmain] PRIMARY KEY ([id])
);
GO


CREATE TABLE [freightfee] (
    [id] int NOT NULL IDENTITY,
    [carrier] nvarchar(max) NOT NULL,
    [departure_city] nvarchar(max) NOT NULL,
    [arrival_city] nvarchar(max) NOT NULL,
    [price_per_weight] decimal(18,2) NOT NULL,
    [price_per_volume] decimal(18,2) NOT NULL,
    [min_payment] decimal(18,2) NOT NULL,
    [creator] nvarchar(max) NOT NULL,
    [create_time] datetime2 NOT NULL,
    [last_update_time] datetime2 NOT NULL,
    [is_valid] bit NOT NULL,
    [tenant_id] bigint NOT NULL,
    CONSTRAINT [PK_freightfee] PRIMARY KEY ([id])
);
GO


CREATE TABLE [global_unique_serial] (
    [id] int NOT NULL IDENTITY,
    [table_name] nvarchar(max) NOT NULL,
    [prefix_char] nvarchar(max) NOT NULL,
    [reset_rule] nvarchar(max) NOT NULL,
    [current_no] int NOT NULL,
    [last_update_time] datetime2 NOT NULL,
    [tenant_id] bigint NOT NULL,
    CONSTRAINT [PK_global_unique_serial] PRIMARY KEY ([id])
);
GO


CREATE TABLE [goodslocation] (
    [id] int NOT NULL IDENTITY,
    [warehouse_id] int NOT NULL,
    [warehouse_name] nvarchar(max) NOT NULL,
    [warehouse_area_name] nvarchar(max) NOT NULL,
    [warehouse_area_property] tinyint NOT NULL,
    [location_name] nvarchar(max) NOT NULL,
    [location_length] decimal(18,2) NOT NULL,
    [location_width] decimal(18,2) NOT NULL,
    [location_heigth] decimal(18,2) NOT NULL,
    [location_volume] decimal(18,2) NOT NULL,
    [location_load] decimal(18,2) NOT NULL,
    [roadway_number] nvarchar(max) NOT NULL,
    [shelf_number] nvarchar(max) NOT NULL,
    [layer_number] nvarchar(max) NOT NULL,
    [tag_number] nvarchar(max) NOT NULL,
    [create_time] datetime2 NOT NULL,
    [last_update_time] datetime2 NOT NULL,
    [is_valid] bit NOT NULL,
    [tenant_id] bigint NOT NULL,
    [warehouse_area_id] int NOT NULL,
    CONSTRAINT [PK_goodslocation] PRIMARY KEY ([id])
);
GO


CREATE TABLE [goodsowner] (
    [id] int NOT NULL IDENTITY,
    [goods_owner_name] nvarchar(max) NOT NULL,
    [city] nvarchar(max) NOT NULL,
    [address] nvarchar(max) NOT NULL,
    [manager] nvarchar(max) NOT NULL,
    [contact_tel] nvarchar(max) NOT NULL,
    [creator] nvarchar(max) NOT NULL,
    [create_time] datetime2 NOT NULL,
    [last_update_time] datetime2 NOT NULL,
    [is_valid] bit NOT NULL,
    [tenant_id] bigint NOT NULL,
    CONSTRAINT [PK_goodsowner] PRIMARY KEY ([id])
);
GO


CREATE TABLE [menu] (
    [id] int NOT NULL IDENTITY,
    [menu_name] nvarchar(max) NOT NULL,
    [module] nvarchar(max) NOT NULL,
    [vue_path] nvarchar(max) NOT NULL,
    [vue_path_detail] nvarchar(max) NOT NULL,
    [vue_directory] nvarchar(max) NOT NULL,
    [sort] int NOT NULL,
    [tenant_id] bigint NOT NULL,
    [menu_actions] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_menu] PRIMARY KEY ([id])
);
GO


CREATE TABLE [rolemenu] (
    [id] int NOT NULL IDENTITY,
    [userrole_id] int NOT NULL,
    [menu_id] int NOT NULL,
    [authority] tinyint NOT NULL,
    [create_time] datetime2 NOT NULL,
    [last_update_time] datetime2 NOT NULL,
    [tenant_id] bigint NOT NULL,
    [menu_actions_authority] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_rolemenu] PRIMARY KEY ([id])
);
GO


CREATE TABLE [spu] (
    [id] int NOT NULL IDENTITY,
    [spu_code] nvarchar(max) NOT NULL,
    [spu_name] nvarchar(max) NOT NULL,
    [category_id] int NOT NULL,
    [spu_description] nvarchar(max) NOT NULL,
    [supplier_id] int NOT NULL,
    [supplier_name] nvarchar(max) NOT NULL,
    [brand] nvarchar(max) NOT NULL,
    [origin] nvarchar(max) NOT NULL,
    [length_unit] tinyint NOT NULL,
    [volume_unit] tinyint NOT NULL,
    [weight_unit] tinyint NOT NULL,
    [creator] nvarchar(max) NOT NULL,
    [create_time] datetime2 NOT NULL,
    [last_update_time] datetime2 NOT NULL,
    [is_valid] bit NOT NULL,
    [tenant_id] bigint NOT NULL,
    CONSTRAINT [PK_spu] PRIMARY KEY ([id])
);
GO


CREATE TABLE [stock] (
    [id] int NOT NULL IDENTITY,
    [sku_id] int NOT NULL,
    [goods_location_id] int NOT NULL,
    [qty] int NOT NULL,
    [goods_owner_id] int NOT NULL,
    [is_freeze] bit NOT NULL,
    [last_update_time] datetime2 NOT NULL,
    [tenant_id] bigint NOT NULL,
    [series_number] nvarchar(max) NOT NULL,
    [expiry_date] datetime2 NOT NULL,
    [price] decimal(18,2) NOT NULL,
    [putaway_date] datetime2 NOT NULL,
    CONSTRAINT [PK_stock] PRIMARY KEY ([id])
);
GO


CREATE TABLE [stockadjust] (
    [id] int NOT NULL IDENTITY,
    [job_code] nvarchar(max) NOT NULL,
    [sku_id] int NOT NULL,
    [goods_owner_id] int NOT NULL,
    [goods_location_id] int NOT NULL,
    [qty] int NOT NULL,
    [creator] nvarchar(max) NOT NULL,
    [create_time] datetime2 NOT NULL,
    [last_update_time] datetime2 NOT NULL,
    [tenant_id] bigint NOT NULL,
    [is_update_stock] bit NOT NULL,
    [job_type] tinyint NOT NULL,
    [source_table_id] int NOT NULL,
    [series_number] nvarchar(max) NOT NULL,
    [expiry_date] datetime2 NOT NULL,
    [price] decimal(18,2) NOT NULL,
    [putaway_date] datetime2 NOT NULL,
    CONSTRAINT [PK_stockadjust] PRIMARY KEY ([id])
);
GO


CREATE TABLE [stockfreeze] (
    [id] int NOT NULL IDENTITY,
    [job_code] nvarchar(max) NOT NULL,
    [job_type] bit NOT NULL,
    [sku_id] int NOT NULL,
    [goods_owner_id] int NOT NULL,
    [goods_location_id] int NOT NULL,
    [handler] nvarchar(max) NOT NULL,
    [handle_time] datetime2 NOT NULL,
    [last_update_time] datetime2 NOT NULL,
    [tenant_id] bigint NOT NULL,
    [series_number] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_stockfreeze] PRIMARY KEY ([id])
);
GO


CREATE TABLE [stockmove] (
    [id] int NOT NULL IDENTITY,
    [job_code] nvarchar(max) NOT NULL,
    [move_status] tinyint NOT NULL,
    [sku_id] int NOT NULL,
    [orig_goods_location_id] int NOT NULL,
    [dest_googs_location_id] int NOT NULL,
    [qty] int NOT NULL,
    [goods_owner_id] int NOT NULL,
    [handler] nvarchar(max) NOT NULL,
    [handle_time] datetime2 NOT NULL,
    [creator] nvarchar(max) NOT NULL,
    [create_time] datetime2 NOT NULL,
    [last_update_time] datetime2 NOT NULL,
    [tenant_id] bigint NOT NULL,
    [series_number] nvarchar(max) NOT NULL,
    [expiry_date] datetime2 NOT NULL,
    [price] decimal(18,2) NOT NULL,
    [putaway_date] datetime2 NOT NULL,
    CONSTRAINT [PK_stockmove] PRIMARY KEY ([id])
);
GO


CREATE TABLE [stockprocess] (
    [id] int NOT NULL IDENTITY,
    [job_code] nvarchar(max) NOT NULL,
    [job_type] bit NOT NULL,
    [process_status] bit NOT NULL,
    [processor] nvarchar(max) NOT NULL,
    [process_time] datetime2 NOT NULL,
    [creator] nvarchar(max) NOT NULL,
    [create_time] datetime2 NOT NULL,
    [last_update_time] datetime2 NOT NULL,
    [tenant_id] bigint NOT NULL,
    CONSTRAINT [PK_stockprocess] PRIMARY KEY ([id])
);
GO


CREATE TABLE [stocktaking] (
    [id] int NOT NULL IDENTITY,
    [job_code] nvarchar(max) NOT NULL,
    [job_status] bit NOT NULL,
    [sku_id] int NOT NULL,
    [goods_owner_id] int NOT NULL,
    [goods_location_id] int NOT NULL,
    [series_number] nvarchar(max) NOT NULL,
    [expiry_date] datetime2 NOT NULL,
    [price] decimal(18,2) NOT NULL,
    [putaway_date] datetime2 NOT NULL,
    [book_qty] int NOT NULL,
    [counted_qty] int NOT NULL,
    [difference_qty] int NOT NULL,
    [creator] nvarchar(max) NOT NULL,
    [create_time] datetime2 NOT NULL,
    [last_update_time] datetime2 NOT NULL,
    [tenant_id] bigint NOT NULL,
    [handler] nvarchar(max) NOT NULL,
    [handle_time] datetime2 NOT NULL,
    CONSTRAINT [PK_stocktaking] PRIMARY KEY ([id])
);
GO


CREATE TABLE [supplier] (
    [id] int NOT NULL IDENTITY,
    [supplier_name] nvarchar(max) NOT NULL,
    [city] nvarchar(max) NOT NULL,
    [address] nvarchar(max) NOT NULL,
    [email] nvarchar(max) NOT NULL,
    [manager] nvarchar(max) NOT NULL,
    [contact_tel] nvarchar(max) NOT NULL,
    [creator] nvarchar(max) NOT NULL,
    [create_time] datetime2 NOT NULL,
    [last_update_time] datetime2 NOT NULL,
    [is_valid] bit NOT NULL,
    [tenant_id] bigint NOT NULL,
    CONSTRAINT [PK_supplier] PRIMARY KEY ([id])
);
GO


CREATE TABLE [user] (
    [id] int NOT NULL IDENTITY,
    [user_num] nvarchar(max) NOT NULL,
    [user_name] nvarchar(max) NOT NULL,
    [contact_tel] nvarchar(max) NOT NULL,
    [user_role] nvarchar(max) NOT NULL,
    [sex] nvarchar(max) NOT NULL,
    [is_valid] bit NOT NULL,
    [auth_string] nvarchar(max) NOT NULL,
    [email] nvarchar(max) NOT NULL,
    [creator] nvarchar(max) NOT NULL,
    [create_time] datetime2 NOT NULL,
    [last_update_time] datetime2 NOT NULL,
    [tenant_id] bigint NOT NULL,
    CONSTRAINT [PK_user] PRIMARY KEY ([id])
);
GO


CREATE TABLE [user_defined_print_solution] (
    [id] int NOT NULL IDENTITY,
    [vue_path] nvarchar(max) NOT NULL,
    [tab_page] nvarchar(max) NOT NULL,
    [solution_name] nvarchar(max) NOT NULL,
    [config_json] nvarchar(max) NOT NULL,
    [report_length] decimal(18,2) NOT NULL,
    [report_width] decimal(18,2) NOT NULL,
    [report_direction] nvarchar(max) NOT NULL,
    [last_update_time] datetime2 NOT NULL,
    [tenant_id] bigint NOT NULL,
    CONSTRAINT [PK_user_defined_print_solution] PRIMARY KEY ([id])
);
GO


CREATE TABLE [userrole] (
    [id] int NOT NULL IDENTITY,
    [role_name] nvarchar(max) NOT NULL,
    [is_valid] bit NOT NULL,
    [create_time] datetime2 NOT NULL,
    [last_update_time] datetime2 NOT NULL,
    [tenant_id] bigint NOT NULL,
    CONSTRAINT [PK_userrole] PRIMARY KEY ([id])
);
GO


CREATE TABLE [warehouse] (
    [id] int NOT NULL IDENTITY,
    [warehouse_name] nvarchar(max) NOT NULL,
    [city] nvarchar(max) NOT NULL,
    [address] nvarchar(max) NOT NULL,
    [email] nvarchar(max) NOT NULL,
    [manager] nvarchar(max) NOT NULL,
    [contact_tel] nvarchar(max) NOT NULL,
    [creator] nvarchar(max) NOT NULL,
    [create_time] datetime2 NOT NULL,
    [last_update_time] datetime2 NOT NULL,
    [is_valid] bit NOT NULL,
    [tenant_id] bigint NOT NULL,
    CONSTRAINT [PK_warehouse] PRIMARY KEY ([id])
);
GO


CREATE TABLE [warehousearea] (
    [id] int NOT NULL IDENTITY,
    [warehouse_id] int NOT NULL,
    [area_name] nvarchar(max) NOT NULL,
    [parent_id] int NOT NULL,
    [create_time] datetime2 NOT NULL,
    [last_update_time] datetime2 NOT NULL,
    [is_valid] bit NOT NULL,
    [tenant_id] bigint NOT NULL,
    [area_property] tinyint NOT NULL,
    CONSTRAINT [PK_warehousearea] PRIMARY KEY ([id])
);
GO


CREATE TABLE [asn] (
    [id] int NOT NULL IDENTITY,
    [asnmaster_id] int NOT NULL,
    [asn_no] nvarchar(max) NOT NULL,
    [asn_status] tinyint NOT NULL,
    [spu_id] int NOT NULL,
    [sku_id] int NOT NULL,
    [asn_qty] int NOT NULL,
    [actual_qty] int NOT NULL,
    [arrival_time] datetime2 NOT NULL,
    [unload_time] datetime2 NOT NULL,
    [unload_person_id] int NOT NULL,
    [unload_person] nvarchar(max) NOT NULL,
    [sorted_qty] int NOT NULL,
    [shortage_qty] int NOT NULL,
    [more_qty] int NOT NULL,
    [damage_qty] int NOT NULL,
    [weight] decimal(18,2) NOT NULL,
    [volume] decimal(18,2) NOT NULL,
    [supplier_id] int NOT NULL,
    [supplier_name] nvarchar(max) NOT NULL,
    [goods_owner_id] int NOT NULL,
    [goods_owner_name] nvarchar(max) NOT NULL,
    [creator] nvarchar(max) NOT NULL,
    [create_time] datetime2 NOT NULL,
    [last_update_time] datetime2 NOT NULL,
    [is_valid] bit NOT NULL,
    [tenant_id] bigint NOT NULL,
    [expiry_date] datetime2 NOT NULL,
    [price] decimal(18,2) NOT NULL,
    CONSTRAINT [PK_asn] PRIMARY KEY ([id]),
    CONSTRAINT [FK_asn_asnmaster_asnmaster_id] FOREIGN KEY ([asnmaster_id]) REFERENCES [asnmaster] ([id]) ON DELETE CASCADE
);
GO


CREATE TABLE [dispatchpicklist] (
    [id] int NOT NULL IDENTITY,
    [dispatchlist_id] int NOT NULL,
    [goods_owner_id] int NOT NULL,
    [goods_location_id] int NOT NULL,
    [sku_id] int NOT NULL,
    [pick_qty] int NOT NULL,
    [picked_qty] int NOT NULL,
    [is_update_stock] bit NOT NULL,
    [last_update_time] datetime2 NOT NULL,
    [series_number] nvarchar(max) NOT NULL,
    [picker_id] int NOT NULL,
    [picker] nvarchar(max) NOT NULL,
    [expiry_date] datetime2 NOT NULL,
    [price] decimal(18,2) NOT NULL,
    [putaway_date] datetime2 NOT NULL,
    CONSTRAINT [PK_dispatchpicklist] PRIMARY KEY ([id]),
    CONSTRAINT [FK_dispatchpicklist_dispatchlist_dispatchlist_id] FOREIGN KEY ([dispatchlist_id]) REFERENCES [dispatchlist] ([id]) ON DELETE CASCADE
);
GO


CREATE TABLE [flowset] (
    [id] int NOT NULL IDENTITY,
    [flowsetmain_id] int NOT NULL,
    [is_origin] bit NOT NULL,
    [is_end] bit NOT NULL,
    [node_guid] nvarchar(max) NOT NULL,
    [node_name] nvarchar(max) NOT NULL,
    [prev_node_guid] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_flowset] PRIMARY KEY ([id]),
    CONSTRAINT [FK_flowset_flowsetmain_flowsetmain_id] FOREIGN KEY ([flowsetmain_id]) REFERENCES [flowsetmain] ([id]) ON DELETE CASCADE
);
GO


CREATE TABLE [sku] (
    [id] int NOT NULL IDENTITY,
    [spu_id] int NOT NULL,
    [sku_code] nvarchar(max) NOT NULL,
    [sku_name] nvarchar(max) NOT NULL,
    [bar_code] nvarchar(max) NOT NULL,
    [weight] decimal(18,2) NOT NULL,
    [lenght] decimal(18,2) NOT NULL,
    [width] decimal(18,2) NOT NULL,
    [height] decimal(18,2) NOT NULL,
    [volume] decimal(18,2) NOT NULL,
    [unit] nvarchar(max) NOT NULL,
    [cost] decimal(18,2) NOT NULL,
    [price] decimal(18,2) NOT NULL,
    [create_time] datetime2 NOT NULL,
    [last_update_time] datetime2 NOT NULL,
    CONSTRAINT [PK_sku] PRIMARY KEY ([id]),
    CONSTRAINT [FK_sku_spu_spu_id] FOREIGN KEY ([spu_id]) REFERENCES [spu] ([id]) ON DELETE CASCADE
);
GO


CREATE TABLE [stockprocessdetail] (
    [id] int NOT NULL IDENTITY,
    [stock_process_id] int NOT NULL,
    [sku_id] int NOT NULL,
    [goods_owner_id] int NOT NULL,
    [goods_location_id] int NOT NULL,
    [qty] int NOT NULL,
    [last_update_time] datetime2 NOT NULL,
    [tenant_id] bigint NOT NULL,
    [is_source] bit NOT NULL,
    [is_update_stock] bit NOT NULL,
    [series_number] nvarchar(max) NOT NULL,
    [expiry_date] datetime2 NOT NULL,
    [price] decimal(18,2) NOT NULL,
    [putaway_date] datetime2 NOT NULL,
    CONSTRAINT [PK_stockprocessdetail] PRIMARY KEY ([id]),
    CONSTRAINT [FK_stockprocessdetail_stockprocess_stock_process_id] FOREIGN KEY ([stock_process_id]) REFERENCES [stockprocess] ([id]) ON DELETE CASCADE
);
GO


CREATE TABLE [flowsetfilter] (
    [id] int NOT NULL IDENTITY,
    [flowset_id] int NOT NULL,
    [flowsetmain_id] int NOT NULL,
    [node_guid] nvarchar(max) NOT NULL,
    [logic] nvarchar(max) NOT NULL,
    [c1] nvarchar(max) NOT NULL,
    [col_label] nvarchar(max) NOT NULL,
    [col_name] nvarchar(max) NOT NULL,
    [compare] nvarchar(max) NOT NULL,
    [content] nvarchar(max) NOT NULL,
    [c2] nvarchar(max) NOT NULL,
    [sort] int NOT NULL,
    [condition_group] nvarchar(max) NOT NULL,
    [formulas] nvarchar(max) NOT NULL,
    [assert_mode] nvarchar(max) NOT NULL,
    [table_name] nvarchar(max) NOT NULL,
    [scheme_name] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_flowsetfilter] PRIMARY KEY ([id]),
    CONSTRAINT [FK_flowsetfilter_flowset_flowset_id] FOREIGN KEY ([flowset_id]) REFERENCES [flowset] ([id]) ON DELETE CASCADE
);
GO


CREATE TABLE [flowsetusers] (
    [id] int NOT NULL IDENTITY,
    [flowset_id] int NOT NULL,
    [flowsetmain_id] int NOT NULL,
    [node_guid] nvarchar(max) NOT NULL,
    [user_id] int NOT NULL,
    CONSTRAINT [PK_flowsetusers] PRIMARY KEY ([id]),
    CONSTRAINT [FK_flowsetusers_flowset_flowset_id] FOREIGN KEY ([flowset_id]) REFERENCES [flowset] ([id]) ON DELETE CASCADE
);
GO


CREATE TABLE [sku_safety_stock] (
    [id] int NOT NULL IDENTITY,
    [sku_id] int NOT NULL,
    [warehouse_id] int NOT NULL,
    [safety_stock_qty] int NOT NULL,
    CONSTRAINT [PK_sku_safety_stock] PRIMARY KEY ([id]),
    CONSTRAINT [FK_sku_safety_stock_sku_sku_id] FOREIGN KEY ([sku_id]) REFERENCES [sku] ([id]) ON DELETE CASCADE
);
GO


CREATE INDEX [IX_asn_asnmaster_id] ON [asn] ([asnmaster_id]);
GO


CREATE INDEX [IX_dispatchpicklist_dispatchlist_id] ON [dispatchpicklist] ([dispatchlist_id]);
GO


CREATE INDEX [IX_flowset_flowsetmain_id] ON [flowset] ([flowsetmain_id]);
GO


CREATE INDEX [IX_flowsetfilter_flowset_id] ON [flowsetfilter] ([flowset_id]);
GO


CREATE INDEX [IX_flowsetusers_flowset_id] ON [flowsetusers] ([flowset_id]);
GO


CREATE INDEX [IX_sku_spu_id] ON [sku] ([spu_id]);
GO


CREATE INDEX [IX_sku_safety_stock_sku_id] ON [sku_safety_stock] ([sku_id]);
GO


CREATE INDEX [IX_stockprocessdetail_stock_process_id] ON [stockprocessdetail] ([stock_process_id]);
GO


