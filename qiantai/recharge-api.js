/**
 * 充值API工具类
 * API文档：Providence前端API接口文档.md
 */

class RechargeAPI {
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
     * 支付宝充值
     * @param {Object} data - 充值信息
     * @param {number} data.amount - 充值金额
     * @param {string} data.order_no - 第三方支付订单号（可选）
     * @param {string} data.third_party_order - 第三方支付数据（可选）
     */
    async rechargeAlipay(data) {
        const token = this.getToken();
        if (!token) {
            throw new Error('未登录');
        }

        const response = await fetch(`${this.baseURL}/pay/recharge`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Token': token,
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                amount: data.amount,
                payment_method: 'alipay',
                order_no: data.order_no || '',
                third_party_order: data.third_party_order || ''
            })
        });

        const result = await response.json();
        if (result.code === 1 || result.code === 200) {
            return result.data;
        } else {
            throw new Error(result.message || result.msg || '充值失败');
        }
    }

    /**
     * 微信充值
     * @param {Object} data - 充值信息
     * @param {number} data.amount - 充值金额
     * @param {string} data.order_no - 第三方支付订单号（可选）
     * @param {string} data.third_party_order - 第三方支付数据（可选）
     */
    async rechargeWechat(data) {
        const token = this.getToken();
        if (!token) {
            throw new Error('未登录');
        }

        const response = await fetch(`${this.baseURL}/pay/recharge`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Token': token,
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                amount: data.amount,
                payment_method: 'wechat',
                order_no: data.order_no || '',
                third_party_order: data.third_party_order || ''
            })
        });

        const result = await response.json();
        if (result.code === 1 || result.code === 200) {
            return result.data;
        } else {
            throw new Error(result.message || result.msg || '充值失败');
        }
    }

    /**
     * USDT充值
     * @param {Object} data - 充值信息
     * @param {number} data.amount - 充值金额（USDT）
     */
    async rechargeUSDT(data) {
        const token = this.getToken();
        if (!token) {
            throw new Error('未登录');
        }

        const response = await fetch(`${this.baseURL}/pay/us/recharge`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Token': token,
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                amount: data.amount
            })
        });

        const result = await response.json();
        if (result.code === 1 || result.code === 200) {
            return result.data;
        } else {
            throw new Error(result.message || result.msg || '充值失败');
        }
    }

    /**
     * 银行卡充值（需要支付密码）
     * @param {Object} data - 充值信息
     * @param {number} data.amount - 充值金额
     * @param {string} data.pay_password - 支付密码
     */
    async rechargeBank(data) {
        const token = this.getToken();
        if (!token) {
            throw new Error('未登录');
        }

        const response = await fetch(`${this.baseURL}/pay/recharge`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Token': token,
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                amount: data.amount,
                payment_method: 'bank',
                pay_password: data.pay_password
            })
        });

        const result = await response.json();
        if (result.code === 1 || result.code === 200) {
            return result.data;
        } else {
            throw new Error(result.message || result.msg || '充值失败');
        }
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RechargeAPI;
} else {
    window.RechargeAPI = RechargeAPI;
}
