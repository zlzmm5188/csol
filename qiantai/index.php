<?php
// 子域名智能路由
$hostname = $_SERVER['HTTP_HOST'];
$parts = explode('.', $hostname);

// 检查是否是子域名（排除 www 和主域名）
$isSubdomain = count($parts) >= 3 &&
               $parts[0] !== 'www' &&
               $parts[0] !== 'qiantai' &&
               preg_match('/^[a-zA-Z0-9]+$/', $parts[0]);

if ($isSubdomain) {
    // 子域名：显示邀请卡片落地页
    include 'index-subdomain.html';
} else {
    // 主域名：显示正常首页
    include 'index.html';
}
?>
