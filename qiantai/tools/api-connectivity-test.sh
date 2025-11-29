#!/bin/bash

# 前端接口连通性测试脚本
# 检查所有页面是否存在接口返回 code:-1 或接口 404

API_BASE="https://apis.copla.top"
REPORT_FILE="/www/wwwroot/copla/providence/docs/api-connectivity-test-report.json"
ERROR_LOG="/www/wwwroot/copla/providence/docs/api-connectivity-errors.log"

# 主要页面列表
PAGES=(
    "index.html"
    "login.html"
    "profile.html"
    "projects.html"
    "market.html"
    "recharge.html"
    "withdraw.html"
    "records.html"
    "ribao.html"
    "shop.html"
    "points-history.html"
    "vip-level.html"
    "set-pay-password.html"
    "my-investments.html"
    "invite-share.html"
    "bank-cards.html"
    "reset-password.html"
    "daily-checkin.html"
    "profit-calendar.html"
)

# 初始化报告
echo "{" > "$REPORT_FILE"
echo "  \"timestamp\": \"$(date -Iseconds)\"," >> "$REPORT_FILE"
echo "  \"summary\": {" >> "$REPORT_FILE"
echo "    \"totalPages\": ${#PAGES[@]}," >> "$REPORT_FILE"
echo "    \"testedPages\": 0," >> "$REPORT_FILE"
echo "    \"errors\": 0," >> "$REPORT_FILE"
echo "    \"warnings\": 0" >> "$REPORT_FILE"
echo "  }," >> "$REPORT_FILE"
echo "  \"errors\": [" >> "$REPORT_FILE"

ERROR_COUNT=0
WARNING_COUNT=0
TESTED_COUNT=0

echo "🚀 开始前端接口连通性测试..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 从HTML文件中提取API接口
extract_apis_from_file() {
    local file="$1"
    local apis=()

    # 提取所有 /index.php/ 开头的API路径（使用grep -oP或多种方式）
    grep -oE '/index\.php/[^"'"'"'`\s?&]+' "$file" 2>/dev/null | sort -u | while read -r api; do
        # 清理路径（移除参数、引号等）
        clean_api=$(echo "$api" | sed 's/[?&].*//' | sed 's/[^a-zA-Z0-9\/_\-]//g')
        if [[ -n "$clean_api" ]] && [[ "$clean_api" == *"/index.php/"* ]]; then
            # 移除 /index.php/ 前缀，只保留路径部分
            api_path=$(echo "$clean_api" | sed 's|.*/index\.php/||')
            if [[ -n "$api_path" ]]; then
                echo "$api_path"
            fi
        fi
    done
}

# 测试单个API接口
test_api() {
    local api_path="$1"
    local full_url="${API_BASE}/${api_path}"

    # 跳过一些不需要测试的接口
    if [[ "$api_path" == *"chat/completions"* ]] || [[ "$api_path" == *"api-keys"* ]]; then
        return 0
    fi

    # 使用curl测试接口（GET请求，带超时）
    local response=$(curl -s -w "\n%{http_code}" --max-time 10 "$full_url" 2>/dev/null)
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')

    # 检查HTTP状态码
    if [[ "$http_code" == "404" ]]; then
        echo "    {\"api\": \"$api_path\", \"url\": \"$full_url\", \"error\": \"404 Not Found\", \"code\": null, \"msg\": null}," >> "$REPORT_FILE"
        echo "❌ 404: $api_path" >> "$ERROR_LOG"
        return 1
    fi

    # 尝试解析JSON响应
    if echo "$body" | grep -q "code"; then
        local code=$(echo "$body" | grep -oE '"code"\s*:\s*-?[0-9]+' | head -1 | grep -oE '-?[0-9]+')
        local msg=$(echo "$body" | grep -oE '"msg"\s*:\s*"[^"]*"' | head -1 | sed 's/"msg"\s*:\s*"//;s/"$//')

        if [[ "$code" == "-1" ]]; then
            echo "    {\"api\": \"$api_path\", \"url\": \"$full_url\", \"error\": \"API返回code:-1\", \"code\": $code, \"msg\": \"$msg\"}," >> "$REPORT_FILE"
            echo "❌ code:-1: $api_path - $msg" >> "$ERROR_LOG"
            return 1
        fi
    fi

    return 0
}

# 测试每个页面
for page in "${PAGES[@]}"; do
    page_path="/www/wwwroot/copla/providence/$page"

    if [[ ! -f "$page_path" ]]; then
        echo "⚠️  跳过: $page (文件不存在)"
        continue
    fi

    echo "🔍 测试页面: $page"
    TESTED_COUNT=$((TESTED_COUNT + 1))

    # 提取该页面的所有API接口
    apis=$(extract_apis_from_file "$page_path")

    if [[ -z "$apis" ]]; then
        echo "   ⚠️  未发现API调用"
        WARNING_COUNT=$((WARNING_COUNT + 1))
        continue
    fi

    page_errors=0
    api_count=0

    while IFS= read -r api; do
        [[ -z "$api" ]] && continue
        api_count=$((api_count + 1))

        # 测试API
        if ! test_api "$api"; then
            page_errors=$((page_errors + 1))
            ERROR_COUNT=$((ERROR_COUNT + 1))
        fi
    done <<< "$apis"

    if [[ $page_errors -eq 0 ]]; then
        echo "   ✅ 通过 ($api_count 个API)"
    else
        echo "   ❌ 发现 $page_errors 个错误 ($api_count 个API)"
    fi
done

# 完成报告
sed -i '$ s/,$//' "$REPORT_FILE"  # 移除最后一个逗号
echo "  ]," >> "$REPORT_FILE"
echo "  \"warnings\": $WARNING_COUNT" >> "$REPORT_FILE"
echo "}" >> "$REPORT_FILE"

# 输出摘要
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 测试结果摘要"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "总页面数: ${#PAGES[@]}"
echo "已测试: $TESTED_COUNT"
echo "❌ 错误: $ERROR_COUNT"
echo "⚠️  警告: $WARNING_COUNT"
echo ""
echo "📄 详细报告: $REPORT_FILE"
echo "📄 错误日志: $ERROR_LOG"

if [[ $ERROR_COUNT -gt 0 ]]; then
    echo ""
    echo "❌ 发现错误的接口:"
    cat "$ERROR_LOG" 2>/dev/null | head -20
fi

echo ""
echo "✅ 接口连通性测试完成！"
