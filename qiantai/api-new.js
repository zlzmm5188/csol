// =============================================
// Providence 新后端API对接配置
// 版本: 4.0-NEW-BACKEND
// 日期: 2025-11-22
// 说明: 对接全新后端系统，遵循FRONTEND_API_GUIDE.md规范
// =============================================

// ===================================
// API配置（需要根据实际环境调整）
// ===================================
// 只有在API_CONFIG未定义时才设置默认值，避免覆盖本地配置
if (!window.API_CONFIG || !window.API_CONFIG.baseURL) {
    window.API_CONFIG = {
        // ⚠️ 开发环境：本地PHP后端（ThinkPHP路由无需 /v1）
        // baseURL: 'http://localhost:8888/api',

        // 🚀 生产环境（72.60.196.188服务器）
        baseURL: 'https://api.4kp3l0iq.top',

        // 管理后台地址
        adminURL: 'https://admin.4kp3l0iq.top',

        // Token存储键名
        tokenKey: 'providence_token',

        // 请求超时时间（毫秒）
        timeout: 30000,

        // 调试模式
        debug: false  // ✅ 生产环境已关闭
    };
}

// ===================================
// Token管理服务
// ===================================
const TokenService = {
    /**
     * 获取Token
     */
    getToken() {
        try {
            return localStorage.getItem(API_CONFIG.tokenKey) || '';
        } catch (err) {
            console.error('[Token] 获取失败:', err);
            return '';
        }
    },

    /**
     * 保存Token
     */
    setToken(token) {
        try {
            if (!token) {
                console.warn('[Token] 尝试保存空Token');
                return false;
            }
            localStorage.setItem(API_CONFIG.tokenKey, token);
            if (API_CONFIG.debug) {
                // console.log('[Token] 保存成功'); // 性能优化：已注释
            }
            return true;
        } catch (err) {
            console.error('[Token] 保存失败:', err);
            return false;
        }
    },

    /**
     * 删除Token
     */
    removeToken() {
        try {
            localStorage.removeItem(API_CONFIG.tokenKey);
            if (API_CONFIG.debug) {
                // console.log('[Token] 已删除'); // 性能优化：已注释
            }
        } catch (err) {
            console.error('[Token] 删除失败:', err);
        }
    },

    /**
     * 检查是否已登录
     */
    checkLogin() {
        return !!this.getToken();
    },

    /**
     * 要求登录（未登录则跳转）
     */
    requireLogin(redirectUrl = '/login.html') {
        if (!this.checkLogin()) {
            console.warn('[Auth] 未登录，跳转到登录页');
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }
};

// ===================================
// HTTP客户端（统一请求封装）
// ===================================
class HttpClient {
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

        // 添加Token认证
        const token = TokenService.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
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
            // 确保path以/开头
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

        // POST/PUT/PATCH请求添加body
        if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
            requestOptions.body = JSON.stringify(data);
        }

        try {
            if (this.debug) {
                // console.log(`[HTTP ${method.toUpperCase()}]`, url); // 性能优化：已注释
                // if (data) console.log('[HTTP Data]', data); // 性能优化：已注释
            }

            const response = await fetch(url, requestOptions);
            const text = await response.text();

            // 解析JSON
            let result;
            try {
                result = text ? JSON.parse(text) : {};
            } catch (err) {
                console.error('[HTTP] JSON解析失败:', text.substring(0, 200));
                throw new Error('响应格式错误');
            }

            if (this.debug) {
                // console.log(`[HTTP Response]`, result); // 性能优化：已注释
            }

            // 处理Token过期（code=-401或401）
            if (result.code === -401 || result.code === 401) {
                const msg = result.msg || result.message || '';
                // 检查是否已经在登录页，避免循环跳转
                if (window.location.pathname.includes('login.html')) {
                    console.warn('[Auth] 已在登录页，不重复跳转');
                    return result;
                }

                // 对于profile页面，先检查token是否真的存在（可能是读取时机问题）
                if (window.location.pathname.includes('profile.html')) {
                    const currentToken = localStorage.getItem('providence_token') || sessionStorage.getItem('providence_token') || '';
                    if (currentToken) {
                        console.warn('[Auth] Profile页面返回401，但Token存在，可能是读取时机问题，不立即跳转');
                        // 不立即跳转，让profile.js自己处理
                        return result;
                    }
                }

                console.warn('[Auth] Token过期或无效，清除Token并跳转登录页');
                TokenService.removeToken();

                // 延迟跳转，避免多个请求同时触发跳转
                setTimeout(() => {
                    const redirectUrl = encodeURIComponent(window.location.href);
                    window.location.href = `/login.html?redirect=${redirectUrl}`;
                }, 100);

                throw new Error(msg || '登录已过期，请重新登录');
            }

            // 统一响应格式
            return {
                code: result.code,
                msg: result.msg || result.message || '',
                data: result.data || null,
                // 方便链式调用
                ok: result.code === 1,
                error: result.code !== 1 ? (result.msg || '请求失败') : null
            };

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('请求超时，请检查网络');
            }
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * GET请求
     */
    async get(path, params = {}) {
        // 确保path以/开头，但不包含重复的/api
        let cleanPath = path.startsWith('/') ? path : '/' + path;
        // 如果baseURL已经包含/api，且path也以/api开头，则去掉path中的/api
        if (this.baseURL.includes('/api') && cleanPath.startsWith('/api/')) {
            cleanPath = cleanPath.substring(4); // 去掉 '/api'
        }
        const query = new URLSearchParams(params).toString();
        const fullPath = query ? `${cleanPath}?${query}` : cleanPath;
        return this.request('GET', fullPath);
    }

    /**
     * POST请求
     */
    async post(path, data = {}) {
        return this.request('POST', path, data);
    }

    /**
     * PUT请求
     */
    async put(path, data = {}) {
        return this.request('PUT', path, data);
    }

    /**
     * DELETE请求
     */
    async delete(path) {
        return this.request('DELETE', path);
    }
}

// ===================================
// 创建HTTP客户端实例
// ===================================
const http = new HttpClient(API_CONFIG);

// ===================================
// 用户模块API
// ===================================
const UserAPI = {
    /**
     * 用户注册
     */
    async register(data) {
        return await http.post('/auth/register', {
            username: data.username,
            password: data.password,
            invite_code: data.invite_code || undefined
        });
    },

    /**
     * 用户登录
     */
    async login(data) {
        return await http.post('/auth/login', {
            username: data.username,
            password: data.password
        });
    },

    /**
     * 获取用户信息
     */
    async getInfo() {
        return await http.get('/api/user/index');  // ✅ 正确接口
    },

    /**
     * 修改密码
     */
    async changePassword(data) {
        return await http.post('/user/change-password', {
            old_password: data.old_password,
            new_password: data.new_password
        });
    },

    /**
     * 找回密码（步骤1：提交人脸）
     */
    async forgotPassword(data) {
        return await http.post('/user/forgot-password', {
            username: data.username,
            face_image: data.face_image
        });
    },

    /**
     * 找回密码（步骤2：重置密码）
     */
    async resetPassword(data) {
        return await http.post('/user/reset-password', {
            reset_token: data.reset_token,
            new_password: data.new_password
        });
    }
};

// ===================================
// 实名认证和绑卡API
// ===================================
const KYCAPI = {
    /**
     * 提交实名认证
     */
    async submitKYC(data) {
        return await http.post('/user/kyc/submit', {
            realname: data.realname,
            id_card: data.id_card,
            id_card_front: data.id_card_front,
            id_card_back: data.id_card_back,
            id_card_hand: data.id_card_hand
        });
    },

    /**
     * 绑定银行卡
     */
    async bindBankCard(data) {
        return await http.post('/user/bind-bank-card', {
            bank_name: data.bank_name,
            card_number: data.card_number,
            card_holder: data.card_holder
        });
    },

    /**
     * 绑定USDT地址
     */
    async bindUSDT(data) {
        return await http.post('/user/bind-usdt-address', {
            address: data.address,
            network: data.network  // TRC20/ERC20
        });
    }
};

// ===================================
// 项目投资API
// ===================================
const ProjectAPI = {
    /**
     * 获取项目列表
     */
    async getList(params = {}) {
        return await http.get('/projects', {
            category_id: params.category_id,
            page: params.page || 1,
            pageSize: params.pageSize || 20
        });
    },

    /**
     * 获取项目分类
     */
    async getCategories() {
        return await http.get('/projects/categories');
    },

    /**
     * 获取项目详情
     */
    async getDetail(id) {
        return await http.get(`/projects/${id}`);
    },

    /**
     * 投资项目
     */
    async invest(projectId, data) {
        return await http.post(`/projects/${projectId}/invest`, {
            amount: data.amount,
            currency: data.currency,  // CNY 或 USDT
            use_trial_fund: data.use_trial_fund || false
        });
    },

    /**
     * 我的投资记录
     */
    async getMyInvestments(params = {}) {
        return await http.get('/orders/my-investments', {
            status: params.status,  // 0=进行中 1=已完成 -1=已退出
            page: params.page || 1,
            pageSize: params.pageSize || 20
        });
    },

    /**
     * 收益记录
     */
    async getEarnings(params = {}) {
        return await http.get('/orders/earnings', {
            page: params.page || 1,
            pageSize: params.pageSize || 20
        });
    }
};

// ===================================
// 财务API
// ===================================
const FinanceAPI = {
    /**
     * 充值申请
     */
    async recharge(data) {
        return await http.post('/api/finance/recharge', {
            amount: data.amount,
            currency: data.currency,  // CNY 或 USDT
            payment_method: data.payment_method,  // bank/alipay/wechat/usdt
            payment_proof: data.payment_proof,
            remark: data.remark
        });
    },

    /**
     * 提现申请
     */
    async withdraw(data) {
        return await http.post('/api/finance/withdraw', {
            amount: data.amount,
            currency: data.currency,  // CNY 或 USDT
            withdraw_account: data.withdraw_account,
            withdraw_name: data.withdraw_name
        });
    },

    /**
     * 充值记录
     */
    async getRechargeList(params = {}) {
        return await http.get('/api/finance/api/recharge/list', {
            status: params.status,  // 0=待审核 1=已通过 -1=已拒绝
            page: params.page || 1,
            pageSize: params.pageSize || 20
        });
    },

    /**
     * 提现记录
     */
    async getWithdrawList(params = {}) {
        return await http.get('/api/finance/api/withdraw/list', {
            status: params.status,  // 0=待审核 1=通过 2=处理中 3=完成 -1=拒绝
            page: params.page || 1,
            pageSize: params.pageSize || 20
        });
    },

    /**
     * 钱包流水
     */
    async getWalletLogs(params = {}) {
        return await http.get('/api/finance/wallet-logs', {
            currency: params.currency,  // CNY 或 USDT
            type: params.type,  // recharge/api/withdraw/invest/earnings/referral
            page: params.page || 1,
            pageSize: params.pageSize || 20
        });
    }
};

// ===================================
// 体验金API
// ===================================
const TrialFundAPI = {
    /**
     * 领取体验金
     */
    async claim() {
        return await http.post('/trial-fund/claim');
    },

    /**
     * 查看体验金状态
     */
    async getStatus() {
        return await http.get('/trial-fund/status');
    },

    /**
     * 体验金投资记录
     */
    async getOrders() {
        return await http.get('/trial-fund/orders');
    }
};

// ===================================
// 团队API
// ===================================
const TeamAPI = {
    /**
     * 我的团队信息
     */
    async getInfo() {
        return await http.get('/team/info');
    },

    /**
     * 团队成员列表
     */
    async getMembers(params = {}) {
        return await http.get('/team/members', {
            level: params.level,  // 1=一级 2=二级
            page: params.page || 1,
            pageSize: params.pageSize || 20
        });
    },

    /**
     * 推荐返利记录
     */
    async getReferralRewards(params = {}) {
        return await http.get('/team/referral-rewards', {
            page: params.page || 1,
            pageSize: params.pageSize || 20
        });
    },

    /**
     * 团队奖励记录
     */
    async getRewards(params = {}) {
        return await http.get('/team/rewards', {
            page: params.page || 1,
            pageSize: params.pageSize || 20
        });
    }
};

// ===================================
// 内容API
// ===================================
const ContentAPI = {
    /**
     * 获取公告列表
     */
    async getAnnouncements(params = {}) {
        return await http.get('/announcements', {
            page: params.page || 1,
            pageSize: params.pageSize || 20
        });
    },

    /**
     * 获取活动弹窗
     */
    async getPopup() {
        return await http.get('/activities/popup');
    },

    /**
     * 参与活动
     */
    async participateActivity(activityId) {
        return await http.post(`/activities/${activityId}/participate`);
    }
};

// ===================================
// 统一API服务（向外暴露）
// ===================================
window.API = {
    // Token管理
    token: TokenService,

    // 各模块API
    user: UserAPI,
    kyc: KYCAPI,
    project: ProjectAPI,
    finance: FinanceAPI,
    trial: TrialFundAPI,
    team: TeamAPI,
    content: ContentAPI,

    // 通用HTTP客户端（高级用法）
    http: http
};

// ===================================
// 向后兼容（保留旧接口）
// ===================================
window.TokenManager = TokenService;
window.getToken = () => TokenService.getToken();
window.setToken = (token) => TokenService.setToken(token);
window.removeToken = () => TokenService.removeToken();

// ===================================
// 工具函数
// ===================================
window.APIHelper = {
    /**
     * 统一错误处理
     */
    async handleRequest(apiCall, options = {}) {
        try {
            const res = await apiCall();

            if (res.ok) {
                // 成功
                if (options.onSuccess) {
                    options.onSuccess(res.data);
                }
                return res.data;
            } else {
                // 失败
                const errorMsg = res.msg || '操作失败';
                if (options.onError) {
                    options.onError(errorMsg);
                } else if (window.showToast) {
                    window.showToast('提示', errorMsg);
                } else {
                    alert(errorMsg);
                }
                return null;
            }
        } catch (error) {
            const errorMsg = error.message || '网络异常，请稍后重试';
            if (options.onError) {
                options.onError(errorMsg);
            } else if (window.showToast) {
                window.showToast('错误', errorMsg);
            } else {
                alert(errorMsg);
            }
            return null;
        }
    },

    /**
     * 格式化金额
     */
    formatMoney(amount, decimals = 2) {
        if (amount === null || amount === undefined) return '0.00';
        return Number(amount).toLocaleString('zh-CN', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    },

    /**
     * 获取币种颜色
     */
    getCurrencyColor(currency) {
        return currency === 'USDT' ? '#26A17B' : '#E8D4A2';
    }
};

// ===================================
// 初始化日志
// ===================================
if (API_CONFIG.debug) {
    console.log('[API] 新后端API已初始化');
    // console.log('[API] Base URL:', API_CONFIG.baseURL); // 性能优化：已注释
    // console.log('[API] Token状态:', TokenService.checkLogin() ? '已登录' : '未登录'); // 性能优化：已注释
}
