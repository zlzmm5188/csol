// 个人中心页面 - 统一使用config.js的API封装
// 确保在HTML中已加载config.js: <script src="config.js"></script>

// 快速等待API对象加载（优化版）
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
            }, 10); // 从50ms减少到10ms，检查更频繁
            // 最多等待500ms（从3000ms大幅缩短）
            setTimeout(() => {
                clearInterval(check);
                resolve(); // 即使没加载完也继续，不阻塞
            }, 500);
        }
    });
}

let userData = {
    token: TokenManager.getToken() || '',
    id: 0,
    username: '',
    mobile: '',
    realname: '',
    money: 0,
    ribao: 0,
    profit: 0,
    recharges: 0,
    withdraws: 0,
    level: 1,
    invite_code: '',
    projects_count: 0,
    usdt_money: 0,
    usdt_ribao: 0
};

// 页面加载
document.addEventListener('DOMContentLoaded', function () {
    console.log('[Profile] DOMContentLoaded触发');

    // ✅ Token由token-check-middleware.js在<head>中验证
    // 这里只需要读取已验证的Token
    const token = localStorage.getItem('providence_token') || sessionStorage.getItem('providence_token') || '';

    if (!token) {
        console.warn('[Profile] ❌ 没有Token（不应该到达这里，应该被中间件拦截）');
        const redirectUrl = encodeURIComponent(window.location.href);
        window.location.href = `/login.html?redirect=${redirectUrl}`;
        return;
    }

    console.log('[Profile] ✅ Token验证通过，开始初始化页面');
    userData.token = token;

    // 直接初始化，不再延迟
    initPage();
    loadUserData();
    bindEvents();
});

// 这个函数已经不再需要，token检查逻辑已移到DOMContentLoaded中

// 初始化
function initPage() {
    // 确保token已设置
    if (!userData.token) {
        userData.token = localStorage.getItem('providence_token') || sessionStorage.getItem('providence_token') || '';
    }
    console.log('[Profile] initPage完成，Token状态:', userData.token ? '✅ 已设置' : '❌ 未设置');
}

// 加载用户数据（优化版）
let isLoading = false;
let lastLoadTime = 0;
const CACHE_DURATION = 3000; // 从5秒减少到3秒，更快刷新

async function loadUserData() {
    // 防止并发请求
    if (isLoading) {
        return;
    }

    // 5秒内缓存，避免频繁请求
    const now = Date.now();
    if (lastLoadTime > 0 && (now - lastLoadTime) < CACHE_DURATION) {
        return;
    }

    isLoading = true;

    try {
        await waitForAPI();

        // ✅ 优化：直接使用 httpClient（统一API封装）
        let response = null;
        if (window.httpClient && typeof window.httpClient.get === 'function') {
            try {
                // 确保路径正确（httpClient会自动处理baseURL）
                response = await window.httpClient.get('/api/user/info');
                console.log('[Profile] httpClient调用成功');
                // httpClient 返回格式: {code: 200, data: {...}} 或直接返回数据对象
                if (response && !response.code && !response.data) {
                    // 如果直接返回数据对象，包装为标准格式
                    response = { code: 200, data: response };
                }
            } catch (e) {
                console.warn('[Profile] httpClient调用失败:', e.message);
                // httpClient调用失败，使用降级方案
            }
        }

        // ✅ 使用统一API客户端（Integration Spec规范）
        if (!response && typeof ApiClient !== 'undefined' && typeof ApiClient.get === 'function') {
            try {
                response = await ApiClient.get('/api/user/info');
                console.log('[Profile] ApiClient调用成功');
            } catch (e) {
                console.warn('[Profile] ApiClient调用失败:', e.message);
            }
        }

        // 降级方案：直接使用fetch
        if (!response) {
            let API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
            // 确保baseURL不以/api结尾，避免重复
            if (API_BASE.endsWith('/api')) {
                API_BASE = API_BASE.slice(0, -4);
            }
            // 优先使用userData中的token，如果没有则从localStorage读取
            const token = userData.token || localStorage.getItem('providence_token') || sessionStorage.getItem('providence_token') || '';
            const apiUrl = `${API_BASE}/api/user/info`;  // ✅ 正确的API路径是 /api/user/info
            console.log('[加载用户数据] API地址:', apiUrl);
            console.log('[加载用户数据] Token状态:', token ? ('✅ 已找到: ' + token.substring(0, 20) + '...') : '❌ 缺失');
            const res = await window.ApiClient.request(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,  // ✅ 使用标准Authorization Bearer格式
                    'Token': token  // ✅ 兼容性：同时发送Token头
                }
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            const text = await res.text();
            try {
                response = JSON.parse(text);
            } catch (e) {
                console.error('[用户数据] ✗ 解析失败:', text.substring(0, 100));
                response = { code: -1, msg: '网络错误', data: null };
            }
        }

        // ✅ 统一响应格式检查（Integration Spec规范）
        if (!response) {
            return;
        }

        // ✅ 检查401错误（但先验证token是否真的存在）
        if (response.code === 401 || response.code === -401) {
            // 如果返回401，先检查token是否真的存在
            const currentToken = localStorage.getItem('providence_token') || sessionStorage.getItem('providence_token') || '';
            console.warn('[Profile] API返回401，当前Token状态:', currentToken ? ('✅ Token存在: ' + currentToken.substring(0, 20) + '...') : '❌ Token不存在');

            if (currentToken && !userData.token) {
                // token存在但userData中没有，说明是读取时机问题，重试一次
                console.log('[Profile] Token存在但未读取到，更新userData并重试');
                userData.token = currentToken;
                // 延迟重试，避免立即重试导致循环
                setTimeout(() => {
                    loadUserData().catch(err => {
                        console.error('[Profile] 重试加载失败:', err);
                    });
                }, 500);
                isLoading = false;
                return;
            }

            if (!currentToken) {
                // 确实没有token，跳转登录页
                console.log('[Profile] ❌ 确认无Token，跳转登录页');
                const redirectUrl = encodeURIComponent(window.location.href);
                window.location.href = `login.html?redirect=${redirectUrl}`;
                isLoading = false;
                return;
            }

            // 有token但返回401，可能是token过期或无效，也跳转登录页
            console.log('[Profile] ❌ Token无效或过期，跳转登录页');
            localStorage.removeItem('providence_token');
            sessionStorage.removeItem('providence_token');
            userData.token = '';
            const redirectUrl = encodeURIComponent(window.location.href);
            window.location.href = `login.html?redirect=${redirectUrl}`;
            isLoading = false;
            return;
        }

        // ✅ 字段对齐（Integration Spec规范）
        if ((response.code === 1 || response.code === 200) && response.data) {
            const data = response.data;

            // ✅ 统一字段映射（前端字段 → 后端字段）
            // 新版本API返回格式: uid, account, avatar, usdt, cny, profit
            const userId = data.user_id || data.id || data.uid || 0;
            userData = {
                ...userData,
                id: userId,
                user_id: userId,
                uid: userId, // 兼容字段
                // 账号：优先使用account（新API格式），然后是username（旧格式）
                username: data.account || data.username || '',
                real_name: data.real_name || data.realname || '',
                mobile: data.mobile || data.phone || '',
                // 余额：使用新API格式的字段名（cny, usdt）
                balance_cny: parseFloat(data.cny || data.balance_cny || data.money || 0),
                balance_usdt: parseFloat(data.usdt || data.balance_usdt || data.usdt_money || 0),
                frozen_cny: parseFloat(data.frozen_cny || 0),
                frozen_usdt: parseFloat(data.frozen_usdt || 0),
                // 日利宝相关：新API可能不返回这些字段，使用默认值
                ribao_cny: parseFloat(data.ribao_cny || data.ribao || 0),
                ribao_usdt: parseFloat(data.ribao_usdt || data.usdt_ribao || 0),
                points: parseInt(data.points || 0),
                vip_level: parseInt(data.vip_level || data.level || 0),
                // 收益：使用profit字段（新API）
                total_invest: parseFloat(data.profit || data.total_invest || 0),
                invite_code: data.invite_code || data.invite || '',
                team_count: parseInt(data.team_count || data.team_members || 0),
                is_kyc: parseInt(data.is_kyc || 0),
                // 兼容旧字段 - 这些字段被profile.js的DOM更新函数使用
                money: parseFloat(data.balance_cny || data.cny || data.money || 0),
                ribao: parseFloat(data.ribao_cny || data.ribao || 0),
                usdt_money: parseFloat(data.balance_usdt || data.usdt || data.usdt_money || 0),  // ✅ 添加 data.usdt 作为备选
                usdt_ribao: parseFloat(data.ribao_usdt || data.usdt_ribao || 0),
                level: parseInt(data.vip_level || data.level || 0),
                realname: data.real_name || data.realname || '',
                projects_count: parseInt(data.projects_count || 0)
            };

            lastLoadTime = Date.now(); // 更新缓存时间

            // 批量更新UI，避免多次重排
            requestAnimationFrame(() => {
                updateUI(userData);  // ✅ 修复：使用userData而不是user
                updateVipFields();
                // 异步加载VIP进度，不阻塞UI
                setTimeout(() => {
                    updateUpgradeProgress().catch(() => {});
                }, 100);
            });
        } else {
            // 如果只是其他错误，不跳转，显示错误提示
            console.warn('[Profile] API返回错误:', response.msg || response.message || '未知错误');
            // 不显示toast，避免干扰用户
        }
    } catch (error) {
        // 网络错误或API错误处理
        const errorMsg = error.message || error.toString() || '';
        console.error('[Profile] 加载用户数据异常:', errorMsg);

        // 检查是否是401错误
        const isAuthError = errorMsg.includes('401') ||
            errorMsg.includes('403') ||
            errorMsg.includes('Token验证失败') ||
            errorMsg.includes('未登录') ||
            errorMsg.includes('请先登录') ||
            errorMsg.includes('登录已过期');

        // 如果捕获到401错误，检查token是否真的存在
        if (isAuthError) {
            const currentToken = localStorage.getItem('providence_token') || sessionStorage.getItem('providence_token') || '';
            console.warn('[Profile] 捕获到认证错误，当前Token状态:', currentToken ? ('✅ Token存在: ' + currentToken.substring(0, 20) + '...') : '❌ Token不存在');

            if (currentToken && !userData.token) {
                // token存在但userData中没有，说明是读取时机问题，重试一次
                console.log('[Profile] Token存在但未读取到，更新userData并重试');
                userData.token = currentToken;
                setTimeout(() => {
                    loadUserData().catch(err => {
                        console.error('[Profile] 重试加载失败:', err);
                    });
                }, 500);
                isLoading = false;
                return;
            }

            if (!currentToken) {
                // 确实没有token，跳转登录页
                console.log('[Profile] ❌ 确认无Token，跳转登录页');
                const redirectUrl = encodeURIComponent(window.location.href);
                window.location.href = `login.html?redirect=${redirectUrl}`;
                isLoading = false;
                return;
            }

            // 有token但返回401，可能是token过期或无效
            console.log('[Profile] ❌ Token无效或过期，跳转登录页');
            localStorage.removeItem('providence_token');
            sessionStorage.removeItem('providence_token');
            userData.token = '';
            const redirectUrl = encodeURIComponent(window.location.href);
            window.location.href = `login.html?redirect=${redirectUrl}`;
            isLoading = false;
            return;
        }

        // 其他错误（网络错误等），不跳转
        console.warn('[Profile] 网络错误或其他错误，不跳转');
    } finally {
        isLoading = false; // 释放加载锁
    }
}

// （必须删除）这是导致页面变慢的根源
// 获取投资项目数量（完全静默失败）

// 更新UI
function updateUI() {
    // 更新头部信息（使用首页样式）
    const userNameBrand = document.getElementById('userNameBrand');
    const userIdBrand = document.getElementById('userIdBrand');
    const userVipBadge = document.getElementById('userVipBadge');
    const avatarLarge = document.querySelector('.user-avatar-large');
    const avatarText = document.querySelector('.avatar-text-large');

    if (userNameBrand) {
        const name = userData.realname || userData.nickname || userData.username || 'PROVIDENCE';
        userNameBrand.textContent = name;
        userNameBrand.dataset.value = name;
        // 添加隐藏功能
        userNameBrand.dataset.visible = 'true';
    }

    if (userIdBrand) {
        // ✅ 使用 user_id（后台标准字段）
        const id = userData.id || userData.uid || '--';
        userIdBrand.textContent = `ID: ${id}`;
        userIdBrand.dataset.value = `ID: ${id}`;
        userIdBrand.dataset.idValue = id;
        userIdBrand.dataset.visible = 'true';
    }

    // 更新账号和ID显示（新增）- 确保数据正确显示
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userIdDisplay = document.getElementById('userIdDisplay'); // 可选元素，如果不存在则不显示

    if (userNameDisplay) {
        // 优先使用username，然后是mobile，最后是realname，确保有值
        let name = userData.username || userData.mobile || userData.realname || '';
        // 如果所有字段都为空，使用默认值
        if (!name || name === 'User' || name === 'Providence') {
            // 尝试从localStorage获取
            const storedName = localStorage.getItem('providence_user_name');
            if (storedName) {
                name = storedName;
            } else {
                // 最后使用 user_id 作为显示
                name = userData.id ? `用户${userData.id}` : '用户';
            }
        }
        userNameDisplay.textContent = name;
        userNameDisplay.dataset.value = name;

        // 账号自适应：如果账号长度超过8个字符，调整样式往下显示
        const nameLength = name.length;
        const parentCard = userNameDisplay.closest('.flip-card-front');
        if (parentCard && nameLength > 8) {
            // 账号较长时，调整justify-content为flex-start，让内容从顶部开始
            parentCard.style.justifyContent = 'flex-start';
            parentCard.style.paddingTop = 'clamp(12px, 3vw, 16px)';
            // 调整账号文字位置
            userNameDisplay.style.marginTop = 'clamp(20px, 5vw, 24px)';
        } else if (parentCard) {
            // 账号不长时，恢复默认样式
            parentCard.style.justifyContent = 'flex-end';
            parentCard.style.paddingTop = '0';
            userNameDisplay.style.marginTop = '0';
        }
    }

    if (userIdDisplay) {
        // ✅ 使用 user_id（后台标准字段）
        const id = userData.id || '--';
        userIdDisplay.textContent = id;
        userIdDisplay.dataset.value = id;
        userIdDisplay.dataset.idValue = id;
    }

    if (userVipBadge) {
        const level = userData.vip_level || userData.level || 1;
        if (level >= 1 && level <= 8) {
            userVipBadge.setAttribute('data-vip', level);
        }
    }

    // 如果有头像URL则显示，否则用默认头像
    if (avatarLarge && userData.avatar && userData.avatar.trim()) {
        const avatarUrl = userData.avatar.startsWith('http') ? userData.avatar : (window.location.origin + userData.avatar);
        avatarLarge.style.backgroundImage = `url('${avatarUrl}')`;
        if (avatarText) avatarText.style.display = 'none';
    }

    // 更新VIP等级
    const vipCard = document.getElementById('vipCard');
    if (vipCard) {
        const level = userData.level || 1;
        vipCard.setAttribute('data-vip-level', level);
        // VIP图标已移除，不再更新
    }

    // 更新资产栏（优化版：批量更新DOM，减少重排）
    const totalAssetEl = document.getElementById('totalAsset');
    const totalIncomeCnyEl = document.getElementById('totalIncomeCny');
    const totalIncomeUsdtEl = document.getElementById('totalIncomeUsdt');
    const totalUsdtAssetEl = document.getElementById('totalUsdtAsset');
    const teamMembersEl = document.getElementById('teamMembers');
    const teamTotalInvestEl = document.getElementById('teamTotalInvest');

    // 直接更新，不使用 requestAnimationFrame（避免双重包裹）
    if (totalAssetEl) {
        // 使用新 API 字段：balance_cny 或旧字段 money + ribao
        const totalAsset = (userData.balance_cny || userData.money || 0) + (userData.ribao_cny || userData.ribao || 0);
        totalAssetEl.textContent = totalAsset.toFixed(2);
        totalAssetEl.dataset.value = totalAsset.toFixed(2);
        console.log('✅ 总资产已更新:', totalAsset.toFixed(2));
    }

    // 人民币收益（从userData.profit_cny或profit获取）
    if (totalIncomeCnyEl) {
        const profitCny = parseFloat(userData.profit_cny || userData.profit || 0);
        totalIncomeCnyEl.textContent = profitCny.toFixed(2);
        totalIncomeCnyEl.dataset.value = profitCny.toFixed(2);
    }

    // USDT收益（从userData.profit_usdt获取）
    if (totalIncomeUsdtEl) {
        const profitUsdt = parseFloat(userData.profit_usdt || 0);
        totalIncomeUsdtEl.textContent = profitUsdt.toFixed(2);
        totalIncomeUsdtEl.dataset.value = profitUsdt.toFixed(2);
    }

    // USDT卡片中的收益显示（totalUsdtIncome）
    const totalUsdtIncomeEl = document.getElementById('totalUsdtIncome');
    if (totalUsdtIncomeEl) {
        const profitUsdt = parseFloat(userData.profit_usdt || 0);
        totalUsdtIncomeEl.textContent = profitUsdt.toFixed(2);
        totalUsdtIncomeEl.dataset.value = profitUsdt.toFixed(2);
    }

    if (totalUsdtAssetEl) {
        const totalUsdtAsset = parseFloat((userData.usdt_money || 0) + (userData.usdt_ribao || 0));
        totalUsdtAssetEl.textContent = totalUsdtAsset.toFixed(2);
        totalUsdtAssetEl.dataset.value = totalUsdtAsset.toFixed(2);
        console.log('✅ USDT余额已更新:', {usdt_money: userData.usdt_money, usdt_ribao: userData.usdt_ribao, total: totalUsdtAsset.toFixed(2)});
    }

    // 团队人数（从userData.team_count或team_members获取）
    if (teamMembersEl) {
        const teamMembers = userData.team_count || userData.team_members || 0;
        teamMembersEl.textContent = teamMembers.toString();
        teamMembersEl.dataset.value = teamMembers.toString();
    }

    // 团队总投资（从userData.team_total_invest或team_invest获取）
    if (teamTotalInvestEl) {
        const teamTotalInvest = (userData.team_total_invest || userData.team_invest || 0).toFixed(2);
        teamTotalInvestEl.textContent = teamTotalInvest;
        teamTotalInvestEl.dataset.value = teamTotalInvest;
    }

    // 更新升级进度（异步调用，已在loadUserData中调用）
}

function updateVipFields() {
    // 更新VIP等级显示（如果页面有相关元素）
    const vipLevelElements = document.querySelectorAll('[data-vip-level], .vip-level, #vipLevel');
    vipLevelElements.forEach(el => {
        const level = userData.vip_level || userData.level || 1;
        if (el.id === 'vipLevel' || el.classList.contains('vip-level')) {
            el.textContent = `VIP${level}`;
        }
        if (el.hasAttribute('data-vip-level')) {
            el.setAttribute('data-vip-level', level);
        }
    });

    // 更新VIP累计投资显示（如果页面有相关元素）
    const vipTotalInvestElements = document.querySelectorAll('#vipTotalInvest, .vip-total-invest, [data-vip-total-invest]');
    vipTotalInvestElements.forEach(el => {
        const totalInvest = userData.vip_total_invest || userData.total_invest || 0;
        el.textContent = totalInvest.toFixed(2);
        if (el.hasAttribute('data-vip-total-invest')) {
            el.setAttribute('data-vip-total-invest', totalInvest.toFixed(2));
        }
    });

    // 更新额外利息显示（如果页面有相关元素）
    const extraInterestElements = document.querySelectorAll('#extraInterest, .extra-interest, [data-extra-interest]');
    extraInterestElements.forEach(el => {
        const extraInterest = userData.extra_interest || 0;
        el.textContent = extraInterest.toFixed(2);
        if (el.hasAttribute('data-extra-interest')) {
            el.setAttribute('data-extra-interest', extraInterest.toFixed(2));
        }
    });

    // 更新VIP额外收益率显示（如果页面有相关元素）
    const vipExtraRateElements = document.querySelectorAll('#vipExtraRate, .vip-extra-rate, [data-vip-extra-rate]');
    vipExtraRateElements.forEach(el => {
        const vipExtraRate = userData.vip_extra_rate || userData.vip_rate || 0;
        el.textContent = vipExtraRate.toFixed(2) + '%';
        if (el.hasAttribute('data-vip-extra-rate')) {
            el.setAttribute('data-vip-extra-rate', vipExtraRate.toFixed(2));
        }
    });

    // 更新今日收益显示（如果页面有相关元素）
    const todayProfitElements = document.querySelectorAll('#todayProfit, .today-profit, [data-today-profit]');
    todayProfitElements.forEach(el => {
        const todayProfit = userData.today_profit || 0;
        el.textContent = todayProfit.toFixed(2);
        if (el.hasAttribute('data-today-profit')) {
            el.setAttribute('data-today-profit', todayProfit.toFixed(2));
        }
    });

    // 更新昨日收益显示（如果页面有相关元素）
    const yesterdayProfitElements = document.querySelectorAll('#yesterdayProfit, .yesterday-profit, [data-yesterday-profit]');
    yesterdayProfitElements.forEach(el => {
        const yesterdayProfit = userData.yesterday_profit || 0;
        el.textContent = yesterdayProfit.toFixed(2);
        if (el.hasAttribute('data-yesterday-profit')) {
            el.setAttribute('data-yesterday-profit', yesterdayProfit.toFixed(2));
        }
    });
}

// 更新升级进度（从后端接口获取真实数据）
async function updateUpgradeProgress() {
    if (!userData.token) {
        console.warn('[VIP进度] 未登录，跳过加载');
        return;
    }

    try {
        await waitForAPI();

        // 优先使用统一API封装
        let response = null;
        if (window.API && window.API.vip && window.API.vip.getInfo) {
            const result = await window.API.vip.getInfo();
            if (result.success && result.data) {
                // 转换格式以兼容现有代码
                response = { code: 200, msg: 'ok', data: result.data };
            }
        }

        // 降级方案
        if (!response) {
            const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
            const res = await window.ApiClient.request(API_BASE + '/api/user/vip-progress', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userData.token}`,
                    'Token': userData.token
                }
            });
            const text = await res.text();
            try {
                response = JSON.parse(text);
            } catch (e) {
                setDefaultProgress();
                return;
            }
        }

        // 兼容多种返回格式
        let data = null;

        // 格式1: {code: 200, data: {...}}
        if (response.code === 1 && response.data) {
            data = response.data;
        }
        // 格式2: {msg: 'ok', data: {...}}
        else if (response.msg === 'ok' && response.data) {
            data = response.data;
        }
        // 格式3: 直接返回数据对象 {current_level: 1, next_level: 2, ...}
        else if (response.current_level !== undefined || response.next_level !== undefined) {
            data = response;
        }

        if (data) {
            // 获取当前等级和下一等级
            const currentLevel = parseInt(data.current_level || data.level || userData.level || 1);
            const nextLevel = parseInt(data.next_level || (currentLevel >= 8 ? 8 : currentLevel + 1));

            // 获取升级所需金额（兼容多种字段名）
            const needInvest = parseFloat(data.need_invest || data.need_amount || data.needInvest || 0);

            // 获取当前投资额
            const currentInvest = parseFloat(data.current_invest || data.current_amount || data.recharges || userData.recharges || 0);

            // 计算进度百分比
            let progress = 0;
            if (data.progress_percent !== undefined) {
                progress = parseFloat(data.progress_percent);
            } else if (data.progress !== undefined) {
                progress = parseFloat(data.progress);
            } else if (needInvest > 0) {
                // 自己计算进度
                progress = Math.min((currentInvest / (currentInvest + needInvest)) * 100, 100);
            }

            // 计算最终显示的进度百分比（至少5%，除非已达最高等级）
            const progressPercent = currentLevel >= 8 ? 100 : Math.max(parseFloat(progress), 5);

            // 更新VIP卡片中的进度条
            const nextVipLevelEl = document.getElementById('nextVipLevel');
            const needInvestAmountEl = document.getElementById('needInvestAmount');
            const vipProgressFillEl = document.getElementById('vipProgressFill');

            if (nextVipLevelEl) {
                if (currentLevel >= 8) {
                    nextVipLevelEl.textContent = '最高等级';
                } else {
                    nextVipLevelEl.textContent = `VIP${nextLevel}`;
                }
            }

            if (needInvestAmountEl) {
                needInvestAmountEl.textContent = formatMoney(needInvest);
            }

            if (vipProgressFillEl) {
                vipProgressFillEl.style.width = progressPercent + '%';
            }

            // 更新进度百分比显示
            const vipProgressPercentEl = document.getElementById('vipProgressPercent');
            if (vipProgressPercentEl) {
                vipProgressPercentEl.textContent = Math.round(progressPercent) + '%';
            }

            // 确保进度条显示
            const vipProgressBar = document.querySelector('.vip-progress-bar');
            if (vipProgressBar) {
                vipProgressBar.style.display = 'block';
                vipProgressBar.style.visibility = 'visible';
            }
        } else {
            // 如果接口失败，使用默认值
            setDefaultProgress();
        }
    } catch (error) {
        // 如果接口失败，使用默认值
        setDefaultProgress();
    }
}

// 设置默认进度值（接口失败时使用）
function setDefaultProgress() {
    const currentLevel = userData.level || 1;
    const nextLevel = currentLevel >= 8 ? 8 : currentLevel + 1;
    const needInvest = 0;

    const nextVipLevelEl = document.getElementById('nextVipLevel');
    const needInvestAmountEl = document.getElementById('needInvestAmount');
    const vipProgressFillEl = document.getElementById('vipProgressFill');

    if (nextVipLevelEl) {
        nextVipLevelEl.textContent = `VIP${nextLevel}`;
    }

    if (needInvestAmountEl) {
        needInvestAmountEl.textContent = formatMoney(needInvest);
    }

    if (vipProgressFillEl) {
        vipProgressFillEl.style.width = '5%';
    }
}

// 绑定事件
function bindEvents() {
    // 退出登录
    const logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // 设置图标点击
    const settingsIcon = document.querySelector('.settings-icon');
    if (settingsIcon) {
        settingsIcon.addEventListener('click', function () {
            showToast('提示', '设置功能开发中');
        });
    }
}

// 退出登录
async function handleLogout() {
    const confirmed = await showConfirm('确认退出', '确定要退出登录吗？');
    if (confirmed) {
        TokenManager.removeToken();
        await showToast('提示', '已退出登录');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }
}


// 格式化金额
function formatMoney(amount) {
    return parseFloat(amount || 0).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
