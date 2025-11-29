/**
 * F12 错误自动扫描工具
 * 使用 Playwright 扫描页面控制台错误
 */

import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  frontendPath: '/www/wwwroot/copla/providence',
  pages: [
    'index.html',
    'login.html',
    'profile.html',
    'projects.html',
    'ribao.html',
    'withdraw.html',
    'recharge.html',
  ],
};

async function scanPageErrors(pageUrl) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = {
    console: [],
    js: [],
    network: [],
    apiUndefined: [],
  };

  // 监听控制台错误
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      errors.console.push(text);

      // 检查 "API接口未定义" 错误
      if (text.includes('API接口未定义') || text.includes('接口未定义')) {
        const match = text.match(/接口未定义[:\s]+([^\s]+)/);
        errors.apiUndefined.push({
          message: text,
          path: match ? match[1] : 'unknown',
        });
      }
    }
  });

  // 监听页面错误
  page.on('pageerror', err => {
    errors.js.push({
      message: err.message,
      stack: err.stack,
    });
  });

  // 监听网络错误
  page.on('requestfailed', req => {
    errors.network.push({
      url: req.url(),
      error: req.failure()?.errorText || 'Unknown',
    });
  });

  try {
    await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000); // 等待页面加载完成
  } catch (error) {
    errors.js.push({
      message: `页面加载失败: ${error.message}`,
      stack: error.stack,
    });
  }

  await browser.close();

  return errors;
}

async function scanAllPages() {
  const baseURL = 'https://copla.top';
  const allErrors = {};

  console.log('\n🔍 开始扫描页面 F12 错误...\n');

  for (const pageFile of CONFIG.pages) {
    const pageUrl = `${baseURL}/${pageFile}`;
    console.log(`扫描: ${pageFile}...`);

    try {
      const errors = await scanPageErrors(pageUrl);
      allErrors[pageFile] = errors;

      const totalErrors = errors.console.length + errors.js.length + errors.network.length;
      if (totalErrors > 0) {
        console.log(`  ⚠️  发现 ${totalErrors} 个错误`);
        if (errors.apiUndefined.length > 0) {
          console.log(`  ❌ API接口未定义: ${errors.apiUndefined.length} 个`);
        }
      } else {
        console.log(`  ✅ 无错误`);
      }
    } catch (error) {
      console.log(`  ❌ 扫描失败: ${error.message}`);
      allErrors[pageFile] = { error: error.message };
    }
  }

  // 生成报告
  const reportPath = path.join(CONFIG.frontendPath, 'docs', 'f12-error-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(allErrors, null, 2), 'utf8');

  console.log(`\n📄 错误报告已保存: ${reportPath}\n`);

  return allErrors;
}

const isMainModule = import.meta.url === `file://${process.argv[1]}` ||
                     process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isMainModule || process.argv[1]?.includes('api-f12-scanner.js')) {
  scanAllPages().catch(console.error);
}

export { scanAllPages, scanPageErrors };
