#!/bin/bash

API_DOMAIN="https://api.4kp3l0iq.top"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " 🔍 Providence API 自动探测系统（v1.0）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

REPORT="/tmp/api-scan-report.json"
API_MAP_JS="/www/wwwroot/4kp3l0iq.top/API_MAP.js"

echo "{" > "$REPORT"

declare -a PATHS=(
    "/"
    "/api/user/info"
    "/api/user/index"
    "/api/user/profile"
    "/api/user/balance"
    "/api/user/wallet"
    "/api/user/vip/level"
    "/api/user/vip/progress"
    "/api/team/members"
    "/api/team/structure"
    "/api/team/rewards"
    "/api/team/info"
    "/api/finance/transactions"
    "/api/finance/logs"
    "/api/finance/recharge/list"
    "/api/finance/withdraw/list"
    "/api/recharge/methods"
    "/api/recharge/records"
    "/api/withdraw/methods"
    "/api/withdraw/records"
    "/api/ribao/info"
    "/api/ribao/list"
    "/api/ribao/history"
    "/api/commission/info"
    "/api/commission/history"
    "/api/vip/config"
    "/api/admin/roles"
    "/api/admin/permissions"
)

echo "📌 正在自动获取登录 Token..."

LOGIN_RES=$(curl -s "http://127.0.0.1/api/auth/login" \
  -H "Host: api.4kp3l0iq.top" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{"username":"G138688","password":"G138688"}')

TOKEN=$(echo "$LOGIN_RES" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('accessToken',''))" 2>/dev/null)

if [[ -z "$TOKEN" ]]; then
  echo "❌ Token 获取失败"
  exit 1
fi

echo "✔ Token 获取成功: ${TOKEN:0:40}..."
echo ""

echo "\"results\": {" >> "$REPORT"

# 用于生成API_MAP.js的数据
declare -A API_MAP_DATA

VALID_ENDPOINTS=""

for p in "${PATHS[@]}"; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔎 检查接口: $p"
  
  RES=$(curl -s "http://127.0.0.1$p" \
    -H "Host: api.4kp3l0iq.top" \
    -H "Authorization: Bearer $TOKEN")
  
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1$p" \
    -H "Host: api.4kp3l0iq.top")
  
  CODE=$(echo "$RES" | python3 -c "import sys,json; 
try:
    d=json.load(sys.stdin)
    print(d.get('code', 'null'))
except:
    print('non-json')" 2>/dev/null)
  
  MSG=$(echo "$RES" | python3 -c "import sys,json;
try:
    d=json.load(sys.stdin)
    print(d.get('msg','').replace('\"', '\\\"'))
except:
    print('')" 2>/dev/null)
  
  # 结果分类
  STATUS="UNKNOWN"
  if [[ "$CODE" == "0" ]]; then
     STATUS="OK"
  elif [[ "$CODE" == "401" ]]; then
     STATUS="Unauthorized"
  elif [[ "$HTTP_CODE" == "404" ]]; then
     STATUS="NotFound"
  elif [[ "$RES" == *"请先登陆"* ]] || [[ "$RES" == *"请先登录"* ]]; then
     STATUS="Fake-200-Unauthorized"
  elif [[ "$CODE" == "non-json" ]]; then
     STATUS="HTML-or-Error"
  else
     STATUS="Other"
  fi
  
  echo "📌 状态: $STATUS"
  echo "📌 HTTP状态: $HTTP_CODE"
  echo "📌 code: $CODE"
  echo "📌 msg: $MSG"
  echo ""
  
  echo "\"$p\": {\"status\": \"$STATUS\", \"http\": \"$HTTP_CODE\", \"code\": \"$CODE\", \"msg\": \"$MSG\"}," >> "$REPORT"
  
  # 记录有效的接口
  if [[ "$STATUS" == "OK" ]]; then
    VALID_ENDPOINTS="$VALID_ENDPOINTS\n    '$p',"
  fi
done

echo "}}" >> "$REPORT"

echo ""
echo "✔ 扫描完成！"
echo "📄 JSON报告文件已生成： $REPORT"
echo ""

# 生成API_MAP.js
echo "📝 生成 API_MAP.js..."

cat > "$API_MAP_JS" << 'EOFMAP'
/**
 * Providence API 统一映射表
 * 自动生成 - 请勿手动编辑
 * 生成时间: $(date)
 */

window.API_MAP = {
  // 用户相关
  USER: {
    INFO: '/api/user/info',           // 用户信息
    PROFILE: '/api/user/profile',      // 用户资料
    BALANCE: '/api/user/balance',      // 用户余额
    WALLET: '/api/user/wallet',        // 钱包信息
  },
  
  // VIP相关
  VIP: {
    LEVEL: '/api/user/vip/level',      // VIP等级
    PROGRESS: '/api/user/vip/progress', // VIP进度
    CONFIG: '/api/vip/config',         // VIP配置
  },
  
  // 团队相关
  TEAM: {
    MEMBERS: '/api/team/members',      // 团队成员
    STRUCTURE: '/api/team/structure',  // 团队结构
    REWARDS: '/api/team/rewards',      // 团队奖励
    INFO: '/api/team/info',            // 团队信息
  },
  
  // 财务相关
  FINANCE: {
    TRANSACTIONS: '/api/finance/transactions', // 交易记录
    LOGS: '/api/finance/logs',                 // 资金日志
  },
  
  // 充值相关
  RECHARGE: {
    METHODS: '/api/recharge/methods',  // 充值方式
    RECORDS: '/api/recharge/records',  // 充值记录
  },
  
  // 提现相关
  WITHDRAW: {
    METHODS: '/api/withdraw/methods',  // 提现方式
    RECORDS: '/api/withdraw/records',  // 提现记录
  },
  
  // 日利宝相关
  RIBAO: {
    INFO: '/api/ribao/info',          // 日利宝信息
    LIST: '/api/ribao/list',          // 日利宝列表
    HISTORY: '/api/ribao/history',    // 日利宝历史
  },
  
  // 佣金相关
  COMMISSION: {
    INFO: '/api/commission/info',     // 佣金信息
    HISTORY: '/api/commission/history', // 佣金历史
  },
  
  // 风控相关
  RISK: {
    SCORE: '/api/risk/score',         // 风险评分
    CHECK: '/api/risk/checks',        // 风控检查
  },
  
  // 短信相关
  SMS: {
    SEND: '/api/sms/send',            // 发送短信
    VERIFY: '/api/sms/verify',        // 验证短信
  }
};

/**
 * 统一API调用方法
 * @param {string} category - 分类 (USER, VIP, TEAM等)
 * @param {string} action - 操作 (INFO, LEVEL等)
 * @param {object} options - 请求选项
 * @returns {Promise}
 */
window.callAPI = function(category, action, options = {}) {
  const path = API_MAP[category]?.[action];
  
  if (!path) {
    console.error(`API_MAP: 找不到 ${category}.${action}`);
    return Promise.reject(new Error(`Invalid API path: ${category}.${action}`));
  }
  
  const apiBase = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
  const url = `${apiBase}${path}`;
  
  const token = localStorage.getItem('providence_token') || 
                sessionStorage.getItem('providence_token');
  
  const fetchOptions = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    },
    ...options
  };
  
  if (options.body && typeof options.body === 'object') {
    fetchOptions.body = JSON.stringify(options.body);
  }
  
  return fetch(url, fetchOptions)
    .then(res => res.json())
    .then(data => {
      if (data.code === 0 || data.code === 1) {
        return data;
      } else {
        throw new Error(data.msg || data.message || 'API错误');
      }
    });
};

// 使用示例:
// callAPI('USER', 'INFO').then(data => console.log(data));
// callAPI('VIP', 'LEVEL').then(data => console.log(data));
// callAPI('TEAM', 'MEMBERS').then(data => console.log(data));

console.log('✓ API_MAP 已加载');
EOFMAP

echo "✔ API_MAP.js 已生成: $API_MAP_JS"
echo ""

# 显示报告
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 扫描报告摘要"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
cat "$REPORT"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ API自动探测完成！"
echo ""
echo "📋 报告位置: $REPORT"
echo "📋 API映射: $API_MAP_JS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

