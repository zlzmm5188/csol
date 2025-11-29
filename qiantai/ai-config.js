/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Providence AI 配置中心
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 必须最先加载的AI配置文件
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const AI_CONFIG = {
    version: '2.0',
    name: 'Providence AI Assistant',

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // OpenAI 配置
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    openai: {
        apiKey: '', // 从localStorage加载
        model: 'gpt-3.5-turbo',
        maxTokens: 800,
        temperature: 0.7,
        timeout: 30000
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 运行模式
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    mode: 'hybrid', // 'rules_only', 'openai_only', 'hybrid'

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 混合模式配置
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    hybrid: {
        // 优先使用规则引擎的意图
        preferRules: [
            'balance_query',
            'investment_query',
            'vip_query',
            'team_query',
            'product_query'
        ],

        // 优先使用OpenAI的意图
        preferOpenAI: [
            'advice',
            'complex_query',
            'chat'
        ],

        // 规则引擎失败时是否降级到OpenAI
        fallbackToOpenAI: true,

        // 置信度阈值（低于此值使用OpenAI）
        confidenceThreshold: 0.7
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 缓存配置
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    cache: {
        enabled: true,
        duration: 3600000, // 1小时
        maxSize: 100
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 调试配置
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    debug: true,

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 方法：加载配置
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    load() {
        try {
            // 从localStorage加载OpenAI配置
            const savedApiKey = localStorage.getItem('AI_CONFIG_openai_apiKey');
            const savedModel = localStorage.getItem('AI_CONFIG_openai_model');
            const savedMode = localStorage.getItem('AI_CONFIG_mode');

            if (savedApiKey) {
                this.openai.apiKey = savedApiKey;
                console.log('[AI_CONFIG] ✅ OpenAI API Key已加载');
            }

            if (savedModel) {
                this.openai.model = savedModel;
            }

            if (savedMode) {
                this.mode = savedMode;
            }

            // console.log('[AI_CONFIG] 配置已加载:', {
            //     mode: this.mode,
            //     hasApiKey: !!this.openai.apiKey,
            //     model: this.openai.model
            // });

        } catch (error) {
            console.error('[AI_CONFIG] 加载配置失败:', error);
        }
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 方法：保存配置
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    save() {
        try {
            if (this.openai.apiKey) {
                localStorage.setItem('AI_CONFIG_openai_apiKey', this.openai.apiKey);
            }

            localStorage.setItem('AI_CONFIG_openai_model', this.openai.model);
            localStorage.setItem('AI_CONFIG_mode', this.mode);

            console.log('[AI_CONFIG] ✅ 配置已保存');
        } catch (error) {
            console.error('[AI_CONFIG] 保存配置失败:', error);
        }
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 方法：设置OpenAI Key
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    setOpenAIKey(apiKey) {
        this.openai.apiKey = apiKey;
        this.save();
        console.log('[AI_CONFIG] ✅ OpenAI API Key已设置');
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 方法：检查配置
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    getStatus() {
        return {
            openaiConfigured: !!this.openai.apiKey && this.openai.apiKey.startsWith('sk-'),
            mode: this.mode,
            model: this.openai.model,
            cacheEnabled: this.cache.enabled
        };
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 自动初始化
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 立即加载配置
AI_CONFIG.load();

// 暴露到全局
window.AI_CONFIG = AI_CONFIG;

// console.log('%c[AI_CONFIG] Providence AI配置中心已加载 v' + AI_CONFIG.version, 'color: #4ade80; font-weight: bold'); // 性能优化：已注释
// console.log('%c[AI_CONFIG] 模式:', 'color: #60a5fa', AI_CONFIG.mode); // 性能优化：已注释
// console.log('%c[AI_CONFIG] OpenAI已配置:', 'color: #60a5fa', AI_CONFIG.getStatus().openaiConfigured); // 性能优化：已注释
