/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Providence Profile 页面 - 优化版
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 优化点：
 * 1. 使用全局UserStore缓存数据
 * 2. 先显示缓存，后台刷新
 * 3. 防抖请求，避免重复加载
 * 4. 骨架屏占位，避免白屏
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

(function() {
    'use strict';

    //  配置
    const CONFIG = {
        DEBOUNCE_TIME: 500, // 防抖时间
        MIN_CACHE_AGE: 30, // 最小缓存有效期（秒）
        DEBUG: true
    };

    // 状态
    let state = {
        isLoading: false,
        lastLoadTime: 0,
        loadPromise: null
    };

    // 日志
    function log(...args) {
        if (CONFIG.DEBUG) {
            console.log('%c[Profile]', 'color: #60a5fa; font-weight: bold', ...args);
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. 快速显示缓存数据
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function showCachedData() {
        if (!window.ProvidenceUserStore) {
            log('⚠️ UserStore未加载');
            return false;
        }

        const userData = window.ProvidenceUserStore.getUserData();
        if (!userData) {
            log('无缓存数据');
            return false;
        }

        const age = window.ProvidenceUserStore.getCacheAge();
        log('显示缓存数据 (', age.toFixed(1), '秒前)');

        // 更新UI
        updateUI(userData);
        return true;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. 后台刷新数据
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    async function refreshData(force = false) {
        // 防抖：如果正在加载或刚加载过，跳过
        if (state.isLoading) {
            log('⏩ 正在加载，跳过重复请求');
            return state.loadPromise;
        }

        const timeSinceLastLoad = (Date.now() - state.lastLoadTime) / 1000;
        if (!force && timeSinceLastLoad < CONFIG.DEBOUNCE_TIME / 1000) {
            log('⏩ 距上次加载仅', timeSinceLastLoad.toFixed(1), '秒，跳过');
            return;
        }

        // 检查缓存是否新鲜
        if (!force && window.ProvidenceUserStore && window.ProvidenceUserStore.isValid()) {
            const age = window.ProvidenceUserStore.getCacheAge();
            if (age < CONFIG.MIN_CACHE_AGE) {
                log('⏩ 缓存仍新鲜 (', age.toFixed(1), '秒)，跳过刷新');
                return;
            }
        }

        state.isLoading = true;
        state.lastLoadTime = Date.now();

        if (window.ProvidenceUserStore) {
            window.ProvidenceUserStore.setLoading(true);
        }

        log('🔄 开始刷新数据...');

        // 创建加载Promise
        state.loadPromise = (async () => {
            try {
                const startTime = Date.now();
                const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
                const token = localStorage.getItem('providence_token');

                if (!token) {
                    log('❌ 无Token，跳转登录');
                    window.location.href = 'login.html';
                    return null;
                }

                const response = await fetch(API_BASE + '/api/user/info', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Token': token,
                        'Authorization': `Bearer ${token}`
                    },
                    signal: AbortSignal.timeout(10000)
                });

                const data = await response.json();
                const requestTime = Date.now() - startTime;

                if ((data.code === 1 || data.code === 200) && data.data) {
                    log('✅ 数据刷新成功 (', requestTime, 'ms)');

                    // 保存到全局Store
                    if (window.ProvidenceUserStore) {
                        window.ProvidenceUserStore.setUserData(data.data);
                    }

                    // 更新UI
                    updateUI(data.data);

                    return data.data;
                } else {
                    log('❌ API错误:', data.msg || data.message);

                    // 如果是token过期，清除缓存并跳转
                    if (data.code === -1 || data.message?.includes('token')) {
                        if (window.ProvidenceUserStore) {
                            window.ProvidenceUserStore.clear();
                        }
                        localStorage.removeItem('providence_token');
                        window.location.href = 'login.html';
                    }

                    return null;
                }
            } catch (error) {
                log('❌ 请求失败:', error.message);

                // 网络错误时，继续使用缓存数据
                if (window.ProvidenceUserStore && window.ProvidenceUserStore.getUserData()) {
                    log('⚠️ 使用缓存数据继续');
                }

                return null;
            } finally {
                state.isLoading = false;
                state.loadPromise = null;

                if (window.ProvidenceUserStore) {
                    window.ProvidenceUserStore.setLoading(false);
                }
            }
        })();

        return state.loadPromise;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3. 更新UI
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function updateUI(userData) {
        if (!userData) return;

        log('更新UI');

        // 使用 requestAnimationFrame 批量更新DOM
        requestAnimationFrame(() => {
            // 基本信息
            const usernameEl = document.getElementById('username');
            if (usernameEl) {
                usernameEl.textContent = userData.username || userData.nickname || '用户';
            }

            // CNY余额
            const moneyCnyEl = document.getElementById('moneyCny');
            if (moneyCnyEl) {
                const balance = parseFloat(userData.balance_cny || userData.money || 0);
                moneyCnyEl.textContent = balance.toFixed(2);
            }

            // USDT余额
            const moneyUsdtEl = document.getElementById('moneyUsdt');
            if (moneyUsdtEl) {
                const balance = parseFloat(userData.balance_usdt || userData.usdt_money || 0);
                moneyUsdtEl.textContent = balance.toFixed(2);
            }

            // CNY收益
            const totalIncomeCnyEl = document.getElementById('totalIncomeCny');
            if (totalIncomeCnyEl) {
                const income = parseFloat(userData.total_income_cny || userData.profit || 0);
                totalIncomeCnyEl.textContent = income.toFixed(2);
            }

            // USDT收益
            const totalIncomeUsdtEl = document.getElementById('totalIncomeUsdt');
            if (totalIncomeUsdtEl) {
                const income = parseFloat(userData.total_income_usdt || 0);
                totalIncomeUsdtEl.textContent = income.toFixed(2);
            }

            // VIP等级
            const vipLevelEl = document.getElementById('vipLevel');
            if (vipLevelEl) {
                vipLevelEl.textContent = 'VIP' + (userData.vip_level || userData.level || 1);
            }

            // 邀请码
            const inviteCodeEl = document.getElementById('inviteCode');
            if (inviteCodeEl) {
                inviteCodeEl.textContent = userData.invite_code || '';
            }

            // 移除骨架屏
            removeSkeleton();
        });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 4. 骨架屏管理
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function showSkeleton() {
        const elements = document.querySelectorAll('[data-skeleton]');
        elements.forEach(el => {
            el.classList.add('skeleton-loading');
        });
    }

    function removeSkeleton() {
        const elements = document.querySelectorAll('[data-skeleton]');
        elements.forEach(el => {
            el.classList.remove('skeleton-loading');
        });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 5. 页面可见性监听
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function handleVisibilityChange() {
        if (document.hidden) {
            log('页面隐藏');
            return;
        }

        log('页面可见');

        // 检查缓存是否过期
        if (window.ProvidenceUserStore && !window.ProvidenceUserStore.isValid()) {
            log('缓存已过期，自动刷新');
            refreshData();
        } else if (window.ProvidenceUserStore) {
            const age = window.ProvidenceUserStore.getCacheAge();
            log('缓存仍有效 (', age.toFixed(1), '秒)');
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 6. 初始化
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    async function init() {
        log('初始化Profile页面');

        // 检查token
        const token = localStorage.getItem('providence_token');
        if (!token) {
            log('❌ 无Token，跳转登录');
            window.location.href = 'login.html';
            return;
        }

        // 1. 先尝试显示缓存数据（立即显示）
        const hasCached = showCachedData();

        if (hasCached) {
            // 有缓存：先显示缓存，后台刷新
            log('✅ 使用缓存数据，后台刷新');
            setTimeout(() => refreshData(), 100);
        } else {
            // 无缓存：显示骨架屏，立即加载
            log('⚠️ 无缓存数据，立即加载');
            showSkeleton();
            await refreshData(true);
        }

        // 监听页面可见性
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // 监听Store更新
        if (window.ProvidenceUserStore) {
            window.ProvidenceUserStore.subscribe((event, data) => {
                if (event === 'update') {
                    log('收到Store更新通知');
                    updateUI(data);
                }
            });
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 7. 暴露API
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    window.ProvidenceProfile = {
        init: init,
        refresh: refreshData,
        updateUI: updateUI
    };

    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    log('Profile模块已加载');

})();
