/**
 * Providence 本地AI金融顾问服务
 * 完全自主开发，无需依赖外部服务
 * 版本: 2.0
 * 创建时间: 2025-10-28
 */

const AI_SERVICE_LOCAL = {
    version: '2.0',
    name: 'Providence AI Financial Advisor',

    // 配置
    config: {
        apiBase: 'https://api.4kp3l0iq.top',
        enableSmartReply: true,
        enableContextMemory: true,
        maxHistoryLength: 10,
        responseDelay: 300 // 模拟真人打字延迟
    },

    // 对话历史（用于上下文理解）
    conversationHistory: [],

    // 用户上下文缓存
    userContextCache: null,
    userDataCache: null,

    /**
     * 获取用户上下文
     */
    async getUserContext() {
        if (this.userContextCache) {
            return this.userContextCache;
        }

        // const token = localStorage.getItem('providence_token');
        let userId = localStorage.getItem('providence_user_id');
        let userName = localStorage.getItem('providence_user_name');

        // 不再从API获取用户信息
        // if (token && !userId) {
        //     try {
        //         const response = await fetch(this.config.apiBase + '/api/user/info.php', {
        //             method: 'GET',
        //             headers: {
        //                 'Content-Type': 'application/json',
        //                 'Token': token
        //             }
        //         });

        //         const data = await response.json();
        //         if (data.code === 1 || data.code === 200 && data.data) {
        //             userId = data.data.id;
        //             userName = data.data.username || data.data.realname;

        //             // 缓存用户完整数据
        //             this.userDataCache = data.data;

        //             if (userId) localStorage.setItem('providence_user_id', userId);
        //             if (userName) localStorage.setItem('providence_user_name', userName);
        //         }
        //     } catch (error) {
        //         console.error('[AI] 获取用户信息失败:', error);
        //     }
        // }

        this.userContextCache = {
            // token,
            userId,
            userName,
            isLoggedIn: !!userId,
            timestamp: Date.now()
        };

        return this.userContextCache;
    },

    /**
     * 获取用户完整数据（包含余额、VIP等级等）
     */
    async getUserData() {
        // 已重构：后端API会自动获取用户数据，前端不再需要调用此API
        // 直接返回null，让后端API处理用户数据获取
        return null;
    },

    /**
     * 意图识别 - 分析用户想要做什么
     */
    identifyIntent(message) {
        const msg = message.toLowerCase();

        // 公司/关于我们
        if (msg.match(/公司|介绍|关于|providence|什么是/)) {
            return { type: 'about_company', confidence: 0.95 };
        }

        // 账户查询类
        if (msg.match(/余额|账户|资产|钱|有多少/)) {
            return { type: 'query_balance', confidence: 0.9 };
        }

        // 投资查询类
        if (msg.match(/投资|项目|理财|收益|产品|基金/)) {
            return { type: 'query_investments', confidence: 0.9 };
        }

        // 投资推荐 - 新增
        if (msg.match(/推荐项目|项目推荐|什么项目好|哪个项目|适合投资|推荐什么/)) {
            return { type: 'investment_recommendation', confidence: 0.9 };
        }

        // VIP相关
        if (msg.match(/vip|会员|等级|升级|权益/)) {
            return { type: 'query_vip', confidence: 0.9 };
        }

        // 充值提现操作指导（优先匹配）
        if (msg.match(/充值提现操作指导|充值.*提现.*指导|提现.*充值.*指导|操作指导/)) {
            return { type: 'deposit_withdraw_guide', confidence: 0.95 };
        }

        // 充值提现
        if (msg.match(/充值|入金|存款|转入|recharge/)) {
            return { type: 'action_deposit', confidence: 0.85 };
        }
        if (msg.match(/提现|出金|取款|转出|withdraw/)) {
            return { type: 'action_withdraw', confidence: 0.85 };
        }

        // 团队推广
        if (msg.match(/团队|邀请|推广|分享|邀请码|推荐/)) {
            return { type: 'query_team', confidence: 0.9 };
        }

        // 安全相关
        if (msg.match(/安全|密码|实名|认证|kyc/)) {
            return { type: 'security', confidence: 0.85 };
        }

        // 找回密码 - 新增
        if (msg.match(/忘记密码|找回密码|密码忘了|重置密码|忘了密码|密码找回|reset password/)) {
            return { type: 'password_reset', confidence: 0.95 };
        }

        // 客服联系
        if (msg.match(/客服|人工|联系|电话|在线|投诉|建议|问题|帮助/)) {
            return { type: 'customer_service', confidence: 0.9 };
        }

        // 账户安全
        if (msg.match(/被盗|异常|风险|安全|冻结|限制|锁定/)) {
            return { type: 'security_alert', confidence: 0.95 };
        }

        // 充值问题
        if (msg.match(/充值.*未到账|充值.*失败|充值.*问题/)) {
            return { type: 'deposit_issue', confidence: 0.9 };
        }

        // 提现问题
        if (msg.match(/提现.*失败|提现.*审核|提现.*不了|提现.*问题/)) {
            return { type: 'withdraw_issue', confidence: 0.9 };
        }

        // 帮助类
        if (msg.match(/怎么|如何|怎样|教程|帮助|说明|guide/)) {
            return { type: 'help', confidence: 0.8 };
        }

        // 问候类
        if (msg.match(/你好|您好|hi|hello|在吗|早上好|下午好|晚上好/)) {
            return { type: 'greeting', confidence: 0.95 };
        }

        // 感谢类
        if (msg.match(/谢谢|感谢|thanks|thx/)) {
            return { type: 'thanks', confidence: 0.95 };
        }

        // 默认
        return { type: 'unknown', confidence: 0.5 };
    },

    /**
     * 实体提取 - 从消息中提取关键信息
     */
    extractEntities(message) {
        const entities = {};

        // 提取金额
        const amountMatch = message.match(/(\d+(?:\.\d+)?)\s*(元|万|块)/);
        if (amountMatch) {
            let amount = parseFloat(amountMatch[1]);
            if (amountMatch[2] === '万') amount *= 10000;
            entities.amount = amount;
        }

        // 提取项目ID
        const projectIdMatch = message.match(/项目\s*#?(\d+)/);
        if (projectIdMatch) {
            entities.projectId = projectIdMatch[1];
        }

        return entities;
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
     * 查询账户余额
     */
    async handleBalanceQuery(userData) {
        if (!userData) {
            return {
                message: `🔐 <strong>请先登录</strong><br><br>` +
                         `登录后可以查看：<br>` +
                         `• 账户余额<br>` +
                         `• 投资收益<br>` +
                         `• VIP等级<br>` +
                         `• 团队数据<br><br>`,
                requiresLogin: true,
                actionButtons: [
                    { text: '🔑 立即登录', link: 'login.html' },
                    { text: '📱 注册账号', link: 'register.html', type: 'secondary' }
                ]
            };
        }

        const totalAsset = parseFloat(userData.money || 0) + parseFloat(userData.ribao || 0);
        const totalProfit = parseFloat(userData.tfund || 0);

        // 人性化的回复语气
        const balance = parseFloat(userData.money || 0);
        const ribao = parseFloat(userData.ribao || 0);
        const profit = parseFloat(userData.tfund || 0);

        let greeting = '';
        if (balance > 100000) {
            greeting = '哇，您的账户余额很充足呢！';
        } else if (balance > 10000) {
            greeting = '您的账户状态不错哦~';
        } else if (balance > 0) {
            greeting = '您的账户余额正常。';
        } else {
            greeting = '您的账户余额较少，建议充值后开始投资。';
        }

        return {
            message: `${greeting}<br><br>` +
                     `💰 <strong>账户余额</strong>：<span style="color:#f04134;font-weight:700">¥${this.formatMoney(balance)}</span><br>` +
                     `💎 <strong>日利宝</strong>：¥${this.formatMoney(ribao)}<br>` +
                     `📊 <strong>总资产</strong>：<span style="color:#25d0a6;font-weight:700">¥${this.formatMoney(totalAsset)}</span><br>` +
                     `🎁 <strong>累计收益</strong>：<span style="color:#ff9800;font-weight:700">+¥${this.formatMoney(profit)}</span><br><br>` +
                     `👑 您当前是 <strong>VIP${userData.level || 1}</strong> 会员${profit > 0 ? '，收益不错呢！' : '，加油升级可以获得更多权益哦~'}`,
            data: {
                balance: userData.money,
                ribao: userData.ribao,
                totalAsset,
                totalProfit
            },
            actionButtons: [
                { text: '💳 立即充值', link: 'recharge.html' },
                { text: '🏦 立即提现', link: 'withdraw.html' },
                { text: '📊 我的投资', onclick: "quickAsk('我的投资')" },
                { text: '📈 推荐项目', onclick: "quickAsk('推荐项目')", type: 'secondary' },
                { text: '💎 日利宝', link: 'ribao.html', type: 'secondary' },
                { text: '👑 VIP升级', onclick: "quickAsk('VIP等级')", type: 'secondary' }
            ]
        };
    },

    /**
     * 查询投资项目
     */
    async handleInvestmentsQuery(context) {
        if (!context.isLoggedIn) {
            return {
                message: '请先登录查看投资记录',
                requiresLogin: true,
                // actionButton: {
                //     text: '🔑 立即登录',
                //     link: 'login.html'
                // }
            };
        }

        try {
            const response = await fetch(this.config.apiBase + '/api/project/list?page=1&limit=5', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                    // 'Token': context.token
                }
            });

            const data = await response.json();

            if (data.code === 1 || data.code === 200 && data.data && data.data.list) {
                const projects = data.data.list;

                if (projects.length === 0) {
                    return {
                        message: '您还没有投资项目呢~<br><br>可以前往项目页面看看，有很多不错的投资项目可以选择哦！开启您的财富增值之旅吧~',
                        hasData: false,
                        actionButtons: [
                            { text: '📈 查看项目', link: 'projects.html' },
                            { text: '🎓 新手指南', link: 'education.html', type: 'secondary' }
                        ]
                    };
                }

                // 人性化的开头
                let message = '';
                if (projects.length === 1) {
                    message = `看到您有一个投资项目呢~<br><br>`;
                } else if (projects.length > 1) {
                    message = `您目前有 <strong>${projects.length}个</strong> 投资项目，不错哦！<br><br>`;
                }
                message += `📊 <strong>投资项目详情</strong>：<br><br>`;

                projects.slice(0, 3).forEach((project, index) => {
                    const profit = parseFloat(project.profit || 0);
                    const status = project.status == 0 ? '📈 进行中' :
                                 project.status == 1 ? '✅ 已完成' : '⏸ 已暂停';

                    message += `<strong>${index + 1}. ${project.title}</strong><br>`;
                    message += `投资金额：¥${this.formatMoney(project.money)} | `;
                    message += `收益：<span style="color:#25d0a6;font-weight:700">+¥${this.formatMoney(profit)}</span><br>`;
                    message += `状态：${status}<br><br>`;
                });

                return {
                    message,
                    data: projects,
                    hasData: true,
                    actionButtons: [
                        { text: '📊 查看全部', link: 'my-investments.html' },
                        { text: '💰 继续投资', link: 'projects.html' },
                        { text: '📈 推荐项目', onclick: "quickAsk('推荐项目')", type: 'secondary' },
                        { text: '💳 充值', link: 'recharge.html', type: 'secondary' }
                    ]
                };
            } else if (data.code === 501) {
                return {
                    message: '🔐 <strong>登录已过期</strong><br><br>请稍后重试。',
                    // actionButton: {
                    //     text: '🔑 重新登录',
                    //     link: 'login.html'
                    // }
                };
            } else {
                return {
                    message: '📊 <strong>暂时无法获取投资数据</strong><br><br>可能原因：<br>• 您还没有投资项目<br>• 网络连接不稳定<br>• 服务器暂时繁忙<br><br>建议：',
                    actionButtons: [
                        { text: '📈 查看可投项目', link: 'projects.html' },
                        { text: '📊 推荐项目', onclick: "quickAsk('推荐项目')" },
                        { text: '💳 先去充值', link: 'recharge.html', type: 'secondary' },
                        { text: '🔄 刷新页面', link: 'javascript:location.reload()', type: 'secondary' }
                    ]
                };
            }
        } catch (error) {
            console.error('[AI] 查询投资失败:', error);
            return {
                message: '⚠️ <strong>网络连接失败</strong><br><br>无法连接到服务器，请检查：<br>• 网络连接是否正常<br>• 是否需要重新登录<br><br>您可以：',
                actionButtons: [
                    { text: '🔄 重试', link: 'javascript:location.reload()' }
                    // { text: '🔑 重新登录', link: 'login.html', type: 'secondary' }
                ]
            };
        }
    },

    /**
     * VIP信息查询
     */
    async handleVIPQuery(userData) {
        if (!userData) {
            return {
                message: '请先登录查看VIP等级信息',
                requiresLogin: true,
                // actionButton: {
                //     text: '🔑 立即登录',
                //     link: 'login.html'
                // }
            };
        }

        const currentLevel = parseInt(userData.level || 1);
        const nextLevel = currentLevel + 1;

        const vipBenefits = {
            1: { rate: '0.5%', amount: '3万', name: 'VIP1' },
            2: { rate: '1.0%', amount: '10万', name: 'VIP2' },
            3: { rate: '1.5%', amount: '25万', name: 'VIP3' },
            4: { rate: '2.0%', amount: '80万', name: 'VIP4' },
            5: { rate: '3.0%', amount: '150万', name: 'VIP5' },
            6: { rate: '4.0%', amount: '380万', name: 'VIP6' },
            7: { rate: '5.0%', amount: '800万', name: 'VIP7' },
            8: { rate: '8.0%', amount: '1300万', name: 'VIP8' }
        };

        const current = vipBenefits[currentLevel];
        const next = vipBenefits[nextLevel];

        // 人性化的VIP介绍
        const level = parseInt(userData.level || 1);
        let message = '';
        if (level >= 6) {
            message = `哇，您是 <strong>VIP${level}</strong> 高级会员呢！享受的权益很棒哦~<br><br>`;
        } else if (level >= 3) {
            message = `您是 <strong>VIP${level}</strong> 会员，等级不错！<br><br>`;
        } else {
            message = `您当前是 <strong>VIP${level}</strong> 会员，继续投资可以升级获得更多权益哦~<br><br>`;
        }
        message += `👑 <strong>VIP会员详情</strong>：<br><br>`;
        message += `当前等级：<strong style="color:#D9B45D">${current.name}</strong><br>`;
        message += `加息比例：<strong style="color:#f04134">+${current.rate}</strong><br>`;
        message += `累计投资：¥${this.formatMoney(userData.recharges || 0)}<br><br>`;

        if (next) {
            message += `📈 <strong>升级到${next.name}</strong><br>`;
            message += `需要累计投资：<span style="color:#ff9800;font-weight:700">${next.amount}</span><br>`;
            message += `加息比例：<span style="color:#f04134;font-weight:700">+${next.rate}</span>`;
        } else {
            message += `🎉 恭喜！您已是 <strong style="color:#D9B45D">最高等级会员</strong>！`;
        }

        return {
            message,
            actionButtons: [
                { text: '👑 VIP权益', link: 'vip-level.html' },
                { text: '💰 快速升级', link: 'recharge.html' },
                { text: '📊 推荐项目', onclick: "quickAsk('推荐项目')", type: 'secondary' },
                { text: '💳 立即充值', link: 'recharge.html', type: 'secondary' }
            ]
        };
    },

    /**
     * 团队信息查询
     */
    async handleTeamQuery(context) {
        if (!context.isLoggedIn) {
            return {
                message: '请先登录查看团队信息',
                requiresLogin: true,
                // actionButton: {
                //     text: '🔑 立即登录',
                //     link: 'login.html'
                // }
            };
        }

        try {
            const response = await fetch(this.config.apiBase + '/user/invite', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                    // 'Token': context.token
                }
            });

            const data = await response.json();

            if (data.code === 1 || data.code === 200 && data.data) {
                const inviteCode = data.data.invite || data.data.invite_code || data.data.code;
                const teamCount = data.data.team_count || 0;
                const teamInvest = data.data.team_invest || 0;

                // 人性化的团队介绍
                let message = '';
                if (teamCount === 0) {
                    message = `您还没有团队成员呢，邀请好友一起投资可以获得丰厚奖励哦~<br><br>`;
                } else if (teamCount < 5) {
                    message = `您的团队有 <strong>${teamCount}位</strong> 成员，继续努力邀请更多好友吧！<br><br>`;
                } else {
                    message = `太棒了！您的团队已经有 <strong>${teamCount}位</strong> 成员了，团队规模不错呢~<br><br>`;
                }
                message += `👥 <strong>团队信息</strong>：<br><br>`;
                message += `🎫 <strong>您的邀请码</strong>：<span style="color:#D9B45D;font-size:18px;font-weight:700">${inviteCode}</span><br>`;
                message += `👥 <strong>团队人数</strong>：<span style="color:#1890ff;font-weight:700">${teamCount}人</span><br>`;
                message += `💰 <strong>团队投资</strong>：<span style="color:#25d0a6;font-weight:700">¥${this.formatMoney(teamInvest)}</span><br><br>`;
                message += `💡 <strong>邀请奖励</strong>：邀请好友注册投资，您可获得 <span style="color:#f04134;font-weight:700">5%佣金奖励</span>，多邀请多收益哦~`;

                return {
                    message,
                    actionButtons: [
                        { text: '📱 分享邀请', link: 'invite-share.html' },
                        { text: '👥 团队详情', link: 'invite.html', type: 'secondary' },
                        { text: '🎁 领取奖励', link: 'team-rewards.html', type: 'secondary' }
                    ]
                };
            } else if (data.code === 501) {
                return {
                    message: '🔐 <strong>登录已过期</strong><br><br>请稍后重试。',
                    // actionButton: {
                    //     text: '🔑 重新登录',
                    //     link: 'login.html'
                    // }
                };
            } else {
                return {
                    message: '👥 <strong>暂时无法获取团队数据</strong><br><br>可能原因：<br>• 您还没有团队成员<br>• 网络连接不稳定<br><br>建议：',
                    actionButtons: [
                        { text: '📱 分享邀请', link: 'invite-share.html' },
                        { text: '🔄 刷新页面', link: 'javascript:location.reload()', type: 'secondary' }
                    ]
                };
            }
        } catch (error) {
            console.error('[AI] 查询团队失败:', error);
            return {
                message: '⚠️ <strong>网络连接失败</strong><br><br>无法连接到服务器，请稍后重试。',
                actionButtons: [
                    { text: '🔄 重试', link: 'javascript:location.reload()' },
                    { text: '👥 查看团队页面', link: 'invite.html', type: 'secondary' }
                ]
            };
        }
    },

    /**
     * 投资推荐AI - 基于VIP等级
     */
    async handleInvestmentRecommendation(userData) {
        if (!userData) {
            return {
                message: '请先登录以获取个性化投资推荐',
                requiresLogin: true,
                // actionButton: {
                //     text: '🔑 立即登录',
                //     link: 'login.html'
                // }
            };
        }

        const vipLevel = parseInt(userData.level) || 1;
        const balance = parseFloat(userData.money) || 0;

        // 人性化的推荐开头
        let message = '';
        if (balance > 100000) {
            message = `根据您的VIP等级（<strong>VIP${vipLevel}</strong>）和充足的余额（¥${this.formatMoney(balance)}），我为您精心挑选了这些项目：<br><br>`;
        } else if (balance > 10000) {
            message = `基于您的VIP等级（<strong>VIP${vipLevel}</strong>）和当前余额（¥${this.formatMoney(balance)}），我推荐这些适合您的项目：<br><br>`;
        } else {
            message = `您的余额（¥${this.formatMoney(balance)}）可以开始投资了！我为您推荐这些项目：<br><br>`;
        }
        message += `📊 <strong>投资推荐</strong>：<br><br>`;

        // 根据VIP等级推荐不同项目
        if (vipLevel >= 6) {
            message += `<div style="background:linear-gradient(135deg,rgba(201,169,97,0.15),rgba(201,169,97,0.05));padding:14px;border-radius:10px;border-left:4px solid #C9A961;margin:10px 0">`;
            message += `<strong style="color:#C9A961">🏆 VIP专属项目</strong><br>`;
            message += `<span style="font-size:14px;color:#333">• 年化收益率：15-25%<br>`;
            message += `• 最低投资额：10万元<br>`;
            message += `• 投资周期：90-365天<br>`;
            message += `• VIP${vipLevel}额外加息：${vipLevel * 0.5}%</span>`;
            message += `</div>`;
        } else if (vipLevel >= 3) {
            message += `<div style="background:rgba(25,144,255,0.08);padding:14px;border-radius:10px;border-left:4px solid #1890ff;margin:10px 0">`;
            message += `<strong style="color:#1890ff">💎 VIP优选项目</strong><br>`;
            message += `<span style="font-size:14px;color:#333">• 年化收益率：10-18%<br>`;
            message += `• 最低投资额：1万元<br>`;
            message += `• 投资周期：30-180天<br>`;
            message += `• VIP${vipLevel}加息：${vipLevel * 0.3}%</span>`;
            message += `</div>`;
        } else {
            message += `<div style="background:rgba(82,196,26,0.08);padding:14px;border-radius:10px;border-left:4px solid #52c41a;margin:10px 0">`;
            message += `<strong style="color:#52c41a">🌟 新手推荐项目</strong><br>`;
            message += `<span style="font-size:14px;color:#333">• 年化收益率：8-12%<br>`;
            message += `• 最低投资额：1000元<br>`;
            message += `• 投资周期：7-30天<br>`;
            message += `• 新手专享：额外2%加息</span>`;
            message += `</div>`;
        }

        message += `<br>💡 <strong>投资建议：</strong><br>`;
        if (balance < 1000) {
            message += `• 建议先充值到1000元以上，可投资更多优质项目<br>`;
            message += `• 首次投资建议选择短期项目（7-30天）<br>`;
        } else if (balance < 10000) {
            message += `• 建议分散投资2-3个不同周期的项目<br>`;
            message += `• 可尝试中短期项目（30-90天）<br>`;
        } else {
            message += `• 建议采用"核心+卫星"配置策略<br>`;
            message += `• 60%投资稳健型长期项目，40%投资高收益短期项目<br>`;
        }

        message += `• 定期关注项目到期，及时复投获得更高收益`;

        return {
            message,
            actionButtons: [
                { text: '📈 查看推荐项目', link: 'projects.html' },
                { text: '💰 立即投资', link: 'projects.html' },
                { text: '🎓 投资教程', link: 'guide-advisor.html', type: 'secondary' }
            ]
        };
    },

    /**
     * 找回密码智能引导
     */
    async handlePasswordReset(context) {
        // 检查用户是否已登录
        if (context.isLoggedIn) {
            return {
                message: `您已经登录了！如果要修改密码，请前往"个人中心 > 安全设置"页面。<br><br>` +
                         `💡 温馨提示：<br>` +
                         `• 定期修改密码可以提高账户安全性<br>` +
                         `• 建议使用包含字母、数字和符号的复杂密码<br>` +
                         `• 不要将密码告诉任何人`,
                actionButtons: [
                    { text: '🔐 安全设置', link: 'profile.html' },
                    { text: '❓ 其他问题', type: 'secondary', onclick: 'quickAsk(\'帮助\')' }
                ]
            };
        }

        // 未登录用户 - 提供找回密码选项
        return {
            message: `🔐 <strong>找回密码服务</strong><br><br>` +
                     `我们提供<strong>2种</strong>找回密码方式：<br><br>` +
                     `<div style="background:rgba(201,169,97,0.1);padding:12px;border-radius:8px;margin:8px 0">` +
                     `<strong style="color:#C9A961">🤖 AI智能找回</strong>（推荐）<br>` +
                     `<span style="font-size:13px;color:#666">通过我引导您完成身份验证和人脸识别，安全快速！</span>` +
                     `</div>` +
                     `<div style="background:rgba(14,43,68,0.05);padding:12px;border-radius:8px;margin:8px 0">` +
                     `<strong style="color:#0e2b44">👤 人脸识别找回</strong>（快速）<br>` +
                     `<span style="font-size:13px;color:#666">直接通过人脸识别验证身份，3步完成密码重置</span>` +
                     `</div>` +
                     `<br>⚠️ <strong>重要提示：</strong><br>` +
                     `• 需要先完成<strong>KYC实名认证</strong>才能使用人脸找回<br>` +
                     `• 请确保使用本人手机和证件照片<br>` +
                     `• 人脸识别需要良好的光线环境`,
            actionButtons: [
                { text: '🤖 AI智能找回', link: 'messages.html?intent=password_reset_guide' },
                { text: '👤 人脸识别找回', link: 'reset-password.html' },
                { text: '📋 更多选项', link: 'forgot.html', type: 'secondary' }
            ]
        };
    },

    /**
     * 找回密码智能引导
     */
    async handlePasswordReset(context) {
        // 检查用户是否已登录
        if (context.isLoggedIn) {
            return {
                message: `您已经登录了！如果要修改密码，请前往"个人中心 > 安全设置"页面。<br><br>` +
                         `💡 温馨提示：<br>` +
                         `• 定期修改密码可以提高账户安全性<br>` +
                         `• 建议使用包含字母、数字和符号的复杂密码<br>` +
                         `• 不要将密码告诉任何人`,
                actionButtons: [
                    { text: '🔐 安全设置', link: 'profile.html' },
                    { text: '❓ 其他问题', type: 'secondary', onclick: 'quickAsk(\'帮助\')' }
                ]
            };
        }

        // 未登录用户 - 提供找回密码选项
        return {
            message: `🔐 <strong>找回密码服务</strong><br><br>` +
                     `我们提供<strong>2种</strong>找回密码方式：<br><br>` +
                     `<div style="background:rgba(201,169,97,0.1);padding:12px;border-radius:8px;margin:8px 0">` +
                     `<strong style="color:#C9A961">🤖 AI智能找回</strong>（推荐）<br>` +
                     `<span style="font-size:13px;color:#666">通过我引导您完成身份验证和人脸识别，安全快速！</span>` +
                     `</div>` +
                     `<div style="background:rgba(14,43,68,0.05);padding:12px;border-radius:8px;margin:8px 0">` +
                     `<strong style="color:#0e2b44">👤 人脸识别找回</strong>（快速）<br>` +
                     `<span style="font-size:13px;color:#666">直接通过人脸识别验证身份，3步完成密码重置</span>` +
                     `</div>` +
                     `<br>⚠️ <strong>重要提示：</strong><br>` +
                     `• 需要先完成<strong>KYC实名认证</strong>才能使用人脸找回<br>` +
                     `• 请确保使用本人手机和证件照片<br>` +
                     `• 人脸识别需要良好的光线环境`,
            actionButtons: [
                { text: '🤖 AI智能找回', link: 'messages.html?intent=password_reset' },
                { text: '👤 人脸识别找回', link: 'reset-password.html' },
                { text: '📋 更多选项', link: 'forgot.html', type: 'secondary' }
            ]
        };
    },

    /**
     * 密码找回引导流程（专用模式）
     */
    async handlePasswordResetGuide(userMessage) {
        const msg = userMessage.toLowerCase();

        // 开始找回密码
        if (msg.match(/开始|我要找回|开始找回/)) {
            return {
                message: `好的！让我们开始找回密码流程 🚀<br><br>` +
                         `<strong>Step 1: 身份验证</strong><br><br>` +
                         `请提供您的<strong>账号</strong>以验证您的身份：<br><br>` +
                         `👤 <strong>用户名/账号</strong><br>` +
                         `<span style="font-size:13px;color:#666">（注册时使用的账号）</span><br><br>` +
                         `💡 <strong>温馨提示：</strong><br>` +
                         `为了保护您的隐私，我不会显示完整信息。验证成功后会跳转到人脸识别页面。`,
                actionButtons: [
                    { text: '👤 提供账号', onclick: 'chatInput.value=\'我的账号是 \';chatInput.focus()' }
                ]
            };
        }

        // 没有实名认证
        if (msg.match(/没有|未|不|实名|认证/)) {
            return {
                message: `😔 很抱歉，如果您没有完成<strong>KYC实名认证</strong>，无法使用人脸识别找回密码。<br><br>` +
                         `<strong>🔄 其他找回方式：</strong><br><br>` +
                         `1️⃣ <strong>联系客服</strong><br>` +
                         `通过在线客服人工审核找回密码<br>` +
                         `需要提供：账号、身份证号码<br><br>` +
                         `2️⃣ <strong>完成实名后使用人脸找回</strong><br>` +
                         `先完成KYC实名认证，然后使用人脸识别快速找回`,
                actionButtons: [
                    { text: '💬 联系客服', link: 'messages.html?intent=customer_service' },
                    { text: '🎯 去实名认证', link: 'kyc-verification.html', type: 'secondary' }
                ]
            };
        }

        // 检测用户输入的可能是账号
        if (msg.match(/账号|是/)) {
            // 提取可能的账号
            const accountMatch = userMessage.match(/[a-zA-Z0-9_]{4,20}/);

            if (accountMatch) {
                const identifier = accountMatch[0];

                // 脱敏显示
                let masked = identifier.substring(0, 2) + '****' + identifier.substring(identifier.length - 2);

                return {
                    message: `✅ 收到您的账号：<strong>${masked}</strong><br><br>` +
                             `<strong>🔍 正在验证...</strong><br><br>` +
                             `系统正在查询您的账户信息，请稍候...<br><br>` +
                             `⏳ 预计需要 3-5 秒`,
                    actionButtons: [
                        { text: '👤 进入人脸识别', link: 'reset-password.html?account=' + encodeURIComponent(identifier) },
                        { text: '🔄 重新输入', onclick: 'quickAsk(\'开始找回密码\')' }
                    ]
                };
            }
        }

        // 其他问题 - 帮助
        if (msg.match(/帮助|怎么|如何|什么|为什么/)) {
            return {
                message: `❓ <strong>找回密码常见问题</strong><br><br>` +
                         `<strong>Q1: 为什么需要人脸识别？</strong><br>` +
                         `A: 为了保护您的账户安全，防止他人冒用。<br><br>` +
                         `<strong>Q2: 没有实名认证怎么办？</strong><br>` +
                         `A: 可以联系客服人工审核或使用邮箱找回。<br><br>` +
                         `<strong>Q3: 人脸识别失败怎么办？</strong><br>` +
                         `A: 请确保光线充足，正对摄像头，多尝试几次。<br><br>` +
                         `<strong>Q4: 需要多长时间？</strong><br>` +
                         `A: 通常3-5分钟即可完成。`,
                actionButtons: [
                    { text: '🚀 继续找回密码', onclick: 'quickAsk(\'开始找回密码\')' },
                    { text: '💬 联系客服', link: 'messages.html', type: 'secondary' }
                ]
            };
        }

        // 默认回复
        return {
            message: `我理解您想找回密码。让我帮您：<br><br>` +
                     `💡 请选择以下操作：`,
            actionButtons: [
                { text: '🚀 开始找回密码', onclick: 'quickAsk(\'开始找回密码\')' },
                { text: '❓ 常见问题', onclick: 'quickAsk(\'帮助\')' },
                { text: '💬 联系客服', link: 'messages.html', type: 'secondary' }
            ]
        };
    },

    /**
     * 客服服务
     */
    async handleCustomerService() {
        return {
            message: `<div style="padding:6px 0">
<div style="font-size:17px;font-weight:700;margin-bottom:14px;color:#1a1a1a">
💬 <strong style="color:#1890ff">Providence 客户服务</strong>
</div>
<div style="font-size:15px;color:#333;line-height:1.8;margin-bottom:16px">
我可以帮您解决各类问题，请选择您遇到的问题类型：
</div>
<div style="background:rgba(25,144,255,0.1);padding:16px;border-radius:12px;margin:12px 0;border-left:4px solid #1890ff">
<div style="font-size:16px;font-weight:700;margin-bottom:8px;color:#1890ff">🔐 账户相关</div>
<div style="font-size:14px;color:#666">登录问题、密码找回、实名认证、账户安全</div>
</div>
<div style="background:rgba(82,196,26,0.1);padding:16px;border-radius:12px;margin:12px 0;border-left:4px solid #52c41a">
<div style="font-size:16px;font-weight:700;margin-bottom:8px;color:#52c41a">💰 资金相关</div>
<div style="font-size:14px;color:#666">充值未到账、提现审核、资金安全</div>
</div>
<div style="background:rgba(250,173,20,0.1);padding:16px;border-radius:12px;margin:12px 0;border-left:4px solid #faad14">
<div style="font-size:16px;font-weight:700;margin-bottom:8px;color:#faad14">📊 投资相关</div>
<div style="font-size:14px;color:#666">项目咨询、收益计算、投资指导</div>
</div>
<div style="background:rgba(245,34,45,0.1);padding:16px;border-radius:12px;margin:12px 0;border-left:4px solid #f5222d">
<div style="font-size:16px;font-weight:700;margin-bottom:8px;color:#f5222d">❗ 紧急情况</div>
<div style="font-size:14px;color:#666">账户被盗、异常交易、安全风险</div>
</div>
</div>`,
            actionButtons: [
                { text: '🔐 账户问题', onclick: 'quickAsk(\'账户无法登录\')' },
                { text: '💰 资金问题', onclick: 'quickAsk(\'充值未到账\')' },
                { text: '📊 投资咨询', onclick: 'quickAsk(\'推荐项目\')' },
                { text: '❗ 紧急求助', onclick: 'quickAsk(\'账户被盗\')' }
            ]
        };
    },

    /**
     * 账户安全警报
     */
    async handleSecurityAlert() {
        return {
            message: `<div style="padding:6px 0">
<div style="background:rgba(245,34,45,0.15);padding:18px;border-radius:12px;border:2px solid #f5222d;margin-bottom:16px">
<div style="font-size:18px;font-weight:700;margin-bottom:12px;color:#f5222d">
🚨 账户安全紧急处理
</div>
<div style="font-size:15px;color:#333;line-height:1.8">
如果您的账户出现安全问题，请立即采取以下措施：
</div>
</div>
<div style="background:rgba(245,34,45,0.08);padding:16px;border-radius:12px;margin:12px 0;border-left:4px solid #f5222d">
<div style="font-size:16px;font-weight:700;margin-bottom:8px;color:#f5222d">1️⃣ 立即修改密码</div>
<div style="font-size:14px;color:#666">如果账户可以登录，请立即修改登录密码和支付密码</div>
</div>
<div style="background:rgba(245,34,45,0.08);padding:16px;border-radius:12px;margin:12px 0;border-left:4px solid #f5222d">
<div style="font-size:16px;font-weight:700;margin-bottom:8px;color:#f5222d">2️⃣ 冻结账户</div>
<div style="font-size:14px;color:#666">如果无法登录或发现异常交易，立即联系客服冻结账户</div>
</div>
<div style="background:rgba(245,34,45,0.08);padding:16px;border-radius:12px;margin:12px 0;border-left:4px solid #f5222d">
<div style="font-size:16px;font-weight:700;margin-bottom:8px;color:#f5222d">3️⃣ 保留证据</div>
<div style="font-size:14px;color:#666">截图保存异常交易记录、登录日志等证据</div>
</div>
<div style="background:rgba(255,152,0,0.1);padding:14px;border-radius:10px;margin-top:16px;border-left:4px solid #ff9800">
<div style="font-size:15px;font-weight:700;margin-bottom:8px;color:#ff9800">⚠️ 平台安全承诺</div>
<div style="font-size:14px;color:#666;line-height:1.7">
• Providence采用银行级加密技术保护您的资金<br>
• 所有交易需要双重验证（密码+短信/人脸）<br>
• 如因平台原因导致损失，我们将全额赔付
</div>
</div>
</div>`,
            actionButtons: [
                { text: '🔒 立即修改密码', link: 'profile.html' },
                { text: '💬 联系客服冻结', onclick: 'quickAsk(\'立即冻结账户\')' },
                { text: '📞 紧急热线', onclick: 'alert(\'客服热线：400-XXX-XXXX（24小时）\')' }
            ]
        };
    },

    /**
     * 充值问题处理
     */
    async handleDepositIssue() {
        return {
            message: `<div style="padding:6px 0">
<div style="font-size:17px;font-weight:700;margin-bottom:14px;color:#1a1a1a">
💰 <strong style="color:#52c41a">充值问题处理</strong>
</div>
<div style="font-size:15px;color:#333;line-height:1.8;margin-bottom:16px">
如果您的充值未到账，请按以下步骤处理：
</div>
<div style="background:rgba(82,196,26,0.1);padding:16px;border-radius:12px;margin:12px 0;border-left:4px solid #52c41a">
<div style="font-size:16px;font-weight:700;margin-bottom:8px;color:#52c41a">1️⃣ 检查支付状态</div>
<div style="font-size:14px;color:#666">请确认支付是否成功（查看支付平台账单）</div>
</div>
<div style="background:rgba(82,196,26,0.1);padding:16px;border-radius:12px;margin:12px 0;border-left:4px solid #52c41a">
<div style="font-size:16px;font-weight:700;margin-bottom:8px;color:#52c41a">2️⃣ 等待处理时间</div>
<div style="font-size:14px;color:#666">正常情况下充值1-10分钟到账，银行转账可能需要2-24小时</div>
</div>
<div style="background:rgba(82,196,26,0.1);padding:16px;border-radius:12px;margin:12px 0;border-left:4px solid #52c41a">
<div style="font-size:16px;font-weight:700;margin-bottom:8px;color:#52c41a">3️⃣ 联系客服</div>
<div style="font-size:14px;color:#666">如超过24小时未到账，请提供充值凭证联系客服</div>
</div>
<div style="background:rgba(25,144,255,0.1);padding:14px;border-radius:10px;margin-top:16px;border-left:4px solid #1890ff">
<div style="font-size:15px;font-weight:700;margin-bottom:8px;color:#1890ff">💡 温馨提示</div>
<div style="font-size:14px;color:#666;line-height:1.7">
• 请勿向个人账户转账<br>
• 仅通过平台官方渠道充值<br>
• 保留好充值凭证（截图/订单号）
</div>
</div>
</div>`,
            actionButtons: [
                { text: '💳 查看充值记录', link: 'records.html' },
                { text: '💬 联系客服', onclick: 'quickAsk(\'充值凭证\')' },
                { text: '📖 充值教程', link: 'guide-advisor.html' }
            ]
        };
    },

    /**
     * 提现问题处理
     */
    async handleWithdrawIssue() {
        return {
            message: `<div style="padding:6px 0">
<div style="font-size:17px;font-weight:700;margin-bottom:14px;color:#1a1a1a">
🏦 <strong style="color:#faad14">提现问题处理</strong>
</div>
<div style="font-size:15px;color:#333;line-height:1.8;margin-bottom:16px">
提现审核流程说明：
</div>
<div style="background:rgba(250,173,20,0.1);padding:16px;border-radius:12px;margin:12px 0;border-left:4px solid #faad14">
<div style="font-size:16px;font-weight:700;margin-bottom:8px;color:#faad14">1️⃣ 审核时间</div>
<div style="font-size:14px;color:#666">工作日：1-4小时 | 节假日：4-24小时</div>
</div>
<div style="background:rgba(250,173,20,0.1);padding:16px;border-radius:12px;margin:12px 0;border-left:4px solid #faad14">
<div style="font-size:16px;font-weight:700;margin-bottom:8px;color:#faad14">2️⃣ 到账时间</div>
<div style="font-size:14px;color:#666">审核通过后1-2小时到账（银行处理时间）</div>
</div>
<div style="background:rgba(250,173,20,0.1);padding:16px;border-radius:12px;margin:12px 0;border-left:4px solid #faad14">
<div style="font-size:16px;font-weight:700;margin-bottom:8px;color:#faad14">3️⃣ 可能原因</div>
<div style="font-size:14px;color:#666">未实名认证、银行卡信息错误、金额不符合规则</div>
</div>
<div style="background:rgba(245,34,45,0.1);padding:14px;border-radius:10px;margin-top:16px;border-left:4px solid #f5222d">
<div style="font-size:15px;font-weight:700;margin-bottom:8px;color:#f5222d">⚠️ 安全提示</div>
<div style="font-size:14px;color:#666;line-height:1.7">
• 提现仅能到本人实名认证的银行卡<br>
• 首次提现需完成KYC实名认证<br>
• 如遇提现问题，请勿相信任何"客服"要求转账
</div>
</div>
</div>`,
            actionButtons: [
                { text: '📝 查看提现记录', link: 'records.html' },
                { text: '🏦 立即提现', link: 'withdraw.html' },
                { text: '💬 咨询进度', onclick: 'quickAsk(\'提现进度查询\')' },
                { text: '🎯 去实名认证', link: 'kyc-verification.html', type: 'secondary' }
            ]
        };
    },

    /**
     * 充值引导
     */
    async handleDepositAction(userData) {
        if (!userData) {
            return {
                message: '请先登录进行充值',
                requiresLogin: true,
                // actionButton: {
                //     text: '🔑 立即登录',
                //     link: 'login.html'
                // }
            };
        }

        return {
            message: `💳 <strong>充值指南</strong><br><br>` +
                     `<strong>1️⃣ 选择充值方式</strong><br>` +
                     `支持银行卡、支付宝、微信支付<br><br>` +
                     `<strong>2️⃣ 输入充值金额</strong><br>` +
                     `最低充值100元<br><br>` +
                     `<strong>3️⃣ 完成支付</strong><br>` +
                     `充值即时到账，开始投资理财！`,
            actionButtons: [
                { text: '💳 立即充值', link: 'recharge.html' },
                { text: '📞 联系客服', link: 'messages.html', type: 'secondary' }
            ]
        };
    },

    /**
     * 充值提现操作指导（综合）
     */
    async handleDepositWithdrawGuide(userData) {
        if (!userData) {
            return {
                message: '请先登录查看充值提现操作指导',
                requiresLogin: true,
                actionButtons: [
                    { text: '🔑 立即登录', link: 'login.html' }
                ]
            };
        }

        const balance = parseFloat(userData.money || 0);

        return {
            message: `<div style="padding:6px 0">
<div style="font-size:18px;font-weight:700;margin-bottom:16px;color:#1a1a1a">
💳 <strong style="color:#1890ff">充值提现操作指导</strong>
</div>
<div style="font-size:15px;color:#333;line-height:1.8;margin-bottom:20px">
当前余额：<span style="color:#25d0a6;font-weight:700;font-size:16px">¥${this.formatMoney(balance)}</span>
</div>

<div style="background:rgba(25,144,255,0.1);padding:16px;border-radius:12px;margin:12px 0;border-left:4px solid #1890ff">
<div style="font-size:16px;font-weight:700;margin-bottom:10px;color:#1890ff">💳 充值操作</div>
<div style="font-size:14px;color:#666;line-height:1.8">
<strong>1️⃣ 选择充值方式</strong><br>
支持银行卡、支付宝、微信支付、USDT<br><br>
<strong>2️⃣ 输入充值金额</strong><br>
最低充值100元<br><br>
<strong>3️⃣ 完成支付</strong><br>
充值即时到账，开始投资理财！
</div>
</div>

<div style="background:rgba(250,173,20,0.1);padding:16px;border-radius:12px;margin:12px 0;border-left:4px solid #faad14">
<div style="font-size:16px;font-weight:700;margin-bottom:10px;color:#faad14">🏦 提现操作</div>
<div style="font-size:14px;color:#666;line-height:1.8">
<strong>1️⃣ 绑定银行卡</strong><br>
首次提现需完成KYC实名认证<br><br>
<strong>2️⃣ 输入提现金额</strong><br>
最低提现100元<br><br>
<strong>3️⃣ 输入支付密码</strong><br>
提交申请后1-4小时审核，审核通过后1-2小时到账
</div>
</div>

<div style="background:rgba(82,196,26,0.1);padding:14px;border-radius:10px;margin-top:16px;border-left:4px solid #52c41a">
<div style="font-size:15px;font-weight:700;margin-bottom:8px;color:#52c41a">💡 温馨提示</div>
<div style="font-size:14px;color:#666;line-height:1.7">
• 充值即时到账，提现需审核<br>
• 仅通过平台官方渠道操作<br>
• 保留好操作凭证（截图/订单号）<br>
• 如遇问题，及时联系客服
</div>
</div>
</div>`,
            actionButtons: [
                { text: '💳 立即充值', link: 'recharge.html' },
                { text: '🏦 立即提现', link: 'withdraw.html' },
                { text: '💳 银行卡管理', link: 'bank-cards.html', type: 'secondary' },
                { text: '💬 联系客服', onclick: 'quickAsk(\'联系客服\')', type: 'secondary' }
            ]
        };
    },

    /**
     * 提现引导
     */
    async handleWithdrawAction(userData) {
        if (!userData) {
            return {
                message: '请先登录进行提现',
                requiresLogin: true,
                // actionButton: {
                //     text: '🔑 立即登录',
                //     link: 'login.html'
                // }
            };
        }

        const balance = parseFloat(userData.money || 0);

        return {
            message: `💰 <strong>提现指南</strong><br><br>` +
                     `当前余额：<span style="color:#25d0a6;font-weight:700">¥${this.formatMoney(balance)}</span><br><br>` +
                     `<strong>提现流程：</strong><br>` +
                     `1️⃣ 绑定银行卡<br>` +
                     `2️⃣ 输入提现金额<br>` +
                     `3️⃣ 输入支付密码<br>` +
                     `4️⃣ 提交申请<br><br>` +
                     `⏱ <strong>到账时间：</strong>24小时内`,
            actionButtons: [
                { text: '🏦 立即提现', link: 'withdraw.html' },
                { text: '💳 银行卡管理', link: 'bank-cards.html' },
                { text: '💰 我的余额', onclick: "quickAsk('我的余额')", type: 'secondary' },
                { text: '💬 联系客服', onclick: "quickAsk('联系客服')", type: 'secondary' }
            ]
        };
    },

    /**
     * 问候回复
     */
    async handleGreeting(context) {
        const userName = context.userName || '';
        const userId = context.userId || '';
        const greeting = userName ? `您好，${userName}！` : '您好！';

        // 根据时间生成更自然的问候
        const hour = new Date().getHours();
        let timeGreeting = '';
        if (hour < 6) timeGreeting = '这么晚还在，注意休息哦~';
        else if (hour < 9) timeGreeting = '早上好';
        else if (hour < 12) timeGreeting = '上午好';
        else if (hour < 14) timeGreeting = '中午好';
        else if (hour < 18) timeGreeting = '下午好';
        else if (hour < 22) timeGreeting = '晚上好';
        else timeGreeting = '晚上好，注意休息~';

        return {
            message: `${timeGreeting}${userName ? '，' + userName : ''}！我是您的专属AI金融顾问 😊<br><br>` +
                     `我可以帮您处理各种金融业务，请选择您需要的服务：`,
            actionButtons: [
                { text: '💰 我的余额', onclick: "quickAsk('我的余额')" },
                { text: '📊 我的投资', onclick: "quickAsk('我的投资')" },
                { text: '👑 VIP等级', onclick: "quickAsk('VIP等级')" },
                { text: '👥 我的团队', onclick: "quickAsk('我的团队')" },
                { text: '💳 充值提现', onclick: "quickAsk('充值提现操作指导')", type: 'secondary' },
                { text: '📈 推荐项目', onclick: "quickAsk('推荐项目')", type: 'secondary' },
                { text: '💎 日利宝', link: 'ribao.html', type: 'secondary' },
                { text: '📚 金融知识', onclick: "quickAsk('什么是基金')", type: 'secondary' },
                { text: '💬 联系客服', onclick: "quickAsk('联系客服')", type: 'secondary' },
                { text: '🔐 账户安全', onclick: "quickAsk('账户安全')", type: 'secondary' }
            ]
        };
    },

    /**
     * 帮助信息
     */
    async handleHelp() {
        return {
            message: `📚 <strong>Providence AI 帮助中心</strong><br><br>` +
                     `<strong>💰 账户查询</strong><br>` +
                     `"我的余额" "账户信息" "总资产"<br><br>` +
                     `<strong>📊 投资查询</strong><br>` +
                     `"我的投资" "收益情况" "项目列表"<br><br>` +
                     `<strong>👑 VIP查询</strong><br>` +
                     `"VIP等级" "会员权益" "如何升级"<br><br>` +
                     `<strong>👥 团队查询</strong><br>` +
                     `"我的团队" "邀请码" "推广奖励"<br><br>` +
                     `<strong>📚 金融知识</strong><br>` +
                     `"什么是基金" "IPO是什么" "如何投资"<br><br>` +
                     `💡 <em>直接输入问题即可，我会智能识别您的需求！</em>`,
            actionButtons: [
                { text: '💰 查余额', link: 'javascript:void(0)', onclick: "quickAsk('我的余额')" },
                { text: '📊 查投资', link: 'javascript:void(0)', onclick: "quickAsk('我的投资')" },
                { text: '👑 查VIP', link: 'javascript:void(0)', onclick: "quickAsk('VIP等级')", type: 'secondary' },
                { text: '📚 金融知识', link: 'javascript:void(0)', onclick: "quickAsk('什么是基金')", type: 'secondary' }
            ]
        };
    },

    /**
     * 关于公司
     */
    async handleAboutCompany() {
        return {
            message: `✨ <strong>星空锁屏 - 动态壁纸应用</strong><br><br>` +
                     `<strong>应用简介</strong><br>` +
                     `星空锁屏是一款专业的移动端动态壁纸应用，为您的手机带来梦幻般的星空视觉体验。我们采用先进的HTML5动画技术，打造流畅自然的粒子效果，让每一次点亮屏幕都成为一次美的享受。<br><br>` +
                     `<strong>🎯 核心功能</strong><br>` +
                     `🌟 <strong>动态星空</strong>：150+星光粒子实时渲染<br>` +
                     `💫 <strong>多层光效</strong>：三层渐变光晕叠加<br>` +
                     `🎨 <strong>个性化</strong>：自定义品牌文字显示<br>` +
                     `📱 <strong>完美适配</strong>：支持所有主流手机品牌<br><br>` +
                     `<strong>📊 技术优势</strong><br>` +
                     `• 60fps流畅动画<br>` +
                     `• 硬件加速渲染<br>` +
                     `• 零数据收集，隐私安全<br>` +
                     `• 轻量级设计，性能优异`,
            actionButtons: [
                { text: '📱 了解更多', link: 'guide.html' },
                { text: '🎨 查看功能', link: 'projects.html' },
                { text: '✨ 开始使用', link: 'recharge.html', type: 'secondary' }
            ]
        };
    },

    /**
     * 安全相关
     */
    async handleSecurity() {
        return {
            message: `🔒 <strong>账户安全</strong><br><br>` +
                     `<strong>我们的安全措施：</strong><br><br>` +
                     `🛡️ <strong>实名认证</strong><br>` +
                     `完善的KYC认证流程，保障账户安全<br><br>` +
                     `🔐 <strong>支付密码</strong><br>` +
                     `资金操作需要支付密码双重验证<br><br>` +
                     `💳 <strong>银行级加密</strong><br>` +
                     `所有数据传输采用SSL加密<br><br>` +
                     `📱 <strong>实时监控</strong><br>` +
                     `24小时系统监控，异常交易即时提醒`,
            actionButtons: [
                { text: '✅ 实名认证', link: 'kyc-verification.html' },
                { text: '🔐 设置密码', link: 'reset-password.html' },
                { text: '💳 银行卡管理', link: 'bank-cards.html' },
                { text: '💰 我的余额', onclick: "quickAsk('我的余额')", type: 'secondary' },
                { text: '💬 联系客服', onclick: "quickAsk('联系客服')", type: 'secondary' }
            ]
        };
    },

    /**
     * 客服联系 - 增强版
     */
    async handleCustomerService() {
        return {
            message: `<div style="padding:6px 0">
<div style="font-size:17px;font-weight:700;margin-bottom:14px;color:#1a1a1a">
💬 <strong style="color:#1890ff">Providence 客户服务</strong>
</div>
<div style="font-size:15px;color:#333;line-height:1.8;margin-bottom:16px">
我可以帮您解决各类问题，请选择您遇到的问题类型：
</div>
<div style="background:rgba(25,144,255,0.1);padding:16px;border-radius:12px;margin:12px 0;border-left:4px solid #1890ff">
<div style="font-size:16px;font-weight:700;margin-bottom:8px;color:#1890ff">🔐 账户相关</div>
<div style="font-size:14px;color:#666">登录问题、密码找回、实名认证、账户安全</div>
</div>
<div style="background:rgba(82,196,26,0.1);padding:16px;border-radius:12px;margin:12px 0;border-left:4px solid #52c41a">
<div style="font-size:16px;font-weight:700;margin-bottom:8px;color:#52c41a">💰 资金相关</div>
<div style="font-size:14px;color:#666">充值未到账、提现审核、资金安全</div>
</div>
<div style="background:rgba(250,173,20,0.1);padding:16px;border-radius:12px;margin:12px 0;border-left:4px solid #faad14">
<div style="font-size:16px;font-weight:700;margin-bottom:8px;color:#faad14">📊 投资相关</div>
<div style="font-size:14px;color:#666">项目咨询、收益计算、投资指导</div>
</div>
<div style="background:rgba(245,34,45,0.1);padding:16px;border-radius:12px;margin:12px 0;border-left:4px solid #f5222d">
<div style="font-size:16px;font-weight:700;margin-bottom:8px;color:#f5222d">❗ 紧急情况</div>
<div style="font-size:14px;color:#666">账户被盗、异常交易、安全风险</div>
</div>
</div>`,
            actionButtons: [
                { text: '🔐 账户问题', onclick: 'quickAsk(\'账户无法登录\')' },
                { text: '💰 资金问题', onclick: 'quickAsk(\'充值未到账\')' },
                { text: '📊 投资咨询', onclick: 'quickAsk(\'推荐项目\')' },
                { text: '❗ 紧急求助', onclick: 'quickAsk(\'账户被盗\')' }
            ]
        };
    },

    /**
     * 感谢回复
     */
    async handleThanks() {
        const replies = [
            '不客气呀~ 能帮到您我很开心 😊',
            '哈哈，不用谢！有什么问题随时找我~',
            '客气啥，这是我应该做的！还有其他需要吗？',
            '能帮到您就好！随时为您服务 👍',
            '不客气~ 很高兴能帮到您，还有什么问题吗？'
        ];

        const reply = replies[Math.floor(Math.random() * replies.length)];

        return {
            message: `${reply}<br><br>我还可以帮您：`,
            actionButtons: [
                { text: '💰 我的余额', onclick: "quickAsk('我的余额')" },
                { text: '📊 我的投资', onclick: "quickAsk('我的投资')" },
                { text: '👑 VIP等级', onclick: "quickAsk('VIP等级')" },
                { text: '👥 我的团队', onclick: "quickAsk('我的团队')" },
                { text: '📈 推荐项目', onclick: "quickAsk('推荐项目')", type: 'secondary' },
                { text: '💳 充值提现', onclick: "quickAsk('充值提现操作指导')", type: 'secondary' }
            ]
        };
    },

    /**
     * 未知意图处理
     */
    async handleUnknown(message) {
        // 更友好的未知意图回复
        const friendlyReplies = [
            `哎呀，我可能没太理解您的意思呢 😅<br><br>不过没关系，我可以帮您：`,
            `嗯...这个问题我可能回答不了，但我可以帮您做这些：`,
            `抱歉，这个问题我暂时回答不了呢~ 不过我可以帮您：`
        ];
        const randomReply = friendlyReplies[Math.floor(Math.random() * friendlyReplies.length)];

        return {
            message: `${randomReply}<br><br>` +
                     `💰 查询账户余额和资产<br>` +
                     `📊 查看投资项目和收益<br>` +
                     `👑 了解VIP等级权益<br>` +
                     `👥 查询团队邀请信息<br>` +
                     `💳 充值提现操作指导<br>` +
                     `📚 金融知识专业解答<br>` +
                     `🔒 账户安全设置<br>` +
                     `👨‍💼 联系客服支持<br><br>` +
                     `或者您可以试试下面的快捷问题：`,
            actionButtons: [
                { text: '🏢 公司介绍', link: 'javascript:void(0)', onclick: "quickAsk('介绍一下公司')" },
                { text: '💰 我的余额', link: 'javascript:void(0)', onclick: "quickAsk('我的余额')" },
                { text: '📚 什么是基金', link: 'javascript:void(0)', onclick: "quickAsk('什么是基金')" },
                { text: '❓ 帮助中心', link: 'javascript:void(0)', onclick: "quickAsk('帮助')", type: 'secondary' }
            ]
        };
    },

    /**
     * 主处理函数（集成智能对话系统）
     */
    async processMessage(userMessage) {
// console.log('[AI本地] 处理消息:', userMessage); // 性能优化：已注释

        // 检查是否是密码找回专用模式
        const isPasswordResetMode = window.AI_MODE === 'password_reset_only';

        if (isPasswordResetMode) {
            // 密码找回专用模式 - 限制功能
// console.log('[AI本地] 🔐 密码找回专用模式'); // 性能优化：已注释

            // 只允许密码找回相关的请求
            if (!userMessage.match(/开始|实名|认证|kyc|人脸|找回|密码|账号|手机号|验证|帮助|你好|谢谢/i)) {
                return {
                    message: `抱歉，我当前处于<strong>密码找回专用模式</strong> 🔐<br><br>` +
                             `我只能帮您找回密码，无法处理其他请求。<br><br>` +
                             `如需使用其他功能，请：<br>` +
                             `• 完成密码找回后登录<br>` +
                             `• 或返回首页访问完整AI服务`,
                    actionButtons: [
                        { text: '🚀 继续找回密码', onclick: 'quickAsk(\'开始找回密码\')' },
                        { text: '🏠 返回首页', link: 'index.html', type: 'secondary' }
                    ]
                };
            }

            // 处理密码找回相关请求
            return await this.handlePasswordResetGuide(userMessage);
        }
        // 正常模式 - 原有逻辑
        // 获取用户上下文
        const context = await this.getUserContext();
        const userData = await this.getUserData();
        // 如果userData为null，返回提示信息而不是null
        if (!userData) {
            return {
                message: '请先登录后使用AI服务。',
                actionButtons: [
                    { text: '🔐 去登录', link: 'login.html', type: 'primary' }
                ]
            };
        }

        // 使用智能对话系统处理消息
        if (window.ProvidenceSmartConversation && typeof window.ProvidenceSmartConversation.processMessage === 'function') {
            try {
                return await window.ProvidenceSmartConversation.processMessage(userMessage, userData);
            } catch (error) {
                console.error('[AI本地] 智能对话系统处理失败，降级到基础处理:', error);
                // 降级到基础处理
            }
        }

        // 降级：使用基础处理
        try {
            const intent = this.identifyIntent(userMessage);

            // 处理充值提现操作指导
            if (intent && intent.type === 'deposit_withdraw_guide') {
                return await this.handleDepositWithdrawGuide(userData);
            }

            // 其他意图通过智能对话系统处理
            if (window.ProvidenceSmartConversation && typeof window.ProvidenceSmartConversation.handleIntent === 'function') {
                return await window.ProvidenceSmartConversation.handleIntent(intent, userData);
            }

            // 最终降级：返回未知意图处理
            return await this.handleUnknown(userMessage);
        } catch (error) {
            console.error('[AI本地] 基础处理也失败:', error);
            // 最终降级：返回未知意图处理
            return await this.handleUnknown(userMessage);
        }
    }
};

// 暴露到全局
window.AIService = AIService;

// console.log('[AI本地] Providence AI本地服务已加载'); // 性能优化：已注释
