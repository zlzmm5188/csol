/**
 * 统一标题栏 - 为九宫格链接的页面提供统一的标题栏样式
 * 参考 company-news.html 的标题栏设计
 */

(function() {
    'use strict';

    /**
     * 创建统一标题栏HTML
     * @param {string} title - 页面标题
     * @param {string} backUrl - 返回链接（默认 index.html）
     */
    function createUnifiedHeader(title, backUrl = 'index.html') {
        return `
            <div class="topbar" id="unified-topbar">
                <div class="topbar-content">
                    <a href="${backUrl}" class="back-btn">‹</a>
                    <h1 class="topbar-title">${title}</h1>
                </div>
            </div>
        `;
    }

    /**
     * 获取页面标题（从页面title或h1标签）
     */
    function getPageTitle() {
        // 尝试从页面标题获取
        const pageTitle = document.title;
        if (pageTitle && pageTitle !== '') {
            // 移除 " | PROVIDENCE" 等后缀
            return pageTitle.split('|')[0].trim();
        }

        // 尝试从h1标签获取
        const h1 = document.querySelector('h1');
        if (h1 && h1.textContent) {
            return h1.textContent.trim();
        }

        // 默认标题
        return '页面';
    }

    /**
     * 初始化统一标题栏
     */
    function initUnifiedHeader() {
        // 检查是否已经存在统一标题栏
        if (document.getElementById('unified-topbar')) {
            return;
        }

        // 检查是否是九宫格链接的页面（排除首页、数据、项目、消息、我的等主要页面）
        const path = window.location.pathname;
        const filename = path.split('/').pop() || '';
        const mainPages = ['index.html', 'market.html', 'projects.html', 'messages.html', 'profile.html', 'company-news.html'];

        if (mainPages.includes(filename) || filename === '' || path.endsWith('/')) {
            return; // 主要页面不需要统一标题栏
        }

        // 获取页面标题
        const pageTitle = getPageTitle();

        // 先移除旧的标题栏
        const oldHeaders = document.querySelectorAll('header.hero-simple, .hero-simple, .top-nav, header:not(#unified-topbar)');
        oldHeaders.forEach(header => {
            header.style.display = 'none';
            header.remove();
        });

        // 创建并插入标题栏（插入到body最前面）
        const headerHTML = createUnifiedHeader(pageTitle);
        document.body.insertAdjacentHTML('afterbegin', headerHTML);

        // 添加样式（如果还没有）
        if (!document.getElementById('unified-header-style')) {
            const style = document.createElement('style');
            style.id = 'unified-header-style';
            style.textContent = `
                /* 统一标题栏样式 - APP风格固定标题栏 */
                .topbar,
                .hero-simple,
                header.hero-simple,
                header[class*="hero"],
                header[class*="topbar"] {
                    position: sticky !important;
                    top: 0 !important;
                    z-index: 1000 !important;
                    background: rgba(10, 25, 41, 0.85) !important;
                    backdrop-filter: blur(20px) !important;
                    -webkit-backdrop-filter: blur(20px) !important;
                    border-bottom: 1px solid rgba(184, 146, 90, 0.2) !important;
                    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3) !important;
                    width: 100% !important;
                    left: 0 !important;
                    right: 0 !important;
                    will-change: transform !important;
                    transform: translateZ(0) !important;
                    -webkit-transform: translateZ(0) !important;
                    padding-top: max(clamp(12px, 3vw, 16px), env(safe-area-inset-top) + 8px) !important;
                }

                .topbar-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: clamp(12px, 3vw, 16px) clamp(16px, 4vw, 20px);
                    display: flex;
                    align-items: center;
                    gap: clamp(12px, 3vw, 16px);
                }

                .back-btn {
                    width: clamp(36px, 9vw, 40px);
                    height: clamp(36px, 9vw, 40px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                    background: rgba(184, 146, 90, 0.1);
                    color: #b8925a;
                    font-size: clamp(20px, 5vw, 24px);
                    cursor: pointer;
                    border: 1px solid rgba(184, 146, 90, 0.2);
                    transition: all 0.3s ease;
                    text-decoration: none;
                    flex-shrink: 0;
                }

                .back-btn:hover,
                .back-btn:active {
                    background: rgba(184, 146, 90, 0.2);
                    border-color: rgba(184, 146, 90, 0.35);
                    transform: scale(0.95);
                }

                .topbar-title {
                    font-size: clamp(18px, 4.5vw, 20px);
                    font-weight: 700;
                    color: #e8edf3;
                    margin: 0;
                    flex: 1;
                    line-height: 1.4;
                }

                /* 移除页面原有的底部导航栏 */
                body:not(.has-main-nav) {
                    padding-bottom: clamp(20px, 5vw, 30px) !important;
                }

                /* 确保内容不被标题栏遮挡 */
                body:has(.topbar) {
                    padding-top: 0;
                }

                body:has(.topbar) > *:not(.topbar) {
                    margin-top: 0;
                }
            `;
            document.head.appendChild(style);
        }

        // 移除页面中的底部导航栏（更彻底的移除）
        const tabbars = document.querySelectorAll('.tabbar, nav.tabbar, #tabbar, #global-tabbar, [class*="tabbar"], [id*="tabbar"]');
        tabbars.forEach(tabbar => {
            tabbar.style.display = 'none';
            tabbar.style.visibility = 'hidden';
            tabbar.style.opacity = '0';
            tabbar.style.height = '0';
            tabbar.style.padding = '0';
            tabbar.style.margin = '0';
            tabbar.remove();
        });

        // 移除旧的标题栏（hero-simple等）- 延迟执行确保DOM已加载
        setTimeout(() => {
            const oldHeaders = document.querySelectorAll('header.hero-simple, .hero-simple, .top-nav, header:not(#unified-topbar)');
            oldHeaders.forEach(header => {
                // 如果已经有统一标题栏，移除旧的
                if (document.getElementById('unified-topbar')) {
                    header.style.display = 'none';
                    header.style.visibility = 'hidden';
                    header.style.opacity = '0';
                    header.style.height = '0';
                    header.remove();
                }
            });
        }, 100);

        // 添加CSS强制隐藏底部导航栏
        if (!document.getElementById('force-hide-tabbar-style')) {
            const hideStyle = document.createElement('style');
            hideStyle.id = 'force-hide-tabbar-style';
            hideStyle.textContent = `
                /* 强制隐藏所有底部导航栏 */
                .tabbar,
                nav.tabbar,
                #tabbar,
                #global-tabbar,
                [class*="tabbar"],
                [id*="tabbar"] {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    height: 0 !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    position: absolute !important;
                    left: -9999px !important;
                }

                /* 移除底部导航栏占用的空间 */
                body.no-tabbar {
                    padding-bottom: clamp(20px, 5vw, 30px) !important;
                }

                body:has(.topbar) {
                    padding-bottom: clamp(20px, 5vw, 30px) !important;
                }
            `;
            document.head.appendChild(hideStyle);
        }

        // 标记页面不需要底部导航栏
        document.body.classList.add('no-tabbar');
    }

    // 页面加载完成后初始化（使用once选项避免重复绑定）
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUnifiedHeader, { once: true });
    } else {
        initUnifiedHeader();
    }

    // 页面卸载时清理
    window.addEventListener('beforeunload', function() {
        // 清理统一标题栏相关资源
        const topbar = document.getElementById('unified-topbar');
        if (topbar) {
            // 可以在这里添加清理逻辑
        }
    }, { once: true });

    // 导出到全局
    window.UnifiedHeader = {
        init: initUnifiedHeader,
        create: createUnifiedHeader
    };

})();
