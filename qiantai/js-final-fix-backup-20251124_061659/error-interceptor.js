/**
 * 统一错误拦截层
 * 处理所有API错误和页面错误
 */

const ErrorInterceptor = {
  // 拦截全局错误
  setupGlobalErrorHandler() {
    window.addEventListener('error', (event) => {
      console.error('全局错误:', event.error);
      // 如果是"请先登录"相关错误，重定向
      if (event.error.message && event.error.message.includes('登录')) {
        window.location.href = '/login.html';
      }
    });
  },
  
  // 拦截Fetch错误
  interceptFetchErrors() {
    const originalFetch = window.fetch;
    
    window.fetch = function(...args) {
      return originalFetch.apply(this, args)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          // 检查API返回的错误
          if (data.code && (data.code === 401 || data.msg === '请先登录')) {
            console.error('登录过期，重定向到登录页');
            window.location.href = '/login.html';
            return Promise.reject(new Error('需要重新登录'));
          }
          return data;
        })
        .catch(error => {
          console.error('API错误:', error);
          // 显示错误提示，但不重定向
          if (window.showToast) {
            showToast('', error.message || 'API错误');
          }
          return Promise.reject(error);
        });
    };
  }
};

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
  ErrorInterceptor.setupGlobalErrorHandler();
  ErrorInterceptor.interceptFetchErrors();
});

console.log('✓ 错误拦截器已加载');
