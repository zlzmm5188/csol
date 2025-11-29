// 投资课堂页面脚本 - 内嵌数据版本
(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  let currentCategory = 'fund';
  let allCourses = [];

  // ========== 学习进度管理 ==========
  const PROGRESS_KEY = 'education_progress';

  function getProgress() {
    try {
      const data = localStorage.getItem(PROGRESS_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  function saveProgress(courseId) {
    try {
      const progress = getProgress();
      progress[courseId] = {
        completed: true,
        timestamp: Date.now()
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
      return true;
    } catch {
      return false;
    }
  }

  function isCourseCompleted(courseId) {
    const progress = getProgress();
    return progress[courseId] && progress[courseId].completed;
  }

  function isCourseUnlocked(course, filteredCourses) {
    // 第一门课程始终解锁
    if (filteredCourses[0].id === course.id) {
      return true;
    }

    // 查找前一门课程
    const currentIndex = filteredCourses.findIndex(c => c.id === course.id);
    if (currentIndex <= 0) return true;

    const previousCourse = filteredCourses[currentIndex - 1];
    return isCourseCompleted(previousCourse.id);
  }

  // 内嵌课程数据
  const COURSES_DATA =
  {
    "courses": [
      {
        "title": "基金投资入门指南",
        "desc": "全面了解基金的定义、类型、运作机制，掌握基金投资的基本概念和原理",
        "category": "fund",
        "level": "入门",
        "duration": "45分钟",
        "icon": "📚",
        "lessons": 10,
        "id": 1,
        "source": "mitrade",
        "featured": true
      },
      {
        "title": "认识不同类型的基金",
        "desc": "深入学习股票型、债券型、混合型、货币型、指数型基金的特点和适用场景",
        "category": "fund",
        "level": "入门",
        "duration": "50分钟",
        "icon": "🎯",
        "lessons": 12,
        "id": 2,
        "source": "mitrade",
        "featured": true
      },
      {
        "title": "基金的费用结构解析",
        "desc": "掌握申购费、赎回费、管理费、托管费等各类费用的计算方法和节省技巧",
        "category": "fund",
        "level": "入门",
        "duration": "35分钟",
        "icon": "💰",
        "lessons": 8,
        "id": 3,
        "source": "mitrade",
        "featured": true
      },
      {
        "title": "如何阅读基金招募说明书",
        "desc": "学会解读基金的投资目标、策略、风险、费用等关键信息",
        "category": "fund",
        "level": "入门",
        "duration": "40分钟",
        "icon": "📄",
        "lessons": 9,
        "id": 4,
        "source": "mitrade",
        "featured": true
      },
      {
        "title": "基金净值与收益计算",
        "desc": "理解基金净值的计算方式，学会计算自己的投资收益率",
        "category": "fund",
        "level": "入门",
        "duration": "30分钟",
        "icon": "📊",
        "lessons": 7,
        "id": 5,
        "source": "mitrade",
        "featured": true
      },
      {
        "title": "基金分红方式的选择",
        "desc": "掌握现金分红和红利再投资的区别，根据自身需求选择合适的分红方式",
        "category": "fund",
        "level": "入门",
        "duration": "25分钟",
        "icon": "💵",
        "lessons": 6,
        "id": 6,
        "source": "mitrade",
        "featured": true
      },
      {
        "title": "基金交易渠道对比",
        "desc": "了解银行、券商、基金公司直销、第三方平台等渠道的优劣势",
        "category": "fund",
        "level": "入门",
        "duration": "30分钟",
        "icon": "🏦",
        "lessons": 7,
        "id": 7,
        "source": "mitrade",
        "featured": true
      },
      {
        "title": "基金定投的基本原理",
        "desc": "学习定投的概念、优势、适用人群，掌握定投的基本操作方法",
        "category": "fund",
        "level": "入门",
        "duration": "40分钟",
        "icon": "📈",
        "lessons": 9,
        "id": 8,
        "source": "mitrade",
        "featured": true
      },
      {
        "title": "如何挑选优质股票基金",
        "desc": "掌握基金业绩评价指标、基金经理分析、持仓分析等选基技巧",
        "category": "fund",
        "level": "进阶",
        "duration": "60分钟",
        "icon": "🔍",
        "lessons": 13,
        "id": 9,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "指数基金投资策略",
        "desc": "深入学习宽基指数、行业指数、主题指数基金的特点和投资方法",
        "category": "fund",
        "level": "进阶",
        "duration": "55分钟",
        "icon": "📉",
        "lessons": 12,
        "id": 10,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "ETF基金交易技巧",
        "desc": "掌握ETF的交易机制、套利原理、场内场外差异，学会使用ETF构建投资组合",
        "category": "fund",
        "level": "进阶",
        "duration": "65分钟",
        "icon": "💹",
        "lessons": 14,
        "id": 11,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "债券基金投资实战",
        "desc": "学习纯债基金、混合债基的特点，掌握利率走势对债基的影响",
        "category": "fund",
        "level": "进阶",
        "duration": "50分钟",
        "icon": "📜",
        "lessons": 11,
        "id": 12,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "混合型基金配置艺术",
        "desc": "理解混合基金的灵活配置策略，学会根据市场环境选择合适的混合基金",
        "category": "fund",
        "level": "进阶",
        "duration": "55分钟",
        "icon": "🎨",
        "lessons": 12,
        "id": 13,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "QDII基金海外投资",
        "desc": "了解QDII基金的投资范围、风险特征，学习配置海外资产的方法",
        "category": "fund",
        "level": "进阶",
        "duration": "45分钟",
        "icon": "🌍",
        "lessons": 10,
        "id": 14,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "主题行业基金投资",
        "desc": "掌握医药、科技、消费、新能源等行业基金的投资时机和风险控制",
        "category": "fund",
        "level": "进阶",
        "duration": "60分钟",
        "icon": "🏭",
        "lessons": 13,
        "id": 15,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "基金定投进阶策略",
        "desc": "学习智能定投、价值平均策略、止盈止损设置等高级定投技巧",
        "category": "fund",
        "level": "进阶",
        "duration": "55分钟",
        "icon": "🎯",
        "lessons": 12,
        "id": 16,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "基金组合构建与再平衡",
        "desc": "掌握基金组合的配置原则、再平衡策略，实现风险分散和收益优化",
        "category": "fund",
        "level": "进阶",
        "duration": "70分钟",
        "icon": "⚖️",
        "lessons": 15,
        "id": 17,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "基金经理投资风格分析",
        "desc": "学会识别基金经理的投资风格、换手率、选股偏好，选择适合自己的基金",
        "category": "fund",
        "level": "进阶",
        "duration": "50分钟",
        "icon": "👔",
        "lessons": 11,
        "id": 18,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "量化基金投资解析",
        "desc": "深入理解量化选股、多因子模型、Alpha策略等量化基金的核心技术",
        "category": "fund",
        "level": "高级",
        "duration": "80分钟",
        "icon": "🤖",
        "lessons": 16,
        "id": 19,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "FOF基金配置策略",
        "desc": "学习基金中的基金投资理念，掌握FOF的选择方法和配置技巧",
        "category": "fund",
        "level": "高级",
        "duration": "65分钟",
        "icon": "🎲",
        "lessons": 14,
        "id": 20,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "对冲基金与绝对收益策略",
        "desc": "了解市场中性、多空策略、套利策略等对冲基金的投资方法",
        "category": "fund",
        "level": "高级",
        "duration": "75分钟",
        "icon": "🛡️",
        "lessons": 15,
        "id": 21,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "REITs不动产投资信托基金",
        "desc": "掌握REITs的投资价值、收益来源、风险特征和配置方法",
        "category": "fund",
        "level": "高级",
        "duration": "60分钟",
        "icon": "🏢",
        "lessons": 13,
        "id": 22,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "基金投资税务规划",
        "desc": "学习基金投资的税收政策，掌握合理避税和税务优化策略",
        "category": "fund",
        "level": "高级",
        "duration": "50分钟",
        "icon": "📋",
        "lessons": 11,
        "id": 23,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "基金业绩归因分析",
        "desc": "深入学习基金收益的来源分解，评估基金经理的真实投资能力",
        "category": "fund",
        "level": "高级",
        "duration": "70分钟",
        "icon": "🔬",
        "lessons": 15,
        "id": 24,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "全球资产配置与基金投资",
        "desc": "从全球视角构建基金投资组合，实现跨地区、跨资产类别的配置",
        "category": "fund",
        "level": "高级",
        "duration": "85分钟",
        "icon": "🌐",
        "lessons": 17,
        "id": 25,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "基金投资风险管理体系",
        "desc": "建立完整的风险识别、评估、控制体系，保护基金投资的长期收益",
        "category": "fund",
        "level": "高级",
        "duration": "75分钟",
        "icon": "🔐",
        "lessons": 16,
        "id": 26,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "IPO新股投资入门",
        "desc": "全面了解IPO的定义、流程、参与方式，掌握新股投资的基本概念",
        "category": "ipo",
        "level": "入门",
        "duration": "40分钟",
        "icon": "🎯",
        "lessons": 9,
        "id": 27,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "新股申购规则详解",
        "desc": "学习A股、港股、美股的新股申购规则、市值要求、申购流程",
        "category": "ipo",
        "level": "入门",
        "duration": "45分钟",
        "icon": "📝",
        "lessons": 10,
        "id": 28,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "新股中签率与配号机制",
        "desc": "理解新股配号、抽签、中签的整个流程，提高中签概率的技巧",
        "category": "ipo",
        "level": "入门",
        "duration": "35分钟",
        "icon": "🎲",
        "lessons": 8,
        "id": 29,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "科创板与创业板注册制",
        "desc": "深入了解注册制改革、上市条件、交易规则的变化",
        "category": "ipo",
        "level": "入门",
        "duration": "50分钟",
        "icon": "🚀",
        "lessons": 11,
        "id": 30,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "新股上市首日交易规则",
        "desc": "掌握首日涨跌幅限制、临停机制、交易时间等关键规则",
        "category": "ipo",
        "level": "入门",
        "duration": "30分钟",
        "icon": "📊",
        "lessons": 7,
        "id": 31,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "新股弃购的后果与影响",
        "desc": "了解弃购的定义、后果、如何避免弃购以及对账户的影响",
        "category": "ipo",
        "level": "入门",
        "duration": "25分钟",
        "icon": "⚠️",
        "lessons": 6,
        "id": 32,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "新股招股说明书分析",
        "desc": "学会快速解读招股书，识别公司业务模式、盈利能力、风险因素",
        "category": "ipo",
        "level": "进阶",
        "duration": "60分钟",
        "icon": "📄",
        "lessons": 13,
        "id": 33,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "新股估值与定价分析",
        "desc": "掌握PE、PB、PS等估值方法，判断新股发行价的合理性",
        "category": "ipo",
        "level": "进阶",
        "duration": "55分钟",
        "icon": "💹",
        "lessons": 12,
        "id": 34,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "打新策略与资金管理",
        "desc": "学习顶格申购、分账户申购、资金利用效率优化等策略",
        "category": "ipo",
        "level": "进阶",
        "duration": "50分钟",
        "icon": "💰",
        "lessons": 11,
        "id": 35,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "新股上市后走势预判",
        "desc": "分析影响新股开盘价、首日涨幅的因素，制定卖出策略",
        "category": "ipo",
        "level": "进阶",
        "duration": "55分钟",
        "icon": "📈",
        "lessons": 12,
        "id": 36,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "行业景气度与新股投资",
        "desc": "学习识别热门行业、冷门行业，把握行业轮动带来的投资机会",
        "category": "ipo",
        "level": "进阶",
        "duration": "60分钟",
        "icon": "🏭",
        "lessons": 13,
        "id": 37,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "可转债打新攻略",
        "desc": "掌握可转债的申购规则、转股价值分析、上市后的交易策略",
        "category": "ipo",
        "level": "进阶",
        "duration": "50分钟",
        "icon": "🎫",
        "lessons": 11,
        "id": 38,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "港股新股投资技巧",
        "desc": "了解港股新股的认购方式、暗盘交易、孖展融资等特殊玩法",
        "category": "ipo",
        "level": "进阶",
        "duration": "55分钟",
        "icon": "🇭🇰",
        "lessons": 12,
        "id": 39,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "新股破发风险识别",
        "desc": "学会识别破发风险信号，制定防御策略，避免打新亏损",
        "category": "ipo",
        "level": "进阶",
        "duration": "45分钟",
        "icon": "🛡️",
        "lessons": 10,
        "id": 40,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "机构询价与定价博弈",
        "desc": "深入理解IPO定价机制，分析机构投资者的询价策略和博弈逻辑",
        "category": "ipo",
        "level": "高级",
        "duration": "70分钟",
        "icon": "🎯",
        "lessons": 15,
        "id": 41,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "新股网下配售策略",
        "desc": "掌握网下打新的门槛、优势、分类配售规则，提升打新收益率",
        "category": "ipo",
        "level": "高级",
        "duration": "65分钟",
        "icon": "💼",
        "lessons": 14,
        "id": 42,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "一级半市场套利机会",
        "desc": "学习战略配售、定增、大宗交易等一级半市场的投资策略",
        "category": "ipo",
        "level": "高级",
        "duration": "75分钟",
        "icon": "🔄",
        "lessons": 16,
        "id": 43,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "美股IPO投资指南",
        "desc": "了解美股IPO的规则、路演分析、锁定期策略，把握海外打新机会",
        "category": "ipo",
        "level": "高级",
        "duration": "60分钟",
        "icon": "🇺🇸",
        "lessons": 13,
        "id": 44,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "IPO公司财务分析进阶",
        "desc": "深入学习财报舞弊识别、盈利质量分析、现金流分析等高级技巧",
        "category": "ipo",
        "level": "高级",
        "duration": "80分钟",
        "icon": "🔍",
        "lessons": 17,
        "id": 45,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "新股投资组合管理",
        "desc": "构建多元化打新策略，优化资金配置，实现稳定的打新收益",
        "category": "ipo",
        "level": "高级",
        "duration": "70分钟",
        "icon": "📊",
        "lessons": 15,
        "id": 46,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "债券投资基础入门",
        "desc": "全面了解债券的定义、分类、要素，掌握债券投资的基本概念",
        "category": "bond",
        "level": "入门",
        "duration": "45分钟",
        "icon": "📜",
        "lessons": 10,
        "id": 47,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "债券的收益与风险",
        "desc": "理解债券的票面利率、到期收益率、价格波动，认识债券投资的风险",
        "category": "bond",
        "level": "入门",
        "duration": "40分钟",
        "icon": "💹",
        "lessons": 9,
        "id": 48,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "国债与地方债投资",
        "desc": "学习国债、地方政府债的特点、购买渠道、投资价值",
        "category": "bond",
        "level": "入门",
        "duration": "35分钟",
        "icon": "🏛️",
        "lessons": 8,
        "id": 49,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "企业债与公司债入门",
        "desc": "了解企业债、公司债的发行主体、信用评级、投资风险",
        "category": "bond",
        "level": "入门",
        "duration": "40分钟",
        "icon": "🏢",
        "lessons": 9,
        "id": 50,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "可转换债券基础知识",
        "desc": "掌握可转债的双重属性、转股价值、投资策略",
        "category": "bond",
        "level": "入门",
        "duration": "50分钟",
        "icon": "🎫",
        "lessons": 11,
        "id": 51,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "债券市场交易规则",
        "desc": "学习债券的交易场所、交易方式、报价机制、交割流程",
        "category": "bond",
        "level": "入门",
        "duration": "35分钟",
        "icon": "🔄",
        "lessons": 8,
        "id": 52,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "利率与债券价格的关系",
        "desc": "理解利率变化对债券价格的影响，掌握久期和凸性的概念",
        "category": "bond",
        "level": "入门",
        "duration": "45分钟",
        "icon": "📊",
        "lessons": 10,
        "id": 53,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "债券信用评级解读",
        "desc": "学习信用评级体系、评级方法、评级迁移，识别信用风险",
        "category": "bond",
        "level": "进阶",
        "duration": "55分钟",
        "icon": "⭐",
        "lessons": 12,
        "id": 54,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "债券久期与利率风险管理",
        "desc": "深入理解久期、修正久期、有效久期，学会管理利率风险",
        "category": "bond",
        "level": "进阶",
        "duration": "60分钟",
        "icon": "⏱️",
        "lessons": 13,
        "id": 55,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "可转债投资实战策略",
        "desc": "掌握双低策略、溢价率分析、强赎博弈等可转债高级玩法",
        "category": "bond",
        "level": "进阶",
        "duration": "65分钟",
        "icon": "🎯",
        "lessons": 14,
        "id": 56,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "信用债投资分析",
        "desc": "学习信用债的挑选方法、财务分析、行业分析、违约预警",
        "category": "bond",
        "level": "进阶",
        "duration": "70分钟",
        "icon": "🔍",
        "lessons": 15,
        "id": 57,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "债券组合构建策略",
        "desc": "掌握债券梯度配置、哑铃策略、子弹策略等组合构建方法",
        "category": "bond",
        "level": "进阶",
        "duration": "60分钟",
        "icon": "📐",
        "lessons": 13,
        "id": 58,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "国债逆回购投资技巧",
        "desc": "学习逆回购的操作方法、利率规律、资金利用效率优化",
        "category": "bond",
        "level": "进阶",
        "duration": "45分钟",
        "icon": "🔄",
        "lessons": 10,
        "id": 59,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "城投债投资分析",
        "desc": "深入了解城投债的风险特征、区域分析、隐性担保逻辑",
        "category": "bond",
        "level": "进阶",
        "duration": "55分钟",
        "icon": "🏙️",
        "lessons": 12,
        "id": 60,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "债券基金投资策略",
        "desc": "学习纯债基金、混合债基的选择方法和配置时机",
        "category": "bond",
        "level": "进阶",
        "duration": "50分钟",
        "icon": "📦",
        "lessons": 11,
        "id": 61,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "永续债与资本工具投资",
        "desc": "了解永续债、二级资本债、优先股等资本工具的投资价值",
        "category": "bond",
        "level": "进阶",
        "duration": "55分钟",
        "icon": "♾️",
        "lessons": 12,
        "id": 62,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "债券衍生品交易策略",
        "desc": "掌握国债期货、利率互换等衍生品的对冲和投机策略",
        "category": "bond",
        "level": "高级",
        "duration": "80分钟",
        "icon": "🎲",
        "lessons": 17,
        "id": 63,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "债券收益率曲线分析",
        "desc": "深入学习收益率曲线的形态、变化规律、交易策略",
        "category": "bond",
        "level": "高级",
        "duration": "75分钟",
        "icon": "📈",
        "lessons": 16,
        "id": 64,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "信用利差套利策略",
        "desc": "学习跨品种、跨评级、跨期限的信用利差套利方法",
        "category": "bond",
        "level": "高级",
        "duration": "70分钟",
        "icon": "⚖️",
        "lessons": 15,
        "id": 65,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "资产证券化产品投资",
        "desc": "了解ABS、MBS等资产证券化产品的结构、风险、投资策略",
        "category": "bond",
        "level": "高级",
        "duration": "85分钟",
        "icon": "🏦",
        "lessons": 18,
        "id": 66,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "可交换债投资分析",
        "desc": "深入研究可交换债的定价、套利机会、风险控制",
        "category": "bond",
        "level": "高级",
        "duration": "65分钟",
        "icon": "🔄",
        "lessons": 14,
        "id": 67,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "债券违约处置与重组",
        "desc": "学习债券违约后的处置流程、求偿权、重组方案分析",
        "category": "bond",
        "level": "高级",
        "duration": "70分钟",
        "icon": "⚠️",
        "lessons": 15,
        "id": 68,
        "source": "mitrade",
        "featured": false
      },
      {
        "title": "全球债券市场配置",
        "desc": "从全球视角配置债券资产，把握不同市场的投资机会",
        "category": "bond",
        "level": "高级",
        "duration": "75分钟",
        "icon": "🌍",
        "lessons": 16,
        "id": 69,
        "source": "mitrade",
        "featured": false
      }
    ],
    "updateTime": "2025-10-19 09:51:19",
    "source": "mitrade"
  };
  async function init() {
    showLoading();
    await fetchCourses();
    setupEventListeners();
  }

  // ========== 获取课程数据 ==========
  async function fetchCourses() {
    try {
      // 从内嵌数据获取（不依赖登录状态）
      if (COURSES_DATA && COURSES_DATA.courses) {
        allCourses = COURSES_DATA.courses || [];
        console.log('✅ 课程数据加载成功！');
        console.log('📊 总课程数:', allCourses.length);
        console.log('📚 基金课程:', allCourses.filter(c => c.category === 'fund').length);
        console.log('🎯 IPO课程:', allCourses.filter(c => c.category === 'ipo').length);
        console.log('📜 债券课程:', allCourses.filter(c => c.category === 'bond').length);
        console.log('🔍 当前分类:', currentCategory);
        renderCourses();
        updateLastUpdateTime(COURSES_DATA.updateTime);

        // 初始化 Spotlight 效果
        setTimeout(initSpotlightEffect, 100);
      } else {
        console.error('❌ 课程数据加载失败');
        console.log('COURSES_DATA:', COURSES_DATA);
        showError('课程数据加载失败');
      }
    } catch (error) {
      console.error('获取课程失败:', error);
      showError('数据加载错误');
    }
  }

  // ========== 显示加载状态 ==========
  function showLoading() {
    const coursesContainer = $('#eduCourses');
    coursesContainer.innerHTML = `
      <div class="loading-indicator">
        <div class="loading-spinner"></div>
        <div>加载课程中...</div>
      </div>
    `;
  }

  // ========== 显示错误 ==========
  function showError(message) {
    const coursesContainer = $('#eduCourses');
    coursesContainer.innerHTML = `
      <div class="no-courses">
        <div style="font-size:32px;margin-bottom:12px">😞</div>
        <div>${message}</div>
      </div>
    `;
  }

  // ========== 设置事件监听 ==========
  function setupEventListeners() {
    // 分类切换
    $$('.cat-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.cat-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentCategory = tab.dataset.category;
        renderCourses();
      });
    });
  }

  // ========== 渲染课程 ==========
  function renderCourses() {
    const coursesContainer = $('#eduCourses');

    console.log('🎨 开始渲染课程...');
    console.log('🔍 当前分类:', currentCategory);
    console.log('📦 全部课程数:', allCourses.length);

    let filteredCourses = allCourses.filter(c => c.category === currentCategory);

    console.log('✅ 筛选后课程数:', filteredCourses.length);

    if (filteredCourses.length === 0) {
      console.warn('⚠️ 该分类没有课程！');
      coursesContainer.innerHTML = '<div class="no-courses">暂无该分类课程</div>';
      return;
    }

    // 按featured排序，特色课程在前
    filteredCourses.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });

    let html = '<div class="courses-grid">';

    filteredCourses.forEach((course, index) => {
      const isUnlocked = isCourseUnlocked(course, filteredCourses);
      const isCompleted = isCourseCompleted(course.id);
      const featuredBadge = course.featured ? '<div class="course-featured-badge">⭐ 特色</div>' : '';
      const completedBadge = isCompleted ? '<div class="course-completed-badge">✓ 已完成</div>' : '';
      const lockIcon = !isUnlocked ? '<div class="course-lock-icon">🔒</div>' : '';
      const cardClass = `course-card ${!isUnlocked ? 'locked' : ''} ${isCompleted ? 'completed' : ''}`;
      const buttonText = isCompleted ? '重新学习' : isUnlocked ? '开始学习' : '🔒 需要先完成前置课程';

      html += `
        <div class="${cardClass}" data-course-id="${course.id}" data-unlocked="${isUnlocked}">
          ${featuredBadge}
          ${completedBadge}
          ${lockIcon}
          <div class="course-icon">${course.icon}</div>
          <div class="course-content">
            <div class="course-level-badge ${course.category}">${course.level}</div>
            <h3 class="course-title">${course.title}</h3>
            <p class="course-desc">${course.desc}</p>
            <div class="course-meta">
              <span class="course-duration">⏱️ ${course.duration}</span>
              <span class="course-lessons">📚 ${course.lessons}课时</span>
            </div>
            <button class="course-btn" ${!isUnlocked ? 'disabled' : ''}>${buttonText}</button>
          </div>
        </div>
      `;
    });

    html += '</div>';
    coursesContainer.innerHTML = html;

    // 添加点击事件
    attachCourseEvents();
  }

  // ========== 附加课程事件 ==========
  function attachCourseEvents() {
    $$('.course-card').forEach(card => {
      const isUnlocked = card.dataset.unlocked === 'true';

      // 卡片点击
      card.addEventListener('click', (e) => {
        // 如果点击的是按钮，不执行卡片点击
        if (e.target.classList.contains('course-btn') || e.target.closest('.course-btn')) {
          return;
        }

        if (!isUnlocked) {
          if (typeof showToast === 'function') {
            showToast('', '🔒 该课程尚未解锁\n\n请先完成前面的课程');
          } else {
            alert('🔒 该课程尚未解锁\n\n请先完成前面的课程');
          }
          return;
        }

        const courseId = card.dataset.courseId;
        const course = allCourses.find(c => c.id == courseId);
        if (course) showCourseDetail(course);
      });
    });

    // 单独绑定所有按钮的点击事件
    $$('.course-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();

        const card = btn.closest('.course-card');
        if (!card) return;

        const isUnlocked = card.dataset.unlocked === 'true';
        if (!isUnlocked) {
          if (typeof showToast === 'function') {
            showToast('', '🔒 该课程尚未解锁\n\n请先完成前面的课程');
          } else {
            alert('🔒 该课程尚未解锁\n\n请先完成前面的课程');
          }
          return;
        }

        const courseId = card.dataset.courseId;
        const course = allCourses.find(c => c.id == courseId);
        if (course) startLearning(course);
      });
    });
  }

  // ========== 显示课程详情 ==========
  async function showCourseDetail(course) {
    const featuredText = course.featured ? '\n⭐ 特色推荐课程' : '';
    await showToast('',
      `📚 ${course.title}\n\n` +
      `${course.desc}\n\n` +
      `⏱️ 时长：${course.duration}\n` +
      `📖 课时：${course.lessons}节\n` +
      `🎓 难度：${course.level}${featuredText}`
    );
  }

  // ========== 开始学习 ==========
  function startLearning(course) {
    openBookModal(course);
  }

  // ========== 打开翻书模态框 ==========
  function openBookModal(course) {
    // 创建模态框（如果不存在）
    let modal = $('#courseDetailModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'courseDetailModal';
      modal.className = 'course-detail-modal';
      document.body.appendChild(modal);
    }

    // 生成课程内容并分页
    const fullContent = generateCourseContent(course);
    const pages = splitContentIntoPages(fullContent, course);

    // 检查课程是否已完成
    const isCompleted = isCourseCompleted(course.id);

    // 生成多页HTML
    const pagesHTML = pages.map((pageContent, index) => `
      <div class="book-page ${index === 0 ? '' : 'hidden'}" data-page="${index}">
        ${index === 0 ? `
          <button class="close-book" onclick="document.getElementById('courseDetailModal').classList.remove('active')">×</button>
          <div class="page-header">
            <div class="course-detail-icon">${course.icon}</div>
            <h2 class="course-detail-title">${course.title}</h2>
            <div class="course-detail-meta">
              <span>⏱️ ${course.duration}</span>
              <span>📚 ${course.lessons}课时</span>
              <span>🎓 ${course.level}</span>
            </div>
          </div>
        ` : ''}
        <div class="course-detail-content">
          ${pageContent}
        </div>
        ${index === pages.length - 1 ? `
          <button class="complete-course-btn ${isCompleted ? 'completed' : ''}" id="completeCourseBtn" data-course-id="${course.id}">
            ${isCompleted ? '✓ 已完成此课程' : '✓ 完成学习'}
          </button>
        ` : ''}
        <div class="page-number">第 ${index + 1} 页 / 共 ${pages.length} 页</div>
      </div>
    `).join('');

    modal.innerHTML = `
      <div class="book-container">
        <div class="book">
          ${pagesHTML}
          <div class="page-nav">
            <button class="page-nav-btn" id="prevPage" ${pages.length <= 1 ? 'disabled' : ''}>‹</button>
            <div class="page-indicator"><span id="currentPageNum">1</span> / ${pages.length}</div>
            <button class="page-nav-btn" id="nextPage" ${pages.length <= 1 ? 'disabled' : ''}>›</button>
          </div>
        </div>
      </div>
    `;

    // 显示模态框
    setTimeout(() => modal.classList.add('active'), 10);

    // 翻页功能
    let currentPage = 0;
    const totalPages = pages.length;
    const bookPages = modal.querySelectorAll('.book-page');
    const prevBtn = modal.querySelector('#prevPage');
    const nextBtn = modal.querySelector('#nextPage');
    const pageNumDisplay = modal.querySelector('#currentPageNum');

    function showPage(pageIndex) {
      bookPages.forEach((page, idx) => {
        if (idx === pageIndex) {
          page.classList.remove('hidden');
          page.scrollTop = 0; // 回到页面顶部
        } else {
          page.classList.add('hidden');
        }
      });
      currentPage = pageIndex;
      pageNumDisplay.textContent = pageIndex + 1;
      prevBtn.disabled = pageIndex === 0;
      nextBtn.disabled = pageIndex === totalPages - 1;
    }

    prevBtn.addEventListener('click', () => {
      if (currentPage > 0) showPage(currentPage - 1);
    });

    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages - 1) showPage(currentPage + 1);
    });

    // 键盘导航
    const handleKeyPress = (e) => {
      if (!modal.classList.contains('active')) return;
      if (e.key === 'ArrowLeft' && currentPage > 0) {
        showPage(currentPage - 1);
      } else if (e.key === 'ArrowRight' && currentPage < totalPages - 1) {
        showPage(currentPage + 1);
      } else if (e.key === 'Escape') {
        modal.classList.remove('active');
        document.removeEventListener('keydown', handleKeyPress);
      }
    };
    document.addEventListener('keydown', handleKeyPress);

    // 完成学习按钮事件
    const completeBtn = modal.querySelector('#completeCourseBtn');
    if (completeBtn && !isCompleted) {
      completeBtn.addEventListener('click', async () => {
        if (saveProgress(course.id)) {
          completeBtn.textContent = '✓ 已完成此课程';
          completeBtn.classList.add('completed');

          // 显示成功提示
          await showToast('', '🎉 恭喜完成课程！\n\n已解锁下一门课程');

          // 关闭模态框
          modal.classList.remove('active');
          document.removeEventListener('keydown', handleKeyPress);

          // 刷新课程列表
          renderCourses();
        }
      });
    }

    // 点击背景关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        document.removeEventListener('keydown', handleKeyPress);
      }
    });
  }

  // ========== 分页函数 ==========
  function splitContentIntoPages(content, course) {
    // 创建临时元素来解析内容
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    const sections = [];
    let currentSection = '';
    let charCount = 0;
    const MAX_CHARS_PER_PAGE = 1000; // 每页最大字符数（适合手机阅读）

    // 按h4标题分段
    const elements = Array.from(tempDiv.children);

    elements.forEach((el, idx) => {
      const elHTML = el.outerHTML;
      const elText = el.textContent || '';

      // 如果当前段落加上新内容超过限制，且当前段落不为空，则分页
      if (charCount + elText.length > MAX_CHARS_PER_PAGE && currentSection) {
        sections.push(currentSection);
        currentSection = elHTML;
        charCount = elText.length;
      } else {
        currentSection += elHTML;
        charCount += elText.length;
      }

      // 最后一个元素
      if (idx === elements.length - 1 && currentSection) {
        sections.push(currentSection);
      }
    });

    // 如果没有分段，返回原内容
    return sections.length > 0 ? sections : [content];
  }

  // ========== 生成课程内容 ==========
  function generateCourseContent(course) {
    const contents = {
      fund: {
        '基金投资入门指南': `
          <h4>📚 课程简介</h4>
          <p>本课程将带您全面了解基金投资的基本概念，从零基础到入门，帮助您建立正确的投资理念。课程包含大量实战案例和数据分析，让您真正理解基金投资的本质。</p>

          <h4>📖 学习目标</h4>
          <ul>
            <li>理解基金的定义、分类和运作机制</li>
            <li>掌握基金投资的核心原理和策略</li>
            <li>学会选择适合自己的基金产品</li>
            <li>建立长期投资的正确观念</li>
            <li>避免新手常犯的投资错误</li>
          </ul>

          <h4>💡 什么是基金？</h4>
          <p><strong>定义：</strong></p>
          <p>基金是一种集合投资方式，由专业的基金管理人将众多投资者的资金集中起来，按照特定的投资目标和策略，投资于股票、债券、货币市场工具等金融资产，实现资产增值。</p>

          <p><strong>通俗解释：</strong></p>
          <p>就像一群人凑钱请一位专业厨师（基金经理）去菜市场（金融市场）买菜（股票、债券），做一桌好菜（投资收益），大家按照出钱多少分配菜品（收益分配）。</p>

          <h4>📊 基金运作机制</h4>
          <p><strong>1. 参与主体</strong></p>
          <ul>
            <li><strong>基金投资者</strong>：出钱的人，通过申购基金份额参与投资</li>
            <li><strong>基金管理人</strong>：基金公司，负责投资决策和运作</li>
            <li><strong>基金托管人</strong>：通常是银行，负责资金保管和监督</li>
            <li><strong>基金经理</strong>：具体操盘的专业人士</li>
          </ul>

          <p><strong>2. 资金流转</strong></p>
          <ol>
            <li>投资者通过银行、证券公司或第三方平台申购基金</li>
            <li>资金进入基金托管账户（银行保管，安全有保障）</li>
            <li>基金经理根据投资策略买入股票、债券等资产</li>
            <li>资产增值或分红，反映在基金净值上</li>
            <li>投资者赎回时，按当前净值卖出份额</li>
          </ol>

          <h4>✨ 基金的核心优势</h4>
          <p><strong>1. 专业管理</strong></p>
          <ul>
            <li>基金经理通常有10年以上投资经验</li>
            <li>配备专业的研究团队（分析师、策略师）</li>
            <li>具备普通投资者难以获得的调研资源</li>
          </ul>

          <p><strong>2. 分散风险</strong></p>
          <p>一只股票型基金通常持有40-80只股票，即使某只股票暴跌，对整体影响有限。</p>
          <p><strong>案例：</strong></p>
          <ul>
            <li>个人买1只股票，跌停损失10%</li>
            <li>基金持有50只股票，1只跌停仅影响0.2%</li>
          </ul>

          <p><strong>3. 门槛低</strong></p>
          <ul>
            <li>传统基金：10元起投</li>
            <li>定投：每月100元起</li>
            <li>货币基金：1元起投</li>
          </ul>
          <p>相比直接买股票需要100股（通常几千元起），基金投资门槛极低。</p>

          <p><strong>4. 流动性好</strong></p>
          <ul>
            <li>场外基金：T+1日确认，T+1至T+3日到账</li>
            <li>货币基金：支持T+0快速赎回（当天到账）</li>
            <li>场内ETF：实时交易，秒级成交</li>
          </ul>

          <h4>📈 基金 vs 股票对比</h4>
          <table style="width:100%;font-size:12px;margin:10px 0">
            <tr style="background:#f5f5f5;font-weight:bold">
              <td>对比项</td><td>基金</td><td>股票</td>
            </tr>
            <tr>
              <td>风险</td><td>中等（分散投资）</td><td>高（集中风险）</td>
            </tr>
            <tr>
              <td>专业要求</td><td>低（交给专业人士）</td><td>高（需自己研究）</td>
            </tr>
            <tr>
              <td>投资门槛</td><td>10元起</td><td>几百-几千元</td>
            </tr>
            <tr>
              <td>时间投入</td><td>少（定期关注即可）</td><td>多（需盯盘）</td>
            </tr>
            <tr>
              <td>适合人群</td><td>普通投资者</td><td>专业投资者</td>
            </tr>
          </table>

          <h4>💰 真实收益案例</h4>
          <p><strong>案例1：指数基金定投（沪深300）</strong></p>
          <ul>
            <li>投资周期：2015-2020年（5年）</li>
            <li>投资方式：每月定投1000元</li>
            <li>总投入：6万元</li>
            <li>期末市值：约8.5万元</li>
            <li>收益率：41.7%，年化约7.2%</li>
          </ul>

          <p><strong>案例2：主动管理型股票基金</strong></p>
          <ul>
            <li>某知名基金经理管理的基金</li>
            <li>2017-2022年（5年）累计收益：150%</li>
            <li>同期沪深300指数涨幅：约30%</li>
            <li>大幅跑赢指数120个百分点</li>
          </ul>

          <p><strong>案例3：债券基金稳健收益</strong></p>
          <ul>
            <li>某纯债基金近3年年化收益：4.5%</li>
            <li>波动率极小，最大回撤不到1%</li>
            <li>适合保守型投资者和短期理财</li>
          </ul>

          <h4>⚠️ 新手常见误区</h4>
          <p><strong>误区1：净值越低越便宜</strong></p>
          <ul>
            <li>❌ 错误：基金A净值0.8元，基金B净值2元，选A更便宜</li>
            <li>✅ 正确：净值高低不影响收益，关键看未来增长潜力</li>
          </ul>

          <p><strong>误区2：只看短期业绩</strong></p>
          <ul>
            <li>❌ 错误：买近1个月涨幅最高的基金</li>
            <li>✅ 正确：看3年、5年长期业绩，评估基金经理能力</li>
          </ul>

          <p><strong>误区3：频繁换基金</strong></p>
          <ul>
            <li>❌ 错误：看到其他基金涨得好就换，频繁操作</li>
            <li>✅ 正确：长期持有优质基金，避免追涨杀跌</li>
          </ul>

          <p><strong>误区4：把全部资金投入单一基金</strong></p>
          <ul>
            <li>❌ 错误：all in 一只基金</li>
            <li>✅ 正确：分散配置3-5只不同类型基金</li>
          </ul>

          <h4>🎯 新手投资建议</h4>
          <p><strong>第一步：了解自己</strong></p>
          <ul>
            <li>确定投资目标（买房、养老、孩子教育）</li>
            <li>明确投资期限（1年、3年、5年以上）</li>
            <li>评估风险承受能力（保守、稳健、激进）</li>
          </ul>

          <p><strong>第二步：选择基金类型</strong></p>
          <ul>
            <li><strong>保守型</strong>：货币基金、短期债券基金</li>
            <li><strong>稳健型</strong>：债券基金、偏债混合基金</li>
            <li><strong>平衡型</strong>：混合基金、沪深300指数基金</li>
            <li><strong>激进型</strong>：股票基金、中证500指数基金</li>
          </ul>

          <p><strong>第三步：实战操作</strong></p>
          <ol>
            <li>从小额开始（500-1000元）</li>
            <li>选择1-2只基金试水</li>
            <li>观察1-3个月，体验波动</li>
            <li>逐步加大投资，建立投资组合</li>
            <li>定期检视，年度调整</li>
          </ol>

          <h4>📚 推荐书籍</h4>
          <ul>
            <li>《聪明的投资者》- 本杰明·格雷厄姆</li>
            <li>《指数基金投资指南》- 银行螺丝钉</li>
            <li>《基金投资实战技法》- 老罗话指数投资</li>
          </ul>

          <h4>✅ 本课小结</h4>
          <p>基金投资是一种专业、分散、门槛低的理财方式，适合大多数普通投资者。通过本课学习，您已经了解了基金的基本概念和优势。下一课我们将深入学习不同类型基金的特点和选择方法。</p>

          <p style="text-align:center;margin-top:20px;color:#d4af37;font-weight:bold;">💪 学完后点击"完成学习"解锁下一课！</p>
        `,
        '认识不同类型的基金': `
          <h4>📚 课程简介</h4>
          <p>市场上有数千只基金，分为不同类型，各有特点。本课将帮您深入了解各类基金的区别，学会根据自己的需求选择合适的基金类型。</p>

          <h4>📊 基金的官方分类（按投资对象）</h4>

          <p><strong>1. 股票型基金</strong></p>
          <p><strong>定义：</strong>80%以上资产投资于股票</p>
          <p><strong>特点：</strong></p>
          <ul>
            <li>收益潜力最大：长期年化收益可达10%-15%</li>
            <li>波动最大：单日涨跌可达3%-5%</li>
            <li>适合长期持有：建议持有3年以上</li>
          </ul>

          <p><strong>历史表现（数据说话）：</strong></p>
          <ul>
            <li>近10年优秀股票基金年化收益：15%-20%</li>
            <li>最大回撤：30%-40%（牛熊转换时）</li>
            <li>投资者结构：85%为个人投资者</li>
          </ul>

          <p><strong>适合人群：</strong></p>
          <ul>
            <li>年龄30-50岁，风险承受能力较强</li>
            <li>有稳定收入，不需要短期动用资金</li>
            <li>能接受账面浮亏20%-30%</li>
          </ul>

          <p><strong>2. 债券型基金</strong></p>
          <p><strong>定义：</strong>80%以上资产投资于债券</p>
          <p><strong>特点：</strong></p>
          <ul>
            <li>风险较低：波动率通常在2%以内</li>
            <li>收益稳定：年化收益约3%-6%</li>
            <li>适合短期：持有6个月以上即可</li>
          </ul>

          <p><strong>细分类型：</strong></p>
          <ul>
            <li><strong>纯债基金</strong>：只投资债券，最稳健</li>
            <li><strong>一级债基</strong>：可打新股，收益略高</li>
            <li><strong>二级债基</strong>：可投20%股票，收益更高但波动增加</li>
          </ul>

          <p><strong>历史表现：</strong></p>
          <ul>
            <li>纯债基金近5年年化收益：3.5%-4.5%</li>
            <li>二级债基近5年年化收益：5%-7%</li>
            <li>最大回撤：纯债<2%，二级债5%-10%</li>
          </ul>

          <p><strong>适合人群：</strong></p>
          <ul>
            <li>保守型投资者，追求稳定收益</li>
            <li>短期理财需求（6个月-2年）</li>
            <li>退休人员或即将退休人群</li>
          </ul>

          <p><strong>3. 混合型基金</strong></p>
          <p><strong>定义：</strong>股票、债券比例灵活配置</p>
          <p><strong>特点：</strong></p>
          <ul>
            <li>进可攻退可守：牛市增加股票，熊市增加债券</li>
            <li>风险适中：波动小于股票基金</li>
            <li>考验基金经理能力：需要准确判断市场</li>
          </ul>

          <p><strong>细分类型：</strong></p>
          <ul>
            <li><strong>偏股混合</strong>：股票占60%-95%，类似股票基金</li>
            <li><strong>偏债混合</strong>：债券占比更高，波动小</li>
            <li><strong>平衡混合</strong>：股债比例相对均衡</li>
            <li><strong>灵活配置</strong>：股票0%-95%，完全灵活</li>
          </ul>

          <p><strong>历史表现：</strong></p>
          <ul>
            <li>优秀混合基金近5年年化收益：8%-12%</li>
            <li>最大回撤：15%-25%</li>
            <li>夏普比率（收益/波动）：优于纯股票基金</li>
          </ul>

          <p><strong>适合人群：</strong></p>
          <ul>
            <li>中等风险承受能力</li>
            <li>希望兼顾收益和稳定</li>
            <li>投资期限2-3年以上</li>
          </ul>

          <p><strong>4. 货币型基金</strong></p>
          <p><strong>定义：</strong>投资于短期货币市场工具（国债、央行票据、银行存款等）</p>
          <p><strong>特点：</strong></p>
          <ul>
            <li>风险极低：历史上几乎没有亏损</li>
            <li>流动性强：T+0或T+1快速赎回</li>
            <li>收益低：年化收益约2%-3%</li>
          </ul>

          <p><strong>典型代表：</strong></p>
          <ul>
            <li>余额宝、零钱通（对接货币基金）</li>
            <li>年化收益：1.5%-2.5%</li>
            <li>规模：余额宝最高曾超1.6万亿</li>
          </ul>

          <p><strong>适合场景：</strong></p>
          <ul>
            <li>短期闲置资金管理（1周-3个月）</li>
            <li>股票账户现金管理</li>
            <li>应急资金存放</li>
            <li>等待投资机会时的临时停靠</li>
          </ul>

          <p><strong>5. 指数型基金</strong></p>
          <p><strong>定义：</strong>被动跟踪特定指数（如沪深300、中证500）</p>
          <p><strong>特点：</strong></p>
          <ul>
            <li>费用低：管理费0.5%，远低于主动基金的1.5%</li>
            <li>透明度高：持仓完全按指数配置</li>
            <li>适合定投：长期收益接近市场平均</li>
          </ul>

          <p><strong>常见指数：</strong></p>
          <ul>
            <li><strong>沪深300</strong>：大盘蓝筹，最稳健</li>
            <li><strong>中证500</strong>：中小盘，弹性更大</li>
            <li><strong>创业板指</strong>：科技成长股，高波动</li>
            <li><strong>科创50</strong>：科创板龙头，高风险高收益</li>
          </ul>

          <p><strong>历史表现（以沪深300为例）：</strong></p>
          <ul>
            <li>2005-2020年（15年）涨幅：约300%</li>
            <li>年化收益：约9.5%</li>
            <li>但期间经历多次牛熊，波动巨大</li>
          </ul>

          <p><strong>巴菲特的建议：</strong></p>
          <p>"通过定期投资指数基金，一个什么都不懂的业余投资者往往能够战胜大部分专业投资者。"</p>

          <h4>📈 不同类型基金收益风险对比</h4>
          <table style="width:100%;font-size:11px;margin:10px 0">
            <tr style="background:#f5f5f5;font-weight:bold">
              <td>类型</td><td>年化收益</td><td>波动率</td><td>最大回撤</td><td>适合期限</td>
            </tr>
            <tr>
              <td>货币基金</td><td>2%-3%</td><td>极低</td><td>几乎为0</td><td>随时</td>
            </tr>
            <tr>
              <td>债券基金</td><td>3%-6%</td><td>低</td><td>2%-5%</td><td>6个月+</td>
            </tr>
            <tr>
              <td>混合基金</td><td>6%-12%</td><td>中等</td><td>15%-25%</td><td>2年+</td>
            </tr>
            <tr>
              <td>股票基金</td><td>10%-15%</td><td>高</td><td>30%-40%</td><td>3年+</td>
            </tr>
            <tr>
              <td>指数基金</td><td>8%-12%</td><td>高</td><td>40%-50%</td><td>5年+</td>
            </tr>
          </table>

          <h4>💡 如何选择适合自己的基金类型？</h4>

          <p><strong>方法1：根据投资期限</strong></p>
          <ul>
            <li><strong>3个月内</strong>：货币基金</li>
            <li><strong>3个月-1年</strong>：债券基金</li>
            <li><strong>1-3年</strong>：混合基金</li>
            <li><strong>3年以上</strong>：股票基金、指数基金</li>
          </ul>

          <p><strong>方法2：根据风险承受能力</strong></p>
          <ul>
            <li><strong>保守型（不能接受亏损）</strong>：货币基金、纯债基金</li>
            <li><strong>稳健型（可接受5%以内亏损）</strong>：债券基金、偏债混合基金</li>
            <li><strong>平衡型（可接受10%-20%亏损）</strong>：混合基金、沪深300指数</li>
            <li><strong>激进型（可接受30%以上亏损）</strong>：股票基金、中证500指数</li>
          </ul>

          <p><strong>方法3：根据投资目标</strong></p>
          <ul>
            <li><strong>短期应急资金</strong>：货币基金</li>
            <li><strong>孩子教育金（5年后用）</strong>：混合基金+债券基金</li>
            <li><strong>养老金（20年后用）</strong>：股票基金+指数基金</li>
            <li><strong>买房首付（3年后用）</strong>：债券基金为主，少量混合基金</li>
          </ul>

          <h4>🎯 资产配置建议</h4>
          <p><strong>不要把鸡蛋放在一个篮子里！</strong></p>

          <p><strong>保守型组合（追求稳定）：</strong></p>
          <ul>
            <li>货币基金：20%（应急备用）</li>
            <li>债券基金：60%（稳定收益）</li>
            <li>混合基金：20%（适度进取）</li>
            <li>预期年化收益：4%-6%</li>
          </ul>

          <p><strong>稳健型组合（平衡收益风险）：</strong></p>
          <ul>
            <li>货币基金：10%</li>
            <li>债券基金：30%</li>
            <li>混合基金：40%</li>
            <li>股票/指数基金：20%</li>
            <li>预期年化收益：6%-9%</li>
          </ul>

          <p><strong>激进型组合（追求高收益）：</strong></p>
          <ul>
            <li>货币基金：5%</li>
            <li>债券基金：15%</li>
            <li>混合基金：30%</li>
            <li>股票/指数基金：50%</li>
            <li>预期年化收益：10%-15%（波动大）</li>
          </ul>

          <h4>⚠️ 常见错误</h4>
          <ul>
            <li>❌ 全部买股票基金，波动承受不了</li>
            <li>❌ 全部买货币基金，收益跑不赢通胀</li>
            <li>❌ 市场好时全仓股票，市场不好全清仓</li>
            <li>✅ 正确：根据自身情况合理配置，长期持有</li>
          </ul>

          <h4>✅ 本课小结</h4>
          <p>不同类型的基金各有特点，没有绝对的好坏，关键是选择适合自己的。记住：期限越长，可以承受的风险越大；期限越短，应选择波动更小的品种。</p>

          <p style="text-align:center;margin-top:20px;color:#d4af37;font-weight:bold;">💪 理解了基金分类，点击"完成学习"继续下一课！</p>
        `,
        '基金的费用结构解析': `
          <h4>📚 课程简介</h4>
          <p>全面了解基金投资的各项费用，学会计算和节省投资成本，提高实际收益率。</p>

          <h4>💰 基金费用分类</h4>
          <p><strong>1. 申购费</strong></p>
          <ul>
            <li>前端收费：申购时扣除，通常0.6%-1.5%</li>
            <li>后端收费：赎回时扣除，持有时间越长费率越低</li>
            <li>费率折扣：通过第三方平台可享1折优惠</li>
          </ul>

          <p><strong>2. 赎回费</strong></p>
          <ul>
            <li>持有7天内赎回：1.5%惩罚性费率</li>
            <li>持有7天-1年：0.5%</li>
            <li>持有1-2年：0.25%</li>
            <li>持有2年以上：通常免赎回费</li>
          </ul>

          <p><strong>3. 管理费（按年计算，每日计提）</strong></p>
          <ul>
            <li>股票型基金：1.2%-1.5%/年</li>
            <li>债券型基金：0.6%-0.8%/年</li>
            <li>货币基金：0.25%-0.33%/年</li>
            <li>指数基金：0.5%-0.6%/年（被动管理，费率较低）</li>
          </ul>

          <p><strong>4. 托管费（按年计算，每日计提）</strong></p>
          <ul>
            <li>股票型：0.25%/年</li>
            <li>债券型：0.2%/年</li>
            <li>货币型：0.1%/年</li>
          </ul>

          <p><strong>5. 销售服务费（C类份额）</strong></p>
          <ul>
            <li>债券基金C类：0.4%/年</li>
            <li>货币基金：0.25%/年</li>
            <li>适合短期持有（少于半年）</li>
          </ul>

          <h4>📊 费用对收益的影响（案例分析）</h4>
          <p><strong>案例：投资10万元，年化收益10%，持有5年</strong></p>
          <ul>
            <li>不考虑费用：最终资产 = 161,051元</li>
            <li>考虑费用（申购1.5%+管理1.5%+托管0.25%）：最终资产 = 148,523元</li>
            <li>费用损失：12,528元，占收益的20.6%！</li>
          </ul>

          <h4>💡 省钱技巧</h4>
          <ul>
            <li><strong>选择C类份额</strong>：短期投资（<6个月）选C类免申购费</li>
            <li><strong>定投优惠</strong>：定投申购费率通常更低</li>
            <li><strong>第三方平台</strong>：天天基金、蚂蚁财富等享1折申购费</li>
            <li><strong>指数基金</strong>：管理费低，长期投资更划算</li>
            <li><strong>长期持有</strong>：持有2年以上免赎回费</li>
          </ul>

          <h4>⚠️ 注意事项</h4>
          <ul>
            <li>管理费和托管费每日扣除，已反映在净值中</li>
            <li>基金分红不收取任何费用</li>
            <li>转换基金费率通常低于赎回后重新申购</li>
          </ul>
        `,
        '如何阅读基金招募说明书': `
          <h4>📚 课程简介</h4>
          <p>掌握阅读基金招募说明书的方法，从海量信息中快速提取关键内容，做出明智投资决策。</p>

          <h4>📋 招募说明书核心章节</h4>
          <p><strong>1. 基金概况（必读）</strong></p>
          <ul>
            <li>基金名称、类型、投资目标</li>
            <li>业绩比较基准（判断风格）</li>
            <li>风险收益特征（了解风险等级）</li>
          </ul>

          <p><strong>2. 投资范围与策略（核心）</strong></p>
          <ul>
            <li>股票仓位：如"股票资产占60%-95%"</li>
            <li>投资行业和主题限制</li>
            <li>投资策略和选股标准</li>
            <li>衍生品使用情况</li>
          </ul>

          <p><strong>3. 费率结构（重点关注）</strong></p>
          <ul>
            <li>各渠道申购费率对比</li>
            <li>赎回费率阶梯</li>
            <li>管理费、托管费年费率</li>
          </ul>

          <p><strong>4. 基金管理人信息</strong></p>
          <ul>
            <li>基金经理履历和过往业绩</li>
            <li>管理基金数量和规模</li>
            <li>投资风格和换手率</li>
          </ul>

          <p><strong>5. 风险揭示（务必阅读）</strong></p>
          <ul>
            <li>市场风险、信用风险</li>
            <li>流动性风险</li>
            <li>特定风险（如商品基金的杠杆风险）</li>
          </ul>

          <h4>🔍 快速阅读技巧</h4>
          <p><strong>5分钟速读法：</strong></p>
          <ol>
            <li>看目录，找到关键章节（投资范围、费率、风险）</li>
            <li>查看"基金概况"表格，了解基本信息</li>
            <li>重点阅读"投资策略"和"投资限制"</li>
            <li>对比费率，选择低费率渠道</li>
            <li>浏览风险提示，确认风险承受能力</li>
          </ol>

          <h4>⚠️ 警惕信号</h4>
          <ul>
            <li>投资范围过于宽泛或模糊</li>
            <li>费率明显高于同类基金</li>
            <li>基金经理频繁更换</li>
            <li>风险提示过多或异常</li>
          </ul>

          <h4>📝 实战建议</h4>
          <p>购买基金前，至少花10分钟阅读招募说明书的关键章节。重点关注投资范围、费率和风险，确保符合自己的投资目标。</p>
        `,
        '基金净值与收益计算': `
          <h4>📚 课程简介</h4>
          <p>学习基金净值的计算方法和收益计算公式，准确评估投资回报，避免常见误区。</p>

          <h4>📊 基金净值类型</h4>
          <p><strong>1. 单位净值</strong></p>
          <p>基金每份的价值，计算公式：</p>
          <p>单位净值 = （基金总资产 - 基金总负债）/ 基金总份额</p>
          <p>例如：某基金总资产10亿，负债1000万，份额9亿份</p>
          <p>单位净值 = (10亿 - 0.1亿) / 9亿 = 1.10元</p>

          <p><strong>2. 累计净值</strong></p>
          <p>累计净值 = 单位净值 + 历史分红总额</p>
          <p>反映基金成立以来的总收益，更能体现基金真实业绩。</p>

          <p><strong>3. 复权净值</strong></p>
          <p>假设所有分红再投资后的净值，用于计算真实收益率。</p>

          <h4>💰 收益计算方法</h4>
          <p><strong>案例1：无分红情况</strong></p>
          <ul>
            <li>买入：净值1.00元，投资10,000元，份额10,000份</li>
            <li>卖出：净值1.20元</li>
            <li>收益 = 10,000 × (1.20 - 1.00) = 2,000元</li>
            <li>收益率 = 2,000 / 10,000 = 20%</li>
          </ul>

          <p><strong>案例2：有分红情况（现金分红）</strong></p>
          <ul>
            <li>买入：净值1.00元，份额10,000份</li>
            <li>持有期间分红：每份0.10元，共1,000元</li>
            <li>分红后净值：0.90元</li>
            <li>卖出：净值1.10元</li>
            <li>收益 = 10,000 × (1.10 - 1.00) + 1,000 = 2,000元</li>
          </ul>

          <p><strong>案例3：红利再投资</strong></p>
          <ul>
            <li>分红1,000元，分红日净值0.90元</li>
            <li>再投资份额 = 1,000 / 0.90 = 1,111份</li>
            <li>总份额变为11,111份</li>
            <li>卖出时净值1.10元</li>
            <li>收益 = 11,111 × 1.10 - 10,000 = 2,222元（更高！）</li>
          </ul>

          <h4>📈 年化收益率计算</h4>
          <p>年化收益率 = [(期末净值 / 期初净值) ^ (365/持有天数) - 1] × 100%</p>
          <p>例如：持有180天，净值从1.00涨到1.10</p>
          <p>年化收益率 = [(1.10/1.00)^(365/180) - 1] × 100% = 20.9%</p>

          <h4>⚠️ 常见误区</h4>
          <ul>
            <li><strong>误区1</strong>：净值越低越便宜？错！应看估值和未来潜力</li>
            <li><strong>误区2</strong>：只看单位净值不看累计净值</li>
            <li><strong>误区3</strong>：忽略分红对收益的影响</li>
            <li><strong>误区4</strong>：用简单收益率代替年化收益率</li>
          </ul>

          <h4>💡 实用技巧</h4>
          <ul>
            <li>使用基金APP的收益计算器</li>
            <li>定投要看复权净值计算真实收益</li>
            <li>对比业绩用年化收益率，更科学</li>
          </ul>
        `,
        '基金分红方式的选择': `
          <h4>📚 课程简介</h4>
          <p>深入了解基金分红的两种方式，学会根据市场环境和个人需求选择最优分红策略。</p>

          <h4>💰 两种分红方式</h4>
          <p><strong>1. 现金分红</strong></p>
          <ul>
            <li>分红直接转入资金账户</li>
            <li>类似股票分红</li>
            <li>到账时间：T+2至T+7个工作日</li>
            <li>不收取任何费用</li>
          </ul>

          <p><strong>2. 红利再投资</strong></p>
          <ul>
            <li>分红自动购买该基金</li>
            <li>不收取申购费</li>
            <li>份额增加，实现复利效果</li>
            <li>需手动设置，默认为现金分红</li>
          </ul>

          <h4>📊 收益对比（数据说话）</h4>
          <p><strong>案例：投资10万元，每年分红2次，每次5%</strong></p>

          <p><strong>现金分红（5年后）</strong></p>
          <ul>
            <li>本金：10万元（不变）</li>
            <li>分红累计：约5.5万元</li>
            <li>总资产：15.5万元</li>
          </ul>

          <p><strong>红利再投资（5年后）</strong></p>
          <ul>
            <li>份额滚雪球增长</li>
            <li>总资产：16.3万元</li>
            <li>多赚：8,000元（复利威力！）</li>
          </ul>

          <h4>🎯 如何选择？</h4>
          <p><strong>选择现金分红的情况：</strong></p>
          <ul>
            <li>需要现金流（如退休人员）</li>
            <li>市场处于高位，想落袋为安</li>
            <li>准备赎回基金</li>
            <li>想转投其他更好的标的</li>
          </ul>

          <p><strong>选择红利再投资的情况：</strong></p>
          <ul>
            <li>长期投资，不需要现金流</li>
            <li>看好基金未来表现</li>
            <li>市场处于低位或上升通道</li>
            <li>追求复利效应</li>
          </ul>

          <h4>💡 进阶策略</h4>
          <p><strong>动态调整策略：</strong></p>
          <ul>
            <li><strong>牛市中后期</strong>：改为现金分红，逐步止盈</li>
            <li><strong>熊市或震荡市</strong>：选红利再投资，低位增加份额</li>
            <li><strong>定投期间</strong>：红利再投资，强化复利</li>
            <li><strong>达到目标收益</strong>：现金分红，锁定收益</li>
          </ul>

          <h4>⚠️ 注意事项</h4>
          <ul>
            <li>分红不是额外收益，来自基金净资产</li>
            <li>分红后净值会下降相应比例</li>
            <li>红利再投资不收申购费，但计入持有时间</li>
            <li>可随时修改分红方式，次日生效</li>
          </ul>
        `,
        '基金交易渠道对比': `
          <h4>📚 课程简介</h4>
          <p>全面对比各类基金购买渠道的优缺点，选择最适合自己的交易平台，节省费用提高效率。</p>

          <h4>🏦 主要交易渠道</h4>
          <p><strong>1. 银行柜台/网银</strong></p>
          <ul>
            <li>✅ 优点：安全可靠，老年人熟悉</li>
            <li>❌ 缺点：申购费率高（0.6%-1.5%），品种少，操作繁琐</li>
            <li>适合人群：中老年保守投资者</li>
          </ul>

          <p><strong>2. 基金公司官网/APP</strong></p>
          <ul>
            <li>✅ 优点：费率适中（4-8折），产品全面，官方服务</li>
            <li>❌ 缺点：只能买该公司产品，需注册多个平台</li>
            <li>适合人群：长期持有特定基金的投资者</li>
          </ul>

          <p><strong>3. 第三方销售平台（推荐）</strong></p>
          <p><strong>支付宝（蚂蚁财富）</strong></p>
          <ul>
            <li>✅ 申购费1折起，品种全（7000+只）</li>
            <li>✅ 界面友好，定投方便</li>
            <li>✅ 货币基金T+0快速赎回</li>
            <li>适合：新手和大众投资者</li>
          </ul>

          <p><strong>天天基金网</strong></p>
          <ul>
            <li>✅ 基金品种最全（8000+只）</li>
            <li>✅ 数据工具最专业</li>
            <li>✅ 费率1折，优惠活动多</li>
            <li>适合：进阶投资者</li>
          </ul>

          <p><strong>微信理财通</strong></p>
          <ul>
            <li>✅ 微信生态便捷</li>
            <li>✅ 费率1折</li>
            <li>❌ 品种相对较少</li>
            <li>适合：微信重度用户</li>
          </ul>

          <p><strong>4. 证券公司APP</strong></p>
          <ul>
            <li>✅ 场内场外基金都能买</li>
            <li>✅ 适合股票+基金组合投资</li>
            <li>✅ ETF交易手续费低</li>
            <li>❌ 界面相对复杂</li>
            <li>适合：有股票账户的投资者</li>
          </ul>

          <h4>💰 费率对比表</h4>
          <table style="width:100%;text-align:center;margin:10px 0">
            <tr style="background:#f5f5f5;font-weight:bold">
              <td>渠道</td><td>申购费</td><td>定投费</td>
            </tr>
            <tr>
              <td>银行柜台</td><td>1.2%-1.5%</td><td>1.0%-1.2%</td>
            </tr>
            <tr>
              <td>基金公司</td><td>0.6%-1.2%</td><td>0.6%-1.0%</td>
            </tr>
            <tr>
              <td>第三方平台</td><td>0.15%（1折）</td><td>0.15%</td>
            </tr>
          </table>

          <h4>🎯 选择建议</h4>
          <ul>
            <li><strong>新手首选</strong>：支付宝/微信，操作简单费率低</li>
            <li><strong>专业投资者</strong>：天天基金网，工具丰富数据全</li>
            <li><strong>股民</strong>：证券APP，一站式管理</li>
            <li><strong>大额投资</strong>：基金公司直销，VIP服务</li>
          </ul>

          <h4>⚠️ 注意事项</h4>
          <ul>
            <li>选择正规持牌机构，警惕非法平台</li>
            <li>同一基金在不同平台费率可能不同</li>
            <li>转托管（换平台）可能需要手续费</li>
          </ul>
        `,
        '基金定投的基本原理': `
          <h4>📚 课程简介</h4>
          <p>深入理解基金定投的核心原理，掌握这一"懒人理财"神器的科学投资方法。</p>

          <h4>🎯 什么是基金定投</h4>
          <p>基金定投（定期定额投资）是指在固定时间（如每月1日）以固定金额（如1000元）投资指定基金的投资方式。</p>

          <h4>💡 定投的核心原理</h4>
          <p><strong>1. 平均成本法（Dollar Cost Averaging）</strong></p>
          <p>通过分批买入，平滑市场波动，降低平均持有成本。</p>

          <p><strong>案例演示：</strong></p>
          <ul>
            <li>第1月：净值1.00元，投1000元，买入1000份</li>
            <li>第2月：净值0.80元，投1000元，买入1250份</li>
            <li>第3月：净值1.20元，投1000元，买入833份</li>
            <li>总投入：3000元，总份额：3083份</li>
            <li>平均成本：3000/3083 = 0.973元</li>
            <li>简单平均净值：(1.00+0.80+1.20)/3 = 1.00元</li>
            <li>结论：定投成本更低！</li>
          </ul>

          <p><strong>2. 复利效应</strong></p>
          <p>长期坚持，小钱变大钱。假设年化收益10%：</p>
          <ul>
            <li>每月定投1000元，10年后：约20.5万</li>
            <li>每月定投1000元，20年后：约76万</li>
            <li>每月定投1000元，30年后：约226万</li>
          </ul>

          <p><strong>3. 纪律性投资</strong></p>
          <p>避免追涨杀跌，克服人性弱点。</p>

          <h4>📊 定投的适用场景</h4>
          <p><strong>最适合定投：</strong></p>
          <ul>
            <li>股票型基金（波动大，成本平滑效果好）</li>
            <li>指数基金（长期上涨，适合长期持有）</li>
            <li>行业主题基金（高波动品种）</li>
          </ul>

          <p><strong>不适合定投：</strong></p>
          <ul>
            <li>货币基金（收益稳定，定投无意义）</li>
            <li>债券基金（波动小，一次性投入更好）</li>
          </ul>

          <h4>⏰ 定投时间选择</h4>
          <p><strong>扣款日期：</strong></p>
          <ul>
            <li>每月1-10日：资金充裕，不易忘记</li>
            <li>发薪日后1-2天：最佳选择</li>
            <li>避免月末：可能余额不足</li>
          </ul>

          <p><strong>投资周期：</strong></p>
          <ul>
            <li>每周定投：适合高波动市场</li>
            <li>每月定投：最常见，推荐</li>
            <li>每季度定投：适合懒人</li>
          </ul>

          <h4>💰 投资金额建议</h4>
          <ul>
            <li>工薪族：月收入的10%-30%</li>
            <li>新手：从500-1000元起步</li>
            <li>确保不影响正常生活</li>
          </ul>

          <h4>⚠️ 常见误区</h4>
          <ul>
            <li><strong>误区1</strong>：只要定投就一定赚钱 ✗</li>
            <li>正确：选对基金+足够长的时间+及时止盈</li>
            <li><strong>误区2</strong>：市场涨了就暂停 ✗</li>
            <li>正确：坚持纪律，不要择时</li>
            <li><strong>误区3</strong>：永远不卖 ✗</li>
            <li>正确：达到目标收益要止盈</li>
          </ul>
        `
      },
      ipo: {
        'IPO新股投资入门': `
          <h4>📚 课程简介</h4>
          <p>全面了解IPO新股投资的基础知识，掌握参与新股申购的方法和技巧。</p>

          <h4>🎯 什么是IPO</h4>
          <p>IPO（Initial Public Offering）即首次公开募股，是指企业通过证券交易所首次向公众投资者发行股票的过程。</p>

          <h4>💡 新股投资的特点</h4>
          <ul>
            <li><strong>高收益潜力</strong>：新股上市首日往往有较大涨幅</li>
            <li><strong>低风险</strong>：网上申购无需预缴资金，中签后再缴款</li>
            <li><strong>公平性</strong>：按市值配号，中签率取决于申购金额</li>
            <li><strong>门槛要求</strong>：需持有相应市场的股票市值</li>
          </ul>

          <h4>📖 申购流程</h4>
          <p><strong>1. 准备阶段</strong></p>
          <p>确保账户有足够市值（T-2日前20个交易日日均市值达到要求）。</p>

          <p><strong>2. 申购阶段</strong></p>
          <p>在申购日（T日）交易时间内，按规定数量申购新股。</p>

          <p><strong>3. 配号抽签</strong></p>
          <p>T+1日获得配号，T+2日公布中签结果。</p>

          <p><strong>4. 缴款阶段</strong></p>
          <p>T+2日16:00前，确保账户有足够资金缴纳中签款项。</p>

          <h4>⚠️ 注意事项</h4>
          <p>连续12个月内累计3次中签但未足额缴款，将被禁止参与新股申购6个月。</p>
        `,
        '新股中签率与配号机制': `
          <h4>📚 课程简介</h4>
          <p>深入理解新股配号、抽签、中签的完整流程，掌握提高中签概率的实用技巧。</p>

          <h4>🎯 配号机制详解</h4>
          <p><strong>沪市配号规则</strong></p>
          <ul>
            <li>每1万元市值配1个号</li>
            <li>每个配号包含1000股</li>
            <li>例如：持有30万市值，可获得3个配号</li>
          </ul>

          <p><strong>深市配号规则</strong></p>
          <ul>
            <li>每5000元市值配1个号</li>
            <li>每个配号包含500股</li>
            <li>例如：持有30万市值，可获得60个配号</li>
          </ul>

          <h4>💡 抽签过程</h4>
          <p><strong>1. 配号生成</strong></p>
          <p>T+1日（申购后第一天），交易所会按照申购顺序为每个账户分配连续的配号。例如：申购3000股沪市新股，会获得3个连续配号，如1234567、1234568、1234569。</p>

          <p><strong>2. 摇号抽签</strong></p>
          <p>T+1日晚间，主承销商主持摇号抽签，在所有配号中随机抽取中签号码。抽签过程由公证机关监督，确保公平公正。</p>

          <p><strong>3. 中签查询</strong></p>
          <p>T+2日，投资者可以通过交易软件查询是否中签。如果您的配号与中签号码匹配，恭喜您中签！</p>

          <h4>📊 中签率计算</h4>
          <p>中签率 = (发行股数 / 申购股数) × 100%</p>
          <p>例如：某新股发行1000万股，总申购100亿股，则中签率为0.1%。这意味着平均每申购1000股，中签1股。</p>

          <h4>🎯 提高中签率技巧</h4>
          <ul>
            <li><strong>持续参与</strong>：每只新股都参与申购，积少成多</li>
            <li><strong>顶格申购</strong>：在可申购额度范围内，尽量申购最大数量</li>
            <li><strong>多账户策略</strong>：家人名下的多个账户同时申购</li>
            <li><strong>选择时机</strong>：避开热门股，优先申购冷门股</li>
            <li><strong>沪深兼顾</strong>：同时持有沪深市值，增加申购机会</li>
          </ul>

          <h4>💰 资金安排</h4>
          <p>由于新股申购无需预缴资金，建议：</p>
          <ul>
            <li>T日申购无需占用资金</li>
            <li>T+2日16:00前确保账户有足额资金</li>
            <li>可以用同一笔资金参与多只新股申购</li>
            <li>合理安排资金使用，提高资金利用率</li>
          </ul>
        `,
        '科创板与创业板注册制': `
          <h4>📚 课程简介</h4>
          <p>深入了解科创板和创业板注册制改革，掌握这两个板块的投资机会和风险。</p>

          <h4>🚀 科创板特点</h4>
          <p><strong>定位与特色</strong></p>
          <p>科创板面向世界科技前沿、经济主战场、国家重大需求，主要服务于符合国家战略、突破关键核心技术、市场认可度高的科技创新企业。</p>

          <p><strong>上市条件</strong></p>
          <ul>
            <li>5套差异化上市标准，包容不同类型企业</li>
            <li>允许未盈利企业上市</li>
            <li>允许同股不同权</li>
            <li>允许红筹企业上市</li>
          </ul>

          <h4>💡 开通权限要求</h4>
          <p><strong>科创板权限</strong></p>
          <ul>
            <li>资产要求：开通前20个交易日日均资产不低于50万元</li>
            <li>经验要求：参与证券交易24个月以上</li>
            <li>风险承受能力：C4（积极型）及以上</li>
          </ul>

          <p><strong>创业板权限</strong></p>
          <ul>
            <li>资产要求：开通前20个交易日日均资产不低于10万元</li>
            <li>经验要求：参与证券交易24个月以上</li>
            <li>需签署《创业板投资风险揭示书》</li>
          </ul>

          <h4>📊 交易规则差异</h4>
          <p><strong>涨跌幅限制</strong></p>
          <ul>
            <li><strong>前5个交易日</strong>：无涨跌幅限制</li>
            <li><strong>第6个交易日起</strong>：涨跌幅限制为20%</li>
            <li>设置临时停牌机制：盘中涨跌超过30%、60%各停牌10分钟</li>
          </ul>

          <p><strong>申购规则</strong></p>
          <ul>
            <li>网上申购比例通常较高</li>
            <li>科创板单位：500股/个号</li>
            <li>市值要求与主板相同</li>
          </ul>

          <h4>⚠️ 风险提示</h4>
          <ul>
            <li><strong>高波动性</strong>：前5日无涨跌幅限制，波动剧烈</li>
            <li><strong>退市风险</strong>：退市标准更严格，执行更坚决</li>
            <li><strong>估值风险</strong>：科创企业估值难度大，存在高估风险</li>
            <li><strong>流动性风险</strong>：部分个股交易不活跃</li>
          </ul>

          <h4>🎯 投资策略</h4>
          <ul>
            <li>关注企业核心技术和市场竞争力</li>
            <li>重视研发投入和知识产权</li>
            <li>理性看待高估值，注意风险</li>
            <li>设置止损止盈，控制仓位</li>
          </ul>
        `,
        '打新策略与资金管理': `
          <h4>📚 课程简介</h4>
          <p>学习科学的打新策略和资金管理方法，提升新股投资的收益率和资金使用效率。</p>

          <h4>💰 市值配置策略</h4>
          <p><strong>沪深市值分配</strong></p>
          <ul>
            <li><strong>基础配置</strong>：沪市20万、深市10万</li>
            <li><strong>均衡配置</strong>：根据新股发行频率调整，沪市30-40万、深市20-30万</li>
            <li><strong>激进配置</strong>：沪市50万以上、深市40万以上</li>
          </ul>

          <p><strong>持仓选择</strong></p>
          <ul>
            <li>优先选择低波动、高股息的蓝筹股</li>
            <li>避免高波动小盘股，减少市值损失</li>
            <li>可配置ETF基金，分散风险</li>
            <li>定期调整持仓，保持市值稳定</li>
          </ul>

          <h4>📊 顶格申购技巧</h4>
          <p><strong>什么是顶格申购</strong></p>
          <p>顶格申购是指按照自己的市值额度，申购该新股的最大数量。例如，沪市持有市值50万，可申购5个号（5000股），如果该新股申购上限是5000股，则为顶格申购。</p>

          <p><strong>顶格申购的优势</strong></p>
          <ul>
            <li>最大化中签概率</li>
            <li>充分利用市值额度</li>
            <li>对于小盘股，顶格申购中签率显著提升</li>
          </ul>

          <h4>🎯 打新日历管理</h4>
          <p><strong>申购排期</strong></p>
          <ul>
            <li>关注券商APP的打新日历</li>
            <li>设置申购提醒，避免遗漏</li>
            <li>优先申购同日多只新股</li>
            <li>记录申购情况，统计中签率</li>
          </ul>

          <p><strong>缴款提醒</strong></p>
          <ul>
            <li>T+2日16:00前必须完成缴款</li>
            <li>设置手机提醒，避免忘记</li>
            <li>可使用银证转账或信用卡还款</li>
            <li>留足资金余量，防止余额不足</li>
          </ul>

          <h4>💡 资金利用效率</h4>
          <p><strong>T+0滚动策略</strong></p>
          <ul>
            <li>同一笔资金可参与多只新股申购</li>
            <li>只需在中签缴款日准备资金</li>
            <li>申购期间资金可用于理财或国债逆回购</li>
            <li>合理安排现金流，提高收益</li>
          </ul>

          <h4>📈 收益优化策略</h4>
          <p><strong>卖出时机选择</strong></p>
          <ul>
            <li><strong>首日卖出</strong>：适合大盘股、热度低的新股</li>
            <li><strong>开板卖出</strong>：适合连板新股，开板后及时止盈</li>
            <li><strong>持有观察</strong>：优质科技股可长期持有</li>
          </ul>

          <h4>⚠️ 风险控制</h4>
          <ul>
            <li>设置打新专用账户，独立管理</li>
            <li>控制持仓市值，避免市值亏损大于打新收益</li>
            <li>分散配置，不要过度集中</li>
            <li>定期复盘，总结经验教训</li>
          </ul>
        `,
        '新股申购规则详解': `
          <h4>📚 课程简介</h4>
          <p>详细讲解A股、科创板、创业板的新股申购规则，帮助您提高申购效率。</p>

          <h4>🎯 市值要求</h4>
          <p><strong>沪市</strong></p>
          <ul>
            <li>T-2日前20个交易日日均持有沪市非限售A股市值1万元以上</li>
            <li>每1万元市值可申购1000股</li>
            <li>不足1万元的部分不计入申购额度</li>
          </ul>

          <p><strong>深市</strong></p>
          <ul>
            <li>T-2日前20个交易日日均持有深市非限售A股市值1万元以上</li>
            <li>每5000元市值可申购500股</li>
            <li>两市市值分别计算，不能合并使用</li>
          </ul>

          <h4>💡 科创板与创业板特殊规则</h4>
          <p><strong>科创板</strong></p>
          <ul>
            <li>需开通科创板交易权限</li>
            <li>资产要求：50万元以上</li>
            <li>经验要求：2年以上交易经验</li>
            <li>上市前5日不设涨跌幅限制</li>
          </ul>

          <p><strong>创业板（注册制）</strong></p>
          <ul>
            <li>需签署《创业板投资风险揭示书》</li>
            <li>上市前5日不设涨跌幅限制</li>
            <li>之后涨跌幅限制为20%</li>
          </ul>

          <h4>📝 提高中签率技巧</h4>
          <ul>
            <li>坚持每日申购，积少成多</li>
            <li>优先申购冷门行业新股</li>
            <li>选择申购时间靠后的新股</li>
            <li>可考虑多账户申购（不同人）</li>
          </ul>
        `
      },
      bond: {
        '债券投资基础入门': `
          <h4>📚 课程简介</h4>
          <p>全面了解债券投资的基础知识，掌握债券市场的运作机制。</p>

          <h4>🎯 什么是债券</h4>
          <p>债券是政府、金融机构、企业等发行的债务凭证，约定在一定期限内按约定利率支付利息并偿还本金。</p>

          <h4>💡 债券的基本要素</h4>
          <ul>
            <li><strong>票面价值</strong>：债券的面值，通常为100元</li>
            <li><strong>票面利率</strong>：发行时约定的利率</li>
            <li><strong>到期日</strong>：债券偿还本金的日期</li>
            <li><strong>发行人</strong>：借款方，承担还本付息义务</li>
          </ul>

          <h4>📖 债券的分类</h4>
          <p><strong>按发行主体分类：</strong></p>
          <ul>
            <li>国债：国家发行，安全性最高</li>
            <li>地方政府债：地方政府发行，较安全</li>
            <li>金融债：银行等金融机构发行</li>
            <li>企业债/公司债：企业发行，风险较高</li>
          </ul>

          <p><strong>按付息方式分类：</strong></p>
          <ul>
            <li>固定利率债券：利率固定不变</li>
            <li>浮动利率债券：利率随市场调整</li>
            <li>零息债券：到期一次还本付息</li>
          </ul>

          <h4>⚠️ 投资债券的风险</h4>
          <ul>
            <li><strong>信用风险</strong>：发行人违约风险</li>
            <li><strong>利率风险</strong>：市场利率变化导致价格波动</li>
            <li><strong>流动性风险</strong>：变现困难的风险</li>
            <li><strong>通胀风险</strong>：购买力下降的风险</li>
          </ul>
        `,
        '债券的收益与风险': `
          <h4>📚 课程简介</h4>
          <p>深入理解债券的收益来源和风险因素，学会评估债券投资价值。</p>

          <h4>💰 债券的收益来源</h4>
          <p><strong>1. 票息收入</strong></p>
          <p>持有债券期间获得的利息收入，是债券最主要的收益来源。</p>

          <p><strong>2. 资本利得</strong></p>
          <p>债券价格上涨时卖出获得的差价收益。债券价格受市场利率、供求关系等因素影响。</p>

          <p><strong>3. 再投资收益</strong></p>
          <p>将获得的票息收入再投资所产生的收益。</p>

          <h4>📊 到期收益率（YTM）</h4>
          <p>到期收益率是衡量债券投资回报的重要指标，考虑了债券的购买价格、票面利率、到期时间等因素。</p>
          <p>计算公式较为复杂，投资者可使用债券收益率计算器或查看债券交易软件的自动计算结果。</p>

          <h4>⚠️ 主要风险类型</h4>
          <p><strong>信用风险</strong></p>
          <p>可通过查看债券信用评级（AAA、AA、A等）来评估，评级越高信用风险越低。</p>

          <p><strong>利率风险</strong></p>
          <p>市场利率上升时，债券价格下跌；市场利率下降时，债券价格上涨。久期越长，利率风险越大。</p>

          <p><strong>流动性风险</strong></p>
          <p>部分债券交易不活跃，急需变现时可能面临较大折价。</p>

          <h4>💡 风险管理策略</h4>
          <ul>
            <li>分散投资：不要把资金集中在单一债券</li>
            <li>关注评级：优先选择高评级债券</li>
            <li>匹配期限：根据资金使用时间选择债券期限</li>
            <li>定期检视：关注发行人财务状况变化</li>
          </ul>
        `,
        '国债与政府债券': `
          <h4>📚 课程简介</h4>
          <p>深入了解国债和地方政府债券的特点，掌握低风险固定收益产品的投资方法。</p>

          <h4>🏛️ 国债详解</h4>
          <p><strong>什么是国债</strong></p>
          <p>国债是由国家财政部代表中央政府发行的政府债券，以国家信用为担保，被称为"金边债券"，是风险最低的投资品种之一。</p>

          <h4>📊 国债的类型</h4>
          <p><strong>1. 凭证式国债</strong></p>
          <ul>
            <li>通过银行柜台购买</li>
            <li>不可上市流通</li>
            <li>提前兑取按持有时间计息</li>
            <li>适合长期持有的投资者</li>
          </ul>

          <p><strong>2. 储蓄国债（电子式）</strong></p>
          <ul>
            <li>通过网上银行或银行柜台购买</li>
            <li>以电子方式记录</li>
            <li>定期付息，到期还本</li>
            <li>可提前兑取，按规定扣除利息</li>
          </ul>

          <p><strong>3. 记账式国债</strong></p>
          <ul>
            <li>通过证券账户购买</li>
            <li>可在交易所上市流通</li>
            <li>价格随市场波动</li>
            <li>流动性强，适合灵活配置</li>
          </ul>

          <h4>💰 国债的收益</h4>
          <ul>
            <li><strong>利息收入</strong>：按票面利率定期获得利息</li>
            <li><strong>资本利得</strong>：记账式国债可通过买卖差价获利</li>
            <li><strong>免税优惠</strong>：国债利息收入免征个人所得税</li>
          </ul>

          <h4>🏙️ 地方政府债券</h4>
          <p><strong>发行主体</strong></p>
          <p>由省、自治区、直辖市政府及其授权单位发行，用于地方公益性项目建设。</p>

          <p><strong>安全性分析</strong></p>
          <ul>
            <li>以地方政府信用为担保</li>
            <li>安全性仅次于国债</li>
            <li>受中央政府间接保护</li>
            <li>违约风险极低</li>
          </ul>

          <h4>🎯 投资策略</h4>
          <p><strong>适合人群</strong></p>
          <ul>
            <li>风险厌恶型投资者</li>
            <li>追求稳定收益的退休人员</li>
            <li>短期闲置资金的配置</li>
            <li>资产配置中的安全垫</li>
          </ul>

          <p><strong>购买技巧</strong></p>
          <ul>
            <li>关注发行公告，提前准备资金</li>
            <li>凭证式和储蓄国债通常在每月10日发行</li>
            <li>记账式国债可在二级市场买卖，关注价格走势</li>
            <li>比较不同期限收益率，选择性价比高的品种</li>
          </ul>

          <h4>⚠️ 注意事项</h4>
          <ul>
            <li>凭证式国债提前兑取按持有期限分档计息</li>
            <li>记账式国债价格受市场利率影响，可能出现浮亏</li>
            <li>地方政府债流动性相对较低</li>
            <li>长期国债面临更大的利率风险</li>
          </ul>
        `,
        '可转债投资策略': `
          <h4>📚 课程简介</h4>
          <p>全面学习可转债的特性和投资策略，掌握这一兼具债券安全性和股票成长性的金融工具。</p>

          <h4>🔄 什么是可转债</h4>
          <p>可转债全称为可转换公司债券，是一种可以在特定条件下转换为公司股票的债券。投资者既能获得债券的固定收益，又能享受股价上涨带来的收益。</p>

          <h4>💡 可转债的独特优势</h4>
          <p><strong>1. 下有保底，上不封顶</strong></p>
          <ul>
            <li>股价下跌时，作为债券持有，享受固定利息</li>
            <li>股价上涨时，转换为股票，分享股价涨幅</li>
            <li>到期必须还本付息，保障本金安全</li>
          </ul>

          <p><strong>2. T+0交易</strong></p>
          <ul>
            <li>当日买入当日可卖出</li>
            <li>交易灵活，便于快速止盈止损</li>
            <li>无涨跌幅限制（设置临时停牌机制）</li>
          </ul>

          <p><strong>3. 门槛低</strong></p>
          <ul>
            <li>最低1手（10张），约1000元</li>
            <li>无需市值要求</li>
            <li>适合小资金投资者</li>
          </ul>

          <h4>📊 可转债的关键指标</h4>
          <p><strong>转股价格</strong></p>
          <p>可转债转换为股票的价格。例如：转股价10元，持有100张可转债（面值10000元），可转换为1000股股票。</p>

          <p><strong>转股价值</strong></p>
          <p>转股价值 = 正股价格 / 转股价格 × 100</p>
          <p>当转股价值高于100元时，转股有利可图。</p>

          <p><strong>转股溢价率</strong></p>
          <p>转股溢价率 = (可转债价格 / 转股价值 - 1) × 100%</p>
          <ul>
            <li>溢价率为正：可转债价格高于转股价值，存在溢价</li>
            <li>溢价率为负：可转债价格低于转股价值，存在套利空间</li>
            <li>一般溢价率越低越好</li>
          </ul>

          <p><strong>到期收益率（YTM）</strong></p>
          <p>持有到期的年化收益率，反映债券的保底收益。</p>

          <h4>🎯 投资策略</h4>
          <p><strong>1. 价值投资策略</strong></p>
          <ul>
            <li>选择价格低于110元的可转债</li>
            <li>关注转股溢价率，优选低溢价品种</li>
            <li>考察正股基本面，选择优质公司</li>
            <li>长期持有，等待正股上涨</li>
          </ul>

          <p><strong>2. 套利策略</strong></p>
          <ul>
            <li>寻找转股溢价率为负的可转债</li>
            <li>买入可转债，同时做空正股</li>
            <li>转股后立即卖出，锁定套利收益</li>
            <li>需注意交易成本和时间成本</li>
          </ul>

          <p><strong>3. 打新策略</strong></p>
          <ul>
            <li>参与可转债打新，无需市值</li>
            <li>中签后缴款，上市首日卖出</li>
            <li>历史统计首日平均涨幅10-20%</li>
            <li>风险极低，适合稳健投资者</li>
          </ul>

          <p><strong>4. 双低策略</strong></p>
          <ul>
            <li>选择"价格+溢价率"之和最小的可转债</li>
            <li>例如：价格105元+溢价率15%=120</li>
            <li>定期调仓，保持低双低组合</li>
            <li>长期收益稳定</li>
          </ul>

          <h4>⚠️ 风险提示</h4>
          <ul>
            <li><strong>强制赎回</strong>：正股连续上涨触发赎回条款，需及时转股或卖出</li>
            <li><strong>下修失败</strong>：转股价下修失败，可转债价格可能下跌</li>
            <li><strong>信用风险</strong>：公司经营不善，可转债价格下跌</li>
            <li><strong>流动性风险</strong>：部分可转债交易不活跃</li>
          </ul>
        `,
        '企业债与公司债分析': `
          <h4>📚 课程简介</h4>
          <p>学习如何分析和投资企业债、公司债，掌握信用评级和风险评估方法。</p>

          <h4>🏢 企业债与公司债的区别</h4>
          <p><strong>企业债</strong></p>
          <ul>
            <li>发行主体：国有企业、央企</li>
            <li>审批机关：国家发改委</li>
            <li>用途：基础设施、公用事业等</li>
            <li>安全性：相对较高</li>
          </ul>

          <p><strong>公司债</strong></p>
          <ul>
            <li>发行主体：股份有限公司</li>
            <li>审批机关：证监会</li>
            <li>用途：公司经营需要</li>
            <li>风险：相对较高</li>
          </ul>

          <h4>📊 信用评级体系</h4>
          <p><strong>评级等级（从高到低）</strong></p>
          <ul>
            <li><strong>AAA级</strong>：最高信用等级，偿债能力极强</li>
            <li><strong>AA级</strong>：偿债能力很强</li>
            <li><strong>A级</strong>：偿债能力较强</li>
            <li><strong>BBB级</strong>：偿债能力一般</li>
            <li><strong>BB级及以下</strong>：投机级，风险较高</li>
          </ul>

          <p><strong>评级机构</strong></p>
          <ul>
            <li>中诚信国际信用评级有限公司</li>
            <li>联合信用评级有限公司</li>
            <li>大公国际资信评估有限公司</li>
            <li>上海新世纪资信评估投资服务有限公司</li>
          </ul>

          <h4>💡 风险评估方法</h4>
          <p><strong>1. 财务指标分析</strong></p>
          <ul>
            <li><strong>资产负债率</strong>：不宜超过70%</li>
            <li><strong>流动比率</strong>：应大于1，越高越好</li>
            <li><strong>利息保障倍数</strong>：应大于3，衡量利息支付能力</li>
            <li><strong>营业收入增长率</strong>：持续增长表明企业健康发展</li>
          </ul>

          <p><strong>2. 行业分析</strong></p>
          <ul>
            <li>关注行业景气度和发展趋势</li>
            <li>周期性行业风险较高</li>
            <li>新兴行业不确定性大</li>
            <li>垄断性行业相对稳定</li>
          </ul>

          <p><strong>3. 公司治理</strong></p>
          <ul>
            <li>管理层稳定性和专业性</li>
            <li>股权结构合理性</li>
            <li>信息披露透明度</li>
            <li>历史违约记录</li>
          </ul>

          <h4>🎯 投资策略</h4>
          <p><strong>安全第一原则</strong></p>
          <ul>
            <li>优先选择AAA、AA+评级债券</li>
            <li>关注央企、国企发行的企业债</li>
            <li>避免评级展望为"负面"的债券</li>
            <li>分散投资，不要集中持有单一债券</li>
          </ul>

          <p><strong>收益增强策略</strong></p>
          <ul>
            <li>适当配置高收益债券（高评级前提下）</li>
            <li>关注新发债券，通常收益率较高</li>
            <li>利用信用利差变化进行波段操作</li>
            <li>长短期搭配，平衡收益与流动性</li>
          </ul>

          <h4>📖 购买渠道</h4>
          <ul>
            <li><strong>交易所市场</strong>：通过证券账户购买记账式企业债、公司债</li>
            <li><strong>银行间市场</strong>：机构投资者主要交易场所</li>
            <li><strong>债券基金</strong>：间接投资企业债、公司债</li>
          </ul>

          <h4>⚠️ 警惕信号</h4>
          <ul>
            <li>信用评级下调</li>
            <li>财务报表出现异常</li>
            <li>债券价格异常下跌</li>
            <li>负面新闻频发</li>
            <li>行业系统性风险</li>
          </ul>
        `
      }
    };

    // 获取对应类别和课程的内容
    const categoryContent = contents[course.category] || {};
    let content = categoryContent[course.title];

    // 如果没有预设内容，生成通用内容
    if (!content) {
      content = `
        <h4>📚 课程简介</h4>
        <p>${course.desc}</p>

        <h4>📖 学习目标</h4>
        <ul>
          <li>掌握${course.title}的核心概念和原理</li>
          <li>了解相关投资策略和实践方法</li>
          <li>学会规避常见风险，提升投资能力</li>
          <li>建立系统化的投资思维框架</li>
        </ul>

        <h4>💡 课程特色</h4>
        <p>本课程结合理论与实践，通过案例分析帮助您深入理解投资原理，建立正确的投资观念。</p>

        <h4>📝 适合人群</h4>
        <p>适合${course.level === '入门' ? '零基础学员或初学者' : course.level === '进阶' ? '有一定投资经验的投资者' : '资深投资者和专业人士'}学习。</p>

        <p style="text-align:center;margin-top:30px;color:#999;font-style:italic;">完整课程内容正在制作中，敬请期待...</p>
      `;
    }

    return content;
  }

  // ========== 更新最后更新时间 ==========
  function updateLastUpdateTime(time) {
    // 可以在页面底部添加更新时间显示
    console.log('课程数据更新时间:', time);
  }

  // ========== Spotlight 滚动效果 ==========
  function initSpotlightEffect() {
    const cards = document.querySelectorAll('.course-card');
    if (!cards || cards.length === 0) return;

    // 添加 spotlight 类
    cards.forEach(card => card.classList.add('card-spotlight'));

    let dirty = true;

    window.addEventListener('scroll', () => { dirty = true; }, { passive: true });
    window.addEventListener('touchmove', () => { dirty = true; }, { passive: true });

    function animate() {
      if (dirty) {
        dirty = false;
        const h = window.innerHeight;
        const center = h / 2;

        cards.forEach((card, index) => {
          // 第一张卡片保持缩小
          if (index === 0) {
            card.style.transform = 'scale(0.94) translateZ(0)';
            card.style.opacity = '0.6';
            const badge = card.querySelector('.course-level-badge');
            if (badge) badge.style.opacity = '0.5';
            return;
          }

          const rect = card.getBoundingClientRect();
          const cardCenter = rect.top + rect.height / 2;
          const dist = Math.abs(cardCenter - center);
          const ratio = Math.max(0, 1 - dist / (h * 0.6));

          const scale = 0.94 + ratio * 0.06;
          const opacity = 0.6 + ratio * 0.4;

          card.style.transform = `scale(${scale}) translateZ(0)`;
          card.style.opacity = opacity;

          // 难度标签跟随变亮
          const badge = card.querySelector('.course-level-badge');
          if (badge) {
            badge.style.opacity = 0.6 + ratio * 0.4;
          }
        });
      }

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }

  // ========== 启动 ==========
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
