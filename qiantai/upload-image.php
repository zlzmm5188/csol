<?php
/**
 * 图片上传工具
 * 上传图片到 /providence/img 目录
 */

// 设置上传目录
$uploadDir = __DIR__ . '/img/';
$maxFileSize = 5 * 1024 * 1024; // 5MB
$allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
$allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

header('Content-Type: application/json; charset=utf-8');

// 仅允许POST请求
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'msg' => '仅允许POST请求']);
    exit;
}

// 检查是否有文件上传
if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'msg' => '未上传文件或上传失败']);
    exit;
}

$file = $_FILES['image'];

// 验证文件大小
if ($file['size'] > $maxFileSize) {
    http_response_code(400);
    echo json_encode(['success' => false, 'msg' => '文件大小不能超过5MB']);
    exit;
}

// 验证文件类型
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mimeType, $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'msg' => '只允许上传图片文件（JPG、PNG、GIF、WEBP）']);
    exit;
}

// 获取文件扩展名
$extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if (!in_array($extension, $allowedExtensions)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'msg' => '文件扩展名不允许']);
    exit;
}

// 验证文件头（Magic Number）
$fileHandle = fopen($file['tmp_name'], 'rb');
$fileHeader = fread($fileHandle, 12);
fclose($fileHandle);

$validHeaders = [
    "\xFF\xD8\xFF", // JPEG
    "\x89\x50\x4E\x47\x0D\x0A\x1A\x0A", // PNG
    "GIF87a", // GIF87a
    "GIF89a", // GIF89a
    "RIFF", // WEBP (前4字节)
];

$isValidImage = false;
foreach ($validHeaders as $header) {
    if (substr($fileHeader, 0, strlen($header)) === $header) {
        $isValidImage = true;
        break;
    }
}

// 检查WEBP (需要检查更多字节)
if (!$isValidImage && substr($fileHeader, 0, 4) === "RIFF") {
    $webpHeader = fread(fopen($file['tmp_name'], 'rb'), 12);
    if (substr($webpHeader, 8, 4) === "WEBP") {
        $isValidImage = true;
    }
}

if (!$isValidImage) {
    http_response_code(400);
    echo json_encode(['success' => false, 'msg' => '文件内容不是有效的图片格式']);
    exit;
}

// 生成安全的文件名
$fileName = preg_replace('/[^a-zA-Z0-9._-]/', '_', pathinfo($file['name'], PATHINFO_FILENAME));
$fileName = substr($fileName, 0, 100); // 限制文件名长度
$newFileName = $fileName . '_' . time() . '_' . rand(1000, 9999) . '.' . $extension;
$targetPath = $uploadDir . $newFileName;

// 确保上传目录存在
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// 移动文件
if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    // 设置文件权限（只读，不可执行）
    chmod($targetPath, 0644);

    // 返回相对路径
    $relativePath = 'img/' . $newFileName;

    echo json_encode([
        'success' => true,
        'msg' => '上传成功',
        'path' => $relativePath,
        'url' => $relativePath,
        'filename' => $newFileName
    ]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'msg' => '文件保存失败']);
}
?>
