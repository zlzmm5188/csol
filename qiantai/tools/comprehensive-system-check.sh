#!/bin/bash

################################################################################
#                                                                              #
#  Providence 全局系统诊断脚本 v2.0                                           #
#                                                                              #
#  功能清单:                                                                  #
#    ✓ 全局Token检查                                                         #
#    ✓ 权限接口检查                                                          #
#    ✓ 资金接口检查                                                          #
#    ✓ VIP接口检查                                                           #
#    ✓ 团队接口检查                                                          #
#    ✓ 充值接口检查                                                          #
#    ✓ 提现接口检查                                                          #
#    ✓ 风控接口检查                                                          #
#    ✓ 短信接口检查                                                          #
#    ✓ 登录流程自动诊断                                                      #
#    ✓ 后端路由自动匹配                                                      #
#    ✓ ThinkPHP防跳转自动分析                                                #
#                                                                              #
#  使用: bash comprehensive-system-check.sh                                   #
#                                                                              #
################################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 计数器
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; ((PASS_COUNT++)); }
log_error() { echo -e "${RED}[✗]${NC} $1"; ((FAIL_COUNT++)); }
log_warn() { echo -e "${YELLOW}[⚠]${NC} $1"; ((WARN_COUNT++)); }
log_title() { echo -e "\n${CYAN}═══ $1 ═══${NC}\n"; }

# 打印标题
print_header() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                        ║"
    echo "║           Providence 全局系统诊断脚本 v2.0                           ║"
    echo "║                                                                        ║"
    echo "║  功能: 全面诊断所有核心接口和业务流程                                ║"
    echo "║                                                                        ║"
    echo "╚════════════════════════════════════════════════════════════════════════╝"
    echo ""
}

# 获取Token
get_token() {
    log_info "获取有效Token..."
    LOGIN_RESPONSE=$(curl -s "http://127.0.0.1/api/auth/login" \
      -H "Host: api.4kp3l0iq.top" \
      -H "Content-Type: application/json" \
      -X POST \
      -d '{"username":"G138688","password":"G138688"}')
    
    TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('accessToken', ''))" 2>/dev/null || echo "")
    
    if [ -z "$TOKEN" ]; then
        log_error "获取Token失败"
        exit 1
    fi
    
    log_success "Token已获取"
}

# 测试接口
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    
    local response=$(curl -s -w "\n%{http_code}" "http://127.0.0.1${endpoint}" \
      -H "Host: api.4kp3l0iq.top" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -X "$method")
    
    local status=$(echo "$response" | tail -1)
    local body=$(echo "$response" | head -1)
    
    if [ "$status" = "200" ] || [ "$status" = "201" ]; then
        local code=$(echo "$body" | python3 -c "import sys, json; d=json.load(sys.stdin) if sys.stdin.read() else {}; print(d.get('code', 'N/A'))" 2>/dev/null || echo "N/A")
        log_success "$description (HTTP $status, code=$code)"
    elif [ "$status" = "401" ]; then
        log_error "$description (HTTP 401 - Token无效)"
    else
        log_warn "$description (HTTP $status)"
    fi
}

# 1. 全局Token检查
check_global_token() {
    log_title "1. 全局Token检查"
    
    log_info "测试Token的多种认证格式..."
    
    # Bearer格式
    local response=$(curl -s -w "%{http_code}" "http://127.0.0.1/api/user/info" \
      -H "Host: api.4kp3l0iq.top" \
      -H "Authorization: Bearer ${TOKEN}" \
      -X GET)
    local status=${response: -3}
    [ "$status" = "200" ] && log_success "Bearer格式有效" || log_error "Bearer格式无效"
    
    # 直接Token格式
    local response=$(curl -s -w "%{http_code}" "http://127.0.0.1/api/user/info" \
      -H "Host: api.4kp3l0iq.top" \
      -H "Authorization: ${TOKEN}" \
      -X GET)
    local status=${response: -3}
    [ "$status" = "200" ] && log_success "直接Token格式有效" || log_error "直接Token格式无效"
    
    # Token头格式
    local response=$(curl -s -w "%{http_code}" "http://127.0.0.1/api/user/info" \
      -H "Host: api.4kp3l0iq.top" \
      -H "Token: ${TOKEN}" \
      -X GET)
    local status=${response: -3}
    [ "$status" = "200" ] && log_success "Token头格式有效" || log_warn "Token头格式无效"
}

# 2. 权限接口检查
check_permission_api() {
    log_title "2. 权限接口检查"
    
    test_endpoint "GET" "/api/user/info" "用户信息接口"
    test_endpoint "GET" "/api/admin/roles" "角色列表"
    test_endpoint "GET" "/api/admin/permissions" "权限列表"
}

# 3. 资金接口检查
check_finance_api() {
    log_title "3. 资金接口检查"
    
    test_endpoint "GET" "/api/user/balance" "用户余额"
    test_endpoint "GET" "/api/user/wallet" "钱包信息"
    test_endpoint "GET" "/api/finance/transactions" "交易记录"
    test_endpoint "GET" "/api/finance/logs" "资金日志"
}

# 4. VIP接口检查
check_vip_api() {
    log_title "4. VIP接口检查"
    
    test_endpoint "GET" "/api/user/vip/level" "VIP等级"
    test_endpoint "GET" "/api/user/vip/progress" "VIP进度"
    test_endpoint "GET" "/api/admin/vip/config" "VIP配置"
}

# 5. 团队接口检查
check_team_api() {
    log_title "5. 团队接口检查"
    
    test_endpoint "GET" "/api/team/members" "团队成员"
    test_endpoint "GET" "/api/team/structure" "团队结构"
    test_endpoint "GET" "/api/team/rewards" "团队奖励"
    test_endpoint "GET" "/api/user/invite-code" "邀请码"
}

# 6. 充值接口检查
check_recharge_api() {
    log_title "6. 充值接口检查"
    
    test_endpoint "GET" "/api/recharge/methods" "充值方式"
    test_endpoint "GET" "/api/recharge/records" "充值记录"
    test_endpoint "POST" "/api/recharge/initiate" "发起充值"
}

# 7. 提现接口检查
check_withdraw_api() {
    log_title "7. 提现接口检查"
    
    test_endpoint "GET" "/api/withdraw/methods" "提现方式"
    test_endpoint "GET" "/api/withdraw/records" "提现记录"
    test_endpoint "POST" "/api/withdraw/initiate" "发起提现"
}

# 8. 风控接口检查
check_risk_control_api() {
    log_title "8. 风控接口检查"
    
    test_endpoint "GET" "/api/risk/score" "风险评分"
    test_endpoint "GET" "/api/risk/checks" "风控检查"
    test_endpoint "POST" "/api/risk/report" "风险上报"
}

# 9. 短信接口检查
check_sms_api() {
    log_title "9. 短信接口检查"
    
    test_endpoint "POST" "/api/sms/send" "发送短信"
    test_endpoint "POST" "/api/sms/verify" "验证短信"
    test_endpoint "GET" "/api/sms/records" "短信记录"
}

# 10. 登录流程自动诊断
check_login_flow() {
    log_title "10. 登录流程自动诊断"
    
    log_info "测试登录→Token→用户信息的完整流程..."
    
    # 登录
    local login_response=$(curl -s "http://127.0.0.1/api/auth/login" \
      -H "Host: api.4kp3l0iq.top" \
      -H "Content-Type: application/json" \
      -X POST \
      -d '{"username":"G138688","password":"G138688"}')
    
    local code=$(echo "$login_response" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('code', 'N/A'))" 2>/dev/null || echo "N/A")
    [ "$code" = "0" ] && log_success "登录接口正常" || log_error "登录接口异常"
    
    # 获取用户信息
    local user_response=$(curl -s "http://127.0.0.1/api/user/info" \
      -H "Host: api.4kp3l0iq.top" \
      -H "Authorization: Bearer ${TOKEN}" \
      -X GET)
    
    local username=$(echo "$user_response" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('data', {}).get('username', 'N/A'))" 2>/dev/null || echo "N/A")
    [ "$username" != "N/A" ] && log_success "用户信息获取正常 (username=$username)" || log_error "用户信息获取失败"
    
    # 检查是否有重定向
    local redirect_test=$(curl -s -L "http://127.0.0.1/api/auth/login" \
      -H "Host: api.4kp3l0iq.top" \
      -w "\n%{redirect_url}" \
      -X POST \
      -d '{"username":"G138688","password":"G138688"}' | tail -1)
    
    if [ -z "$redirect_test" ]; then
        log_success "登录无重定向（正常）"
    else
        log_warn "登录有重定向: $redirect_test"
    fi
}

# 11. 后端路由自动匹配
check_backend_routes() {
    log_title "11. 后端路由自动匹配"
    
    log_info "检查ThinkPHP路由配置..."
    
    # 检查路由文件
    if [ -f "/www/wwwroot/api.4kp3l0iq.top/app/admin/route/api.php" ]; then
        log_success "API路由文件存在"
        local route_count=$(grep -c "Route::" /www/wwwroot/api.4kp3l0iq.top/app/admin/route/api.php || echo "0")
        log_info "路由规则数: $route_count"
    else
        log_warn "API路由文件不存在或位置不同"
    fi
    
    # 检查主路由
    if [ -f "/www/wwwroot/api.4kp3l0iq.top/route/api.php" ]; then
        log_success "主路由文件存在"
    else
        log_warn "主路由文件不存在"
    fi
}

# 12. ThinkPHP防跳转自动分析
check_thinkphp_redirect() {
    log_title "12. ThinkPHP防跳转自动分析"
    
    log_info "检查应用配置和防跳转设置..."
    
    # 检查config
    if [ -f "/www/wwwroot/api.4kp3l0iq.top/.env" ]; then
        log_success ".env配置文件存在"
        
        # 检查debug模式
        if grep -q "debug = true" /www/wwwroot/api.4kp3l0iq.top/.env; then
            log_warn "Debug模式已启用（生产环境应关闭）"
        else
            log_success "Debug模式未启用"
        fi
    else
        log_warn ".env配置文件不存在"
    fi
    
    # 检查中间件
    if [ -f "/www/wwwroot/api.4kp3l0iq.top/app/admin/middleware/CheckToken.php" ]; then
        log_success "Token检查中间件存在"
    else
        log_warn "Token检查中间件不存在"
    fi
    
    # 检查是否有重定向中间件
    if grep -r "redirect" /www/wwwroot/api.4kp3l0iq.top/app --include="*.php" 2>/dev/null | grep -q "middleware"; then
        log_warn "检测到可能的重定向中间件"
    else
        log_success "未检测到强制重定向"
    fi
}

# 生成最终报告
generate_final_report() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════════════════╗"
    echo "║                        📊 最终诊断报告                               ║"
    echo "╚════════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "检查结果统计:"
    echo "  ${GREEN}✓ 通过: $PASS_COUNT${NC}"
    echo "  ${RED}✗ 失败: $FAIL_COUNT${NC}"
    echo "  ${YELLOW}⚠ 警告: $WARN_COUNT${NC}"
    echo ""
    
    if [ $FAIL_COUNT -eq 0 ]; then
        echo -e "${GREEN}✨ 系统状态: 完全就绪 ✨${NC}"
    elif [ $FAIL_COUNT -le 3 ]; then
        echo -e "${YELLOW}⚠ 系统状态: 基本就绪（有小问题）${NC}"
    else
        echo -e "${RED}✗ 系统状态: 需要修复${NC}"
    fi
    
    echo ""
}

# 主程序
main() {
    print_header
    
    # 获取Token
    get_token
    echo ""
    
    # 执行所有检查
    check_global_token
    check_permission_api
    check_finance_api
    check_vip_api
    check_team_api
    check_recharge_api
    check_withdraw_api
    check_risk_control_api
    check_sms_api
    check_login_flow
    check_backend_routes
    check_thinkphp_redirect
    
    # 生成报告
    generate_final_report
}

# 执行主程序
main
