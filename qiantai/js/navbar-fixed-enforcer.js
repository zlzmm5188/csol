/**
 * 导航栏固定强制器
 * 运行时监控并强制保持导航栏固定定位
 */

(function() {
    'use strict';

    // 设置移动端100vh修复
    function setVH() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    // 强制固定顶部导航栏
    function enforceTopNavFixed() {
        const selectors = [
            'header',
            '.header',
            '.top-nav',
            '.topbar',
            '.fixed-header',
            '.header-fixed',
            '.top-navbar'
        ];

        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (el && getComputedStyle(el).position !== 'fixed') {
                    el.style.position = 'fixed';
                    el.style.top = '0';
                    el.style.left = '0';
                    el.style.right = '0';
                    el.style.width = '100%';
                    el.style.zIndex = '10000';
                    el.style.transform = 'translateZ(0)';
                }
            });
        });
    }

    // 强制固定底部导航栏
    function enforceBottomNavFixed() {
        const selectors = [
            '.tabbar',
            '.bottom-nav',
            '.bottom-tabbar',
            '.navbar-fixed',
            '.bottom-navbar',
            'nav.tabbar',
            'footer.fixed'
        ];

        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (el && getComputedStyle(el).position !== 'fixed') {
                    el.style.position = 'fixed';
                    el.style.bottom = '0';
                    el.style.left = '0';
                    el.style.right = '0';
                    el.style.width = '100%';
                    el.style.zIndex = '9999';
                    el.style.transform = 'translateZ(0)';
                }
            });
        });
    }

    // 确保主内容区有正确的padding
    function enforceContentPadding() {
        const contentSelectors = ['#app', '.main-content', '.content-wrapper', 'main'];
        const topNavHeight = 50; // 默认顶部导航高度
        const bottomNavHeight = 60; // 默认底部导航高度

        contentSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (el) {
                    const hasTopNav = document.querySelector('header, .fixed-header, .top-nav, .topbar');
                    const hasBottomNav = document.querySelector('.tabbar, .bottom-nav, .bottom-tabbar');

                    if (hasTopNav && !el.classList.contains('no-header')) {
                        const currentPaddingTop = parseInt(getComputedStyle(el).paddingTop) || 0;
                        if (currentPaddingTop < topNavHeight) {
                            el.style.paddingTop = `${topNavHeight}px`;
                        }
                    }

                    if (hasBottomNav && !el.classList.contains('no-tabbar')) {
                        const currentPaddingBottom = parseInt(getComputedStyle(el).paddingBottom) || 0;
                        if (currentPaddingBottom < bottomNavHeight) {
                            el.style.paddingBottom = `${bottomNavHeight}px`;
                        }
                    }
                }
            });
        });
    }

    // 禁止body滚动
    function enforceBodyNoScroll() {
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        document.body.style.height = '100%';
    }

    // 初始化
    function init() {
        // 设置100vh修复
        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', setVH);

        // 立即执行一次
        enforceTopNavFixed();
        enforceBottomNavFixed();
        enforceContentPadding();
        enforceBodyNoScroll();

        // 定期检查（防止被其他脚本修改）
    // 注意：使用较长的间隔以减少性能影响
    const checkInterval = setInterval(() => {
        enforceTopNavFixed();
        enforceBottomNavFixed();
        enforceContentPadding();
    }, 1000);

    // 页面卸载时清理定时器
    window.addEventListener('beforeunload', () => {
        if (checkInterval) {
            clearInterval(checkInterval);
        }
    });

        // 监听DOM变化
        const observer = new MutationObserver(() => {
            enforceTopNavFixed();
            enforceBottomNavFixed();
            enforceContentPadding();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });

        // 页面卸载时断开观察器
        window.addEventListener('beforeunload', () => {
            observer.disconnect();
        });
    }

    // DOM加载完成后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
