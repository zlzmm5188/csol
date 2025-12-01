-- ============================================
-- PROVIDENCE 增强数据库设计
-- 基于需求规范的新功能扩展
-- 版本: 2.0.0
-- 日期: 2025-12-01
-- ============================================

-- ============================================
-- 1. 增强用户表 - 添加双币种余额和内部员工标记
-- ============================================
ALTER TABLE `users`
  -- 双币种余额支持
  ADD COLUMN `balance_cny` DECIMAL(15,2) DEFAULT 0.00 COMMENT '人民币余额' AFTER `balance`,
  ADD COLUMN `balance_usdt` DECIMAL(15,4) DEFAULT 0.0000 COMMENT 'USDT余额' AFTER `balance_cny`,
  ADD COLUMN `frozen_cny` DECIMAL(15,2) DEFAULT 0.00 COMMENT '人民币冻结' AFTER `frozen_balance`,
  ADD COLUMN `frozen_usdt` DECIMAL(15,4) DEFAULT 0.0000 COMMENT 'USDT冻结' AFTER `frozen_cny`,
  
  -- 8位用户ID (founding member = 1)
  ADD COLUMN `user_id` VARCHAR(20) UNIQUE COMMENT '8位用户ID' AFTER `id`,
  
  -- 内部员工标记
  ADD COLUMN `is_internal` TINYINT DEFAULT 0 COMMENT '是否内部员工:0否 1是' AFTER `status`,
  
  -- VIP等级改为0-8
  MODIFY COLUMN `vip_level` TINYINT DEFAULT 0 COMMENT 'VIP等级 0-8',
  
  -- 累计投资额（用于VIP升级计算）
  ADD COLUMN `total_investment` DECIMAL(15,2) DEFAULT 0.00 COMMENT '累计投资额' AFTER `balance_usdt`,
  
  -- 用户活动记录
  ADD COLUMN `last_login_device` VARCHAR(255) COMMENT '最后登录设备' AFTER `login_ip`,
  ADD COLUMN `last_login_location` VARCHAR(255) COMMENT '最后登录位置' AFTER `last_login_device`,
  
  -- 索引
  ADD INDEX `idx_user_id` (`user_id`),
  ADD INDEX `idx_is_internal` (`is_internal`);

-- ============================================
-- 2. 增强VIP等级配置表 - 基于需求规范
-- ============================================
DROP TABLE IF EXISTS `vip_levels_new`;
CREATE TABLE `vip_levels_new` (
  `id` TINYINT UNSIGNED PRIMARY KEY COMMENT 'VIP等级 0-8',
  `name` VARCHAR(50) NOT NULL COMMENT '等级名称',
  `icon` VARCHAR(255) COMMENT '图标',
  `min_investment` DECIMAL(15,2) DEFAULT 0 COMMENT '累计投资要求',
  `extra_interest_rate` DECIMAL(5,4) DEFAULT 0 COMMENT '额外加息率',
  `commission_l1` DECIMAL(5,2) DEFAULT 0 COMMENT '一级返佣率%',
  `commission_l2` DECIMAL(5,2) DEFAULT 0 COMMENT '二级返佣率%',
  `description` VARCHAR(255) COMMENT '等级描述',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='VIP等级配置表(新)';

-- 插入VIP等级配置数据
INSERT INTO `vip_levels_new` (`id`, `name`, `min_investment`, `extra_interest_rate`, `commission_l1`, `commission_l2`, `description`) VALUES
(0, 'VIP0', 0, 0, 1, 0, '普通会员'),
(1, 'VIP1', 30000, 0.0005, 2, 1, '初级会员'),
(2, 'VIP2', 100000, 0.0010, 3, 2, '银牌会员'),
(3, 'VIP3', 250000, 0.0012, 4, 2, '金牌会员'),
(4, 'VIP4', 800000, 0.0015, 5, 3, '铂金会员'),
(5, 'VIP5', 1500000, 0.0016, 5, 4, '钻石会员'),
(6, 'VIP6', 3800000, 0.0018, 6, 4, '皇冠会员'),
(7, 'VIP7', 8000000, 0.0023, 6, 5, '至尊会员'),
(8, 'VIP8', 13000000, 0.0025, 7, 5, '传奇会员');

-- ============================================
-- 3. 团队奖励配置表
-- ============================================
CREATE TABLE IF NOT EXISTS `team_reward_config` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `member_count` INT NOT NULL COMMENT '所需团队人数',
  `min_investment` DECIMAL(15,2) NOT NULL COMMENT '累计投资要求',
  `reward_amount` DECIMAL(15,2) NOT NULL COMMENT '奖励金额',
  `reward_type` ENUM('cash', 'points') DEFAULT 'points' COMMENT '奖励类型',
  `description` VARCHAR(255) COMMENT '奖励描述',
  `is_active` TINYINT DEFAULT 1 COMMENT '是否启用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_member_investment` (`member_count`, `min_investment`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='团队奖励配置表';

-- 插入团队奖励配置数据
INSERT INTO `team_reward_config` (`member_count`, `min_investment`, `reward_amount`, `reward_type`, `description`) VALUES
(3, 80000, 1800, 'points', '团队初级奖'),
(5, 150000, 2500, 'points', '团队进阶奖'),
(10, 500000, 8800, 'points', '团队精英奖'),
(20, 1500000, 18000, 'points', '团队管理奖'),
(50, 3800000, 25000, 'points', '团队领袖奖'),
(100, 8800000, 38000, 'points', '团队总监奖'),
(200, 15000000, 66000, 'points', '团队高管奖'),
(500, 58000000, 100000, 'points', '团队董事奖'),
(1000, 98000000, 180000, 'points', '团队传奇奖');

-- ============================================
-- 4. 团队奖励领取记录表
-- ============================================
CREATE TABLE IF NOT EXISTS `team_reward_claims` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `reward_config_id` INT UNSIGNED NOT NULL COMMENT '奖励配置ID',
  `team_count` INT NOT NULL COMMENT '领取时团队人数',
  `team_investment` DECIMAL(15,2) NOT NULL COMMENT '领取时团队投资',
  `reward_amount` DECIMAL(15,2) NOT NULL COMMENT '实际奖励金额',
  `reward_type` ENUM('cash', 'points') NOT NULL COMMENT '奖励类型',
  `status` TINYINT DEFAULT 1 COMMENT '状态:1已发放',
  `claimed_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '领取时间',
  INDEX `idx_user` (`user_id`),
  INDEX `idx_reward` (`reward_config_id`),
  UNIQUE KEY `uk_user_reward` (`user_id`, `reward_config_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='团队奖励领取记录';

-- ============================================
-- 5. 支付返利配置表
-- ============================================
CREATE TABLE IF NOT EXISTS `rebate_config` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `payment_currency` ENUM('CNY', 'USDT') NOT NULL COMMENT '支付币种',
  `vip_level` TINYINT NOT NULL COMMENT 'VIP等级',
  `rebate_rate` DECIMAL(5,4) NOT NULL COMMENT '返利率',
  `rebate_currency` ENUM('CNY', 'USDT') DEFAULT 'USDT' COMMENT '返利币种(全部USDT)',
  `is_active` TINYINT DEFAULT 1 COMMENT '是否启用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_payment_vip` (`payment_currency`, `vip_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付返利配置表';

-- 插入RMB支付返利配置
INSERT INTO `rebate_config` (`payment_currency`, `vip_level`, `rebate_rate`, `rebate_currency`) VALUES
('CNY', 0, 0.0010, 'USDT'),
('CNY', 1, 0.0020, 'USDT'),
('CNY', 2, 0.0030, 'USDT'),
('CNY', 3, 0.0040, 'USDT'),
('CNY', 4, 0.0050, 'USDT'),
('CNY', 5, 0.0060, 'USDT'),
('CNY', 6, 0.0070, 'USDT'),
('CNY', 7, 0.0080, 'USDT'),
('CNY', 8, 0.0100, 'USDT');

-- 插入USDT支付返利配置
INSERT INTO `rebate_config` (`payment_currency`, `vip_level`, `rebate_rate`, `rebate_currency`) VALUES
('USDT', 0, 0.0015, 'USDT'),
('USDT', 1, 0.0025, 'USDT'),
('USDT', 2, 0.0035, 'USDT'),
('USDT', 3, 0.0045, 'USDT'),
('USDT', 4, 0.0055, 'USDT'),
('USDT', 5, 0.0065, 'USDT'),
('USDT', 6, 0.0075, 'USDT'),
('USDT', 7, 0.0085, 'USDT'),
('USDT', 8, 0.0110, 'USDT');

-- ============================================
-- 6. 汇率配置表
-- ============================================
CREATE TABLE IF NOT EXISTS `exchange_rate_config` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `from_currency` VARCHAR(10) NOT NULL COMMENT '原币种',
  `to_currency` VARCHAR(10) NOT NULL COMMENT '目标币种',
  `rate` DECIMAL(15,6) NOT NULL COMMENT '汇率',
  `source` ENUM('manual', 'api') DEFAULT 'manual' COMMENT '来源',
  `is_active` TINYINT DEFAULT 1 COMMENT '是否启用',
  `updated_by` INT UNSIGNED COMMENT '更新人ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_currency_pair` (`from_currency`, `to_currency`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='汇率配置表';

-- 插入默认汇率
INSERT INTO `exchange_rate_config` (`from_currency`, `to_currency`, `rate`, `source`) VALUES
('USDT', 'CNY', 7.200000, 'manual'),
('CNY', 'USDT', 0.138889, 'manual');

-- ============================================
-- 7. 增强充值记录表 - 支持双币种
-- ============================================
ALTER TABLE `recharge_records`
  ADD COLUMN `currency` ENUM('CNY', 'USDT') DEFAULT 'CNY' COMMENT '币种' AFTER `amount`,
  ADD COLUMN `amount_usdt` DECIMAL(15,4) DEFAULT NULL COMMENT 'USDT金额' AFTER `currency`,
  ADD COLUMN `exchange_rate` DECIMAL(15,6) DEFAULT NULL COMMENT '当时汇率' AFTER `amount_usdt`,
  ADD COLUMN `rebate_amount` DECIMAL(15,4) DEFAULT 0 COMMENT '返利金额(USDT)' AFTER `exchange_rate`,
  ADD COLUMN `rebate_status` TINYINT DEFAULT 0 COMMENT '返利状态:0未发放 1已发放' AFTER `rebate_amount`,
  ADD COLUMN `proof_image` VARCHAR(500) COMMENT '支付凭证图片' AFTER `certificate`,
  ADD INDEX `idx_currency` (`currency`);

-- ============================================
-- 8. 增强提现记录表 - 支持双币种
-- ============================================
ALTER TABLE `withdraw_records`
  ADD COLUMN `currency` ENUM('CNY', 'USDT') DEFAULT 'CNY' COMMENT '币种' AFTER `amount`,
  ADD COLUMN `amount_usdt` DECIMAL(15,4) DEFAULT NULL COMMENT 'USDT金额' AFTER `currency`,
  ADD COLUMN `exchange_rate` DECIMAL(15,6) DEFAULT NULL COMMENT '当时汇率' AFTER `amount_usdt`,
  ADD INDEX `idx_currency` (`currency`);

-- ============================================
-- 9. 用户活动日志表 (登录、IP、设备、位置)
-- ============================================
CREATE TABLE IF NOT EXISTS `user_activity_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `activity_type` VARCHAR(50) NOT NULL COMMENT '活动类型:login/logout/action',
  `ip_address` VARCHAR(50) COMMENT 'IP地址',
  `device_info` VARCHAR(500) COMMENT '设备信息',
  `location` VARCHAR(255) COMMENT '位置信息',
  `user_agent` TEXT COMMENT 'User Agent',
  `extra_data` JSON COMMENT '额外数据',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_type` (`activity_type`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户活动日志';

-- ============================================
-- 10. 日历统计记录表 (日历宝功能)
-- ============================================
CREATE TABLE IF NOT EXISTS `calendar_entries` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `entry_date` DATE NOT NULL COMMENT '日期',
  `entry_type` VARCHAR(50) NOT NULL COMMENT '条目类型',
  `currency` ENUM('CNY', 'USDT') NOT NULL COMMENT '币种',
  `amount` DECIMAL(15,4) NOT NULL COMMENT '金额',
  `description` VARCHAR(255) COMMENT '描述',
  `reference_id` BIGINT UNSIGNED COMMENT '关联ID',
  `reference_type` VARCHAR(50) COMMENT '关联类型',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_date` (`user_id`, `entry_date`),
  INDEX `idx_type` (`entry_type`),
  INDEX `idx_date` (`entry_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='日历统计记录';

-- ============================================
-- 11. 团队关系表 (优化树形结构)
-- ============================================
CREATE TABLE IF NOT EXISTS `user_team_relations` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `parent_id` INT UNSIGNED NOT NULL COMMENT '直接上级ID',
  `ancestor_id` INT UNSIGNED NOT NULL COMMENT '顶级祖先ID',
  `level` TINYINT NOT NULL COMMENT '层级:1直推 2间推',
  `path` VARCHAR(500) COMMENT '路径(逗号分隔ID)',
  `is_internal` TINYINT DEFAULT 0 COMMENT '是否内部员工',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_parent` (`parent_id`),
  INDEX `idx_ancestor` (`ancestor_id`),
  INDEX `idx_level` (`level`),
  UNIQUE KEY `uk_user_parent` (`user_id`, `parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='团队关系表';

-- ============================================
-- 12. 返利发放记录表
-- ============================================
CREATE TABLE IF NOT EXISTS `rebate_records` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `source_type` VARCHAR(50) NOT NULL COMMENT '来源类型:recharge/investment',
  `source_id` BIGINT UNSIGNED NOT NULL COMMENT '来源ID',
  `payment_currency` ENUM('CNY', 'USDT') NOT NULL COMMENT '支付币种',
  `payment_amount` DECIMAL(15,4) NOT NULL COMMENT '支付金额',
  `rebate_currency` ENUM('CNY', 'USDT') DEFAULT 'USDT' COMMENT '返利币种',
  `rebate_amount` DECIMAL(15,4) NOT NULL COMMENT '返利金额',
  `rebate_rate` DECIMAL(5,4) NOT NULL COMMENT '返利率',
  `vip_level` TINYINT NOT NULL COMMENT '当时VIP等级',
  `exchange_rate` DECIMAL(15,6) COMMENT '当时汇率',
  `status` TINYINT DEFAULT 1 COMMENT '状态:1已发放',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_source` (`source_type`, `source_id`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='返利发放记录';

-- ============================================
-- 13. 邀请码关系表
-- ============================================
CREATE TABLE IF NOT EXISTS `invite_relations` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `inviter_id` INT UNSIGNED NOT NULL COMMENT '邀请人ID',
  `inviter_user_id` VARCHAR(20) NOT NULL COMMENT '邀请人8位ID',
  `invitee_id` INT UNSIGNED NOT NULL COMMENT '被邀请人ID',
  `invitee_user_id` VARCHAR(20) NOT NULL COMMENT '被邀请人8位ID',
  `invite_code` VARCHAR(20) NOT NULL COMMENT '使用的邀请码',
  `registration_ip` VARCHAR(50) COMMENT '注册IP',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_inviter` (`inviter_id`),
  INDEX `idx_invitee` (`invitee_id`),
  UNIQUE KEY `uk_invitee` (`invitee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='邀请关系表';

-- ============================================
-- 14. 支付方式配置表
-- ============================================
CREATE TABLE IF NOT EXISTS `payment_method_config` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `method_code` VARCHAR(50) NOT NULL UNIQUE COMMENT '支付方式代码',
  `method_name` VARCHAR(100) NOT NULL COMMENT '支付方式名称',
  `currency` ENUM('CNY', 'USDT') NOT NULL COMMENT '币种',
  `min_amount` DECIMAL(15,2) NOT NULL COMMENT '最低金额',
  `max_amount` DECIMAL(15,2) NOT NULL COMMENT '最高金额',
  `fee_rate` DECIMAL(5,4) DEFAULT 0 COMMENT '手续费率',
  `requires_proof` TINYINT DEFAULT 0 COMMENT '是否需要凭证',
  `icon` VARCHAR(255) COMMENT '图标',
  `description` VARCHAR(255) COMMENT '描述',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `is_enabled` TINYINT DEFAULT 1 COMMENT '是否启用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付方式配置';

-- 插入默认支付方式
INSERT INTO `payment_method_config` (`method_code`, `method_name`, `currency`, `min_amount`, `max_amount`, `requires_proof`, `description`, `sort_order`) VALUES
('alipay', '支付宝', 'CNY', 100, 500000, 0, '支付宝快捷充值', 1),
('wechat', '微信支付', 'CNY', 100, 500000, 0, '微信快捷充值', 2),
('bank', '银行卡转账', 'CNY', 1000, 5000000, 1, '银行卡转账充值（需上传凭证）', 3),
('usdt_trc20', 'USDT-TRC20', 'USDT', 10, 1000000, 0, 'USDT充值 (TRC20网络)', 4),
('usdt_erc20', 'USDT-ERC20', 'USDT', 50, 1000000, 0, 'USDT充值 (ERC20网络)', 5);

-- ============================================
-- 15. 后台统计汇总表 (用于仪表盘快速查询)
-- ============================================
CREATE TABLE IF NOT EXISTS `dashboard_summary` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `summary_date` DATE NOT NULL COMMENT '统计日期',
  `new_users` INT DEFAULT 0 COMMENT '新注册用户',
  `total_users` INT DEFAULT 0 COMMENT '总用户数',
  `recharge_cny` DECIMAL(15,2) DEFAULT 0 COMMENT '人民币充值总额',
  `recharge_usdt` DECIMAL(15,4) DEFAULT 0 COMMENT 'USDT充值总额',
  `withdraw_cny` DECIMAL(15,2) DEFAULT 0 COMMENT '人民币提现总额',
  `withdraw_usdt` DECIMAL(15,4) DEFAULT 0 COMMENT 'USDT提现总额',
  `investment_total` DECIMAL(15,2) DEFAULT 0 COMMENT '投资总额',
  `profit_distributed` DECIMAL(15,2) DEFAULT 0 COMMENT '发放收益总额',
  `rebate_distributed` DECIMAL(15,4) DEFAULT 0 COMMENT '发放返利总额(USDT)',
  `pending_recharges` INT DEFAULT 0 COMMENT '待审核充值数',
  `pending_withdrawals` INT DEFAULT 0 COMMENT '待审核提现数',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_date` (`summary_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='仪表盘统计汇总';

-- ============================================
-- 视图: 团队统计视图 (排除内部员工)
-- ============================================
CREATE OR REPLACE VIEW `v_team_stats` AS
SELECT 
  utr.parent_id AS leader_id,
  utr.level,
  COUNT(DISTINCT CASE WHEN u.is_internal = 0 THEN u.id END) AS member_count,
  SUM(CASE WHEN u.is_internal = 0 THEN u.total_investment ELSE 0 END) AS total_investment,
  SUM(CASE WHEN u.is_internal = 0 THEN u.balance_cny + u.balance_usdt * 
    (SELECT rate FROM exchange_rate_config WHERE from_currency = 'USDT' AND to_currency = 'CNY' LIMIT 1) 
  ELSE 0 END) AS total_balance
FROM user_team_relations utr
JOIN users u ON utr.user_id = u.id
GROUP BY utr.parent_id, utr.level;
