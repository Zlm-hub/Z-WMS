#!/bin/sh
set -e

CONFIG_JS=/usr/share/nginx/html/config.js

# 把 config.js 里的占位符替换成环境变量 WMS_API（未设置则留空串，前端回退默认值）
if [ -f "$CONFIG_JS" ]; then
  sed -i "s#__WMS_API_PLACEHOLDER__#${WMS_API}#g" "$CONFIG_JS"
fi

exec nginx -g 'daemon off;'
