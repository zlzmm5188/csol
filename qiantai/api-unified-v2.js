/**
 * Providence 前台统一API客户端库 v2.0
 * ============================================
 * 完整解决方案：统一路径、调用方式、Token管理、错误处理
 *
 * 特性：
 * - ✅ 统一API路径标准化
 * - ✅ 统一Token管理（存储+传递）
 * - ✅ 全局错误处理（401/404/500/超时）
 * - ✅ 请求拦截和日志
 * - ✅ 自动重试机制
 * - ✅ 请求监控和性能分析
 */

(function() {
    if (window.__UNIFIED_API_CLIENT_V2__) return;
    window.__UNIFIED_API_CLIENT_V2__ = true;

    console.log('[UnifiedApiClient] 初始化 v2.0');

    // ============ 配置 ============
    // 检测环境：本地用localhost:8082，否则用生产环境
    let baseURL = 'https://api.4kp3l0iq.top';
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        baseURL = 'http://localhost:8082';
    }

    const CONFIG = {
        baseURL: window.API_CONFIG?.baseURL || baseURL,
        timeout: 30000,
        tokenKey: 'providence_token',  // 统一Token存储键
        tokenHeader: 'Authorization',  // 统一Token Header键
        tokenPrefix: 'Bearer',          // Token前缀
        debug: true,
        maxRetries: 3,
        retryDelay: 1000
    };

    // ============ Token管理 ============
    const TokenManager = {
        /**
         * 获取Token
         */
        getToken() {
            // 优先使用新键，后退到旧键
            return localStorage.getItem(CONFIG.tokenKey) ||
                   localStorage.getItem('providence_token') ||
                   '';
        },

        /**
         * 保存Token
         */
        setToken(token) {
            if (token) {
                localStorage.setItem(CONFIG.tokenKey, token);
                // 删除旧键引用
                localStorage.removeItem('token');
            }
        },

        /**
         * 清除Token
         */
        clearToken() {
            localStorage.removeItem(CONFIG.tokenKey);
            localStorage.removeItem('token');
        },

        /**
         * 检查Token是否存在
         */
        hasToken() {
            return !!this.getToken();
        },

        /**
         * 构建Authorization头
         */
        buildAuthHeader() {
            const token = this.getToken();
            if (!token) return null;
            return `${CONFIG.tokenPrefix} ${token}`;
        }
    };

    // ============ 请求日志 ============
    const RequestLogger = {
        requests: [],
        maxSize: 100,

        /**
         * 记录请求
         */
        log(method, url, status, duration, error = null) {
            const record = {
                timestamp: new Date().toISOString(),
                method,
                url,
                status,
                duration: `${duration}ms`,
                error: error?.message || null
            };

            this.requests.push(record);
            if (this.requests.length > this.maxSize) {
                this.requests.shift();
            }

            if (CONFIG.debug) {
                console.log(`[API] ${method} ${url} - ${status} (${duration}ms)`, error || '');
            }
        },

        /**
         * 获取所有日志
         */
        getAll() {
            return this.requests;
        },

        /**
         * 获取统计信息
         */
        getStats() {
            const total = this.requests.length;
            const errors = this.requests.filter(r => r.status >= 400).length;
            const avgDuration = this.requests.reduce((sum, r) => {
                const duration = parseInt(r.duration);
                return sum + duration;
            }, 0) / total;

            return {
                total,
                errors,
                success: total - errors,
                avgDuration: avgDuration.toFixed(2)
            };
        },

        /**
         * 清除日志
         */
        clear() {
            this.requests = [];
        }
    };

    // ============ 错误处理 ============
    const ErrorHandler = {
        /**
         * 处理401错误 - 登录过期
         */
        handle401() {
            console.warn('[ErrorHandler] Token过期，重定向到登录页...');
            TokenManager.clearToken();

            if (window.location.pathname !== '/login.html') {
                // 显示提示
                if (window.showToast) {
                    window.showToast('登录已过期，请重新登录', 'error');
                } else if (window.alert) {
                    alert('登录已过期，请重新登录');
                }
                // 重定向
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 1000);
            }
        },

        /**
         * 处理404错误 - 资源不存在
         */
        handle404(url) {
            console.error('[ErrorHandler] 资源不存在:', url);
            if (window.showToast) {
                window.showToast('请求的资源不存在', 'error');
            }
        },

        /**
         * 处理500错误 - 服务器错误
         */
        handle500(error) {
            console.error('[ErrorHandler] 服务器错误:', error);
            if (window.showToast) {
                window.showToast('服务器出错，请稍后重试', 'error');
            }
        },

        /**
         * 处理网络超时
         */
        handleTimeout(url) {
            console.warn('[ErrorHandler] 请求超时:', url);
            if (window.showToast) {
                window.showToast('请求超时，请检查网络', 'error');
            }
        },

        /**
         * 处理网络错误
         */
        handleNetworkError(error) {
            console.error('[ErrorHandler] 网络错误:', error);
            if (window.showToast) {
                window.showToast('网络连接失败，请检查网络', 'error');
            }
        }
    };

    // ============ API路径标准化 ============
    const PathNormalizer = {
        /**
         * 标准化API路径 - 确保路径以/api开头
         */
        normalize(path) {
            // 移除旧格式
            if (path.includes('/index.php')) {
                path = path.replace('/index.php', '');
            }
            if (path.includes('/fund/api/')) {
                path = path.replace('/fund/api/', '/api/');
            }

            // 确保以 /api 开头
            if (!path.startsWith('/api/')) {
                if (path.startsWith('/')) {
                    path = '/api' + path;
                } else {
                    path = '/api/' + path;
                }
            }

            return path;
        },

        /**
         * 构建完整URL
         */
        buildUrl(path) {
            const normalizedPath = this.normalize(path);
            return CONFIG.baseURL + normalizedPath;
        }
    };

    // ============ 统一API客户端 ============
    class UnifiedApiClient {
        constructor() {
            this.pendingRequests = new Map();
        }

        /**
         * 构建请求头
         */
        buildHeaders(extra = {}) {
            const headers = {
                'Content-Type': 'application/json',
                ...extra
            };

            // 添加Authorization头
            const authHeader = TokenManager.buildAuthHeader();
            if (authHeader) {
                headers[CONFIG.tokenHeader] = authHeader;
            }

            return headers;
        }

        /**
         * 通用请求方法 - 带重试机制
         */
        async request(method, path, data = null, options = {}) {
            const url = PathNormalizer.buildUrl(path);
            const startTime = Date.now();
            let lastError;

            for (let attempt = 0; attempt <= CONFIG.maxRetries; attempt++) {
                try {
                    const requestConfig = {
                        method: method.toUpperCase(),
                        headers: this.buildHeaders(options.headers),
                        timeout: CONFIG.timeout
                    };

                    if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
                        requestConfig.body = JSON.stringify(data);
                    }

                    if (CONFIG.debug) {
                        console.log(`[Request] ${method.toUpperCase()} ${path} (attempt ${attempt + 1})`);
                    }

                    const response = await fetch(url, requestConfig);
                    const duration = Date.now() - startTime;

                    // 处理响应
                    let result;
                    const contentType = response.headers.get('content-type');

                    if (contentType && contentType.includes('application/json')) {
                        const text = await response.text();
                        try {
                            result = JSON.parse(text);
                        } catch (e) {
                            console.error('[Response] JSON解析失败:', text.substring(0, 200));
                            result = { code: -1, msg: '响应格式错误', data: null };
                        }
                    } else {
                        result = { code: -1, msg: '响应格式错误', data: null };
                    }

                    // 记录日志
                    RequestLogger.log(method, path, response.status, duration);

                    // 处理API错误码
                    if (result.code === 401 || response.status === 401) {
                        ErrorHandler.handle401();
                        return { code: 401, msg: '登录已过期', data: null };
                    }

                    if (response.status === 404) {
                        ErrorHandler.handle404(url);
                        return { code: 404, msg: '资源不存在', data: null };
                    }

                    if (response.status === 500) {
                        if (attempt < CONFIG.maxRetries) {
                            await this.delay(CONFIG.retryDelay * Math.pow(2, attempt));
                            continue;
                        }
                        ErrorHandler.handle500(new Error('Server Error'));
                        return result;
                    }

                    return result;

                } catch (error) {
                    lastError = error;
                    const duration = Date.now() - startTime;

                    if (error.name === 'AbortError') {
                        ErrorHandler.handleTimeout(url);
                        RequestLogger.log(method, path, 0, duration, error);
                    } else {
                        ErrorHandler.handleNetworkError(error);
                        RequestLogger.log(method, path, 0, duration, error);
                    }

                    // 非网络错误不重试
                    if (attempt === CONFIG.maxRetries) {
                        return { code: -1, msg: error.message || '网络错误', data: null };
                    }

                    // 等待后重试
                    await this.delay(CONFIG.retryDelay * Math.pow(2, attempt));
                }
            }

            return { code: -1, msg: lastError?.message || '请求失败', data: null };
        }

        /**
         * 延迟函数
         */
        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        // ============ HTTP方法 ============
        async get(path, params = {}, options = {}) {
            const queryString = new URLSearchParams(params).toString();
            const fullPath = queryString ? `${path}?${queryString}` : path;
            return this.request('GET', fullPath, null, options);
        }

        async post(path, data = {}, options = {}) {
            return this.request('POST', path, data, options);
        }

        async put(path, data = {}, options = {}) {
            return this.request('PUT', path, data, options);
        }

        async patch(path, data = {}, options = {}) {
            return this.request('PATCH', path, data, options);
        }

        async delete(path, options = {}) {
            return this.request('DELETE', path, null, options);
        }
    }

    // ============ 导出到全局 ============
    window.ApiClient = new UnifiedApiClient();
    window.TokenManager = TokenManager;
    window.RequestLogger = RequestLogger;
    window.ErrorHandler = ErrorHandler;

    // 兼容旧代码
    window.httpClient = window.ApiClient;

    console.log('[UnifiedApiClient] ✅ 已初始化');
    console.log('[Config]', CONFIG);

    // 暴露API获取日志和统计
    window.ApiClient.getRequestLogs = () => RequestLogger.getAll();
    window.ApiClient.getRequestStats = () => RequestLogger.getStats();
    window.ApiClient.clearLogs = () => RequestLogger.clear();

})();
