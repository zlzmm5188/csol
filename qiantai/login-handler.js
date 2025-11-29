/**
 * 统一登录处理
 * 防止某些页面登录某些页面又回登录的问题
 */

const LoginHandler = {
  // 页面加载时检查登录状态
  checkLoginStatus() {
    const token = localStorage.getItem('providence_token') || 
                  sessionStorage.getItem('providence_token');
    
    const currentPage = window.location.pathname;
    const publicPages = ['/login.html', '/register.html', '/index.html', '/'];
    
    // 公开页面不需要登录
    if (publicPages.includes(currentPage)) {
      return;
    }
    
    // 受保护页面需要登录
    if (!token) {
      console.warn('未登录，重定向到登录页');
      window.location.href = '/login.html?redirect=' + encodeURIComponent(currentPage);
      return false;
    }
    
    return true;
  },
  
  // 处理登录后的页面跳转
  handlePostLogin(redirectUrl = '/profile.html') {
    // 清除旧Token
    localStorage.removeItem('providence_token');
    sessionStorage.removeItem('providence_token');
    
    // 保存新Token
    const token = localStorage.getItem('temp_token');
    if (token) {
      localStorage.setItem('providence_token', token);
      localStorage.removeItem('temp_token');
    }
    
    // 跳转到指定页面
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    window.location.href = redirect || redirectUrl;
  },
  
  // 处理登出
  handleLogout() {
    localStorage.removeItem('providence_token');
    sessionStorage.removeItem('providence_token');
    localStorage.removeItem('providence_user_id');
    localStorage.removeItem('providence_user_name');
    window.location.href = '/login.html';
  }
};

// 页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', () => {
  LoginHandler.checkLoginStatus();
});

console.log('✓ 登录处理器已加载');
