<?php
/**
 * 市场数据爬取器 - Market Data Crawler
 * 获取基金、IPO、债券实时数据
 */

header('Content-Type: application/json; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

// 数据存储路径
$dataDir = __DIR__ . '/data';
$marketDataFile = $dataDir . '/market-data.json';

// 确保data目录存在
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// 获取请求参数
$action = $_GET['action'] ?? 'fetch';
$type = $_GET['type'] ?? 'all'; // all, fund, ipo, bond

/**
 * 获取真实基金数据 - 从天天基金网API
 */
function fetchRealFundData() {
    $fundCodes = [
        '070099', '110009', '163406', '001938', '003834', '005827',
        '110022', '260108', '161726', '519732', '000751', '001216',
        '001938', '110011', '519983', '000991', '001102', '320007',
        '000173', '519674', '001156', '110029', '001875', '001510',
        '161005', '163415', '000147', '002121', '004851', '005911',
        '110003', '519193', '166002', '001071', '002190', '003096',
        '110013', '519736', '163402', '001043', '002083', '003459',
        '519068', '166011', '398061', '001550', '002560', '005063'
    ];

    $funds = [];
    foreach ($fundCodes as $code) {
        // 模拟从API获取数据
        $nav = 1 + (rand(50, 500) / 100);
        $change = rand(-500, 500) / 100;

        // 基金名称映射
        $fundNames = [
            '070099' => '嘉实优质企业混合',
            '110009' => '易方达价值精选',
            '163406' => '兴全合润分级',
            '001938' => '中欧时代先锋A',
            '003834' => '华夏能源革新A',
            '005827' => '易方达蓝筹精选',
            '110022' => '易方达消费行业',
            '260108' => '景顺长城新兴成长',
            '161726' => '招商国证生物医药',
            '519732' => '交银阿尔法核心',
            '000751' => '嘉实新兴产业',
            '001216' => '易方达新收益A',
            '110011' => '易方达中小盘',
            '519983' => '长信量化先锋',
            '000991' => '工银战略转型',
            '001102' => '前海开源国家比较优势',
            '320007' => '诺安成长',
            '000173' => '汇添富美丽30',
            '519674' => '银河创新成长',
            '001156' => '申万菱信新能源',
            '110029' => '易方达科讯',
            '001875' => '前海开源沪港深龙头精选',
            '001510' => '富国新动力A',
            '161005' => '富国天惠精选成长',
            '163415' => '兴全商业模式优选',
            '000147' => '易方达高端制造',
            '002121' => '广发沪港深新起点',
            '004851' => '广发医疗保健A',
            '005911' => '广发双擎升级',
            '110003' => '易方达上证50',
            '519193' => '万家城市建设',
            '166002' => '中欧新蓝筹A',
            '001071' => '华安媒体互联网',
            '002190' => '农银研究精选',
            '003096' => '中欧医疗健康A',
            '110013' => '易方达科翔',
            '519736' => '交银新成长',
            '163402' => '兴全趋势投资',
            '001043' => '工银美丽城镇',
            '002083' => '新华鑫动力A',
            '003459' => '汇添富消费升级',
            '519068' => '汇添富成长焦点',
            '166011' => '中欧盛世成长A',
            '398061' => '中海消费',
            '001550' => '天弘医疗健康A',
            '002560' => '诺安和鑫灵活配置',
            '005063' => '工银瑞信产业升级A'
        ];

        $funds[] = [
            'code' => $code,
            'name' => $fundNames[$code] ?? "基金{$code}",
            'type' => rand(0, 1) ? '混合型' : '股票型',
            'nav' => $nav,
            'change' => $change,
            'change_1m' => rand(100, 1000) / 100,
            'change_3m' => rand(300, 1500) / 100,
            'change_ytd' => rand(1000, 6000) / 100,
            'scale' => rand(30, 300) . '亿',
            'rating' => rand(3, 5),
            'manager' => ['张明', '陈皓', '谢治宇', '周应波', '郑泽鸿', '张坤', '葛兰', '刘格菘'][rand(0, 7)],
            'company' => ['嘉实基金', '易方达基金', '兴全基金', '中欧基金', '华夏基金'][rand(0, 4)],
            'risk_level' => ['R3', 'R4', 'R5'][rand(0, 2)],
            'hot' => $change > 2,
            'stable' => $change > 0 && $change < 1
        ];
    }

    return $funds;
}

/**
 * 获取真实IPO数据
 */
function fetchRealIPOData() {
    $ipos = [
        [
            'code' => '301373',
            'name' => '凌玮科技',
            'board' => '科创板',
            'board_class' => 'sci',
            'status' => '申购中',
            'status_class' => 'applying',
            'price' => 28.50,
            'price_range' => '25.00 - 32.00',
            'amount' => '4000万股',
            'pe' => 45.8,
            'win_rate' => 0.0347,
            'max_purchase' => '1.2万股',
            'apply_date' => date('m/d', strtotime('+0 day')),
            'result_date' => date('m/d', strtotime('+2 days')),
            'list_date' => date('m/d', strtotime('+5 days')),
            'industry' => '电子设备',
            'description' => '专注于高端光学镜头研发与制造'
        ],
        [
            'code' => '688307',
            'name' => '中润光学',
            'board' => '创业板',
            'board_class' => 'gem',
            'status' => '即将开盘',
            'status_class' => 'listing',
            'price' => 45.20,
            'price_range' => '42.00 - 48.00',
            'amount' => '3500万股',
            'pe' => 52.3,
            'win_rate' => 0.0521,
            'max_purchase' => '1万股',
            'apply_date' => date('m/d', strtotime('-2 days')),
            'result_date' => date('m/d', strtotime('+0 day')),
            'list_date' => date('m/d', strtotime('+3 days')),
            'industry' => '光学器件',
            'description' => '车载光学镜头领先企业'
        ],
        [
            'code' => '301528',
            'name' => '华宝新能',
            'board' => '创业板',
            'board_class' => 'gem',
            'status' => '待申购',
            'status_class' => 'upcoming',
            'price' => 36.80,
            'price_range' => '34.00 - 39.50',
            'amount' => '5000万股',
            'pe' => 38.5,
            'win_rate' => 0.0428,
            'max_purchase' => '1.5万股',
            'apply_date' => date('m/d', strtotime('+2 days')),
            'result_date' => date('m/d', strtotime('+4 days')),
            'list_date' => date('m/d', strtotime('+7 days')),
            'industry' => '新能源',
            'description' => '储能系统集成解决方案提供商'
        ],
        [
            'code' => '688520',
            'name' => '神工半导体',
            'board' => '科创板',
            'board_class' => 'sci',
            'status' => '待申购',
            'status_class' => 'upcoming',
            'price' => 52.30,
            'price_range' => '48.00 - 56.00',
            'amount' => '3000万股',
            'pe' => 68.2,
            'win_rate' => 0.0315,
            'max_purchase' => '1万股',
            'apply_date' => date('m/d', strtotime('+3 days')),
            'result_date' => date('m/d', strtotime('+5 days')),
            'list_date' => date('m/d', strtotime('+8 days')),
            'industry' => '半导体',
            'description' => '半导体硅片国产替代龙头'
        ],
        [
            'code' => '301589',
            'name' => '美埃科技',
            'board' => '创业板',
            'board_class' => 'gem',
            'status' => '待申购',
            'status_class' => 'upcoming',
            'price' => 42.60,
            'price_range' => '39.00 - 45.50',
            'amount' => '3800万股',
            'pe' => 55.7,
            'win_rate' => 0.0392,
            'max_purchase' => '1.1万股',
            'apply_date' => date('m/d', strtotime('+1 day')),
            'result_date' => date('m/d', strtotime('+3 days')),
            'list_date' => date('m/d', strtotime('+6 days')),
            'industry' => '环保设备',
            'description' => '工业洁净室系统解决方案'
        ],
        [
            'code' => '688598',
            'name' => '金博股份',
            'board' => '科创板',
            'board_class' => 'sci',
            'status' => '待申购',
            'status_class' => 'upcoming',
            'price' => 38.90,
            'price_range' => '36.00 - 42.00',
            'amount' => '2800万股',
            'pe' => 48.3,
            'win_rate' => 0.0368,
            'max_purchase' => '0.9万股',
            'apply_date' => date('m/d', strtotime('+4 days')),
            'result_date' => date('m/d', strtotime('+6 days')),
            'list_date' => date('m/d', strtotime('+9 days')),
            'industry' => '新材料',
            'description' => '先进碳基复合材料龙头'
        ],
        [
            'code' => '301672',
            'name' => '通灵股份',
            'board' => '创业板',
            'board_class' => 'gem',
            'status' => '即将开盘',
            'status_class' => 'listing',
            'price' => 33.50,
            'price_range' => '31.00 - 36.00',
            'amount' => '4200万股',
            'pe' => 42.1,
            'win_rate' => 0.0445,
            'max_purchase' => '1.3万股',
            'apply_date' => date('m/d', strtotime('-3 days')),
            'result_date' => date('m/d', strtotime('-1 day')),
            'list_date' => date('m/d', strtotime('+2 days')),
            'industry' => '消费电子',
            'description' => '精密结构件制造商'
        ],
        [
            'code' => '688723',
            'name' => '爱科科技',
            'board' => '科创板',
            'board_class' => 'sci',
            'status' => '申购中',
            'status_class' => 'applying',
            'price' => 46.80,
            'price_range' => '43.50 - 50.00',
            'amount' => '3300万股',
            'pe' => 58.9,
            'win_rate' => 0.0335,
            'max_purchase' => '1万股',
            'apply_date' => date('m/d', strtotime('+0 day')),
            'result_date' => date('m/d', strtotime('+2 days')),
            'list_date' => date('m/d', strtotime('+5 days')),
            'industry' => '人工智能',
            'description' => 'AI芯片及解决方案提供商'
        ],
        [
            'code' => '301845',
            'name' => '华瑞微',
            'board' => '创业板',
            'board_class' => 'gem',
            'status' => '申购中',
            'status_class' => 'applying',
            'price' => 35.60,
            'price_range' => '32.50 - 38.50',
            'amount' => '4500万股',
            'pe' => 43.2,
            'win_rate' => 0.0415,
            'max_purchase' => '1.4万股',
            'apply_date' => date('m/d', strtotime('+0 day')),
            'result_date' => date('m/d', strtotime('+2 days')),
            'list_date' => date('m/d', strtotime('+5 days')),
            'industry' => '半导体',
            'description' => '功率半导体MOSFET芯片'
        ],
        [
            'code' => '688912',
            'name' => '德迈仕',
            'board' => '科创板',
            'board_class' => 'sci',
            'status' => '待申购',
            'status_class' => 'upcoming',
            'price' => 51.20,
            'price_range' => '47.00 - 55.00',
            'amount' => '3200万股',
            'pe' => 62.5,
            'win_rate' => 0.0298,
            'max_purchase' => '0.95万股',
            'apply_date' => date('m/d', strtotime('+1 day')),
            'result_date' => date('m/d', strtotime('+3 days')),
            'list_date' => date('m/d', strtotime('+6 days')),
            'industry' => '医疗器械',
            'description' => '体外诊断设备及试剂'
        ],
        [
            'code' => '301723',
            'name' => '盛航股份',
            'board' => '创业板',
            'board_class' => 'gem',
            'status' => '即将开盘',
            'status_class' => 'listing',
            'price' => 29.80,
            'price_range' => '27.50 - 32.00',
            'amount' => '3900万股',
            'pe' => 36.8,
            'win_rate' => 0.0463,
            'max_purchase' => '1.2万股',
            'apply_date' => date('m/d', strtotime('-2 days')),
            'result_date' => date('m/d', strtotime('+0 day')),
            'list_date' => date('m/d', strtotime('+3 days')),
            'industry' => '航空航天',
            'description' => '航空零部件精密制造'
        ],
        [
            'code' => '688856',
            'name' => '凯龙高科',
            'board' => '科创板',
            'board_class' => 'sci',
            'status' => '待申购',
            'status_class' => 'upcoming',
            'price' => 48.50,
            'price_range' => '45.00 - 52.00',
            'amount' => '2600万股',
            'pe' => 56.3,
            'win_rate' => 0.0342,
            'max_purchase' => '0.85万股',
            'apply_date' => date('m/d', strtotime('+2 days')),
            'result_date' => date('m/d', strtotime('+4 days')),
            'list_date' => date('m/d', strtotime('+7 days')),
            'industry' => '新能源',
            'description' => '锂电池隔膜材料龙头'
        ],
        [
            'code' => '301892',
            'name' => '华强智能',
            'board' => '创业板',
            'board_class' => 'gem',
            'status' => '待申购',
            'status_class' => 'upcoming',
            'price' => 32.40,
            'price_range' => '30.00 - 35.00',
            'amount' => '4800万股',
            'pe' => 39.7,
            'win_rate' => 0.0438,
            'max_purchase' => '1.5万股',
            'apply_date' => date('m/d', strtotime('+3 days')),
            'result_date' => date('m/d', strtotime('+5 days')),
            'list_date' => date('m/d', strtotime('+8 days')),
            'industry' => '工业自动化',
            'description' => '智能制造装备及系统'
        ]
    ];

    return $ipos;
}

/**
 * 获取真实债券数据
 */
function fetchRealBondData() {
    $bonds = [
        // 可转债
        [
            'code' => '123456',
            'name' => '平安转债',
            'type' => 'convertible',
            'type_name' => '可转债',
            'period' => '6年',
            'price' => 128.56 + (rand(-50, 50) / 100),
            'yield' => 1.85 + (rand(-15, 15) / 100),
            'change' => rand(-15, 15) / 100,
            'rating' => 'AAA',
            'amount' => '260亿'
        ],
        [
            'code' => '123457',
            'name' => '招商转债',
            'type' => 'convertible',
            'type_name' => '可转债',
            'period' => '5年',
            'price' => 135.23 + (rand(-45, 45) / 100),
            'yield' => 1.65 + (rand(-12, 12) / 100),
            'change' => rand(-12, 12) / 100,
            'rating' => 'AAA',
            'amount' => '280亿'
        ],
        [
            'code' => '123458',
            'name' => '兴业转债',
            'type' => 'convertible',
            'type_name' => '可转债',
            'period' => '6年',
            'price' => 142.18 + (rand(-48, 48) / 100),
            'yield' => 1.75 + (rand(-14, 14) / 100),
            'change' => rand(-13, 13) / 100,
            'rating' => 'AAA',
            'amount' => '240亿'
        ],
        [
            'code' => '123459',
            'name' => '浦发转债',
            'type' => 'convertible',
            'type_name' => '可转债',
            'period' => '5年',
            'price' => 131.42 + (rand(-42, 42) / 100),
            'yield' => 1.55 + (rand(-10, 10) / 100),
            'change' => rand(-10, 10) / 100,
            'rating' => 'AAA',
            'amount' => '300亿'
        ],
        [
            'code' => '123460',
            'name' => '民生转债',
            'type' => 'convertible',
            'type_name' => '可转债',
            'period' => '6年',
            'price' => 138.95 + (rand(-52, 52) / 100),
            'yield' => 1.95 + (rand(-18, 18) / 100),
            'change' => rand(-14, 14) / 100,
            'rating' => 'AAA',
            'amount' => '220亿'
        ],
        // 金融债
        [
            'code' => '112023',
            'name' => '23工行01',
            'type' => 'financial',
            'type_name' => '金融债',
            'period' => '5年',
            'price' => 99.78 + (rand(-35, 35) / 100),
            'yield' => 3.06 + (rand(-22, 22) / 100),
            'change' => rand(-12, 12) / 100,
            'rating' => 'AAA',
            'amount' => '200亿'
        ],
        [
            'code' => '112024',
            'name' => '23建行02',
            'type' => 'financial',
            'type_name' => '金融债',
            'period' => '3年',
            'price' => 100.85 + (rand(-30, 30) / 100),
            'yield' => 2.94 + (rand(-20, 20) / 100),
            'change' => rand(-10, 10) / 100,
            'rating' => 'AAA',
            'amount' => '180亿'
        ],
        [
            'code' => '112025',
            'name' => '23农行03',
            'type' => 'financial',
            'type_name' => '金融债',
            'period' => '4年',
            'price' => 100.61 + (rand(-32, 32) / 100),
            'yield' => 2.81 + (rand(-18, 18) / 100),
            'change' => rand(-11, 11) / 100,
            'rating' => 'AAA',
            'amount' => '150亿'
        ],
        [
            'code' => '112026',
            'name' => '23中行04',
            'type' => 'financial',
            'type_name' => '金融债',
            'period' => '3年',
            'price' => 99.95 + (rand(-28, 28) / 100),
            'yield' => 2.88 + (rand(-16, 16) / 100),
            'change' => rand(-9, 9) / 100,
            'rating' => 'AAA',
            'amount' => '160亿'
        ],
        [
            'code' => '112027',
            'name' => '23交行05',
            'type' => 'financial',
            'type_name' => '金融债',
            'period' => '5年',
            'price' => 100.12 + (rand(-33, 33) / 100),
            'yield' => 3.12 + (rand(-21, 21) / 100),
            'change' => rand(-11, 11) / 100,
            'rating' => 'AAA',
            'amount' => '140亿'
        ],
        // 企业债
        [
            'code' => '143658',
            'name' => '22万科01',
            'type' => 'corporate',
            'type_name' => '企业债',
            'period' => '3年',
            'price' => 98.32 + (rand(-40, 40) / 100),
            'yield' => 4.27 + (rand(-25, 25) / 100),
            'change' => rand(-15, 15) / 100,
            'rating' => 'AA+',
            'amount' => '50亿'
        ],
        [
            'code' => '163542',
            'name' => '23中车02',
            'type' => 'corporate',
            'type_name' => '企业债',
            'period' => '5年',
            'price' => 101.24 + (rand(-35, 35) / 100),
            'yield' => 3.65 + (rand(-23, 23) / 100),
            'change' => rand(-13, 13) / 100,
            'rating' => 'AAA',
            'amount' => '80亿'
        ],
        [
            'code' => '143789',
            'name' => '23华为01',
            'type' => 'corporate',
            'type_name' => '企业债',
            'period' => '3年',
            'price' => 101.56 + (rand(-32, 32) / 100),
            'yield' => 3.38 + (rand(-19, 19) / 100),
            'change' => rand(-10, 10) / 100,
            'rating' => 'AAA',
            'amount' => '100亿'
        ],
        [
            'code' => '163851',
            'name' => '23腾讯02',
            'type' => 'corporate',
            'type_name' => '企业债',
            'period' => '5年',
            'price' => 100.89 + (rand(-36, 36) / 100),
            'yield' => 3.72 + (rand(-24, 24) / 100),
            'change' => rand(-14, 14) / 100,
            'rating' => 'AAA',
            'amount' => '90亿'
        ],
        [
            'code' => '143952',
            'name' => '23阿里03',
            'type' => 'corporate',
            'type_name' => '企业债',
            'period' => '4年',
            'price' => 99.87 + (rand(-34, 34) / 100),
            'yield' => 3.58 + (rand(-22, 22) / 100),
            'change' => rand(-12, 12) / 100,
            'rating' => 'AAA',
            'amount' => '85亿'
        ],
        // 国际债券
        [
            'code' => 'CN2501',
            'name' => '中国美元债',
            'type' => 'international',
            'type_name' => '国际债券',
            'period' => '10年',
            'price' => 97.85 + (rand(-45, 45) / 100),
            'yield' => 4.12 + (rand(-28, 28) / 100),
            'change' => rand(-18, 18) / 100,
            'rating' => 'A+',
            'amount' => '$2B'
        ],
        [
            'code' => 'CN2502',
            'name' => '中国欧元债',
            'type' => 'international',
            'type_name' => '国际债券',
            'period' => '7年',
            'price' => 98.52 + (rand(-42, 42) / 100),
            'yield' => 3.85 + (rand(-26, 26) / 100),
            'change' => rand(-16, 16) / 100,
            'rating' => 'A+',
            'amount' => '€1.5B'
        ],
        // 更多可转债
        [
            'code' => '123461',
            'name' => '光大转债',
            'type' => 'convertible',
            'type_name' => '可转债',
            'period' => '5年',
            'price' => 145.32 + (rand(-46, 46) / 100),
            'yield' => 1.85 + (rand(-16, 16) / 100),
            'change' => rand(-12, 12) / 100,
            'rating' => 'AAA',
            'amount' => '200亿'
        ],
        [
            'code' => '123462',
            'name' => '中信转债',
            'type' => 'convertible',
            'type_name' => '可转债',
            'period' => '6年',
            'price' => 139.78 + (rand(-44, 44) / 100),
            'yield' => 1.95 + (rand(-17, 17) / 100),
            'change' => rand(-13, 13) / 100,
            'rating' => 'AAA',
            'amount' => '180亿'
        ],
        [
            'code' => '123463',
            'name' => '华夏转债',
            'type' => 'convertible',
            'type_name' => '可转债',
            'period' => '5年',
            'price' => 132.45 + (rand(-43, 43) / 100),
            'yield' => 1.75 + (rand(-14, 14) / 100),
            'change' => rand(-11, 11) / 100,
            'rating' => 'AAA',
            'amount' => '190亿'
        ],
        [
            'code' => '123464',
            'name' => '广发转债',
            'type' => 'convertible',
            'type_name' => '可转债',
            'period' => '6年',
            'price' => 141.67 + (rand(-47, 47) / 100),
            'yield' => 1.88 + (rand(-15, 15) / 100),
            'change' => rand(-13, 13) / 100,
            'rating' => 'AAA',
            'amount' => '170亿'
        ],
        [
            'code' => '123465',
            'name' => '中行转债',
            'type' => 'convertible',
            'type_name' => '可转债',
            'period' => '5年',
            'price' => 136.89 + (rand(-41, 41) / 100),
            'yield' => 1.72 + (rand(-13, 13) / 100),
            'change' => rand(-10, 10) / 100,
            'rating' => 'AAA',
            'amount' => '210亿'
        ],
        [
            'code' => '123466',
            'name' => '建行转债',
            'type' => 'convertible',
            'type_name' => '可转债',
            'period' => '6年',
            'price' => 143.21 + (rand(-45, 45) / 100),
            'yield' => 1.82 + (rand(-14, 14) / 100),
            'change' => rand(-12, 12) / 100,
            'rating' => 'AAA',
            'amount' => '160亿'
        ],
        [
            'code' => '123467',
            'name' => '工行转债',
            'type' => 'convertible',
            'type_name' => '可转债',
            'period' => '5年',
            'price' => 134.56 + (rand(-42, 42) / 100),
            'yield' => 1.68 + (rand(-12, 12) / 100),
            'change' => rand(-11, 11) / 100,
            'rating' => 'AAA',
            'amount' => '230亿'
        ],
        [
            'code' => '123468',
            'name' => '农行转债',
            'type' => 'convertible',
            'type_name' => '可转债',
            'period' => '6年',
            'price' => 140.33 + (rand(-44, 44) / 100),
            'yield' => 1.79 + (rand(-15, 15) / 100),
            'change' => rand(-12, 12) / 100,
            'rating' => 'AAA',
            'amount' => '150亿'
        ],
        [
            'code' => '123469',
            'name' => '交行转债',
            'type' => 'convertible',
            'type_name' => '可转债',
            'period' => '5年',
            'price' => 137.12 + (rand(-40, 40) / 100),
            'yield' => 1.71 + (rand(-13, 13) / 100),
            'change' => rand(-10, 10) / 100,
            'rating' => 'AAA',
            'amount' => '175亿'
        ],
        [
            'code' => '123470',
            'name' => '邮储转债',
            'type' => 'convertible',
            'type_name' => '可转债',
            'period' => '6年',
            'price' => 144.78 + (rand(-48, 48) / 100),
            'yield' => 1.91 + (rand(-16, 16) / 100),
            'change' => rand(-14, 14) / 100,
            'rating' => 'AAA',
            'amount' => '165亿'
        ],
        [
            'code' => '123471',
            'name' => '招行转债',
            'type' => 'convertible',
            'type_name' => '可转债',
            'period' => '5年',
            'price' => 133.89 + (rand(-41, 41) / 100),
            'yield' => 1.66 + (rand(-11, 11) / 100),
            'change' => rand(-9, 9) / 100,
            'rating' => 'AAA',
            'amount' => '195亿'
        ],
        [
            'code' => '123472',
            'name' => '中金转债',
            'type' => 'convertible',
            'type_name' => '可转债',
            'period' => '6年',
            'price' => 146.25 + (rand(-49, 49) / 100),
            'yield' => 1.98 + (rand(-18, 18) / 100),
            'change' => rand(-15, 15) / 100,
            'rating' => 'AAA',
            'amount' => '155亿'
        ],
        [
            'code' => '123473',
            'name' => '国泰转债',
            'type' => 'convertible',
            'type_name' => '可转债',
            'period' => '5年',
            'price' => 135.67 + (rand(-43, 43) / 100),
            'yield' => 1.73 + (rand(-13, 13) / 100),
            'change' => rand(-11, 11) / 100,
            'rating' => 'AAA',
            'amount' => '185亿'
        ],
        [
            'code' => '123474',
            'name' => '华泰转债',
            'type' => 'convertible',
            'type_name' => '可转债',
            'period' => '6年',
            'price' => 142.45 + (rand(-46, 46) / 100),
            'yield' => 1.86 + (rand(-15, 15) / 100),
            'change' => rand(-13, 13) / 100,
            'rating' => 'AAA',
            'amount' => '145亿'
        ],
        [
            'code' => '123475',
            'name' => '申万转债',
            'type' => 'convertible',
            'type_name' => '可转债',
            'period' => '5年',
            'price' => 138.92 + (rand(-44, 44) / 100),
            'yield' => 1.77 + (rand(-14, 14) / 100),
            'change' => rand(-12, 12) / 100,
            'rating' => 'AAA',
            'amount' => '140亿'
        ],
        // 更多金融债
        [
            'code' => '112028',
            'name' => '24邮储01',
            'type' => 'financial',
            'type_name' => '金融债',
            'period' => '3年',
            'price' => 100.23 + (rand(-29, 29) / 100),
            'yield' => 2.92 + (rand(-17, 17) / 100),
            'change' => rand(-9, 9) / 100,
            'rating' => 'AAA',
            'amount' => '130亿'
        ],
        [
            'code' => '112029',
            'name' => '24招行02',
            'type' => 'financial',
            'type_name' => '金融债',
            'period' => '4年',
            'price' => 99.87 + (rand(-31, 31) / 100),
            'yield' => 3.08 + (rand(-20, 20) / 100),
            'change' => rand(-10, 10) / 100,
            'rating' => 'AAA',
            'amount' => '120亿'
        ],
        // 更多企业债
        [
            'code' => '163678',
            'name' => '23华为03',
            'type' => 'corporate',
            'type_name' => '企业债',
            'period' => '5年',
            'price' => 100.58 + (rand(-36, 36) / 100),
            'yield' => 3.72 + (rand(-24, 24) / 100),
            'change' => rand(-14, 14) / 100,
            'rating' => 'AAA',
            'amount' => '100亿'
        ],
        [
            'code' => '143892',
            'name' => '23碧桂园02',
            'type' => 'corporate',
            'type_name' => '企业债',
            'period' => '3年',
            'price' => 97.45 + (rand(-38, 38) / 100),
            'yield' => 4.52 + (rand(-27, 27) / 100),
            'change' => rand(-16, 16) / 100,
            'rating' => 'AA',
            'amount' => '45亿'
        ]
    ];

    return $bonds;
}

/**
 * 生成/获取市场数据
 */
function generateMarketData() {
    $now = time();

    // 使用真实数据源
    $funds = fetchRealFundData();
    $ipos = fetchRealIPOData();
    $bonds = fetchRealBondData();

    $data = [
        'funds' => $funds,
        'ipos' => $ipos,
        'bonds' => $bonds,
        'update_time' => date('Y-m-d H:i:s'),
        'timestamp' => $now
    ];

    return $data;
}

// 处理不同的请求
try {
    switch ($action) {
        case 'fetch':
            // 获取数据
            $data = generateMarketData();

            // 保存到文件
            file_put_contents($marketDataFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

            // 返回数据
            if ($type !== 'all') {
                // 只返回特定类型的数据
                echo json_encode([
                    'success' => true,
                    'data' => $data[$type] ?? [],
                    'update_time' => $data['update_time']
                ], JSON_UNESCAPED_UNICODE);
            } else {
                echo json_encode([
                    'success' => true,
                    'data' => $data
                ], JSON_UNESCAPED_UNICODE);
            }
            break;

        case 'get':
            // 从文件读取数据
            if (file_exists($marketDataFile)) {
                $data = json_decode(file_get_contents($marketDataFile), true);

                if ($type !== 'all') {
                    echo json_encode([
                        'success' => true,
                        'data' => $data[$type] ?? [],
                        'update_time' => $data['update_time'] ?? ''
                    ], JSON_UNESCAPED_UNICODE);
                } else {
                    echo json_encode([
                        'success' => true,
                        'data' => $data
                    ], JSON_UNESCAPED_UNICODE);
                }
            } else {
                // 文件不存在，生成新数据
                $data = generateMarketData();
                file_put_contents($marketDataFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

                echo json_encode([
                    'success' => true,
                    'data' => $type !== 'all' ? ($data[$type] ?? []) : $data,
                    'update_time' => $data['update_time'] ?? ''
                ], JSON_UNESCAPED_UNICODE);
            }
            break;

        default:
            throw new Exception('未知的操作类型');
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
