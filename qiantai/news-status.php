<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>新闻采集器状态</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f7fa; padding: 20px; }
        .container { max-width: 1000px; margin: 0 auto; }
        .card { background: #fff; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h1 { font-size: 28px; color: #1a2332; margin-bottom: 8px; }
        .subtitle { color: #6c757d; margin-bottom: 24px; }
        .status { display: flex; justify-content: space-between; margin-bottom: 16px; padding: 16px; background: #f8f9fa; border-radius: 8px; }
        .status-item { text-align: center; }
        .status-label { font-size: 12px; color: #6c757d; margin-bottom: 4px; }
        .status-value { font-size: 24px; font-weight: 700; color: #d4af37; }
        .status-value.green { color: #22c55e; }
        .status-value.red { color: #ef4444; }
        .btn { display: inline-block; padding: 10px 24px; background: #d4af37; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px; cursor: pointer; border: none; font-size: 14px; }
        .btn:hover { background: #c19d2f; }
        .btn.secondary { background: #6c757d; }
        .btn.secondary:hover { background: #5a6268; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e9ecef; }
        th { background: #f8f9fa; font-weight: 600; color: #495057; }
        .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #e8edf3; color: #6c757d; font-size: 12px; margin-right: 4px; }
        .log { background: #1a2332; color: #22c55e; padding: 16px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 12px; max-height: 300px; overflow-y: auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>📰 财经新闻采集器</h1>
            <p class="subtitle">实时监控新闻采集状态</p>

            <?php
            define('NEWS_DATA_FILE', __DIR__ . '/data/news-data.json');

            $status = [
                'file_exists' => file_exists(NEWS_DATA_FILE),
                'file_size' => file_exists(NEWS_DATA_FILE) ? filesize(NEWS_DATA_FILE) : 0,
                'last_update' => file_exists(NEWS_DATA_FILE) ? date('Y-m-d H:i:s', filemtime(NEWS_DATA_FILE)) : '未知',
                'time_ago' => file_exists(NEWS_DATA_FILE) ? time() - filemtime(NEWS_DATA_FILE) : 0,
                'total_news' => 0,
                'categories' => []
            ];

            if ($status['file_exists']) {
                $data = json_decode(file_get_contents(NEWS_DATA_FILE), true);
                if ($data) {
                    $status['total_news'] = count($data['all'] ?? []);
                    $status['categories'] = [
                        '全部' => count($data['all'] ?? []),
                        '外汇' => count($data['forex'] ?? []),
                        '股票' => count($data['stock'] ?? []),
                        '商品' => count($data['commodity'] ?? []),
                        '加密' => count($data['crypto'] ?? [])
                    ];
                    $status['update_time'] = $data['updateTime'] ?? '未知';
                }
            }

            $freshness = $status['time_ago'] < 600 ? 'green' : ($status['time_ago'] < 1800 ? 'orange' : 'red');
            ?>

            <div class="status">
                <div class="status-item">
                    <div class="status-label">数据状态</div>
                    <div class="status-value <?php echo $status['file_exists'] ? 'green' : 'red'; ?>">
                        <?php echo $status['file_exists'] ? '✓ 正常' : '✗ 异常'; ?>
                    </div>
                </div>
                <div class="status-item">
                    <div class="status-label">新闻总数</div>
                    <div class="status-value"><?php echo $status['total_news']; ?></div>
                </div>
                <div class="status-item">
                    <div class="status-label">文件大小</div>
                    <div class="status-value"><?php echo round($status['file_size'] / 1024, 1); ?> KB</div>
                </div>
                <div class="status-item">
                    <div class="status-label">更新时间</div>
                    <div class="status-value" style="font-size: 14px;"><?php echo $status['last_update']; ?></div>
                </div>
                <div class="status-item">
                    <div class="status-label">数据新鲜度</div>
                    <div class="status-value <?php echo $freshness; ?>">
                        <?php echo round($status['time_ago'] / 60, 1); ?> 分钟前
                    </div>
                </div>
            </div>

            <div style="margin: 20px 0;">
                <button class="btn" onclick="triggerCrawl()">🔄 手动采集</button>
                <a href="news-flash.html" class="btn secondary">📱 查看前端</a>
                <a href="NEWS_CRAWLER_README.md" class="btn secondary" target="_blank">📖 使用文档</a>
                <button class="btn secondary" onclick="location.reload()">🔄 刷新状态</button>
            </div>
        </div>

        <div class="card">
            <h2 style="margin-bottom: 16px;">📊 分类统计</h2>
            <table>
                <thead>
                    <tr>
                        <th>分类</th>
                        <th>新闻数量</th>
                        <th>占比</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($status['categories'] as $cat => $count): ?>
                    <tr>
                        <td><?php echo $cat; ?></td>
                        <td><?php echo $count; ?> 条</td>
                        <td><?php echo $status['total_news'] > 0 ? round($count / $status['total_news'] * 100, 1) : 0; ?>%</td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>

        <div class="card">
            <h2 style="margin-bottom: 16px;">📜 最新日志</h2>
            <div class="log" id="log">
                <?php
                $logFile = '/tmp/news-cron.log';
                if (file_exists($logFile)) {
                    $logs = file($logFile);
                    $recentLogs = array_slice($logs, -20);
                    echo nl2br(htmlspecialchars(implode('', $recentLogs)));
                } else {
                    echo "暂无日志记录";
                }
                ?>
            </div>
        </div>

        <div class="card">
            <h2 style="margin-bottom: 16px;">🔧 系统信息</h2>
            <table>
                <tr>
                    <td>PHP版本</td>
                    <td><?php echo phpversion(); ?></td>
                </tr>
                <tr>
                    <td>cURL支持</td>
                    <td><?php echo function_exists('curl_init') ? '✓ 已启用' : '✗ 未启用'; ?></td>
                </tr>
                <tr>
                    <td>数据目录</td>
                    <td><?php echo __DIR__ . '/data/'; ?></td>
                </tr>
                <tr>
                    <td>定时任务</td>
                    <td>每5分钟执行一次</td>
                </tr>
                <tr>
                    <td>服务器时间</td>
                    <td><?php echo date('Y-m-d H:i:s'); ?></td>
                </tr>
            </table>
        </div>
    </div>

    <script>
    async function triggerCrawl() {
        const btn = event.target;
        btn.disabled = true;
        btn.textContent = '⏳ 采集中...';

        try {
            const response = await fetch('news-crawler.php?action=crawl&force=1');
            const result = await response.json();

            if (result.code === 0) {
                alert('采集成功！共采集 ' + result.count + ' 条新闻');
                location.reload();
            } else {
                alert('采集失败：' + result.message);
            }
        } catch (error) {
            alert('采集失败：' + error.message);
        } finally {
            btn.disabled = false;
            btn.textContent = '🔄 手动采集';
        }
    }
    </script>
</body>
</html>
