<?php
// 检查邀请码是否存在，决定显示推广页还是正常首页

// 数据库配置
$host = '127.0.0.1';
$dbname = 'v2_abcmall_one';
$username = 'v2_abcmall_one';
$password = 'HT3QtZMSnXrF1Ajc';

// 获取请求的host
$requestHost = $_SERVER['HTTP_HOST'] ?? '';

// 支持的域名列表
$supportedDomains = [
    '4kp3l0iq.top'
];

$inviteCode = null;
$isSubdomain = false;

// 判断是否是子域名（支持多个主域名）
foreach ($supportedDomains as $domain) {
    // 匹配子域名模式：XXX.4kp3l0iq.top
    $pattern = '/^([a-zA-Z0-9]+)\.' . preg_quote($domain, '/') . '$/';
    if (preg_match($pattern, $requestHost, $matches)) {
        $inviteCode = strtoupper($matches[1]);
        $isSubdomain = true;
        break;
    }
}

// 如果不是子域名，显示正常首页
if (!$isSubdomain) {
    $indexPath = __DIR__ . '/index.html';
    if (file_exists($indexPath)) {
        readfile($indexPath);
    } else {
        header('HTTP/1.1 404 Not Found');
        echo '首页文件不存在';
    }
    exit;
}

// 如果是子域名，检查邀请码是否存在
    try {
        // 连接数据库
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 查询邀请码是否存在（不区分大小写）
    $stmt = $pdo->prepare("SELECT id FROM fa_user WHERE UPPER(invite) = :invite LIMIT 1");
    $stmt->execute(['invite' => strtoupper($inviteCode)]);
        $user = $stmt->fetch();

        if ($user) {
            // 邀请码存在，显示推广页
            $_GET['code'] = $inviteCode;
        $landingPath = __DIR__ . '/invite-landing.html';
        if (file_exists($landingPath)) {
            readfile($landingPath);
        } else {
            // 如果文件不存在，输出HTML内容
            header('Content-Type: text/html; charset=utf-8');
            echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>邀请链接</title></head><body>';
            echo '<h1>欢迎！您的邀请码：' . htmlspecialchars($inviteCode) . '</h1>';
            echo '<script>window.location.href="register.html?code=' . urlencode($inviteCode) . '";</script>';
            echo '</body></html>';
        }
            exit;
    } else {
        // 邀请码不存在，显示正常首页
        $indexPath = __DIR__ . '/index.html';
        if (file_exists($indexPath)) {
            readfile($indexPath);
        } else {
            header('HTTP/1.1 404 Not Found');
            echo '首页文件不存在';
        }
        exit;
    }
} catch (PDOException $e) {
    // 数据库错误，记录日志并显示正常首页
    error_log('[check_invite.php] 数据库错误: ' . $e->getMessage());
    $indexPath = __DIR__ . '/index.html';
    if (file_exists($indexPath)) {
        readfile($indexPath);
} else {
        header('HTTP/1.1 500 Internal Server Error');
        echo '服务器错误';
    }
    exit;
}
