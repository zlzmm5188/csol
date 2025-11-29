/**
 * Providence AI 金融知识库
 * 版本: 1.0
 * 创建时间: 2025-10-28
 */

const AI_KNOWLEDGE_BASE = {

    /**
     * 基金知识
     */
    funds: {
        basic: {
            title: '📚 什么是基金？',
            content: `<strong>基金（Fund）</strong>是一种集合投资方式，通过汇集众多投资者的资金，由专业的基金管理人进行统一投资管理。<br><br>` +
                     `<strong>🎯 基金的优势：</strong><br>` +
                     `💼 <strong>专业管理</strong>：由经验丰富的基金经理操作<br>` +
                     `📊 <strong>分散风险</strong>：投资多个项目，降低单一风险<br>` +
                     `💰 <strong>门槛低</strong>：100元起投，适合各类投资者<br>` +
                     `🔄 <strong>流动性好</strong>：随时申购赎回<br><br>` +
                     `<strong>📈 收益方式：</strong><br>` +
                     `• 价格上涨收益<br>` +
                     `• 分红收益<br>` +
                     `• 复利增长`,
            buttons: [
                { text: '📈 查看基金产品', link: 'projects.html' },
                { text: '💰 开始投资', link: 'recharge.html', type: 'secondary' }
            ]
        },

        types: {
            title: '📊 基金有哪些类型？',
            content: `<strong>基金分类（按投资标的）：</strong><br><br>` +
                     `<strong>1️⃣ 股票型基金</strong><br>` +
                     `• 投资于股票市场<br>` +
                     `• 收益高，风险较高<br>` +
                     `• 年化收益：8%-15%<br>` +
                     `• 适合：风险承受能力强的投资者<br><br>` +
                     `<strong>2️⃣ 债券型基金</strong><br>` +
                     `• 投资于债券市场<br>` +
                     `• 收益稳定，风险较低<br>` +
                     `• 年化收益：4%-8%<br>` +
                     `• 适合：稳健型投资者<br><br>` +
                     `<strong>3️⃣ 混合型基金</strong><br>` +
                     `• 同时投资股票和债券<br>` +
                     `• 风险收益平衡<br>` +
                     `• 年化收益：6%-12%<br>` +
                     `• 适合：追求稳健收益的投资者<br><br>` +
                     `<strong>4️⃣ 货币型基金</strong><br>` +
                     `• 投资于短期货币工具<br>` +
                     `• 风险极低，流动性强<br>` +
                     `• 年化收益：2%-4%<br>` +
                     `• 适合：现金管理`,
            buttons: [
                { text: '📈 查看产品', link: 'projects.html' },
                { text: '💡 投资建议', link: '#', onclick: "quickAsk('投资建议')" }
            ]
        },

        risks: {
            title: '⚠️ 基金投资风险',
            content: `<strong>投资基金需要注意的风险：</strong><br><br>` +
                     `<strong>1️⃣ 市场风险</strong><br>` +
                     `市场价格波动可能导致本金损失<br><br>` +
                     `<strong>2️⃣ 流动性风险</strong><br>` +
                     `特定时期可能无法及时赎回<br><br>` +
                     `<strong>3️⃣ 管理风险</strong><br>` +
                     `基金经理决策可能影响收益<br><br>` +
                     `<strong>🛡️ 风险控制建议：</strong><br>` +
                     `• 分散投资，不要把鸡蛋放在一个篮子里<br>` +
                     `• 长期持有，避免短期波动<br>` +
                     `• 定期检查，及时调整投资组合<br>` +
                     `• 根据自身风险承受能力选择产品`,
            buttons: [
                { text: '📊 风险评估', link: 'kyc-verification.html' },
                { text: '💰 稳健产品', link: 'projects.html', type: 'secondary' }
            ]
        }
    },

    /**
     * 私募知识
     */
    privateFund: {
        basic: {
            title: '🔐 什么是私募基金？',
            content: `<strong>私募基金</strong>是面向特定投资者非公开发行的基金产品。<br><br>` +
                     `<strong>🎯 私募基金特点：</strong><br><br>` +
                     `<strong>1️⃣ 投资门槛高</strong><br>` +
                     `• 起投金额：100万元起<br>` +
                     `• 适合高净值客户<br><br>` +
                     `<strong>2️⃣ 投资策略灵活</strong><br>` +
                     `• 可投资多种金融工具<br>` +
                     `• 策略更加灵活多样<br><br>` +
                     `<strong>3️⃣ 收益潜力大</strong><br>` +
                     `• 年化收益可达15%-30%<br>` +
                     `• 超额收益分成机制<br><br>` +
                     `<strong>4️⃣ 锁定期较长</strong><br>` +
                     `• 通常锁定6-12个月<br>` +
                     `• 封闭式运作，不可随时赎回`,
            buttons: [
                { text: '🔐 高端项目', link: 'projects.html' },
                { text: '👑 VIP专享', link: 'vip-level.html', type: 'secondary' }
            ]
        },

        vs_public: {
            title: '🆚 私募 vs 公募',
            content: `<strong>私募基金 vs 公募基金对比：</strong><br><br>` +
                     `<strong>📊 投资门槛</strong><br>` +
                     `• 私募：100万元起<br>` +
                     `• 公募：100元起 ✅ 更亲民<br><br>` +
                     `<strong>👥 投资者范围</strong><br>` +
                     `• 私募：特定投资者（≤200人）<br>` +
                     `• 公募：所有投资者 ✅ 更广泛<br><br>` +
                     `<strong>💰 收益预期</strong><br>` +
                     `• 私募：15%-30%（高收益高风险）<br>` +
                     `• 公募：6%-12%（稳健收益）✅ 更稳健<br><br>` +
                     `<strong>🔄 流动性</strong><br>` +
                     `• 私募：锁定期6-12个月<br>` +
                     `• 公募：随时赎回 ✅ 更灵活<br><br>` +
                     `<strong>📢 信息披露</strong><br>` +
                     `• 私募：仅向投资者披露<br>` +
                     `• 公募：定期公开披露 ✅ 更透明`,
            buttons: [
                { text: '📈 查看产品', link: 'projects.html' },
                { text: '💡 投资建议', link: '#', onclick: "quickAsk('投资建议')" }
            ]
        }
    },

    /**
     * IPO知识
     */
    ipo: {
        basic: {
            title: '🚀 什么是IPO？',
            content: `<strong>IPO（Initial Public Offering）</strong>即首次公开募股，是指一家企业第一次向公众发行股票。<br><br>` +
                     `<strong>🎯 IPO投资特点：</strong><br><br>` +
                     `<strong>1️⃣ 高收益潜力</strong><br>` +
                     `• 上市首日涨幅可达44%（创业板）<br>` +
                     `• 新股中签率虽低但收益可观<br><br>` +
                     `<strong>2️⃣ 申购门槛</strong><br>` +
                     `• 科创板/创业板：10万元证券资产<br>` +
                     `• 主板：无资产要求<br>` +
                     `• Providence平台：1万元起 ✅<br><br>` +
                     `<strong>3️⃣ 投资周期</strong><br>` +
                     `• 申购到上市：通常2-4周<br>` +
                     `• 锁定期：视具体项目而定<br><br>` +
                     `<strong>📊 板块区别：</strong><br>` +
                     `• <strong>主板</strong>：成熟企业，风险较低<br>` +
                     `• <strong>科创板</strong>：科技创新，高成长性<br>` +
                     `• <strong>创业板</strong>：创业型企业，高风险高收益`,
            buttons: [
                { text: '🚀 IPO项目', link: 'projects.html' },
                { text: '📈 申购指南', link: '#', onclick: "quickAsk('如何申购IPO')" }
            ]
        },

        process: {
            title: '📋 IPO申购流程',
            content: `<strong>Providence IPO申购流程：</strong><br><br>` +
                     `<strong>步骤1️⃣：查看项目</strong><br>` +
                     `• 浏览IPO项目列表<br>` +
                     `• 查看公司基本信息、发行价格、申购日期<br><br>` +
                     `<strong>步骤2️⃣：账户准备</strong><br>` +
                     `• 确保账户有足够余额<br>` +
                     `• 完成实名认证<br><br>` +
                     `<strong>步骤3️⃣：提交申购</strong><br>` +
                     `• 选择申购数量<br>` +
                     `• 冻结申购资金<br><br>` +
                     `<strong>步骤4️⃣：中签公布</strong><br>` +
                     `• 通常T+2日公布中签结果<br>` +
                     `• 未中签资金自动解冻<br><br>` +
                     `<strong>步骤5️⃣：上市交易</strong><br>` +
                     `• 股票上市后可自由交易<br>` +
                     `• 或持有等待收益`,
            buttons: [
                { text: '🚀 查看IPO', link: 'projects.html' },
                { text: '💰 立即申购', link: 'recharge.html', type: 'secondary' }
            ]
        }
    },

    /**
     * 国债知识
     */
    bonds: {
        basic: {
            title: '🏛️ 什么是国债？',
            content: `<strong>国债（Government Bond）</strong>是国家发行的债券，被认为是最安全的投资品种之一。<br><br>` +
                     `<strong>🎯 国债特点：</strong><br><br>` +
                     `<strong>1️⃣ 安全性极高</strong><br>` +
                     `• 国家信用担保 🛡️<br>` +
                     `• 本金安全有保障<br>` +
                     `• 适合保守型投资者<br><br>` +
                     `<strong>2️⃣ 收益稳定</strong><br>` +
                     `• 固定利率，收益可预期<br>` +
                     `• 年化收益：2.5%-4%<br>` +
                     `• 到期还本付息<br><br>` +
                     `<strong>3️⃣ 期限灵活</strong><br>` +
                     `• 短期：3个月-1年<br>` +
                     `• 中期：1-5年<br>` +
                     `• 长期：5-30年<br><br>` +
                     `<strong>💡 适合人群：</strong><br>` +
                     `• 退休人员养老金理财<br>` +
                     `• 追求稳定收益的投资者<br>` +
                     `• 资产配置的安全部分`,
            buttons: [
                { text: '🏛️ 查看国债产品', link: 'projects.html' },
                { text: '📊 稳健理财', link: 'ribao.html', type: 'secondary' }
            ]
        },

        vs_deposit: {
            title: '💰 国债 vs 银行存款',
            content: `<strong>国债和银行存款对比：</strong><br><br>` +
                     `<strong>📊 收益率</strong><br>` +
                     `• 国债：2.5%-4% ✅<br>` +
                     `• 定期存款：1.5%-2.5%<br>` +
                     `• 优势：国债收益高50%-100%<br><br>` +
                     `<strong>🔒 安全性</strong><br>` +
                     `• 国债：国家信用 ⭐⭐⭐⭐⭐<br>` +
                     `• 存款：银行+存款保险 ⭐⭐⭐⭐⭐<br>` +
                     `• 结论：两者安全性相当<br><br>` +
                     `<strong>🔄 流动性</strong><br>` +
                     `• 国债：可提前兑取（损失部分利息）<br>` +
                     `• 存款：提前支取按活期计息<br>` +
                     `• 优势：国债流动性更好<br><br>` +
                     `<strong>💡 结论：</strong><br>` +
                     `国债收益高于存款，安全性相当，是理想的稳健投资选择！`,
            buttons: [
                { text: '🏛️ 投资国债', link: 'projects.html' },
                { text: '💰 收益对比', link: 'profit-calendar.html', type: 'secondary' }
            ]
        }
    },

    /**
     * 投资策略
     */
    strategies: {
        risk: {
            title: '🎯 风险评估',
            content: `<strong>了解您的风险承受能力：</strong><br><br>` +
                     `<strong>🟢 保守型（低风险）</strong><br>` +
                     `• 风险承受：本金损失<10%<br>` +
                     `• 推荐产品：国债、货币基金<br>` +
                     `• 预期收益：2%-5%<br><br>` +
                     `<strong>🟡 稳健型（中低风险）</strong><br>` +
                     `• 风险承受：本金损失10%-30%<br>` +
                     `• 推荐产品：债券基金、混合基金<br>` +
                     `• 预期收益：5%-10%<br><br>` +
                     `<strong>🟠 平衡型（中等风险）</strong><br>` +
                     `• 风险承受：本金损失30%-50%<br>` +
                     `• 推荐产品：混合基金、优质股票基金<br>` +
                     `• 预期收益：8%-15%<br><br>` +
                     `<strong>🔴 进取型（高风险）</strong><br>` +
                     `• 风险承受：本金损失>50%<br>` +
                     `• 推荐产品：股票基金、IPO、私募<br>` +
                     `• 预期收益：12%-30%<br><br>` +
                     `💡 <strong>建议</strong>：根据年龄、收入、财务目标选择合适的风险等级`,
            buttons: [
                { text: '📊 风险测评', link: 'kyc-verification.html' },
                { text: '📈 查看产品', link: 'projects.html', type: 'secondary' }
            ]
        },

        allocation: {
            title: '📊 资产配置建议',
            content: `<strong>智能资产配置方案：</strong><br><br>` +
                     `<strong>💼 标准普尔家庭资产配置</strong><br><br>` +
                     `<strong>10%</strong> - 短期消费（3-6个月）<br>` +
                     `• 货币基金、活期存款<br>` +
                     `• 随用随取<br><br>` +
                     `<strong>20%</strong> - 杠杆账户（保险保障）<br>` +
                     `• 意外保险、重疾保险<br>` +
                     `• 以小博大<br><br>` +
                     `<strong>40%</strong> - 投资账户（钱生钱）<br>` +
                     `• 股票基金、混合基金<br>` +
                     `• Providence投资项目 ✅<br>` +
                     `• 年化收益8%-12%<br><br>` +
                     `<strong>30%</strong> - 长期保值（养老教育）<br>` +
                     `• 国债、债券基金<br>` +
                     `• 稳健增值<br><br>` +
                     `💡 <strong>根据年龄调整比例</strong>：<br>` +
                     `• 30岁：40%投资 + 30%保值<br>` +
                     `• 50岁：30%投资 + 40%保值<br>` +
                     `• 60岁：20%投资 + 50%保值`,
            buttons: [
                { text: '💰 开始配置', link: 'recharge.html' },
                { text: '📈 查看产品', link: 'projects.html', type: 'secondary' }
            ]
        },

        longTerm: {
            title: '⏰ 长期投资的力量',
            content: `<strong>复利的魔力：时间是最好的朋友</strong><br><br>` +
                     `<strong>💎 投资10万元，年化8%：</strong><br><br>` +
                     `• 1年后：¥10.8万（+8,000）<br>` +
                     `• 3年后：¥12.6万（+26,000）<br>` +
                     `• 5年后：¥14.7万（+47,000）<br>` +
                     `• 10年后：¥21.6万（+116,000）✨<br>` +
                     `• 20年后：¥46.6万（+366,000）🚀<br><br>` +
                     `<strong>🎯 长期投资三大法则：</strong><br><br>` +
                     `<strong>1️⃣ 及早开始</strong><br>` +
                     `20岁开始比30岁开始，退休时多赚100万+<br><br>` +
                     `<strong>2️⃣ 持续投入</strong><br>` +
                     `每月定投，积少成多<br><br>` +
                     `<strong>3️⃣ 耐心持有</strong><br>` +
                     `不要被短期波动影响，坚持长期持有<br><br>` +
                     `💡 巴菲特名言："如果你不打算持有一只股票10年，那就不要持有10分钟。"`,
            buttons: [
                { text: '💰 开始定投', link: 'recharge.html' },
                { text: '📊 收益计算', link: 'profit-calendar.html', type: 'secondary' }
            ]
        }
    },

    /**
     * 理财术语
     */
    terms: {
        annualReturn: {
            title: '📈 年化收益率',
            content: `<strong>年化收益率</strong>是指投资一年的预期收益率。<br><br>` +
                     `<strong>💡 计算公式：</strong><br>` +
                     `年化收益率 = (投资收益 / 投资本金) × (365 / 投资天数) × 100%<br><br>` +
                     `<strong>📊 举例说明：</strong><br>` +
                     `• 投资10,000元<br>` +
                     `• 投资30天<br>` +
                     `• 收益200元<br><br>` +
                     `年化收益率 = (200/10000) × (365/30) × 100% = <strong style="color:#f04134">24.3%</strong><br><br>` +
                     `<strong>⚠️ 注意事项：</strong><br>` +
                     `• 年化收益率是预期值，实际收益可能有差异<br>` +
                     `• 不同产品的计息方式可能不同<br>` +
                     `• 需要考虑手续费、税费等成本`,
            buttons: [
                { text: '🧮 收益计算器', link: 'profit-calendar.html' },
                { text: '📈 查看产品', link: 'projects.html', type: 'secondary' }
            ]
        },

        compound: {
            title: '💎 复利计算',
            content: `<strong>复利</strong>是"利滚利"，让你的钱为你赚钱！<br><br>` +
                     `<strong>🎯 复利 vs 单利：</strong><br><br>` +
                     `<strong>本金10万元，年利率10%，投资10年</strong><br><br>` +
                     `<strong>单利</strong>（每年利息不再投资）：<br>` +
                     `10万 + 1万×10年 = <strong>20万</strong><br><br>` +
                     `<strong>复利</strong>（每年利息继续投资）：<br>` +
                     `10万 × (1+10%)^10 = <strong>25.9万</strong><br><br>` +
                     `💰 多赚：<strong style="color:#25d0a6">5.9万</strong>（+30%）<br><br>` +
                     `<strong>💡 爱因斯坦名言：</strong><br>` +
                     `"复利是世界第八大奇迹，理解它的人从中获利，不理解的人为此付出代价。"<br><br>` +
                     `<strong>🚀 Providence平台优势：</strong><br>` +
                     `• 自动复投功能<br>` +
                     `• 到期本息自动转入下一期<br>` +
                     `• 最大化复利效应`,
            buttons: [
                { text: '🧮 复利计算', link: 'profit-calendar.html' },
                { text: '💰 立即投资', link: 'projects.html', type: 'secondary' }
            ]
        }
    },

    /**
     * 投资建议
     */
    advice: {
        beginner: {
            title: '🎓 新手投资建议',
            content: `<strong>新手投资三步走：</strong><br><br>` +
                     `<strong>第一步：学习基础知识</strong><br>` +
                     `• 了解基金、股票、债券的区别<br>` +
                     `• 理解风险和收益的关系<br>` +
                     `• 学会看产品说明书<br><br>` +
                     `<strong>第二步：小额试水</strong><br>` +
                     `• 从1000-5000元开始 ✅<br>` +
                     `• 选择稳健型产品<br>` +
                     `• 体验投资流程<br><br>` +
                     `<strong>第三步：逐步提升</strong><br>` +
                     `• 积累经验后增加投资<br>` +
                     `• 尝试不同类型产品<br>` +
                     `• 建立自己的投资组合<br><br>` +
                     `<strong>⚠️ 新手常见误区：</strong><br>` +
                     `❌ 追涨杀跌：看到涨就买，跌就卖<br>` +
                     `❌ 重仓一只：把所有钱投一个产品<br>` +
                     `❌ 短期投机：期望快速致富<br>` +
                     `❌ 盲目跟风：别人买什么我买什么<br><br>` +
                     `✅ <strong>正确做法</strong>：分散投资、长期持有、理性决策`,
            buttons: [
                { text: '📈 新手专区', link: 'projects.html' },
                { text: '🎓 投资教育', link: 'education.html', type: 'secondary' }
            ]
        },

        diversification: {
            title: '🎯 分散投资',
            content: `<strong>不要把所有鸡蛋放在一个篮子里！</strong><br><br>` +
                     `<strong>📊 分散投资示例（10万元）：</strong><br><br>` +
                     `<strong>方案A</strong>（不分散）❌<br>` +
                     `• 全部买股票型基金<br>` +
                     `• 市场大跌，损失30% = -3万<br><br>` +
                     `<strong>方案B</strong>（分散）✅<br>` +
                     `• 4万：股票基金（年化10%）<br>` +
                     `• 3万：混合基金（年化8%）<br>` +
                     `• 2万：债券基金（年化5%）<br>` +
                     `• 1万：货币基金（年化3%）<br>` +
                     `即使股票跌30%，总损失仅1.2万（-12%）<br><br>` +
                     `<strong>🎯 分散原则：</strong><br>` +
                     `• <strong>产品类型分散</strong>：股票+债券+货币<br>` +
                     `• <strong>行业分散</strong>：科技+医疗+消费<br>` +
                     `• <strong>时间分散</strong>：不同期限组合<br>` +
                     `• <strong>平台分散</strong>：不要只在一个平台<br><br>` +
                     `💡 Providence提供多样化产品，助您轻松分散投资！`,
            buttons: [
                { text: '📊 产品组合', link: 'projects.html' },
                { text: '💡 配置建议', link: '#', onclick: "quickAsk('资产配置')" }
            ]
        }
    },

    /**
     * 市场知识
     */
    market: {
        bull: {
            title: '🐂 牛市 vs 🐻 熊市',
            content: `<strong>牛市和熊市的区别：</strong><br><br>` +
                     `<strong>🐂 牛市（多头市场）</strong><br>` +
                     `• 特征：价格持续上涨<br>` +
                     `• 市场情绪：乐观、积极<br>` +
                     `• 投资策略：逐步建仓，持有为主<br>` +
                     `• 风险：追高风险，注意泡沫<br><br>` +
                     `<strong>🐻 熊市（空头市场）</strong><br>` +
                     `• 特征：价格持续下跌<br>` +
                     `• 市场情绪：悲观、恐慌<br>` +
                     `• 投资策略：分批建仓，寻找价值<br>` +
                     `• 机会：优质资产打折，是布局良机<br><br>` +
                     `<strong>💡 投资大师格言：</strong><br>` +
                     `"别人恐惧时我贪婪，别人贪婪时我恐惧" - 巴菲特<br><br>` +
                     `<strong>🎯 Providence策略：</strong><br>` +
                     `• 熊市：精选优质项目，长期布局<br>` +
                     `• 牛市：适度参与，及时获利<br>` +
                     `• 震荡市：定投策略，平滑成本`,
            buttons: [
                { text: '📊 市场数据', link: 'market.html' },
                { text: '📈 查看项目', link: 'projects.html', type: 'secondary' }
            ]
        }
    }
};

/**
 * 知识库匹配函数
 */
function matchKnowledge(message) {
    const msg = message.toLowerCase();

    // 基金相关
    if (msg.match(/基金是什么|什么是基金|基金介绍|基金定义/)) {
        return AI_KNOWLEDGE_BASE.funds.basic;
    }
    if (msg.match(/基金类型|基金分类|基金有哪些|哪些基金/)) {
        return AI_KNOWLEDGE_BASE.funds.types;
    }
    if (msg.match(/基金风险|风险提示|基金有风险|亏损/)) {
        return AI_KNOWLEDGE_BASE.funds.risks;
    }

    // 私募相关
    if (msg.match(/私募|私募基金|什么是私募/)) {
        return AI_KNOWLEDGE_BASE.privateFund.basic;
    }
    if (msg.match(/私募.*公募|公募.*私募|区别|对比/)) {
        return AI_KNOWLEDGE_BASE.privateFund.vs_public;
    }

    // IPO相关
    if (msg.match(/ipo|新股|上市|打新|什么是ipo/)) {
        return AI_KNOWLEDGE_BASE.ipo.basic;
    }
    if (msg.match(/ipo.*流程|申购.*流程|如何申购|怎么申购/)) {
        return AI_KNOWLEDGE_BASE.ipo.process;
    }

    // 国债相关
    if (msg.match(/国债|政府债券|什么是国债/)) {
        return AI_KNOWLEDGE_BASE.bonds.basic;
    }
    if (msg.match(/国债.*存款|存款.*国债|哪个好/)) {
        return AI_KNOWLEDGE_BASE.bonds.vs_deposit;
    }

    // 投资策略
    if (msg.match(/风险评估|风险承受|风险测评|适合.*产品/)) {
        return AI_KNOWLEDGE_BASE.strategies.risk;
    }
    if (msg.match(/资产配置|如何配置|怎么分配|投资组合/)) {
        return AI_KNOWLEDGE_BASE.strategies.allocation;
    }
    if (msg.match(/长期投资|复利|时间|定投/)) {
        return AI_KNOWLEDGE_BASE.strategies.longTerm;
    }
    if (msg.match(/分散投资|分散风险|鸡蛋|篮子/)) {
        return AI_KNOWLEDGE_BASE.strategies.diversification;
    }

    // 术语解释
    if (msg.match(/年化收益|年化.*率|收益率/)) {
        return AI_KNOWLEDGE_BASE.terms.annualReturn;
    }
    if (msg.match(/复利|利滚利|复利.*计算/)) {
        return AI_KNOWLEDGE_BASE.terms.compound;
    }

    // 市场相关
    if (msg.match(/牛市|熊市|多头|空头|市场/)) {
        return AI_KNOWLEDGE_BASE.market.bull;
    }

    // 新手建议
    if (msg.match(/新手|初学|刚开始|第一次|不懂/)) {
        return AI_KNOWLEDGE_BASE.advice.beginner;
    }

    return null;
}

// 导出
if (typeof window !== 'undefined') {
    window.AI_KNOWLEDGE_BASE = AI_KNOWLEDGE_BASE;
    window.matchKnowledge = matchKnowledge;
}

// console.log('📚 Providence AI 金融知识库已加载'); // 性能优化：已注释
// console.log('📖 包含：基金、私募、IPO、国债、投资策略等专业知识'); // 性能优化：已注释
