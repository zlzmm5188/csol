# Providence 系统 API 接口完整文档

**更新时间**: 2025-01-17
**API 基础地址**: `https://apis.copla.top`
**API 路径前缀**: `/index.php/`

---

## 📋 目录

1. [用户认证接口](#1-用户认证接口)
2. [用户信息接口](#2-用户信息接口)
3. [VIP 相关接口](#3-vip-相关接口)
4. [项目相关接口](#4-项目相关接口)
5. [实名认证接口](#5-实名认证接口)
6. [订单相关接口](#6-订单相关接口)
7. [财务相关接口](#7-财务相关接口)
8. [支付相关接口](#8-支付相关接口)
9. [积分相关接口](#9-积分相关接口)
10. [签到相关接口](#10-签到相关接口)
11. [团队相关接口](#11-团队相关接口)
12. [收益相关接口](#12-收益相关接口)
13. [日利宝相关接口](#13-日利宝相关接口)
14. [文件上传接口](#14-文件上传接口)
15. [管理员接口](#15-管理员接口)
16. [AI 服务接口](#16-ai-服务接口)
17. [其他接口](#17-其他接口)

---

## 1. 用户认证接口

### 1.1 账号登录
- **路径**: `/index.php/login/account`
- **方法**: `POST`
- **后端文件**: `login.php`
- **兼容路径**: `/index.php/login/login/account` (已废弃，保留兼容)
- **请求参数**:
  ```json
  {
    "username": "string",
    "password": "string",
    "system": 1
  }
  ```
- **使用位置**:
  - `login.js`
  - `login.html`
  - `test-api.html`

### 1.2 账号注册
- **路径**: `/index.php/login/reg/account`
- **方法**: `POST`
- **后端文件**: `register.php`
- **使用位置**: `register.js`

---

## 2. 用户信息接口

### 2.1 获取用户信息
- **路径**: `/index.php/user/user/index`
- **方法**: `GET`
- **后端文件**: `user/info.php`
- **请求头**: `token: string`
- **使用位置**:
  - `profile.js`
  - `app.js`
  - `config.js` (ApiService.finance.getUserBalance)
  - `invite-share.html`
  - `my-investments.html`
  - `projects.html`
  - `trial-money-popup.js`
  - `vip-level.html`
  - `set-pay-password.html`
  - `withdraw.html`
  - `recharge.html`

### 2.2 获取邀请信息
- **路径**: `/index.php/user/user/invite`
- **方法**: `GET`
- **后端文件**: `user/invite.php`
- **请求头**: `token: string`
- **使用位置**:
  - `invite-share.html`
  - `profile.js`

### 2.3 设置支付密码
- **路径**: `/index.php/user/user/setPayPassword`
- **方法**: `POST`
- **后端文件**: `user/set-pay-password.php`
- **使用位置**: `set-pay-password.html`

### 2.4 检查用户名
- **路径**: `/index.php/user/user/checkUsername`
- **方法**: `POST`
- **后端文件**: `user/check-username.php`
- **使用位置**: `login.html` (忘记密码流程)

### 2.5 获取人脸特征向量
- **路径**: `/index.php/user/user/getFaceDescriptor`
- **方法**: `POST`
- **后端文件**: `user/get-face-descriptor.php`
- **使用位置**: `reset-password-local.html`

### 2.6 提交人脸审核
- **路径**: `/index.php/user/user/submitFaceForReview`
- **方法**: `POST`
- **后端文件**: `user/submit-face-review.php`
- **使用位置**: `reset-password-local.html`

### 2.7 检查人脸审核状态
- **路径**: `/index.php/user/user/checkFaceReview`
- **方法**: `POST`
- **后端文件**: `user/check-face-review.php`
- **使用位置**: `reset-password-local.html`

### 2.8 重置密码
- **路径**: `/index.php/user/user/resetPassword`
- **方法**: `POST`
- **后端文件**: `user/reset-password.php`
- **使用位置**:
  - `reset-password-local.html`
  - `reset-password.js`

---

## 3. VIP 相关接口

### 3.1 获取 VIP 等级列表
- **路径**: `/index.php/user/level/list`
- **方法**: `GET`
- **后端文件**: `vip/list.php`
- **使用位置**: `vip-level.html`

### 3.2 获取 VIP 进度
- **路径**: `/index.php/user/vip/progress`
- **方法**: `GET`
- **后端文件**: `user/vip-progress.php`
- **别名**: `/index.php/user/vip/info`
- **使用位置**:
  - `profile.js`
  - `vip-level.html`

---

## 4. 项目相关接口

### 4.1 获取项目列表
- **路径**: `/index.php/fund/project/all`
- **方法**: `GET`
- **后端文件**: `project/list.php`
- **使用位置**:
  - `config.js` (ApiService)
  - `finance.js`
  - `projects.html`
  - `projects-list.html`
  - `profile.js`
  - `test-config.html`
  - `zone-detail.js`

### 4.2 获取项目详情
- **路径**: `/index.php/fund/project/detail`
- **方法**: `GET`
- **后端文件**: `project/detail.php`
- **使用位置**: `project-detail.js`

### 4.3 投资项目
- **路径**: `/index.php/fund/project/add`
- **方法**: `POST`
- **后端文件**: `project/invest.php`
- **使用位置**: `project-detail.js`

### 4.4 计算项目收益
- **路径**: `/index.php/fund/project/calculate`
- **方法**: `POST`
- **后端文件**: `project/calculate.php`

### 4.5 创建订单
- **路径**: `/index.php/fund/order/create`
- **方法**: `POST`
- **后端文件**: `fund/order-create.php`

---

## 5. 实名认证接口

### 5.1 提交实名认证
- **路径**: `/index.php/user/kyc/submit`
- **方法**: `POST`
- **后端文件**: `kyc/submit.php`
- **使用位置**: `kyc-ocr.html`

---

## 6. 订单相关接口

### 6.1 获取订单列表
- **路径**: `/index.php/user/order/list`
- **方法**: `GET`
- **后端文件**: `order/list.php`
- **使用位置**: `my-investments.html`

### 6.2 获取用户项目列表
- **路径**: `/index.php/user/project/list`
- **方法**: `GET`
- **后端文件**: `user/project-list.php`
- **使用位置**:
  - `my-investments.html`
  - `my-investments.js`

---

## 7. 财务相关接口

### 7.1 充值申请
- **路径**: `/index.php/user/recharge/add`
- **方法**: `POST`
- **后端文件**: `finance/recharge.php`
- **使用位置**:
  - `config.js` (ApiService.finance.recharge)
  - `deposit.js`

### 7.2 提现申请
- **路径**: `/index.php/user/withdraw/add`
- **方法**: `POST`
- **后端文件**: `finance/withdraw.php`

### 7.3 获取银行卡列表
- **路径**: `/index.php/user/bank/list`
- **方法**: `GET`
- **后端文件**: `finance/bank_list.php`

---

## 8. 支付相关接口

### 8.1 充值支付
- **路径**: `/index.php/pay/pay/recharge`
- **方法**: `POST`
- **后端文件**: `pay/recharge.php`
- **使用位置**: `deposit.js`

### 8.2 USDT 充值
- **路径**: `/index.php/pay/us/recharge`
- **方法**: `POST`
- **后端文件**: `pay/us-recharge.php`

### 8.3 获取银行卡列表
- **路径**: `/index.php/pay/bank/list`
- **方法**: `GET`
- **后端文件**: `pay/bank-list.php`
- **使用位置**:
  - `config.js` (ApiService.finance.getBankList)
  - `withdraw.html`

### 8.4 添加银行卡
- **路径**: `/index.php/pay/bank/add`
- **方法**: `POST`
- **后端文件**: `pay/bank-add.php`
- **使用位置**: `bank-cards.html`

### 8.5 删除银行卡
- **路径**: `/index.php/pay/bank/del`
- **方法**: `POST`
- **后端文件**: `pay/bank-del.php`
- **使用位置**: `bank-cards.html`

### 8.6 提现
- **路径**: `/index.php/pay/pay/withdraw`
- **方法**: `POST`
- **后端文件**: `pay/withdraw.php`
- **使用位置**:
  - `config.js` (ApiService.finance.withdraw)
  - `withdraw.html`

### 8.7 获取 USDT 信息
- **路径**: `/index.php/pay/us/info`
- **方法**: `GET`
- **后端文件**: `pay/usdt-info.php`
- **使用位置**:
  - `config.js` (ApiService.finance.getUsdtInfo)
  - `withdraw.html`
  - `recharge.html`
  - `deposit.js`

---

## 9. 积分相关接口

### 9.1 获取积分余额
- **路径**: `/index.php/user/points/balance`
- **方法**: `GET`
- **后端文件**: `points/balance.php`
- **使用位置**:
  - `config.js` (ApiService.points.getBalance)
  - `points-exchange.html`

### 9.2 积分兑换
- **路径**: `/index.php/user/points/exchange`
- **方法**: `POST`
- **后端文件**: `user/points-exchange.php`
- **使用位置**:
  - `config.js` (ApiService.points.exchange)
  - `points-exchange.html`

### 9.3 获取积分日志
- **路径**: `/index.php/user/points/logs`
- **方法**: `GET`
- **后端文件**: `points/logs.php`
- **使用位置**:
  - `config.js` (ApiService.points.getLogs)
  - `points-logs.html`
  - `points-record.html`

### 9.4 获取积分兑换历史
- **路径**: `/index.php/user/points/exchange-history`
- **方法**: `GET`
- **后端文件**: `user/points-exchange-history.php`
- **使用位置**: `points-exchange-history.html`

---

## 10. 签到相关接口

### 10.1 获取签到信息
- **路径**: `/index.php/user/sign/info`
- **方法**: `GET`
- **后端文件**: `user/sign-info.php`
- **使用位置**:
  - `daily-checkin-api.js`
  - `checkin.js`

### 10.2 执行签到
- **路径**: `/index.php/user/sign/sign`
- **方法**: `POST`
- **后端文件**: `user/sign-do.php`
- **使用位置**:
  - `daily-checkin-api.js`
  - `checkin.js`

### 10.3 获取签到状态（旧接口）
- **路径**: `/index.php/user/checkin/status`
- **方法**: `GET`
- **后端文件**: `user/sign-info.php` (可能)
- **使用位置**: `checkin.js`

### 10.4 执行签到（旧接口）
- **路径**: `/index.php/user/checkin/do`
- **方法**: `POST`
- **后端文件**: `user/sign-do.php` (可能)
- **使用位置**: `checkin.js`

---

## 11. 团队相关接口

### 11.1 获取团队信息
- **路径**: `/index.php/user/team/team`
- **方法**: `POST`
- **后端文件**: `user/team-info.php`
- **请求参数**:
  ```json
  {
    "page": 1,
    "uid": 0
  }
  ```
- **使用位置**:
  - `invite-share.html`
  - `team-rewards.js`

### 11.2 获取团队奖励状态
- **路径**: `/index.php/user/team/rewards_status`
- **方法**: `GET`
- **后端文件**: `user/team-rewards-status.php`
- **使用位置**: `team-rewards.js`

### 11.3 领取团队奖励
- **路径**: `/index.php/user/team/claim_reward`
- **方法**: `POST`
- **后端文件**: `user/team-claim-reward.php`
- **使用位置**: `team-rewards.js`

---

## 12. 收益相关接口

### 12.1 获取收益日历
- **路径**: `/index.php/user/profit/calendar`
- **方法**: `GET`
- **后端文件**: `user/profit-calendar.php`
- **使用位置**: `profit-calendar.html`

---

## 13. 日利宝相关接口

### 13.1 获取日利宝信息
- **路径**: `/index.php/user/ribao/info`
- **方法**: `GET`
- **后端文件**: `user/ribao-info.php`
- **使用位置**:
  - `config.js` (ApiService.ribao.getInfo)
  - `ribao.js`
  - `ribao.html`

### 13.2 日利宝转入
- **路径**: `/index.php/user/ribao/transfer-in`
- **方法**: `POST`
- **后端文件**: `user/ribao-transfer-in.php`
- **使用位置**:
  - `config.js` (ApiService.ribao.transferIn)
  - `ribao.js`

### 13.3 日利宝转出
- **路径**: `/index.php/user/ribao/transfer-out`
- **方法**: `POST`
- **后端文件**: `user/ribao-transfer-out.php`
- **使用位置**:
  - `config.js` (ApiService.ribao.transferOut)
  - `ribao.js`

### 13.4 获取日利宝记录
- **路径**: `/index.php/user/ribao/records`
- **方法**: `GET`
- **后端文件**: `user/ribao-records.php`
- **使用位置**:
  - `config.js` (ApiService.ribao.getRecords)
  - `ribao-history.html`

### 13.5 获取交易记录
- **路径**: `/index.php/user/transaction/records`
- **方法**: `GET`
- **后端文件**: `user/transaction-records.php`
- **使用位置**: `records.html`

---

## 14. 文件上传接口

### 14.1 文件上传
- **路径**: `/index.php/upload`
- **方法**: `POST`
- **后端文件**: `upload.php`
- **使用位置**:
  - `deposit.js`
  - `kyc-ocr.html`
  - `upload-image.html`

---

## 15. 管理员接口

### 15.1 统计数据
- **路径**: `/index.php/admin/stats`
- **方法**: `GET`
- **后端文件**: `admin/stats.php`

### 15.2 用户列表
- **路径**: `/index.php/admin/users`
- **方法**: `GET`
- **后端文件**: `admin/users.php`

### 15.3 设置内部用户
- **路径**: `/index.php/admin/user-set-internal`
- **方法**: `POST`
- **后端文件**: `admin/user-set-internal.php`

### 15.4 团队树
- **路径**: `/index.php/admin/team-tree`
- **方法**: `GET`
- **后端文件**: `admin/team-tree.php`

### 15.5 用户详情
- **路径**: `/index.php/admin/user-detail`
- **方法**: `GET`
- **后端文件**: `admin/user-detail.php`

### 15.6 更新用户
- **路径**: `/index.php/admin/user-update`
- **方法**: `POST`
- **后端文件**: `admin/user-update.php`

### 15.7 用户团队树
- **路径**: `/index.php/admin/user-team-tree`
- **方法**: `GET`
- **后端文件**: `admin/user-team-tree.php`

### 15.8 重置用户密码
- **路径**: `/index.php/admin/user-reset-password`
- **方法**: `POST`
- **后端文件**: `admin/user-reset-password.php`

### 15.9 钱包日志
- **路径**: `/index.php/admin/wallet-logs`
- **方法**: `GET`
- **后端文件**: `admin/wallet-logs.php`

### 15.10 项目列表
- **路径**: `/index.php/admin/projects`
- **方法**: `GET`
- **后端文件**: `admin/projects.php`

### 15.11 项目详情
- **路径**: `/index.php/admin/project-detail`
- **方法**: `GET`
- **后端文件**: `admin/project-detail.php`

### 15.12 保存项目
- **路径**: `/index.php/admin/project-save`
- **方法**: `POST`
- **后端文件**: `admin/project-save.php`

### 15.13 订单列表
- **路径**: `/index.php/admin/orders`
- **方法**: `GET`
- **后端文件**: `admin/orders.php`

### 15.14 订单详情
- **路径**: `/index.php/admin/order-detail`
- **方法**: `GET`
- **后端文件**: `admin/order-detail.php`

### 15.15 审核 KYC - 通过
- **路径**: `/index.php/admin/kyc-approve`
- **方法**: `POST`
- **后端文件**: `admin/kyc-approve.php`

### 15.16 审核 KYC - 拒绝
- **路径**: `/index.php/admin/kyc-reject`
- **方法**: `POST`
- **后端文件**: `admin/kyc-reject.php`

### 15.17 充值列表
- **路径**: `/index.php/admin/recharges`
- **方法**: `GET`
- **后端文件**: `admin/recharges.php`

### 15.18 审核充值 - 通过
- **路径**: `/index.php/admin/recharge-approve`
- **方法**: `POST`
- **后端文件**: `admin/recharge-approve.php`

### 15.19 审核充值 - 拒绝
- **路径**: `/index.php/admin/recharge-reject`
- **方法**: `POST`
- **后端文件**: `admin/recharge-reject.php`

### 15.20 提现列表
- **路径**: `/index.php/admin/withdrawals`
- **方法**: `GET`
- **后端文件**: `admin/withdrawals.php`

### 15.21 审核提现 - 通过
- **路径**: `/index.php/admin/withdraw-approve`
- **方法**: `POST`
- **后端文件**: `admin/withdraw-approve.php`

### 15.22 审核提现 - 拒绝
- **路径**: `/index.php/admin/withdraw-reject`
- **方法**: `POST`
- **后端文件**: `admin/withdraw-reject.php`

### 15.23 登录日志
- **路径**: `/index.php/admin/login-logs`
- **方法**: `GET`
- **后端文件**: `admin/login-logs.php`

### 15.24 日利宝用户列表
- **路径**: `/index.php/admin/ribao/users`
- **方法**: `GET`
- **后端文件**: `admin/ribao-users.php`

### 15.25 日利宝收益列表
- **路径**: `/index.php/admin/ribao/profits`
- **方法**: `GET`
- **后端文件**: `admin/ribao-profits.php`

### 15.26 日利宝配置
- **路径**: `/index.php/admin/ribao/config`
- **方法**: `GET`
- **后端文件**: `admin/ribao-config.php`

### 15.27 保存日利宝配置
- **路径**: `/index.php/admin/ribao/config-save`
- **方法**: `POST`
- **后端文件**: `admin/ribao-config-save.php`

### 15.28 活动列表
- **路径**: `/index.php/admin/activities`
- **方法**: `GET`
- **后端文件**: `admin/activities.php`

### 15.29 活动详情
- **路径**: `/index.php/admin/activity-detail`
- **方法**: `GET`
- **后端文件**: `admin/activity-detail.php`

### 15.30 保存活动
- **路径**: `/index.php/admin/activity-save`
- **方法**: `POST`
- **后端文件**: `admin/activity-save.php`

### 15.31 删除活动
- **路径**: `/index.php/admin/activity-delete`
- **方法**: `POST`
- **后端文件**: `admin/activity-delete.php`

### 15.32 文章列表
- **路径**: `/index.php/admin/articles`
- **方法**: `GET`
- **后端文件**: `admin/articles.php`

### 15.33 文章详情
- **路径**: `/index.php/admin/article-detail`
- **方法**: `GET`
- **后端文件**: `admin/article-detail.php`

### 15.34 保存文章
- **路径**: `/index.php/admin/article-save`
- **方法**: `POST`
- **后端文件**: `admin/article-save.php`

### 15.35 删除文章
- **路径**: `/index.php/admin/article-delete`
- **方法**: `POST`
- **后端文件**: `admin/article-delete.php`

---

## 16. AI 服务接口

### 16.1 AI 聊天
- **路径**: `/index.php/ai/chat`
- **方法**: `POST`
- **后端文件**: `ai/chat.php`
- **使用位置**:
  - `ai-openai.js`
  - `ai-service-local.js`
  - `messages.html`

### 16.2 AI 历史记录
- **路径**: `/index.php/ai/history`
- **方法**: `GET`
- **后端文件**: `ai/history.php`

---

## 17. 其他接口

### 17.1 试用金领取
- **路径**: `/index.php/user/trial/claim`
- **方法**: `POST`
- **后端文件**: `trial/claim.php` (需要确认)
- **使用位置**: `trial-money.html`

---

## 📊 接口统计

### 按分类统计
- **用户认证**: 2 个接口
- **用户信息**: 8 个接口
- **VIP 相关**: 2 个接口
- **项目相关**: 5 个接口
- **实名认证**: 1 个接口
- **订单相关**: 2 个接口
- **财务相关**: 3 个接口
- **支付相关**: 7 个接口
- **积分相关**: 4 个接口
- **签到相关**: 4 个接口（含旧接口）
- **团队相关**: 3 个接口
- **收益相关**: 1 个接口
- **日利宝相关**: 5 个接口
- **文件上传**: 1 个接口
- **管理员接口**: 35 个接口
- **AI 服务**: 2 个接口
- **其他**: 1 个接口

**总计**: 约 **85+** 个接口

---

## 🔐 认证说明

### Token 认证
大部分接口需要在请求头中携带 `token`:
```
headers: {
  'token': 'your_token_here',
  'Content-Type': 'application/json'
}
```

### Token 存储
- 存储键名: `providence_token`
- 存储位置: `localStorage`
- 获取方式: `localStorage.getItem('providence_token')`

---

## ⚠️ 注意事项

1. **API 基础地址**: 前端配置文件 `config.js` 中设置 `https://api.4kp3l0iq.top` 作为基础地址
2. **路径格式**: RESTful API 路径以 `/api/` 开头（如 `/api/user/info`）
3. **CORS**: 后端已配置 CORS，支持跨域请求
4. **响应格式**: 统一使用 `code` 字段表示状态
   - `code: 0` 或 `code: 1` 或 `code: 200` 表示成功
   - `code: -1` 表示失败
   - `code: 401` 表示未授权/Token过期
5. **Token 失效**: 当 Token 失效时，前端会触发 `token-expired` 事件，页面可监听此事件处理登录过期

---

## 🛡️ 错误处理

### 前端错误处理机制

前端使用统一的错误日志系统 `ErrorLogger`，可用于调试和监控：

```javascript
// 获取错误日志
const logs = ErrorLogger.getLogs();

// 获取统计信息
const stats = ErrorLogger.getStats();
// { total: 10, errors: 2, warnings: 3, byCategory: { HTTP: 5, TOKEN: 2 } }

// 监听Token过期事件
window.addEventListener('token-expired', (event) => {
    console.log('Token过期，URL:', event.detail.url);
    // 跳转登录页
    window.location.href = 'login.html';
});
```

### 常见错误码

| 错误码 | 含义 | 处理方式 |
|-------|------|---------|
| 0 / 1 / 200 | 请求成功 | 正常处理数据 |
| -1 | 业务逻辑错误 | 显示错误消息 |
| 401 | 未授权/Token过期 | 清除Token，跳转登录 |
| 500 | 服务器内部错误 | 提示用户稍后重试 |

---

## 📝 更新日志

- **2025-12-01**: 增加错误处理文档，更新API基础地址配置说明
- **2025-01-17**: 初始版本，整理所有前台和后端接口
- **2025-01-17**: 修复所有 API 路径错误，统一使用 `/index.php/` 前缀

---

## 🔗 相关文档

- 前端配置文件: `config.js` - 统一网络层和Token管理
- API映射表: `API_MAP.js` - API路径映射
- 错误拦截器: `error-interceptor.js` - 全局错误处理
