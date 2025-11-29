# Providence Token自动化诊断脚本

## 脚本功能

这个脚本的**核心作用**是：

1. **自动化验证Token真实有效性** 
   - 测试Bearer格式: `Authorization: Bearer {token}`
   - 测试直接格式: `Authorization: {token}`
   - 测试Token头部: `Token: {token}`
   - 验证所有格式的Token是否被后端认可

2. **自动化验证用户接口是否返回正确数据**
   - 检查 `/api/user/info` 是否返回完整用户信息
   - 检查 `/api/user/index` 是否有问题
   - 对比两个接口的返回数据
   - 验证返回的JSON结构是否正确

3. **自动化定位登录后跳回密码页的根本原因**
   - 诊断Token是否真的有效
   - 诊断接口是否返回正确数据
   - 识别具体的问题所在
   - 给出解决建议

## 快速使用

### 方法1: 直接运行脚本

```bash
bash /www/wwwroot/4kp3l0iq.top/tools/token-validity-auto-check.sh
```

### 方法2: 在tools目录运行

```bash
cd /www/wwwroot/4kp3l0iq.top/tools
bash token-validity-auto-check.sh
```

## 脚本输出说明

### 步骤1: 获取有效Token

```
[INFO] 步骤1: 获取有效Token
[✓] Token已获取
Token Preview: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

这一步会自动调用登录API，获取一个新的有效Token，用于后续测试。

### 步骤2: 验证Token真实有效性

```
[INFO] 步骤2: 验证Token真实有效性

测试A: Authorization: Bearer {token}
[✓] Bearer格式有效 (HTTP 200)
[INFO] API返回 code=0

测试B: Authorization: {token}
[✓] 直接Token格式有效 (HTTP 200)

测试C: Token: {token}
[✓] Token头部格式有效 (HTTP 200)

[✓] ✓ Token真实有效性验证通过
```

- 绿色✓表示Token在该格式下有效
- 黄色⚠表示Token在该格式下可能有问题
- 红色✗表示Token在该格式下无效

### 步骤3: 验证用户接口是否返回正确数据

```
【检查A】/api/user/info 接口
HTTP状态码: 200
[✓] /api/user/info 接口正常
返回数据检查:
[✓]   ✓ 包含code字段 (值=0)
[✓]   ✓ 包含data字段
[✓]   ✓ 用户信息完整 (username=G138688)

【检查B】/api/user/index 接口（错误的接口）
HTTP状态码: 200
[✗] /api/user/index 返回登录提示（这是导致被踢回登录页的原因！）
[⚠]   MSG: 请先登录
```

- `/api/user/info` 返回200 + 用户信息 = ✅ 正确接口
- `/api/user/index` 返回200 + "请先登录" = ❌ 错误接口

### 步骤4: 诊断登录后跳回密码页的根本原因

```
诊断分析:

[✗] 问题: 前台使用了错误的API接口

[✗]   ❌ /api/user/index 返回"请先登录"错误
[✓]   ✅ /api/user/info 返回正确的用户数据

[⚠]   根本原因: 前台profile.js调用的是/api/user/index而不是/api/user/info

[INFO]   解决方案: 修改profile.js使用/api/user/info接口

[✓]   【好消息】此问题已修复！profile.js已改为使用/api/user/info
```

这一步会给出具体的问题诊断和解决建议。

## 诊断报告解释

### 如果看到这样的输出

```
[✓] ✓ Token真实有效性: 已验证通过
[✓] ✓ 用户接口返回: 正确数据
[✓] ✓ 登录问题诊断: 已完成（接口错误已修复）

[✓] ✨ 系统状态: 准备就绪 ✨
```

**表示一切正常！系统可以正常登录。**

### 如果看到红色✗错误

- `[✗] Token真实有效性`: Token可能过期或格式错误
- `[✗] 用户接口返回`: 接口返回数据不正确
- `[✗] 问题: 前台使用了错误的API接口`: 前台调用了错误的API路径

## 常见问题

### Q: 为什么/api/user/index会返回"请先登录"？

A: 因为这个接口在后端可能被配置为需要特殊的认证权限，或者这是一个旧的/废弃的接口。应该使用`/api/user/info`代替。

### Q: 我的Token在某个格式下失效怎么办？

A: 
1. 检查前台是否使用了不支持的Token格式
2. 检查后端的Token认证中间件配置
3. 确保前后端对Token格式的理解一致

### Q: 如何在生产环境运行这个脚本？

A: 建议在后台定时运行，例如每小时检查一次：

```bash
# 添加到crontab
0 * * * * bash /www/wwwroot/4kp3l0iq.top/tools/token-validity-auto-check.sh >> /var/log/token-check.log
```

## 脚本文件位置

```
/www/wwwroot/4kp3l0iq.top/tools/token-validity-auto-check.sh
```

## 技术细节

### Token获取

脚本会调用登录API自动获取一个新的Token：

```bash
curl -s "http://127.0.0.1/api/auth/login" \
  -H "Host: api.4kp3l0iq.top" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{"username":"G138688","password":"G138688"}'
```

### Token验证方式

脚本测试三种Token认证方式：

1. Bearer格式: `Authorization: Bearer eyJ0eXAi...`
2. 直接格式: `Authorization: eyJ0eXAi...`
3. Token头: `Token: eyJ0eXAi...`

### 接口对比

脚本会对比以下两个接口的返回：

| 接口 | 状态 | 返回数据 | 说明 |
|------|------|--------|------|
| /api/user/info | 200 | 用户信息 | ✅ 正确 |
| /api/user/index | 200 | "请先登录" | ❌ 错误 |

## 脚本改进建议

这个脚本可以进一步改进为：

1. 支持自定义用户名密码进行测试
2. 支持本地和远程服务器的诊断
3. 生成HTML格式的诊断报告
4. 集成邮件通知功能
5. 支持定时任务和日志记录

## 联系方式

如有问题，请检查后端API日志：

```bash
tail -f /www/wwwlogs/api.4kp3l0iq.top.error.log
```

