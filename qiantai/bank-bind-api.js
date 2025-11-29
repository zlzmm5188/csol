/**
 * 银行卡/USDT绑定API工具类
 * API文档：Providence前端API接口文档.md
 */

class BankBindAPI {
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
     * 绑定银行卡
     * @param {Object} data - 银行卡信息
     * @param {string} data.bank_name - 银行名称
     * @param {string} data.bank_card - 银行卡号
     * @param {string} data.bank_branch - 支行（可选）
     * @param {string} data.pay_password - 支付密码（可选）
     */
    async bindBank(data) {
        const token = this.getToken();
        if (!token) {
            throw new Error('未登录');
        }

        const response = await fetch(`${this.baseURL}/pay/bank/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Token': token,
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                btype: data.bank_name,
                card: data.bank_card,
                branch: data.bank_branch || '',
                pwd: data.pay_password || '',
                type: data.bank_name
            })
        });

        const result = await response.json();
        if (result.code === 1 || result.code === 200) {
            return result.data;
        } else {
            throw new Error(result.message || result.msg || '绑定失败');
        }
    }

    /**
     * 绑定USDT地址
     * @param {Object} data - USDT信息
     * @param {string} data.address - USDT地址
     * @param {string} data.chain_type - 链类型（TRC20/ERC20/OMNI，默认TRC20）
     * @param {string} data.pay_password - 支付密码（首次绑定时需要）
     */
    async bindUSDT(data) {
        const token = this.getToken();
        if (!token) {
            throw new Error('未登录');
        }

        const response = await fetch(`${this.baseURL}/user/usdt-address/bind`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Token': token,
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                address: data.address,
                chain_type: data.chain_type || 'TRC20',
                pay_password: data.pay_password || ''
            })
        });

        const result = await response.json();
        if (result.code === 1 || result.code === 200) {
            return result.data;
        } else {
            throw new Error(result.message || result.msg || '绑定失败');
        }
    }

    /**
     * 获取银行卡列表
     */
    async getBankList() {
        const token = this.getToken();
        if (!token) {
            throw new Error('未登录');
        }

        const response = await fetch(`${this.baseURL}/user/bank/list`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Token': token,
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();
        if (result.code === 1 || result.code === 200) {
            return result.data || [];
        } else {
            throw new Error(result.message || result.msg || '获取失败');
        }
    }

    /**
     * 获取USDT地址列表
     */
    async getUSDTList() {
        const token = this.getToken();
        if (!token) {
            throw new Error('未登录');
        }

        const response = await fetch(`${this.baseURL}/user/usdt-address/list`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Token': token,
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();
        if (result.code === 1 || result.code === 200) {
            return result.data || [];
        } else {
            throw new Error(result.message || result.msg || '获取失败');
        }
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BankBindAPI;
} else {
    window.BankBindAPI = BankBindAPI;
}
