<?php
/**
 * VIP等级配置管理
 * 支持前后台VIP等级、加息、奖励等配置
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

$action = $_GET['action'] ?? '';

// VIP等级配置（8个等级）
$vipLevels = [
    [
        'code' => '1-0',
        'level' => 1,
        'name' => '普通会员',
        'requirement' => 0,              // 累计投资要求（元）
        'rate' => 0.3,                   // 专属加息（%）
        'reward_level' => '无',          // 邀请奖励提升
        'invite_points' => 200,          // 邀请好友积分
        'first_invest_bonus' => 0,       // 首投额外积分
        'commission_level_1' => 0.5,     // 一级佣金比例（%）
        'commission_level_2' => 0.2,     // 二级佣金比例（%）
    ],
    [
        'code' => '1-1',
        'level' => 2,
        'name' => '初级会员',
        'requirement' => 10000,
        'rate' => 0.3,
        'reward_level' => '提升一级',
        'invite_points' => 300,
        'first_invest_bonus' => 100,
        'commission_level_1' => 0.6,
        'commission_level_2' => 0.25,
    ],
    [
        'code' => '2-1',
        'level' => 3,
        'name' => '白银会员',
        'requirement' => 50000,
        'rate' => 0.4,
        'reward_level' => '提升二级',
        'invite_points' => 500,
        'first_invest_bonus' => 300,
        'commission_level_1' => 0.7,
        'commission_level_2' => 0.3,
    ],
    [
        'code' => '2-2',
        'level' => 4,
        'name' => '黄金贵宾',
        'requirement' => 100000,
        'rate' => 0.5,
        'reward_level' => '提升三级',
        'invite_points' => 800,
        'first_invest_bonus' => 500,
        'commission_level_1' => 0.8,
        'commission_level_2' => 0.35,
    ],
    [
        'code' => '3-1',
        'level' => 5,
        'name' => '铂金贵宾',
        'requirement' => 300000,
        'rate' => 0.6,
        'reward_level' => '提升四级',
        'invite_points' => 1200,
        'first_invest_bonus' => 1000,
        'commission_level_1' => 0.9,
        'commission_level_2' => 0.4,
    ],
    [
        'code' => '3-2',
        'level' => 6,
        'name' => '钻石贵宾',
        'requirement' => 500000,
        'rate' => 0.8,
        'reward_level' => '提升五级',
        'invite_points' => 2000,
        'first_invest_bonus' => 2000,
        'commission_level_1' => 1.0,
        'commission_level_2' => 0.45,
    ],
    [
        'code' => '3-3',
        'level' => 7,
        'name' => '黑钻贵宾',
        'requirement' => 1000000,
        'rate' => 1.0,
        'reward_level' => '提升六级',
        'invite_points' => 3000,
        'first_invest_bonus' => 3000,
        'commission_level_1' => 1.2,
        'commission_level_2' => 0.5,
    ],
    [
        'code' => '4-3',
        'level' => 8,
        'name' => '至尊贵宾',
        'requirement' => 3000000,
        'rate' => 1.0,
        'reward_level' => '最高等级',
        'invite_points' => 5000,
        'first_invest_bonus' => 5000,
        'commission_level_1' => 1.5,
        'commission_level_2' => 0.6,
    ],
];

// 获取所有VIP等级配置
if ($action === 'get_vip_config') {
    echo json_encode([
        'success' => true,
        'data' => [
            'vipLevels' => $vipLevels,
            'totalLevels' => count($vipLevels)
        ]
    ]);
    exit;
}

// 根据累计投资计算VIP等级
if ($action === 'calculate_vip') {
    $totalInvestment = floatval($_GET['total_investment'] ?? 0);

    $currentVip = $vipLevels[0]; // 默认普通会员

    // 从高到低查找符合条件的等级
    for ($i = count($vipLevels) - 1; $i >= 0; $i--) {
        if ($totalInvestment >= $vipLevels[$i]['requirement']) {
            $currentVip = $vipLevels[$i];
            break;
        }
    }

    // 计算距离下一等级还需投资多少
    $nextVip = null;
    $nextRequirement = 0;
    for ($i = 0; $i < count($vipLevels); $i++) {
        if ($vipLevels[$i]['level'] > $currentVip['level']) {
            $nextVip = $vipLevels[$i];
            $nextRequirement = $nextVip['requirement'] - $totalInvestment;
            break;
        }
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'current_vip' => $currentVip,
            'next_vip' => $nextVip,
            'next_requirement' => $nextRequirement,
            'progress_percentage' => $nextVip ? ($totalInvestment / $nextVip['requirement'] * 100) : 100
        ]
    ]);
    exit;
}

// 获取单个VIP等级信息
if ($action === 'get_level') {
    $code = $_GET['code'] ?? '1-0';

    $vipInfo = null;
    foreach ($vipLevels as $vip) {
        if ($vip['code'] === $code) {
            $vipInfo = $vip;
            break;
        }
    }

    if ($vipInfo) {
        echo json_encode([
            'success' => true,
            'data' => $vipInfo
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'msg' => 'VIP等级不存在'
        ]);
    }
    exit;
}

// 计算项目加息后的收益
if ($action === 'calculate_interest') {
    $projectRate = floatval($_GET['project_rate'] ?? 0);      // 项目基础利率
    $vipCode = $_GET['vip_code'] ?? '1-0';                    // VIP等级代码
    $investAmount = floatval($_GET['invest_amount'] ?? 0);    // 投资金额
    $days = intval($_GET['days'] ?? 0);                       // 投资天数

    // 获取VIP加息
    $vipRate = 0;
    foreach ($vipLevels as $vip) {
        if ($vip['code'] === $vipCode) {
            $vipRate = $vip['rate'];
            break;
        }
    }

    // 计算收益
    $totalRate = $projectRate + $vipRate;
    $baseIncome = $investAmount * ($projectRate / 100) * ($days / 365);
    $vipBonus = $investAmount * ($vipRate / 100) * ($days / 365);
    $totalIncome = $baseIncome + $vipBonus;

    echo json_encode([
        'success' => true,
        'data' => [
            'project_rate' => $projectRate,
            'vip_rate' => $vipRate,
            'total_rate' => $totalRate,
            'base_income' => round($baseIncome, 2),
            'vip_bonus' => round($vipBonus, 2),
            'total_income' => round($totalIncome, 2)
        ]
    ]);
    exit;
}

// 检查用户是否有权限购买项目
if ($action === 'check_permission') {
    $userVipLevel = intval($_GET['user_vip_level'] ?? 1);     // 用户VIP等级
    $projectVipLevel = intval($_GET['project_vip_level'] ?? 1); // 项目要求VIP等级

    $hasPermission = $userVipLevel >= $projectVipLevel;

    echo json_encode([
        'success' => true,
        'data' => [
            'has_permission' => $hasPermission,
            'user_vip_level' => $userVipLevel,
            'required_vip_level' => $projectVipLevel,
            'msg' => $hasPermission ? '可以购买' : '需要提升VIP等级才能购买'
        ]
    ]);
    exit;
}

// 更新VIP配置（管理员功能）
if ($action === 'update_config' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    // TODO: 验证管理员权限
    // TODO: 更新数据库配置

    // 这里可以将配置保存到JSON文件或数据库
    // file_put_contents('vip-config.json', json_encode($input, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    echo json_encode([
        'success' => true,
        'msg' => 'VIP配置更新成功'
    ]);
    exit;
}

// 获取VIP升级奖励
if ($action === 'upgrade_rewards') {
    $fromLevel = intval($_GET['from_level'] ?? 1);
    $toLevel = intval($_GET['to_level'] ?? 2);

    $rewards = [];
    for ($i = $fromLevel; $i < $toLevel && $i < count($vipLevels); $i++) {
        $rewards[] = [
            'level' => $vipLevels[$i]['level'],
            'name' => $vipLevels[$i]['name'],
            'bonus_points' => $vipLevels[$i]['first_invest_bonus']
        ];
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'rewards' => $rewards,
            'total_points' => array_sum(array_column($rewards, 'bonus_points'))
        ]
    ]);
    exit;
}

// 默认返回所有配置
echo json_encode([
    'success' => true,
    'data' => [
        'vipLevels' => $vipLevels,
        'actions' => [
            'get_vip_config' => '获取所有VIP配置',
            'calculate_vip' => '根据累计投资计算VIP等级',
            'get_level' => '获取单个VIP等级信息',
            'calculate_interest' => '计算项目加息后的收益',
            'check_permission' => '检查购买权限',
            'update_config' => '更新VIP配置（POST）',
            'upgrade_rewards' => '获取升级奖励'
        ]
    ]
]);
