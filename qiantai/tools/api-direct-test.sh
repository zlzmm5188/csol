#!/bin/bash

# 直接测试API接口连通性
# 检查所有接口是否存在 code:-1 或 404 错误

API_BASE="https://apis.copla.top"
REPORT_FILE="/www/wwwroot/copla/providence/docs/api-direct-test-report.json"
ERROR_LOG="/www/wwwroot/copla/providence/docs/api-direct-test-errors.log"

# 从后端路由文件中提取所有API路径
ROUTES_FILE="/www/wwwroot/copla/providence-admin/api/index.php"

> "$ERROR_LOG"
ERROR_COUNT=0
TESTED_COUNT=0
ALL_ERRORS=()

echo "🚀 开始直接测试API接口连通性..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 从路由文件中提取所有路由
extract_routes() {
    grep -E "'[^']+'\s*=>" "$ROUTES_FILE" 2>/dev/null | \
    sed "s/.*'\([^']*\)'.*/\1/" | \
    grep -v "^$" | \
    sort -u
}

# 测试单个API接口
test_api() {
    local api_path="$1"
    local full_url="${API_BASE}/index.php/${api_path}"

    # 跳过管理员接口（需要特殊权限）
    if [[ "$api_path" == admin/* ]]; then
        return 0
    fi

    TESTED_COUNT=$((TESTED_COUNT + 1))

    # 使用curl测试接口（GET请求，带超时）
    local response=$(curl -s -w "\n%{http_code}" --max-time 5 "$full_url" 2>/dev/null)
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')

    # 检查HTTP状态码
    if [[ "$http_code" == "404" ]]; then
        ALL_ERRORS+=("{\"api\":\"$api_path\",\"url\":\"$full_url\",\"error\":\"404 Not Found\",\"code\":null,\"msg\":null}")
        echo "❌ 404: $api_path" >> "$ERROR_LOG"
        echo "   ❌ 404: $api_path"
        ERROR_COUNT=$((ERROR_COUNT + 1))
        return 1
    fi

    # 尝试解析JSON响应
    if echo "$body" | grep -q '"code"'; then
        local code=$(echo "$body" | grep -oE '"code"\s*:\s*-?[0-9]+' | head -1 | grep -oE '-?[0-9]+')
        local msg=$(echo "$body" | grep -oE '"msg"\s*:\s*"[^"]*"' | head -1 | sed 's/"msg"\s*:\s*"//;s/"$//')

        if [[ "$code" == "-1" ]]; then
            # 检查是否是预期的错误（如未登录、参数缺失等）
            if [[ "$msg" == *"未登录"* ]] || \
               [[ "$msg" == *"token"* ]] || \
               [[ "$msg" == *"参数"* ]] || \
               [[ "$msg" == *"不能为空"* ]]; then
                # 这是预期的错误，不算作问题
                return 0
            fi

            ALL_ERRORS+=("{\"api\":\"$api_path\",\"url\":\"$full_url\",\"error\":\"API返回code:-1\",\"code\":$code,\"msg\":\"$msg\"}")
            echo "❌ code:-1: $api_path - $msg" >> "$ERROR_LOG"
            echo "   ❌ code:-1: $api_path - $msg"
            ERROR_COUNT=$((ERROR_COUNT + 1))
            return 1
        fi
    fi

    return 0
}

# 提取并测试所有路由
routes=$(extract_routes)
total_routes=$(echo "$routes" | wc -l)

echo "📋 发现 $total_routes 个API路由"
echo ""

while IFS= read -r route; do
    [[ -z "$route" ]] && continue
    test_api "$route"
done <<< "$routes"

# 生成JSON报告
echo "{" > "$REPORT_FILE"
echo "  \"timestamp\": \"$(date -Iseconds)\"," >> "$REPORT_FILE"
echo "  \"summary\": {" >> "$REPORT_FILE"
echo "    \"totalRoutes\": $total_routes," >> "$REPORT_FILE"
echo "    \"testedRoutes\": $TESTED_COUNT," >> "$REPORT_FILE"
echo "    \"errors\": $ERROR_COUNT" >> "$REPORT_FILE"
echo "  }," >> "$REPORT_FILE"
echo "  \"errors\": [" >> "$REPORT_FILE"

if [[ ${#ALL_ERRORS[@]} -gt 0 ]]; then
    for i in "${!ALL_ERRORS[@]}"; do
        if [[ $i -lt $((${#ALL_ERRORS[@]} - 1)) ]]; then
            echo "    ${ALL_ERRORS[$i]}," >> "$REPORT_FILE"
        else
            echo "    ${ALL_ERRORS[$i]}" >> "$REPORT_FILE"
        fi
    done
fi

echo "  ]" >> "$REPORT_FILE"
echo "}" >> "$REPORT_FILE"

# 输出摘要
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 测试结果摘要"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "总路由数: $total_routes"
echo "已测试: $TESTED_COUNT"
echo "❌ 错误: $ERROR_COUNT"
echo ""
echo "📄 详细报告: $REPORT_FILE"
echo "📄 错误日志: $ERROR_LOG"

if [[ $ERROR_COUNT -gt 0 ]]; then
    echo ""
    echo "❌ 发现错误的接口:"
    cat "$ERROR_LOG" 2>/dev/null | head -30
fi

echo ""
echo "✅ API接口连通性测试完成！"
