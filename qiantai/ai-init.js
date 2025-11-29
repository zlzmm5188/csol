/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Providence AI 自动配置初始化
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 在messages.html中使用，确保AI_CONFIG在所有模块之前加载
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

(function() {
    'use strict';

    console.log('[AI Init] 开始初始化AI配置...');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. 确保AI_CONFIG存在
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (!window.AI_CONFIG) {
        console.error('[AI Init] ❌ AI_CONFIG未定义！');

        // 创建默认配置
        window.AI_CONFIG = {
            version: '2.0',
            name: 'Providence AI Assistant',
            openai: {
                apiKey: '',
                model: 'gpt-3.5-turbo',
                maxTokens: 800,
                temperature: 0.7,
                timeout: 30000
            },
            mode: 'hybrid',
            hybrid: {
                preferRules: ['balance_query', 'investment_query', 'vip_query', 'team_query', 'product_query'],
                preferOpenAI: ['advice', 'complex_query', 'chat'],
                fallbackToOpenAI: true,
                confidenceThreshold: 0.7
            },
            cache: {
                enabled: true,
                duration: 3600000,
                maxSize: 100
            },
            debug: true
        };

// console.log('[AI Init] ⚠️ 使用默认AI_CONFIG'); // 性能优化：已注释
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. 自动设置OpenAI API Key
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const OPENAI_KEY = 'YOUR_OPENAI_API_KEY_HERE'; // 请替换为您的OpenAI API Key

    // 检查是否已有key
    const savedKey = localStorage.getItem('AI_CONFIG_openai_apiKey');

    if (!savedKey || savedKey.length < 20) {
// console.log('[AI Init] 设置OpenAI API Key...'); // 性能优化：已注释

        // 保存到localStorage
        localStorage.setItem('AI_CONFIG_openai_apiKey', OPENAI_KEY);

        // 设置到AI_CONFIG对象
        if (window.AI_CONFIG && window.AI_CONFIG.openai) {
            window.AI_CONFIG.openai.apiKey = OPENAI_KEY;
        }

        console.log('[AI Init] ✅ OpenAI API Key已设置');
    } else {
        console.log('[AI Init] ✅ OpenAI API Key已存在');

        // 加载到AI_CONFIG对象
        if (window.AI_CONFIG && window.AI_CONFIG.openai) {
            window.AI_CONFIG.openai.apiKey = savedKey;
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3. 设置默认模式
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const savedMode = localStorage.getItem('AI_CONFIG_mode');
    if (!savedMode) {
        localStorage.setItem('AI_CONFIG_mode', 'hybrid');
        if (window.AI_CONFIG) {
            window.AI_CONFIG.mode = 'hybrid';
        }
// console.log('[AI Init] 设置默认模式: hybrid'); // 性能优化：已注释
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 4. 验证配置
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    setTimeout(() => {
        if (window.AI_CONFIG) {
            const status = {
                version: window.AI_CONFIG.version,
                mode: window.AI_CONFIG.mode,
                hasOpenAIKey: !!(window.AI_CONFIG.openai && window.AI_CONFIG.openai.apiKey),
                keyLength: window.AI_CONFIG.openai?.apiKey?.length || 0,
                keyPrefix: window.AI_CONFIG.openai?.apiKey?.substring(0, 7) || 'none'
            };

            console.log('%c[AI Init] ✅ AI配置已初始化', 'color: #4ade80; font-weight: bold');
            console.table(status);

            // 如果没有OpenAI key，给出警告
            if (!status.hasOpenAIKey || status.keyLength < 20) {
                console.warn('[AI Init] ⚠️ OpenAI API Key无效或未设置');
                console.warn('[AI Init] 将只使用规则引擎，无法使用GPT功能');
            }
        } else {
            console.error('[AI Init] ❌ AI_CONFIG仍未定义！');
        }
    }, 500);

    console.log('[AI Init] 初始化完成');

})();
