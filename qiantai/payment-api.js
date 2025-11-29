// Providence 充值提现 API 工具类

(function() {
    if (window.__PAYMENT_API_JS__) return;
    window.__PAYMENT_API_JS__ = true;

    console.log('[PaymentAPI] 加载 v1.0');

    const API_BASE = 'https://api.4kp3l0iq.top';

    async function apiRequest(endpoint, options = {}) {
        const token = localStorage.getItem('providence_token') || '';
        if (!token) throw new Error('未登录');

        const url = API_BASE + endpoint;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        const response = await fetch(url, { ...options, headers });
        const result = await response.json();

        if (result.code === 401) {
            localStorage.clear();
            window.location.href = 'login.html';
            throw new Error('登录已过期');
        }

        return result;
    }

    // 充值提现API
    window.PaymentAPI = {
        // 1. 充值申请 - POST /pay/recharge
        async recharge(amount, currency = 'CNY', paymentMethod = 'alipay') {
            const requestId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const result = await apiRequest('/pay/recharge', {
                method: 'POST',
                body: JSON.stringify({
                    amount,
                    currency,
                    payment_method: paymentMethod,
                    request_id: requestId
                })
            });
            if (result.code === 1) return result.data;
            throw new Error(result.msg || '充值申请失败');
        },

        // 2. 提现申请 - POST /pay/withdraw
        // 风控规则：CNY ¥100-¥50,000, USDT -,000, 每日3次
        async withdraw(amount, currency, payPassword, bankInfo) {
            // 前端风控验证
            if (currency === 'CNY') {
                if (amount < 100) throw new Error('单笔提现最低¥100');
                if (amount > 50000) throw new Error('单笔提现最高¥50,000');
            } else if (currency === 'USDT') {
                if (amount < 10) throw new Error('单笔提现最低');
                if (amount > 10000) throw new Error('单笔提现最高,000');
            }

            const requestId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const result = await apiRequest('/pay/withdraw', {
                method: 'POST',
                body: JSON.stringify({
                    amount,
                    currency,
                    pay_password: payPassword,
                    bank_info: bankInfo,
                    request_id: requestId
                })
            });
            if (result.code === 1) return result.data;
            throw new Error(result.msg || '提现申请失败');
        },

        // 3. 充值记录 - GET /user/recharge-records
        async getRechargeRecords(page = 1, pageSize = 20) {
            const result = await apiRequest(`/user/recharge-records?page=${page}&page_size=${pageSize}`);
            if (result.code === 1) return result.data;
            throw new Error(result.msg || '获取充值记录失败');
        },

        // 4. 提现记录 - GET /user/withdraw-records
        async getWithdrawRecords(page = 1, pageSize = 20) {
            const result = await apiRequest(`/user/withdraw-records?page=${page}&page_size=${pageSize}`);
            if (result.code === 1) return result.data;
            throw new Error(result.msg || '获取提现记录失败');
        },

        // 提现状态文本
        getWithdrawStatusText(status) {
            const map = {
                'PENDING': '待审核',
                'APPROVED': '已通过',
                'REJECT': '已拒绝',
                'PAID': '已到账'
            };
            return map[status] || status;
        }
    };

    console.log('[PaymentAPI] 初始化完成');
})();
