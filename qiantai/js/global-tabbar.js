/**
 * 全局底部导航栏 - 统一管理，切换页面时不刷新
 * 确保所有页面使用同一个底部导航栏实例
 */

(function() {
    'use strict';

    const TABBAR_ID = 'global-tabbar';
    const ACTIVE_TAB_KEY = 'global-tabbar-active-tab';

    /**
     * 创建全局底部导航栏HTML
     */
    function createTabbarHTML() {
        return `
            <nav class="tabbar" id="${TABBAR_ID}">
                <a class="tab" data-tab="home" href="index.html">
                    <div class="ico ico-home"></div>
                    <div class="txt">首页</div>
                </a>
                <a class="tab" data-tab="market" href="market.html">
                    <div class="ico ico-finance"></div>
                    <div class="txt">数据</div>
                </a>
                <a class="tab" data-tab="projects" href="projects.html">
                    <div class="ico ico-market"></div>
                    <div class="txt">项目</div>
                </a>
                <a class="tab" data-tab="messages" href="messages.html">
                    <div class="ico ico-message"></div>
                    <div class="txt">消息</div>
                </a>
                <a class="tab" data-tab="profile" href="profile.html">
                    <div class="ico ico-me"></div>
                    <div class="txt">我的</div>
                </a>
            </nav>
        `;
    }

    /**
     * 获取当前页面对应的tab标识
     */
    function getCurrentTab() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || '';

        if (filename === 'index.html' || filename === '' || path.endsWith('/')) {
            return 'home';
        } else if (filename === 'market.html') {
            return 'market';
        } else if (filename === 'projects.html') {
            return 'projects';
        } else if (filename === 'messages.html') {
            return 'messages';
        } else if (filename === 'profile.html') {
            return 'profile';
        }

        return null;
    }

    /**
     * 激活对应的tab
     */
    function activateTab(tabName) {
        const tabbar = document.getElementById(TABBAR_ID);
        if (!tabbar) return;

        const tabs = tabbar.querySelectorAll('.tab');
        tabs.forEach(tab => {
            const tabData = tab.getAttribute('data-tab');
            if (tabData === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // 保存当前激活的tab
        localStorage.setItem(ACTIVE_TAB_KEY, tabName);
    }

    /**
     * 初始化全局底部导航栏
     */
    function initGlobalTabbar() {
        // 检查是否已经存在全局tabbar
        let tabbar = document.getElementById(TABBAR_ID);

        if (!tabbar) {
            // 移除页面中所有现有的tabbar
            const existingTabbars = document.querySelectorAll('.tabbar');
            existingTabbars.forEach(tb => {
                if (tb.id !== TABBAR_ID) {
                    tb.remove();
                }
            });

            // 创建新的全局tabbar
            const tabbarHTML = createTabbarHTML();
            document.body.insertAdjacentHTML('beforeend', tabbarHTML);
            tabbar = document.getElementById(TABBAR_ID);
        }

        // 绑定点击事件（使用事件委托，避免重复绑定）
        if (!tabbar.dataset.bound) {
            const clickHandler = function(e) {
                const tab = e.target.closest('.tab');
                if (!tab) return;

                e.preventDefault();
                const tabName = tab.getAttribute('data-tab');
                const href = tab.getAttribute('href');

                if (href) {
                    // 激活tab
                    activateTab(tabName);

                    // 跳转页面（不刷新tabbar）
                    window.location.href = href;
                }
            };

            tabbar.addEventListener('click', clickHandler, { passive: false });
            tabbar.dataset.bound = 'true';
            tabbar.dataset.clickHandler = 'bound'; // 标记已绑定

            // 存储清理函数
            tabbar._cleanup = function() {
                tabbar.removeEventListener('click', clickHandler);
                tabbar.dataset.bound = 'false';
                delete tabbar._cleanup;
            };
        }

        // 根据当前页面激活对应的tab
        const currentTab = getCurrentTab();
        if (currentTab) {
            activateTab(currentTab);
        } else {
            // 如果没有匹配的页面，尝试从localStorage恢复
            const savedTab = localStorage.getItem(ACTIVE_TAB_KEY);
            if (savedTab) {
                activateTab(savedTab);
            }
        }
    }

    /**
     * 移除页面中所有非全局的tabbar
     */
    function removeLocalTabbars() {
        const allTabbars = document.querySelectorAll('.tabbar');
        allTabbars.forEach(tabbar => {
            if (tabbar.id !== TABBAR_ID) {
                tabbar.remove();
            }
        });
    }

    // 页面加载完成后初始化（使用once选项避免重复绑定）
    const initHandler = function() {
        removeLocalTabbars();
        initGlobalTabbar();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHandler, { once: true });
    } else {
        initHandler();
    }

    // 页面卸载时清理
    window.addEventListener('beforeunload', function() {
        const tabbar = document.getElementById('global-tabbar');
        if (tabbar && tabbar._cleanup) {
            tabbar._cleanup();
        }
    }, { once: true });

    // 导出到全局，方便其他脚本调用
    window.GlobalTabbar = {
        activate: activateTab,
        getCurrentTab: getCurrentTab,
        init: initGlobalTabbar
    };

})();
