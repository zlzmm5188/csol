// =============================================
// profile.js - Integration Spec 修复版本
// 版本: 2.0.0 (Integration Spec统一规范)
// 日期: 2025-11-23
// =============================================

let userData = {
    token: '',
    id: 0,
    user_id: 0,
    username: '',
    real_name: '',
    balance_cny: 0,
    balance_usdt: 0,
    frozen_cny: 0,
    frozen_usdt: 0,
    ribao_cny: 0,
    ribao_usdt: 0,
    points: 0,
    vip_level: 0,
    total_invest: 0,
    invite_code: '',
    team_count: 0,
    is_kyc: 0
};

// ===================================
// 页面加载
// ===================================
document.addEventListener('DOMContentLoaded', function () {
    console.log('[Profile] 页面开始加载，检查Token...');

    // 检查URL参数，看是否从登录页跳转过来
    const urlParams = new URLSearchParams(window.location.search);
    const fromLogin = urlParams.get('from') === 'login';

    if (fromLogin) {
        console.log('[Profile] 从登录页跳转，给Token更多加载时间...');
        setTimeout(() => {
            checkAndLoadUser();
        }, 300);
    } else {
        checkAndLoadUser();
    }
});

// ===================================
// Token检查和用户数据加载
// ===================================
function checkAndLoadUser() {
    // 使用TokenManager统一读取Token
    let token = null;

    if (typeof TokenManager !== 'undefined' && TokenManager.getToken) {
        token = TokenManager.getToken();
        console.log('[Profile] TokenManager Token状态:', token ? ('✅ 找到: ' + token.substring(0, 20) + '...') : '❌ 未找到');
    } else {
        // 降级方案：直接读取
        token = sessionStorage.getItem('providence_token') || localStorage.getItem('providence_token') || '';
        console.log('[Profile] 降级模式 Token状态:', token ? ('✅ 找到: ' + token.substring(0, 20) + '...') : '❌ 未找到');
    }

    if (!token) {
        // 未登录，跳转到登录页
        console.warn('[Profile] 未找到Token，跳转到登录页');
        const redirectUrl = encodeURIComponent(location.href);
        window.location.href = `login.html?redirect=${redirectUrl}`;
        return;
    }

    // 有Token，保存并加载用户数据
    userData.token = token;
    initPage();
    loadUserData();
    bindEvents();
}

// ===================================
// 初始化页面
// ===================================
function initPage() {
    const token = TokenManager?.getToken() || localStorage.getItem('providence_token') || '';
    if (token) {
        userData.token = token;
    }
}

// ===================================
// 加载用户数据（使用统一API客户端）
// ===================================
let isLoading = false;
let lastLoadTime = 0;
const CACHE_DURATION = 3000;

async function loadUserData() {
    // 防止并发请求
    if (isLoading) {
        return;
    }

    // 缓存检查
    const now = Date.now();
    if (lastLoadTime > 0 && (now - lastLoadTime) < CACHE_DURATION) {
        return;
    }

    isLoading = true;

    try {
        // ✅ 使用统一API客户端（Integration Spec规范）
        let response = null;

        if (typeof ApiClient !== 'undefined') {
            // 使用ApiClient
            response = await ApiClient.get('/api/user/info');
        } else {
            // 降级方案：使用fetch
            const API_BASE = window.API_CONFIG?.baseURL || 'http://localhost:8888/api';
            const token = TokenManager?.getToken() || localStorage.getItem('providence_token') || '';

            const res = await fetch(`${API_BASE}/api/user/info`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Token': token  // ✅ 统一使用'Token'（首字母大写）
                }
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            response = await res.json();
        }

        // ✅ 统一响应格式检查（Integration Spec规范）
        if (response && (response.code === 1 || response.code === 200) && response.data) {
            const data = response.data;

            // ✅ 字段对齐（Integration Spec规范）
            userData = {
                ...userData,
                id: data.id || data.user_id || data.uid || 0,
                user_id: data.user_id || data.id || data.uid || 0,
                username: data.username || '',
                real_name: data.real_name || data.realname || '',
                balance_cny: parseFloat(data.balance_cny || 0),
                balance_usdt: parseFloat(data.balance_usdt || 0),
                frozen_cny: parseFloat(data.frozen_cny || 0),
                frozen_usdt: parseFloat(data.frozen_usdt || 0),
                ribao_cny: parseFloat(data.ribao_cny || 0),
                ribao_usdt: parseFloat(data.ribao_usdt || 0),
                points: parseInt(data.points || 0),
                vip_level: parseInt(data.vip_level || 0),
                total_invest: parseFloat(data.total_invest || 0),
                invite_code: data.invite_code || data.invite || '',
                team_count: parseInt(data.team_count || 0),
                is_kyc: parseInt(data.is_kyc || 0)
            };

            lastLoadTime = Date.now();

            // 更新UI
            requestAnimationFrame(() => {
                updateUI(userData);
            });
        } else {
            console.error('[Profile] 获取用户信息失败:', response?.msg || '未知错误');
            if (response?.code === -1) {
                // Token过期，ApiClient会自动处理跳转
                console.warn('[Profile] Token过期，等待自动跳转');
            }
        }
    } catch (error) {
        console.error('[Profile] 加载用户数据失败:', error);
    } finally {
        isLoading = false;
    }
}

// ===================================
// 更新UI
// ===================================
function updateUI(data) {
    // 更新用户名
    const usernameEl = document.querySelector('.username, #username, [data-username]');
    if (usernameEl) {
        usernameEl.textContent = data.username || 'User';
    }

    // 更新余额
    const balanceCnyEl = document.querySelector('.balance-cny, #balance-cny, [data-balance-cny]');
    if (balanceCnyEl) {
        balanceCnyEl.textContent = data.balance_cny.toFixed(2);
    }

    const balanceUsdtEl = document.querySelector('.balance-usdt, #balance-usdt, [data-balance-usdt]');
    if (balanceUsdtEl) {
        balanceUsdtEl.textContent = data.balance_usdt.toFixed(2);
    }

    // 更新VIP等级
    const vipLevelEl = document.querySelector('.vip-level, #vip-level, [data-vip-level]');
    if (vipLevelEl) {
        vipLevelEl.textContent = `VIP${data.vip_level}`;
    }

    // 更新积分
    const pointsEl = document.querySelector('.points, #points, [data-points]');
    if (pointsEl) {
        pointsEl.textContent = data.points || 0;
    }

    // 更新团队人数
    const teamCountEl = document.querySelector('.team-count, #team-count, [data-team-count]');
    if (teamCountEl) {
        teamCountEl.textContent = data.team_count || 0;
    }
}

// ===================================
// 绑定事件
// ===================================
function bindEvents() {
    // 登出按钮
    const logoutBtn = document.querySelector('.logout-btn, #logout-btn, [data-logout]');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (typeof showConfirm === 'function') {
                showConfirm('', '确定要退出登录吗？', function() {
                    TokenManager?.clearToken();
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                });
            } else {
                if (confirm('确定要退出登录吗？')) {
                    TokenManager?.clearToken();
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                }
            }
        });
    }

    // 刷新按钮
    const refreshBtn = document.querySelector('.refresh-btn, #refresh-btn, [data-refresh]');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            lastLoadTime = 0; // 清除缓存
            loadUserData();
        });
    }
}

// ===================================
// 导出函数（供其他脚本调用）
// ===================================
window.profileModule = {
    loadUserData,
    updateUI,
    userData: () => userData
};

console.log('[Profile] ✅ 个人中心模块已加载（Integration Spec规范版本）');
