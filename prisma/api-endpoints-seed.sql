-- API分类数据
INSERT INTO "ApiCategory" (id, name, "displayName", description, icon, status, "sortOrder", "createdAt", "updatedAt") VALUES
('app-recognition', 'app-recognition', '应用识别', '应用流量识别相关API', '🔍', 'enabled', 1, NOW(), NOW()),
('crossborder', 'crossborder', '跨境识别', '跨境流量识别相关API', '🌍', 'enabled', 2, NOW(), NOW()),
('sdk-api', 'sdk-api', 'SDK API', 'SDK配置和管理API', '⚙️', 'enabled', 3, NOW(), NOW()),
('customization', 'customization', '定制化能力', '定制化模块和容灾API', '🔧', 'enabled', 4, NOW(), NOW());

-- 应用识别API端点
INSERT INTO "ApiEndpoint" (id, "categoryId", name, endpoint, method, description, "requestSchema", "responseSchema", deprecated, "rateLimit", "requireAuth", status, "createdAt", "updatedAt") VALUES
-- 应用识别 - 规则管理
('app-rules', 'app-recognition', '应用识别规则管理', '/api/v1/app-recognition/rules', 'POST', '应用识别规则的增删改查操作', 
'{"operation": "string", "ruleId": "string", "rule": {"domain": "string", "ip": "string", "url": "string", "protocol": "string", "matchCondition": "string", "categoryLabel": "string"}, "status": "string"}',
'{"code": 200, "msg": "string", "data": {"ruleId": "string", "status": "string", "rules": []}}', 
false, 1000, true, 'active', NOW(), NOW()),

-- 应用识别 - 实时识别
('app-realtime', 'app-recognition', '实时流量识别', '/api/v1/app-recognition/realtime', 'POST', '对实时流量进行应用识别', 
'{"traffic": {"srcIp": "string", "dstIp": "string", "domain": "string", "url": "string", "protocol": "string"}}',
'{"code": 200, "msg": "string", "data": {"appType": "string", "confidence": 0.95, "ruleId": "string"}}', 
false, 10000, true, 'active', NOW(), NOW()),

-- 应用识别 - 加密流量识别
('app-encrypted', 'app-recognition', '加密流量深度识别', '/api/v1/app-recognition/encrypted', 'POST', '对加密流量进行深度识别分析', 
'{"encryptedTraffic": {"tlsSni": "string", "quicInfo": "object", "payloadFeatures": "object"}}',
'{"code": 200, "msg": "string", "data": {"appName": "string", "protocol": "string", "analysis": "string"}}', 
false, 5000, true, 'active', NOW(), NOW()),

-- 应用识别 - AI预测
('app-ai-predict', 'app-recognition', 'AI识别模型预测', '/api/v1/app-recognition/ai/predict', 'POST', '使用AI模型对未知流量进行预测', 
'{"unknownTraffic": {"behaviorFeatures": "object", "packetStats": "object"}}',
'{"code": 200, "msg": "string", "data": {"predictedType": "string", "probability": 0.85, "suggestion": "string"}}', 
false, 1000, true, 'active', NOW(), NOW()),

-- 应用识别 - 异常统计
('app-abnormal-stat', 'app-recognition', '异常行为识别统计', '/api/v1/app-recognition/abnormal/stat', 'GET', '获取异常行为识别的统计数据', 
'{"timeRange": "string", "behaviorType": "string"}',
'{"code": 200, "msg": "string", "data": {"total": 100, "typeDistribution": {}, "topIps": []}}', 
false, 100, true, 'active', NOW(), NOW()),

-- 跨境识别API端点
-- 跨境识别 - 规则管理
('crossborder-rules', 'crossborder', '跨境识别规则管理', '/api/v1/crossborder/rules', 'POST', '跨境识别规则的增删改查操作', 
'{"operation": "string", "ruleId": "string", "rule": {"country": "string", "region": "string", "proxyType": "string", "tagStrategy": "string"}}',
'{"code": 200, "msg": "string", "data": {"ruleId": "string", "status": "string"}}', 
false, 1000, true, 'active', NOW(), NOW()),

-- 跨境识别 - 实时识别
('crossborder-realtime', 'crossborder', '实时跨境流量识别', '/api/v1/crossborder/realtime', 'POST', '对实时流量进行跨境识别', 
'{"traffic": {"srcIp": "string", "dstIp": "string", "proxyInfo": "object"}}',
'{"code": 200, "msg": "string", "data": {"isCrossborder": true, "region": "string", "proxyType": "string", "tag": "string"}}', 
false, 10000, true, 'active', NOW(), NOW()),

-- 跨境识别 - 策略状态
('crossborder-strategy', 'crossborder', '标记策略生效状态', '/api/v1/crossborder/strategy/status', 'GET', '查询标记策略的生效状态', 
'{"region": "string"}',
'{"code": 200, "msg": "string", "data": {"strategyId": "string", "status": "active", "lastUpdated": "string"}}', 
false, 500, true, 'active', NOW(), NOW()),

-- 跨境识别 - 代理识别
('crossborder-proxy', 'crossborder', 'VPN/SD-WAN流量识别', '/api/v1/crossborder/proxy/identify', 'POST', '识别VPN或SD-WAN代理流量', 
'{"traffic": {"tunnelFeatures": "object", "protocolFingerprint": "object"}}',
'{"code": 200, "msg": "string", "data": {"proxyType": "vpn", "confidence": 0.92, "targetRegion": "string"}}', 
false, 5000, true, 'active', NOW(), NOW()),

-- SDK API端点
('sdk-configs', 'sdk-api', 'SDK配置管理', '/api/v1/sdk/configs', 'GET', '获取SDK配置信息', 
'{"version": "string", "module": "string"}',
'{"code": 200, "msg": "string", "data": {"configs": {}}}', 
false, 1000, true, 'active', NOW(), NOW()),

('sdk-versions', 'sdk-api', 'SDK版本信息', '/api/v1/sdk/versions', 'GET', '获取SDK版本列表', 
'{}',
'{"code": 200, "msg": "string", "data": {"versions": []}}', 
false, 100, false, 'active', NOW(), NOW()),

('sdk-audit-logs', 'sdk-api', 'SDK审计日志', '/api/v1/sdk/audit/logs', 'GET', '获取SDK使用审计日志', 
'{"startTime": "string", "endTime": "string", "level": "string"}',
'{"code": 200, "msg": "string", "data": {"logs": []}}', 
false, 500, true, 'active', NOW(), NOW()),

-- 定制化API端点
('custom-status', 'customization', '定制模块状态', '/api/v1/customization/status', 'GET', '获取定制模块运行状态', 
'{"module": "string"}',
'{"code": 200, "msg": "string", "data": {"status": "running", "health": "healthy"}}', 
false, 100, true, 'active', NOW(), NOW()),

('custom-module-load', 'customization', '动态模块加载', '/api/v1/customization/module/load', 'POST', '动态加载定制模块', 
'{"moduleName": "string", "config": "object"}',
'{"code": 200, "msg": "string", "data": {"moduleId": "string", "status": "loaded"}}', 
false, 50, true, 'active', NOW(), NOW());
