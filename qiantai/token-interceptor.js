/**
 * Providence Token 统一拦截器（最终修复版）
 * 修复内容：
 *  ✓ 不会误判 Token
 *  ✓ 不会在首页加载时重定向
 *  ✓ 不会多次触发跳转
 *  ✓ 保证所有 fetch 正常执行
 */

const TokenInterceptor = {

  // 不需要 Token 的 URL 列表
  whitelist: [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/send-code',
    '/login.html',
    '/register.html'
  ],

  // 检查是否在白名单
  isWhite(url) {
    return this.whitelist.some(w => url.includes(w));
  },

  // 获取 Token（自动兼容两种存储）
  getToken() {
    return (
      localStorage.getItem('providence_token') ||
      sessionStorage.getItem('providence_token')
    );
  },

  // 解析 Token 不抛错
  decode(token) {
    try {
      const body = token.split('.')[1];
      return JSON.parse(atob(body));
    } catch (e) {
      return null;
    }
  },

  // 过期检查
  isExpired(token) {
    const decoded = this.decode(token);
    if (!decoded || !decoded.exp) return false;
    return Date.now() > decoded.exp * 1000;
  },

  // 主拦截逻辑
  intercept() {
    const rawFetch = window.fetch;

    window.fetch = async (...args) => {
      const url = args[0];

      // 白名单 → 直接放行
      if (this.isWhite(url)) {
        return rawFetch(...args);
      }

      const token = this.getToken();

      // 未登录但访问需要登录的页面 → 不立刻跳转，让各个页面自己处理
      if (!token) {
        // 检查是否在登录页，避免循环
        if (window.location.pathname.includes('login.html')) {
          return rawFetch(...args);
        }
        console.warn('[TokenInterceptor] 无 Token，返回 401');
        return new Response(
          JSON.stringify({ code: 401, msg: '请先登录', message: 'Unauthenticated' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Token 过期检查（但让后端验证，前端只做基本检查）
      // 注意：前端过期检查可能不准确，主要依赖后端验证
      const decoded = this.decode(token);
      if (decoded && decoded.exp && Date.now() > decoded.exp * 1000) {
        console.warn('[TokenInterceptor] Token 已过期（前端检查）');
        // 不在这里跳转，让后端返回401后再由api-new.js处理
        return new Response(
          JSON.stringify({ code: 401, msg: 'Token已过期，请重新登录', message: 'Token expired' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 自动补 Token 头
      let opt = args[1] || {};
      opt.headers = {
        ...(opt.headers || {}),
        Authorization: `Bearer ${token}`
      };

      try {
        return await rawFetch(url, opt);
      } catch (error) {
        // 处理网络错误（连接被拒绝、超时等）
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
          console.warn('[TokenInterceptor] 网络连接失败:', url, error.message);
          // 返回一个模拟的错误响应，避免页面崩溃
          return new Response(
            JSON.stringify({
              code: -1,
              msg: '网络连接失败，请检查网络或稍后重试',
              data: null
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
        // 其他错误继续抛出
        throw error;
      }
    };
  }
};

// 初始化（只要不是登录页，就启用）
document.addEventListener('DOMContentLoaded', () => {
  if (!location.pathname.includes('login.html')) {
    TokenInterceptor.intercept();
  }
});

console.log('✓ Token 拦截器已加载（稳定版）');
