// Providence 日利宝 API 工具类

(function() {
    if (window.__RIBAO_API_JS__) return;
    window.__RIBAO_API_JS__ = true;

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
        }

        return result;
    }

    window.RibaoAPI = {
        // 1. 获取日利宝信息 - GET /user/api/ribao/info
        async getInfo() {
            const result = await apiRequest('/user/api/ribao/info');
            if (result.code === 1) return result.data;
            throw new Error(result.msg || '获取日利宝信息失败');
        },

        // 2. 转入日利宝 - POST /user/api/ribao/transfer-in
        async transferIn(amount) {
            const result = await apiRequest('/user/api/ribao/transfer-in', {
                method: 'POST',
                body: JSON.stringify({ amount })
            });
            if (result.code === 1) return result.data;
            throw new Error(result.msg || '转入失败');
        },

        // 3. 转出日利宝 - POST /user/api/ribao/transfer-out
        async transferOut(amount) {
            const result = await apiRequest('/user/api/ribao/transfer-out', {
                method: 'POST',
                body: JSON.stringify({ amount })
            });
            if (result.code === 1) return result.data;
            throw new Error(result.msg || '转出失败');
        },

        // 4. 日利宝记录 - GET /user/api/ribao/records
        async getRecords(page = 1, pageSize = 20) {
            const result = await apiRequest(`/user/api/ribao/records?page=${page}&page_size=${pageSize}`);
            if (result.code === 1) return result.data;
            throw new Error(result.msg || '获取记录失败');
        }
    };
})();
