/**
 * 全局前端行为稳定化
 * 确保所有页面行为一致和稳定
 */

const GlobalStabilizer = {
  // 初始化所有必要的中间件
  init() {
    // 1. 加载API_MAP
    if (!window.API_MAP) {
      console.error('API_MAP未加载！');
      return false;
    }
    
    // 2. 加载callAPI函数
    if (!window.callAPI) {
      console.error('callAPI函数未加载！');
      return false;
    }
    
    // 3. 加载Token拦截器
    if (!window.TokenInterceptor) {
      console.error('TokenInterceptor未加载！');
      return false;
    }
    
    // 4. 加载错误拦截器
    if (!window.ErrorInterceptor) {
      console.error('ErrorInterceptor未加载！');
      return false;
    }
    
    // 5. 加载登录处理器
    if (!window.LoginHandler) {
      console.error('LoginHandler未加载！');
      return false;
    }
    
    console.log('✓ 所有中间件已加载');
    return true;
  },
  
  // 监控页面变化
  watchPageChanges() {
    // 监控URL变化
    let lastUrl = window.location.href;
    new MutationObserver(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        console.log('页面已变化:', currentUrl);
        LoginHandler.checkLoginStatus();
      }
    }).observe(document, { subtree: true, childList: true });
  },
  
  // 健康检查
  healthCheck() {
    setInterval(() => {
      const token = localStorage.getItem('providence_token');
      if (!token && !['login', 'register', 'index'].includes(window.location.pathname.split('/')[1])) {
        console.warn('Token丢失，需要重新登录');
        window.location.href = '/login.html';
      }
    }, 5000);
  }
};

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
  if (GlobalStabilizer.init()) {
    GlobalStabilizer.watchPageChanges();
    GlobalStabilizer.healthCheck();
  }
});

console.log('✓ 全局稳定化系统已加载');
