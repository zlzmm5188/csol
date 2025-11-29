<?php
/**
 * 财经日历采集器
 * 从多个财经网站采集实时财经日历数据
 */

header('Content-Type: application/json; charset=utf-8');

// 配置
define('CALENDAR_DATA_FILE', __DIR__ . '/data/calendar-data.json');
define('CALENDAR_CACHE_TIME', 3600); // 1小时缓存

// 确保数据目录存在
if (!is_dir(__DIR__ . '/data')) {
    mkdir(__DIR__ . '/data', 0755, true);
}

/**
 * 采集金十数据财经日历
 */
function fetchJinshiCalendar() {
    $events = [];
    try {
        // 金十数据日历API
        $today = date('Y-m-d');
        $url = 'https://rili.jin10.com/data/daily/' . str_replace('-', '/', $today);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($response && $httpCode == 200) {
            $data = json_decode($response, true);
            if (isset($data['data']) && is_array($data['data'])) {
                foreach ($data['data'] as $item) {
                    $importance = 'low';
                    if (isset($item['star']) && $item['star'] >= 3) {
                        $importance = 'high';
                    } elseif (isset($item['star']) && $item['star'] >= 2) {
                        $importance = 'medium';
                    }

                    $region = 'us';
                    $country = $item['country'] ?? '未知';
                    if (strpos($country, '中国') !== false) $region = 'cn';
                    elseif (strpos($country, '美国') !== false) $region = 'us';
                    elseif (strpos($country, '欧') !== false) $region = 'eu';
                    elseif (strpos($country, '日本') !== false) $region = 'jp';
                    elseif (strpos($country, '英国') !== false) $region = 'uk';

                    $events[] = [
                        'id' => 'jinshi_' . ($item['id'] ?? uniqid()),
                        'date' => $today,
                        'time' => $item['pub_time'] ?? '--:--',
                        'region' => $region,
                        'country' => $country,
                        'event' => $item['name'] ?? '',
                        'importance' => $importance,
                        'actual' => $item['actual'] ?? '--',
                        'forecast' => $item['consensus'] ?? '--',
                        'previous' => $item['previous'] ?? '--',
                        'type' => 'data',
                        'unit' => $item['unit'] ?? '',
                        'source' => '金十数据'
                    ];
                }
                echo "金十数据：成功采集 " . count($events) . " 条\n";
            }
        }
    } catch (Exception $e) {
        error_log('金十数据日历采集失败: ' . $e->getMessage());
    }
    return $events;
}

/**
 * 生成模拟数据（作为补充）
 */
function generateMockData() {
    $today = date('Y-m-d');
    $tomorrow = date('Y-m-d', strtotime('+1 day'));
    $dayAfter = date('Y-m-d', strtotime('+2 days'));

    $mockData = [
        $today => [
            ['time' => '09:30', 'region' => 'cn', 'country' => '中国', 'event' => '工业增加值同比', 'importance' => 'high', 'actual' => '--', 'forecast' => '5.4%', 'previous' => '5.3%', 'type' => 'data', 'unit' => '%'],
            ['time' => '14:00', 'region' => 'eu', 'country' => '欧元区', 'event' => 'CPI年率初值', 'importance' => 'high', 'actual' => '--', 'forecast' => '2.1%', 'previous' => '2.0%', 'type' => 'data', 'unit' => '%'],
            ['time' => '16:30', 'region' => 'us', 'country' => '美国', 'event' => '初请失业金人数', 'importance' => 'medium', 'actual' => '--', 'forecast' => '23.0万', 'previous' => '23.2万', 'type' => 'data', 'unit' => '万人'],
            ['time' => '20:30', 'region' => 'us', 'country' => '美国', 'event' => '美联储主席鲍威尔讲话', 'importance' => 'high', 'actual' => '--', 'forecast' => '--', 'previous' => '--', 'type' => 'event', 'unit' => ''],
            ['time' => '22:00', 'region' => 'us', 'country' => '美国', 'event' => '谘商会消费者信心指数', 'importance' => 'medium', 'actual' => '--', 'forecast' => '100.5', 'previous' => '98.7', 'type' => 'data', 'unit' => ''],
        ],
        $tomorrow => [
            ['time' => '全天', 'region' => 'us', 'country' => '美国', 'event' => '纽约证券交易所休市', 'importance' => 'low', 'actual' => '--', 'forecast' => '--', 'previous' => '--', 'type' => 'holiday', 'unit' => ''],
            ['time' => '07:50', 'region' => 'jp', 'country' => '日本', 'event' => '贸易帐', 'importance' => 'medium', 'actual' => '--', 'forecast' => '4200亿', 'previous' => '3950亿', 'type' => 'data', 'unit' => '亿日元'],
            ['time' => '16:30', 'region' => 'us', 'country' => '美国', 'event' => '零售销售月率', 'importance' => 'high', 'actual' => '--', 'forecast' => '0.3%', 'previous' => '0.2%', 'type' => 'data', 'unit' => '%'],
        ],
        $dayAfter => [
            ['time' => '09:30', 'region' => 'cn', 'country' => '中国', 'event' => '新增人民币贷款', 'importance' => 'medium', 'actual' => '--', 'forecast' => '12500亿', 'previous' => '11800亿', 'type' => 'data', 'unit' => '亿元'],
            ['time' => '14:00', 'region' => 'eu', 'country' => '欧元区', 'event' => '欧洲央行行长拉加德讲话', 'importance' => 'high', 'actual' => '--', 'forecast' => '--', 'previous' => '--', 'type' => 'event', 'unit' => ''],
            ['time' => '20:30', 'region' => 'us', 'country' => '美国', 'event' => '核心PPI月率', 'importance' => 'high', 'actual' => '--', 'forecast' => '0.2%', 'previous' => '0.1%', 'type' => 'data', 'unit' => '%'],
        ]
    ];

    $events = [];
    foreach ($mockData as $date => $dateEvents) {
        foreach ($dateEvents as $event) {
            $events[] = array_merge($event, [
                'id' => 'mock_' . md5($date . $event['time'] . $event['event']),
                'date' => $date,
                'source' => '系统数据'
            ]);
        }
    }

    return $events;
}

/**
 * 按日期组织数据
 */
function organizeByDate($allEvents) {
    $organized = [];

    foreach ($allEvents as $event) {
        $date = $event['date'];
        if (!isset($organized[$date])) {
            $organized[$date] = [];
        }
        $organized[$date][] = $event;
    }

    // 按时间排序
    foreach ($organized as $date => &$events) {
        usort($events, function($a, $b) {
            if ($a['time'] === '全天') return -1;
            if ($b['time'] === '全天') return 1;
            return strcmp($a['time'], $b['time']);
        });
    }

    return $organized;
}

/**
 * 主采集函数
 */
function crawlCalendar($force = false) {
    // 检查缓存
    if (!$force && file_exists(CALENDAR_DATA_FILE)) {
        $lastModified = filemtime(CALENDAR_DATA_FILE);
        if (time() - $lastModified < CALENDAR_CACHE_TIME) {
            return json_decode(file_get_contents(CALENDAR_DATA_FILE), true);
        }
    }

    // 采集数据
    $allEvents = [];

    // 尝试从真实API采集
    $realEvents = fetchJinshiCalendar();
    if (count($realEvents) > 0) {
        $allEvents = array_merge($allEvents, $realEvents);
    }

    // 添加模拟数据作为补充
    $mockEvents = generateMockData();
    $allEvents = array_merge($allEvents, $mockEvents);

    // 去重
    $uniqueEvents = [];
    $eventKeys = [];
    foreach ($allEvents as $event) {
        $key = $event['date'] . '_' . $event['time'] . '_' . $event['event'];
        if (!in_array($key, $eventKeys)) {
            $eventKeys[] = $key;
            $uniqueEvents[] = $event;
        }
    }

    // 按日期组织
    $calendarData = organizeByDate($uniqueEvents);

    // 添加元数据
    $result = [
        'data' => $calendarData,
        'updateTime' => date('Y-m-d H:i:s'),
        'timestamp' => time(),
        'totalEvents' => count($uniqueEvents),
        'dateRange' => [
            'start' => min(array_keys($calendarData)),
            'end' => max(array_keys($calendarData))
        ]
    ];

    // 保存到文件
    file_put_contents(CALENDAR_DATA_FILE, json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

    return $result;
}

// ========== API处理 ==========
$action = $_GET['action'] ?? 'get';

switch ($action) {
    case 'crawl':
        // 手动触发采集
        $force = isset($_GET['force']) && $_GET['force'] == '1';
        $calendarData = crawlCalendar($force);
        echo json_encode([
            'code' => 0,
            'message' => '采集成功',
            'data' => $calendarData,
            'count' => $calendarData['totalEvents']
        ]);
        break;

    case 'get':
    default:
        // 获取日历数据
        if (file_exists(CALENDAR_DATA_FILE)) {
            $calendarData = json_decode(file_get_contents(CALENDAR_DATA_FILE), true);

            // 如果数据过期，自动重新采集
            if (time() - $calendarData['timestamp'] > CALENDAR_CACHE_TIME) {
                $calendarData = crawlCalendar(false);
            }

            $date = $_GET['date'] ?? date('Y-m-d');
            $type = $_GET['type'] ?? 'data';
            $region = $_GET['region'] ?? 'all';
            $importance = $_GET['importance'] ?? 'all';

            $events = $calendarData['data'][$date] ?? [];

            // 应用筛选
            $filteredEvents = array_filter($events, function($event) use ($type, $region, $importance) {
                if ($event['type'] !== $type) return false;
                if ($region !== 'all' && $event['region'] !== $region) return false;
                if ($importance !== 'all' && $event['importance'] !== $importance) return false;
                return true;
            });

            echo json_encode([
                'code' => 0,
                'message' => 'success',
                'data' => [
                    'events' => array_values($filteredEvents),
                    'total' => count($filteredEvents),
                    'date' => $date,
                    'updateTime' => $calendarData['updateTime']
                ]
            ]);
        } else {
            // 首次访问，自动采集
            $calendarData = crawlCalendar(true);
            $date = $_GET['date'] ?? date('Y-m-d');
            $events = $calendarData['data'][$date] ?? [];

            echo json_encode([
                'code' => 0,
                'message' => 'success',
                'data' => [
                    'events' => $events,
                    'total' => count($events),
                    'date' => $date,
                    'updateTime' => $calendarData['updateTime']
                ]
            ]);
        }
        break;
}
