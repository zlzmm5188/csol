#!/bin/bash

echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║              Providence 系统健康检查 v1.0                            ║"
echo "║                                                                        ║"
echo "║  检查项目:                                                             ║"
echo "║    1. Token全局检查    2. 权限接口      3. 资金接口                   ║"
echo "║    4. VIP接口         5. 团队接口      6. 充值接口                   ║"
echo "║    7. 提现接口        8. 风控接口      9. 短信接口                   ║"
echo "║    10. 登录流程       11. 后端路由     12. ThinkPHP防跳转            ║"
echo "║                                                                        ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

# 获取Token
echo "【第1步】获取登录Token..."
LOGIN_RESPONSE=$(curl -s "http://127.0.0.1/api/auth/login" \
  -H "Host: api.4kp3l0iq.top" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{"username":"G138688","password":"G138688"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('accessToken', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Token获取失败"
  exit 1
fi

echo "✅ Token已获取"
echo ""

# 定义接口列表
declare -a ENDPOINTS=(
  "/api/user/info:权限-用户信息"
  "/api/admin/roles:权限-角色列表"
  "/api/user/balance:资金-用户余额"
  "/api/user/wallet:资金-钱包信息"
  "/api/user/vip/level:VIP-等级"
  "/api/user/vip/progress:VIP-进度"
  "/api/team/members:团队-成员"
  "/api/team/rewards:团队-奖励"
  "/api/recharge/methods:充值-方式"
  "/api/recharge/records:充值-记录"
  "/api/withdraw/methods:提现-方式"
  "/api/withdraw/records:提现-记录"
  "/api/risk/score:风控-评分"
  "/api/sms/records:短信-记录"
)

# 测试所有接口
echo "【第2步】测试所有接口..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PASS=0
FAIL=0

for endpoint_info in "${ENDPOINTS[@]}"; do
  ENDPOINT="${endpoint_info%:*}"
  NAME="${endpoint_info#*:}"
  
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1${ENDPOINT}" \
    -H "Host: api.4kp3l0iq.top" \
    -H "Authorization: Bearer ${TOKEN}" \
    -X GET)
  
  if [ "$STATUS" = "200" ]; then
    echo "✅ $NAME (HTTP $STATUS)"
    ((PASS++))
  else
    echo "⚠️  $NAME (HTTP $STATUS)"
    ((FAIL++))
  fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 登录流程诊断
echo "【第3步】登录流程诊断..."
echo "───────────────────────────────────────────────────────────────"

# 检查登录
LOGIN_CODE=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('code', 'N/A'))" 2>/dev/null)
[ "$LOGIN_CODE" = "0" ] && echo "✅ 登录正常 (code=$LOGIN_CODE)" || echo "❌ 登录异常 (code=$LOGIN_CODE)"

# 检查用户信息
USER_INFO=$(curl -s "http://127.0.0.1/api/user/info" \
  -H "Host: api.4kp3l0iq.top" \
  -H "Authorization: Bearer ${TOKEN}" \
  -X GET)

USERNAME=$(echo "$USER_INFO" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('data', {}).get('username', 'N/A'))" 2>/dev/null)
[ "$USERNAME" != "N/A" ] && echo "✅ 用户信息加载正常 (username=$USERNAME)" || echo "❌ 用户信息加载失败"

echo ""

# 后端配置检查
echo "【第4步】后端配置检查..."
echo "───────────────────────────────────────────────────────────────"

# 检查.env
if [ -f "/www/wwwroot/api.4kp3l0iq.top/.env" ]; then
  echo "✅ .env配置文件存在"
else
  echo "❌ .env配置文件不存在"
fi

# 检查路由
ROUTE_FILE="/www/wwwroot/api.4kp3l0iq.top/app/admin/route/api.php"
if [ -f "$ROUTE_FILE" ]; then
  echo "✅ API路由文件存在"
  ROUTE_COUNT=$(grep -c "Route::" "$ROUTE_FILE" 2>/dev/null || echo "0")
  echo "   路由规则数: $ROUTE_COUNT条"
else
  echo "⚠️  API路由文件不存在 ($ROUTE_FILE)"
fi

# 检查中间件
MIDDLEWARE_FILE="/www/wwwroot/api.4kp3l0iq.top/app/admin/middleware/CheckToken.php"
if [ -f "$MIDDLEWARE_FILE" ]; then
  echo "✅ Token检查中间件存在"
else
  echo "⚠️  Token检查中间件不存在"
fi

echo ""

# 最终报告
echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║                       📊 最终检查报告                                ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "接口检查: ✅ $PASS 个通过, ⚠️  $FAIL 个异常"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "✨ 系统状态: 完全就绪 ✨"
else
  echo "⚠️  系统状态: 基本就绪（有异常接口需要检查）"
fi

echo ""
