// 注册页逻辑（无短信）- 统一使用config.js的API封装
// 确保在HTML中已加载config.js: <script src="config.js"></script>
const AREA_CODE = '86';

// 等待API对象加载
function waitForAPI() {
  return new Promise((resolve) => {
    if (window.API && window.API_CONFIG) {
      resolve();
    } else {
      const check = setInterval(() => {
        if (window.API && window.API_CONFIG) {
          clearInterval(check);
          resolve();
        }
      }, 50);
      setTimeout(() => {
        clearInterval(check);
        resolve();
      }, 3000);
    }
  });
}

// DOMContentLoaded 初始化
document.addEventListener('DOMContentLoaded', function() {
  // 从多个来源获取邀请码
  const urlParams = new URLSearchParams(window.location.search);
  const codeFromUrl = urlParams.get('code') || urlParams.get('invite') || urlParams.get('invite_code');
  const codeFromStorage = localStorage.getItem('invite_code') || localStorage.getItem('invite_code_from_link') || '';

  // 尝试从子域名获取
  let codeFromDomain = '';
  try {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    // 支持纯数字UID和字母邀请码
    if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'xin') {
      codeFromDomain = parts[0]; // 保持原样，不转大写（支持数字UID）
      console.log('[注册] 检测到子域名邀请:', codeFromDomain);
    } else if (parts.length === 2) {
      console.log('[注册] 主域名访问，无邀请码');
    }
  } catch(e) {
    console.warn('[注册] 解析子域名失败:', e);
  }

  const inv = codeFromUrl || codeFromStorage || codeFromDomain || '';

  var input = document.getElementById('regInvite');
  if(input){
    input.value = inv || '';
    console.log('[注册] 邀请码已自动填充:', inv);
    console.log('[注册] URL参数:', codeFromUrl);
    console.log('[注册] LocalStorage:', codeFromStorage);
    console.log('[注册] 子域名:', codeFromDomain);
  }

  // 实时验证账号
  const usernameInput = document.getElementById('regUsername');
  const usernameError = document.getElementById('usernameError');
  if (usernameInput) {
    usernameInput.addEventListener('blur', function() {
      const username = this.value.trim();
      if (username) {
        const result = validateUsername(username);
        if (!result.valid) {
          showFieldError('usernameError', result.message);
          usernameInput.classList.add('error');
          usernameInput.classList.remove('valid');
        } else {
          hideFieldError('usernameError');
          usernameInput.classList.remove('error');
          usernameInput.classList.add('valid');
        }
      } else {
        hideFieldError('usernameError');
        usernameInput.classList.remove('error', 'valid');
      }
    });

    usernameInput.addEventListener('input', function() {
      if (this.classList.contains('error')) {
        const username = this.value.trim();
        if (username) {
          const result = validateUsername(username);
          if (result.valid) {
            hideFieldError('usernameError');
            this.classList.remove('error');
            this.classList.add('valid');
          }
        }
      }
    });
  }

  // 实时验证密码
  const passwordInput = document.getElementById('regPassword');
  const passwordError = document.getElementById('passwordError');
  if (passwordInput) {
    passwordInput.addEventListener('blur', function() {
      const password = this.value.trim();
      if (password) {
        const result = validatePassword(password);
        if (!result.valid) {
          showFieldError('passwordError', result.message);
          passwordInput.classList.add('error');
          passwordInput.classList.remove('valid');
        } else {
          hideFieldError('passwordError');
          passwordInput.classList.remove('error');
          passwordInput.classList.add('valid');
        }
      } else {
        hideFieldError('passwordError');
        passwordInput.classList.remove('error', 'valid');
      }
    });

    passwordInput.addEventListener('input', function() {
      if (this.classList.contains('error')) {
        const password = this.value.trim();
        if (password) {
          const result = validatePassword(password);
          if (result.valid) {
            hideFieldError('passwordError');
            this.classList.remove('error');
            this.classList.add('valid');
          }
        }
      }
      // 如果确认密码已输入，重新验证
      const passwordConfirm = document.getElementById('regPasswordConfirm');
      if (passwordConfirm && passwordConfirm.value) {
        passwordConfirm.dispatchEvent(new Event('blur'));
      }
    });
  }

  // 实时验证确认密码
  const passwordConfirmInput = document.getElementById('regPasswordConfirm');
  const passwordConfirmError = document.getElementById('passwordConfirmError');
  if (passwordConfirmInput) {
    passwordConfirmInput.addEventListener('blur', function() {
      const password = document.getElementById('regPassword').value.trim();
      const passwordConfirm = this.value.trim();
      if (passwordConfirm) {
        if (password !== passwordConfirm) {
          showFieldError('passwordConfirmError', '两次输入的密码不一致');
          passwordConfirmInput.classList.add('error');
          passwordConfirmInput.classList.remove('valid');
        } else {
          hideFieldError('passwordConfirmError');
          passwordConfirmInput.classList.remove('error');
          passwordConfirmInput.classList.add('valid');
        }
      } else {
        hideFieldError('passwordConfirmError');
        passwordConfirmInput.classList.remove('error', 'valid');
      }
    });

    passwordConfirmInput.addEventListener('input', function() {
      if (this.classList.contains('error')) {
        const password = document.getElementById('regPassword').value.trim();
        const passwordConfirm = this.value.trim();
        if (passwordConfirm && password === passwordConfirm) {
          hideFieldError('passwordConfirmError');
          this.classList.remove('error');
          this.classList.add('valid');
        }
      }
    });
  }
});

// 显示字段错误
function showFieldError(errorId, message) {
  const errorEl = document.getElementById(errorId);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('show');
  }
}

// 隐藏字段错误
function hideFieldError(errorId) {
  const errorEl = document.getElementById(errorId);
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.remove('show');
  }
}

// 账号验证规则：至少8位，必须包含大小写字母
function validateUsername(username) {
  if (username.length < 8) {
    return { valid: false, message: '账号长度不能少于8位' };
  }
  if (!/[a-z]/.test(username)) {
    return { valid: false, message: '账号必须包含小写字母' };
  }
  if (!/[A-Z]/.test(username)) {
    return { valid: false, message: '账号必须包含大写字母' };
  }
  if (!/^[a-zA-Z0-9]+$/.test(username)) {
    return { valid: false, message: '账号只能包含字母和数字' };
  }
  return { valid: true };
}

// 密码验证规则：至少8位，必须包含大小写字母和至少一位特殊符号
function validatePassword(password) {
  if (password.length < 8) {
    return { valid: false, message: '密码长度不能少于8位' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: '密码必须包含小写字母' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: '密码必须包含大写字母' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: '密码必须包含至少一位特殊符号' };
  }
  return { valid: true };
}

async function handleRegister(){
  var username = document.getElementById('regUsername').value.trim();
  var password = document.getElementById('regPassword').value.trim();
  var passwordConfirm = document.getElementById('regPasswordConfirm').value.trim();
  var invite = document.getElementById('regInvite').value.trim();

  // 验证账号
  if(!username){
    showFieldError('usernameError', '请输入账号');
    document.getElementById('regUsername').classList.add('error');
    document.getElementById('regUsername').focus();
    return;
  }
  const usernameCheck = validateUsername(username);
  if(!usernameCheck.valid){
    showFieldError('usernameError', usernameCheck.message);
    document.getElementById('regUsername').classList.add('error');
    document.getElementById('regUsername').focus();
    return;
  }

  // 验证密码
  if(!password){
    showFieldError('passwordError', '请输入密码');
    document.getElementById('regPassword').classList.add('error');
    document.getElementById('regPassword').focus();
    return;
  }
  const passwordCheck = validatePassword(password);
  if(!passwordCheck.valid){
    showFieldError('passwordError', passwordCheck.message);
    document.getElementById('regPassword').classList.add('error');
    document.getElementById('regPassword').focus();
    return;
  }

  // 验证确认密码
  if(!passwordConfirm){
    showFieldError('passwordConfirmError', '请输入确认密码');
    document.getElementById('regPasswordConfirm').classList.add('error');
    document.getElementById('regPasswordConfirm').focus();
    return;
  }
  if(password !== passwordConfirm){
    showFieldError('passwordConfirmError', '两次输入的密码不一致');
    document.getElementById('regPasswordConfirm').classList.add('error');
    document.getElementById('regPasswordConfirm').focus();
    return;
  }

  // 验证邀请码（如果为空，尝试从localStorage或URL再次获取）
  if(!invite) {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code') || urlParams.get('invite') || urlParams.get('invite_code');
    const codeFromStorage = localStorage.getItem('invite_code') || localStorage.getItem('invite_code_from_link') || '';
    invite = codeFromUrl || codeFromStorage || '';

    // 如果仍然为空，检查子域名
    if (!invite) {
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'xin') {
        invite = parts[0];
        console.log('[注册] 从子域名获取邀请码:', invite);
      }
    }

    if (!invite) {
      showFieldError('inviteError', '邀请码不能为空，请使用有效的邀请链接');
      if(document.getElementById('regInvite')) {
        document.getElementById('regInvite').classList.add('error');
        document.getElementById('regInvite').focus();
      }
      return;
    }

    console.log('[注册] 使用邀请码:', invite);
    // 自动填充到输入框
    if(document.getElementById('regInvite')) {
      document.getElementById('regInvite').value = invite;
    }
  }

  try{
    await waitForAPI();

    // 使用统一API封装
    const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
    const res = await fetch(API_BASE + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        invite_code: invite
      })
    });

    const data = await res.json();
    console.log('[注册] API响应:', data);

    if (data.code === 1 || data.code === 200 || data.message === '注册成功' || data.msg === '注册成功' || data.msg === 'ok') {
      // 保存注册返回的token和用户信息
      if (data.data && data.data.token) {
        localStorage.setItem('providence_token', data.data.token);
        console.log('[注册] Token已保存:', data.data.token.substring(0, 20) + '...');

        if (data.data.user) {
          localStorage.setItem('providence_user_id', data.data.user.id || data.data.user.uid);
          localStorage.setItem('providence_user_name', data.data.user.username);
        } else if (data.data.user_id || data.data.uid) {
          // 兼容不同的返回格式
          localStorage.setItem('providence_user_id', data.data.user_id || data.data.uid);
          localStorage.setItem('providence_user_name', data.data.username || '');
        }
      }

      showToast('注册成功，正在跳转首页...');
      setTimeout(() => {
        window.location.href = 'index.html';  // 直接跳转到首页，而不是登录页
      }, 1500);
    } else {
      showToast(data.message || data.msg || '注册失败，请重试');
    }
  } catch(e) {
    console.error(e);
    showToast('网络错误，请重试');
  }
}

function showToast(message){
  // 移除已存在的toast
  const existingToast = document.querySelector('.toast-message');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.textContent = message;
  document.body.appendChild(toast);

  // 触发动画
  setTimeout(() => toast.classList.add('show'), 10);

  // 自动隐藏
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentElement) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 2500);
}
