/**
 * Providence AI 智能对话系统
 * 版本: 1.0
 * 创建时间: 2025-10-28
 * 功能: 多轮对话、上下文理解、情感识别、智能引导
 */

const AI_SMART_CONVERSATION = {

    // 对话上下文
    context: {
        lastIntent: null,
        lastEntity: null,
        conversationTopic: null,
        userMood: 'neutral',
        questionCount: 0,
        lastResponse: null
    },

    /**
     * 情感识别
     */
    analyzeSentiment(message) {
        const msg = message.toLowerCase();

        // 积极情感
        if (msg.match(/好|不错|棒|赞|厉害|优秀|满意|喜欢|感谢|谢谢|太好了/)) {
            return 'positive';
        }

        // 消极情感
        if (msg.match(/差|烂|垃圾|不行|失望|生气|郁闷|糟糕|不满|投诉/)) {
            return 'negative';
        }

        // 疑惑情感
        if (msg.match(/不懂|不明白|confused|什么意思|看不懂|不太理解/)) {
            return 'confused';
        }

        // 焦虑情感
        if (msg.match(/担心|害怕|恐惧|焦虑|紧张|安全吗|会不会亏|靠谱吗/)) {
            return 'anxious';
        }

        // 中性
        return 'neutral';
    },

    /**
     * 根据情感调整回复风格
     */
    adjustTone(sentiment) {
        switch(sentiment) {
            case 'positive':
                return {
                    prefix: ['哈哈，很高兴您满意~', '感谢您的认可！能帮到您我很开心', '您的支持让我更有动力了~'][Math.floor(Math.random() * 3)],
                    emoji: '😊'
                };
            case 'negative':
                return {
                    prefix: ['哎呀，抱歉给您带来不便了', '我们会立即改进的！', '感谢您的反馈，我们会认真对待的~'][Math.floor(Math.random() * 3)],
                    emoji: '🙏'
                };
            case 'confused':
                return {
                    prefix: ['让我用更简单的方式解释一下：', '我来详细说明一下哈~', '没关系，我换个说法您就明白了：'][Math.floor(Math.random() * 3)],
                    emoji: '💡'
                };
            case 'anxious':
                return {
                    prefix: ['请放心！', '这个您完全不用担心哦~', '让我为您详细解释一下，您就明白了：'][Math.floor(Math.random() * 3)],
                    emoji: '🛡️'
                };
            default:
                return { prefix: '', emoji: '' };
        }
    },

    /**
     * 上下文理解 - 理解代词指向
     */
    resolvePronouns(message) {
        const msg = message.toLowerCase();

        // "它" "这个" "那个" 指向上一个话题
        if (msg.match(/^(它|这个|那个|这|那)/) && this.context.lastIntent) {
            switch(this.context.lastIntent) {
                case 'query_balance':
                    return '账户余额';
                case 'query_investments':
                    return '投资项目';
                case 'query_vip':
                    return 'VIP等级';
                case 'query_team':
                    return '团队信息';
            }
        }

        return message;
    },

    /**
     * 智能追问系统
     */
    generateFollowUp(intent, userData) {
        const followUps = {
            'query_balance': [
                { question: '需要我帮您充值吗？', buttons: [
                    { text: '💳 立即充值', link: 'recharge.html' },
                    { text: '📊 查看投资', link: 'my-investments.html', type: 'secondary' }
                ]},
                { question: '想了解如何让余额增值吗？', buttons: [
                    { text: '📈 查看项目', link: 'projects.html' },
                    { text: '💡 投资建议', link: '#', onclick: "quickAsk('投资建议')" }
                ]}
            ],
            'query_investments': [
                { question: '想继续投资吗？', buttons: [
                    { text: '📈 查看新项目', link: 'projects.html' },
                    { text: '💰 立即充值', link: 'recharge.html', type: 'secondary' }
                ]},
                { question: '需要查看收益日历吗？', buttons: [
                    { text: '📅 收益日历', link: 'profit-calendar.html' },
                    { text: '📊 投资分析', link: 'my-investments.html', type: 'secondary' }
                ]}
            ],
            'query_vip': [
                { question: '想快速升级VIP吗？', buttons: [
                    { text: '💰 快速升级', link: 'recharge.html' },
                    { text: '👑 VIP权益', link: 'vip-level.html', type: 'secondary' }
                ]},
                { question: '了解一下VIP专享项目？', buttons: [
                    { text: '🔐 VIP专区', link: 'projects.html' },
                    { text: '👑 升级指南', link: 'vip-level.html', type: 'secondary' }
                ]}
            ],
            'query_team': [
                { question: '想分享您的邀请链接吗？', buttons: [
                    { text: '📱 立即分享', link: 'invite-share.html' },
                    { text: '🎁 奖励规则', link: 'team-rewards.html', type: 'secondary' }
                ]},
                { question: '查看可领取的奖励吗？', buttons: [
                    { text: '🎁 领取奖励', link: 'team-rewards.html' },
                    { text: '👥 团队详情', link: 'invite.html', type: 'secondary' }
                ]}
            ]
        };

        const options = followUps[intent];
        if (!options || options.length === 0) return null;

        // 随机选择一个追问
        return options[Math.floor(Math.random() * options.length)];
    },

    /**
     * 多轮对话理解
     */
    async understandContext(message, previousIntent) {
        const msg = message.toLowerCase();

        // 肯定回答（接着上一个话题）
        if (msg.match(/^(是|好|对|嗯|ok|yes|要|想|需要)$/)) {
            return {
                isFollowUp: true,
                intent: previousIntent,
                action: 'confirm'
            };
        }

        // 否定回答
        if (msg.match(/^(不|no|不用|不要|不需要|算了)$/)) {
            return {
                isFollowUp: true,
                intent: previousIntent,
                action: 'decline'
            };
        }

        // 话题转换
        if (msg.match(/换个|其他|别的|还有|再说说/)) {
            return {
                isFollowUp: false,
                action: 'change_topic'
            };
        }

        return {
            isFollowUp: false,
            action: 'new_query'
        };
    },

    /**
     * 智能补充信息
     */
    addSmartSupplement(intent, userData) {
        const supplements = {
            'query_balance': () => {
                if (userData && parseFloat(userData.money || 0) < 1000) {
                    return {
                        message: '<br><br>💡 <em>温馨提示：账户余额较少，建议充值后开始投资理财~</em>',
                        suggestAction: 'deposit'
                    };
                }
                if (userData && parseFloat(userData.money || 0) > 50000) {
                    return {
                        message: '<br><br>💎 <em>您的余额充足！推荐查看我们的VIP专享高收益项目~</em>',
                        suggestAction: 'vip_projects'
                    };
                }
                return null;
            },
            'query_vip': () => {
                if (userData && parseInt(userData.level || 1) < 3) {
                    return {
                        message: '<br><br>💡 <em>提示：升级VIP可享受更高加息，投资10万即可升级VIP2！</em>',
                        suggestAction: 'upgrade'
                    };
                }
                return null;
            }
        };

        const supplementFn = supplements[intent];
        return supplementFn ? supplementFn() : null;
    },

    /**
     * 个性化问候
     */
    getPersonalizedGreeting(context, userData) {
        const hour = new Date().getHours();
        let timeGreeting = '';

        if (hour < 6) timeGreeting = '凌晨好';
        else if (hour < 9) timeGreeting = '早上好';
        else if (hour < 12) timeGreeting = '上午好';
        else if (hour < 14) timeGreeting = '中午好';
        else if (hour < 18) timeGreeting = '下午好';
        else if (hour < 22) timeGreeting = '晚上好';
        else timeGreeting = '夜深了';

        const userName = context.userName || '';
        const vipLevel = userData ? `VIP${userData.level || 1}` : '';

        let greeting = `${timeGreeting}`;
        if (userName) greeting += `，${userName}`;
        if (vipLevel && userData) greeting += `（${vipLevel}会员）`;
        greeting += '！';

        return greeting;
    },

    /**
     * 智能推荐
     */
    getSmartRecommendations(userData) {
        if (!userData) {
            return [
                { text: '🔑 立即登录', link: 'login.html' },
                { text: '📝 注册账户', link: 'register.html', type: 'secondary' }
            ];
        }

        const balance = parseFloat(userData.money || 0);
        const level = parseInt(userData.level || 1);
        const profit = parseFloat(userData.tfund || 0);

        const recommendations = [];

        // 余额充足，推荐投资
        if (balance > 10000) {
            recommendations.push({
                text: '📈 推荐项目',
                link: 'projects.html',
                reason: '您的余额充足，可以开始投资'
            });
        }

        // 余额不足，推荐充值
        if (balance < 1000) {
            recommendations.push({
                text: '💳 充值',
                link: 'recharge.html',
                reason: '余额较少，建议充值'
            });
        }

        // VIP等级低，推荐升级
        if (level < 3 && balance > 50000) {
            recommendations.push({
                text: '👑 升级VIP',
                link: 'vip-level.html',
                type: 'secondary',
                reason: '升级VIP可享更高收益'
            });
        }

        // 有收益，推荐提现
        if (profit > 1000) {
            recommendations.push({
                text: '🏦 提现',
                link: 'withdraw.html',
                type: 'secondary',
                reason: '您有收益可提现'
            });
        }

        // 默认推荐
        if (recommendations.length === 0) {
            recommendations.push({
                text: '📊 查看投资',
                link: 'my-investments.html'
            });
            recommendations.push({
                text: '📈 浏览项目',
                link: 'projects.html',
                type: 'secondary'
            });
        }

        return recommendations.slice(0, 3); // 最多3个推荐
    },

    /**
     * 话题引导 - 让对话更自然
     */
    suggestNextTopic(currentIntent) {
        const suggestions = {
            'query_balance': [
                '要不要看看有哪些投资项目？',
                '需要了解一下我们的VIP会员权益吗？',
                '想看看您的投资收益情况吗？'
            ],
            'query_investments': [
                '需要帮您分析一下收益情况吗？',
                '要不要了解一下新的投资项目？',
                '想看看收益日历吗？'
            ],
            'query_vip': [
                '需要查看VIP专享项目吗？',
                '要不要了解一下如何快速升级？',
                '想看看VIP会员的投资收益对比吗？'
            ],
            'about_company': [
                '想了解我们的投资产品吗？',
                '需要查看成功案例吗？',
                '要不要开始您的投资之旅？'
            ]
        };

        const options = suggestions[currentIntent];
        if (!options || options.length === 0) return null;

        return options[Math.floor(Math.random() * options.length)];
    },

    /**
     * 智能简化回复（根据用户熟悉程度）
     */
    simplifyIfNeeded(message, questionCount) {
        // 用户问了很多次类似问题，可能不理解，需要简化
        if (questionCount > 3) {
            return {
                shouldSimplify: true,
                tip: '<br><br>💡 <em>如果您需要更详细的解释或人工协助，请随时告诉我！</em>'
            };
        }

        return {
            shouldSimplify: false,
            tip: ''
        };
    },

    /**
     * 自动完成用户输入（智能建议）
     */
    getSuggestions(partialInput) {
        const suggestions = [
            { input: '我的', suggestions: ['我的余额', '我的投资', '我的团队', '我的VIP'] },
            { input: '如何', suggestions: ['如何充值', '如何提现', '如何投资', '如何升级VIP'] },
            { input: '什么是', suggestions: ['什么是基金', '什么是IPO', '什么是国债', '什么是私募'] },
            { input: 'VIP', suggestions: ['VIP等级', 'VIP权益', 'VIP升级', 'VIP专享项目'] },
            { input: '查询', suggestions: ['查询余额', '查询投资', '查询团队', '查询收益'] }
        ];

        for (let item of suggestions) {
            if (partialInput.startsWith(item.input)) {
                return item.suggestions;
            }
        }

        return [];
    },

    /**
     * 对话流程控制
     */
    async manageConversationFlow(userMessage, previousContext) {
        const sentiment = this.analyzeSentiment(userMessage);
        const resolved = this.resolvePronouns(userMessage);
        const contextInfo = await this.understandContext(userMessage, previousContext.lastIntent);

        return {
            resolvedMessage: resolved !== userMessage ? resolved : userMessage,
            sentiment: sentiment,
            tone: this.adjustTone(sentiment),
            isFollowUp: contextInfo.isFollowUp,
            action: contextInfo.action
        };
    },

    /**
     * 生成智能回复（整合所有功能）
     */
    async enhanceResponse(basicResponse, userMessage, userData) {
        const sentiment = this.analyzeSentiment(userMessage);
        const tone = this.adjustTone(sentiment);

        // 添加情感化的开头
        let enhancedMessage = basicResponse.message;
        if (tone.prefix) {
            enhancedMessage = `${tone.emoji} ${tone.prefix}<br><br>${enhancedMessage}`;
        }

        // 添加智能补充
        const supplement = this.addSmartSupplement(this.context.lastIntent, userData);
        if (supplement) {
            enhancedMessage += supplement.message;
        }

        // 添加话题引导（30%概率）
        if (Math.random() < 0.3) {
            const nextTopic = this.suggestNextTopic(this.context.lastIntent);
            if (nextTopic) {
                enhancedMessage += `<br><br>💬 ${nextTopic}`;
            }
        }

        // 添加智能推荐按钮
        const smartRec = this.getSmartRecommendations(userData);

        return {
            message: enhancedMessage,
            actionButtons: basicResponse.actionButtons || smartRec,
            sentiment: sentiment
        };
    },

    /**
     * 更新对话上下文
     */
    updateContext(intent, entity, response) {
        this.context.lastIntent = intent;
        this.context.lastEntity = entity;
        this.context.lastResponse = response;
        this.context.questionCount += 1;

        // 每10轮对话提示用户
        if (this.context.questionCount % 10 === 0) {
// console.log('[对话] 已进行', this.context.questionCount, '轮对话'); // 性能优化：已注释
        }
    },

    /**
     * 智能建议卡片
     */
    generateSmartCard(userData) {
        if (!userData) return null;

        const balance = parseFloat(userData.money || 0);
        const level = parseInt(userData.level || 1);

        let cards = [];

        // 余额充足 + VIP低 = 推荐升级
        if (balance > 50000 && level < 3) {
            cards.push({
                icon: '👑',
                title: '升级VIP享更高收益',
                desc: `您的余额已达${(balance/10000).toFixed(1)}万，升级VIP${level+1}可享受更高加息！`,
                button: { text: '立即升级', link: 'vip-level.html' }
            });
        }

        // 有余额无投资 = 推荐投资
        if (balance > 5000 && (!userData.projects_count || userData.projects_count === 0)) {
            cards.push({
                icon: '📈',
                title: '开始投资赚取收益',
                desc: '您的账户有余额，开始投资让钱生钱！',
                button: { text: '查看项目', link: 'projects.html' }
            });
        }

        // 团队为空 = 推荐邀请
        if ((!userData.team_count || userData.team_count === 0) && level >= 1) {
            cards.push({
                icon: '👥',
                title: '邀请好友赚佣金',
                desc: '邀请好友投资，您可获得5%佣金奖励！',
                button: { text: '立即邀请', link: 'invite-share.html' }
            });
        }

        return cards.length > 0 ? cards[0] : null;
    },

    /**
     * 对话总结（每5轮对话）
     */
    generateConversationSummary(conversationHistory) {
        if (conversationHistory.length < 5) return null;

        const recent = conversationHistory.slice(-5);
        const topics = [...new Set(recent.map(c => c.intent))];

        return {
            message: `<br><br>📊 <strong>本次对话小结</strong><br>` +
                     `您咨询了：${topics.map(t => this.getTopicName(t)).join('、')}<br>` +
                     `还有其他问题吗？`,
            showSummary: true
        };
    },

    /**
     * 获取话题名称
     */
    getTopicName(intent) {
        const names = {
            'query_balance': '账户余额',
            'query_investments': '投资项目',
            'query_vip': 'VIP等级',
            'query_team': '团队信息',
            'about_company': '公司介绍',
            'security': '账户安全',
            'customer_service': '客服服务'
        };
        return names[intent] || '其他';
    },

    /**
     * 重置上下文
     */
    resetContext() {
        this.context = {
            lastIntent: null,
            lastEntity: null,
            conversationTopic: null,
            userMood: 'neutral',
            questionCount: 0,
            lastResponse: null
        };
// console.log('[对话] 上下文已重置'); // 性能优化：已注释
    }
};

// 导出
if (typeof window !== 'undefined') {
    window.AI_SMART_CONVERSATION = AI_SMART_CONVERSATION;
}

// console.log('🧠 Providence AI 智能对话系统已加载'); // 性能优化：已注释
// console.log('💬 支持：情感识别、上下文理解、智能追问、个性化推荐'); // 性能优化：已注释
