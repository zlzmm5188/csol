/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Providence 布局辅助脚本
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 功能：
 * 1. 修复移动端100vh问题 (iOS Safari地址栏)
 * 2. 检测和修复布局问题
 * 3. 调试模式
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

(function() {
    'use strict';

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. 修复移动端100vh问题
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function setVH() {
        // 获取真实的视口高度
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        console.log('[布局] 更新视口高度:', window.innerHeight, 'px');
    }

    // 初始化和事件监听
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    // iOS特殊处理：滚动时更新
    let resizeTimer;
    window.addEventListener('scroll', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(setVH, 200);
    }, { passive: true });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. 布局自动检测和修复
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function checkLayout() {
        const issues = [];

        // 检查是否有顶部导航
        const header = document.querySelector('.fixed-header, .top-nav, .header-fixed');
        if (header) {
            const style = window.getComputedStyle(header);
            if (style.position !== 'fixed') {
                issues.push({
                    element: header,
                    issue: '顶部导航未使用 position: fixed',
                    fix: function() {
                        header.style.position = 'fixed';
                        header.style.top = '0';
                        header.style.left = '0';
                        header.style.right = '0';
                        header.style.zIndex = '1000';
                    }
                });
            }
        }

        // 检查是否有底部导航
        const tabbar = document.querySelector('.tabbar, .bottom-tabbar, .bottom-nav');
        if (tabbar) {
            const style = window.getComputedStyle(tabbar);
            if (style.position !== 'fixed') {
                issues.push({
                    element: tabbar,
                    issue: '底部导航未使用 position: fixed',
                    fix: function() {
                        tabbar.style.position = 'fixed';
                        tabbar.style.bottom = '0';
                        tabbar.style.left = '0';
                        tabbar.style.right = '0';
                        tabbar.style.zIndex = '999';
                    }
                });
            }
        }

        // 检查主内容区
        const mainContent = document.querySelector('.main-content, #app, main');
        if (mainContent) {
            const style = window.getComputedStyle(mainContent);

            // 检查是否有padding
            const headerHeight = header ? header.offsetHeight : 0;
            const tabbarHeight = tabbar ? tabbar.offsetHeight : 0;
            const currentPaddingTop = parseInt(style.paddingTop) || 0;
            const currentPaddingBottom = parseInt(style.paddingBottom) || 0;

            if (headerHeight > 0 && currentPaddingTop < headerHeight) {
                issues.push({
                    element: mainContent,
                    issue: `主内容区 padding-top 不足，内容会被顶部导航遮挡 (当前: ${currentPaddingTop}px, 需要: ${headerHeight}px)`,
                    fix: function() {
                        mainContent.style.paddingTop = headerHeight + 'px';
                    }
                });
            }

            if (tabbarHeight > 0 && currentPaddingBottom < tabbarHeight) {
                issues.push({
                    element: mainContent,
                    issue: `主内容区 padding-bottom 不足，内容会被底部导航遮挡 (当前: ${currentPaddingBottom}px, 需要: ${tabbarHeight}px)`,
                    fix: function() {
                        mainContent.style.paddingBottom = tabbarHeight + 'px';
                    }
                });
            }

            // 检查overflow
            if (style.overflowY !== 'auto' && style.overflowY !== 'scroll') {
                issues.push({
                    element: mainContent,
                    issue: '主内容区没有设置 overflow-y: auto，无法独立滚动',
                    fix: function() {
                        mainContent.style.overflowY = 'auto';
                        mainContent.style.webkitOverflowScrolling = 'touch';
                    }
                });
            }
        }

        return issues;
    }

    function autoFixLayout() {
        const issues = checkLayout();

        if (issues.length === 0) {
            console.log('[布局] ✅ 布局检查通过，无问题');
            return;
        }

        console.warn('[布局] ⚠️  发现', issues.length, '个布局问题:');
        issues.forEach((issue, index) => {
            console.warn(`  ${index + 1}. ${issue.issue}`);
            console.warn('     元素:', issue.element);
        });

        // 自动修复
        console.log('[布局] 🔧 自动修复中...');
        issues.forEach(issue => {
            try {
                issue.fix();
                console.log('[布局] ✅ 已修复:', issue.issue);
            } catch (e) {
                console.error('[布局] ❌ 修复失败:', issue.issue, e);
            }
        });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3. 禁止body滚动，只允许内容区滚动
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function preventBodyScroll() {
        // 禁止body滚动
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';

        // 确保主内容区可滚动
        const mainContent = document.querySelector('.main-content, #app, main');
        if (mainContent) {
            mainContent.style.overflowY = 'auto';
            mainContent.style.webkitOverflowScrolling = 'touch';
        }

        console.log('[布局] 已禁止body滚动');
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 4. 调试模式
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function enableDebugMode() {
        document.body.classList.add('debug-layout');

        // 显示布局信息
        const info = [];

        const header = document.querySelector('.fixed-header, .top-nav');
        if (header) {
            const rect = header.getBoundingClientRect();
            info.push(`顶部导航: ${rect.height}px (top: ${rect.top}px)`);
        }

        const tabbar = document.querySelector('.tabbar, .bottom-tabbar');
        if (tabbar) {
            const rect = tabbar.getBoundingClientRect();
            info.push(`底部导航: ${rect.height}px (bottom: ${window.innerHeight - rect.bottom}px)`);
        }

        const mainContent = document.querySelector('.main-content, #app');
        if (mainContent) {
            const style = window.getComputedStyle(mainContent);
            info.push(`主内容区: padding-top ${style.paddingTop}, padding-bottom ${style.paddingBottom}`);
            info.push(`主内容区: 滚动高度 ${mainContent.scrollHeight}px, 可见高度 ${mainContent.clientHeight}px`);
        }

        info.push(`视口: ${window.innerWidth}x${window.innerHeight}`);
        info.push(`设备像素比: ${window.devicePixelRatio}`);

        console.log('[布局调试]');
        info.forEach(line => console.log('  ' + line));

        // 创建调试信息面板
        createDebugPanel(info);
    }

    function createDebugPanel(info) {
        let panel = document.getElementById('layout-debug-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'layout-debug-panel';
            panel.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.8);
                color: #fff;
                padding: 10px;
                border-radius: 8px;
                font-size: 12px;
                font-family: monospace;
                z-index: 99999;
                max-width: 300px;
                pointer-events: none;
            `;
            document.body.appendChild(panel);
        }

        panel.innerHTML = '<strong>布局调试</strong><br>' + info.join('<br>');
    }

    function disableDebugMode() {
        document.body.classList.remove('debug-layout');
        const panel = document.getElementById('layout-debug-panel');
        if (panel) {
            panel.remove();
        }
        console.log('[布局调试] 已关闭');
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 5. 安全区域适配
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function applySafeAreaInsets() {
        // 检测是否支持安全区域
        const supportsEnv = CSS.supports('padding-top: env(safe-area-inset-top)');

        if (supportsEnv) {
            console.log('[布局] ✅ 支持安全区域 (safe-area-inset)');

            // 为HTML添加viewport-fit=cover
            let viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                let content = viewport.getAttribute('content');
                if (!content.includes('viewport-fit')) {
                    viewport.setAttribute('content', content + ', viewport-fit=cover');
                    console.log('[布局] 已添加 viewport-fit=cover');
                }
            }
        } else {
            console.log('[布局] ⚠️  不支持安全区域');
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 6. 暴露全局API
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    window.ProvidenceLayout = {
        // 检查布局
        check: checkLayout,

        // 自动修复布局
        fix: autoFixLayout,

        // 启用调试模式
        debug: enableDebugMode,

        // 关闭调试模式
        debugOff: disableDebugMode,

        // 更新视口高度
        updateVH: setVH,

        // 禁止body滚动
        preventBodyScroll: preventBodyScroll,

        // 安全区域适配
        applySafeArea: applySafeAreaInsets
    };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 7. 自动初始化
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function init() {
        console.log('[布局] Providence Layout Helper 已加载');

        // 修复视口高度
        setVH();

        // 安全区域适配
        applySafeAreaInsets();

        // 检查布局（延迟执行，确保DOM完全加载）
        setTimeout(() => {
            const issues = checkLayout();
            if (issues.length > 0) {
                console.warn('[布局] 发现布局问题，建议运行 ProvidenceLayout.fix() 修复');
            }
        }, 500);
    }

    // 页面加载时初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }

    console.log('[布局] 可用命令:');
    console.log('  ProvidenceLayout.check()    - 检查布局问题');
    console.log('  ProvidenceLayout.fix()      - 自动修复布局');
    console.log('  ProvidenceLayout.debug()    - 启用调试模式');
    console.log('  ProvidenceLayout.debugOff() - 关闭调试模式');

})();
