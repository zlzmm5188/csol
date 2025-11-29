<?php
/**
 * API代理文件 - 解决CORS跨域问题
 * 将前端的API请求代理到后端服务器
 */

// 设置CORS响应头（允许前端域名访问）
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, token, Authorization');
header('Access-Control-Max-Age: 86400');

// 处理OPTIONS预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 后端API地址
$API_BASE = 'https://apis.copla.top';

// 获取请求路径（去掉 /api-proxy.php 前缀）
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// 提取API路径
// 例如：/providence/api-proxy.php/user/user/login -> /user/user/login
$apiPath = str_replace('/providence/api-proxy.php', '', $path);
if (empty($apiPath) || $apiPath === '/') {
    $apiPath = '/api/login.php'; // 默认登录路径
}

// 构建完整URL
$url = $API_BASE . $apiPath;

// 如果有查询参数，添加到URL
if (!empty($_SERVER['QUERY_STRING'])) {
    $url .= '?' . $_SERVER['QUERY_STRING'];
}

// 准备请求选项
$options = [
    'http' => [
        'method' => $_SERVER['REQUEST_METHOD'],
        'header' => [],
        'content' => null,
        'timeout' => 30
    ]
];

// 复制请求头（排除一些不需要的）
$headersToForward = [
    'Content-Type',
    'Accept',
    'token',
    'Authorization'
];

foreach ($headersToForward as $header) {
    $headerKey = 'HTTP_' . str_replace('-', '_', strtoupper($header));
    if (isset($_SERVER[$headerKey])) {
        $options['http']['header'][] = $header . ': ' . $_SERVER[$headerKey];
    }
}

// 如果是POST/PUT等有body的请求，读取body
if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH'])) {
    $options['http']['content'] = file_get_contents('php://input');
}

// 发送请求
$context = stream_context_create($options);
$response = @file_get_contents($url, false, $context);

// 如果请求失败
if ($response === false) {
    http_response_code(500);
    echo json_encode([
        'code' => -1,
        'msg' => 'API请求失败',
        'data' => null
    ]);
    exit;
}

// 获取响应头
$responseHeaders = [];
if (isset($http_response_header)) {
    foreach ($http_response_header as $header) {
        // 跳过一些不需要的响应头
        if (stripos($header, 'Content-Type:') === 0) {
            header($header);
        }
    }
}

// 输出响应
echo $response;
