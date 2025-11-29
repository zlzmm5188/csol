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
