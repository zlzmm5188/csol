// Providence 通知系统 API 工具类

(function() {
    if (window.__NOTIFICATION_API_JS__) return;
    window.__NOTIFICATION_API_JS__ = true;

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

    window.NotificationAPI = {
        // 1. 获取通知列表 - GET /user/notifications
        async getNotifications(page = 1, pageSize = 20) {
            const result = await apiRequest(`/user/notifications?page=${page}&page_size=${pageSize}`);
            if (result.code === 1) return result.data;
            throw new Error(result.msg || '获取通知失败');
        },

        // 2. 标记为已读 - POST /user/notification-read
        async markAsRead(id) {
            const result = await apiRequest('/user/notification-read', {
                method: 'POST',
                body: JSON.stringify({ id })
            });
            if (result.code === 1) return true;
            throw new Error(result.msg || '标记失败');
        },

        // 3. 获取未读数量 - GET /user/notification-unread-count
        async getUnreadCount() {
            const result = await apiRequest('/user/notification-unread-count');
            if (result.code === 1) return result.data.unread_count || 0;
            throw new Error(result.msg || '获取未读数量失败');
        },

        // 通知类型文本
        getTypeText(type) {
            const map = {
                'recharge': '充值成功',
                'withdraw': '提现审核',
                'invest_expire': '投资到期',
                'referral_reward': '邀请奖励',
                'team_reward': '团队奖励',
                'vip_upgrade': 'VIP升级',
                'announcement': '系统公告'
            };
            return map[type] || '通知';
        }
    };
})();
