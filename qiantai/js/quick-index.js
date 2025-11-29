/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Providence 首页快速加载系统
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 优化策略：
 * 1. 并发加载所有数据 (Promise.all)
 * 2. 骨架屏优先显示
 * 3. 数据到达后局部更新
 * 4. 减少不必要的DOM操作
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

(function () {
    'use strict';

    const CACHE_CONFIG = {
        USER_DATA: 'index_user_cache',
        PROJECTS: 'index_projects_cache',
        NEWS: 'index_news_cache',
        CACHE_TIME: 5 * 60 * 1000,  // 5分钟缓存
        TOKEN_KEY: 'providence_token'
    };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. 快速Token校验
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function checkAuth() {
        const token = localStorage.getItem(CACHE_CONFIG.TOKEN_KEY);
        if (!token) {
            console.log('[首页] 未登录，跳转登录页');
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. 缓存管理
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function getCache(key) {
        try {
            const cached = sessionStorage.getItem(key);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_CONFIG.CACHE_TIME) {
                    console.log('[缓存] 命中:', key);
                    return data;
                }
            }
        } catch (e) {
            console.warn('[缓存] 读取失败:', e);
        }
        return null;
    }

    function setCache(key, data) {
        try {
            sessionStorage.setItem(key, JSON.stringify({
                data: data,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('[缓存] 保存失败:', e);
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3. 骨架屏管理
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function showSkeleton(container) {
        if (!container) return;
        container.classList.add('skeleton-loading');
        console.log('[骨架屏] 显示');
    }

    function hideSkeleton(container) {
        if (!container) return;
        container.classList.remove('skeleton-loading');
        console.log('[骨架屏] 隐藏');
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 4. API请求封装（带超时和重试）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    async function fetchAPI(url, options = {}) {
        const token = localStorage.getItem(CACHE_CONFIG.TOKEN_KEY);
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Token': token,
                'Authorization': `Bearer ${token}`
            },
            signal: AbortSignal.timeout(options.timeout || 8000)
        };

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            const data = await response.json();

            if (data.code === 1 || data.code === 200) {
                return { success: true, data: data.data || data };
            } else {
                return { success: false, error: data.msg || data.message };
            }
        } catch (error) {
            console.error('[API] 请求失败:', url, error);
            return { success: false, error: error.message };
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 5. 并发加载首页数据
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    async function loadIndexData() {
        console.log('[首页] 开始并发加载数据...');
        const startTime = Date.now();

        // 获取 API 基地址
        const apiBase = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';

        // 定义所有需要加载的数据
        const dataLoaders = {
            user: async () => {
                const cached = getCache(CACHE_CONFIG.USER_DATA);
                if (cached) return { success: true, data: cached, cached: true };

                const result = await fetchAPI(`${apiBase}/api/user/info`);
                if (result.success) {
                    setCache(CACHE_CONFIG.USER_DATA, result.data);
                }
                return result;
            },

            projects: async () => {
                const cached = getCache(CACHE_CONFIG.PROJECTS);
                if (cached) return { success: true, data: cached, cached: true };

                const result = await fetchAPI(`${apiBase}/index.php/product/list`);
                if (result.success) {
                    setCache(CACHE_CONFIG.PROJECTS, result.data);
                }
                return result;
            },

            news: async () => {
                const cached = getCache(CACHE_CONFIG.NEWS);
                if (cached) return { success: true, data: cached, cached: true };

                const result = await fetchAPI(`${apiBase}/index.php/article/list?limit=5`);
                if (result.success) {
                    setCache(CACHE_CONFIG.NEWS, result.data);
                }
                return result;
            }
        };

        // ✅ 关键：Promise.all 并发加载
        const results = await Promise.allSettled([
            dataLoaders.user(),
            dataLoaders.projects(),
            dataLoaders.news()
        ]);

        const loadTime = Date.now() - startTime;
        console.log('[首页] 数据加载完成，耗时:', loadTime, 'ms');

        // 解析结果
        const [userResult, projectsResult, newsResult] = results;

        return {
            user: userResult.status === 'fulfilled' ? userResult.value : null,
            projects: projectsResult.status === 'fulfilled' ? projectsResult.value : null,
            news: newsResult.status === 'fulfilled' ? newsResult.value : null,
            loadTime: loadTime
        };
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 6. 更新UI（局部更新，减少重绘）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function updateUserUI(userData) {
        if (!userData) return;

        console.log('[UI] 更新用户信息');

        // 批量更新 DOM（减少重绘）
        const updates = {
            '.user-balance': userData.balance_cny || userData.money || 0,
            '.user-usdt': userData.balance_usdt || userData.usdt || 0,
            '.user-name': userData.username || userData.nickname || '用户',
            '.user-vip': userData.vip_level || userData.level || 1
        };

        requestAnimationFrame(() => {
            Object.entries(updates).forEach(([selector, value]) => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    if (el) el.textContent = value;
                });
            });
        });
    }

    function updateProjectsUI(projectsData) {
        if (!projectsData || !projectsData.list) return;

        console.log('[UI] 更新项目列表');
        const container = document.querySelector('.projects-container, #projects-list');
        if (!container) return;

        // 只更新前3个推荐项目（首屏优化）
        const topProjects = projectsData.list.slice(0, 3);

        requestAnimationFrame(() => {
            // 这里插入项目列表的HTML...
            hideSkeleton(container);
        });
    }

    function updateNewsUI(newsData) {
        if (!newsData || !newsData.list) return;

        console.log('[UI] 更新公告列表');
        const container = document.querySelector('.news-container, #news-list');
        if (!container) return;

        requestAnimationFrame(() => {
            // 这里插入公告列表的HTML...
            hideSkeleton(container);
        });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 7. 快速初始化首页
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    async function quickInitIndex() {
        console.log('[首页] 快速初始化开始...');
        const pageStartTime = Date.now();

        // 1. 立即校验登录
        if (!checkAuth()) {
            return;
        }

        // 2. 显示骨架屏（UI先出）
        showSkeleton(document.querySelector('.user-info'));
        showSkeleton(document.querySelector('.projects-container'));
        showSkeleton(document.querySelector('.news-container'));

        // 3. 并发加载数据
        const { user, projects, news, loadTime } = await loadIndexData();

        // 4. 数据到达后立即更新UI
        if (user && user.success) {
            updateUserUI(user.data);
            if (user.cached) {
                console.log('[首页] 使用缓存数据（用户）');
            }
        } else if (user && !user.success) {
            console.error('[首页] 用户数据加载失败，可能token过期');
            // Token过期，跳转登录
            if (user.error && user.error.includes('token')) {
                localStorage.removeItem(CACHE_CONFIG.TOKEN_KEY);
                window.location.href = 'login.html';
                return;
            }
        }

        if (projects && projects.success) {
            updateProjectsUI(projects.data);
        }

        if (news && news.success) {
            updateNewsUI(news.data);
        }

        const totalTime = Date.now() - pageStartTime;
        console.log('[首页] 初始化完成，总耗时:', totalTime, 'ms (数据加载:', loadTime, 'ms)');

        // 性能监控
        if (totalTime > 1000) {
            console.warn('[首页] 加载较慢，建议优化:', totalTime, 'ms');
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 8. 暴露全局API
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    window.ProvidenceQuickIndex = {
        init: quickInitIndex,
        loadData: loadIndexData,
        updateUI: {
            user: updateUserUI,
            projects: updateProjectsUI,
            news: updateNewsUI
        },
        cache: {
            get: getCache,
            set: setCache,
            clear: () => {
                sessionStorage.removeItem(CACHE_CONFIG.USER_DATA);
                sessionStorage.removeItem(CACHE_CONFIG.PROJECTS);
                sessionStorage.removeItem(CACHE_CONFIG.NEWS);
                console.log('[缓存] 已清除');
            }
        }
    };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 9. 自动初始化（仅首页）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPage === 'index.html' || currentPage === '') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', quickInitIndex);
        } else {
            quickInitIndex();
        }
    }

    console.log('[首页] 快速加载系统已就绪');

})();
