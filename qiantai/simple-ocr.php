<?php
// 临时禁用所有错误报告和输出缓冲
error_reporting(0);
ini_set('display_errors', 0);
ob_clean();

// 跨域支持
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// 接受POST数据
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data || !isset($data['image'])) {
    echo json_encode(['code' => 400, 'msg' => '请提供图片数据']);
    exit;
}

// 提取base64图片
$imageData = $data['image'];
if (strpos($imageData, 'base64,') !== false) {
    $imageData = explode('base64,', $imageData)[1];
}

// 解码并保存到临时文件
$tempFile = '/tmp/ocr_' . time() . '_' . rand() . '.png';
$decoded = base64_decode($imageData);
file_put_contents($tempFile, $decoded);

// 调试信息
$debug = [
    'file_size' => filesize($tempFile),
    'image_valid' => false
];

$img = @imagecreatefromstring(file_get_contents($tempFile));
if ($img) {
    $debug['image_valid'] = true;
    $debug['width'] = imagesx($img);
    $debug['height'] = imagesy($img);
    imagedestroy($img);
}

// 调用Tesseract，尝试多种模式
$outputs = [];

// 模式1: PSM 6 + 数字识别
$cmd1 = "tesseract " . escapeshellarg($tempFile) . " stdout -l eng --psm 6 --oem 1 digits 2>&1";
$output1 = trim(shell_exec($cmd1));
$outputs['mode1'] = $output1;

// 模式2: PSM 11 + 数字识别
$cmd2 = "tesseract " . escapeshellarg($tempFile) . " stdout -l eng --psm 11 --oem 1 digits 2>&1";
$output2 = trim(shell_exec($cmd2));
$outputs['mode2'] = $output2;

// 模式3: 中文+英文
$cmd3 = "tesseract " . escapeshellarg($tempFile) . " stdout -l chi_sim+eng --psm 6 2>&1";
$output3 = trim(shell_exec($cmd3));
$outputs['mode3'] = $output3;

// 模式4: 纯数字，PSM 7（单个文本块）
$cmd4 = "tesseract " . escapeshellarg($tempFile) . " stdout -l eng --psm 7 --oem 1 digits 2>&1";
$output4 = trim(shell_exec($cmd4));
$outputs['mode4'] = $output4;

// 从所有输出中提取18位身份证号
$idCard = '';
foreach ($outputs as $mode => $output) {
    if (preg_match_all('/\d{17}[\dX]/', $output, $matches)) {
        $idCard = $matches[0][0];
        break;
    }
}

// 清理临时文件
@unlink($tempFile);

// 返回结果（包含调试信息）
echo json_encode([
    'code' => 200,
    'msg' => $idCard ? '识别成功' : '未识别到身份证号',
    'data' => [
        'id_card' => $idCard,
        'outputs' => $outputs,
        'debug' => $debug
    ]
]);
?>
