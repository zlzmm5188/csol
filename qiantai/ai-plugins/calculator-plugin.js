/**
 * 计算器插件
 * 功能: 让AI可以执行数学计算
 */

(function() {
    'use strict';

    const CalculatorPlugin = {
        name: 'calculator',
        version: '1.0.0',
        description: '计算器插件 - 让AI可以执行数学计算',

        init(pluginSystem) {
            console.log('[计算器插件] ✅ 初始化完成');
        },

        hooks: {
            // 意图识别钩子 - 检测计算相关意图
            intentDetected: async (intent, userMessage) => {
                // 检测数学表达式
                const mathPattern = /[\d+\-*/().\s]+[+\-*/=][\d+\-*/().\s]+/;
                const hasMath = mathPattern.test(userMessage) ||
                               userMessage.match(/计算|等于|加|减|乘|除|平方|开方|百分比/i);

                if (hasMath && intent.type === 'unknown') {
                    return {
                        type: 'calculator',
                        confidence: 0.9,
                        entities: {
                            expression: this.extractExpression(userMessage)
                        }
                    };
                }

                return intent;
            },

            // 响应生成钩子 - 处理计算
            responseGenerated: async (response, userMessage, userData) => {
                if (userMessage.match(/计算|等于|加|减|乘|除|平方|开方|百分比/i) ||
                    /[\d+\-*/().\s]+[+\-*/=][\d+\-*/().\s]+/.test(userMessage)) {

                    const expression = this.extractExpression(userMessage);
                    const result = this.calculate(expression);

                    if (result !== null) {
                        return {
                            ...response,
                            message: `🧮 <strong>计算结果</strong><br><br>` +
                                   `表达式：<code>${expression}</code><br>` +
                                   `结果：<strong style="color:#25d0a6;font-size:20px">${result}</strong><br><br>` +
                                   `💡 我可以帮您计算各种数学表达式哦~`,
                            source: 'calculator_plugin'
                        };
                    }
                }

                return response;
            }
        },

        // 提取数学表达式
        extractExpression(message) {
            // 提取数字和运算符
            const mathPattern = /[\d+\-*/().\s]+[+\-*/=][\d+\-*/().\s]+/;
            const match = message.match(mathPattern);

            if (match) {
                return match[0].replace(/[=等于]/g, '').trim();
            }

            // 处理中文表达式
            const chinesePattern = /(\d+)\s*(加|减|乘|除|乘以|除以)\s*(\d+)/;
            const chineseMatch = message.match(chinesePattern);

            if (chineseMatch) {
                const num1 = chineseMatch[1];
                const num2 = chineseMatch[3];
                const op = chineseMatch[2];

                const opMap = {
                    '加': '+',
                    '减': '-',
                    '乘': '*',
                    '乘以': '*',
                    '除': '/',
                    '除以': '/'
                };

                return `${num1}${opMap[op] || '+'}${num2}`;
            }

            return message.replace(/[^0-9+\-*/().\s]/g, '').trim();
        },

        // 安全计算（使用Function构造器，但限制范围）
        calculate(expression) {
            try {
                // 清理表达式，只保留数字和运算符
                const cleanExpr = expression.replace(/[^0-9+\-*/().\s]/g, '');

                if (!cleanExpr || cleanExpr.length === 0) {
                    return null;
                }

                // 使用Function构造器安全计算
                const result = Function(`"use strict"; return (${cleanExpr})`)();

                // 检查结果是否为有效数字
                if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                    return result;
                }

                return null;
            } catch (error) {
                console.error('[计算器插件] 计算错误:', error);
                return null;
            }
        }
    };

    // 注册插件
    if (typeof window !== 'undefined' && window.AI_PLUGIN_SYSTEM) {
        window.AI_PLUGIN_SYSTEM.register('calculator', CalculatorPlugin);
    } else {
        window.addEventListener('load', () => {
            if (window.AI_PLUGIN_SYSTEM) {
                window.AI_PLUGIN_SYSTEM.register('calculator', CalculatorPlugin);
            }
        });
    }
})();
