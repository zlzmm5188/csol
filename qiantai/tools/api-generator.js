#!/usr/bin/env node
/**
 * Providence API Template Generator
 * 为缺失的API自动生成后端模板代码
 *
 * 运行方式:
 * node api-generator.js
 */

import fs from "fs";
import path from "path";

const CONFIG = {
  COMPARISON: "/www/wwwroot/f.abcmall.one/providence/docs/api-comparison.json",
  BACKEND_ROOT: "/www/wwwroot/gmo/gmo.com/app/index.php/controller",
  OUTPUT_DIR: "/www/wwwroot/f.abcmall.one/providence/docs/generated-apis"
};

/**
 * 生成PHP API模板
 */
function generatePHPTemplate(endpoint, method, suggested) {
  const controllerName = suggested.controller.replace('.php', '');
  const methodName = suggested.method;

  return `<?php
namespace app\\api\\controller;

use think\\Request;
use think\\facade\\Db;

/**
 * ${controllerName} 控制器
 * 自动生成 by Providence API Generator
 */
class ${controllerName} extends ApiBase
{
    /**
     * ${methodName} - ${endpoint}
     *
     * @param Request \$r
     * @return \\think\\response\\Json
     */
    public function ${methodName}(Request \$r)
    {
        // 验证用户登录
        \$verify = \$this->is_verify(\$r);
        if (\$verify == 501) {
            return json(['code' => \$verify, 'msg' => '未登录'], \$verify);
        }

        try {
            // TODO: 实现业务逻辑

            // 示例: 获取用户ID
            \$userId = \$this->user['id'];

            // 示例: 数据库查询
            // \$data = Db::table('table_name')
            //     ->where('user_id', \$userId)
            //     ->select();

            // 返回成功
            return json([
                'code' => 200,
                'msg' => '成功',
                'data' => [
                    // TODO: 返回数据
                ]
            ]);

        } catch (\\Exception \$e) {
            // 错误处理
            return json([
                'code' => 500,
                'msg' => '服务器错误: ' . \$e->getMessage()
            ], 500);
        }
    }
}
`;
}

/**
 * 生成文档
 */
function generateDocumentation(endpoint, method, suggested) {
  return `# API 文档: ${endpoint}

## 基本信息

- **端点**: \`${endpoint}\`
- **方法**: \`${method}\`
- **建议位置**: \`${suggested.controller}::${suggested.method}()\`
- **需要认证**: ✅ 是

## 请求参数

\`\`\`json
{
  // TODO: 定义请求参数
  "param1": "value1",
  "param2": "value2"
}
\`\`\`

## 响应格式

### 成功响应 (200)

\`\`\`json
{
  "code": 200,
  "msg": "成功",
  "data": {
    // TODO: 定义响应数据结构
  }
}
\`\`\`

### 错误响应

\`\`\`json
{
  "code": 501,
  "msg": "未登录"
}
\`\`\`

\`\`\`json
{
  "code": 500,
  "msg": "服务器错误"
}
\`\`\`

## 业务逻辑

TODO: 描述业务逻辑

## 数据库表

TODO: 列出涉及的数据库表

## 注意事项

TODO: 列出注意事项和限制

## 测试用例

\`\`\`bash
curl -X ${method} \\
  https://api.4kp3l0iq.top/api{endpoint} \\
  -H "Content-Type: application/json" \\
  -H "token: YOUR_TOKEN" \\
  -d '{
    // TODO: 测试数据
  }'
\`\`\`
`;
}

/**
 * 主函数
 */
function main() {
  console.log("🔧 Providence API Generator 启动中...\n");

  // 读取比对结果
  if (!fs.existsSync(CONFIG.COMPARISON)) {
    console.error("❌ 请先运行 api-comparator.js 生成比对结果");
    return;
  }

  const comparison = JSON.parse(fs.readFileSync(CONFIG.COMPARISON, 'utf8'));

  // 创建输出目录
  if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
    fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
  }

  let generated = 0;

  // 为缺失的API生成模板
  for (const missing of comparison.missing_implementations || []) {
    const { endpoint, method, suggested } = missing;

    // 生成PHP模板
    const phpCode = generatePHPTemplate(endpoint, method, suggested);
    const phpFile = path.join(CONFIG.OUTPUT_DIR, suggested.controller);
    fs.writeFileSync(phpFile, phpCode, 'utf8');

    // 生成文档
    const doc = generateDocumentation(endpoint, method, suggested);
    const docFile = path.join(CONFIG.OUTPUT_DIR, \`\${suggested.method}.md\`);
    fs.writeFileSync(docFile, doc, 'utf8');

    console.log(\`✅ 生成: \${suggested.controller}::\${suggested.method}()\`);
    generated++;
  }

  console.log(\`\\n\${"=".repeat(60)}\`);
  console.log(\`✅ 生成完成! 共生成 \${generated} 个API模板\`);
  console.log(\`\${"=".repeat(60)}\`);
  console.log(\`\\n📁 输出目录: \${CONFIG.OUTPUT_DIR}\`);
  console.log(\`\\n💡 下一步:\`);
  console.log(\`   1. 查看生成的PHP文件\`);
  console.log(\`   2. 实现TODO标记的业务逻辑\`);
  console.log(\`   3. 将文件复制到后端对应目录\`);
  console.log(\`   4. 测试API功能\`);
  console.log("");
}

// 运行
main();
