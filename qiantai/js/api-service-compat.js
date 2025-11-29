/**
 * ApiService 兼容层
 * 用于兼容旧版代码中的 ApiService 调用
 * 将 ApiService 调用映射到新的 API 结构
 */

(function() {
  'use strict';

  // 等待 API 和 API_CONFIG 加载
  function waitForAPI() {
    return new Promise((resolve) => {
      if (window.API && window.API_CONFIG) {
        resolve();
      } else {
        const check = setInterval(() => {
          if (window.API && window.API_CONFIG) {
            clearInterval(check);
            resolve();
          }
        }, 50);
        setTimeout(() => {
          clearInterval(check);
          resolve(); // 超时也继续，避免阻塞
        }, 2000);
      }
    });
  }

  // 创建 ApiService 兼容对象
  async function createApiService() {
    await waitForAPI();

    const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';

    // 通用请求方法
    async function request(method, url, data = null) {
      const token = localStorage.getItem('providence_token') || localStorage.getItem('providence_token') || '';

      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['token'] = token; // 兼容旧版
      }

      const options = {
        method: method.toUpperCase(),
        headers: headers
      };

      if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        options.body = JSON.stringify(data);
      }

      try {
        const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
        const response = await fetch(fullUrl, options);
        const text = await response.text();

        let result;
        try {
          result = text ? JSON.parse(text) : {};
        } catch (e) {
          console.error('[ApiService] JSON解析失败:', text.substring(0, 200));
          return { code: -1, msg: '响应格式错误', data: null };
        }

        // 处理Token过期
        if (result.code === 401 || result.code === -401) {
          localStorage.removeItem('providence_token');
          localStorage.removeItem('token');
          if (window.location.pathname !== '/login.html') {
            window.location.href = '/login.html';
          }
          return { code: -1, msg: '登录已过期', data: null };
        }

        return result;
      } catch (error) {
        console.error('[ApiService] 请求失败:', error);
        return { code: -1, msg: error.message || '网络错误', data: null };
      }
    }

    // 创建 ApiService 对象
    window.ApiService = {
      // 认证相关
      auth: {
        requireLogin() {
          const token = localStorage.getItem('providence_token') || localStorage.getItem('providence_token') || '';
          if (!token) {
            window.location.href = '/login.html';
            return false;
          }
          return true;
        },
        checkLogin() {
          const token = localStorage.getItem('providence_token') || localStorage.getItem('providence_token') || '';
          return !!token;
        }
      },

      // 财务相关
      finance: {
        /**
         * 获取用户余额
         */
        async getUserBalance() {
          // 使用新的 API 结构
          if (window.API && window.API.user && window.API.user.getInfo) {
            try {
              const res = await window.API.user.getInfo();
              if (res && res.data) {
                return {
                  code: 1,
                  msg: 'ok',
                  data: {
                    balance_cny: parseFloat(res.data.cny || res.data.balance_cny || 0),
                    balance_usdt: parseFloat(res.data.usdt || res.data.balance_usdt || 0)
                  }
                };
              }
            } catch (e) {
              console.warn('[ApiService] 使用新API失败，降级到直接请求:', e);
            }
          }

          // 降级方案：直接请求
          return await request('GET', '/api/user/index');
        },

        /**
         * 充值申请
         */
        async recharge(data) {
          // 使用新的 API 结构
          if (window.API && window.API.finance && window.API.finance.recharge) {
            try {
              return await window.API.finance.recharge({
                amount: data.amount,
                currency: data.currency || 'CNY',
                payment_method: data.payment_method || 'bank',
                payment_proof: data.receipt_image || data.payment_proof,
                pay_password: data.pay_password,
                remark: data.remark
              });
            } catch (e) {
              console.warn('[ApiService] 使用新API失败，降级到直接请求:', e);
            }
          }

          // 降级方案：直接请求（使用正确的接口路径）
          return await request('POST', '/api/recharge/add', {
            amount: data.amount,
            currency: data.currency || 'CNY',
            payment_method: data.payment_method || 'bank',
            payment_proof: data.receipt_image || data.payment_proof || ''
          });
        },

        /**
         * 提现申请
         */
        async withdraw(data) {
          if (window.API && window.API.finance && window.API.finance.withdraw) {
            return await window.API.finance.withdraw(data);
          }
          return await request('POST', '/api/withdraw/create', data);
        }
      },

      // 通用POST方法
      async post(url, data) {
        return await request('POST', url, data);
      },

      // 通用GET方法
      async get(url, params) {
        const query = params ? '?' + new URLSearchParams(params).toString() : '';
        return await request('GET', url + query);
      }
    };

    console.log('✅ ApiService 兼容层已初始化');
  }

  // 立即初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createApiService);
  } else {
    createApiService();
  }
})();
