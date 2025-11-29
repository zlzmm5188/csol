// Providence 项目投资 API 工具类
// 根据API文档完整对接

(function() {
    if (window.__PROJECT_API_JS__) return;
    window.__PROJECT_API_JS__ = true;

    console.log('[ProjectAPI] 加载 v1.0');

    const API_BASE = 'https://api.4kp3l0iq.top';

    // 通用API请求函数
    async function apiRequest(endpoint, options = {}) {
        const token = localStorage.getItem('providence_token') || '';
        
        if (!token && !options.skipAuth) {
            throw new Error('未登录');
        }

        const url = API_BASE + endpoint;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        console.log('[ProjectAPI] 请求:', endpoint, options.method || 'GET');

        const response = await fetch(url, {
            ...options,
            headers
        });

        const result = await response.json();
        console.log('[ProjectAPI] 响应:', result);

        // 统一使用 code === 1 判断成功
        if (result.code === 401) {
            localStorage.clear();
            window.location.href = 'login.html';
            throw new Error('登录已过期');
        }

        return result;
    }

    // 项目投资API
    window.ProjectAPI = {
        // 1. 获取项目列表
        // GET /fund/api/project/list
        async getProjectList() {
            const result = await apiRequest('/fund/api/project/list');
            if (result.code === 1) {
                return result.data.list || [];
            }
            throw new Error(result.msg || '获取项目列表失败');
        },

        // 2. 获取项目详情
        // GET /fund/api/project/detail?id={project_id}
        async getProjectDetail(projectId) {
            const result = await apiRequest(`/fund/api/project/detail?id=${projectId}`);
            if (result.code === 1) {
                return result.data;
            }
            throw new Error(result.msg || '获取项目详情失败');
        },

        // 3. 投资项目
        // POST /fund/api/project/add
        async investProject(projectId, amount, currency = 'CNY') {
            const requestId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            const result = await apiRequest('/fund/api/project/add', {
                method: 'POST',
                body: JSON.stringify({
                    project_id: projectId,
                    amount: amount,
                    currency: currency,
                    request_id: requestId
                })
            });

            if (result.code === 1) {
                return result.data;
            }
            throw new Error(result.msg || '投资失败');
        },

        // 4. 我的投资订单
        // GET /invest/orders?page=1&page_size=20
        async getMyInvestments(page = 1, pageSize = 20) {
            const result = await apiRequest(`/invest/orders?page=${page}&page_size=${pageSize}`);
            if (result.code === 1) {
                return {
                    list: result.data.list || [],
                    total: result.data.total || 0,
                    page: result.data.page || 1,
                    pageSize: result.data.page_size || pageSize
                };
            }
            throw new Error(result.msg || '获取投资订单失败');
        },

        // 格式化金额
        formatMoney(value, decimals = 2) {
            return Number(value || 0).toLocaleString('zh-CN', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
        },

        // 格式化日期
        formatDate(dateStr) {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        },

        // 订单状态文本
        getStatusText(status) {
            const statusMap = {
                'RUNNING': '进行中',
                'COMPLETED': '已完成',
                'CANCELLED': '已取消'
            };
            return statusMap[status] || status;
        }
    };

    console.log('[ProjectAPI] 初始化完成');
})();
