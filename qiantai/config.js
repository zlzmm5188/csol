// =============================================
// Providence 统一网络层 - 重构版
// 版本: 3.1-ENHANCED
// 日期: 2025-12-01
// =============================================

// ===================================
// 配置
// ===================================
window.API_CONFIG = {
    SPLASH_DOMAIN: 'https://sen.wyzyrx.cn',
    baseURL: 'https://api.4kp3l0iq.top',
    adminURL: 'https://admin.4kp3l0iq.top',
    tokenKey: 'providence_token',
    timeout: 10000,  // 从15秒减少到10秒
    debug: false,  // 生产环境关闭调试
    maxLogEntries: 100  // 最大日志条目数
};

// ===================================
// 统一错误日志系统
// ===================================
const ErrorLogger = {
    logs: [],

    /**
     * 记录错误日志
     * @param {string} level - 日志级别 (error, warn, info)
     * @param {string} category - 分类 (HTTP, TOKEN, APP等)
     * @param {string} message - 错误消息
     * @param {Object} context - 上下文信息
     */
    log(level, category, message, context = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            category,
            message,
            context,
            url: window.location.href
        };

        this.logs.push(entry);

        // 限制日志数量
        if (this.logs.length > API_CONFIG.maxLogEntries) {
            this.logs.shift();
        }

        // 输出到控制台
        const logPrefix = `[${category}]`;
        if (level === 'error') {
            console.error(logPrefix, message, context);
        } else if (level === 'warn') {
            console.warn(logPrefix, message, context);
        } else if (API_CONFIG.debug) {
            console.log(logPrefix, message, context);
        }
    },

    error(category, message, context) {
        this.log('error', category, message, context);
    },

    warn(category, message, context) {
        this.log('warn', category, message, context);
    },

    info(category, message, context) {
        this.log('info', category, message, context);
    },

    /**
     * 获取所有日志
     */
    getLogs() {
        return [...this.logs];
    },

    /**
     * 清除日志
     */
    clear() {
        this.logs = [];
    },

    /**
     * 获取错误统计
     */
    getStats() {
        const stats = {
            total: this.logs.length,
            errors: 0,
            warnings: 0,
            byCategory: {}
        };

        this.logs.forEach(entry => {
            if (entry.level === 'error') stats.errors++;
            if (entry.level === 'warn') stats.warnings++;
            stats.byCategory[entry.category] = (stats.byCategory[entry.category] || 0) + 1;
        });

        return stats;
    }
};

// 导出到全局
window.ErrorLogger = ErrorLogger;

// ===================================
// 语言安全读取函数
// ===================================
function getSafeLanguage(userLanguage) {
    let lng = userLanguage || navigator.language || 'zh_CN';
    if (typeof lng !== 'string') {
        lng = 'zh_CN';
    }
    lng = lng.toLowerCase();
    return lng;
}

// ===================================
// 统一 Token 管理
// ===================================
const TokenService = {
    getToken() {
        try {
            return localStorage.getItem(API_CONFIG.tokenKey) ||
                   localStorage.getItem('providence_token') ||
                   (window.TokenManager?.getToken?.() || '');
        } catch (err) {
            console.warn('[Token] 获取失败:', err);
            return '';
        }
    },

    setToken(token) {
        try {
            localStorage.setItem(API_CONFIG.tokenKey, token);
            if (window.TokenManager?.setToken) {
                window.TokenManager.setToken(token);
            }
            return true;
        } catch (err) {
            console.error('[Token] 保存失败:', err);
            return false;
        }
    },

    removeToken() {
        try {
            localStorage.removeItem(API_CONFIG.tokenKey);
            localStorage.removeItem('token');
            if (window.TokenManager?.removeToken) {
                window.TokenManager.removeToken();
            }
        } catch (err) {
            console.error('[Token] 删除失败:', err);
        }
    },

    checkLogin() {
        return !!this.getToken();
    },

    requireLogin(redirectUrl = 'login.html') {
        if (!this.checkLogin()) {
            // 检查是否已经在登录页，避免循环跳转
            if (window.location.pathname.includes('login.html')) {
                return false;
            }
            console.warn('[Auth] 未登录，跳转到登录页');
            const currentUrl = encodeURIComponent(window.location.href);
            window.location.href = `${redirectUrl}?redirect=${currentUrl}`;
            return false;
        }
        return true;
    }
};

// ===================================
// 统一 HTTP 客户端（唯一实现）
// ===================================
class UnifiedHttpClient {
    constructor(config) {
        this.baseURL = config.baseURL;
        this.timeout = config.timeout;
        this.debug = config.debug;
    }

    /**
     * 构建请求头
     */
    buildHeaders(extra = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...extra
        };

        const token = TokenService.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            headers['Token'] = token; // 兼容旧后端
        }

        return headers;
    }

    /**
     * 统一请求方法
     */
    async request(method, path, data = null, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        // 构建完整URL
        let url;
        if (path.startsWith('http')) {
            url = path;
        } else {
            // 确保路径以 / 开头
            let cleanPath = path.startsWith('/') ? path : '/' + path;
            // 如果baseURL已经以/api结尾，且path也以/api开头，则去掉path中的/api避免重复
            if (this.baseURL.endsWith('/api') && cleanPath.startsWith('/api/')) {
                cleanPath = cleanPath.substring(4); // 去掉 '/api'
            }
            url = `${this.baseURL}${cleanPath}`;
        }

        const requestOptions = {
            method: method.toUpperCase(),
            headers: this.buildHeaders(options.headers || {}),
            signal: controller.signal
        };

        if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
            requestOptions.body = JSON.stringify(data);
        }

        try {
            if (this.debug) {
// console.log(`[HTTP ${method}]`, url, data || ''); // 性能优化：已注释
            }

            const response = await fetch(url, requestOptions);
            const text = await response.text();

            // 解析 JSON
            let result;
            try {
                result = text ? JSON.parse(text) : {};
            } catch (err) {
                ErrorLogger.error('HTTP', 'JSON解析失败', {
                    url,
                    method,
                    responseText: text.substring(0, 200),
                    error: err.message
                });
                throw new Error('响应解析失败: ' + text.substring(0, 50));
            }

            // 统一响应格式
            const normalizedResponse = {
                status: response.status,
                ok: response.ok,
                data: result,
                // 兼容旧代码：直接访问 code、msg
                code: result.code,
                msg: result.msg || result.message
            };

            // 检查Token过期 (code: -1 + 登录相关消息 或 HTTP 401)
            if (response.status === 401 ||
                (result.code === -1 && normalizedResponse.msg &&
                 (normalizedResponse.msg.includes('登录') ||
                  normalizedResponse.msg.includes('token') ||
                  normalizedResponse.msg.includes('Token') ||
                  normalizedResponse.msg.includes('未授权')))) {
                ErrorLogger.warn('TOKEN', 'Token过期或无效，清除登录状态', { url });
                TokenService.removeToken();

                // 触发登录过期事件，让页面可以选择处理方式
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('token-expired', {
                        detail: { url, response: normalizedResponse }
                    }));
                }
            }

            return normalizedResponse;
        } catch (error) {
            // 处理网络连接错误
            if (error.name === 'TypeError' && (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED'))) {
                ErrorLogger.warn('HTTP', '网络连接失败', { url, error: error.message });
                // 返回一个统一的错误响应格式，避免页面崩溃
                return {
                    status: 0,
                    ok: false,
                    data: { code: -1, msg: '网络连接失败，请检查网络或稍后重试', data: null },
                    code: -1,
                    msg: '网络连接失败，请检查网络或稍后重试'
                };
            }
            if (error.name === 'AbortError') {
                ErrorLogger.warn('HTTP', '请求超时', { url, timeout: this.timeout });
                throw new Error('请求超时');
            }
            ErrorLogger.error('HTTP', '请求异常', { url, error: error.message });
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * GET 请求
     */
    async get(path, params = {}, options = {}) {
        // 确保path以/开头，但不包含重复的/api
        let cleanPath = path.startsWith('/') ? path : '/' + path;
        // 如果baseURL已经包含/api，且path也以/api开头，则去掉path中的/api
        if (this.baseURL.includes('/api') && cleanPath.startsWith('/api/')) {
            cleanPath = cleanPath.substring(4); // 去掉 '/api'
        }
        const query = new URLSearchParams(params).toString();
        const fullPath = query ? `${cleanPath}?${query}` : cleanPath;
        return this.request('GET', fullPath, null, options);
    }

    /**
     * POST 请求
     */
    async post(path, data = {}, options = {}) {
        return this.request('POST', path, data, options);
    }

    /**
     * PUT 请求
     */
    async put(path, data = {}, options = {}) {
        return this.request('PUT', path, data, options);
    }

    /**
     * DELETE 请求
     */
    async delete(path, options = {}) {
        return this.request('DELETE', path, null, options);
    }
}

// ===================================
// 统一字段处理（user_id → id → uid）
// ===================================
const FieldNormalizer = {
    /**
     * 标准化用户ID字段
     * 后台返回 user_id，统一转换为 id 和 uid
     */
    normalizeUserId(data) {
        if (!data || typeof data !== 'object') {
            return data;
        }

        // 如果存在 user_id，确保 id 和 uid 也存在
        if (data.user_id !== undefined) {
            data.id = data.user_id;
            data.uid = data.user_id;
        } else if (data.id !== undefined) {
            // 如果只有 id，添加 user_id 和 uid
            data.user_id = data.id;
            data.uid = data.id;
        } else if (data.uid !== undefined) {
            // 如果只有 uid，添加 user_id 和 id
            data.user_id = data.uid;
            data.id = data.uid;
        }

        return data;
    },

    /**
     * 标准化响应数据
     */
    normalizeResponse(response) {
        if (!response || !response.data) {
            return response;
        }

        // 如果 data 是对象，标准化用户ID字段
        if (typeof response.data === 'object' && !Array.isArray(response.data)) {
            response.data = this.normalizeUserId(response.data);
        }

        return response;
    }
};

// ===================================
// 创建统一 HTTP 客户端实例
// ===================================
const http = new UnifiedHttpClient(API_CONFIG);

// ===================================
// 统一 API 服务（封装常用接口）
// ===================================
const ApiService = {
    // Token 管理
    token: TokenService,

    // 认证相关
    auth: {
        checkLogin: () => TokenService.checkLogin(),
        requireLogin: (url) => TokenService.requireLogin(url)
    },

    // 用户信息
    user: {
        /**
         * 获取用户信息（自动标准化字段）
         */
        async getInfo() {
            const res = await http.get('/api/user/info');  // ✅ 正确接口
            return FieldNormalizer.normalizeResponse(res);
        },

        /**
         * 获取VIP进度
         */
        async getVipProgress() {
            return await http.get('/user/vip-progress');  // 修正路径
        }
    },

    // 日利宝
    ribao: {
        async getInfo() {
            try {
                const res = await http.get('/api/ribao/info');  // ✅ 正确接口
                return res.data || {};
            } catch (error) {
                console.warn('[Ribao] 获取日利宝信息失败:', error);
                // 返回空对象，避免页面崩溃
                return {};
            }
        },
        async transferIn(payload) {
            const res = await http.post('/api/user/ribao/transferin', payload);
            return res.data || {};
        },
        async transferOut(payload) {
            const res = await http.post('/api/user/ribao/transferout', payload);
            return res.data || {};
        },
        async getRecords(params = {}) {
            const res = await http.get('/api/ribao/records', params);
            return res.data || {};
        }
    },

    // 项目
    project: {
        /**
         * 获取项目列表
         */
        async getList(params = {}) {
            const res = await http.get('/api/project/index', params);
            return res;
        },
        /**
         * 获取项目详情
         */
        async getDetail(projectId) {
            const res = await http.get('/api/project/detail', { id: projectId });
            return res;
        }
    },

    // 积分
    points: {
        async getBalance() {
            const res = await http.get('/api/points/balance');
            return res.data || {};
        },
        async exchange(payload) {
            const res = await http.post('/api/points/exchange', payload);
            return res.data || {};
        },
        async getLogs(params = {}) {
            const res = await http.get('/api/points/logs', params);
            return res.data || {};
        }
    },

    // 财务
    finance: {
        async getUserBalance() {
            const res = await http.get('/api/user/info');  // ✅ 正确接口
            // 标准化响应：兼容code=200和code=1
            if (res.code === 200) {
                res.code = 1;
            }
            return res; // 返回完整响应（包含code字段）
        },
        async recharge(payload) {
            const res = await http.post('/api/recharge/add', payload);
            return res;
        },
        async withdraw(payload) {
            const res = await http.post('/api/withdraw/create', payload);  // 修正路径
            return res.data || {};
        },
        async getBankList() {
            const res = await http.get('/pay/bank/list');
            return res.data || {};
        },
        async getUsdtInfo() {
            const res = await http.get('/pay/us/info');
            return res.data || {};
        }
    }
};

// ===================================
// 向后兼容：导出多种接口
// ===================================

// 1. 统一 httpClient（推荐使用）
window.httpClient = {
    async get(path, params = {}) {
        const res = await http.get(path, params);
        // 自动标准化字段
        return FieldNormalizer.normalizeResponse(res).data || res.data || res;
    },
    async post(path, data = {}) {
        const res = await http.post(path, data);
        return FieldNormalizer.normalizeResponse(res).data || res.data || res;
    }
};

// 2. ApiService（推荐使用）
window.ApiService = ApiService;

// 3. APIClient（兼容旧代码）
window.APIClient = class {
    constructor() {
        this.http = http;
        this.api = ApiService;
    }
    async get(url, params) {
        const res = await http.get(url, params);
        return FieldNormalizer.normalizeResponse(res);
    }
    async post(url, data) {
        const res = await http.post(url, data);
        return FieldNormalizer.normalizeResponse(res);
    }
};

// 4. TokenManager 兼容
if (!window.TokenManager) {
    window.TokenManager = TokenService;
}

// 5. 全局 Token 函数（兼容旧代码）
window.getToken = () => TokenService.getToken();
window.setToken = (token) => TokenService.setToken(token);
window.removeToken = () => TokenService.removeToken();

// ===================================
// 启动日志
// ===================================
if (API_CONFIG.debug) {
    console.log('[网络层] 统一HTTP客户端已初始化');
    console.log('[网络层] Token服务已初始化');
    console.log('[网络层] 字段标准化器已初始化');
}
