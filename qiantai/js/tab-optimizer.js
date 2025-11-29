/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Providence Tab切换优化
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 功能：
 * 1. 监听Tab切换到"我的"页面
 * 2. 智能判断是否需要刷新数据
 * 3. 预加载相邻Tab数据
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

(function() {
    'use strict';

    const CONFIG = {
        PROFILE_PAGES: ['profile.html', 'me.html', 'user.html'],
        PRELOAD_DELAY: 1000, // 预加载延迟
        DEBUG: true
    };

    function log(...args) {
        if (CONFIG.DEBUG) {
            console.log('%c[TabOptimizer]', 'color: #a78bfa; font-weight: bold', ...args);
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 检查是否为Profile页面
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function isProfilePage() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        return CONFIG.PROFILE_PAGES.includes(currentPage);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 监听Tab切换
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    let lastPage = window.location.pathname;
    let lastVisitTime = {};

    function handlePageChange() {
        const currentPage = window.location.pathname;

        if (currentPage === lastPage) {
            return;
        }

        log('页面切换:', lastPage, '→', currentPage);

        // 如果切换到Profile页面
        if (isProfilePage()) {
            handleProfilePageEnter();
        }

        lastPage = currentPage;
    }

    function handleProfilePageEnter() {
        log('进入Profile页面');

        // 记录访问时间
        const now = Date.now();
        const lastVisit = lastVisitTime['profile'] || 0;
        const timeSinceLastVisit = (now - lastVisit) / 1000;

        lastVisitTime['profile'] = now;

        // 如果刚刚访问过（<5秒），跳过刷新
        if (timeSinceLastVisit < 5) {
            log('⏩ 刚访问过 (', timeSinceLastVisit.toFixed(1), '秒前)，跳过刷新');
            return;
        }

        // 如果有缓存且新鲜，跳过刷新
        if (window.ProvidenceUserStore && window.ProvidenceUserStore.isValid()) {
            const age = window.ProvidenceUserStore.getCacheAge();
            if (age < 30) {
                log('⏩ 缓存新鲜 (', age.toFixed(1), '秒)，跳过刷新');
                return;
            }
        }

        // 否则，刷新数据
        log('🔄 触发数据刷新');
        if (window.ProvidenceProfile) {
            window.ProvidenceProfile.refresh();
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 预加载机制
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function preloadUserData() {
        // 如果已经有新鲜缓存，跳过
        if (window.ProvidenceUserStore && window.ProvidenceUserStore.isValid()) {
            const age = window.ProvidenceUserStore.getCacheAge();
            if (age < 60) {
                log('⏩ 已有缓存 (', age.toFixed(1), '秒)，跳过预加载');
                return;
            }
        }

        log('🔄 预加载用户数据...');

        // 延迟预加载，避免影响当前页面
        setTimeout(async () => {
            try {
                const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
                const token = localStorage.getItem('providence_token');

                if (!token) {
                    log('⚠️ 无Token，跳过预加载');
                    return;
                }

                const response = await fetch(API_BASE + '/api/user/info', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Token': token,
                        'Authorization': `Bearer ${token}`
                    },
                    signal: AbortSignal.timeout(8000)
                });

                const data = await response.json();

                if ((data.code === 1 || data.code === 200) && data.data) {
                    log('✅ 预加载成功');
                    if (window.ProvidenceUserStore) {
                        window.ProvidenceUserStore.setUserData(data.data);
                    }
                } else {
                    log('⚠️ 预加载失败:', data.msg || data.message);
                }
            } catch (error) {
                log('❌ 预加载错误:', error.message);
            }
        }, CONFIG.PRELOAD_DELAY);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 初始化
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function init() {
        log('初始化Tab优化器');

        // 监听 popstate（浏览器前进后退）
        window.addEventListener('popstate', handlePageChange);

        // 监听 hashchange（哈希路由）
        window.addEventListener('hashchange', handlePageChange);

        // 监听页面可见性
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && isProfilePage()) {
                log('页面可见，检查是否需要刷新');
                handleProfilePageEnter();
            }
        });

        // 如果不在Profile页面，预加载用户数据
        if (!isProfilePage()) {
            const token = localStorage.getItem('providence_token');
            if (token) {
                log('非Profile页面，启动预加载');
                preloadUserData();
            }
        }
    }

    // 暴露API
    window.ProvidenceTabOptimizer = {
        init: init,
        preload: preloadUserData
    };

    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    log('Tab优化器已加载');

})();
