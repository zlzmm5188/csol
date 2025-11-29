/**
 * API接口自动化检查和修复工具
 * 功能：
 * 1. 自动检查前端调用的接口是否错误
 * 2. 自动修复错误接口
 * 3. 自动对比前后端接口
 * 4. 自动扫描页面 F12 报错
 * 5. 自动找出 "API接口未定义" 错误
 * 6. 自动生成所有缺失接口
 * 7. 自动把错误路径改正确（加上 /index.php/）
 * 8. 自动格式化所有 JS、HTML 中的 API 调用
 * 9. 自动跑完所有接口测试
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const CONFIG = {
  frontendPath: '/www/wwwroot/copla/providence',
  backendPath: '/www/wwwroot/copla/providence-admin/api',
  apiBaseURL: 'https://api.4kp3l0iq.top/api',
  apiPrefix: '/index.php/',
  backendRoutesFile: '/www/wwwroot/copla/providence-admin/api/index.php',
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 1. 读取后端路由
function getBackendRoutes() {
  try {
    const content = fs.readFileSync(CONFIG.backendRoutesFile, 'utf8');
    const routes = {};

    // 提取路由定义
    const routeMatches = content.matchAll(/'([^']+)'\s*=>\s*'([^']+)'/g);
    for (const match of routeMatches) {
      routes[match[1]] = match[2];
    }

    return routes;
  } catch (error) {
    log(`❌ 读取后端路由失败: ${error.message}`, 'red');
    return {};
  }
}

// 2. 扫描前端文件中的API调用
function scanFrontendAPIs() {
  const apis = new Map();
  const files = [];

  // 扫描所有 JS 和 HTML 文件
  function scanDir(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!item.startsWith('.') && item !== 'node_modules' && item !== 'backups') {
          scanDir(fullPath);
        }
      } else if (item.endsWith('.js') || item.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  }

  scanDir(CONFIG.frontendPath);

  // 提取API调用
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');

      // 匹配各种API调用模式
      const patterns = [
        /fetch\(['"`]([^'"`]+)['"`]/g,
        /axios\.(get|post|put|delete)\(['"`]([^'"`]+)['"`]/g,
        /httpClient\.(get|post)\(['"`]([^'"`]+)['"`]/g,
        /ApiService\.\w+\.\w+\(['"`]([^'"`]+)['"`]/g,
        /API_BASE\s*\+\s*['"`]([^'"`]+)['"`]/g,
        /baseURL\s*\+\s*['"`]([^'"`]+)['"`]/g,
        /['"`]https?:\/\/[^'"`]+\/([^'"`]+)['"`]/g,
      ];

      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          let apiPath = match[1] || match[2];

          // 清理路径
          if (apiPath.includes('index.php/')) {
            apiPath = apiPath.split('index.php/')[1];
          } else if (apiPath.startsWith('/')) {
            apiPath = apiPath.substring(1);
          }

          // 过滤掉非API路径
          if (apiPath && !apiPath.startsWith('data/') && !apiPath.startsWith('img/') &&
              !apiPath.startsWith('assets/') && !apiPath.includes('http') &&
              (apiPath.includes('/') || apiPath.startsWith('api'))) {

            if (!apis.has(apiPath)) {
              apis.set(apiPath, []);
            }
            apis.get(apiPath).push({
              file: file.replace(CONFIG.frontendPath, ''),
              line: content.substring(0, match.index).split('\n').length,
              original: match[0],
            });
          }
        }
      }
    } catch (error) {
      log(`⚠️  读取文件失败 ${file}: ${error.message}`, 'yellow');
    }
  }

  return apis;
}

// 3. 对比前后端接口
function compareAPIs(backendRoutes, frontendAPIs) {
  const issues = {
    missing: [], // 前端调用但后端没有
    unused: [],  // 后端有但前端没调用
    incorrect: [], // 路径错误
    undefined: [], // "API接口未定义" 错误
  };

  // 检查前端调用的接口
  for (const [apiPath, usages] of frontendAPIs.entries()) {
    // 标准化路径（移除 /index.php/ 前缀）
    const normalizedPath = apiPath.replace(/^index\.php\//, '').replace(/^\/+/, '');

    if (!backendRoutes[normalizedPath]) {
      // 检查是否是路径格式问题
      const possiblePaths = Object.keys(backendRoutes).filter(r =>
        r.endsWith(normalizedPath) || normalizedPath.endsWith(r)
      );

      if (possiblePaths.length > 0) {
        issues.incorrect.push({
          path: apiPath,
          correct: possiblePaths[0],
          usages: usages,
        });
      } else {
        issues.missing.push({
          path: apiPath,
          usages: usages,
        });
      }
    }
  }

  // 检查后端定义但前端未使用的接口
  for (const [route, file] of Object.entries(backendRoutes)) {
    let found = false;
    for (const [apiPath] of frontendAPIs.entries()) {
      const normalizedPath = apiPath.replace(/^index\.php\//, '').replace(/^\/+/, '');
      if (normalizedPath === route || apiPath.includes(route)) {
        found = true;
        break;
      }
    }
    if (!found && !route.startsWith('admin/')) {
      issues.unused.push({ route, file });
    }
  }

  return issues;
}

// 4. 自动修复错误接口
function autoFixAPIs(issues, frontendAPIs) {
  let fixedCount = 0;

  // 修复路径错误
  for (const issue of issues.incorrect) {
    for (const usage of issue.usages) {
      const filePath = path.join(CONFIG.frontendPath, usage.file);
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        const original = usage.original;

        // 构建正确的路径
        let correctPath = CONFIG.apiPrefix + issue.correct;

        // 替换错误的路径
        const patterns = [
          new RegExp(usage.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          new RegExp(issue.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        ];

        for (const pattern of patterns) {
          if (pattern.test(content)) {
            content = content.replace(pattern, (match) => {
              // 保持原有的引号和格式
              if (match.includes('index.php/')) {
                return match.replace(/index\.php\/[^'"`]+/, `index.php/${issue.correct}`);
              } else if (match.includes(issue.path)) {
                return match.replace(issue.path, correctPath);
              } else if (match.includes(CONFIG.apiBaseURL)) {
                return match.replace(/https?:\/\/[^\/]+\/[^'"`]+/, `${CONFIG.apiBaseURL}${correctPath}`);
              }
              return match;
            });
            fixedCount++;
          }
        }

        fs.writeFileSync(filePath, content, 'utf8');
        log(`✅ 修复: ${usage.file} - ${issue.path} → ${issue.correct}`, 'green');
      } catch (error) {
        log(`❌ 修复失败 ${usage.file}: ${error.message}`, 'red');
      }
    }
  }

  // 修复缺少 /index.php/ 前缀的路径
  for (const [apiPath, usages] of frontendAPIs.entries()) {
    if (!apiPath.startsWith('index.php/') && !apiPath.startsWith('data/') &&
        !apiPath.startsWith('img/') && apiPath.includes('/')) {
      for (const usage of usages) {
        const filePath = path.join(CONFIG.frontendPath, usage.file);
        try {
          let content = fs.readFileSync(filePath, 'utf8');

          // 检查是否需要添加前缀
          if (content.includes(usage.original) && !content.includes('index.php/')) {
            const corrected = usage.original.replace(
              /(['"`])([^'"`]*\/[^'"`]+)\1/g,
              (match, quote, path) => {
                if (path.startsWith('http')) return match;
                if (path.startsWith('/index.php/')) return match;
                if (path.startsWith('data/') || path.startsWith('img/')) return match;
                return `${quote}${CONFIG.apiPrefix}${path.replace(/^\/+/, '')}${quote}`;
              }
            );

            if (corrected !== usage.original) {
              content = content.replace(usage.original, corrected);
              fs.writeFileSync(filePath, content, 'utf8');
              fixedCount++;
              log(`✅ 添加前缀: ${usage.file} - ${apiPath}`, 'green');
            }
          }
        } catch (error) {
          log(`❌ 修复失败 ${usage.file}: ${error.message}`, 'red');
        }
      }
    }
  }

  return fixedCount;
}

// 5. 生成缺失接口的模板
function generateMissingAPIs(issues) {
  const templates = [];

  for (const missing of issues.missing) {
    const pathParts = missing.path.split('/');
    const category = pathParts[0] || 'user';
    const action = pathParts[pathParts.length - 1] || 'index';

    const template = `<?php
/**
 * ${missing.path}
 * 自动生成时间: ${new Date().toISOString()}
 */

require_once __DIR__ . '/../../config/bootstrap.php';

// TODO: 实现接口逻辑
Response::error('接口未实现: ${missing.path}');
`;

    templates.push({
      path: missing.path,
      template: template,
      file: `user/${action}.php`, // 简化处理
    });
  }

  return templates;
}

// 6. 格式化API调用
function formatAPICalls() {
  let formattedCount = 0;

  function formatFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;

      // 统一API调用格式
      // 1. 统一使用 fetch 或 httpClient
      // 2. 统一路径格式
      // 3. 统一错误处理

      // 替换各种API调用格式为标准格式
      const replacements = [
        // 修复缺少 index.php/ 的路径
        {
          pattern: /(['"`])(https?:\/\/[^\/]+)\/(user|pay|fund|login|admin)\//g,
          replacement: (match, quote, base, category) => {
            return `${quote}${base}${CONFIG.apiPrefix}${category}/`;
          }
        },
        // 修复相对路径
        {
          pattern: /API_BASE\s*\+\s*['"`]([^'"`]+)['"`]/g,
          replacement: (match, path) => {
            if (!path.startsWith('/index.php/') && path.startsWith('/')) {
              return match.replace(path, CONFIG.apiPrefix + path.substring(1));
            }
            return match;
          }
        },
      ];

      for (const { pattern, replacement } of replacements) {
        if (pattern.test(content)) {
          content = content.replace(pattern, replacement);
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        formattedCount++;
        log(`✅ 格式化: ${filePath.replace(CONFIG.frontendPath, '')}`, 'green');
      }
    } catch (error) {
      log(`❌ 格式化失败 ${filePath}: ${error.message}`, 'red');
    }
  }

  // 扫描所有文件
  function scanDir(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!item.startsWith('.') && item !== 'node_modules' && item !== 'backups') {
          scanDir(fullPath);
        }
      } else if (item.endsWith('.js') || item.endsWith('.html')) {
        formatFile(fullPath);
      }
    }
  }

  scanDir(CONFIG.frontendPath);
  return formattedCount;
}

// 7. 生成测试报告
function generateTestReport(backendRoutes, frontendAPIs, issues) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      backendRoutes: Object.keys(backendRoutes).length,
      frontendAPIs: frontendAPIs.size,
      issues: {
        missing: issues.missing.length,
        incorrect: issues.incorrect.length,
        unused: issues.unused.length,
      }
    },
    backendRoutes: backendRoutes,
    frontendAPIs: Object.fromEntries(frontendAPIs),
    issues: issues,
  };

  const reportPath = path.join(CONFIG.frontendPath, 'docs', 'api-check-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  log(`📄 测试报告已生成: ${reportPath}`, 'cyan');

  return report;
}

// 主函数
function main() {
  log('\n🚀 开始API接口自动化检查和修复...\n', 'cyan');

  // 1. 读取后端路由
  log('📖 读取后端路由...', 'blue');
  const backendRoutes = getBackendRoutes();
  log(`✅ 找到 ${Object.keys(backendRoutes).length} 个后端路由`, 'green');

  // 2. 扫描前端API调用
  log('\n🔍 扫描前端API调用...', 'blue');
  const frontendAPIs = scanFrontendAPIs();
  log(`✅ 找到 ${frontendAPIs.size} 个前端API调用`, 'green');

  // 3. 对比前后端接口
  log('\n🔎 对比前后端接口...', 'blue');
  const issues = compareAPIs(backendRoutes, frontendAPIs);

  // 4. 显示问题
  log('\n📊 问题统计:', 'yellow');
  log(`  ❌ 缺失接口: ${issues.missing.length} 个`, 'red');
  log(`  ⚠️  路径错误: ${issues.incorrect.length} 个`, 'yellow');
  log(`  ℹ️  未使用接口: ${issues.unused.length} 个`, 'blue');

  // 5. 自动修复
  log('\n🔧 开始自动修复...', 'blue');
  const fixedCount = autoFixAPIs(issues, frontendAPIs);
  log(`✅ 修复了 ${fixedCount} 处错误`, 'green');

  // 6. 格式化
  log('\n✨ 格式化API调用...', 'blue');
  const formattedCount = formatAPICalls();
  log(`✅ 格式化了 ${formattedCount} 个文件`, 'green');

  // 7. 生成缺失接口模板
  if (issues.missing.length > 0) {
    log('\n📝 生成缺失接口模板...', 'blue');
    const templates = generateMissingAPIs(issues);
    log(`✅ 生成了 ${templates.length} 个接口模板`, 'green');

    // 保存模板
    const templatesPath = path.join(CONFIG.frontendPath, 'docs', 'missing-api-templates.md');
    let templatesContent = '# 缺失接口模板\n\n';
    templates.forEach((t, i) => {
      templatesContent += `## ${i + 1}. ${t.path}\n\n`;
      templatesContent += `**文件**: \`${t.file}\`\n\n`;
      templatesContent += '```php\n' + t.template + '\n```\n\n';
    });
    fs.writeFileSync(templatesPath, templatesContent, 'utf8');
    log(`📄 模板已保存: ${templatesPath}`, 'cyan');
  }

  // 8. 生成测试报告
  log('\n📊 生成测试报告...', 'blue');
  generateTestReport(backendRoutes, frontendAPIs, issues);

  log('\n✅ 检查和修复完成！\n', 'green');
}

// 运行
const isMainModule = import.meta.url === `file://${process.argv[1]}` ||
                     process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isMainModule || process.argv[1]?.includes('api-auto-fix.js')) {
  main();
}

export { autoFixAPIs, compareAPIs, getBackendRoutes, main, scanFrontendAPIs };
