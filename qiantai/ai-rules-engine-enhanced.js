/**
 * Providence 增强规则引擎
 * 版本: 2.0 (优化版)
 * 创建时间: 2025-11-17
 * 功能: 优化的意图识别、实体提取、快速响应
 */

const AI_RULES_ENGINE = {
    version: '2.0',
    name: 'Providence Enhanced Rules Engine',

    /**
     * 增强的意图识别（准确率提升）
     */
    identifyIntent(message) {
        const msg = message.toLowerCase().trim();

        // 1. 精确匹配（优先级最高）
        const exactMatches = {
            '余额': { type: 'query_balance', confidence: 1.0 },
            '我的余额': { type: 'query_balance', confidence: 1.0 },
            '账户余额': { type: 'query_balance', confidence: 1.0 },
            '投资': { type: 'query_investments', confidence: 0.95 },
            '我的投资': { type: 'query_investments', confidence: 1.0 },
            'vip': { type: 'query_vip', confidence: 0.95 },
            '会员': { type: 'query_vip', confidence: 0.9 },
            '团队': { type: 'query_team', confidence: 0.95 },
            '我的团队': { type: 'query_team', confidence: 1.0 },
            '充值': { type: 'action_deposit', confidence: 0.95 },
            '提现': { type: 'action_withdraw', confidence: 0.95 }
        };

        if (exactMatches[msg]) {
            return exactMatches[msg];
        }

        // 2. 模式匹配（按优先级顺序）
        const patterns = [
            // 公司介绍
            {
                pattern: /^(公司|介绍|关于|providence|星空|什么是|你们是)/,
                type: 'about_company',
                confidence: 0.95
            },

            // 账户查询
            {
                pattern: /(余额|账户|资产|有多少钱|钱包|balance)/,
                type: 'query_balance',
                confidence: 0.9
            },

            // 投资查询
            {
                pattern: /(我的)?(投资|项目|理财|持仓|买了|购买了)/,
                type: 'query_investments',
                confidence: 0.9
            },

            // 投资推荐（新增增强）
            {
                pattern: /(推荐|建议|什么项目|哪个项目|适合|值得|应该买|买什么)/,
                type: 'investment_recommendation',
                confidence: 0.92
            },

            // VIP相关
            {
                pattern: /(vip|会员|等级|升级|权益|特权)/,
                type: 'query_vip',
                confidence: 0.9
            },

            // 充值
            {
                pattern: /(充值|入金|存款|转入|recharge|deposit)/,
                type: 'action_deposit',
                confidence: 0.88
            },

            // 提现
            {
                pattern: /(提现|出金|取款|转出|withdraw)/,
                type: 'action_withdraw',
                confidence: 0.88
            },

            // 团队推广
            {
                pattern: /(团队|邀请|推广|分享|邀请码|推荐人|下级)/,
                type: 'query_team',
                confidence: 0.9
            },

            // 收益查询（新增）
            {
                pattern: /(收益|利润|赚了|盈利|profit|earning)/,
                type: 'query_earnings',
                confidence: 0.9
            },

            // 安全相关
            {
                pattern: /(安全|密码|实名|认证|kyc|绑定|修改密码)/,
                type: 'security',
                confidence: 0.85
            },

            // 找回密码
            {
                pattern: /(忘记密码|找回密码|密码忘了|重置密码|忘了密码|密码找回|reset\s*password)/,
                type: 'password_reset',
                confidence: 0.95
            },

            // 客服联系
            {
                pattern: /(客服|人工|联系|电话|在线|投诉|建议|问题|帮助|咨询)/,
                type: 'customer_service',
                confidence: 0.85
            },

            // 账户安全警报
            {
                pattern: /(被盗|异常|风险|冻结|限制|锁定|盗号)/,
                type: 'security_alert',
                confidence: 0.95
            },

            // 充值问题
            {
                pattern: /(充值.*(未到账|失败|问题)|到账|充值多久)/,
                type: 'deposit_issue',
                confidence: 0.9
            },

            // 提现问题
            {
                pattern: /(提现.*(失败|审核|不了|问题|多久)|提现速度)/,
                type: 'withdraw_issue',
                confidence: 0.9
            },

            // 产品咨询（新增）
            {
                pattern: /(基金|股票|债券|国债|ipo|私募|产品|理财产品)/,
                type: 'product_inquiry',
                confidence: 0.88
            },

            // 操作指南
            {
                pattern: /(怎么|如何|怎样|教程|流程|步骤|guide)/,
                type: 'help',
                confidence: 0.8
            },

            // 问候
            {
                pattern: /^(你好|您好|hi|hello|嗨|在吗|在不在|早上好|下午好|晚上好)/,
                type: 'greeting',
                confidence: 0.95
            },

            // 感谢
            {
                pattern: /^(谢谢|感谢|thanks|thx|多谢|thank\s*you)/,
                type: 'thanks',
                confidence: 0.95
            }
        ];

        // 按顺序匹配
        for (const item of patterns) {
            if (item.pattern.test(msg)) {
                return { type: item.type, confidence: item.confidence };
            }
        }

        // 3. 兜底：未知意图
        return { type: 'unknown', confidence: 0.5 };
    },

    /**
     * 增强的实体提取
     */
    extractEntities(message) {
        const entities = {};

        // 1. 提取金额（支持多种格式）
        const amountPatterns = [
            /(\d+(?:\.\d+)?)\s*(元|块|rmb|￥|¥)/i,  // 1000元
            /(\d+(?:\.\d+)?)\s*万/,                   // 10万
            /(\d+(?:\.\d+)?)\s*千/,                   // 5千
            /￥\s*(\d+(?:\.\d+)?)/,                   // ¥1000
            /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/         // 1,000 或 1000
        ];

        for (const pattern of amountPatterns) {
            const match = message.match(pattern);
            if (match) {
                let amount = parseFloat(match[1].replace(/,/g, ''));

                // 单位转换
                if (message.includes('万')) amount *= 10000;
                if (message.includes('千')) amount *= 1000;

                entities.amount = amount;
                break;
            }
        }

        // 2. 提取项目ID
        const projectIdMatch = message.match(/项目\s*#?(\d+)|#(\d+)|编号\s*(\d+)/);
        if (projectIdMatch) {
            entities.projectId = projectIdMatch[1] || projectIdMatch[2] || projectIdMatch[3];
        }

        // 3. 提取时间周期
        const periodMatch = message.match(/(\d+)\s*(天|日|周|月|年)/);
        if (periodMatch) {
            let days = parseInt(periodMatch[1]);
            const unit = periodMatch[2];

            if (unit === '周') days *= 7;
            if (unit === '月') days *= 30;
            if (unit === '年') days *= 365;

            entities.period = days;
            entities.periodUnit = unit;
        }

        // 4. 提取收益率
        const rateMatch = message.match(/(\d+(?:\.\d+)?)\s*%/);
        if (rateMatch) {
            entities.rate = parseFloat(rateMatch[1]);
        }

        // 5. 提取VIP等级
        const vipMatch = message.match(/vip\s*(\d+)|v(\d+)|等级\s*(\d+)/i);
        if (vipMatch) {
            entities.vipLevel = parseInt(vipMatch[1] || vipMatch[2] || vipMatch[3]);
        }

        // 6. 提取产品类型
        const productTypes = ['基金', '股票', '债券', '国债', 'ipo', '私募'];
        for (const type of productTypes) {
            if (message.toLowerCase().includes(type)) {
                entities.productType = type;
                break;
            }
        }

        // 7. 提取账号信息（用于找回密码等）
        const accountMatch = message.match(/账号[是:]?\s*([a-zA-Z0-9_]{4,20})/);
        if (accountMatch) {
            entities.account = accountMatch[1];
        }

        // 8. 提取手机号
        const phoneMatch = message.match(/1[3-9]\d{9}/);
        if (phoneMatch) {
            entities.phone = phoneMatch[0];
        }

        return entities;
    },

    /**
     * 情感分析（增强版）
     */
    analyzeSentiment(message) {
        const msg = message.toLowerCase();

        // 积极情感（权重评分）
        const positiveWords = ['好', '不错', '棒', '赞', '厉害', '优秀', '满意', '喜欢', '感谢', '谢谢', '太好了', '完美'];
        const positiveScore = positiveWords.filter(w => msg.includes(w)).length;

        // 消极情感
        const negativeWords = ['差', '烂', '垃圾', '不行', '失望', '生气', '郁闷', '糟糕', '不满', '投诉', '骗'];
        const negativeScore = negativeWords.filter(w => msg.includes(w)).length;

        // 疑惑情感
        const confusedWords = ['不懂', '不明白', '什么意思', '看不懂', '不太理解', '为什么'];
        const confusedScore = confusedWords.filter(w => msg.includes(w)).length;

        // 焦虑情感
        const anxiousWords = ['担心', '害怕', '恐惧', '焦虑', '紧张', '安全吗', '会不会亏', '靠谱吗', '风险'];
        const anxiousScore = anxiousWords.filter(w => msg.includes(w)).length;

        // 计算最终情感
        if (positiveScore > negativeScore && positiveScore > 0) return 'positive';
        if (negativeScore > 0) return 'negative';
        if (confusedScore > 0) return 'confused';
        if (anxiousScore > 0) return 'anxious';

        return 'neutral';
    },

    /**
     * 上下文理解（代词解析）
     */
    resolveContext(message, lastIntent, lastEntity) {
        const msg = message.toLowerCase();

        // 指代词映射
        const pronouns = {
            '它': true,
            '这个': true,
            '那个': true,
            '这': true,
            '那': true,
            '他': true,
            '她': true
        };

        // 检查是否包含代词
        let hasPronoun = false;
        for (const pronoun in pronouns) {
            if (msg.startsWith(pronoun)) {
                hasPronoun = true;
                break;
            }
        }

        if (!hasPronoun || !lastIntent) {
            return { resolved: false, message };
        }

        // 根据上一个意图解析
        const contextMap = {
            'query_balance': '账户余额',
            'query_investments': '投资项目',
            'query_vip': 'VIP等级',
            'query_team': '团队信息',
            'query_earnings': '收益情况'
        };

        const context = contextMap[lastIntent];
        if (context) {
            return {
                resolved: true,
                message: `${context}${msg.substring(1)}`,
                originalMessage: message
            };
        }

        return { resolved: false, message };
    },

    /**
     * 判断是否可以用规则引擎处理
     */
    canHandle(message, intent) {
        // 简单查询，规则引擎可处理
        const simpleIntents = [
            'query_balance',
            'query_investments',
            'query_vip',
            'query_team',
            'query_earnings',
            'action_deposit',
            'action_withdraw',
            'security',
            'password_reset',
            'customer_service',
            'greeting',
            'thanks',
            'about_company'
        ];

        if (simpleIntents.includes(intent.type)) {
            return { canHandle: true, confidence: intent.confidence };
        }

        // 复杂查询，需要OpenAI
        if (message.length > 50) {
            return { canHandle: false, reason: '问题过于复杂，需要AI处理' };
        }

        if (message.includes('为什么') || message.includes('怎么选择')) {
            return { canHandle: false, reason: '需要深度分析' };
        }

        // 中等复杂度，根据置信度决定
        return {
            canHandle: intent.confidence > 0.85,
            confidence: intent.confidence
        };
    },

    /**
     * 格式化金额
     */
    formatMoney(amount) {
        if (!amount && amount !== 0) return '0.00';
        const num = parseFloat(amount);
        if (num >= 10000) {
            return (num / 10000).toFixed(2) + '万';
        }
        return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    /**
     * 智能提示生成
     */
    generateSmartTips(intent, userData) {
        const tips = {
            'query_balance': () => {
                if (!userData) return null;
                const balance = parseFloat(userData.money || 0);
                if (balance < 1000) {
                    return '💡 账户余额较少，建议充值后开始投资理财~';
                }
                if (balance > 50000 && parseInt(userData.level || 1) < 3) {
                    return '💎 您的余额充足！推荐升级VIP享受更高收益~';
                }
                return null;
            },
            'query_vip': () => {
                if (!userData) return null;
                const level = parseInt(userData.level || 1);
                if (level < 3) {
                    return '💡 升级VIP可享受更高加息，投资越多等级越高！';
                }
                return null;
            },
            'investment_recommendation': () => {
                return '📊 我会根据您的VIP等级和余额，为您推荐合适的投资项目';
            }
        };

        const tipFn = tips[intent.type];
        return tipFn ? tipFn() : null;
    },

    /**
     * 快速响应模板
     */
    getQuickResponse(intent) {
        const templates = {
            'greeting': [
                '您好呀~ 我是Providence AI，很高兴为您服务 😊',
                '您好！有什么可以帮您的吗？',
                '嗨~ 欢迎使用Providence！我能为您做些什么呢？',
                '您好！我是您的专属AI顾问，有什么需要尽管问我~'
            ],
            'thanks': [
                '不客气呀~ 能帮到您我很开心 😊',
                '哈哈，不用谢！有什么问题随时找我~',
                '客气啥，这是我应该做的！还有其他需要吗？',
                '能帮到您就好！随时为您服务 👍'
            ]
        };

        const options = templates[intent.type];
        if (!options) return null;

        return options[Math.floor(Math.random() * options.length)];
    },

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            version: this.version,
            supportedIntents: 20,
            entityTypes: 8
        };
    }
};

// 全局暴露
if (typeof window !== 'undefined') {
    window.AI_RULES_ENGINE = AI_RULES_ENGINE;
}

// console.log('⚙️ Providence增强规则引擎已加载 v' + AI_RULES_ENGINE.version); // 性能优化：已注释
