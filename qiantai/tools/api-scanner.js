#!/usr/bin/env node
/**
 * Providence API Scanner
 * 自动扫描前端代码中的API调用
 *
 * 运行方式:
 * node api-scanner.js
 *
 * 或添加参数扫描特定目录:
 * node api-scanner.js /www/wwwroot/f.abcmall.one/providence
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const CONFIG = {
  ROOT: process.argv[2] || "/www/wwwroot/f.abcmall.one/providence",
  OUTPUT: "/www/wwwroot/f.abcmall.one/providence/docs/api-scan-result.json",
  EXCLUDE_DIRS: ["node_modules", ".git", "dist", "build", "docs", "tools"],
  FILE_EXTENSIONS: [".js", ".vue", ".html", ".jsx", ".tsx", ".ts"]
};

// API调用正则表达式
const API_PATTERNS = [
  // fetch调用
  /fetch\s*\(\s*[`'"]([^`'"]+)[`'"]/g,
  /fetch\s*\(\s*API_BASE\s*\+\s*[`'"]([^`'"]+)[`'"]/g,

  // axios调用
  /axios\.(get|post|put|delete|patch)\s*\(\s*[`'"]([^`'"]+)[`'"]/g,
  /axios\.(get|post|put|delete|patch)\s*\(\s*API_BASE\s*\+\s*[`'"]([^`'"]+)[`'"]/g,
  /axios\s*\(\s*\{\s*url:\s*[`'"]([^`'"]+)[`'"]/g,

  // apiRequest调用 (自定义封装)
  /apiRequest\s*\(\s*[`'"]([^`'"]+)[`'"]/g,

  // $.ajax调用 (jQuery)
  /\$\.ajax\s*\(\s*\{\s*url:\s*[`'"]([^`'"]+)[`'"]/g,
  /\$\.(get|post)\s*\(\s*[`'"]([^`'"]+)[`'"]/g,
];

const results = [];
const apiEndpoints = new Set();
let totalFiles = 0;
let scannedFiles = 0;

/**
 * 扫描目录
 */
function scanDir(dir) {
  try {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // 跳过排除的目录
        if (CONFIG.EXCLUDE_DIRS.includes(file)) {
          continue;
        }
        scanDir(fullPath);
      } else if (CONFIG.FILE_EXTENSIONS.some(ext => file.endsWith(ext))) {
        totalFiles++;
        scanFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`❌ 扫描目录失败: ${dir}`, error.message);
  }
}

/**
 * 扫描单个文件
 */
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const relativePath = filePath.replace(CONFIG.ROOT, "");

    let foundAPIs = false;

    for (const pattern of API_PATTERNS) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);

      while ((match = regex.exec(content))) {
        foundAPIs = true;
        let endpoint = "";
        let method = "GET";

        // 根据不同的匹配模式提取信息
        if (match[2]) {
          // axios.get/post 或 fetch with API_BASE
          endpoint = match[2];
          method = match[1] ? match[1].toUpperCase() : "GET";
        } else if (match[1]) {
          // 其他模式
          endpoint = match[1];
        }

        // 清理endpoint
        endpoint = endpoint.trim();

        // 跳过变量和模板字符串
        if (endpoint.includes("${") || endpoint.includes("+ ") || endpoint.length < 3) {
          continue;
        }

        // 添加到结果
        const apiCall = {
          file: relativePath,
          endpoint: endpoint,
          method: method,
          line: getLineNumber(content, match.index)
        };

        results.push(apiCall);
        apiEndpoints.add(endpoint);
      }
    }

    if (foundAPIs) {
      scannedFiles++;
    }
  } catch (error) {
    console.error(`❌ 扫描文件失败: ${filePath}`, error.message);
  }
}

/**
 * 获取行号
 */
function getLineNumber(content, index) {
  return content.substring(0, index).split('\n').length;
}

/**
 * 分析结果
 */
function analyzeResults() {
  const analysis = {
    summary: {
      total_files_scanned: totalFiles,
      files_with_apis: scannedFiles,
      total_api_calls: results.length,
      unique_endpoints: apiEndpoints.size
    },
    endpoints: {},
    modules: {}
  };

  // 按endpoint分组
  for (const call of results) {
    if (!analysis.endpoints[call.endpoint]) {
      analysis.endpoints[call.endpoint] = {
        endpoint: call.endpoint,
        method: call.method,
        calls: []
      };
    }

    analysis.endpoints[call.endpoint].calls.push({
      file: call.file,
      line: call.line
    });
  }

  // 按模块分组 (根据文件名推测)
  for (const call of results) {
    const fileName = path.basename(call.file, path.extname(call.file));
    if (!analysis.modules[fileName]) {
      analysis.modules[fileName] = {
        file: call.file,
        apis: []
      };
    }

    analysis.modules[fileName].apis.push({
      endpoint: call.endpoint,
      method: call.method,
      line: call.line
    });
  }

  return analysis;
}

/**
 * 生成Markdown报告
 */
function generateMarkdownReport(analysis) {
  let md = `# Providence API 扫描报告\n\n`;
  md += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;

  md += `## 📊 扫描统计\n\n`;
  md += `- 总文件数: ${analysis.summary.total_files_scanned}\n`;
  md += `- 包含API的文件: ${analysis.summary.files_with_apis}\n`;
  md += `- API调用总数: ${analysis.summary.total_api_calls}\n`;
  md += `- 唯一API端点: ${analysis.summary.unique_endpoints}\n\n`;

  md += `## 🔗 API端点清单\n\n`;
  md += `| 端点 | 方法 | 调用次数 | 文件 |\n`;
  md += `|------|------|----------|------|\n`;

  for (const [endpoint, data] of Object.entries(analysis.endpoints)) {
    const files = data.calls.map(c => c.file).join(", ");
    md += `| \`${endpoint}\` | ${data.method} | ${data.calls.length} | ${files} |\n`;
  }

  md += `\n## 📁 按模块分组\n\n`;

  for (const [module, data] of Object.entries(analysis.modules)) {
    md += `### ${module}\n\n`;
    md += `文件: \`${data.file}\`\n\n`;
    md += `| 端点 | 方法 | 行号 |\n`;
    md += `|------|------|------|\n`;

    for (const api of data.apis) {
      md += `| \`${api.endpoint}\` | ${api.method} | ${api.line} |\n`;
    }

    md += `\n`;
  }

  return md;
}

/**
 * 主函数
 */
function main() {
  console.log("🔍 Providence API Scanner 启动中...");
  console.log(`📂 扫描目录: ${CONFIG.ROOT}`);
  console.log(`📤 输出文件: ${CONFIG.OUTPUT}\n`);

  const startTime = Date.now();

  // 扫描目录
  scanDir(CONFIG.ROOT);

  // 分析结果
  const analysis = analyzeResults();

  // 保存JSON结果
  const outputDir = path.dirname(CONFIG.OUTPUT);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(CONFIG.OUTPUT, JSON.stringify(analysis, null, 2), "utf8");

  // 生成Markdown报告
  const mdReport = generateMarkdownReport(analysis);
  const mdPath = CONFIG.OUTPUT.replace('.json', '.md');
  fs.writeFileSync(mdPath, mdReport, "utf8");

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\n" + "=".repeat(60));
  console.log("✅ 扫描完成!");
  console.log("=".repeat(60));
  console.log(`📊 总文件数: ${analysis.summary.total_files_scanned}`);
  console.log(`📁 包含API的文件: ${analysis.summary.files_with_apis}`);
  console.log(`🔗 API调用总数: ${analysis.summary.total_api_calls}`);
  console.log(`🎯 唯一API端点: ${analysis.summary.unique_endpoints}`);
  console.log(`⏱️  耗时: ${elapsed}秒`);
  console.log("=".repeat(60));
  console.log(`\n📄 JSON输出: ${CONFIG.OUTPUT}`);
  console.log(`📝 Markdown报告: ${mdPath}`);
  console.log("\n💡 提示: 使用以下命令比对后端接口:");
  console.log(`   node api-comparator.js\n`);
}

// 运行
main();
