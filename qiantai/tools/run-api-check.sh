#!/bin/bash
# API接口自动化检查和修复 - 快速启动脚本

cd /www/wwwroot/copla/providence || exit

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     Providence API 自动化检查和修复系统                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查 Playwright（如果需要）
if [ "$1" = "--full" ] || [ "$1" = "-f" ]; then
    if ! command -v npx &> /dev/null || ! npx playwright --version &> /dev/null; then
        echo "⚠️  警告: 未找到 Playwright，将跳过 F12 扫描和接口测试"
        echo "   安装命令: npm install playwright && npx playwright install"
        echo ""
        SKIP_PLAYWRIGHT=true
    fi
fi

# 运行检查
echo "🚀 开始运行..."
echo ""

if [ "$SKIP_PLAYWRIGHT" = "true" ]; then
    # 只运行检查和修复（不需要 Playwright）
    node tools/api-auto-fix.js
else
    # 运行完整检查
    node tools/api-master.js
fi

echo ""
echo "✅ 完成！"
echo ""
echo "📄 报告位置:"
echo "   - docs/api-check-report.json"
echo "   - docs/f12-error-report.json (如果运行了 F12 扫描)"
echo "   - docs/api-test-report.json (如果运行了接口测试)"
echo "   - docs/missing-api-templates.md (如果有缺失接口)"
echo ""
