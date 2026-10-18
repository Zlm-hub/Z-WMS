ALTER DATABASE CHARACTER SET utf8mb4;


CREATE TABLE `action_log` (
    `id` int NOT NULL AUTO_INCREMENT,
    `vue_path` longtext CHARACTER SET utf8mb4 NOT NULL,
    `user_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `action_content` longtext CHARACTER SET utf8mb4 NOT NULL,
    `action_time` datetime(6) NOT NULL,
    `tenant_id` bigint NOT NULL,
    CONSTRAINT `PK_action_log` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `asnmaster` (
    `id` int NOT NULL AUTO_INCREMENT,
    `asn_no` longtext CHARACTER SET utf8mb4 NOT NULL,
    `asn_batch` longtext CHARACTER SET utf8mb4 NOT NULL,
    `estimated_arrival_time` datetime(6) NOT NULL,
    `asn_status` tinyint unsigned NOT NULL,
    `weight` decimal(65,30) NOT NULL,
    `volume` decimal(65,30) NOT NULL,
    `goods_owner_id` int NOT NULL,
    `goods_owner_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `creator` longtext CHARACTER SET utf8mb4 NOT NULL,
    `create_time` datetime(6) NOT NULL,
    `last_update_time` datetime(6) NOT NULL,
    `tenant_id` bigint NOT NULL,
    CONSTRAINT `PK_asnmaster` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `asnsort` (
    `id` int NOT NULL AUTO_INCREMENT,
    `asn_id` int NOT NULL,
    `sorted_qty` int NOT NULL,
    `series_number` longtext CHARACTER SET utf8mb4 NOT NULL,
    `putaway_qty` int NOT NULL,
    `creator` longtext CHARACTER SET utf8mb4 NOT NULL,
    `create_time` datetime(6) NOT NULL,
    `last_update_time` datetime(6) NOT NULL,
    `is_valid` tinyint(1) NOT NULL,
    `tenant_id` bigint NOT NULL,
    CONSTRAINT `PK_asnsort` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `category` (
    `id` int NOT NULL AUTO_INCREMENT,
    `category_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `parent_id` int NOT NULL,
    `creator` longtext CHARACTER SET utf8mb4 NOT NULL,
    `create_time` datetime(6) NOT NULL,
    `last_update_time` datetime(6) NOT NULL,
    `is_valid` tinyint(1) NOT NULL,
    `tenant_id` bigint NOT NULL,
    CONSTRAINT `PK_category` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `company` (
    `id` int NOT NULL AUTO_INCREMENT,
    `company_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `city` longtext CHARACTER SET utf8mb4 NOT NULL,
    `address` longtext CHARACTER SET utf8mb4 NOT NULL,
    `manager` longtext CHARACTER SET utf8mb4 NOT NULL,
    `contact_tel` longtext CHARACTER SET utf8mb4 NOT NULL,
    `create_time` datetime(6) NOT NULL,
    `last_update_time` datetime(6) NOT NULL,
    `tenant_id` bigint NOT NULL,
    CONSTRAINT `PK_company` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `customer` (
    `id` int NOT NULL AUTO_INCREMENT,
    `customer_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `city` longtext CHARACTER SET utf8mb4 NOT NULL,
    `address` longtext CHARACTER SET utf8mb4 NOT NULL,
    `email` longtext CHARACTER SET utf8mb4 NOT NULL,
    `manager` longtext CHARACTER SET utf8mb4 NOT NULL,
    `contact_tel` longtext CHARACTER SET utf8mb4 NOT NULL,
    `creator` longtext CHARACTER SET utf8mb4 NOT NULL,
    `create_time` datetime(6) NOT NULL,
    `last_update_time` datetime(6) NOT NULL,
    `is_valid` tinyint(1) NOT NULL,
    `tenant_id` bigint NOT NULL,
    CONSTRAINT `PK_customer` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `dispatchlist` (
    `id` int NOT NULL AUTO_INCREMENT,
    `dispatch_no` longtext CHARACTER SET utf8mb4 NOT NULL,
    `dispatch_status` tinyint unsigned NOT NULL,
    `customer_id` int NOT NULL,
    `customer_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `sku_id` int NOT NULL,
    `qty` int NOT NULL,
    `weight` decimal(65,30) NOT NULL,
    `volume` decimal(65,30) NOT NULL,
    `creator` longtext CHARACTER SET utf8mb4 NOT NULL,
    `create_time` datetime(6) NOT NULL,
    `damage_qty` int NOT NULL,
    `lock_qty` int NOT NULL,
    `picked_qty` int NOT NULL,
    `intrasit_qty` int NOT NULL,
    `package_qty` int NOT NULL,
    `weighing_qty` int NOT NULL,
    `actual_qty` int NOT NULL,
    `sign_qty` int NOT NULL,
    `package_no` longtext CHARACTER SET utf8mb4 NOT NULL,
    `package_person` longtext CHARACTER SET utf8mb4 NOT NULL,
    `package_time` datetime(6) NOT NULL,
    `weighing_no` longtext CHARACTER SET utf8mb4 NOT NULL,
    `weighing_person` longtext CHARACTER SET utf8mb4 NOT NULL,
    `weighing_weight` decimal(65,30) NOT NULL,
    `waybill_no` longtext CHARACTER SET utf8mb4 NOT NULL,
    `carrier` longtext CHARACTER SET utf8mb4 NOT NULL,
    `freightfee` decimal(65,30) NOT NULL,
    `last_update_time` datetime(6) NOT NULL,
    `tenant_id` bigint NOT NULL,
    `pick_checker_id` int NOT NULL,
    `pick_checker` longtext CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK_dispatchlist` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `flowsetmain` (
    `id` int NOT NULL AUTO_INCREMENT,
    `menu` longtext CHARACTER SET utf8mb4 NOT NULL,
    `flow_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `creator` longtext CHARACTER SET utf8mb4 NOT NULL,
    `create_time` datetime(6) NOT NULL,
    `tenant_id` bigint NOT NULL,
    CONSTRAINT `PK_flowsetmain` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `freightfee` (
    `id` int NOT NULL AUTO_INCREMENT,
    `carrier` longtext CHARACTER SET utf8mb4 NOT NULL,
    `departure_city` longtext CHARACTER SET utf8mb4 NOT NULL,
    `arrival_city` longtext CHARACTER SET utf8mb4 NOT NULL,
    `price_per_weight` decimal(65,30) NOT NULL,
    `price_per_volume` decimal(65,30) NOT NULL,
    `min_payment` decimal(65,30) NOT NULL,
    `creator` longtext CHARACTER SET utf8mb4 NOT NULL,
    `create_time` datetime(6) NOT NULL,
    `last_update_time` datetime(6) NOT NULL,
    `is_valid` tinyint(1) NOT NULL,
    `tenant_id` bigint NOT NULL,
    CONSTRAINT `PK_freightfee` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `global_unique_serial` (
    `id` int NOT NULL AUTO_INCREMENT,
    `table_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `prefix_char` longtext CHARACTER SET utf8mb4 NOT NULL,
    `reset_rule` longtext CHARACTER SET utf8mb4 NOT NULL,
    `current_no` int NOT NULL,
    `last_update_time` datetime(6) NOT NULL,
    `tenant_id` bigint NOT NULL,
    CONSTRAINT `PK_global_unique_serial` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `goodslocation` (
    `id` int NOT NULL AUTO_INCREMENT,
    `warehouse_id` int NOT NULL,
    `warehouse_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `warehouse_area_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `warehouse_area_property` tinyint unsigned NOT NULL,
    `location_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `location_length` decimal(65,30) NOT NULL,
    `location_width` decimal(65,30) NOT NULL,
    `location_heigth` decimal(65,30) NOT NULL,
    `location_volume` decimal(65,30) NOT NULL,
    `location_load` decimal(65,30) NOT NULL,
    `roadway_number` longtext CHARACTER SET utf8mb4 NOT NULL,
    `shelf_number` longtext CHARACTER SET utf8mb4 NOT NULL,
    `layer_number` longtext CHARACTER SET utf8mb4 NOT NULL,
    `tag_number` longtext CHARACTER SET utf8mb4 NOT NULL,
    `create_time` datetime(6) NOT NULL,
    `last_update_time` datetime(6) NOT NULL,
    `is_valid` tinyint(1) NOT NULL,
    `tenant_id` bigint NOT NULL,
    `warehouse_area_id` int NOT NULL,
    CONSTRAINT `PK_goodslocation` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `goodsowner` (
    `id` int NOT NULL AUTO_INCREMENT,
    `goods_owner_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `city` longtext CHARACTER SET utf8mb4 NOT NULL,
    `address` longtext CHARACTER SET utf8mb4 NOT NULL,
    `manager` longtext CHARACTER SET utf8mb4 NOT NULL,
    `contact_tel` longtext CHARACTER SET utf8mb4 NOT NULL,
    `creator` longtext CHARACTER SET utf8mb4 NOT NULL,
    `create_time` datetime(6) NOT NULL,
    `last_update_time` datetime(6) NOT NULL,
    `is_valid` tinyint(1) NOT NULL,
    `tenant_id` bigint NOT NULL,
    CONSTRAINT `PK_goodsowner` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `menu` (
    `id` int NOT NULL AUTO_INCREMENT,
    `menu_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `module` longtext CHARACTER SET utf8mb4 NOT NULL,
    `vue_path` longtext CHARACTER SET utf8mb4 NOT NULL,
    `vue_path_detail` longtext CHARACTER SET utf8mb4 NOT NULL,
    `vue_directory` longtext CHARACTER SET utf8mb4 NOT NULL,
    `sort` int NOT NULL,
    `tenant_id` bigint NOT NULL,
    `menu_actions` longtext CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK_menu` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `rolemenu` (
    `id` int NOT NULL AUTO_INCREMENT,
    `userrole_id` int NOT NULL,
    `menu_id` int NOT NULL,
    `authority` tinyint unsigned NOT NULL,
    `create_time` datetime(6) NOT NULL,
    `last_update_time` datetime(6) NOT NULL,
    `tenant_id` bigint NOT NULL,
    `menu_actions_authority` longtext CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK_rolemenu` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `spu` (
    `id` int NOT NULL AUTO_INCREMENT,
    `spu_code` longtext CHARACTER SET utf8mb4 NOT NULL,
    `spu_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `category_id` int NOT NULL,
    `spu_description` longtext CHARACTER SET utf8mb4 NOT NULL,
    `supplier_id` int NOT NULL,
    `supplier_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `brand` longtext CHARACTER SET utf8mb4 NOT NULL,
    `origin` longtext CHARACTER SET utf8mb4 NOT NULL,
    `length_unit` tinyint unsigned NOT NULL,
    `volume_unit` tinyint unsigned NOT NULL,
    `weight_unit` tinyint unsigned NOT NULL,
    `creator` longtext CHARACTER SET utf8mb4 NOT NULL,
    `create_time` datetime(6) NOT NULL,
    `last_update_time` datetime(6) NOT NULL,
    `is_valid` tinyint(1) NOT NULL,
    `tenant_id` bigint NOT NULL,
    CONSTRAINT `PK_spu` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `stock` (
    `id` int NOT NULL AUTO_INCREMENT,
    `sku_id` int NOT NULL,
    `goods_location_id` int NOT NULL,
    `qty` int NOT NULL,
    `goods_owner_id` int NOT NULL,
    `is_freeze` tinyint(1) NOT NULL,
    `last_update_time` datetime(6) NOT NULL,
    `tenant_id` bigint NOT NULL,
    `series_number` longtext CHARACTER SET utf8mb4 NOT NULL,
    `expiry_date` datetime(6) NOT NULL,
    `price` decimal(65,30) NOT NULL,
    `putaway_date` datetime(6) NOT NULL,
    CONSTRAINT `PK_stock` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `stockadjust` (
    `id` int NOT NULL AUTO_INCREMENT,
    `job_code` longtext CHARACTER SET utf8mb4 NOT NULL,
    `sku_id` int NOT NULL,
    `goods_owner_id` int NOT NULL,
    `goods_location_id` int NOT NULL,
    `qty` int NOT NULL,
    `creator` longtext CHARACTER SET utf8mb4 NOT NULL,
    `create_time` datetime(6) NOT NULL,
    `last_update_time` datetime(6) NOT NULL,
    `tenant_id` bigint NOT NULL,
    `is_update_stock` tinyint(1) NOT NULL,
    `job_type` tinyint unsigned NOT NULL,
    `source_table_id` int NOT NULL,
    `series_number` longtext CHARACTER SET utf8mb4 NOT NULL,
    `expiry_date` datetime(6) NOT NULL,
    `price` decimal(65,30) NOT NULL,
    `putaway_date` datetime(6) NOT NULL,
    CONSTRAINT `PK_stockadjust` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `stockfreeze` (
    `id` int NOT NULL AUTO_INCREMENT,
    `job_code` longtext CHARACTER SET utf8mb4 NOT NULL,
    `job_type` tinyint(1) NOT NULL,
    `sku_id` int NOT NULL,
    `goods_owner_id` int NOT NULL,
    `goods_location_id` int NOT NULL,
    `handler` longtext CHARACTER SET utf8mb4 NOT NULL,
    `handle_time` datetime(6) NOT NULL,
    `last_update_time` datetime(6) NOT NULL,
    `tenant_id` bigint NOT NULL,
    `series_number` longtext CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK_stockfreeze` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `stockmove` (
    `id` int NOT NULL AUTO_INCREMENT,
    `job_code` longtext CHARACTER SET utf8mb4 NOT NULL,
    `move_status` tinyint unsigned NOT NULL,
    `sku_id` int NOT NULL,
    `orig_goods_location_id` int NOT NULL,
    `dest_googs_location_id` int NOT NULL,
    `qty` int NOT NULL,
    `goods_owner_id` int NOT NULL,
    `handler` longtext CHARACTER SET utf8mb4 NOT NULL,
    `handle_time` datetime(6) NOT NULL,
    `creator` longtext CHARACTER SET utf8mb4 NOT NULL,
    `create_time` datetime(6) NOT NULL,
    `last_update_time` datetime(6) NOT NULL,
    `tenant_id` bigint NOT NULL,
    `series_number` longtext CHARACTER SET utf8mb4 NOT NULL,
    `expiry_date` datetime(6) NOT NULL,
    `price` decimal(65,30) NOT NULL,
    `putaway_date` datetime(6) NOT NULL,
    CONSTRAINT `PK_stockmove` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `stockprocess` (
    `id` int NOT NULL AUTO_INCREMENT,
    `job_code` longtext CHARACTER SET utf8mb4 NOT NULL,
    `job_type` tinyint(1) NOT NULL,
    `process_status` tinyint(1) NOT NULL,
    `processor` longtext CHARACTER SET utf8mb4 NOT NULL,
    `process_time` datetime(6) NOT NULL,
    `creator` longtext CHARACTER SET utf8mb4 NOT NULL,
    `create_time` datetime(6) NOT NULL,
    `last_update_time` datetime(6) NOT NULL,
    `tenant_id` bigint NOT NULL,
    CONSTRAINT `PK_stockprocess` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `stocktaking` (
    `id` int NOT NULL AUTO_INCREMENT,
    `job_code` longtext CHARACTER SET utf8mb4 NOT NULL,
    `job_status` tinyint(1) NOT NULL,
    `sku_id` int NOT NULL,
    `goods_owner_id` int NOT NULL,
    `goods_location_id` int NOT NULL,
    `series_number` longtext CHARACTER SET utf8mb4 NOT NULL,
    `expiry_date` datetime(6) NOT NULL,
    `price` decimal(65,30) NOT NULL,
    `putaway_date` datetime(6) NOT NULL,
    `book_qty` int NOT NULL,
    `counted_qty` int NOT NULL,
    `difference_qty` int NOT NULL,
    `creator` longtext CHARACTER SET utf8mb4 NOT NULL,
    `create_time` datetime(6) NOT NULL,
    `last_update_time` datetime(6) NOT NULL,
    `tenant_id` bigint NOT NULL,
    `handler` longtext CHARACTER SET utf8mb4 NOT NULL,
    `handle_time` datetime(6) NOT NULL,
    CONSTRAINT `PK_stocktaking` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `supplier` (
    `id` int NOT NULL AUTO_INCREMENT,
    `supplier_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `city` longtext CHARACTER SET utf8mb4 NOT NULL,
    `address` longtext CHARACTER SET utf8mb4 NOT NULL,
    `email` longtext CHARACTER SET utf8mb4 NOT NULL,
    `manager` longtext CHARACTER SET utf8mb4 NOT NULL,
    `contact_tel` longtext CHARACTER SET utf8mb4 NOT NULL,
    `creator` longtext CHARACTER SET utf8mb4 NOT NULL,
    `create_time` datetime(6) NOT NULL,
    `last_update_time` datetime(6) NOT NULL,
    `is_valid` tinyint(1) NOT NULL,
    `tenant_id` bigint NOT NULL,
    CONSTRAINT `PK_supplier` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `user` (
    `id` int NOT NULL AUTO_INCREMENT,
    `user_num` longtext CHARACTER SET utf8mb4 NOT NULL,
    `user_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `contact_tel` longtext CHARACTER SET utf8mb4 NOT NULL,
    `user_role` longtext CHARACTER SET utf8mb4 NOT NULL,
    `sex` longtext CHARACTER SET utf8mb4 NOT NULL,
    `is_valid` tinyint(1) NOT NULL,
    `auth_string` longtext CHARACTER SET utf8mb4 NOT NULL,
    `email` longtext CHARACTER SET utf8mb4 NOT NULL,
    `creator` longtext CHARACTER SET utf8mb4 NOT NULL,
    `create_time` datetime(6) NOT NULL,
    `last_update_time` datetime(6) NOT NULL,
    `tenant_id` bigint NOT NULL,
    CONSTRAINT `PK_user` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `user_defined_print_solution` (
    `id` int NOT NULL AUTO_INCREMENT,
    `vue_path` longtext CHARACTER SET utf8mb4 NOT NULL,
    `tab_page` longtext CHARACTER SET utf8mb4 NOT NULL,
    `solution_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `config_json` longtext CHARACTER SET utf8mb4 NOT NULL,
    `report_length` decimal(65,30) NOT NULL,
    `report_width` decimal(65,30) NOT NULL,
    `report_direction` longtext CHARACTER SET utf8mb4 NOT NULL,
    `last_update_time` datetime(6) NOT NULL,
    `tenant_id` bigint NOT NULL,
    CONSTRAINT `PK_user_defined_print_solution` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `userrole` (
    `id` int NOT NULL AUTO_INCREMENT,
    `role_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `is_valid` tinyint(1) NOT NULL,
    `create_time` datetime(6) NOT NULL,
    `last_update_time` datetime(6) NOT NULL,
    `tenant_id` bigint NOT NULL,
    CONSTRAINT `PK_userrole` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `warehouse` (
    `id` int NOT NULL AUTO_INCREMENT,
    `warehouse_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `city` longtext CHARACTER SET utf8mb4 NOT NULL,
    `address` longtext CHARACTER SET utf8mb4 NOT NULL,
    `email` longtext CHARACTER SET utf8mb4 NOT NULL,
    `manager` longtext CHARACTER SET utf8mb4 NOT NULL,
    `contact_tel` longtext CHARACTER SET utf8mb4 NOT NULL,
    `creator` longtext CHARACTER SET utf8mb4 NOT NULL,
    `create_time` datetime(6) NOT NULL,
    `last_update_time` datetime(6) NOT NULL,
    `is_valid` tinyint(1) NOT NULL,
    `tenant_id` bigint NOT NULL,
    CONSTRAINT `PK_warehouse` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `warehousearea` (
    `id` int NOT NULL AUTO_INCREMENT,
    `warehouse_id` int NOT NULL,
    `area_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `parent_id` int NOT NULL,
    `create_time` datetime(6) NOT NULL,
    `last_update_time` datetime(6) NOT NULL,
    `is_valid` tinyint(1) NOT NULL,
    `tenant_id` bigint NOT NULL,
    `area_property` tinyint unsigned NOT NULL,
    CONSTRAINT `PK_warehousearea` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `asn` (
    `id` int NOT NULL AUTO_INCREMENT,
    `asnmaster_id` int NOT NULL,
    `asn_no` longtext CHARACTER SET utf8mb4 NOT NULL,
    `asn_status` tinyint unsigned NOT NULL,
    `spu_id` int NOT NULL,
    `sku_id` int NOT NULL,
    `asn_qty` int NOT NULL,
    `actual_qty` int NOT NULL,
    `arrival_time` datetime(6) NOT NULL,
    `unload_time` datetime(6) NOT NULL,
    `unload_person_id` int NOT NULL,
    `unload_person` longtext CHARACTER SET utf8mb4 NOT NULL,
    `sorted_qty` int NOT NULL,
    `shortage_qty` int NOT NULL,
    `more_qty` int NOT NULL,
    `damage_qty` int NOT NULL,
    `weight` decimal(65,30) NOT NULL,
    `volume` decimal(65,30) NOT NULL,
    `supplier_id` int NOT NULL,
    `supplier_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `goods_owner_id` int NOT NULL,
    `goods_owner_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `creator` longtext CHARACTER SET utf8mb4 NOT NULL,
    `create_time` datetime(6) NOT NULL,
    `last_update_time` datetime(6) NOT NULL,
    `is_valid` tinyint(1) NOT NULL,
    `tenant_id` bigint NOT NULL,
    `expiry_date` datetime(6) NOT NULL,
    `price` decimal(65,30) NOT NULL,
    CONSTRAINT `PK_asn` PRIMARY KEY (`id`),
    CONSTRAINT `FK_asn_asnmaster_asnmaster_id` FOREIGN KEY (`asnmaster_id`) REFERENCES `asnmaster` (`id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `dispatchpicklist` (
    `id` int NOT NULL AUTO_INCREMENT,
    `dispatchlist_id` int NOT NULL,
    `goods_owner_id` int NOT NULL,
    `goods_location_id` int NOT NULL,
    `sku_id` int NOT NULL,
    `pick_qty` int NOT NULL,
    `picked_qty` int NOT NULL,
    `is_update_stock` tinyint(1) NOT NULL,
    `last_update_time` datetime(6) NOT NULL,
    `series_number` longtext CHARACTER SET utf8mb4 NOT NULL,
    `picker_id` int NOT NULL,
    `picker` longtext CHARACTER SET utf8mb4 NOT NULL,
    `expiry_date` datetime(6) NOT NULL,
    `price` decimal(65,30) NOT NULL,
    `putaway_date` datetime(6) NOT NULL,
    CONSTRAINT `PK_dispatchpicklist` PRIMARY KEY (`id`),
    CONSTRAINT `FK_dispatchpicklist_dispatchlist_dispatchlist_id` FOREIGN KEY (`dispatchlist_id`) REFERENCES `dispatchlist` (`id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `flowset` (
    `id` int NOT NULL AUTO_INCREMENT,
    `flowsetmain_id` int NOT NULL,
    `is_origin` tinyint(1) NOT NULL,
    `is_end` tinyint(1) NOT NULL,
    `node_guid` longtext CHARACTER SET utf8mb4 NOT NULL,
    `node_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `prev_node_guid` longtext CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK_flowset` PRIMARY KEY (`id`),
    CONSTRAINT `FK_flowset_flowsetmain_flowsetmain_id` FOREIGN KEY (`flowsetmain_id`) REFERENCES `flowsetmain` (`id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `sku` (
    `id` int NOT NULL AUTO_INCREMENT,
    `spu_id` int NOT NULL,
    `sku_code` longtext CHARACTER SET utf8mb4 NOT NULL,
    `sku_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `bar_code` longtext CHARACTER SET utf8mb4 NOT NULL,
    `weight` decimal(65,30) NOT NULL,
    `lenght` decimal(65,30) NOT NULL,
    `width` decimal(65,30) NOT NULL,
    `height` decimal(65,30) NOT NULL,
    `volume` decimal(65,30) NOT NULL,
    `unit` longtext CHARACTER SET utf8mb4 NOT NULL,
    `cost` decimal(65,30) NOT NULL,
    `price` decimal(65,30) NOT NULL,
    `create_time` datetime(6) NOT NULL,
    `last_update_time` datetime(6) NOT NULL,
    CONSTRAINT `PK_sku` PRIMARY KEY (`id`),
    CONSTRAINT `FK_sku_spu_spu_id` FOREIGN KEY (`spu_id`) REFERENCES `spu` (`id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `stockprocessdetail` (
    `id` int NOT NULL AUTO_INCREMENT,
    `stock_process_id` int NOT NULL,
    `sku_id` int NOT NULL,
    `goods_owner_id` int NOT NULL,
    `goods_location_id` int NOT NULL,
    `qty` int NOT NULL,
    `last_update_time` datetime(6) NOT NULL,
    `tenant_id` bigint NOT NULL,
    `is_source` tinyint(1) NOT NULL,
    `is_update_stock` tinyint(1) NOT NULL,
    `series_number` longtext CHARACTER SET utf8mb4 NOT NULL,
    `expiry_date` datetime(6) NOT NULL,
    `price` decimal(65,30) NOT NULL,
    `putaway_date` datetime(6) NOT NULL,
    CONSTRAINT `PK_stockprocessdetail` PRIMARY KEY (`id`),
    CONSTRAINT `FK_stockprocessdetail_stockprocess_stock_process_id` FOREIGN KEY (`stock_process_id`) REFERENCES `stockprocess` (`id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `flowsetfilter` (
    `id` int NOT NULL AUTO_INCREMENT,
    `flowset_id` int NOT NULL,
    `flowsetmain_id` int NOT NULL,
    `node_guid` longtext CHARACTER SET utf8mb4 NOT NULL,
    `logic` longtext CHARACTER SET utf8mb4 NOT NULL,
    `c1` longtext CHARACTER SET utf8mb4 NOT NULL,
    `col_label` longtext CHARACTER SET utf8mb4 NOT NULL,
    `col_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `compare` longtext CHARACTER SET utf8mb4 NOT NULL,
    `content` longtext CHARACTER SET utf8mb4 NOT NULL,
    `c2` longtext CHARACTER SET utf8mb4 NOT NULL,
    `sort` int NOT NULL,
    `condition_group` longtext CHARACTER SET utf8mb4 NOT NULL,
    `formulas` longtext CHARACTER SET utf8mb4 NOT NULL,
    `assert_mode` longtext CHARACTER SET utf8mb4 NOT NULL,
    `table_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `scheme_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK_flowsetfilter` PRIMARY KEY (`id`),
    CONSTRAINT `FK_flowsetfilter_flowset_flowset_id` FOREIGN KEY (`flowset_id`) REFERENCES `flowset` (`id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `flowsetusers` (
    `id` int NOT NULL AUTO_INCREMENT,
    `flowset_id` int NOT NULL,
    `flowsetmain_id` int NOT NULL,
    `node_guid` longtext CHARACTER SET utf8mb4 NOT NULL,
    `user_id` int NOT NULL,
    CONSTRAINT `PK_flowsetusers` PRIMARY KEY (`id`),
    CONSTRAINT `FK_flowsetusers_flowset_flowset_id` FOREIGN KEY (`flowset_id`) REFERENCES `flowset` (`id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `sku_safety_stock` (
    `id` int NOT NULL AUTO_INCREMENT,
    `sku_id` int NOT NULL,
    `warehouse_id` int NOT NULL,
    `safety_stock_qty` int NOT NULL,
    CONSTRAINT `PK_sku_safety_stock` PRIMARY KEY (`id`),
    CONSTRAINT `FK_sku_safety_stock_sku_sku_id` FOREIGN KEY (`sku_id`) REFERENCES `sku` (`id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE INDEX `IX_asn_asnmaster_id` ON `asn` (`asnmaster_id`);


CREATE INDEX `IX_dispatchpicklist_dispatchlist_id` ON `dispatchpicklist` (`dispatchlist_id`);


CREATE INDEX `IX_flowset_flowsetmain_id` ON `flowset` (`flowsetmain_id`);


CREATE INDEX `IX_flowsetfilter_flowset_id` ON `flowsetfilter` (`flowset_id`);


CREATE INDEX `IX_flowsetusers_flowset_id` ON `flowsetusers` (`flowset_id`);


CREATE INDEX `IX_sku_spu_id` ON `sku` (`spu_id`);


CREATE INDEX `IX_sku_safety_stock_sku_id` ON `sku_safety_stock` (`sku_id`);


CREATE INDEX `IX_stockprocessdetail_stock_process_id` ON `stockprocessdetail` (`stock_process_id`);


