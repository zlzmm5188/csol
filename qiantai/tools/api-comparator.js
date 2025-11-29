#!/usr/bin/env node
/**
 * Providence API Comparator
 * 比对前端API调用与后端接口实现
 *
 * 运行方式:
 * node api-comparator.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const CONFIG = {
  SCAN_RESULT: "/www/wwwroot/f.abcmall.one/providence/docs/api-scan-result.json",
  API_MAPPING: "/www/wwwroot/f.abcmall.one/providence/docs/api-mapping.json",
  BACKEND_ROOT: "/www/wwwroot/gmo/gmo.com/app/index.php/controller",
  OUTPUT: "/www/wwwroot/f.abcmall.one/providence/docs/api-comparison.json"
};

/**
 * 扫描后端控制器
 */
function scanBackendControllers() {
  const controllers = {};

  try {
    const files = fs.readdirSync(CONFIG.BACKEND_ROOT);

    for (const file of files) {
      if (!file.endsWith('.php')) continue;

      const filePath = path.join(CONFIG.BACKEND_ROOT, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // 提取public方法
      const methodRegex = /public\s+function\s+(\w+)\s*\(/g;
      let match;
      const methods = [];

      while ((match = methodRegex.exec(content))) {
        methods.push(match[1]);
      }

      controllers[file] = {
        file: filePath,
        methods: methods
      };
    }
  } catch (error) {
    console.error("❌ 扫描后端控制器失败:", error.message);
  }

  return controllers;
}

/**
 * 比对API
 */
function compareAPIs() {
  // 读取扫描结果
  let scanResult = {};
  if (fs.existsSync(CONFIG.SCAN_RESULT)) {
    scanResult = JSON.parse(fs.readFileSync(CONFIG.SCAN_RESULT, 'utf8'));
  }

  // 读取API映射
  let apiMapping = { apis: [] };
  if (fs.existsSync(CONFIG.API_MAPPING)) {
    apiMapping = JSON.parse(fs.readFileSync(CONFIG.API_MAPPING, 'utf8'));
  }

  // 扫描后端
  const backendControllers = scanBackendControllers();

  // 比对结果
  const comparison = {
    timestamp: new Date().toISOString(),
    summary: {
      total_frontend_apis: Object.keys(scanResult.endpoints || {}).length,
      mapped_apis: 0,
      implemented_apis: 0,
      missing_apis: 0,
      error_apis: 0
    },
    details: [],
    missing_implementations: [],
    recommendations: []
  };

  // 遍历前端API
  for (const [endpoint, data] of Object.entries(scanResult.endpoints || {})) {
    const detail = {
      endpoint: endpoint,
      method: data.method,
      frontend_files: data.calls.map(c => c.file),
      status: "unknown",
      backend_file: null,
      backend_method: null,
      notes: ""
    };

    // 查找映射
    const mapping = apiMapping.apis.find(api => api.endpoint === endpoint);

    if (mapping) {
      comparison.summary.mapped_apis++;
      detail.backend_file = mapping.backend_file;
      detail.status = mapping.status;
      detail.notes = mapping.notes;

      if (mapping.status.includes("✅")) {
        comparison.summary.implemented_apis++;
      } else if (mapping.status.includes("❌")) {
        comparison.summary.error_apis++;
      }
    } else {
      detail.status = "⚠️ 未映射";
      detail.notes = "前端调用但未在映射表中";
      comparison.summary.missing_apis++;

      // 推测可能的后端位置
      const suggested = suggestBackendLocation(endpoint);
      detail.suggested_location = suggested;

      comparison.missing_implementations.push({
        endpoint: endpoint,
        method: data.method,
        suggested: suggested,
        files_using: data.calls.map(c => c.file)
      });
    }

    comparison.details.push(detail);
  }

  // 生成建议
  generateRecommendations(comparison, backendControllers);

  return comparison;
}

/**
 * 推测后端位置
 */
function suggestBackendLocation(endpoint) {
  // 解析endpoint: /module/controller/method
  const parts = endpoint.split('/').filter(p => p);

  if (parts.length < 3) {
    return {
      controller: "Unknown.php",
      method: "unknown",
      confidence: "low"
    };
  }

  const [module, controller, method] = parts;

  return {
    controller: `${controller.charAt(0).toUpperCase() + controller.slice(1)}.php`,
    method: method,
    path: `/www/wwwroot/gmo/gmo.com/app/${module}/controller/`,
    confidence: "high"
  };
}

/**
 * 生成建议
 */
function generateRecommendations(comparison, backendControllers) {
  const recommendations = [];

  // 建议1: 优先修复错误的API
  const errorAPIs = comparison.details.filter(d => d.status.includes("❌"));
  if (errorAPIs.length > 0) {
    recommendations.push({
      priority: "🔴 高",
      category: "错误修复",
      count: errorAPIs.length,
      description: `有 ${errorAPIs.length} 个API返回错误,需要优先修复`,
      items: errorAPIs.map(api => ({
        endpoint: api.endpoint,
        issue: api.notes
      }))
    });
  }

  // 建议2: 开发缺失的API
  if (comparison.missing_implementations.length > 0) {
    recommendations.push({
      priority: "🟡 中",
      category: "缺失实现",
      count: comparison.missing_implementations.length,
      description: `有 ${comparison.missing_implementations.length} 个API缺少后端实现`,
      items: comparison.missing_implementations.map(api => ({
        endpoint: api.endpoint,
        suggested_location: `${api.suggested.controller}::${api.suggested.method}()`
      }))
    });
  }

  // 建议3: 待验证的API
  const pendingAPIs = comparison.details.filter(d => d.status.includes("⚠️"));
  if (pendingAPIs.length > 0) {
    recommendations.push({
      priority: "🟢 低",
      category: "待验证",
      count: pendingAPIs.length,
      description: `有 ${pendingAPIs.length} 个API需要验证功能是否正常`,
      items: pendingAPIs.map(api => ({
        endpoint: api.endpoint,
        issue: api.notes
      }))
    });
  }

  comparison.recommendations = recommendations;
}

/**
 * 生成Markdown报告
 */
function generateMarkdownReport(comparison) {
  let md = `# Providence API 比对报告\n\n`;
  md += `生成时间: ${new Date(comparison.timestamp).toLocaleString('zh-CN')}\n\n`;

  md += `## 📊 统计概览\n\n`;
  md += `| 指标 | 数量 |\n`;
  md += `|------|------|\n`;
  md += `| 前端API总数 | ${comparison.summary.total_frontend_apis} |\n`;
  md += `| 已映射 | ${comparison.summary.mapped_apis} |\n`;
  md += `| 已实现 | ${comparison.summary.implemented_apis} ✅ |\n`;
  md += `| 报错 | ${comparison.summary.error_apis} ❌ |\n`;
  md += `| 缺失 | ${comparison.summary.missing_apis} ⚠️ |\n\n`;

  md += `## 🎯 完成度\n\n`;
  const completionRate = ((comparison.summary.implemented_apis / comparison.summary.total_frontend_apis) * 100).toFixed(1);
  md += `**${completionRate}%** (${comparison.summary.implemented_apis}/${comparison.summary.total_frontend_apis})\n\n`;

  md += `## 📋 详细清单\n\n`;
  md += `| 端点 | 方法 | 状态 | 后端位置 | 备注 |\n`;
  md += `|------|------|------|----------|------|\n`;

  for (const detail of comparison.details) {
    md += `| \`${detail.endpoint}\` | ${detail.method} | ${detail.status} | ${detail.backend_file || '-'} | ${detail.notes || '-'} |\n`;
  }

  md += `\n## 💡 优化建议\n\n`;

  for (const rec of comparison.recommendations) {
    md += `### ${rec.priority} ${rec.category}\n\n`;
    md += `${rec.description}\n\n`;

    for (const item of rec.items.slice(0, 10)) {
      md += `- \`${item.endpoint}\`: ${item.issue || item.suggested_location}\n`;
    }

    if (rec.items.length > 10) {
      md += `\n*...还有 ${rec.items.length - 10} 项*\n`;
    }

    md += `\n`;
  }

  md += `## 🔧 后续行动\n\n`;
  md += `1. 优先修复 ${comparison.summary.error_apis} 个报错API\n`;
  md += `2. 开发 ${comparison.summary.missing_apis} 个缺失API\n`;
  md += `3. 测试验证所有已实现API\n`;
  md += `4. 更新API文档\n\n`;

  return md;
}

/**
 * 主函数
 */
function main() {
  console.log("🔍 Providence API Comparator 启动中...\n");

  // 比对API
  const comparison = compareAPIs();

  // 保存JSON结果
  const outputDir = path.dirname(CONFIG.OUTPUT);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(CONFIG.OUTPUT, JSON.stringify(comparison, null, 2), "utf8");

  // 生成Markdown报告
  const mdReport = generateMarkdownReport(comparison);
  const mdPath = CONFIG.OUTPUT.replace('.json', '.md');
  fs.writeFileSync(mdPath, mdReport, "utf8");

  console.log("=".repeat(60));
  console.log("✅ 比对完成!");
  console.log("=".repeat(60));
  console.log(`📊 前端API总数: ${comparison.summary.total_frontend_apis}`);
  console.log(`✅ 已实现: ${comparison.summary.implemented_apis}`);
  console.log(`❌ 报错: ${comparison.summary.error_apis}`);
  console.log(`⚠️  缺失: ${comparison.summary.missing_apis}`);
  console.log(`📈 完成度: ${((comparison.summary.implemented_apis / comparison.summary.total_frontend_apis) * 100).toFixed(1)}%`);
  console.log("=".repeat(60));
  console.log(`\n📄 JSON输出: ${CONFIG.OUTPUT}`);
  console.log(`📝 Markdown报告: ${mdPath}\n`);

  // 显示优先级建议
  if (comparison.recommendations.length > 0) {
    console.log("💡 优化建议:\n");
    for (const rec of comparison.recommendations) {
      console.log(`${rec.priority} ${rec.category}: ${rec.description}`);
    }
    console.log("");
  }
}

// 运行
main();
