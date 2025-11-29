/**
 * API接口自动化测试工具
 * 使用 Playwright 风格进行接口测试
 */

import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  frontendPath: '/www/wwwroot/copla/providence',
  apiBaseURL: 'https://api.4kp3l0iq.top/api',
  testTimeout: 30000,
};

// 读取后端路由
function getBackendRoutes() {
  const routesFile = '/www/wwwroot/copla/providence-admin/api/index.php';
  const content = fs.readFileSync(routesFile, 'utf8');
  const routes = {};

  const routeMatches = content.matchAll(/'([^']+)'\s*=>\s*'([^']+)'/g);
  for (const match of routeMatches) {
    routes[match[1]] = match[2];
  }

  return routes;
}

// 测试单个接口
async function testAPI(page, apiPath, method = 'GET', data = null) {
  const url = `${CONFIG.apiBaseURL}/index.php/${apiPath}`;

  try {
    const response = await page.request.fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      data: data ? JSON.stringify(data) : undefined,
    });

    const status = response.status();
    const text = await response.text();
    let json = null;

    try {
      json = JSON.parse(text);
    } catch (e) {
      // 不是JSON响应
    }

    return {
      success: status >= 200 && status < 300,
      status,
      data: json,
      text: text.substring(0, 200), // 只取前200字符
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      data: null,
      text: null,
      error: error.message,
    };
  }
}

// 运行所有接口测试
async function runAllTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const routes = getBackendRoutes();
  const results = [];

  console.log(`\n🧪 开始测试 ${Object.keys(routes).length} 个接口...\n`);

  for (const [route, file] of Object.entries(routes)) {
    if (route.startsWith('admin/')) continue; // 跳过管理员接口

    console.log(`测试: ${route}...`);
    const result = await testAPI(page, route);

    results.push({
      route,
      file,
      ...result,
    });

    if (result.success) {
      console.log(`  ✅ 成功 (${result.status})`);
    } else {
      console.log(`  ❌ 失败 (${result.status || 'ERROR'}): ${result.error || result.text}`);
    }
  }

  await browser.close();

  // 生成测试报告
  const report = {
    timestamp: new Date().toISOString(),
    total: results.length,
    success: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results: results,
  };

  const reportPath = path.join(CONFIG.frontendPath, 'docs', 'api-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log(`\n📊 测试完成:`);
  console.log(`  总计: ${report.total}`);
  console.log(`  成功: ${report.success}`);
  console.log(`  失败: ${report.failed}`);
  console.log(`\n📄 报告已保存: ${reportPath}\n`);

  return report;
}

const isMainModule = import.meta.url === `file://${process.argv[1]}` ||
                     process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isMainModule || process.argv[1]?.includes('api-test-runner.js')) {
  runAllTests().catch(console.error);
}

export { runAllTests, testAPI };
