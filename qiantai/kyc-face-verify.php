<?php

/**
 * 实名认证人脸比对接口 - InsightFace版本
 * 第二道防线：自动比对身份证照片和自拍照
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, token');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

require_once __DIR__ . '/../providence-admin/config/bootstrap.php';

// Python脚本路径
define('PYTHON_SCRIPT', '/www/wwwroot/providence-ocr/face_compare_insightface.py');

/**
 * 返回JSON响应
 */
function jsonResponse($code, $message, $data = [])
{
    echo json_encode([
        'code' => $code,
        'message' => $message,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * 获取数据库连接
 */
function getDB()
{
    return Database::getInstance();
}

/**
 * 验证用户token（使用JWT）
 */
function verifyUser()
{
    // 从多个来源获取token：POST、Header、GET
    $token = $_POST['token'] ?? $_SERVER['HTTP_TOKEN'] ?? $_GET['token'] ?? '';

    // 如果还是空，尝试从HTTP_AUTHORIZATION头获取
    if (empty($token) && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $auth = $_SERVER['HTTP_AUTHORIZATION'];
        if (preg_match('/Bearer\s+(.*)$/i', $auth, $matches)) {
            $token = $matches[1];
        }
    }

    // 尝试从getallheaders获取
    if (empty($token) && function_exists('getallheaders')) {
        $headers = getallheaders();
        $token = $headers['token'] ?? $headers['Token'] ?? '';
    }

    if (empty($token)) {
        error_log('[KYC验证] Token为空');
        jsonResponse(-1, '请先登录', ['need_login' => true]);
    }

    // 使用Auth类验证JWT Token
    $userData = Auth::verifyToken($token);

    if (!$userData) {
        error_log('[KYC验证] Token验证失败: ' . substr($token, 0, 30) . '...');
        jsonResponse(-1, '登录已过期，请重新登录', ['need_login' => true]);
    }

    // 从数据库获取完整用户信息
    $db = getDB();
    $userId = $userData['user_id'];
    $stmt = $db->prepare("SELECT id, username FROM users WHERE id = ? AND status = 1");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        error_log('[KYC验证] 用户不存在或已禁用: ' . $userId);
        jsonResponse(-1, '用户不存在或已被禁用', ['need_login' => true]);
    }

    error_log('[KYC验证] 用户验证成功: ' . $user['username'] . ' (ID: ' . $user['id'] . ')');
    return $user;
}

/**
 * 调用Python脚本进行人脸比对
 */
function compareFacesWithInsightFace($idCardPhotoPath, $selfiePhotoPath)
{
    $command = sprintf(
        'python3 %s %s %s 2>&1',
        escapeshellarg(PYTHON_SCRIPT),
        escapeshellarg($idCardPhotoPath),
        escapeshellarg($selfiePhotoPath)
    );

    $output = shell_exec($command);
    $result = json_decode($output, true);

    if (!$result || !isset($result['success'])) {
        return [
            'success' => false,
            'message' => '人脸识别服务异常'
        ];
    }

    return $result;
}

// ========== 主逻辑 ==========

// 只接受POST请求
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(-1, '请求方法错误');
}

// 验证用户登录
$user = verifyUser();
$userId = $user['id'];

// 检查是否已提交过认证
$db = getDB();
$stmt = $db->prepare("SELECT * FROM user_kyc WHERE user_id = ? AND status IN (0, 2) ORDER BY id DESC LIMIT 1");
$stmt->execute([$userId]);
$existingKyc = $stmt->fetch();

if ($existingKyc) {
    if ($existingKyc['status'] == 2) {
        jsonResponse(-1, '您已完成实名认证');
    } else {
        jsonResponse(-1, '您的认证正在审核中，请勿重复提交');
    }
}

// 检查上传文件
if (!isset($_FILES['id_card_file']) || !isset($_FILES['selfie'])) {
    jsonResponse(-1, '请上传身份证和自拍照');
}

$idCardFile = $_FILES['id_card_file'];
$selfieFile = $_FILES['selfie'];

// 验证文件类型
$allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
if (!in_array($idCardFile['type'], $allowedTypes) || !in_array($selfieFile['type'], $allowedTypes)) {
    jsonResponse(-1, '只支持JPG和PNG格式');
}

// 验证文件大小（5MB）
if ($idCardFile['size'] > 5 * 1024 * 1024 || $selfieFile['size'] > 5 * 1024 * 1024) {
    jsonResponse(-1, '照片大小不能超过5MB');
}

// 创建临时目录
$tempDir = '/www/wwwroot/providence/uploads/kyc/temp/' . $userId . '_' . time();
if (!is_dir($tempDir)) {
    mkdir($tempDir, 0755, true);
}

// 保存到临时目录
$tempIdCard = $tempDir . '/id_card.jpg';
$tempSelfie = $tempDir . '/selfie.jpg';

if (!move_uploaded_file($idCardFile['tmp_name'], $tempIdCard)) {
    jsonResponse(-1, '身份证照片保存失败');
}

if (!move_uploaded_file($selfieFile['tmp_name'], $tempSelfie)) {
    @unlink($tempIdCard);
    jsonResponse(-1, '自拍照保存失败');
}

// 调用Python脚本进行人脸比对
$result = compareFacesWithInsightFace($tempIdCard, $tempSelfie);

// 检查识别结果
if (!$result['success']) {
    // 删除临时文件
    @unlink($tempIdCard);
    @unlink($tempSelfie);
    @rmdir($tempDir);
    jsonResponse(-1, $result['message'] ?? '人脸识别失败');
}

// 获取相似度
$similarity = floatval($result['similarity'] ?? 0);
$isMatch = $similarity >= 80; // 阈值：80%

if (!$isMatch) {
    // 不匹配 - 删除临时文件
    @unlink($tempIdCard);
    @unlink($tempSelfie);
    @rmdir($tempDir);

    // 记录失败尝试
    $stmt = $db->prepare("
        INSERT INTO kyc_verify_log (user_id, similarity, result, ip, created_at)
        VALUES (?, ?, 'failed', ?, NOW())
    ");
    $stmt->execute([$userId, $similarity, $_SERVER['REMOTE_ADDR'] ?? '']);

    jsonResponse(-1, '人脸不匹配，请本人对准识别重新拍照', [
        'similarity' => $similarity,
        'threshold' => 80
    ]);
}

// 匹配成功 - 移动到正式目录
$finalDir = '/www/wwwroot/providence/uploads/kyc/' . $userId;
if (!is_dir($finalDir)) {
    mkdir($finalDir, 0755, true);
}

$timestamp = time();
$finalIdCard = $finalDir . '/id_card_' . $timestamp . '.jpg';
$finalSelfie = $finalDir . '/selfie_' . $timestamp . '.jpg';

if (!rename($tempIdCard, $finalIdCard) || !rename($tempSelfie, $finalSelfie)) {
    jsonResponse(-1, '文件保存失败');
}

// 删除临时目录
@rmdir($tempDir);

// 转换为相对路径
$idCardPath = str_replace('/www/wwwroot/providence', '', $finalIdCard);
$selfiePath = str_replace('/www/wwwroot/providence', '', $finalSelfie);

// 获取real_name和id_card（从OCR或用户输入）
$realName = $_POST['real_name'] ?? '';
$idCard = $_POST['id_card'] ?? '';

// 保存到数据库
$stmt = $db->prepare("
    INSERT INTO user_kyc (
        user_id, real_name, id_card, id_card_front, hand_held_photo,
        face_similarity, face_check_result, face_check_time,
        submit_time, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'auto_passed', NOW(), NOW(), 0, NOW())
");

$stmt->execute([
    $userId,
    $realName,
    $idCard,
    $idCardPath,
    $selfiePath,
    $similarity
]);

$kycId = $db->lastInsertId();

// 记录成功日志
$stmt = $db->prepare("
    INSERT INTO kyc_verify_log (user_id, kyc_id, similarity, result, ip, created_at)
    VALUES (?, ?, ?, 'success', ?, NOW())
");
$stmt->execute([$userId, $kycId, $similarity, $_SERVER['REMOTE_ADDR'] ?? '']);

// 返回成功
jsonResponse(1, '验证成功，您的实名认证已提交', [
    'kyc_id' => $kycId,
    'similarity' => $similarity,
    'status' => 'pending'
]);
