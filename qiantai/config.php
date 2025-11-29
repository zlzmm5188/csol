<?php
/**
 * 积分系统配置管理
 * 支持VIP等级动态奖励
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$action = $_GET['action'] ?? '';

// 从VIP配置中心获取配置
require_once 'vip-config.php';

// VIP等级邀请奖励配置（从vip-config.php同步）
$vipInviteRewards = array_column($vipLevels, 'invite_points', 'level');

// 首投额外奖励（从vip-config.php同步）
$firstInvestBonus = array_column($vipLevels, 'first_invest_bonus', 'level');

// 其他积分规则
$pointsConfig = [
    'daily_checkin' => 10,          // 每日签到基础积分
    'invest_rate' => 1,             // 投资1元=1积分
    'vip_upgrade_bonus' => [        // 升级VIP奖励
        1 => 0,
        2 => 100,
        3 => 300,
        4 => 500,
        5 => 1000,
        6 => 2000,
    ],
    'exchange_rate' => 1,           // 1积分=1元
];

// 获取邀请配置（根据VIP等级）
if ($action === 'invite_config') {
    $vipLevel = intval($_GET['vip'] ?? 1);
    $vipLevel = max(1, min(6, $vipLevel));

    echo json_encode([
        'success' => true,
        'data' => [
            'vip_level' => $vipLevel,
            'invite_points' => $vipInviteRewards[$vipLevel],
            'first_invest_bonus' => $firstInvestBonus[$vipLevel],
            'total_reward' => $vipInviteRewards[$vipLevel] + $firstInvestBonus[$vipLevel],
            'all_vip_rewards' => $vipInviteRewards,
            'all_first_bonus' => $firstInvestBonus
        ]
    ]);
    exit;
}

// 获取所有配置
if ($action === 'all') {
    echo json_encode([
        'success' => true,
        'data' => [
            'vip_invite_rewards' => $vipInviteRewards,
            'first_invest_bonus' => $firstInvestBonus,
            'basic_config' => $pointsConfig
        ]
    ]);
    exit;
}

// 邀请成功回调（自动发放积分）
if ($action === 'invite_success') {
    $inviterUserId = $_POST['inviter_user_id'] ?? 0;
    $inviterVipLevel = intval($_POST['inviter_vip_level'] ?? 1);
    $isFirstInvest = boolval($_POST['is_first_invest'] ?? false);

    if (!$inviterUserId) {
        echo json_encode(['success' => false, 'msg' => '参数错误']);
        exit;
    }

    // 计算奖励积分
    $baseReward = $vipInviteRewards[$inviterVipLevel];
    $bonusReward = $isFirstInvest ? $firstInvestBonus[$inviterVipLevel] : 0;
    $totalPoints = $baseReward + $bonusReward;

    // TODO: 调用后台接口给用户增加积分
    // http->post('/user/points/add', ['user_id' => $inviterUserId, 'points' => $totalPoints])

    echo json_encode([
        'success' => true,
        'data' => [
            'base_reward' => $baseReward,
            'bonus_reward' => $bonusReward,
            'total_points' => $totalPoints,
            'msg' => "邀请成功！获得{$totalPoints}积分"
        ]
    ]);
    exit;
}

// 更新配置（需要管理员权限）
if ($action === 'update' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    // TODO: 验证管理员权限
    // TODO: 保存到数据库或配置文件

    echo json_encode([
        'success' => true,
        'msg' => '配置更新成功'
    ]);
    exit;
}

// 默认返回
echo json_encode([
    'success' => false,
    'msg' => '未知操作'
]);
