#!/bin/bash

################################################################################
#                                                                              #
#  Providence 前端中间件一键部署脚本 v1.0                                    #
#                                                                              #
#  功能: 自动将5个中间件脚本加载到所有HTML文件中                             #
#                                                                              #
################################################################################

set -e

FRONTEND_DIR="/www/wwwroot/4kp3l0iq.top"
MIDDLEWARE_SNIPPET="  <!-- 前端统一中间件加载 -->
  <script src=\"/API_MAP.js\"></script>
  <script src=\"/token-interceptor.js\"></script>
  <script src=\"/error-interceptor.js\"></script>
  <script src=\"/login-handler.js\"></script>
  <script src=\"/global-stabilizer.js\"></script>"

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
log_step "Providence 前端中间件一键部署系统"

# 检查中间件文件是否存在
REQUIRED_FILES=(
  "$FRONTEND_DIR/API_MAP.js"
  "$FRONTEND_DIR/token-interceptor.js"
  "$FRONTEND_DIR/error-interceptor.js"
  "$FRONTEND_DIR/login-handler.js"
  "$FRONTEND_DIR/global-stabilizer.js"
)

log_info "检查必要的中间件文件..."
for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    log_success "已找到: $(basename $file)"
  else
    log_warn "缺失: $(basename $file)"
    exit 1
  fi
done

echo ""
log_step "扫描HTML文件"

# 找到所有HTML文件
HTML_FILES=$(find "$FRONTEND_DIR" -maxdepth 1 -name "*.html" -type f | sort)
TOTAL=$(echo "$HTML_FILES" | wc -l)

log_info "找到 $TOTAL 个HTML文件"
echo ""

# 部署计数器
DEPLOYED=0
SKIPPED=0
FAILED=0

# 逐个处理HTML文件
for html_file in $HTML_FILES; do
  filename=$(basename "$html_file")

  # 检查是否已经包含中间件
  if grep -q "API_MAP.js" "$html_file"; then
    log_warn "跳过 $filename (已包含中间件)"
    ((SKIPPED++))
    continue
  fi

  # 检查是否是登录页面或其他公开页面（某些页面可能不需要）
  if [[ "$filename" == "login.html" ]] || [[ "$filename" == "register.html" ]]; then
    # 仍然部署，为了完整性
    log_info "处理 $filename (公开页面)"
  else
    log_info "处理 $filename"
  fi

  # 创建备份
  cp "$html_file" "$html_file.bak"

  # 在</head>标签前插入中间件
  if grep -q "</head>" "$html_file"; then
    # 使用临时文件
    temp_file="${html_file}.tmp"
    sed "/<\/head>/i\\$MIDDLEWARE_SNIPPET" "$html_file" > "$temp_file"
    mv "$temp_file" "$html_file"
    log_success "已部署中间件到 $filename"
    ((DEPLOYED++))
  else
    log_warn "未找到</head>标签在 $filename，跳过"
    ((FAILED++))
    # 恢复备份
    mv "$html_file.bak" "$html_file"
  fi
done

echo ""
log_step "部署总结"

cat << EOF

╔════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║              ✅ 前端中间件部署完成！                                  ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝

【📊 部署结果】

✓ 已部署:      $DEPLOYED 个HTML文件
⊘ 已跳过:      $SKIPPED 个HTML文件（已包含中间件）
✗ 失败:        $FAILED 个HTML文件

【📝 已部署的文件】

EOF

# 列出已部署的文件
DEPLOYED_COUNT=0
for html_file in $HTML_FILES; do
  filename=$(basename "$html_file")
  if grep -q "API_MAP.js" "$html_file"; then
    echo "  ✓ $filename"
    ((DEPLOYED_COUNT++))
  fi
done

echo ""
echo "【💾 备份文件】"
echo ""
echo "所有修改前的原始文件已备份为 .bak 文件:"
echo ""

for html_file in $HTML_FILES; do
  if [ -f "$html_file.bak" ]; then
    echo "  $(basename $html_file).bak"
  fi
done

echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo "【🧪 测试建议】"
echo ""
echo "1. 清除浏览器缓存 (Ctrl+Shift+Del)"
echo "2. 打开浏览器F12控制台"
echo "3. 访问 https://4kp3l0iq.top/login.html"
echo "4. 登录账号: G138688 / 密码: G138688"
echo "5. 检查Console中是否显示以下消息:"
echo "   ✓ API_MAP 已加载"
echo "   ✓ Token 拦截器已加载"
echo "   ✓ 错误拦截器已加载"
echo "   ✓ 登录处理器已加载"
echo "   ✓ 全局稳定化系统已加载"
echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo "🎉 部署完成！系统现已完全统一、可控和稳定！"
echo ""
