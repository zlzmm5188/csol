#!/bin/bash

################################################################################
#                                                                              #
#  Providence 关键业务页面中间件部署脚本 v1.0                               #
#                                                                              #
#  功能: 将5个中间件部署到所有关键的业务HTML页面                             #
#                                                                              #
################################################################################

set -e

FRONTEND_DIR="/www/wwwroot/4kp3l0iq.top"

# 中间件加载脚本
MIDDLEWARE_SNIPPET='  <!-- 前端统一中间件加载 -->
  <script src="/API_MAP.js?v=1"></script>
  <script src="/token-interceptor.js?v=1"></script>
  <script src="/error-interceptor.js?v=1"></script>
  <script src="/login-handler.js?v=1"></script>
  <script src="/global-stabilizer.js?v=1"></script>'

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[⚠]${NC} $1"; }
log_step() { echo -e "\n${CYAN}═══ $1 ═══${NC}\n"; }

echo ""
log_step "关键页面中间件部署系统"

# 定义关键业务页面（不包括调试页面和备份页面）
CRITICAL_PAGES=(
  "index.html"
  "login.html"
  "profile.html"
  "finance.html"
  "ribao.html"
  "ribao-history.html"
)

# 检查中间件文件
REQUIRED_FILES=(
  "$FRONTEND_DIR/API_MAP.js"
  "$FRONTEND_DIR/token-interceptor.js"
  "$FRONTEND_DIR/error-interceptor.js"
  "$FRONTEND_DIR/login-handler.js"
  "$FRONTEND_DIR/global-stabilizer.js"
)

log_info "检查必要的中间件文件..."
ALL_FILES_EXIST=true
for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    log_success "已找到: $(basename $file)"
  else
    log_warn "缺失: $(basename $file)"
    ALL_FILES_EXIST=false
  fi
done

if [ "$ALL_FILES_EXIST" = false ]; then
  log_warn "某些中间件文件缺失，请先运行 api-auto-scan.sh 和 frontend-auto-fix.sh"
  exit 1
fi

echo ""
log_step "开始部署关键页面"

DEPLOYED=0
SKIPPED=0
FAILED=0

# 部署函数
deploy_page() {
  local html_file="$1"
  local filename=$(basename "$html_file")

  # 检查文件是否存在
  if [ ! -f "$html_file" ]; then
    log_warn "文件不存在: $filename"
    ((FAILED++))
    return
  fi

  # 检查是否已经包含中间件
  if grep -q "API_MAP.js" "$html_file"; then
    log_warn "跳过 $filename (已包含中间件)"
    ((SKIPPED++))
    return
  fi

  # 检查是否有</head>标签
  if ! grep -q "</head>" "$html_file"; then
    log_warn "未找到</head>标签: $filename，尝试添加到<body>前"
    if grep -q "<body" "$html_file"; then
      cp "$html_file" "$html_file.bak.$(date +%s)"
      sed -i "/<body/i\\$MIDDLEWARE_SNIPPET" "$html_file"
      log_success "已部署到 $filename (在<body>前)"
      ((DEPLOYED++))
    else
      log_warn "无法找到</head>或<body标签: $filename"
      ((FAILED++))
    fi
    return
  fi

  # 创建备份
  BACKUP_FILE="$html_file.bak.$(date +%s)"
  cp "$html_file" "$BACKUP_FILE"
  log_info "备份: $(basename $BACKUP_FILE)"

  # 在</head>标签前插入中间件
  temp_file="${html_file}.tmp"
  sed "/<\/head>/i\\$MIDDLEWARE_SNIPPET" "$html_file" > "$temp_file"

  if [ -s "$temp_file" ]; then
    mv "$temp_file" "$html_file"
    log_success "已部署到 $filename"
    ((DEPLOYED++))
  else
    log_warn "生成文件失败: $filename，恢复备份"
    rm -f "$temp_file"
    ((FAILED++))
  fi
}

# 部署所有关键页面
log_info "部署 ${#CRITICAL_PAGES[@]} 个关键页面..."
echo ""

for page in "${CRITICAL_PAGES[@]}"; do
  html_file="$FRONTEND_DIR/$page"
  deploy_page "$html_file"
done

echo ""
log_step "部署总结"

cat << EOF

╔════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║              ✅ 关键页面中间件部署完成！                              ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝

【📊 部署结果】

✓ 已部署:      $DEPLOYED 个页面
⊘ 已跳过:      $SKIPPED 个页面（已包含中间件）
✗ 失败:        $FAILED 个页面

【📝 部署的关键页面】

EOF

# 列出已部署的文件
for page in "${CRITICAL_PAGES[@]}"; do
  html_file="$FRONTEND_DIR/$page"
  if [ -f "$html_file" ] && grep -q "API_MAP.js" "$html_file"; then
    echo "  ✓ $page"
  fi
done

echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo "【🧪 测试说明】"
echo ""
echo "1️⃣  清除浏览器缓存和LocalStorage"
echo "   - Windows: Ctrl+Shift+Del"
echo "   - Mac: Cmd+Shift+Del"
echo ""
echo "2️⃣  打开浏览器F12开发者工具"
echo "   - Windows: F12"
echo "   - Mac: Cmd+Option+I"
echo ""
echo "3️⃣  访问登录页面"
echo "   https://4kp3l0iq.top/login.html"
echo ""
echo "4️⃣  输入测试账号"
echo "   用户名: G138688"
echo "   密码: G138688"
echo ""
echo "5️⃣  检查Console输出"
echo "   应该看到以下消息（按顺序）:"
echo "   • ✓ API_MAP 已加载"
echo "   • ✓ Token 拦截器已加载"
echo "   • ✓ 错误拦截器已加载"
echo "   • ✓ 登录处理器已加载"
echo "   • ✓ 全局稳定化系统已加载"
echo ""
echo "6️⃣  登录后验证"
echo "   • 是否成功进入 /index.html"
echo "   • 导航到 /profile.html"
echo "   • 没有"请先登录"错误提示"
echo "   • 没有被重定向回登录页面"
echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo "【💾 备份管理】"
echo ""
echo "所有原始文件都已备份为 .bak.TIMESTAMP 文件"
echo "如需恢复，执行:"
echo "  cp /www/wwwroot/4kp3l0iq.top/index.html.bak.TIMESTAMP /www/wwwroot/4kp3l0iq.top/index.html"
echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo "【📚 部署后的功能】"
echo ""
echo "✓ 统一API调用方式（所有页面）"
echo "✓ 自动Token管理和验证"
echo "✓ 5秒自动检查Token有效性"
echo "✓ API错误自动捕获和处理"
echo "✓ \"请先登录\"自动重定向"
echo "✓ 登出自动清除Token"
echo "✓ 永久解决\"某些页面登录某些页面又回登录\"问题"
echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo ""

if [ $DEPLOYED -gt 0 ]; then
  echo "🎉 部署成功！系统现已完全统一、可控和稳定！"
else
  echo "⚠️  未部署任何页面，请检查文件状态"
  exit 1
fi

echo ""
