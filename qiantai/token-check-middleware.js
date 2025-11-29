/**
 * Token检查中间件 - 修复登录循环问题
 * 在所有需要鉴权的页面上运行此脚本（在最开始）
 */

(function() {
    console.log('[TokenCheck] 开始检查Token...');

    const TOKEN_KEY = 'providence_token';
    const AUTH_PAGES = ['login.html', 'register.html', 'forgot-password.html', 'check-token.html'];
    const CURRENT_PAGE = window.location.pathname.split('/').pop() || 'index.html';

    // 获取token
    const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || '';

    console.log('[TokenCheck]', {
        currentPage: CURRENT_PAGE,
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? token.substring(0, 20) + '...' : '无'
    });

    // ✅ 公开页面（无需Token）
    if (AUTH_PAGES.includes(CURRENT_PAGE)) {
        console.log('[TokenCheck] 当前是公开页面，跳过检查');
        return;
    }

    // ✅ 需要Token的页面
    if (!token) {
        console.warn('[TokenCheck] ❌ 没有Token，跳转到登录页');

        // 保存当前页面作为redirect参数
        const redirectUrl = encodeURIComponent(window.location.href);

        // 避免重复跳转（如果已经在跳转过程中，不再跳转）
        if (window.location.pathname.includes('login.html')) {
            console.warn('[TokenCheck] 已经在登录页，不再跳转');
            return;
        }

        // 立即跳转到登录页（不使用setTimeout，直接跳转）
        window.location.href = `/login.html?redirect=${redirectUrl}`;
        return;
    }

    console.log('[TokenCheck] ✅ Token验证通过，允许加载页面');

    // ✅ 保存Token到全局，供后续API调用使用
    window.TOKEN = token;
    window.TOKEN_MANAGER = {
        getToken: () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY),
        setToken: (t) => {
            localStorage.setItem(TOKEN_KEY, t);
            window.TOKEN = t;
        },
        clearToken: () => {
            localStorage.removeItem(TOKEN_KEY);
            sessionStorage.removeItem(TOKEN_KEY);
            delete window.TOKEN;
        }
    };

})();
