/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Providence 快速登录系统 - 优化版
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 优化点：
 * 1. 移除 config.js 等待，直接内联 API 配置
 * 2. 移除 setTimeout 延迟，立即跳转
 * 3. 登录成功直接跳首页，不经过 splash
 * 4. 标记 splash 已检测，避免重复检测
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. 内联 API 配置（避免异步加载）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const LOGIN_CONFIG = {
    API_BASE: 'https://api.4kp3l0iq.top',
    TOKEN_KEY: 'providence_token',
    USER_ID_KEY: 'providence_user_id',
    USER_NAME_KEY: 'providence_user_name',
    SPLASH_CHECK_KEY: 'splash_checked_at',  // 记录splash检测时间
    SPLASH_VALID_HOURS: 24,  // splash检测有效期24小时
    TIMEOUT: 10000  // API超时10秒
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. 快速登录函数（无延迟）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function quickLogin(username, password) {
    const btn = document.querySelector('.login-btn, #loginBtn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = '登录中...';
    }

    try {
        console.log('[快速登录] 开始:', username);
        const startTime = Date.now();

        // 发送登录请求
        const response = await fetch(LOGIN_CONFIG.API_BASE + '/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password,
                system: 1
            }),
            signal: AbortSignal.timeout(LOGIN_CONFIG.TIMEOUT)
        });

        const data = await response.json();
        const requestTime = Date.now() - startTime;
        console.log('[快速登录] API响应时间:', requestTime, 'ms');

        // 检查登录是否成功
        if ((data.code === 1 || data.code === 200) && data.data) {
            // 立即保存 token
            const token = data.data.token || data.data.access_token;
            if (token) {
                localStorage.setItem(LOGIN_CONFIG.TOKEN_KEY, token);
            }

            // 立即保存用户信息
            const userId = data.data.user?.id || data.data.user_id || data.data.id;
            if (userId) {
                localStorage.setItem(LOGIN_CONFIG.USER_ID_KEY, userId);
            }

            const userName = data.data.user?.username || data.data.username || username;
            if (userName) {
                localStorage.setItem(LOGIN_CONFIG.USER_NAME_KEY, userName);
            }

            // 标记 splash 已检测（避免重复检测）
            markSplashChecked();

            console.log('[快速登录] 成功，耗时:', Date.now() - startTime, 'ms');

            // 显示成功提示（非阻塞）
            if (window.showToast) {
                showToast('登录成功');
            }

            // ✅ 立即跳转，无延迟
            window.location.href = 'index.html';
            return true;

        } else {
            const msg = data.message || data.msg || '账号或密码错误';
            console.error('[快速登录] 失败:', msg);
            if (window.showToast) {
                showToast(msg);
            }
            return false;
        }

    } catch (error) {
        console.error('[快速登录] 错误:', error);
        if (window.showToast) {
            showToast(error.name === 'TimeoutError' ? '网络超时，请重试' : '网络错误，请重试');
        }
        return false;

    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = '登录';
        }
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. Splash 检测管理
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function markSplashChecked() {
    try {
        const now = Date.now();
        localStorage.setItem(LOGIN_CONFIG.SPLASH_CHECK_KEY, now.toString());
        sessionStorage.setItem('from_splash', 'true');
        console.log('[Splash] 已标记为已检测');
    } catch (e) {
        console.error('[Splash] 标记失败:', e);
    }
}

function isSplashCheckValid() {
    try {
        // 检查 sessionStorage（当前会话）
        if (sessionStorage.getItem('from_splash') === 'true') {
            console.log('[Splash] 当前会话已检测');
            return true;
        }

        // 检查 localStorage（24小时有效期）
        const lastCheck = localStorage.getItem(LOGIN_CONFIG.SPLASH_CHECK_KEY);
        if (lastCheck) {
            const hoursSinceCheck = (Date.now() - parseInt(lastCheck)) / (1000 * 60 * 60);
            if (hoursSinceCheck < LOGIN_CONFIG.SPLASH_VALID_HOURS) {
                console.log('[Splash] 检测仍有效，剩余:', (LOGIN_CONFIG.SPLASH_VALID_HOURS - hoursSinceCheck).toFixed(1), '小时');
                // 恢复 sessionStorage 标记
                sessionStorage.setItem('from_splash', 'true');
                return true;
            }
        }

        console.log('[Splash] 需要检测');
        return false;
    } catch (e) {
        console.error('[Splash] 检查失败:', e);
        return false;
    }
}

function shouldSkipSplash() {
    // 1. URL 参数跳过
    if (window.location.search.includes('skip_splash')) {
        console.log('[Splash] URL参数跳过');
        return true;
    }

    // 2. 已检测且在有效期内
    if (isSplashCheckValid()) {
        return true;
    }

    // 3. 来自登录页（刚登录）
    if (document.referrer.includes('login.html')) {
        console.log('[Splash] 来自登录页，跳过');
        markSplashChecked();
        return true;
    }

    return false;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. 快速 Token 校验
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function hasValidToken() {
    try {
        const token = localStorage.getItem(LOGIN_CONFIG.TOKEN_KEY);
        return !!token && token.length > 10;
    } catch (e) {
        return false;
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. 页面初始化（快速判定）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function quickPageInit() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    console.log('[快速初始化] 当前页面:', currentPage);

    // 首页：检查登录状态
    if (currentPage === 'index.html' || currentPage === '') {
        if (!hasValidToken()) {
            console.log('[快速初始化] 未登录，跳转登录页');
            window.location.href = 'login.html';
            return;
        }

        // 检查是否需要 splash
        if (!shouldSkipSplash()) {
            console.log('[快速初始化] 需要 splash 检测');
            window.location.href = 'splash.html';
            return;
        }

        console.log('[快速初始化] 已登录且已检测，继续加载首页');
        // 继续加载首页...
    }

    // 登录页：如果已登录直接跳首页
    if (currentPage === 'login.html') {
        if (hasValidToken()) {
            console.log('[快速初始化] 已登录，跳转首页');
            markSplashChecked();  // 标记已检测
            window.location.href = 'index.html';
            return;
        }
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. 兼容旧代码
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleLogin() {
    const username = document.getElementById('loginUsername')?.value;
    const password = document.getElementById('loginPassword')?.value;

    if (!username || !password) {
        if (window.showToast) {
            showToast('请输入账号和密码');
        }
        return;
    }

    return await quickLogin(username, password);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7. 暴露全局API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

window.ProvidenceQuickLogin = {
    login: quickLogin,
    hasToken: hasValidToken,
    shouldSkipSplash: shouldSkipSplash,
    markSplashChecked: markSplashChecked,
    config: LOGIN_CONFIG
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 8. 自动初始化
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', quickPageInit);
} else {
    quickPageInit();
}

console.log('[快速登录] 系统已加载');
