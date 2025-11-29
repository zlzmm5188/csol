// ========== 课程数据库（扩展版） ==========
const COURSES_DATABASE = {
  fund: [
    // 入门级（8门）
    {id:1,title:"基金投资入门指南",level:"入门",duration:"45分钟",icon:"📚",lessons:10,order:1,hasContent:true},
    {id:2,title:"认识不同类型的基金",level:"入门",duration:"50分钟",icon:"🎯",lessons:12,order:2,hasContent:true},
    {id:3,title:"基金的费用结构解析",level:"入门",duration:"35分钟",icon:"💰",lessons:8,order:3,hasContent:true},
    {id:4,title:"如何阅读基金招募说明书",level:"入门",duration:"40分钟",icon:"📄",lessons:9,order:4},
    {id:5,title:"基金净值与收益计算",level:"入门",duration:"30分钟",icon:"📊",lessons:7,order:5},
    {id:6,title:"基金分红方式的选择",level:"入门",duration:"25分钟",icon:"💵",lessons:6,order:6},
    {id:7,title:"基金交易渠道对比",level:"入门",duration:"30分钟",icon:"🏦",lessons:7,order:7},
    {id:8,title:"基金定投的基本原理",level:"入门",duration:"40分钟",icon:"📈",lessons:9,order:8},

    // 进阶级（8门）
    {id:9,title:"基金风险评估与管理",level:"进阶",duration:"45分钟",icon:"⚠️",lessons:10,order:9},
    {id:10,title:"基金组合配置策略",level:"进阶",duration:"55分钟",icon:"🧩",lessons:13,order:10},
    {id:11,title:"主动型与被动型基金对比",level:"进阶",duration:"40分钟",icon:"⚖️",lessons:9,order:11},
    {id:12,title:"基金经理的选择标准",level:"进阶",duration:"35分钟",icon:"👤",lessons:8,order:12},
    {id:13,title:"行业主题基金投资策略",level:"进阶",duration:"50分钟",icon:"🏭",lessons:12,order:13},
    {id:14,title:"债券基金投资技巧",level:"进阶",duration:"45分钟",icon:"📜",lessons:10,order:14},
    {id:15,title:"货币基金流动性管理",level:"进阶",duration:"30分钟",icon:"💸",lessons:7,order:15},
    {id:16,title:"基金税务筹划要点",level:"进阶",duration:"35分钟",icon:"📋",lessons:8,order:16},

    // 高级（10门）
    {id:17,title:"基金业绩评价指标",level:"高级",duration:"50分钟",icon:"📏",lessons:12,order:17},
    {id:18,title:"量化基金投资分析",level:"高级",duration:"55分钟",icon:"🤖",lessons:13,order:18},
    {id:19,title:"QDII基金全球配置",level:"高级",duration:"50分钟",icon:"🌍",lessons:12,order:19},
    {id:20,title:"FOF基金投资策略",level:"高级",duration:"45分钟",icon:"🎯",lessons:10,order:20},
    {id:21,title:"REITs基金投资入门",level:"高级",duration:"40分钟",icon:"🏢",lessons:9,order:21},
    {id:22,title:"基金估值分析方法",level:"高级",duration:"50分钟",icon:"💎",lessons:12,order:22},
    {id:23,title:"基金赎回时机选择",level:"高级",duration:"35分钟",icon:"🚪",lessons:8,order:23},
    {id:24,title:"基金投资常见误区",level:"高级",duration:"40分钟",icon:"⚠️",lessons:9,order:24},
    {id:25,title:"基金投资心理学",level:"高级",duration:"45分钟",icon:"🧠",lessons:10,order:25},
    {id:26,title:"基金投资实战案例分析",level:"高级",duration:"60分钟",icon:"📖",lessons:14,order:26}
  ],

  ipo: [
    // 入门级（5门）
    {id:27,title:"IPO基础知识入门",level:"入门",duration:"40分钟",icon:"🎯",lessons:9,order:1,hasContent:true},
    {id:28,title:"新股申购策略与技巧",level:"入门",duration:"50分钟",icon:"🎲",lessons:12,order:2,hasContent:true},
    {id:29,title:"A股IPO审核制度解读",level:"入门",duration:"45分钟",icon:"📋",lessons:10,order:3,hasContent:true},
    {id:30,title:"新股定价机制分析",level:"入门",duration:"40分钟",icon:"💰",lessons:9,order:4},
    {id:31,title:"网上网下申购规则",level:"入门",duration:"35分钟",icon:"🌐",lessons:8,order:5},

    // 进阶级（7门）
    {id:32,title:"新股申购资金管理",level:"进阶",duration:"40分钟",icon:"💵",lessons:9,order:6},
    {id:33,title:"IPO招股书阅读要点",level:"进阶",duration:"50分钟",icon:"📄",lessons:12,order:7},
    {id:34,title:"科创板IPO投资指南",level:"进阶",duration:"45分钟",icon:"🚀",lessons:10,order:8},
    {id:35,title:"创业板IPO投资技巧",level:"进阶",duration:"40分钟",icon:"📈",lessons:9,order:9},
    {id:36,title:"主板IPO投资分析",level:"进阶",duration:"45分钟",icon:"🏛️",lessons:10,order:10},
    {id:37,title:"新股上市首日交易策略",level:"进阶",duration:"40分钟",icon:"📊",lessons:9,order:11},
    {id:38,title:"破发新股投资机会",level:"进阶",duration:"35分钟",icon:"💎",lessons:8,order:12},

    // 高级（8门）
    {id:39,title:"IPO行业分析方法",level:"高级",duration:"55分钟",icon:"🏭",lessons:13,order:13},
    {id:40,title:"IPO公司财务分析",level:"高级",duration:"60分钟",icon:"📊",lessons:14,order:14},
    {id:41,title:"IPO公司竞争力评估",level:"高级",duration:"50分钟",icon:"🏆",lessons:12,order:15},
    {id:42,title:"新股估值模型应用",level:"高级",duration:"55分钟",icon:"📐",lessons:13,order:16},
    {id:43,title:"IPO投资风险管理",level:"高级",duration:"45分钟",icon:"⚠️",lessons:10,order:17},
    {id:44,title:"港股美股IPO投资",level:"高级",duration:"50分钟",icon:"🌍",lessons:12,order:18},
    {id:45,title:"IPO投资组合构建",level:"高级",duration:"45分钟",icon:"🧩",lessons:10,order:19},
    {id:46,title:"IPO投资实战案例",level:"高级",duration:"60分钟",icon:"📖",lessons:14,order:20}
  ],

  bond: [
    // 入门级（5门）
    {id:47,title:"债券投资基础知识",level:"入门",duration:"45分钟",icon:"📜",lessons:10,order:1,hasContent:true},
    {id:48,title:"国债与企业债的区别",level:"入门",duration:"40分钟",icon:"🏛️",lessons:9,order:2,hasContent:true},
    {id:49,title:"债券收益率计算方法",level:"入门",duration:"35分钟",icon:"📊",lessons:8,order:3,hasContent:true},
    {id:50,title:"债券信用评级解读",level:"入门",duration:"30分钟",icon:"⭐",lessons:7,order:4},
    {id:51,title:"债券交易市场介绍",level:"入门",duration:"40分钟",icon:"🏦",lessons:9,order:5},

    // 进阶级（7门）
    {id:52,title:"利率风险与久期管理",level:"进阶",duration:"50分钟",icon:"⏱️",lessons:12,order:6},
    {id:53,title:"信用风险识别与防范",level:"进阶",duration:"45分钟",icon:"🛡️",lessons:10,order:7},
    {id:54,title:"可转债投资策略",level:"进阶",duration:"55分钟",icon:"🔄",lessons:13,order:8},
    {id:55,title:"高收益债券投资",level:"进阶",duration:"50分钟",icon:"💎",lessons:12,order:9},
    {id:56,title:"地方政府债投资指南",level:"进阶",duration:"40分钟",icon:"🏙️",lessons:9,order:10},
    {id:57,title:"绿色债券投资机会",level:"进阶",duration:"45分钟",icon:"🌱",lessons:10,order:11},
    {id:58,title:"债券投资组合构建",level:"进阶",duration:"50分钟",icon:"🧩",lessons:12,order:12},

    // 高级（11门）
    {id:59,title:"债券市场宏观分析",level:"高级",duration:"55分钟",icon:"📈",lessons:13,order:13},
    {id:60,title:"债券估值模型应用",level:"高级",duration:"50分钟",icon:"📐",lessons:12,order:14},
    {id:61,title:"债券交易策略与技巧",level:"高级",duration:"55分钟",icon:"🎯",lessons:13,order:15},
    {id:62,title:"债券衍生品投资",level:"高级",duration:"50分钟",icon:"📊",lessons:12,order:16},
    {id:63,title:"境外债券市场投资",level:"高级",duration:"45分钟",icon:"🌍",lessons:10,order:17},
    {id:64,title:"债券违约处置实务",level:"高级",duration:"40分钟",icon:"⚖️",lessons:9,order:18},
    {id:65,title:"资产证券化产品投资",level:"高级",duration:"55分钟",icon:"🏢",lessons:13,order:19},
    {id:66,title:"债券投资税务筹划",level:"高级",duration:"35分钟",icon:"📋",lessons:8,order:20},
    {id:67,title:"债券市场流动性分析",level:"高级",duration:"40分钟",icon:"💧",lessons:9,order:21},
    {id:68,title:"固定收益投资心理学",level:"高级",duration:"35分钟",icon:"🧠",lessons:8,order:22},
    {id:69,title:"债券投资实战案例分析",level:"高级",duration:"60分钟",icon:"📖",lessons:14,order:23}
  ]
};

// 将数据库转换为扁平数组
const COURSES = [];
Object.keys(COURSES_DATABASE).forEach(category => {
  COURSES_DATABASE[category].forEach(course => {
    course.category = category;
    COURSES.push(course);
  });
});

console.log('📚 课程数据加载完成！');
console.log('  📈 基金投资:', COURSES_DATABASE.fund.length, '门');
console.log('  🎯 IPO新股:', COURSES_DATABASE.ipo.length, '门');
console.log('  💰 债券投资:', COURSES_DATABASE.bond.length, '门');
console.log('  📊 总计:', COURSES.length, '门课程');
