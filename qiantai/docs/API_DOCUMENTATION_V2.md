# Providence Financial Platform - API Documentation

## Version 2.0.0
**Updated: 2025-12-01**

This document describes the enhanced API endpoints for the Providence Financial Platform, including dual currency support, team management, VIP system, and rebate features.

---

## Base URL
```
Production: https://api.4kp3l0iq.top
Admin Panel: https://admin.4kp3l0iq.top
```

## Authentication
All authenticated endpoints require a JWT token in the request headers:
```
Authorization: Bearer <token>
Token: <token>
```

---

## Table of Contents

1. [User Authentication](#1-user-authentication)
2. [User Management](#2-user-management)
3. [VIP System](#3-vip-system)
4. [Payment & Recharge](#4-payment--recharge)
5. [Withdrawal](#5-withdrawal)
6. [Team Management](#6-team-management)
7. [Team Rewards](#7-team-rewards)
8. [Calendar Statistics](#8-calendar-statistics)
9. [Admin Dashboard](#9-admin-dashboard)
10. [Exchange Rate](#10-exchange-rate)

---

## 1. User Authentication

### 1.1 Register
Creates a new user with 8-digit random ID.

**POST** `/api/auth/register`

**Request Body:**
```json
{
    "username": "string (min 8 chars, must contain upper and lower case)",
    "password": "string (min 8 chars, must contain upper, lower, and special char)",
    "invite_code": "string (referrer's user ID)"
}
```

**Response:**
```json
{
    "code": 1,
    "msg": "注册成功",
    "data": {
        "token": "jwt_token_string",
        "user": {
            "id": 12345678,
            "user_id": "12345678",
            "username": "username",
            "vip_level": 0,
            "invite_code": "12345678"
        }
    }
}
```

**Notes:**
- Founding member ID = 1
- New users receive random 8-digit IDs
- Invite code is the referrer's user ID

### 1.2 Login
**POST** `/api/auth/login`

**Request Body:**
```json
{
    "username": "string",
    "password": "string"
}
```

**Response:**
```json
{
    "code": 1,
    "msg": "登录成功",
    "data": {
        "token": "jwt_token_string",
        "user": {
            "id": 12345678,
            "user_id": "12345678",
            "username": "username",
            "vip_level": 3,
            "balance_cny": 50000.00,
            "balance_usdt": 1000.0000
        }
    }
}
```

---

## 2. User Management

### 2.1 Get User Info
**GET** `/api/user/info`

**Response:**
```json
{
    "code": 1,
    "msg": "ok",
    "data": {
        "id": 12345678,
        "user_id": "12345678",
        "username": "username",
        "real_name": "张三",
        "vip_level": 3,
        "balance_cny": 50000.00,
        "balance_usdt": 1000.0000,
        "frozen_cny": 0.00,
        "frozen_usdt": 0.00,
        "total_investment": 250000.00,
        "points": 5000,
        "invite_code": "12345678",
        "is_internal": false,
        "kyc_status": 2,
        "last_login_ip": "192.168.1.1",
        "last_login_device": "iPhone 14",
        "last_login_location": "Shanghai, China"
    }
}
```

### 2.2 Get User Activity
**GET** `/api/user/activity`

**Response:**
```json
{
    "code": 1,
    "msg": "ok",
    "data": {
        "login_history": [
            {
                "time": "2025-12-01T10:30:00Z",
                "ip": "192.168.1.1",
                "device": "iPhone 14",
                "location": "Shanghai, China"
            }
        ]
    }
}
```

### 2.3 Set User as Internal Staff (Admin)
**POST** `/api/admin/user/set-internal`

**Request Body:**
```json
{
    "user_id": 12345678,
    "is_internal": true
}
```

**Response:**
```json
{
    "code": 1,
    "msg": "设置成功",
    "data": {
        "user_id": 12345678,
        "is_internal": true
    }
}
```

**Notes:**
- Internal staff's withdrawals and investments don't count toward team performance
- Used for company employees managing the platform

---

## 3. VIP System

### 3.1 Get VIP Level Configuration
**GET** `/api/vip/levels`

**Response:**
```json
{
    "code": 1,
    "msg": "ok",
    "data": [
        {
            "level": 0,
            "name": "VIP0",
            "min_investment": 0,
            "extra_interest_rate": 0,
            "commission_l1": 1,
            "commission_l2": 0
        },
        {
            "level": 1,
            "name": "VIP1",
            "min_investment": 30000,
            "extra_interest_rate": 0.05,
            "commission_l1": 2,
            "commission_l2": 1
        },
        // ... VIP2 through VIP8
        {
            "level": 8,
            "name": "VIP8",
            "min_investment": 13000000,
            "extra_interest_rate": 0.25,
            "commission_l1": 7,
            "commission_l2": 5
        }
    ]
}
```

### 3.2 Get VIP Progress
**GET** `/api/user/vip-progress`

**Response:**
```json
{
    "code": 1,
    "msg": "ok",
    "data": {
        "current_level": 3,
        "current_investment": 200000,
        "next_level": 4,
        "next_level_min": 800000,
        "amount_needed": 600000,
        "progress_percent": 25,
        "current_benefits": {
            "extra_interest_rate": 0.12,
            "commission_l1": 4,
            "commission_l2": 2
        },
        "next_benefits": {
            "extra_interest_rate": 0.15,
            "commission_l1": 5,
            "commission_l2": 3
        }
    }
}
```

---

## 4. Payment & Recharge

### 4.1 Get Payment Methods
**GET** `/api/payment/methods`

**Response:**
```json
{
    "code": 1,
    "msg": "ok",
    "data": {
        "cny_methods": [
            {
                "code": "alipay",
                "name": "支付宝",
                "min_amount": 100,
                "max_amount": 500000,
                "rebate_currency": "USDT"
            },
            {
                "code": "wechat",
                "name": "微信支付",
                "min_amount": 100,
                "max_amount": 500000,
                "rebate_currency": "USDT"
            },
            {
                "code": "bank",
                "name": "银行卡转账",
                "min_amount": 1000,
                "max_amount": 5000000,
                "requires_proof": true,
                "rebate_currency": "USDT"
            }
        ],
        "usdt_methods": [
            {
                "code": "usdt_trc20",
                "name": "USDT-TRC20",
                "min_amount": 10,
                "max_amount": 1000000,
                "rebate_currency": "USDT"
            },
            {
                "code": "usdt_erc20",
                "name": "USDT-ERC20",
                "min_amount": 50,
                "max_amount": 1000000,
                "rebate_currency": "USDT"
            }
        ]
    }
}
```

### 4.2 Recharge (RMB)
**POST** `/api/recharge/cny`

**Request Body:**
```json
{
    "amount": 10000,
    "payment_method": "alipay",
    "proof_image": "url (optional, required for bank)"
}
```

**Response:**
```json
{
    "code": 1,
    "msg": "充值申请成功",
    "data": {
        "order_no": "R2025120100001",
        "amount": 10000,
        "currency": "CNY",
        "payment_method": "alipay",
        "status": "pending",
        "rebate_preview": {
            "rate": 0.004,
            "amount_usdt": 5.56,
            "currency": "USDT"
        }
    }
}
```

### 4.3 Recharge (USDT)
**POST** `/api/recharge/usdt`

**Request Body:**
```json
{
    "amount": 1000,
    "network": "TRC20"
}
```

**Response:**
```json
{
    "code": 1,
    "msg": "充值申请成功",
    "data": {
        "order_no": "U2025120100001",
        "amount": 1000,
        "currency": "USDT",
        "wallet_address": "TXxxxxxxxxxxxxxx",
        "status": "pending",
        "rebate_preview": {
            "rate": 0.0045,
            "amount_usdt": 4.50,
            "currency": "USDT"
        }
    }
}
```

### 4.4 Get Rebate Configuration
**GET** `/api/payment/rebate-config`

**Response:**
```json
{
    "code": 1,
    "msg": "ok",
    "data": {
        "cny_rebates": {
            "VIP0": 0.10,
            "VIP1": 0.20,
            "VIP2": 0.30,
            "VIP3": 0.40,
            "VIP4": 0.50,
            "VIP5": 0.60,
            "VIP6": 0.70,
            "VIP7": 0.80,
            "VIP8": 1.00
        },
        "usdt_rebates": {
            "VIP0": 0.15,
            "VIP1": 0.25,
            "VIP2": 0.35,
            "VIP3": 0.45,
            "VIP4": 0.55,
            "VIP5": 0.65,
            "VIP6": 0.75,
            "VIP7": 0.85,
            "VIP8": 1.10
        },
        "rebate_currency": "USDT"
    }
}
```

---

## 5. Withdrawal

### 5.1 Create Withdrawal
**POST** `/api/withdraw/create`

**Request Body:**
```json
{
    "amount": 5000,
    "currency": "CNY",
    "bank_card_id": 123,
    "pay_password": "123456"
}
```

**Response:**
```json
{
    "code": 1,
    "msg": "提现申请成功",
    "data": {
        "order_no": "W2025120100001",
        "amount": 5000,
        "currency": "CNY",
        "fee": 0,
        "actual_amount": 5000,
        "status": "pending"
    }
}
```

---

## 6. Team Management

### 6.1 Get Team Overview
**GET** `/api/team/overview`

**Response:**
```json
{
    "code": 1,
    "msg": "ok",
    "data": {
        "total_members": 25,
        "counting_members": 22,
        "level1_count": 10,
        "level2_count": 15,
        "internal_staff_count": 3,
        "total_recharges": 500000,
        "total_withdrawals": 100000,
        "total_investments": 350000,
        "total_holding": 400000
    }
}
```

### 6.2 Get Team Members
**GET** `/api/team/members?level=1&page=1&limit=20`

**Response:**
```json
{
    "code": 1,
    "msg": "ok",
    "data": {
        "total": 10,
        "list": [
            {
                "id": 23456789,
                "user_id": "23456789",
                "username": "user1",
                "vip_level": 2,
                "is_internal": false,
                "recharges": 50000,
                "withdraws": 10000,
                "investments": 35000,
                "join_date": "2025-11-15T10:00:00Z"
            }
        ]
    }
}
```

### 6.3 Get Team Tree
**GET** `/api/team/tree?max_depth=2`

**Response:**
```json
{
    "code": 1,
    "msg": "ok",
    "data": {
        "root_user_id": 12345678,
        "max_depth": 2,
        "total_nodes": 25,
        "children": [
            {
                "id": 23456789,
                "uid": "23456789",
                "username": "张三",
                "vip_level": 3,
                "is_internal": false,
                "recharges": 150000,
                "withdraws": 30000,
                "children": [
                    {
                        "id": 34567890,
                        "uid": "34567890",
                        "username": "李四",
                        "vip_level": 2,
                        "is_internal": false,
                        "recharges": 50000,
                        "withdraws": 10000
                    }
                ]
            }
        ]
    }
}
```

---

## 7. Team Rewards

### 7.1 Get Team Reward Configuration
**GET** `/api/team/reward-config`

**Response:**
```json
{
    "code": 1,
    "msg": "ok",
    "data": [
        { "member_count": 3, "min_investment": 80000, "reward": 1800 },
        { "member_count": 5, "min_investment": 150000, "reward": 2500 },
        { "member_count": 10, "min_investment": 500000, "reward": 8800 },
        { "member_count": 20, "min_investment": 1500000, "reward": 18000 },
        { "member_count": 50, "min_investment": 3800000, "reward": 25000 },
        { "member_count": 100, "min_investment": 8800000, "reward": 38000 },
        { "member_count": 200, "min_investment": 15000000, "reward": 66000 },
        { "member_count": 500, "min_investment": 58000000, "reward": 100000 },
        { "member_count": 1000, "min_investment": 98000000, "reward": 180000 }
    ]
}
```

### 7.2 Get User Reward Status
**GET** `/api/team/reward-status`

**Response:**
```json
{
    "code": 1,
    "msg": "ok",
    "data": {
        "team_member_count": 15,
        "team_total_investment": 600000,
        "eligible_rewards": [
            { "id": 1, "member_count": 3, "min_investment": 80000, "reward": 1800, "status": "claimed" },
            { "id": 2, "member_count": 5, "min_investment": 150000, "reward": 2500, "status": "claimed" },
            { "id": 3, "member_count": 10, "min_investment": 500000, "reward": 8800, "status": "claimable" }
        ],
        "next_milestone": {
            "member_count": 20,
            "min_investment": 1500000,
            "reward": 18000,
            "members_needed": 5,
            "investment_needed": 900000
        },
        "total_earned": 4300,
        "total_pending": 8800
    }
}
```

### 7.3 Claim Team Reward
**POST** `/api/team/claim-reward`

**Request Body:**
```json
{
    "reward_id": 3
}
```

**Response:**
```json
{
    "code": 1,
    "msg": "奖励领取成功",
    "data": {
        "reward_amount": 8800,
        "new_balance": 58800
    }
}
```

---

## 8. Calendar Statistics

### 8.1 Get Monthly Calendar
**GET** `/api/calendar/monthly?year=2025&month=12`

**Response:**
```json
{
    "code": 1,
    "msg": "ok",
    "data": {
        "year": 2025,
        "month": 12,
        "summary": {
            "cny": {
                "total_recharge": 50000,
                "total_withdrawal": 10000,
                "total_profit": 2500,
                "total_rebate": 0,
                "net_flow": 42500
            },
            "usdt": {
                "total_recharge": 1000,
                "total_withdrawal": 200,
                "total_profit": 50,
                "total_rebate": 15,
                "net_flow": 865
            }
        },
        "calendar": [
            // Weekly arrays
            [
                { "day": null },
                { "day": 1, "date": "2025-12-01", "has_activity": true, "income_cny": 5000, "expense_cny": 0 },
                // ... more days
            ]
        ]
    }
}
```

### 8.2 Get Daily Details
**GET** `/api/calendar/daily?date=2025-12-01`

**Response:**
```json
{
    "code": 1,
    "msg": "ok",
    "data": {
        "date": "2025-12-01",
        "entries": [
            {
                "type": "recharge",
                "currency": "CNY",
                "amount": 5000,
                "description": "支付宝充值"
            },
            {
                "type": "profit",
                "currency": "CNY",
                "amount": 125,
                "description": "日利宝收益"
            }
        ],
        "summary": {
            "cny": { "income": 5125, "expense": 0, "net": 5125 },
            "usdt": { "income": 0.69, "expense": 0, "net": 0.69 }
        }
    }
}
```

---

## 9. Admin Dashboard

### 9.1 Get Dashboard Overview
**GET** `/api/admin/dashboard/overview?range=today`

**Query Parameters:**
- `range`: `today`, `yesterday`, `last_7_days`, `last_30_days`, `this_month`, `custom`
- `start_date`: Required for custom range
- `end_date`: Required for custom range

**Response:**
```json
{
    "code": 1,
    "msg": "ok",
    "data": {
        "time_range": "today",
        "date_range": {
            "start": "2025-12-01T00:00:00Z",
            "end": "2025-12-01T23:59:59Z"
        },
        "new_registrations": 15,
        "total_users": 1250,
        "rmb": {
            "total_recharge": 125000,
            "total_withdrawal": 35000,
            "net_flow": 90000,
            "recharge_count": 25,
            "withdrawal_count": 8
        },
        "usdt": {
            "total_recharge": 5000,
            "total_withdrawal": 1200,
            "net_flow": 3800,
            "recharge_count": 12,
            "withdrawal_count": 4
        },
        "pending": {
            "recharges": 5,
            "withdrawals": 3,
            "total": 8
        }
    }
}
```

### 9.2 Get Daily Breakdown
**GET** `/api/admin/dashboard/daily?range=last_7_days`

**Response:**
```json
{
    "code": 1,
    "msg": "ok",
    "data": [
        {
            "date": "2025-12-01",
            "registrations": 15,
            "rmb": { "recharge": 125000, "withdrawal": 35000 },
            "usdt": { "recharge": 5000, "withdrawal": 1200 }
        }
        // ... more days
    ]
}
```

### 9.3 Get VIP Distribution
**GET** `/api/admin/dashboard/vip-distribution`

**Response:**
```json
{
    "code": 1,
    "msg": "ok",
    "data": {
        "VIP0": 450,
        "VIP1": 320,
        "VIP2": 180,
        "VIP3": 120,
        "VIP4": 85,
        "VIP5": 50,
        "VIP6": 30,
        "VIP7": 12,
        "VIP8": 3
    }
}
```

---

## 10. Exchange Rate

### 10.1 Get Current Exchange Rate
**GET** `/api/currency/rate`

**Response:**
```json
{
    "code": 1,
    "msg": "ok",
    "data": {
        "USDT_CNY": 7.2,
        "CNY_USDT": 0.138889,
        "last_updated": "2025-12-01T10:00:00Z",
        "source": "manual"
    }
}
```

### 10.2 Update Exchange Rate (Admin)
**POST** `/api/admin/currency/rate`

**Request Body:**
```json
{
    "rate": 7.25,
    "source": "manual"
}
```

**Response:**
```json
{
    "code": 1,
    "msg": "汇率更新成功",
    "data": {
        "USDT_CNY": 7.25,
        "CNY_USDT": 0.137931,
        "last_updated": "2025-12-01T15:30:00Z"
    }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 1 | Success |
| -1 | General error |
| 401 | Unauthorized (token invalid/expired) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Resource not found |
| 422 | Validation error |

---

## Installation Guide

### Prerequisites
- Node.js 18+ or PHP 7.4+
- MySQL 8.0+
- Redis (optional, for caching)

### Setup Steps

1. **Clone the repository**
```bash
git clone https://github.com/your-org/providence.git
cd providence
```

2. **Install dependencies**
```bash
# Frontend
cd qiantai
npm install

# Backend (if using Node.js)
cd ../backend
npm install
```

3. **Database setup**
```bash
# Run schema migrations
mysql -u root -p < qiantai/database-design.sql
mysql -u root -p < qiantai/backend/database/schema-enhancements.sql
```

4. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your database credentials and API keys
```

5. **Start the application**
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### Configuration Files

- `qiantai/config.js` - Frontend API configuration
- `qiantai/backend/config/` - Backend configuration modules
  - `vip-config.js` - VIP levels and commission rates
  - `team-rewards-config.js` - Team milestone rewards
  - `payment-config.js` - Payment methods and rebates

---

## Changelog

### v2.0.0 (2025-12-01)
- Added dual currency support (RMB and USDT)
- Implemented payment rebate system with USDT rebates
- Added 8-digit user ID generation
- Enhanced VIP system (VIP0-VIP8) with new rates
- Added team tree visualization
- Implemented internal staff feature
- Added calendar-based statistics
- Enhanced admin dashboard with separate currency tracking

### v1.0.0 (2025-11-01)
- Initial release
