# 本地离线人脸识别找回密码 - API 接口说明

## 概述

本系统使用 **face-api.js**（基于 TensorFlow.js）实现完全本地离线的人脸识别，**所有识别过程在用户浏览器中完成，不上传任何图片或视频数据**。

参考项目：[InsightFace](https://github.com/deepinsight/insightface) - 用于理解人脸识别原理

## 技术架构

### 前端技术栈
- **TensorFlow.js**: 浏览器端机器学习框架
- **face-api.js**: 人脸检测、特征提取和识别
- **余弦相似度算法**: 本地特征比对

### 数据流程
1. 用户注册时：上传人脸照片 → 服务器提取特征向量（512维）→ 加密存储
2. 找回密码时：
   - 前端从服务器获取用户的人脸特征向量（加密传输）
   - 前端实时检测用户人脸并提取特征
   - **在浏览器本地进行特征比对**（不上传任何图片）
   - 比对成功后，调用重置密码接口

## 后端 API 接口

### 1. 获取用户人脸特征

**接口路径**: `/index.php/user/user/getFaceDescriptor`

**请求方法**: POST

**请求参数**:
```json
{
  "username": "用户账号"
}
```

**响应格式**:
```json
{
  "code": 1,
  "msg": "成功",
  "data": {
    "has_kyc": true,
    "face_descriptor": [0.123, 0.456, ...],  // 512维特征向量数组
    "reset_token": "临时重置令牌（用于后续重置密码）"
  }
}
```

**错误响应**:
```json
{
  "code": -1,
  "msg": "账号不存在",
  "data": null
}
```

### 2. 提交人脸进行人工审核

**接口路径**: `/index.php/user/user/submitFaceForReview`

**请求方法**: POST

**请求参数**:
```json
{
  "username": "用户账号",
  "face_image": "base64编码的图片数据",
  "similarity": 0.75,
  "reset_token": "从getFaceDescriptor获取的令牌"
}
```

**响应格式**:
```json
{
  "code": 1,
  "msg": "已提交人工审核",
  "data": {
    "review_id": "审核ID",
    "reset_token": "新的重置令牌（用于后续查询和重置）",
    "estimated_time": "预计审核时间（分钟）"
  }
}
```

### 3. 查询审核状态

**接口路径**: `/index.php/user/user/checkFaceReview`

**请求方法**: POST

**请求参数**:
```json
{
  "reset_token": "从submitFaceForReview获取的令牌"
}
```

**响应格式**:
```json
{
  "code": 1,
  "msg": "成功",
  "data": {
    "status": "approved",  // pending: 审核中, approved: 已通过, rejected: 已拒绝
    "reset_token": "重置令牌（审核通过后返回）",
    "reason": "拒绝原因（如果被拒绝）",
    "reviewed_at": "2025-01-20 10:30:00"
  }
}
```

### 4. 重置密码

**接口路径**: `/index.php/user/user/resetPassword`

**请求方法**: POST

**请求参数**:
```json
{
  "reset_token": "从getFaceDescriptor获取的令牌",
  "new_password": "新密码"
}
```

**响应格式**:
```json
{
  "code": 1,
  "msg": "密码重置成功",
  "data": null
}
```

## 工作流程

1. **本地验证**：用户在浏览器中完成人脸识别，本地比对相似度
2. **提交审核**：本地验证通过后（相似度 ≥ 0.6），自动上传人脸照片到后台
3. **人工审核**：后台管理员查看照片，进行人工比对确认
4. **审核结果**：前端轮询审核状态，审核通过后进入重置密码页面

## 后端实现示例（PHP）

### 获取人脸特征接口

```php
<?php
// /www/wwwroot/copla/providence-admin/api/user/get-face-descriptor.php

require_once dirname(__DIR__, 2) . '/config/bootstrap.php';

$input = json_decode(file_get_contents('php://input'), true);
$username = trim($input['username'] ?? '');

if (empty($username)) {
    Response::error('账号不能为空');
}

try {
    $db = Database::getInstance();

    // 查询用户信息
    $user = $db->fetchOne(
        "SELECT id, username, kyc_status, face_descriptor FROM users WHERE username = ? LIMIT 1",
        [$username]
    );

    if (!$user) {
        Response::error('账号不存在');
    }

    // 检查是否完成KYC
    if ($user['kyc_status'] != 1) {
        Response::error('该账号未完成实名认证，无法使用人脸识别找回');
    }

    // 检查是否有人脸特征
    if (empty($user['face_descriptor'])) {
        Response::error('该账号未注册人脸特征');
    }

    // 解密人脸特征（如果加密存储）
    $faceDescriptor = json_decode($user['face_descriptor'], true);
    if (!$faceDescriptor || count($faceDescriptor) !== 512) {
        Response::error('人脸特征数据异常');
    }

    // 生成临时重置令牌（有效期10分钟）
    $resetToken = bin2hex(random_bytes(16));
    $expiresAt = date('Y-m-d H:i:s', time() + 600);

    // 存储重置令牌
    $db->query(
        "INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at)
         VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE token = ?, expires_at = ?, created_at = NOW()",
        [$user['id'], $resetToken, $expiresAt, $resetToken, $expiresAt]
    );

    Response::success([
        'has_kyc' => true,
        'face_descriptor' => $faceDescriptor,  // 返回512维特征向量
        'reset_token' => $resetToken
    ]);

} catch (Exception $e) {
    error_log('[获取人脸特征] 错误: ' . $e->getMessage());
    Response::error('服务器错误');
}
```

### 提交人脸审核接口

```php
<?php
// /www/wwwroot/copla/providence-admin/api/user/submit-face-review.php

require_once dirname(__DIR__, 2) . '/config/bootstrap.php';

$input = json_decode(file_get_contents('php://input'), true);
$username = trim($input['username'] ?? '');
$faceImage = $input['face_image'] ?? '';
$similarity = floatval($input['similarity'] ?? 0);
$resetToken = trim($input['reset_token'] ?? '');

if (empty($username) || empty($faceImage) || empty($resetToken)) {
    Response::error('参数不完整');
}

// 验证本地相似度（必须 >= 0.6）
if ($similarity < 0.6) {
    Response::error('本地验证未通过，无法提交审核');
}

try {
    $db = Database::getInstance();

    // 验证重置令牌
    $tokenRecord = $db->fetchOne(
        "SELECT user_id, expires_at FROM password_reset_tokens
         WHERE token = ? AND expires_at > NOW() LIMIT 1",
        [$resetToken]
    );

    if (!$tokenRecord) {
        Response::error('重置令牌无效或已过期');
    }

    // 保存人脸照片到服务器（用于人工审核）
    $uploadDir = dirname(__DIR__, 2) . '/uploads/face-review/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // 解码base64图片
    $imageData = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $faceImage));
    $filename = 'review_' . $tokenRecord['user_id'] . '_' . time() . '.jpg';
    $filepath = $uploadDir . $filename;
    file_put_contents($filepath, $imageData);

    // 生成新的重置令牌（用于后续查询和重置）
    $newResetToken = bin2hex(random_bytes(16));
    $expiresAt = date('Y-m-d H:i:s', time() + 1800); // 30分钟有效期

    // 创建审核记录
    $reviewId = $db->insert(
        "INSERT INTO face_review_records (user_id, reset_token, face_image_path, similarity, status, created_at)
         VALUES (?, ?, ?, ?, 'pending', NOW())",
        [$tokenRecord['user_id'], $newResetToken, $filename, $similarity]
    );

    // 更新重置令牌
    $db->query(
        "UPDATE password_reset_tokens SET token = ?, expires_at = ? WHERE token = ?",
        [$newResetToken, $expiresAt, $resetToken]
    );

    Response::success([
        'review_id' => $reviewId,
        'reset_token' => $newResetToken,
        'estimated_time' => 5 // 预计5分钟
    ], '已提交人工审核');

} catch (Exception $e) {
    error_log('[提交人脸审核] 错误: ' . $e->getMessage());
    Response::error('服务器错误');
}
```

### 查询审核状态接口

```php
<?php
// /www/wwwroot/copla/providence-admin/api/user/check-face-review.php

require_once dirname(__DIR__, 2) . '/config/bootstrap.php';

$input = json_decode(file_get_contents('php://input'), true);
$resetToken = trim($input['reset_token'] ?? '');

if (empty($resetToken)) {
    Response::error('参数不完整');
}

try {
    $db = Database::getInstance();

    // 查询审核记录
    $review = $db->fetchOne(
        "SELECT r.*, u.username
         FROM face_review_records r
         JOIN password_reset_tokens t ON r.reset_token = t.token
         JOIN users u ON r.user_id = u.id
         WHERE r.reset_token = ? AND t.expires_at > NOW()
         ORDER BY r.id DESC LIMIT 1",
        [$resetToken]
    );

    if (!$review) {
        Response::error('审核记录不存在或已过期');
    }

    Response::success([
        'status' => $review['status'], // pending, approved, rejected
        'reset_token' => $review['status'] === 'approved' ? $resetToken : null,
        'reason' => $review['reject_reason'] ?? null,
        'reviewed_at' => $review['reviewed_at'] ?? null
    ]);

} catch (Exception $e) {
    error_log('[查询审核状态] 错误: ' . $e->getMessage());
    Response::error('服务器错误');
}
```

### 重置密码接口

```php
<?php
// /www/wwwroot/copla/providence-admin/api/user/reset-password.php

require_once dirname(__DIR__, 2) . '/config/bootstrap.php';

$input = json_decode(file_get_contents('php://input'), true);
$resetToken = trim($input['reset_token'] ?? '');
$newPassword = trim($input['new_password'] ?? '');

if (empty($resetToken) || empty($newPassword)) {
    Response::error('参数不完整');
}

// 密码强度验证
if (strlen($newPassword) < 8 ||
    !preg_match('/[a-z]/', $newPassword) ||
    !preg_match('/[A-Z]/', $newPassword) ||
    !preg_match('/[!@#$%^&*(),.?":{}|<>]/', $newPassword)) {
    Response::error('密码格式不符合要求');
}

try {
    $db = Database::getInstance();

    // 验证重置令牌
    $tokenRecord = $db->fetchOne(
        "SELECT user_id, expires_at FROM password_reset_tokens
         WHERE token = ? AND expires_at > NOW() LIMIT 1",
        [$resetToken]
    );

    if (!$tokenRecord) {
        Response::error('重置令牌无效或已过期');
    }

    // 更新密码
    $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
    $db->query(
        "UPDATE users SET password = ? WHERE id = ?",
        [$hashedPassword, $tokenRecord['user_id']]
    );

    // 删除已使用的令牌
    $db->query("DELETE FROM password_reset_tokens WHERE token = ?", [$resetToken]);

    Response::success(null, '密码重置成功');

} catch (Exception $e) {
    error_log('[重置密码] 错误: ' . $e->getMessage());
    Response::error('服务器错误');
}
```

## 数据库表结构

### face_review_records 表（人脸审核记录）

```sql
CREATE TABLE IF NOT EXISTS `face_review_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `reset_token` varchar(64) NOT NULL,
  `face_image_path` varchar(255) NOT NULL COMMENT '人脸照片路径',
  `similarity` decimal(5,4) NOT NULL COMMENT '本地相似度',
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reviewed_by` int(11) DEFAULT NULL COMMENT '审核人ID',
  `reject_reason` varchar(255) DEFAULT NULL COMMENT '拒绝原因',
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `reset_token` (`reset_token`),
  KEY `status` (`status`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='人脸审核记录表';
```

### password_reset_tokens 表

```sql
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `user_id` (`user_id`),
  KEY `expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### users 表需要添加字段

```sql
ALTER TABLE `users`
ADD COLUMN `face_descriptor` TEXT COMMENT '人脸特征向量（JSON格式，512维）' AFTER `kyc_status`;
```

## 用户注册时提取人脸特征

在用户完成KYC实名认证时，需要提取并存储人脸特征：

```php
// 使用 InsightFace Python 脚本提取特征（服务器端）
// 或者使用 face-api.js 在浏览器端提取后上传特征向量

// 示例：浏览器端提取后上传
const detection = await faceapi
    .detectSingleFace(image)
    .withFaceLandmarks()
    .withFaceDescriptor();

const descriptor = Array.from(detection.descriptor); // 512维向量

// 上传到服务器
await fetch('/api', {
    method: 'POST',
    body: JSON.stringify({
        face_descriptor: descriptor
    })
});
```

## 安全注意事项

1. **特征向量加密存储**: 人脸特征向量应加密存储
2. **传输加密**: 使用 HTTPS 传输特征向量
3. **令牌有效期**: 重置令牌设置短有效期（建议10分钟）
4. **相似度阈值**: 根据实际测试调整阈值（建议0.6-0.7）
5. **防重放攻击**: 令牌使用后立即删除

## 前端使用

在 `login.html` 中修改忘记密码链接：

```html
<a href="reset-password-local.html" onclick="toggleForgotMode()">忘记密码</a>
```

## 模型文件（可选本地部署）

为了提升加载速度，可以将 face-api.js 的模型文件下载到本地：

```bash
# 下载模型文件
cd /www/wwwroot/copla/providence/models/face-api
wget https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/tiny_face_detector_model-weights_manifest.json
wget https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/tiny_face_detector_model-shard1
wget https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/face_landmark_68_model-weights_manifest.json
wget https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/face_landmark_68_model-shard1
wget https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/face_recognition_model-weights_manifest.json
wget https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/face_recognition_model-shard1
wget https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/face_recognition_model-shard2
```

然后在 `reset-password-local.html` 中修改模型路径：

```javascript
const MODEL_URL = './models/face-api';  // 使用本地模型
```

## 参考资源

- [InsightFace GitHub](https://github.com/deepinsight/insightface) - 人脸识别原理参考
- [face-api.js 文档](https://github.com/justadudewhohacks/face-api.js)
- [TensorFlow.js 文档](https://www.tensorflow.org/js)
