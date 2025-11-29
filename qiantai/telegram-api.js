// Providence Telegram Bot通知 API 工具类
// 根据高级功能对接文档 v1.0

(function() {
    if (window.__TELEGRAM_API_JS__) return;
    window.__TELEGRAM_API_JS__ = true;

    console.log('[TelegramAPI] 加载 v1.0');

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

    // Telegram Bot API
    window.TelegramAPI = {
        // 1. 生成绑定验证码
        // POST /api/user/telegram-bind
        async generateBindCode() {
            const result = await apiRequest('/user/telegram-bind', {
                method: 'POST'
            });

            if (result.code === 1) {
                return {
                    bind_code: result.data.bind_code,
                    message: result.data.message,
                    instructions: result.data.instructions || []
                };
            }
            throw new Error(result.msg || '生成验证码失败');
        },

        // 2. 查询绑定状态
        // GET /api/user/telegram-status
        async getBindStatus() {
            const result = await apiRequest('/user/telegram-status');

            if (result.code === 1) {
                return {
                    bound: result.data.bound || false,
                    telegram_username: result.data.telegram_username || null,
                    bind_time: result.data.bind_time || null
                };
            }
            throw new Error(result.msg || '查询绑定状态失败');
        },

        // 3. 解除绑定
        // POST /api/user/telegram-unbind
        async unbind() {
            const result = await apiRequest('/user/telegram-unbind', {
                method: 'POST'
            });

            if (result.code === 1) {
                return true;
            }
            throw new Error(result.msg || '解除绑定失败');
        }
    };

    // Telegram绑定UI组件
    window.TelegramBindUI = class {
        constructor(containerId) {
            this.container = document.getElementById(containerId);
            this.bindCode = null;
            this.checkTimer = null;
            this.init();
        }

        async init() {
            try {
                const result = await TelegramAPI.generateBindCode();
                this.bindCode = result.bind_code;
                this.render(result);
                this.startStatusCheck();
            } catch (error) {
                this.renderError(error.message);
            }
        }

        render(data) {
            this.container.innerHTML = `
                <div class="telegram-bind-container">
                    <div class="telegram-bind-header">
                        <h3>📱 绑定Telegram接收通知</h3>
                    </div>
                    <div class="telegram-bind-code">
                        <p>您的验证码：</p>
                        <h2 class="bind-code-display">${data.bind_code}</h2>
                    </div>
                    <div class="telegram-bind-instructions">
                        <ol>
                            ${data.instructions.map((step, i) => `<li>${step}</li>`).join('')}
                        </ol>
                    </div>
                    <div class="telegram-bind-status">
                        <span class="bind-status-text">等待绑定中...</span>
                        <div class="bind-loading"></div>
                    </div>
                    <button class="telegram-bind-cancel" onclick="window.__telegramBindInstance?.cancel()">取消</button>
                </div>
            `;

            window.__telegramBindInstance = this;
        }

        renderError(message) {
            this.container.innerHTML = `
                <div class="telegram-bind-error">
                    <p>❌ ${message}</p>
                    <button onclick="location.reload()">重试</button>
                </div>
            `;
        }

        async startStatusCheck() {
            this.checkTimer = setInterval(async () => {
                try {
                    const status = await TelegramAPI.getBindStatus();
                    if (status.bound) {
                        clearInterval(this.checkTimer);
                        this.renderSuccess(status);
                    }
                } catch (error) {
                    console.error('[Telegram] 检查绑定状态失败:', error);
                }
            }, 3000); // 每3秒检查一次
        }

        renderSuccess(status) {
            this.container.innerHTML = `
                <div class="telegram-bind-success">
                    <h3>✅ 绑定成功！</h3>
                    <p>Telegram账号：${status.telegram_username || '已绑定'}</p>
                    <p>绑定时间：${status.bind_time || '刚刚'}</p>
                    <button onclick="window.__telegramBindInstance?.close()">关闭</button>
                </div>
            `;
        }

        cancel() {
            if (this.checkTimer) {
                clearInterval(this.checkTimer);
            }
            this.container.innerHTML = '';
        }

        close() {
            this.cancel();
        }
    };

    console.log('[TelegramAPI] 初始化完成');
})();
