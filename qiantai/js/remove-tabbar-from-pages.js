/**

// 防止事件监听器重复注册
function addEventListenerOnce(element, event, handler, options) {
    if (!element) return;
    if (!element._bindedEvents) element._bindedEvents = {};
    const key = event + '_' + (handler.name || 'anonymous');
    if (!element._bindedEvents[key]) {
        element._bindedEvents[key] = true;
        element.addEventListener(event, handler, options || { passive: false });
    }
}


 * 自动删除所有子页面的tabbar
 * 只在页面加载时执行一次
 */
(function() {
    'use strict';

    // 检查是否在app.html的iframe中
    const isInIframe = window.parent && window.parent !== window;

    // 检查是否是index.html（首页需要保留，但index.html在iframe中时不需要）
    const isIndexPage = window.location.pathname.includes('index.html') ||
                       window.location.pathname.endsWith('/') ||
                       window.location.pathname.endsWith('/index');

    // 如果不在iframe中且是index.html，可能是独立访问，保留tabbar
    if (!isInIframe && isIndexPage) {
        console.log('✅ 独立访问首页，保留tabbar');
        return;
    }

    // 删除所有tabbar相关的HTML结构
    function removeTabbarHTML() {
        // 查找并删除所有tabbar元素
        const tabbars = document.querySelectorAll('nav.tabbar, .tabbar, #tabbar, [class*="tabbar"]');
        tabbars.forEach(tabbar => {
            console.log('🗑️ 删除tabbar:', tabbar);
            tabbar.remove();
        });

        // 删除tabbar容器
        const containers = document.querySelectorAll('#tabbar-container, .tabbar-container');
        containers.forEach(container => {
            console.log('🗑️ 删除tabbar容器:', container);
            container.remove();
        });
    }

    // 隐藏tabbar相关的CSS（通过添加样式覆盖）
    function hideTabbarCSS() {
        const style = document.createElement('style');
        style.id = 'hide-tabbar-style';
        style.textContent = `
            nav.tabbar,
            .tabbar,
            #tabbar,
            [class*="tabbar"] {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                padding: 0 !important;
                margin: 0 !important;
            }
        `;
        document.head.appendChild(style);
    }

    // 执行删除
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            removeTabbarHTML();
            hideTabbarCSS();
        });
    } else {
        removeTabbarHTML();
        hideTabbarCSS();
    }

    // 延迟再次检查（确保动态加载的内容也被删除）
    setTimeout(function() {
        removeTabbarHTML();
    }, 500);
})();
