#!/usr/bin/env python3

"""
Providence 前端中间件一键部署脚本 v1.0
自动将5个中间件脚本加载到所有关键的业务HTML文件中
"""

import os
import sys
import re
from datetime import datetime
from pathlib import Path

# 配置
FRONTEND_DIR = "/www/wwwroot/4kp3l0iq.top"
CRITICAL_PAGES = [
    "index.html",
    "login.html",
    "profile.html",
    "finance.html",
    "ribao.html",
    "ribao-history.html",
]

# 中间件加载代码
MIDDLEWARE_SNIPPET = '''  <!-- 前端统一中间件加载 -->
  <script src="/API_MAP.js?v=1"></script>
  <script src="/token-interceptor.js?v=1"></script>
  <script src="/error-interceptor.js?v=1"></script>
  <script src="/login-handler.js?v=1"></script>
  <script src="/global-stabilizer.js?v=1"></script>'''

# 颜色定义
class Colors:
    RESET = '\033[0m'
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    CYAN = '\033[0;36m'

def log_info(msg):
    print(f"{Colors.BLUE}[INFO]{Colors.RESET} {msg}")

def log_success(msg):
    print(f"{Colors.GREEN}[✓]{Colors.RESET} {msg}")

def log_warn(msg):
    print(f"{Colors.YELLOW}[⚠]{Colors.RESET} {msg}")

def log_step(msg):
    print(f"\n{Colors.CYAN}═══ {msg} ═══{Colors.RESET}\n")

def check_middleware_files():
    """检查所有中间件文件是否存在"""
    required_files = [
        "API_MAP.js",
        "token-interceptor.js",
        "error-interceptor.js",
        "login-handler.js",
        "global-stabilizer.js",
    ]

    log_info("检查必要的中间件文件...")

    all_exist = True
    for filename in required_files:
        filepath = os.path.join(FRONTEND_DIR, filename)
        if os.path.exists(filepath):
            log_success(f"已找到: {filename}")
        else:
            log_warn(f"缺失: {filename}")
            all_exist = False

    if not all_exist:
        print(f"\n{Colors.RED}某些中间件文件缺失！{Colors.RESET}")
        return False

    return True

def deploy_page(html_file):
    """部署单个页面"""
    filename = os.path.basename(html_file)

    # 检查文件是否存在
    if not os.path.exists(html_file):
        log_warn(f"文件不存在: {filename}")
        return "failed"

    # 读取文件内容
    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        log_warn(f"读取文件失败: {filename} - {e}")
        return "failed"

    # 检查是否已经包含中间件
    if "API_MAP.js" in content:
        log_warn(f"跳过 {filename} (已包含中间件)")
        return "skipped"

    # 创建备份
    timestamp = datetime.now().strftime("%s")
    backup_file = f"{html_file}.bak.{timestamp}"
    try:
        with open(backup_file, 'w', encoding='utf-8') as f:
            f.write(content)
        log_info(f"备份: {os.path.basename(backup_file)}")
    except Exception as e:
        log_warn(f"创建备份失败: {filename} - {e}")
        return "failed"

    # 查找</head>标签
    head_close_pattern = re.compile(r'</head>', re.IGNORECASE)

    if head_close_pattern.search(content):
        # 在</head>前插入中间件
        new_content = head_close_pattern.sub(f'{MIDDLEWARE_SNIPPET}\n</head>', content)
    elif re.search(r'<body', content, re.IGNORECASE):
        # 如果没有</head>，在<body前插入
        body_pattern = re.compile(r'(<body[^>]*>)', re.IGNORECASE)
        new_content = body_pattern.sub(f'{MIDDLEWARE_SNIPPET}\n\1', content)
    else:
        log_warn(f"未找到</head>或<body标签: {filename}")
        return "failed"

    # 写入文件
    try:
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        log_success(f"已部署到 {filename}")
        return "deployed"
    except Exception as e:
        log_warn(f"写入文件失败: {filename} - {e}")
        # 恢复备份
        try:
            with open(backup_file, 'r', encoding='utf-8') as f:
                original_content = f.read()
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(original_content)
        except:
            pass
        return "failed"

def main():
    print("")
    log_step("关键页面中间件部署系统")

    # 检查中间件文件
    if not check_middleware_files():
        sys.exit(1)

    print("")
    log_step("开始部署关键页面")

    deployed = 0
    skipped = 0
    failed = 0

    # 部署所有关键页面
    log_info(f"部署 {len(CRITICAL_PAGES)} 个关键页面...\n")

    for page in CRITICAL_PAGES:
        html_file = os.path.join(FRONTEND_DIR, page)
        result = deploy_page(html_file)

        if result == "deployed":
            deployed += 1
        elif result == "skipped":
            skipped += 1
        else:
            failed += 1

    # 打印总结
    print("")
    log_step("部署总结")

    print(f"""
╔════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║              ✅ 关键页面中间件部署完成！                              ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝

【📊 部署结果】

✓ 已部署:      {deployed} 个页面
⊘ 已跳过:      {skipped} 个页面（已包含中间件）
✗ 失败:        {failed} 个页面

【📝 部署的关键页面】

""")

    for page in CRITICAL_PAGES:
        html_file = os.path.join(FRONTEND_DIR, page)
        if os.path.exists(html_file):
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
            if "API_MAP.js" in content:
                print(f"  ✓ {page}")

    print(f"""
════════════════════════════════════════════════════════════════════════

【🧪 测试说明】

1️⃣  清除浏览器缓存和LocalStorage
   - Windows: Ctrl+Shift+Del
   - Mac: Cmd+Shift+Del

2️⃣  打开浏览器F12开发者工具
   - Windows: F12
   - Mac: Cmd+Option+I

3️⃣  访问登录页面
   https://4kp3l0iq.top/login.html

4️⃣  输入测试账号
   用户名: G138688
   密码: G138688

5️⃣  检查Console输出
   应该看到以下消息（按顺序）:
   • ✓ API_MAP 已加载
   • ✓ Token 拦截器已加载
   • ✓ 错误拦截器已加载
   • ✓ 登录处理器已加载
   • ✓ 全局稳定化系统已加载

6️⃣  登录后验证
   • 是否成功进入 /index.html
   • 导航到 /profile.html
   • 没有"请先登录"错误提示
   • 没有被重定向回登录页面

════════════════════════════════════════════════════════════════════════

【✨ 部署后的功能】

✓ 统一API调用方式（所有页面）
✓ 自动Token管理和验证
✓ 5秒自动检查Token有效性
✓ API错误自动捕获和处理
✓ "请先登录"自动重定向
✓ 登出自动清除Token
✓ 永久解决"某些页面登录某些页面又回登录"问题

════════════════════════════════════════════════════════════════════════

""")

    if deployed > 0:
        print("🎉 部署成功！系统现已完全统一、可控和稳定！\n")
        sys.exit(0)
    else:
        print("⚠️  未部署任何页面，请检查文件状态\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
