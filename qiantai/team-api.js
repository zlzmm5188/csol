// Providence 团队管理 API 工具类

(function() {
    if (window.__TEAM_API_JS__) return;
    window.__TEAM_API_JS__ = true;

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

    window.TeamAPI = {
        // 1. 团队概览 - GET /user/team/overview
        async getOverview() {
            const result = await apiRequest('/user/team/overview');
            if (result.code === 1) return result.data;
            throw new Error(result.msg || '获取团队概览失败');
        },

        // 2. 团队列表 - GET /team/members?level=1&page=1
        async getTeamList(level = 1, page = 1, pageSize = 20) {
            const result = await apiRequest(`/team/members?level=${level}&page=${page}&page_size=${pageSize}`);
            if (result.code === 1) return result.data;
            throw new Error(result.msg || '获取团队列表失败');
        },

        // 3. 推荐奖励记录 - GET /user/referral-rewards
        async getReferralRewards(page = 1, pageSize = 20) {
            const result = await apiRequest(`/user/referral-rewards?page=${page}&page_size=${pageSize}`);
            if (result.code === 1) return result.data;
            throw new Error(result.msg || '获取推荐奖励失败');
        }
    };
})();
