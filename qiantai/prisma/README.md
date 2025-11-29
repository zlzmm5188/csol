# Providence Prisma 数据库管理

## 📊 数据库Schema

本项目使用Prisma ORM管理数据库结构。

### 数据表清单

1. **fa_user** - 用户表
   - 基本信息（uid, phone, username, realname）
   - 财务信息（money, recharges, withdraws）
   - VIP信息（vipLevel）
   - 实名认证（kycStatus, idcard）
   - 邀请信息（inviteCode, pid）

2. **fa_vip_config** - VIP等级配置
   - level (0-8)
   - investAmount（升级要求）
   - interestAdd（加息比例）
   - commissionL1/L2（返佣比例）

3. **fa_fund_project** - 投资产品
   - 产品信息（title, category）
   - 收益参数（baseAPR, cycleDays, minInvest）
   - 募集信息（totalAmount, raisedAmount）
   - 状态管理（status）

4. **fa_fund_order** - 认购订单
   - 订单信息（orderNo, amount）
   - 收益计算（aprFinal, estimatedEarning）
   - 关联关系（userId, productId）

5. **fa_invite_log** - 邀请记录
6. **fa_team_bonus_log** - 团队奖金记录
7. **fa_daily_sign_log** - 每日签到记录
8. **fa_user_kyc** - 实名认证记录
9. **fa_trial_money** - 体验金记录
10. **fa_user_team** - 用户团队关系

---

## 🚀 快速开始

### 1. 安装依赖

```bash
cd /www/wwwroot/f.abcmall.one/providence/prisma
npm install
```

### 2. 配置数据库

复制环境变量文件：
```bash
cp .env.example .env
```

编辑`.env`文件：
```
DATABASE_URL="mysql://exchange:f86emm2t6jHTwp8L@118.107.19.74:3306/exchange"
```

### 3. 生成Prisma Client

```bash
npx prisma generate
```

### 4. 创建数据库迁移

```bash
# 开发环境（会自动应用迁移）
npx prisma migrate dev --name init_providence

# 生产环境（只生成迁移文件）
npx prisma migrate dev --create-only --name init_providence
```

### 5. 应用迁移到生产环境

```bash
npx prisma migrate deploy
```

---

## 🛠️ 常用命令

### 查看数据库
```bash
npx prisma studio
```
在浏览器中打开：http://localhost:5555

### 查看迁移状态
```bash
npx prisma migrate status
```

### 重置数据库（开发环境）
```bash
npx prisma migrate reset
```

### 生成SQL预览
```bash
npx prisma migrate diff \
  --from-schema-datamodel schema.prisma \
  --to-schema-datasource schema.prisma \
  --script > preview.sql
```

---

## 📋 数据库关系

```
User (用户)
  ├─ Order (认购订单)
  ├─ InviteLog (邀请记录)
  ├─ TeamBonusLog (团队奖金)
  ├─ DailySignLog (签到记录)
  └─ KycRecord (实名认证)

Product (产品)
  └─ Order (认购订单)

VipLevel (VIP配置)
  └─ 独立配置表

UserTeam (团队关系)
  └─ 独立关系表

TrialMoney (体验金)
  └─ 独立记录表
```

---

## ⚠️ 注意事项

1. **生产环境迁移**
   - 先备份数据库
   - 使用`--create-only`生成迁移文件
   - 审查SQL后再应用

2. **数据类型**
   - money使用Decimal(10,2)
   - rate使用Decimal(5,2)
   - status使用String枚举

3. **索引优化**
   - uid, phone, inviteCode已设置unique
   - 考虑为status, createdAt添加索引

---

## 🔄 与现有数据库同步

如果已有数据库，使用introspect：

```bash
# 从现有数据库生成schema
npx prisma db pull

# 检查差异
npx prisma migrate diff \
  --from-url "mysql://..." \
  --to-schema-datamodel schema.prisma
```

---

## 📖 相关文档

- [Prisma官方文档](https://www.prisma.io/docs)
- [Prisma Schema参考](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Migration指南](https://www.prisma.io/docs/concepts/components/prisma-migrate)
