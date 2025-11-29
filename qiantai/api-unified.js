/**
 * Providence 统一API请求封装
 * 版本: 1.0.0
 * 日期: 2025-11-23
 *
 * 功能：
 * 1. 统一API请求格式
 * 2. 自动Token管理
 * 3. 统一错误处理
 * 4. 自动重定向（Token过期）
 */

// ===================================
// 统一API客户端
// ===================================
class UnifiedApiClient {
    constructor() {
        // baseURL不应该包含/api，避免路径重复
        let baseURL = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
        // 如果baseURL以/api结尾，去掉它
        if (baseURL.endsWith('/api')) {
            baseURL = baseURL.slice(0, -4);
        }
        this.baseURL = baseURL;
        this.timeout = window.API_CONFIG?.timeout || 30000;
        this.debug = window.API_CONFIG?.debug || false;
    }

    /**
     * 统一请求方法
     * @param {string} endpoint - API路径（如 '/api/user/info'）
     * @param {Object} options - 请求选项
     * @returns {Promise<Object>} API响应数据
     */
    async request(endpoint, options = {}) {
        // 确保endpoint以/开头
        if (!endpoint.startsWith('/')) {
            endpoint = '/' + endpoint;
        }

        const url = `${this.baseURL}${endpoint}`;

        // 获取Token
        let token = null;
        if (typeof TokenManager !== 'undefined' && TokenManager.getToken) {
            token = TokenManager.getToken();
        } else {
            token = localStorage.getItem('providence_token') || sessionStorage.getItem('providence_token');
        }

        // 构建请求头
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };

        // 如果需要认证，添加Token
        if (options.requireAuth !== false && token) {
            defaultHeaders['Token'] = token;  // 注意：首字母大写
        }

        // 合并请求配置
        const config = {
            method: options.method || 'GET',
            headers: {
                ...defaultHeaders,
                ...(options.headers || {})
            },
            ...options
        };

        // 添加请求体
        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        } else if (options.body) {
            config.body = options.body;
        }

        if (this.debug) {
            console.log(`[API] ${config.method} ${url}`, {
                headers: config.headers,
                body: config.body
            });
        }

        let timeoutId = null;
        try {
            // 创建AbortController用于超时控制
            const controller = new AbortController();
            timeoutId = setTimeout(() => controller.abort(), this.timeout);
            config.signal = controller.signal;

            const response = await fetch(url, config);
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }

            // 检查响应状态
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // 解析JSON响应
            const data = await response.json();

            // 统一错误处理
            if (data.code === -1) {
                // Token过期或未登录
                if (data.msg && (data.msg.includes('登录') || data.msg.includes('token') || data.msg.includes('Token'))) {
                    console.warn('[API] Token过期，清除Token并跳转登录页');

                    // 清除Token
                    if (typeof TokenManager !== 'undefined' && TokenManager.clearToken) {
                        TokenManager.clearToken();
                    } else {
                        localStorage.removeItem('providence_token');
                        sessionStorage.removeItem('providence_token');
                    }

                    // 跳转到登录页
                    const redirectUrl = encodeURIComponent(location.href);
                    window.location.href = `login.html?redirect=${redirectUrl}`;
                    return null;
                }

                // 其他错误
                throw new Error(data.msg || '请求失败');
            }

            // 成功响应
            if (this.debug) {
                console.log(`[API] ✅ 响应成功:`, data);
            }

            return data;

        } catch (error) {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }

            if (error.name === 'AbortError') {
                console.error('[API] ❌ 请求超时:', url);
                throw new Error('请求超时，请检查网络连接');
            }

            console.error('[API] ❌ 请求失败:', error);
            throw error;
        }
    }

    /**
     * GET请求
     * @param {string} endpoint - API路径
     * @param {Object} options - 请求选项
     * @returns {Promise<Object>}
     */
    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    /**
     * POST请求
     * @param {string} endpoint - API路径
     * @param {Object} body - 请求体
     * @param {Object} options - 请求选项
     * @returns {Promise<Object>}
     */
    async post(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'POST', body });
    }

    /**
     * PUT请求
     * @param {string} endpoint - API路径
     * @param {Object} body - 请求体
     * @param {Object} options - 请求选项
     * @returns {Promise<Object>}
     */
    async put(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PUT', body });
    }

    /**
     * DELETE请求
     * @param {string} endpoint - API路径
     * @param {Object} options - 请求选项
     * @returns {Promise<Object>}
     */
    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
}

// ===================================
// API路径映射（修复不统一问题）
// ===================================
const ApiPathMapper = {
    // 用户信息 - 统一为 /api/user/info
    '/api/user/info': '/api/user/info',
    '/api/user/info': '/api/user/info',
    '/api/user/info': '/api/user/info',
    '/api/user/info': '/api/user/info',

    // 我的投资 - 统一为 /api/invest/orders
    '/api/user/my-investments': '/api/invest/orders',
    '/user/my-investments': '/invest/orders',

    // 团队列表 - 统一为 /api/team/members
    '/api/user/team/list': '/api/team/members',
    '/user/team/list': '/team/members',

    // 充值 - 统一为 /api/recharge/add
    '/api/user/api/recharge/add': '/api/recharge/add',
    '/user/api/recharge/add': '/api/recharge/add',

    // 提现 - 统一为 /api/withdraw/create
    '/api/user/api/withdraw/create': '/api/withdraw/create',
    '/user/api/withdraw/create': '/api/withdraw/create',
};

/**
 * 规范化API路径
 * @param {string} path - 原始路径
 * @returns {string} 规范化后的路径
 */
function normalizeApiPath(path) {
    // 移除baseURL前缀（如果存在）
    path = path.replace(/^https?:\/\/[^\/]+/, '');
    path = path.replace(/^http:\/\/localhost:\d+\/api/, '');
    path = path.replace(/^https:\/\/api\.4kp3l0iq\.top\/api/, '');

    // 确保以/开头
    if (!path.startsWith('/')) {
        path = '/' + path;
    }

    // 应用路径映射
    if (ApiPathMapper[path]) {
        const mapped = ApiPathMapper[path];
        if (window.API_CONFIG?.debug) {
            console.log(`[API] 路径映射: ${path} → ${mapped}`);
        }
        return mapped;
    }

    return path;
}

// ===================================
// 创建全局实例
// ===================================
window.ApiClient = new UnifiedApiClient();

// ===================================
// 便捷方法（兼容旧代码）
// ===================================
window.fetchAPI = async function(endpoint, options = {}) {
    // 规范化路径
    const normalizedPath = normalizeApiPath(endpoint);

    // 使用统一客户端
    return window.ApiClient.request(normalizedPath, options);
};

// ===================================
// 初始化日志
// ===================================
console.log('[API] ✅ 统一API客户端已加载');
console.log('[API] 📦 配置:', {
    baseURL: window.ApiClient.baseURL,
    timeout: window.ApiClient.timeout,
    debug: window.ApiClient.debug
});
