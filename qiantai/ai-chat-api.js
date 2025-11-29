// Providence AI智能客服 API 工具类
// 根据高级功能对接文档 v1.0

(function() {
    if (window.__AI_CHAT_API_JS__) return;
    window.__AI_CHAT_API_JS__ = true;

    console.log('[AIChatAPI] 加载 v1.0');

    const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';

    async function apiRequest(endpoint, options = {}) {
        const token = window.TokenManager?.getToken() || localStorage.getItem('providence_token') || '';
        if (!token) throw new Error('未登录');

        const url = API_BASE + endpoint;
        const headers = {
            'Content-Type': 'application/json',
            'Token': token,
            ...options.headers
        };

        try {
            const response = await fetch(url, { ...options, headers });
            const result = await response.json();

            if (result.code === 401 || result.code === -1 && result.msg && result.msg.includes('登录')) {
                localStorage.clear();
                window.location.href = 'login.html';
                throw new Error('登录已过期');
            }

            return result;
        } catch (error) {
            console.error('[AIChatAPI] 请求失败:', error);
            throw error;
        }
    }

    // AI客服API
    window.AIChatAPI = {
        // 1. 发送消息
        // POST /api/ai/chat
        async sendMessage(message, context = []) {
            const result = await apiRequest('/ai/chat', {
                method: 'POST',
                body: JSON.stringify({
                    message: message,
                    context: context
                })
            });

            if (result.code === 1) {
                return {
                    reply: result.data.response || result.data.reply || '',
                    session_id: result.data.session_id || null,
                    intent: result.data.intent || {},
                    suggestions: result.data.suggestions || [],
                    data: result.data.data || null
                };
            }
            throw new Error(result.msg || '发送消息失败');
        },

        // 2. 关闭会话
        // POST /api/user/ai-chat-close
        async closeSession(sessionId) {
            if (!sessionId) return;

            const result = await apiRequest('/user/ai-chat-close', {
                method: 'POST',
                body: JSON.stringify({ session_id: sessionId })
            });

            if (result.code === 1) {
                return true;
            }
            throw new Error(result.msg || '关闭会话失败');
        }
    };

    // AI客服UI组件类
    window.AICustomerService = class {
        constructor(containerId) {
            this.container = document.getElementById(containerId);
            this.sessionId = null;
            this.messages = [];
            this.isOpen = false;
            this.init();
        }

        init() {
            if (!this.container) {
                console.error('[AIChat] 容器不存在:', containerId);
                return;
            }

            this.container.innerHTML = `
                <div class="ai-chat-window">
                    <div class="ai-chat-header">
                        <h3>🤖 AI客服</h3>
                        <button class="ai-chat-close" onclick="window.__aiChatInstance?.close()">×</button>
                    </div>
                    <div class="ai-chat-messages" id="ai-chat-messages"></div>
                    <div class="ai-chat-input-area">
                        <input type="text" id="ai-chat-input" placeholder="输入您的问题..." />
                        <button id="ai-chat-send">发送</button>
                    </div>
                </div>
            `;

            // 绑定事件
            document.getElementById('ai-chat-send').onclick = () => this.sendMessage();
            document.getElementById('ai-chat-input').onkeypress = (e) => {
                if (e.key === 'Enter') this.sendMessage();
            };

            window.__aiChatInstance = this;
        }

        async sendMessage() {
            const input = document.getElementById('ai-chat-input');
            const message = input.value.trim();
            if (!message) return;

            // 添加用户消息
            this.addMessage('user', message);
            input.value = '';

            // 显示加载状态
            const loadingId = this.addMessage('assistant', '🤔 正在思考...', true);

            try {
                // 获取对话上下文（最近5条消息）
                const recentMessages = this.messages.slice(-5).map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));

                const result = await AIChatAPI.sendMessage(message, recentMessages);
                this.sessionId = result.session_id;

                // 移除加载消息，添加AI回复
                this.removeMessage(loadingId);

                // 格式化回复（支持换行）
                const formattedReply = result.reply.replace(/\n/g, '<br>');
                this.addMessage('assistant', formattedReply, false, true);

                // 如果有建议操作，显示快捷按钮
                if (result.suggestions && result.suggestions.length > 0) {
                    this.showSuggestions(result.suggestions);
                }
            } catch (error) {
                this.removeMessage(loadingId);
                this.addMessage('system', '❌ 服务异常，请稍后重试');
                console.error('[AIChat] 发送消息失败:', error);
                if (typeof showToast === 'function') {
                    showToast('', error.message || '发送消息失败');
                }
            }
        }

        /**
         * 显示建议操作按钮
         */
        showSuggestions(suggestions) {
            const messagesContainer = document.getElementById('ai-chat-messages');
            const suggestionDiv = document.createElement('div');
            suggestionDiv.className = 'ai-chat-suggestions';

            suggestions.forEach(suggestion => {
                const btn = document.createElement('button');
                btn.className = 'ai-chat-suggestion-btn';
                btn.textContent = suggestion;
                btn.onclick = () => {
                    document.getElementById('ai-chat-input').value = suggestion;
                    this.sendMessage();
                };
                suggestionDiv.appendChild(btn);
            });

            messagesContainer.appendChild(suggestionDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        addMessage(role, content, isLoading = false, isHtml = false) {
            const messagesContainer = document.getElementById('ai-chat-messages');
            const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

            const messageDiv = document.createElement('div');
            messageDiv.id = messageId;
            messageDiv.className = `ai-chat-message ai-chat-${role}`;
            if (isLoading) messageDiv.classList.add('ai-chat-loading');

            if (isHtml) {
                messageDiv.innerHTML = content;
            } else {
                messageDiv.textContent = content;
            }

            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            this.messages.push({ id: messageId, role, content });
            return messageId;
        }

        removeMessage(messageId) {
            const message = document.getElementById(messageId);
            if (message) message.remove();
        }

        async close() {
            if (this.sessionId) {
                try {
                    await AIChatAPI.closeSession(this.sessionId);
                } catch (error) {
                    console.error('[AIChat] 关闭会话失败:', error);
                }
            }
            this.container.innerHTML = '';
            this.isOpen = false;
        }

        open() {
            if (!this.isOpen) {
                this.init();
                this.isOpen = true;
            }
            this.container.style.display = 'block';
        }
    };

    console.log('[AIChatAPI] 初始化完成');
})();
