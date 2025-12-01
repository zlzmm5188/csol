/**
 * Providence OpenAI API 集成模块
 * 版本: 1.0
 * 创建时间: 2025-11-17
 * 功能: 集成OpenAI GPT模型，处理复杂对话和智能推荐
 */

const AI_OPENAI = {
    version: '1.0',
    name: 'Providence OpenAI Integration',

    // 配置
    config: {
        apiKey: '', // 从 AI_CONFIG.openai_api_key 读取
        apiBase: 'https://api.openai.com/v1',
        model: 'gpt-3.5-turbo', // 可选: gpt-4, gpt-4-turbo
        maxTokens: 800,
        temperature: 0.7,
        timeout: 30000,
        enableCache: true, // 启用缓存相似问题
        cacheDuration: 3600000 // 1小时
    },

    // 响应缓存
    responseCache: new Map(),

    // 对话历史（用于上下文）
    conversationHistory: [],

    /**
     * 初始化配置
     */
    init(apiKey, options = {}) {
        this.config.apiKey = apiKey;
        if (options.model) this.config.model = options.model;
        if (options.maxTokens) this.config.maxTokens = options.maxTokens;
        if (options.temperature !== undefined) this.config.temperature = options.temperature;

        console.log(`🤖 OpenAI模块已初始化 - 模型: ${this.config.model}`);
    },

    /**
     * 检查API密钥
     */
    isConfigured() {
        return !!this.config.apiKey && this.config.apiKey.startsWith('sk-');
    },

    /**
     * 构建系统提示词（定义AI角色和行为）
     */
    buildSystemPrompt(userData) {
        const userName = userData?.realname || userData?.username || '用户';
        const vipLevel = userData?.level || 1;
        const balance = parseFloat(userData?.money || 0);

        return `你是Providence金融平台的AI智能顾问，名字叫"Providence AI"。

【你的角色】
- 一个专业、友好、有人情味的金融顾问，像朋友一样和用户交流
- 精通投资理财、基金、股票、债券、IPO等金融知识
- 熟悉Providence平台的所有功能和产品
- 说话自然、亲切，不要太机械化，像真人对话一样

【用户信息】
- 姓名: ${userName}
- VIP等级: VIP${vipLevel}
- 账户余额: ¥${balance.toLocaleString('zh-CN', {minimumFractionDigits: 2})}

【你的说话风格】
1. 语气要自然、亲切，像朋友聊天一样，不要太正式或机械化
2. 可以用"呢"、"哦"、"呀"、"~"等语气词，让对话更轻松
3. 根据用户情况给出个性化的回复（比如余额多就夸一下，余额少就鼓励一下）
4. 适当使用表情符号，但不要过度（每段1-2个即可）
5. 回复要简洁，一般不超过150字，除非用户要求详细解释
6. 涉及金额使用"¥"符号和千分位格式
7. 对于投资建议，必须提示风险，但语气要温和
8. 当不确定时，诚实地说"这个我不太确定"，然后建议联系客服
9. 多用"您"称呼用户，显得尊重
10. 可以适当用"哈哈"、"嗯"、"哦"等口语化表达，让对话更自然

【平台功能】
- 充值/提现：支持银行卡、支付宝、USDT
- 投资项目：基金、股票、IPO、国债等
- VIP等级：VIP1-VIP8，等级越高加息越多
- 团队推广：邀请好友获得5%佣金
- 日利宝：随存随取的活期理财
- 实名认证：KYC认证，人脸识别

【回复格式要求】
- 使用HTML标签格式化重要信息（<strong>、<br>等）
- 数字使用<span style="color:#f04134">红色</span>或<span style="color:#25d0a6">绿色</span>高亮
- 列表使用 • 符号
- 重要提示使用 💡 图标

【禁止事项】
- 不要承诺具体收益率
- 不要推荐不存在的产品
- 不要泄露其他用户信息
- 不要讨论政治敏感话题`;
    },

    /**
     * 构建用户上下文信息
     */
    buildContextInfo(userData) {
        if (!userData) {
            return '用户未登录';
        }

        const balance = parseFloat(userData.money || 0);
        const ribao = parseFloat(userData.ribao || 0);
        const totalProfit = parseFloat(userData.tfund || 0);
        const level = parseInt(userData.level || 1);
        const teamCount = parseInt(userData.team_count || 0);

        return `
【用户资产概况】
- 账户余额: ¥${balance.toFixed(2)}

- 日利宝: ¥${ribao.toFixed(2)}

- 累计收益: ¥${totalProfit.toFixed(2)}

- VIP等级: VIP${level}

- 团队人数: ${teamCount}人

根据以上信息，智能分析用户需求并提供个性化建议。`;
    },

    /**
     * 调用OpenAI API
     */
    async callOpenAI(userMessage, userData = null) {
        if (!this.isConfigured()) {
            throw new Error('OpenAI API密钥未配置');
        }

        // 检查缓存
        if (this.config.enableCache) {
            const cacheKey = this.getCacheKey(userMessage);
            const cached = this.getFromCache(cacheKey);
            if (cached) {
// console.log('🎯 从缓存返回OpenAI响应'); // 性能优化：已注释
                return cached;
            }
        }

        // 构建消息
        const messages = [
            {
                role: 'system',
                content: this.buildSystemPrompt(userData)
            }
        ];

        // 添加用户上下文
        if (userData) {
            messages.push({
                role: 'system',
                content: this.buildContextInfo(userData)
            });
        }

        // 添加对话历史（最近3轮）
        const recentHistory = this.conversationHistory.slice(-3);
        recentHistory.forEach(item => {
            messages.push({ role: 'user', content: item.user });
            messages.push({ role: 'assistant', content: item.assistant });
        });

        // 添加当前问题
        messages.push({
            role: 'user',
            content: userMessage
        });

        // console.log('📤 发送到OpenAI:', {
        //     model: this.config.model,
        //     messageCount: messages.length,
        //     userMessage: userMessage.substring(0, 50)
        // });

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

            const response = await fetch(`/${this.config.apiBase}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify({
                    model: this.config.model,
                    messages: messages,
                    max_tokens: this.config.maxTokens,
                    temperature: this.config.temperature,
                    top_p: 1,
                    frequency_penalty: 0.3,
                    presence_penalty: 0.3
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`OpenAI API错误: ${response.status} - ${errorData.error?.message || '未知错误'}`);
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content;

            // 性能优化：已注释
            // console.log('📥 OpenAI响应成功:', {
            //     tokens: data.usage?.total_tokens || 0,
            //     responseLength: aiResponse.length
            // });

            // 保存到历史
            this.conversationHistory.push({
                user: userMessage,
                assistant: aiResponse,
                timestamp: Date.now()
            });

            // 限制历史长度
            if (this.conversationHistory.length > 10) {
                this.conversationHistory.shift();
            }

            // 缓存响应
            if (this.config.enableCache) {
                const cacheKey = this.getCacheKey(userMessage);
                this.saveToCache(cacheKey, aiResponse);
            }

            return aiResponse;

        } catch (error) {
            console.error('❌ OpenAI调用失败:', error);

            if (error.name === 'AbortError') {
                throw new Error('请求超时，请稍后重试');
            }

            throw error;
        }
    },

    /**
     * 生成缓存键
     */
    getCacheKey(message) {
        return message.toLowerCase().trim().replace(/\s+/g, ' ');
    },

    /**
     * 从缓存获取
     */
    getFromCache(key) {
        const cached = this.responseCache.get(key);
        if (!cached) return null;

        // 检查是否过期
        if (Date.now() - cached.timestamp > this.config.cacheDuration) {
            this.responseCache.delete(key);
            return null;
        }

        return cached.response;
    },

    /**
     * 保存到缓存
     */
    saveToCache(key, response) {
        this.responseCache.set(key, {
            response: response,
            timestamp: Date.now()
        });

        // 限制缓存大小
        if (this.responseCache.size > 100) {
            const firstKey = this.responseCache.keys().next().value;
            this.responseCache.delete(firstKey);
        }
    },

    /**
     * 智能分析用户问题类型
     */
    analyzeQuestionType(message) {
        const msg = message.toLowerCase();

        // 简单查询类（可以用规则引擎）
        if (msg.match(/^(余额|账户|资产|vip|团队|投资|收益)$/)) {
            return { type: 'simple_query', confidence: 0.95 };
        }

        // 操作引导类（可以用规则引擎）
        if (msg.match(/^(充值|提现|购买|申购)$/)) {
            return { type: 'simple_action', confidence: 0.95 };
        }

        // 复杂咨询类（需要OpenAI）
        if (msg.match(/为什么|怎么办|如何选择|推荐.*理由|分析|对比|建议/)) {
            return { type: 'complex_query', confidence: 0.9 };
        }

        // 开放式对话（需要OpenAI）
        if (msg.length > 30 || msg.includes('？') || msg.includes('、')) {
            return { type: 'open_conversation', confidence: 0.85 };
        }

        // 默认为中等复杂度
        return { type: 'medium_query', confidence: 0.7 };
    },

    /**
     * 流式响应（可选功能）
     */
    async streamResponse(userMessage, userData = null, onChunk) {
        if (!this.isConfigured()) {
            throw new Error('OpenAI API密钥未配置');
        }

        const messages = [
            {
                role: 'system',
                content: this.buildSystemPrompt(userData)
            },
            {
                role: 'user',
                content: userMessage
            }
        ];

        try {
            const response = await fetch(`${this.config.apiBase}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify({
                    model: this.config.model,
                    messages: messages,
                    max_tokens: this.config.maxTokens,
                    temperature: this.config.temperature,
                    stream: true
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API错误: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.substring(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices[0]?.delta?.content || '';
                            if (content) {
                                fullResponse += content;
                                onChunk(content);
                            }
                        } catch (e) {
                            console.warn('解析流数据失败:', e);
                        }
                    }
                }
            }

            return fullResponse;

        } catch (error) {
            console.error('❌ OpenAI流式响应失败:', error);
            throw error;
        }
    },

    /**
     * 清除缓存和历史
     */
    clearCache() {
        this.responseCache.clear();
        this.conversationHistory = [];
// console.log('🧹 OpenAI缓存和历史已清除'); // 性能优化：已注释
    },

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            cacheSize: this.responseCache.size,
            historyLength: this.conversationHistory.length,
            model: this.config.model,
            configured: this.isConfigured()
        };
    }
};

// 全局暴露
if (typeof window !== 'undefined') {
    window.AI_OPENAI = AI_OPENAI;
}

// console.log('🤖 Providence OpenAI集成模块已加载 v' + AI_OPENAI.version); // 性能优化：已注释
