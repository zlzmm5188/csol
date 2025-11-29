#!/bin/bash
set -e

ROOT="/www/wwwroot/4kp3l0iq.top"
cd "$ROOT" || exit 1

TS=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$ROOT/js-final-fix-backup-$TS"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " 🔧 Providence 前端一键修复脚本 v1.0"
echo "   目标: 停止错误的“请先登录→强制跳转登录页”行为"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "📂 备份目录: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# 需要重点保护的文件
PROTECT_FILES=(
  "error-interceptor.js"
  "dist/error-interceptor.js"
  "profile.js"
  "dist/profile.js"
)

echo "① 备份关键 JS 文件..."
for f in "${PROTECT_FILES[@]}"; do
  if [ -f "$f" ]; then
    echo "   • 备份 $f → $BACKUP_DIR/"
    cp "$f" "$BACKUP_DIR"/
  fi
done

echo
echo "② 修正全局错误拦截逻辑（error-interceptor.js）..."
for f in error-interceptor.js dist/error-interceptor.js; do
  if [ -f "$f" ]; then
    echo "   • 处理 $f"

    # 把 “data.code === 401 || data.msg === '请先登录'” 改成只看 code === 401
    sed -i.bak "s/data.code && (data.code === 401 || data.msg === '请先登录')/data.code && data.code === 401/g" "$f"

    # 顺手把中文变体 “請先登入” 也干掉
    sed -i.bak "s/data.code && (data.code === 401 || data.msg === '請先登入')/data.code && data.code === 401/g" "$f"
  fi
done

echo
echo "③ 禁用 profile.js 里对“请先登录”的误判..."

for f in profile.js dist/profile.js; do
  if [ -f "$f" ]; then
    echo "   • 处理 $f"

    # 把 errorMsg.includes('请先登录') 改成永远 false（不再触发强制登录）
    sed -i.bak "s/errorMsg\.includes('请先登录')/false \&\& errorMsg.includes('请先登录')/g" "$f"

    # 兼容双引号版本
    sed -i.bak 's/errorMsg\.includes("请先登录")/false \&\& errorMsg.includes("请先登录")/g' "$f"
  fi
done

echo
echo "✅ 修复完成！"
echo "   • 现在只有真正 code === 401 时才会触发全局“去登录”"
echo "   • 各种 /api/user/index、/api/team/members、/api/ribao/info 再返回“请先登录”也不会把你整页踢出去"
echo
echo "📦 如需回滚，可查看备份目录: $BACKUP_DIR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
