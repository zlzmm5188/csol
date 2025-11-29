# Providence API 映射与管理系统

## 📦 系统概述

这套工具用于自动化管理前后端API对接,包括:
- API扫描器: 自动扫描前端代码中的所有API调用
- API比对器: 比对前端调用与后端实现
- API生成器: 自动生成缺失的后端API模板

## 🗂️ 文件结构

\`\`\`
providence/
├── docs/
│   ├── api-mapping.json          # API映射清单(手工维护)
│   ├── api-scan-result.json      # 扫描结果(自动生成)
│   ├── api-scan-result.md        # 扫描报告(自动生成)
│   ├── api-comparison.json       # 比对结果(自动生成)
│   ├── api-comparison.md         # 比对报告(自动生成)
│   └── generated-apis/           # 生成的API模板(自动生成)
└── tools/
    ├── api-scanner.js            # API扫描工具
    ├── api-comparator.js         # API比对工具
    └── api-generator.js          # API生成工具
\`\`\`

## 🚀 快速开始

### 步骤1: 安装Node.js环境

确保服务器上已安装Node.js 14+:

\`\`\`bash
node --version
\`\`\`

### 步骤2: 扫描前端API

\`\`\`bash
cd /www/wwwroot/f.abcmall.one/providence/tools
node api-scanner.js
\`\`\`

输出:
- \`../docs/api-scan-result.json\` - 扫描结果JSON
- \`../docs/api-scan-result.md\` - 扫描报告Markdown

### 步骤3: 比对前后端

\`\`\`bash
node api-comparator.js
\`\`\`

输出:
- \`../docs/api-comparison.json\` - 比对结果JSON
- \`../docs/api-comparison.md\` - 比对报告Markdown

### 步骤4: 生成缺失API

\`\`\`bash
node api-generator.js
\`\`\`

输出:
- \`../docs/generated-apis/*.php\` - PHP控制器模板
- \`../docs/generated-apis/*.md\` - API文档模板

## 📊 API映射清单说明

\`api-mapping.json\` 是核心文件,用于记录所有API的对接状态。

### 状态标记

- ✅ **已对接**: API已实现且验证可用
- ⚠️ **待验证**: API已实现但需要测试
- ❌ **有错误**: API存在bug或返回错误
- 🔧 **开发中**: API正在开发
- ⛔ **未实现**: API缺失,需要开发

### 更新映射清单

每次开发新API或修复bug后,更新 \`api-mapping.json\`:

\`\`\`json
{
  "module": "模块名",
  "frontend_file": "/文件路径.js",
  "method": "GET/POST",
  "endpoint": "/api/路径",
  "backend_file": "Controller.php::method()",
  "status": "✅ 已对接",
  "notes": "备注说明"
}
\`\`\`

## 🔧 工具详细说明

### api-scanner.js

**功能**: 扫描前端代码,提取所有API调用

**支持的调用方式**:
- \`fetch(url)\`
- \`axios.get/post(url)\`
- \`apiRequest(url)\`
- \`$.ajax({url})\`

**排除目录**:
- node_modules
- .git
- dist/build
- docs/tools

**扫描文件类型**:
- .js/.jsx/.ts/.tsx
- .vue
- .html

### api-comparator.js

**功能**: 比对前端API调用与后端实现

**比对逻辑**:
1. 读取 \`api-scan-result.json\`
2. 读取 \`api-mapping.json\`
3. 扫描后端控制器文件
4. 生成比对报告

**输出信息**:
- 总API数量
- 已实现数量
- 错误数量
- 缺失数量
- 完成度百分比
- 优化建议

### api-generator.js

**功能**: 为缺失的API生成模板代码

**生成内容**:
- PHP控制器类
- 方法签名
- 认证逻辑
- 错误处理
- TODO注释
- API文档

**生成的模板包含**:
- 用户认证
- Try-Catch错误处理
- 统一的返回格式
- 详细的注释说明

## 📈 工作流程

### 日常开发流程

1. **前端开发**: 在前端调用新API
2. **运行扫描器**: \`node api-scanner.js\`
3. **运行比对器**: \`node api-comparator.js\`
4. **查看报告**: 打开 \`api-comparison.md\`
5. **实现API**: 根据报告开发缺失的API
6. **更新映射**: 更新 \`api-mapping.json\`
7. **测试验证**: 测试API功能
8. **再次比对**: 确认所有API已实现

### 新项目对接流程

1. **扫描旧前台**: \`node api-scanner.js /path/to/old/frontend\`
2. **扫描后端**: \`node api-comparator.js\`
3. **生成模板**: \`node api-generator.js\`
4. **批量实现**: 根据模板实现所有API
5. **批量测试**: 测试所有接口
6. **更新文档**: 完善API文档

## 🎯 最佳实践

### 1. 定期扫描

建议每周或每次大更新后运行一次完整扫描:

\`\`\`bash
cd /www/wwwroot/f.abcmall.one/providence/tools
node api-scanner.js && node api-comparator.js
\`\`\`

### 2. 保持映射清单更新

每次开发新功能后,立即更新 \`api-mapping.json\`

### 3. 使用状态标记

严格使用状态标记,便于追踪开发进度

### 4. 添加详细备注

在 \`notes\` 字段添加详细说明,记录:
- 字段变更
- 已知问题
- 特殊逻辑
- 依赖关系

### 5. 版本控制

将 \`api-mapping.json\` 纳入Git版本控制,便于团队协作

## 🔍 常见问题

### Q: 扫描器漏掉了某些API?

A: 检查是否使用了不支持的调用方式,可以手动添加到 \`api-mapping.json\`

### Q: 比对器报告不准确?

A: 确保 \`api-mapping.json\` 已更新,后端控制器路径正确

### Q: 生成的模板如何使用?

A:
1. 复制到后端对应目录
2. 实现TODO标记的业务逻辑
3. 测试功能
4. 更新映射清单

### Q: 如何添加自定义的API调用模式?

A: 编辑 \`api-scanner.js\` 的 \`API_PATTERNS\` 数组,添加新的正则表达式

## 📞 技术支持

如有问题,请查看:
- \`api-scan-result.md\` - 扫描详情
- \`api-comparison.md\` - 比对报告
- 生成的PHP模板中的注释

## 🔄 更新日志

### v1.0.0 (2025-10-27)
- ✅ 初始版本
- ✅ API扫描器
- ✅ API比对器
- ✅ API模板生成器
- ✅ 完整文档

## 📝 TODO

- [ ] 支持GraphQL接口扫描
- [ ] 自动化测试脚本
- [ ] API性能监控
- [ ] 在线可视化报告
- [ ] CI/CD集成

---

**Providence Team**
*让API对接更简单*
