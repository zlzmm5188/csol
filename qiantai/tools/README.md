# API 接口自动化检查和修复工具

## 📋 功能列表

### ✅ 已实现功能

1. **自动检查前端调用的接口是否错误**
   - 扫描所有 JS 和 HTML 文件中的 API 调用
   - 对比后端路由定义
   - 识别路径错误、缺失接口等问题

2. **自动修复错误接口**
   - 自动修正路径错误
   - 自动添加缺失的 `/index.php/` 前缀
   - 统一 API 调用格式

3. **自动对比前后端接口**
   - 找出前端调用但后端未定义的接口
   - 找出后端定义但前端未使用的接口
   - 识别路径不匹配的问题

4. **自动扫描页面 F12 报错**
   - 使用 Playwright 扫描页面控制台错误
   - 检测 JavaScript 错误
   - 检测网络请求失败
   - 自动找出 "API接口未定义" 错误

5. **自动生成缺失接口模板**
   - 为缺失的接口生成 PHP 模板文件
   - 包含基本结构和注释

6. **自动格式化 API 调用**
   - 统一 API 路径格式
   - 统一错误处理方式
   - 优化代码可读性

7. **自动运行接口测试**
   - 使用 Playwright 测试所有接口
   - 生成测试报告
   - 记录成功/失败状态

## 🚀 快速开始

### 安装依赖

```bash
cd /www/wwwroot/copla/providence
npm install playwright
```

### 运行工具

#### 方式 1: 运行完整检查（推荐）

```bash
node tools/api-master.js
```

这将依次执行：
1. 自动检查和修复接口
2. 扫描 F12 错误
3. 运行接口测试

#### 方式 2: 单独运行各个工具

**检查和修复接口：**
```bash
node tools/api-auto-fix.js
```

**扫描 F12 错误：**
```bash
node tools/api-f12-scanner.js
```

**运行接口测试：**
```bash
node tools/api-test-runner.js
```

## 📊 输出报告

工具会在 `/www/wwwroot/copla/providence/docs/` 目录下生成以下报告：

1. **api-check-report.json** - 接口检查报告
   - 后端路由列表
   - 前端 API 调用列表
   - 问题统计（缺失、错误、未使用）

2. **f12-error-report.json** - F12 错误报告
   - 每个页面的控制台错误
   - JavaScript 错误
   - 网络请求失败
   - "API接口未定义" 错误列表

3. **api-test-report.json** - 接口测试报告
   - 每个接口的测试结果
   - 成功/失败状态
   - 响应状态码

4. **missing-api-templates.md** - 缺失接口模板
   - 自动生成的 PHP 接口模板
   - 可直接使用或修改

## 🔧 配置

编辑工具文件中的 `CONFIG` 对象来修改配置：

```javascript
const CONFIG = {
  frontendPath: '/www/wwwroot/copla/providence',
  backendPath: '/www/wwwroot/copla/providence-admin/api',
  apiBaseURL: 'https://apis.copla.top',
  apiPrefix: '/index.php/',
  backendRoutesFile: '/www/wwwroot/copla/providence-admin/api/index.php',
};
```

## 📝 使用示例

### 示例 1: 检查并修复所有接口错误

```bash
node tools/api-auto-fix.js
```

输出：
```
🚀 开始API接口自动化检查和修复...

📖 读取后端路由...
✅ 找到 84 个后端路由

🔍 扫描前端API调用...
✅ 找到 49 个前端API调用

🔎 对比前后端接口...

📊 问题统计:
  ❌ 缺失接口: 21 个
  ⚠️  路径错误: 4 个
  ℹ️  未使用接口: 19 个

🔧 开始自动修复...
✅ 修复了 12 处错误

✨ 格式化API调用...
✅ 格式化了 36 个文件

✅ 检查和修复完成！
```

### 示例 2: 扫描页面 F12 错误

```bash
node tools/api-f12-scanner.js
```

输出：
```
🔍 开始扫描页面 F12 错误...

扫描: index.html...
  ✅ 无错误

扫描: login.html...
  ⚠️  发现 2 个错误
  ❌ API接口未定义: 1 个

📄 错误报告已保存: docs/f12-error-report.json
```

## 🎯 常见问题

### Q: 工具报错 "require is not defined"
A: 确保项目使用 ES Module 格式（package.json 中有 `"type": "module"`）

### Q: Playwright 测试失败
A: 确保已安装 Playwright 浏览器：
```bash
npx playwright install
```

### Q: 如何只检查特定文件？
A: 修改工具中的文件扫描逻辑，添加文件过滤条件

### Q: 如何添加自定义检查规则？
A: 在 `api-auto-fix.js` 中的 `compareAPIs` 函数中添加自定义逻辑

## 📚 相关文档

- [API接口完整文档](../docs/API接口完整文档.md)
- [前后台对接检查报告](../../providence-admin/📊前后台对接检查报告.md)

## 🔄 更新日志

### v1.0 (2025-01-17)
- ✅ 初始版本
- ✅ 实现所有核心功能
- ✅ 支持自动检查和修复
- ✅ 支持 F12 错误扫描
- ✅ 支持接口测试

## 📞 支持

如有问题或建议，请联系开发团队。
