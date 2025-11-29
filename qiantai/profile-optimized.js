// Providence Profile - 优化生产版本 v6.0
// 功能：骨架屏、数据格式化、下拉刷新、错误处理

(function() {
    'use strict';

    // 防止重复执行
    if (window.__PROFILE_LOADED__) return;
    window.__PROFILE_LOADED__ = true;

    // 调试模式（生产环境设为 false）
    const DEBUG = false;
    const log = (...args) => DEBUG && console.log('[Profile]', ...args);

    // ========================================
    // 字段映射函数
    // ========================================
    function mapUserData(raw) {
        return {
            id: raw.id,
            username: raw.username,
            uid: raw.uid,
            balance_cny: raw.balance_cny ?? raw.cny_balance ?? raw.money ?? 0,
            balance_usdt: raw.balance_usdt ?? raw.usdt_balance ?? 0,
            total_profit_cny: raw.total_profit_cny ?? raw.total_profit ?? raw.tfund ?? 0,
            total_profit_usdt: raw.total_profit_usdt ?? raw.total_profit ?? raw.tfund ?? 0,
            ribao_balance: raw.ribao_balance ?? raw.ribao ?? 0,
            today_profit: raw.today_profit ?? raw.tfund ?? 0,
            yesterday_profit: raw.yesterday_profit ?? 0,
            points: raw.points ?? 0,
            active_count: raw.active_count ?? raw.running_orders ?? 0,
            vip_level: raw.vip_level ?? raw.level ?? 1,
            vip_name: raw.vip_name ?? raw.vip_benefits ?? ('VIP' + (raw.vip_level ?? 1)),
            created_at: raw.created_at ?? '',
            realname_status: raw.realname_status ?? 0,
        };
    }

    // ========================================
    // 工具函数
    // ========================================
    function formatMoney(value, decimals = 2) {
        const num = Number(value || 0);
        return num.toLocaleString('zh-CN', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    function animateNumber(element, start, end, duration = 800) {
        if (!element) return;

        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = formatMoney(current);
        }, 16);
    }

    // ========================================
    // 骨架屏控制
    // ========================================
    function showSkeleton() {
        document.querySelectorAll('.skeleton').forEach(el => {
            el.classList.add('skeleton-loading');
        });
    }

    function hideSkeleton() {
        document.querySelectorAll('.skeleton').forEach(el => {
            el.classList.remove('skeleton-loading');
        });
    }

    // ========================================
    // 数据管理
    // ========================================
    let userData = {};
    let isLoading = false;

    async function loadUserData(showLoading = true) {
        if (isLoading) return;
        isLoading = true;

        if (showLoading) showSkeleton();

        try {
            const token = TokenManager?.getToken() || localStorage.getItem('providence_token') || '';

            if (!token) {
                window.location.href = 'login.html';
                return;
            }

            const API_BASE = 'https://api.4kp3l0iq.top';
            const response = await fetch(API_BASE + '/api/user/info', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Token': token
                }
            });

            if (!response.ok) {
                throw new Error('网络请求失败');
            }

            const result = await response.json();
            log('API响应:', result);

            if (result.code === 401) {
                localStorage.clear();
                window.location.href = 'login.html';
                return;
            }

            if (result.code === 200 || result.code === 1) {
                const mappedData = mapUserData(result.data);
                Object.assign(userData, mappedData);

                // 保存到缓存
                localStorage.setItem('profile_cached_data', JSON.stringify({
                    ...mappedData,
                    timestamp: Date.now()
                }));

                updateUI();
                return true;
            } else {
                showError('数据加载失败: ' + (result.message || '未知错误'));
                return false;
            }

        } catch (error) {
            log('加载失败:', error);
            showError('网络连接失败，请稍后重试');
            return false;
        } finally {
            isLoading = false;
            hideSkeleton();
        }
    }

    // ========================================
    // UI 更新
    // ========================================
    function updateUI() {
        log('更新UI');

        // 用户名
        updateElement('userNameDisplay', userData.username);

        // 余额（带动画）
        const cnyEl = document.getElementById('totalAsset');
        const usdtEl = document.getElementById('totalUsdtAsset');

        if (cnyEl) {
            const oldValue = parseFloat(cnyEl.textContent.replace(/,/g, '')) || 0;
            const newValue = Number(userData.balance_cny || 0);
            animateNumber(cnyEl, oldValue, newValue);
        }

        if (usdtEl) {
            const oldValue = parseFloat(usdtEl.textContent.replace(/,/g, '')) || 0;
            const newValue = Number(userData.balance_usdt || 0);
            animateNumber(usdtEl, oldValue, newValue);
        }

        // 收益
        updateElement('totalIncomeCny', formatMoney(userData.total_profit_cny));
        updateElement('totalUsdtIncome', formatMoney(userData.total_profit_usdt));

        // VIP
        const vipText = userData.vip_name || ('VIP' + userData.vip_level);
        ['vipLevel', 'vip-level', 'user-vip', 'vipCard'].forEach(id => {
            updateElement(id, vipText);
        });

        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('profileDataLoaded', { detail: userData }));
    }

    function updateElement(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value;
            log(`✅ ${id} = ${value}`);
        }
    }

    // ========================================
    // 错误提示
    // ========================================
    function showError(message) {
        if (window.showToast) {
            window.showToast('', message);
        } else {
            alert(message);
        }
    }

    // ========================================
    // 下拉刷新
    // ========================================
    function initPullToRefresh() {
        const container = document.querySelector('.scrollable-content');
        if (!container) return;

        let startY = 0;
        let pulling = false;

        container.addEventListener('touchstart', (e) => {
            if (container.scrollTop === 0) {
                startY = e.touches[0].pageY;
                pulling = true;
            }
        });

        container.addEventListener('touchmove', (e) => {
            if (!pulling) return;

            const currentY = e.touches[0].pageY;
            const diff = currentY - startY;

            if (diff > 80 && !isLoading) {
                pulling = false;
                loadUserData(true);
            }
        });

        container.addEventListener('touchend', () => {
            pulling = false;
        });
    }

    // ========================================
    // 初始化
    // ========================================
    document.addEventListener('DOMContentLoaded', async function() {
        log('页面加载');

        // 先尝试加载缓存
        try {
            const cached = localStorage.getItem('profile_cached_data');
            if (cached) {
                const data = JSON.parse(cached);
                if (Date.now() - (data.timestamp || 0) < 5 * 60 * 1000) {
                    Object.assign(userData, data);
                    updateUI();
                    log('使用缓存数据');
                }
            }
        } catch (e) {
            log('缓存加载失败:', e);
        }

        // 加载最新数据
        await loadUserData(!Object.keys(userData).length);

        // 初始化下拉刷新
        initPullToRefresh();

        // 绑定退出登录
        document.querySelectorAll('[data-action="logout"]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (window.showConfirm) {
                    window.showConfirm('', '确定要退出登录吗？', () => {
                        TokenManager?.clearToken();
                        localStorage.clear();
                        window.location.href = 'login.html';
                    });
                } else if (typeof showConfirm === 'function') {
                    showConfirm('', '确定要退出登录吗？', function() {
                        TokenManager?.clearToken();
                        localStorage.clear();
                        window.location.href = 'login.html';
                    });
                }
            });
        });

        log('初始化完成');
    });

    // 导出刷新函数供外部调用
    window.refreshProfile = () => loadUserData(true);

})();
