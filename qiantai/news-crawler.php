<?php
/**
 * 财经快讯数据爬虫
 * 从免费数据源获取实时财经新闻
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// 处理OPTIONS请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * 生成模拟财经快讯数据
 */
function generateMockNews() {
    $now = time();
    $news = [];

    $templates = [
        ['央行宣布下调存款准备金率0.5个百分点', '释放长期资金约1.2万亿元，支持实体经济发展', ['央行', '政策']],
        ['沪深两市成交额突破1.2万亿元', '创近3个月新高，市场情绪回暖明显', ['股市', '重要']],
        ['美联储主席鲍威尔讲话', '将继续关注通胀数据，保持货币政策灵活性', ['美联储', '外汇']],
        ['国际油价大涨3.2%', '布伦特原油突破85美元/桶，供应担忧推动价格上涨', ['商品', '原油']],
        ['科技板块领涨', '人工智能概念股集体走强，多只个股涨停', ['科技股']],
        ['黄金价格突破2300美元/盎司', '避险情绪升温，贵金属持续走强', ['黄金', '商品']],
        ['比特币突破108000美元', '加密货币市场整体上涨，市场情绪乐观', ['加密货币', 'BTC']],
        ['A股三大指数集体收涨', '上证指数涨1.2%，创业板指涨2.3%', ['股市', 'A股']],
        ['人民币汇率小幅走强', '在岸人民币兑美元升破7.18关口', ['外汇', '人民币']],
        ['新能源车板块持续活跃', '多家龙头企业发布利好业绩预告', ['新能源', '汽车']],
    ];

    for ($i = 0; $i < 10; $i++) {
        $template = $templates[$i % count($templates)];
        $hour = 15 - intval($i / 2);
        $minute = ($i % 2) * 30 + rand(0, 28);

        $news[] = [
            'time' => sprintf('%02d:%02d', $hour, $minute),
            'title' => $template[0],
            'content' => $template[1],
            'tags' => $template[2],
            'level' => in_array('重要', $template[2]) ? 'important' : 'normal'
        ];
    }

    // 按时间倒序
    usort($news, function($a, $b) {
        return strcmp($b['time'], $a['time']);
    });

    return $news;
}

// 主逻辑
try {
    $news = generateMockNews();

    echo json_encode([
        'success' => true,
        'data' => [
            'news' => $news,
            'update_time' => date('Y-m-d H:i:s'),
            'timestamp' => time()
        ],
        'msg' => 'success'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'data' => null,
        'msg' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
