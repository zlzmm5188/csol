/**
 * 表情符号增强插件
 * 功能: 让AI回复更生动有趣
 */

(function() {
    'use strict';

    const EmojiPlugin = {
        name: 'emoji',
        version: '1.0.0',
        description: '表情符号增强插件 - 让AI回复更生动有趣',

        init(pluginSystem) {
            console.log('[表情插件] ✅ 初始化完成');
        },

        hooks: {
            // 响应生成钩子 - 增强表情符号
            responseGenerated: async (response, userMessage, userData) => {
                if (response && response.message) {
                    // 根据内容智能添加表情
                    response.message = this.enhanceEmoji(response.message, userMessage);
                }
                return response;
            }
        },

        // 增强表情符号
        enhanceEmoji(message, userMessage) {
            // 如果已经有足够的表情，就不添加了
            const emojiCount = (message.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
            if (emojiCount > 3) {
                return message;
            }

            // 根据关键词添加表情
            const emojiMap = {
                '余额': '💰',
                '投资': '📊',
                '收益': '🎁',
                'VIP': '👑',
                '团队': '👥',
                '充值': '💳',
                '提现': '🏦',
                '成功': '✅',
                '错误': '❌',
                '提示': '💡',
                '警告': '⚠️',
                '帮助': '🆘',
                '感谢': '🙏',
                '开心': '😊',
                '加油': '💪',
                '太棒': '🎉'
            };

            let enhanced = message;

            // 在关键词后添加表情
            Object.keys(emojiMap).forEach(keyword => {
                const regex = new RegExp(`(${keyword})(?![\u{1F300}-\u{1F9FF}])`, 'g');
                if (regex.test(enhanced)) {
                    enhanced = enhanced.replace(regex, `$1 ${emojiMap[keyword]}`);
                }
            });

            return enhanced;
        }
    };

    // 注册插件
    if (typeof window !== 'undefined' && window.AI_PLUGIN_SYSTEM) {
        window.AI_PLUGIN_SYSTEM.register('emoji', EmojiPlugin);
    } else {
        window.addEventListener('load', () => {
            if (window.AI_PLUGIN_SYSTEM) {
                window.AI_PLUGIN_SYSTEM.register('emoji', EmojiPlugin);
            }
        });
    }
})();
