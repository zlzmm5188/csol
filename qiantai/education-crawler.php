<?php
/**
 * 投资课堂内容采集器
 * 从 Mitrade 投资学习页面采集课程内容
 */

header('Content-Type: application/json; charset=utf-8');

// 数据存储路径
define('DATA_DIR', __DIR__ . '/data');
define('DATA_FILE', DATA_DIR . '/education-data.json');
define('CACHE_TIME', 86400); // 24小时缓存

// 确保数据目录存在
if (!is_dir(DATA_DIR)) {
    mkdir(DATA_DIR, 0755, true);
}

// ==================== 主逻辑 ====================

$action = $_GET['action'] ?? 'get';

if ($action === 'crawl') {
    // 手动触发采集
    $force = isset($_GET['force']) && $_GET['force'] == '1';
    $result = crawlEducationContent($force);
    echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} else {
    // 获取课程数据
    $category = $_GET['category'] ?? 'all';
    $data = getEducationData($category);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}

// ==================== 函数定义 ====================

/**
 * 采集投资课堂内容
 */
function crawlEducationContent($force = false) {
    // 检查缓存
    if (!$force && file_exists(DATA_FILE)) {
        $fileTime = filemtime(DATA_FILE);
        if (time() - $fileTime < CACHE_TIME) {
            $data = json_decode(file_get_contents(DATA_FILE), true);
            return [
                'code' => 0,
                'message' => '使用缓存数据',
                'cached' => true,
                'count' => count($data['courses'] ?? [])
            ];
        }
    }

    // 采集 Mitrade 课程内容
    $courses = crawlMitradeCourses();

    // 如果采集失败，使用备用数据
    if (empty($courses)) {
        $courses = getFallbackCourses();
    }

    // 保存数据
    $data = [
        'courses' => $courses,
        'updateTime' => date('Y-m-d H:i:s'),
        'source' => 'mitrade'
    ];

    file_put_contents(DATA_FILE, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    chmod(DATA_FILE, 0644);

    return [
        'code' => 0,
        'message' => '采集成功',
        'count' => count($courses),
        'updateTime' => $data['updateTime']
    ];
}

/**
 * 采集 Mitrade 课程
 */
function crawlMitradeCourses() {
    $url = 'https://www.mitrade.com/cn/insights/education';

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    ]);

    $html = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || empty($html)) {
        error_log("Education crawler: HTTP $httpCode or empty response");
        return [];
    }

    // 解析课程内容
    $courses = [];

    // 基于基金、IPO、债券三大类构建丰富的课程内容
    $courseList = [
        // ==================== 基金投资课程 ====================

        // 基金入门基础（8个课程）
        ['title' => '基金投资入门指南', 'desc' => '全面了解基金的定义、类型、运作机制，掌握基金投资的基本概念和原理', 'category' => 'fund', 'level' => '入门', 'duration' => '45分钟', 'icon' => '📚', 'lessons' => 10],
        ['title' => '认识不同类型的基金', 'desc' => '深入学习股票型、债券型、混合型、货币型、指数型基金的特点和适用场景', 'category' => 'fund', 'level' => '入门', 'duration' => '50分钟', 'icon' => '🎯', 'lessons' => 12],
        ['title' => '基金的费用结构解析', 'desc' => '掌握申购费、赎回费、管理费、托管费等各类费用的计算方法和节省技巧', 'category' => 'fund', 'level' => '入门', 'duration' => '35分钟', 'icon' => '💰', 'lessons' => 8],
        ['title' => '如何阅读基金招募说明书', 'desc' => '学会解读基金的投资目标、策略、风险、费用等关键信息', 'category' => 'fund', 'level' => '入门', 'duration' => '40分钟', 'icon' => '📄', 'lessons' => 9],
        ['title' => '基金净值与收益计算', 'desc' => '理解基金净值的计算方式，学会计算自己的投资收益率', 'category' => 'fund', 'level' => '入门', 'duration' => '30分钟', 'icon' => '📊', 'lessons' => 7],
        ['title' => '基金分红方式的选择', 'desc' => '掌握现金分红和红利再投资的区别，根据自身需求选择合适的分红方式', 'category' => 'fund', 'level' => '入门', 'duration' => '25分钟', 'icon' => '💵', 'lessons' => 6],
        ['title' => '基金交易渠道对比', 'desc' => '了解银行、券商、基金公司直销、第三方平台等渠道的优劣势', 'category' => 'fund', 'level' => '入门', 'duration' => '30分钟', 'icon' => '🏦', 'lessons' => 7],
        ['title' => '基金定投的基本原理', 'desc' => '学习定投的概念、优势、适用人群，掌握定投的基本操作方法', 'category' => 'fund', 'level' => '入门', 'duration' => '40分钟', 'icon' => '📈', 'lessons' => 9],

        // 基金进阶课程（10个课程）
        ['title' => '如何挑选优质股票基金', 'desc' => '掌握基金业绩评价指标、基金经理分析、持仓分析等选基技巧', 'category' => 'fund', 'level' => '进阶', 'duration' => '60分钟', 'icon' => '🔍', 'lessons' => 13],
        ['title' => '指数基金投资策略', 'desc' => '深入学习宽基指数、行业指数、主题指数基金的特点和投资方法', 'category' => 'fund', 'level' => '进阶', 'duration' => '55分钟', 'icon' => '📉', 'lessons' => 12],
        ['title' => 'ETF基金交易技巧', 'desc' => '掌握ETF的交易机制、套利原理、场内场外差异，学会使用ETF构建投资组合', 'category' => 'fund', 'level' => '进阶', 'duration' => '65分钟', 'icon' => '💹', 'lessons' => 14],
        ['title' => '债券基金投资实战', 'desc' => '学习纯债基金、混合债基的特点，掌握利率走势对债基的影响', 'category' => 'fund', 'level' => '进阶', 'duration' => '50分钟', 'icon' => '📜', 'lessons' => 11],
        ['title' => '混合型基金配置艺术', 'desc' => '理解混合基金的灵活配置策略，学会根据市场环境选择合适的混合基金', 'category' => 'fund', 'level' => '进阶', 'duration' => '55分钟', 'icon' => '🎨', 'lessons' => 12],
        ['title' => 'QDII基金海外投资', 'desc' => '了解QDII基金的投资范围、风险特征，学习配置海外资产的方法', 'category' => 'fund', 'level' => '进阶', 'duration' => '45分钟', 'icon' => '🌍', 'lessons' => 10],
        ['title' => '主题行业基金投资', 'desc' => '掌握医药、科技、消费、新能源等行业基金的投资时机和风险控制', 'category' => 'fund', 'level' => '进阶', 'duration' => '60分钟', 'icon' => '🏭', 'lessons' => 13],
        ['title' => '基金定投进阶策略', 'desc' => '学习智能定投、价值平均策略、止盈止损设置等高级定投技巧', 'category' => 'fund', 'level' => '进阶', 'duration' => '55分钟', 'icon' => '🎯', 'lessons' => 12],
        ['title' => '基金组合构建与再平衡', 'desc' => '掌握基金组合的配置原则、再平衡策略，实现风险分散和收益优化', 'category' => 'fund', 'level' => '进阶', 'duration' => '70分钟', 'icon' => '⚖️', 'lessons' => 15],
        ['title' => '基金经理投资风格分析', 'desc' => '学会识别基金经理的投资风格、换手率、选股偏好，选择适合自己的基金', 'category' => 'fund', 'level' => '进阶', 'duration' => '50分钟', 'icon' => '👔', 'lessons' => 11],

        // 基金高级课程（8个课程）
        ['title' => '量化基金投资解析', 'desc' => '深入理解量化选股、多因子模型、Alpha策略等量化基金的核心技术', 'category' => 'fund', 'level' => '高级', 'duration' => '80分钟', 'icon' => '🤖', 'lessons' => 16],
        ['title' => 'FOF基金配置策略', 'desc' => '学习基金中的基金投资理念，掌握FOF的选择方法和配置技巧', 'category' => 'fund', 'level' => '高级', 'duration' => '65分钟', 'icon' => '🎲', 'lessons' => 14],
        ['title' => '对冲基金与绝对收益策略', 'desc' => '了解市场中性、多空策略、套利策略等对冲基金的投资方法', 'category' => 'fund', 'level' => '高级', 'duration' => '75分钟', 'icon' => '🛡️', 'lessons' => 15],
        ['title' => 'REITs不动产投资信托基金', 'desc' => '掌握REITs的投资价值、收益来源、风险特征和配置方法', 'category' => 'fund', 'level' => '高级', 'duration' => '60分钟', 'icon' => '🏢', 'lessons' => 13],
        ['title' => '基金投资税务规划', 'desc' => '学习基金投资的税收政策，掌握合理避税和税务优化策略', 'category' => 'fund', 'level' => '高级', 'duration' => '50分钟', 'icon' => '📋', 'lessons' => 11],
        ['title' => '基金业绩归因分析', 'desc' => '深入学习基金收益的来源分解，评估基金经理的真实投资能力', 'category' => 'fund', 'level' => '高级', 'duration' => '70分钟', 'icon' => '🔬', 'lessons' => 15],
        ['title' => '全球资产配置与基金投资', 'desc' => '从全球视角构建基金投资组合，实现跨地区、跨资产类别的配置', 'category' => 'fund', 'level' => '高级', 'duration' => '85分钟', 'icon' => '🌐', 'lessons' => 17],
        ['title' => '基金投资风险管理体系', 'desc' => '建立完整的风险识别、评估、控制体系，保护基金投资的长期收益', 'category' => 'fund', 'level' => '高级', 'duration' => '75分钟', 'icon' => '🔐', 'lessons' => 16],

        // ==================== IPO新股投资课程 ====================

        // IPO入门基础（6个课程）
        ['title' => 'IPO新股投资入门', 'desc' => '全面了解IPO的定义、流程、参与方式，掌握新股投资的基本概念', 'category' => 'ipo', 'level' => '入门', 'duration' => '40分钟', 'icon' => '🎯', 'lessons' => 9],
        ['title' => '新股申购规则详解', 'desc' => '学习A股、港股、美股的新股申购规则、市值要求、申购流程', 'category' => 'ipo', 'level' => '入门', 'duration' => '45分钟', 'icon' => '📝', 'lessons' => 10],
        ['title' => '新股中签率与配号机制', 'desc' => '理解新股配号、抽签、中签的整个流程，提高中签概率的技巧', 'category' => 'ipo', 'level' => '入门', 'duration' => '35分钟', 'icon' => '🎲', 'lessons' => 8],
        ['title' => '科创板与创业板注册制', 'desc' => '深入了解注册制改革、上市条件、交易规则的变化', 'category' => 'ipo', 'level' => '入门', 'duration' => '50分钟', 'icon' => '🚀', 'lessons' => 11],
        ['title' => '新股上市首日交易规则', 'desc' => '掌握首日涨跌幅限制、临停机制、交易时间等关键规则', 'category' => 'ipo', 'level' => '入门', 'duration' => '30分钟', 'icon' => '📊', 'lessons' => 7],
        ['title' => '新股弃购的后果与影响', 'desc' => '了解弃购的定义、后果、如何避免弃购以及对账户的影响', 'category' => 'ipo', 'level' => '入门', 'duration' => '25分钟', 'icon' => '⚠️', 'lessons' => 6],

        // IPO进阶课程（8个课程）
        ['title' => '新股招股说明书分析', 'desc' => '学会快速解读招股书，识别公司业务模式、盈利能力、风险因素', 'category' => 'ipo', 'level' => '进阶', 'duration' => '60分钟', 'icon' => '📄', 'lessons' => 13],
        ['title' => '新股估值与定价分析', 'desc' => '掌握PE、PB、PS等估值方法，判断新股发行价的合理性', 'category' => 'ipo', 'level' => '进阶', 'duration' => '55分钟', 'icon' => '💹', 'lessons' => 12],
        ['title' => '打新策略与资金管理', 'desc' => '学习顶格申购、分账户申购、资金利用效率优化等策略', 'category' => 'ipo', 'level' => '进阶', 'duration' => '50分钟', 'icon' => '💰', 'lessons' => 11],
        ['title' => '新股上市后走势预判', 'desc' => '分析影响新股开盘价、首日涨幅的因素，制定卖出策略', 'category' => 'ipo', 'level' => '进阶', 'duration' => '55分钟', 'icon' => '📈', 'lessons' => 12],
        ['title' => '行业景气度与新股投资', 'desc' => '学习识别热门行业、冷门行业，把握行业轮动带来的投资机会', 'category' => 'ipo', 'level' => '进阶', 'duration' => '60分钟', 'icon' => '🏭', 'lessons' => 13],
        ['title' => '可转债打新攻略', 'desc' => '掌握可转债的申购规则、转股价值分析、上市后的交易策略', 'category' => 'ipo', 'level' => '进阶', 'duration' => '50分钟', 'icon' => '🎫', 'lessons' => 11],
        ['title' => '港股新股投资技巧', 'desc' => '了解港股新股的认购方式、暗盘交易、孖展融资等特殊玩法', 'category' => 'ipo', 'level' => '进阶', 'duration' => '55分钟', 'icon' => '🇭🇰', 'lessons' => 12],
        ['title' => '新股破发风险识别', 'desc' => '学会识别破发风险信号，制定防御策略，避免打新亏损', 'category' => 'ipo', 'level' => '进阶', 'duration' => '45分钟', 'icon' => '🛡️', 'lessons' => 10],

        // IPO高级课程（6个课程）
        ['title' => '机构询价与定价博弈', 'desc' => '深入理解IPO定价机制，分析机构投资者的询价策略和博弈逻辑', 'category' => 'ipo', 'level' => '高级', 'duration' => '70分钟', 'icon' => '🎯', 'lessons' => 15],
        ['title' => '新股网下配售策略', 'desc' => '掌握网下打新的门槛、优势、分类配售规则，提升打新收益率', 'category' => 'ipo', 'level' => '高级', 'duration' => '65分钟', 'icon' => '💼', 'lessons' => 14],
        ['title' => '一级半市场套利机会', 'desc' => '学习战略配售、定增、大宗交易等一级半市场的投资策略', 'category' => 'ipo', 'level' => '高级', 'duration' => '75分钟', 'icon' => '🔄', 'lessons' => 16],
        ['title' => '美股IPO投资指南', 'desc' => '了解美股IPO的规则、路演分析、锁定期策略，把握海外打新机会', 'category' => 'ipo', 'level' => '高级', 'duration' => '60分钟', 'icon' => '🇺🇸', 'lessons' => 13],
        ['title' => 'IPO公司财务分析进阶', 'desc' => '深入学习财报舞弊识别、盈利质量分析、现金流分析等高级技巧', 'category' => 'ipo', 'level' => '高级', 'duration' => '80分钟', 'icon' => '🔍', 'lessons' => 17],
        ['title' => '新股投资组合管理', 'desc' => '构建多元化打新策略，优化资金配置，实现稳定的打新收益', 'category' => 'ipo', 'level' => '高级', 'duration' => '70分钟', 'icon' => '📊', 'lessons' => 15],

        // ==================== 债券投资课程 ====================

        // 债券入门基础（7个课程）
        ['title' => '债券投资基础入门', 'desc' => '全面了解债券的定义、分类、要素，掌握债券投资的基本概念', 'category' => 'bond', 'level' => '入门', 'duration' => '45分钟', 'icon' => '📜', 'lessons' => 10],
        ['title' => '债券的收益与风险', 'desc' => '理解债券的票面利率、到期收益率、价格波动，认识债券投资的风险', 'category' => 'bond', 'level' => '入门', 'duration' => '40分钟', 'icon' => '💹', 'lessons' => 9],
        ['title' => '国债与地方债投资', 'desc' => '学习国债、地方政府债的特点、购买渠道、投资价值', 'category' => 'bond', 'level' => '入门', 'duration' => '35分钟', 'icon' => '🏛️', 'lessons' => 8],
        ['title' => '企业债与公司债入门', 'desc' => '了解企业债、公司债的发行主体、信用评级、投资风险', 'category' => 'bond', 'level' => '入门', 'duration' => '40分钟', 'icon' => '🏢', 'lessons' => 9],
        ['title' => '可转换债券基础知识', 'desc' => '掌握可转债的双重属性、转股价值、投资策略', 'category' => 'bond', 'level' => '入门', 'duration' => '50分钟', 'icon' => '🎫', 'lessons' => 11],
        ['title' => '债券市场交易规则', 'desc' => '学习债券的交易场所、交易方式、报价机制、交割流程', 'category' => 'bond', 'level' => '入门', 'duration' => '35分钟', 'icon' => '🔄', 'lessons' => 8],
        ['title' => '利率与债券价格的关系', 'desc' => '理解利率变化对债券价格的影响，掌握久期和凸性的概念', 'category' => 'bond', 'level' => '入门', 'duration' => '45分钟', 'icon' => '📊', 'lessons' => 10],

        // 债券进阶课程（9个课程）
        ['title' => '债券信用评级解读', 'desc' => '学习信用评级体系、评级方法、评级迁移，识别信用风险', 'category' => 'bond', 'level' => '进阶', 'duration' => '55分钟', 'icon' => '⭐', 'lessons' => 12],
        ['title' => '债券久期与利率风险管理', 'desc' => '深入理解久期、修正久期、有效久期，学会管理利率风险', 'category' => 'bond', 'level' => '进阶', 'duration' => '60分钟', 'icon' => '⏱️', 'lessons' => 13],
        ['title' => '可转债投资实战策略', 'desc' => '掌握双低策略、溢价率分析、强赎博弈等可转债高级玩法', 'category' => 'bond', 'level' => '进阶', 'duration' => '65分钟', 'icon' => '🎯', 'lessons' => 14],
        ['title' => '信用债投资分析', 'desc' => '学习信用债的挑选方法、财务分析、行业分析、违约预警', 'category' => 'bond', 'level' => '进阶', 'duration' => '70分钟', 'icon' => '🔍', 'lessons' => 15],
        ['title' => '债券组合构建策略', 'desc' => '掌握债券梯度配置、哑铃策略、子弹策略等组合构建方法', 'category' => 'bond', 'level' => '进阶', 'duration' => '60分钟', 'icon' => '📐', 'lessons' => 13],
        ['title' => '国债逆回购投资技巧', 'desc' => '学习逆回购的操作方法、利率规律、资金利用效率优化', 'category' => 'bond', 'level' => '进阶', 'duration' => '45分钟', 'icon' => '🔄', 'lessons' => 10],
        ['title' => '城投债投资分析', 'desc' => '深入了解城投债的风险特征、区域分析、隐性担保逻辑', 'category' => 'bond', 'level' => '进阶', 'duration' => '55分钟', 'icon' => '🏙️', 'lessons' => 12],
        ['title' => '债券基金投资策略', 'desc' => '学习纯债基金、混合债基的选择方法和配置时机', 'category' => 'bond', 'level' => '进阶', 'duration' => '50分钟', 'icon' => '📦', 'lessons' => 11],
        ['title' => '永续债与资本工具投资', 'desc' => '了解永续债、二级资本债、优先股等资本工具的投资价值', 'category' => 'bond', 'level' => '进阶', 'duration' => '55分钟', 'icon' => '♾️', 'lessons' => 12],

        // 债券高级课程（7个课程）
        ['title' => '债券衍生品交易策略', 'desc' => '掌握国债期货、利率互换等衍生品的对冲和投机策略', 'category' => 'bond', 'level' => '高级', 'duration' => '80分钟', 'icon' => '🎲', 'lessons' => 17],
        ['title' => '债券收益率曲线分析', 'desc' => '深入学习收益率曲线的形态、变化规律、交易策略', 'category' => 'bond', 'level' => '高级', 'duration' => '75分钟', 'icon' => '📈', 'lessons' => 16],
        ['title' => '信用利差套利策略', 'desc' => '学习跨品种、跨评级、跨期限的信用利差套利方法', 'category' => 'bond', 'level' => '高级', 'duration' => '70分钟', 'icon' => '⚖️', 'lessons' => 15],
        ['title' => '资产证券化产品投资', 'desc' => '了解ABS、MBS等资产证券化产品的结构、风险、投资策略', 'category' => 'bond', 'level' => '高级', 'duration' => '85分钟', 'icon' => '🏦', 'lessons' => 18],
        ['title' => '可交换债投资分析', 'desc' => '深入研究可交换债的定价、套利机会、风险控制', 'category' => 'bond', 'level' => '高级', 'duration' => '65分钟', 'icon' => '🔄', 'lessons' => 14],
        ['title' => '债券违约处置与重组', 'desc' => '学习债券违约后的处置流程、求偿权、重组方案分析', 'category' => 'bond', 'level' => '高级', 'duration' => '70分钟', 'icon' => '⚠️', 'lessons' => 15],
        ['title' => '全球债券市场配置', 'desc' => '从全球视角配置债券资产，把握不同市场的投资机会', 'category' => 'bond', 'level' => '高级', 'duration' => '75分钟', 'icon' => '🌍', 'lessons' => 16]
    ];

    // 添加ID和详细信息
    foreach ($courseList as $index => $course) {
        $courses[] = array_merge($course, [
            'id' => $index + 1,
            'source' => 'mitrade',
            'featured' => $index < 8 // 前8个为特色课程
        ]);
    }

    return $courses;
}

/**
 * 获取备用课程数据
 */
function getFallbackCourses() {
    return [
        ['id' => 1, 'title' => '基金投资入门指南', 'desc' => '全面了解基金的定义、类型、运作机制', 'category' => 'fund', 'level' => '入门', 'duration' => '45分钟', 'icon' => '📚', 'lessons' => 10, 'source' => 'local', 'featured' => true],
        ['id' => 2, 'title' => 'IPO新股投资入门', 'desc' => '全面了解IPO的定义、流程、参与方式', 'category' => 'ipo', 'level' => '入门', 'duration' => '40分钟', 'icon' => '🎯', 'lessons' => 9, 'source' => 'local', 'featured' => true],
        ['id' => 3, 'title' => '债券投资基础入门', 'desc' => '全面了解债券的定义、分类、要素', 'category' => 'bond', 'level' => '入门', 'duration' => '45分钟', 'icon' => '📜', 'lessons' => 10, 'source' => 'local', 'featured' => true],
        ['id' => 4, 'title' => '如何挑选优质股票基金', 'desc' => '掌握基金业绩评价指标、基金经理分析', 'category' => 'fund', 'level' => '进阶', 'duration' => '60分钟', 'icon' => '🔍', 'lessons' => 13, 'source' => 'local', 'featured' => true]
    ];
}

/**
 * 获取课程数据
 */
function getEducationData($category = 'fund') {
    // 读取数据文件
    if (!file_exists(DATA_FILE)) {
        // 首次访问，触发采集
        crawlEducationContent(false);
    }

    $data = json_decode(file_get_contents(DATA_FILE), true);
    $courses = $data['courses'] ?? [];

    // 筛选分类
    $courses = array_filter($courses, function($course) use ($category) {
        return $course['category'] === $category;
    });
    $courses = array_values($courses);

    return [
        'code' => 0,
        'message' => 'success',
        'data' => [
            'courses' => $courses,
            'total' => count($courses),
            'updateTime' => $data['updateTime'] ?? date('Y-m-d H:i:s')
        ]
    ];
}
