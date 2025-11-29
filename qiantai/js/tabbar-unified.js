/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Providence 底部导航栏统一管理系统 v2.0
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 功能：
 * 1. 统一底部导航栏状态管理
 * 2. 智能路由匹配和高亮逻辑
 * 3. 防止手势/滑动/history.back冲突
 * 4. 优化切换动画和数据加载
 * 5. 多端兼容（移动端浏览器、App内嵌、桌面端）
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

(function() {
    'use strict';

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 配置常量
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const CONFIG = {
        TABBAR_ID: 'providence-global-tabbar',
        ACTIVE_TAB_KEY: 'providence_active_tab',
        LAST_SCROLL_KEY: 'providence_tab_scroll_',
        PREVENT_DOUBLE_CLICK: true,
        DOUBLE_CLICK_DELAY: 300, // ms
        ENABLE_ANIMATION: true,
        ANIMATION_DURATION: 300, // ms
        DEBUG: false
    };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 页面与Tab的映射关系（支持正则匹配）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const PAGE_TAB_MAP = {
        home: {
            pages: ['index.html', 'app.html', ''],
            patterns: [/^(index|app)\.html$/],
            icon: 'ico-home',
            label: '首页',
            href: 'index.html'
        },
        market: {
            pages: ['market.html'],
            patterns: [/^market.*\.html$/],
            icon: 'ico-finance',
            label: '数据',
            href: 'market.html'
        },
        projects: {
            pages: ['projects.html', 'projects-list.html'],
            patterns: [/^project.*\.html$/, /^my-investments\.html$/],
            icon: 'ico-market',
            label: '项目',
            href: 'projects.html'
        },
        messages: {
            pages: ['messages.html'],
            patterns: [/^message.*\.html$/],
            icon: 'ico-message',
            label: '消息',
            href: 'messages.html'
        },
        profile: {
            pages: ['profile.html'],
            patterns: [
                /^profile\.html$/,
                /^ribao.*\.html$/,
                /^recharge.*\.html$/,
                /^withdraw.*\.html$/,
                /^points.*\.html$/,
                /^team.*\.html$/,
                /^vip.*\.html$/,
                /^bank-cards\.html$/,
                /^my-investments\.html$/,
                /^profit-calendar\.html$/,
                /^daily-checkin\.html$/,
                /^trial-money\.html$/,
                /^set-pay-password\.html$/
            ],
            icon: 'ico-me',
            label: '我的',
            href: 'profile.html'
        }
    };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 不显示底部导航栏的页面
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const HIDE_TABBAR_PAGES = [
        'login.html',
        'register.html',
        'reset-password.html',
        'splash.html',
        'welcome.html'
    ];

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 工具函数
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function log(...args) {
        if (CONFIG.DEBUG) {
            console.log('[TabBar]', ...args);
        }
    }

    function getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
        return filename;
    }

    function shouldHideTabbar() {
        const currentPage = getCurrentPage();
        return HIDE_TABBAR_PAGES.includes(currentPage);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 智能路由匹配 - 根据当前页面确定激活的Tab
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function getCurrentTab() {
        const currentPage = getCurrentPage();

        for (const [tabName, config] of Object.entries(PAGE_TAB_MAP)) {
            // 精确匹配
            if (config.pages.includes(currentPage)) {
                log('精确匹配:', currentPage, '=>', tabName);
                return tabName;
            }

            // 正则匹配
            for (const pattern of config.patterns) {
                if (pattern.test(currentPage)) {
                    log('正则匹配:', currentPage, '=>', tabName, pattern);
                    return tabName;
                }
            }
        }

        // 如果没有匹配，尝试从localStorage恢复
        const savedTab = localStorage.getItem(CONFIG.ACTIVE_TAB_KEY);
        if (savedTab && PAGE_TAB_MAP[savedTab]) {
            log('使用保存的Tab:', savedTab);
            return savedTab;
        }

        log('无匹配Tab，默认:', 'home');
        return 'home';
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 创建底部导航栏HTML
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function createTabbarHTML() {
        const tabs = Object.entries(PAGE_TAB_MAP).map(([tabName, config]) => `
            <a class="tab" data-tab="${tabName}" data-href="${config.href}">
                <div class="ico ${config.icon}"></div>
                <div class="txt">${config.label}</div>
            </a>
        `).join('');

        return `
            <nav class="tabbar" id="${CONFIG.TABBAR_ID}" role="navigation" aria-label="主导航">
                ${tabs}
            </nav>
        `;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 保存/恢复页面滚动位置
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function saveScrollPosition(tabName) {
        try {
            const scrollY = window.scrollY || document.documentElement.scrollTop;
            sessionStorage.setItem(CONFIG.LAST_SCROLL_KEY + tabName, scrollY.toString());
            log('保存滚动位置:', tabName, scrollY);
        } catch (e) {
            log('保存滚动位置失败:', e);
        }
    }

    function restoreScrollPosition(tabName) {
        try {
            const scrollY = sessionStorage.getItem(CONFIG.LAST_SCROLL_KEY + tabName);
            if (scrollY) {
                window.scrollTo(0, parseInt(scrollY));
                log('恢复滚动位置:', tabName, scrollY);
            }
        } catch (e) {
            log('恢复滚动位置失败:', e);
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 激活Tab（带动画）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function activateTab(tabName, skipAnimation = false) {
        const tabbar = document.getElementById(CONFIG.TABBAR_ID);
        if (!tabbar) {
            log('Tabbar不存在');
            return;
        }

        const tabs = tabbar.querySelectorAll('.tab');
        let changed = false;

        tabs.forEach(tab => {
            const tabData = tab.getAttribute('data-tab');
            const wasActive = tab.classList.contains('active');
            const shouldBeActive = tabData === tabName;

            if (shouldBeActive && !wasActive) {
                // 添加动画类
                if (CONFIG.ENABLE_ANIMATION && !skipAnimation) {
                    tab.classList.add('tab-activating');
                    setTimeout(() => {
                        tab.classList.remove('tab-activating');
                    }, CONFIG.ANIMATION_DURATION);
                }
                tab.classList.add('active');
                tab.setAttribute('aria-current', 'page');
                changed = true;
                log('激活Tab:', tabName);
            } else if (!shouldBeActive && wasActive) {
                tab.classList.remove('active', 'tab-activating');
                tab.removeAttribute('aria-current');
                changed = true;
            }
        });

        if (changed) {
            // 保存当前激活的Tab
            localStorage.setItem(CONFIG.ACTIVE_TAB_KEY, tabName);

            // 触发自定义事件
            window.dispatchEvent(new CustomEvent('tabbar-changed', {
                detail: { activeTab: tabName }
            }));
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 处理Tab点击（防止重复点击、冲突处理）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    let lastClickTime = 0;
    let lastClickedTab = null;

    function handleTabClick(e) {
        const tab = e.target.closest('.tab');
        if (!tab) return;

        const tabName = tab.getAttribute('data-tab');
        const href = tab.getAttribute('data-href');
        const currentTab = getCurrentTab();
        const now = Date.now();

        // 防止双击
        if (CONFIG.PREVENT_DOUBLE_CLICK &&
            tabName === lastClickedTab &&
            (now - lastClickTime) < CONFIG.DOUBLE_CLICK_DELAY) {
            log('防止双击:', tabName);
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        lastClickTime = now;
        lastClickedTab = tabName;

        // 如果点击当前Tab，滚动到顶部
        if (tabName === currentTab) {
            e.preventDefault();
            e.stopPropagation();
            log('点击当前Tab，滚动到顶部');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // 保存当前页面的滚动位置
        saveScrollPosition(currentTab);

        // 立即激活Tab（视觉反馈）
        activateTab(tabName);

        // 阻止默认行为，使用自定义导航
        e.preventDefault();
        e.stopPropagation();

        // 延迟导航，确保动画流畅
        setTimeout(() => {
            log('导航到:', href);
            window.location.href = href;
        }, CONFIG.ENABLE_ANIMATION ? 50 : 0);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 禁用浏览器默认的滑动返回（防止与TabBar冲突）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function preventBrowserSwipeConflict() {
        // 防止iOS Safari滑动返回
        if (!document.getElementById('tabbar-swipe-style')) {
            const style = document.createElement('style');
            style.id = 'tabbar-swipe-style';
            style.textContent = `
                html, body {
                    overscroll-behavior-x: none;
                }
                .tabbar {
                    touch-action: manipulation;
                    -webkit-touch-callout: none;
                    -webkit-user-select: none;
                    user-select: none;
                }
                .tab {
                    touch-action: manipulation;
                }
                /* 激活动画 */
                .tab-activating {
                    transform: scale(0.9);
                    transition: transform ${CONFIG.ANIMATION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1);
                }
                .tab.active {
                    transform: scale(1);
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 防止popstate事件导致的状态错乱
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function preventPopstateConflict() {
        window.addEventListener('popstate', function(e) {
            log('popstate事件触发，重新同步Tab状态');
            // 延迟执行，确保URL已更新
            setTimeout(() => {
                const currentTab = getCurrentTab();
                activateTab(currentTab, true);
            }, 50);
        }, { passive: true });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 移除页面中所有旧的Tabbar实例
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function removeOldTabbars() {
        const allTabbars = document.querySelectorAll('.tabbar, nav.tabbar, .bottom-nav');
        let removed = 0;
        allTabbars.forEach(tb => {
            if (tb.id !== CONFIG.TABBAR_ID) {
                tb.remove();
                removed++;
            }
        });
        if (removed > 0) {
            log('移除旧Tabbar:', removed, '个');
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 初始化全局Tabbar
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function initTabbar() {
        // 如果当前页面不显示Tabbar
        if (shouldHideTabbar()) {
            log('当前页面不显示Tabbar:', getCurrentPage());
            removeOldTabbars();
            return;
        }

        // 移除所有旧的Tabbar
        removeOldTabbars();

        // 检查是否已存在全局Tabbar
        let tabbar = document.getElementById(CONFIG.TABBAR_ID);

        if (!tabbar) {
            // 创建新的Tabbar
            document.body.insertAdjacentHTML('beforeend', createTabbarHTML());
            tabbar = document.getElementById(CONFIG.TABBAR_ID);
            log('创建新Tabbar');
        }

        // 绑定点击事件（使用事件委托，只绑定一次）
        if (!tabbar.dataset.bound) {
            tabbar.addEventListener('click', handleTabClick, { passive: false });
            tabbar.dataset.bound = 'true';
            log('绑定点击事件');
        }

        // 激活当前Tab
        const currentTab = getCurrentTab();
        activateTab(currentTab, true);

        // 尝试恢复滚动位置
        restoreScrollPosition(currentTab);

        log('Tabbar初始化完成，当前Tab:', currentTab);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 页面卸载时清理
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function cleanup() {
        const currentTab = getCurrentTab();
        saveScrollPosition(currentTab);
        log('页面卸载，保存状态');
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 暴露全局API
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    window.ProvidenceTabbar = {
        activate: activateTab,
        getCurrentTab: getCurrentTab,
        init: initTabbar,
        reload: function() {
            removeOldTabbars();
            initTabbar();
        },
        setDebug: function(enabled) {
            CONFIG.DEBUG = enabled;
        }
    };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 自动初始化
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function autoInit() {
        preventBrowserSwipeConflict();
        preventPopstateConflict();
        initTabbar();
    }

    // 页面加载时初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit, { once: true });
    } else {
        autoInit();
    }

    // 页面卸载时清理
    window.addEventListener('beforeunload', cleanup, { once: true });
    window.addEventListener('pagehide', cleanup, { once: true });

    log('Providence TabBar System v2.0 已加载');

})();
