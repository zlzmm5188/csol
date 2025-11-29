/**
 * 交易记录API工具类
 * API文档：Providence前端API接口文档.md
 */

class TransactionAPI {
    constructor() {
        this.baseURL = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
    }

    /**
     * 获取Token
     */
    getToken() {
        return localStorage.getItem('providence_token') || localStorage.getItem('providence_token') || '';
    }

    /**
     * 获取交易记录
     * @param {Object} params - 查询参数
     * @param {number} params.page - 页码（默认1）
     * @param {number} params.pageSize - 每页数量（默认20）
     * @param {string} params.type - 类型筛选（all|recharge|withdraw|invest|ribao|points）
     * @param {string} params.currency - 币种筛选（all|CNY|USDT|RIBAO|POINTS）
     */
    async getRecords(params = {}) {
        const token = this.getToken();
        if (!token) {
            throw new Error('未登录');
        }

        const queryParams = new URLSearchParams({
            page: params.page || 1,
            pageSize: params.pageSize || 20,
            type: params.type || 'all',
            currency: params.currency || 'all'
        });

        const response = await fetch(`${this.baseURL}/user/transaction/records?${queryParams}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Token': token,
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();
        if (result.code === 1 || result.code === 200) {
            return {
                list: result.data || [],
                total: result.total || 0,
                page: params.page || 1,
                pageSize: params.pageSize || 20
            };
        } else {
            throw new Error(result.message || result.msg || '获取失败');
        }
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TransactionAPI;
} else {
    window.TransactionAPI = TransactionAPI;
}
