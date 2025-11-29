/**
 * 登录页面 - 使用统一Token管理模块
 * 依赖：api-config.js, token-manager.js
 */
const AREA_CODE = '86';
const SYSTEM_FLAG = 1;

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

// 等待 config.js 加载完成
function waitForConfig() {
    return new Promise((resolve) => {
        // 检查 window.API_CONFIG 是否存在且包含 baseURL
        if (window.API_CONFIG && window.API_CONFIG.baseURL) {
            console.log('[登录] API_CONFIG 已加载:', window.API_CONFIG.baseURL);
            resolve();
            return;
        }

        // 每 50ms 检查一次
        const check = setInterval(() => {
            if (window.API_CONFIG && window.API_CONFIG.baseURL) {
                clearInterval(check);
                console.log('[登录] API_CONFIG 已加载:', window.API_CONFIG.baseURL);
                resolve();
            }
        }, 50);

        // 3 秒后超时，仍然允许继续，避免死循环
        setTimeout(() => {
            clearInterval(check);
            if (window.API_CONFIG && window.API_CONFIG.baseURL) {
                console.log('[登录] API_CONFIG 已加载（超时后）:', window.API_CONFIG.baseURL);
            } else {
                console.warn('[登录] API_CONFIG 加载超时，使用默认配置');
            }
            resolve();
        }, 3000);
    });
}

document.addEventListener('DOMContentLoaded', function () {
    initPage();
    loadSavedCredentials(); // 加载保存的账号密码
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 新增：记住密码功能
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function loadSavedCredentials() {
    const savedUsername = localStorage.getItem('saved_username');
    const savedPassword = localStorage.getItem('saved_password');
    const rememberMe = localStorage.getItem('remember_me') === 'true';

    if (savedUsername) {
        const usernameEl = document.getElementById('loginUsername');
        if (usernameEl) usernameEl.value = savedUsername;
    }

    if (rememberMe && savedPassword) {
        const passwordEl = document.getElementById('loginPassword');
        if (passwordEl) passwordEl.value = savedPassword;
        console.log('[登录] 已自动填充保存的账号密码');
    }
}

function saveCredentials(username, password, remember) {
    if (remember) {
        localStorage.setItem('saved_username', username);
        localStorage.setItem('saved_password', password);
        localStorage.setItem('remember_me', 'true');
        console.log('[登录] 已保存账号密码');
    } else {
        localStorage.removeItem('saved_password');
        localStorage.setItem('remember_me', 'false');
        console.log('[登录] 已清除保存的密码');
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.addEventListener('DOMContentLoaded', function () {
    initPage();
});

function initPage() {
    // 标签切换
    document.querySelectorAll('.form-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            const tabType = this.dataset.tab;
            switchTab(tabType);
        });
    });

    // 回车登录
    document.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
}

function switchTab(tabType) {
    document.querySelectorAll('.form-tab').forEach(t => t.classList.remove('active'));
    const tabBtn = document.querySelector(`[data-tab="${tabType}"]`);
    if (tabBtn) tabBtn.classList.add('active');

    const accountEl = document.getElementById('accountForm');
    const smsEl = document.getElementById('smsForm');
    if (accountEl) accountEl.classList.add('hidden');
    if (smsEl) smsEl.classList.add('hidden');

    if (tabType === 'account') {
        if (accountEl) accountEl.classList.remove('hidden');
    } else {
        if (smsEl) smsEl.classList.remove('hidden');
    }
}

// 账号登录
async function handleLogin() {
    // 等待 config.js 完全加载后再执行登录流程
    await waitForConfig();

    if (window.__loginLoading) return;
    window.__loginLoading = true;
    const btn = document.getElementById('btnLogin');
    if (btn) { btn.classList.add('btn-loading'); btn.disabled = true; }

    const usernameEl = document.getElementById('loginUsername');
    const passwordEl = document.getElementById('loginPassword');
    const rememberEl = document.getElementById('rememberPassword');

    // 清除HTML5验证错误
    if (usernameEl) {
        usernameEl.setCustomValidity('');
        usernameEl.reportValidity();
    }
    if (passwordEl) {
        passwordEl.setCustomValidity('');
        passwordEl.reportValidity();
    }

    const username = usernameEl ? usernameEl.value.trim() : '';
    const password = passwordEl ? passwordEl.value.trim() : '';
    const remember = rememberEl ? rememberEl.checked : false;

    if (!username) {
        // 与充值/提款页面保持一致，统一使用 iOS 风格弹窗
        if (typeof window.showToast === 'function') {
            showToast('', '请输入账号');
        } else {
            console.error('[登录] showToast 未定义，无法显示提示：请输入账号');
        }
        if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
        window.__loginLoading = false;
        return;
    }

    if (!password) {
        if (typeof window.showToast === 'function') {
            showToast('', '请输入密码');
        } else {
            console.error('[登录] showToast 未定义，无法显示提示：请输入密码');
        }
        if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
        window.__loginLoading = false;
        return;
    }

    try {
        // ✅ 直接使用fetch调用登录API
        let data = null;
        const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
        // 如果API_BASE已经包含/api，则不再添加
        const apiUrl = API_BASE.includes('/api') ? `${API_BASE}/user/login` : `${API_BASE}/api/user/login`;

        console.log('[登录] 开始请求登录接口...');
        console.log('[登录] API地址:', apiUrl);
        console.log('[登录] API_CONFIG状态:', typeof window.API_CONFIG !== 'undefined' ? '已加载' : '未加载');

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            console.log('[登录] HTTP响应状态:', response.status, response.statusText);
            console.log('[登录] 响应Content-Type:', response.headers.get('content-type'));

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const text = await response.text();
            console.log('[登录] 响应数据长度:', text.length);

            try {
                data = JSON.parse(text);
                console.log('[登录] JSON解析成功，code:', data?.code);
            } catch (e) {
                console.error('[登录] JSON解析失败，返回内容预览:', text.substring(0, 300));
                if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                    await showToast('', '服务器返回错误页面，请检查网络或稍后再试');
                } else {
                    await showToast('', '服务器响应格式错误');
                }
                return;
            }
        } catch (error) {
            console.error('[登录] 请求失败:', error.message);
            await showToast('', '网络错误，请检查网络连接');
            return;
        }

        // ✅ 统一格式：code: 0, 1 或 200 表示成功（Integration Spec规范）
        if (data && (data.code === 0 || data.code === 1 || data.code === 200) && data.data) {
            // 使用统一Token管理模块保存token
            try {
                // API返回格式：{ code: 0, data: { accessToken: '...', id: ..., username: ... } }
                const token = data.data.token || data.data.access_token || data.data.accessToken;
                console.log('[登录] 提取Token字段:', {
                    token_field: !!data.data.token,
                    access_token_field: !!data.data.access_token,
                    accessToken_field: !!data.data.accessToken,
                    final_token: token ? token.substring(0, 20) + '...' : 'null'
                });
                if (token) {
                    // ✅ 使用TokenManager统一管理（双存储：localStorage + sessionStorage）
                    if (typeof TokenManager !== 'undefined' && TokenManager.saveToken) {
                        TokenManager.saveToken(token);
                    } else {
                        // 降级方案：直接写入
                        localStorage.setItem('providence_token', token);
                        sessionStorage.setItem('providence_token', token);
                        console.log('[登录] Token已强制保存（降级模式）:', token.substring(0, 20) + '...');
                    }

                    // 验证Token是否保存成功
                    const savedToken = localStorage.getItem('providence_token');
                    console.log('[登录] localStorage验证:', savedToken ? '✅ 成功' : '❌ 失败');
                } else {
                    console.warn('[登录] ⚠️  API响应中未找到token字段');
                    console.warn('[登录] API响应数据:', data);
                }

                // 保存用户信息（兼容 user 和 user_info 两种格式）
                const userObj = data.data.user || data.data.user_info || data.data;
                const userId = userObj?.id || userObj?.user_id || userObj?.uid || data.data.user_id || data.data.id;
                if (userId) {
                    localStorage.setItem('providence_user_id', userId);
                }

                const userName = userObj?.username || data.data.username || username;
                if (userName) {
                    localStorage.setItem('providence_user_name', userName);
                }

                console.log('[登录] 用户信息已保存:', { userId, userName });
            } catch (e) {
                console.error('[登录] 保存登录信息失败:', e);
            }

            // 保存账号密码（如果勾选了记住密码）
            if (remember) {
                localStorage.setItem('saved_username', username);
                localStorage.setItem('saved_password', password);
                localStorage.setItem('remember_password', 'true');
            } else {
                localStorage.removeItem('saved_username');
                localStorage.removeItem('saved_password');
                localStorage.removeItem('remember_password');
            }

            // 显示成功提示
            await showToast('', '登录成功');

            // ✅ 延迟跳转，确保token完全保存（Integration Spec规范）
            setTimeout(async () => {
                const savedToken = TokenManager?.getToken() || localStorage.getItem('providence_token');
                console.log('[登录] 即将跳转，Token状态:', savedToken ? '已保存' : '未保存');

                if (!savedToken) {
                    console.error('[登录] Token保存失败，无法跳转');
                    await showToast('', '登录失败，请重试');
                    return;
                }

                // ✅ 检查redirect参数并跳转（Integration Spec规范）
                const urlParams = new URLSearchParams(window.location.search);
                const redirectUrl = urlParams.get('redirect');

                if (redirectUrl) {
                    // 有redirect参数，跳转到指定页面
                    console.log('[登录] 跳转到redirect页面:', redirectUrl);
                    window.location.href = decodeURIComponent(redirectUrl);
                } else {
                    // 没有redirect参数，跳转到首页
                    console.log('[登录] 跳转到首页');
                    window.location.href = 'index.html?from=login&t=' + Date.now();
                }
            }, 1500);  // 延迟1500ms确保Token已保存
        } else {
            // ✅ 确保showToast函数存在，过滤掉消息中的网址
            if (typeof window.showToast === 'function') {
                const rawMsg = data.message || data.msg || '账号或密码错误';
                // 过滤掉网址（http/https开头的链接）
                const cleanMsg = rawMsg.replace(/https?:\/\/[^\s]+/g, '').replace(/\s+/g, ' ').trim();
                await showToast('', cleanMsg || '账号或密码错误');
            } else {
                console.error('showToast函数未定义，ios-toast.js可能未加载');
                // 不再使用原生 alert，避免风格不一致
            }
        }
    } catch (error) {
        console.error('登录错误:', error);
        await showToast('', '网络错误，请重试');
    } finally {
        if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
        window.__loginLoading = false;
    }
}

// ✅ 短信登录功能已删除 - 仅保留账号密码登录

// showToast函数已移到ios-toast.js，使用iOS风格弹窗

function wechatLogin() {
    try {
        const rtn = encodeURIComponent(location.origin + '/providence/index.html');
        // 统一后端发起入口，自动判断是否在微信内
        // 修复：使用正确的 API 域名 copla.top
        const API_BASE = 'https://api.4kp3l0iq.top';
        location.href = API_BASE + '/auth/wechat/start?return=' + rtn;
    } catch (e) {
        console.error(e);
    }
}
