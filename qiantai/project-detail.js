// Providence 项目详情页 - 完全重构版
// 目标：简单直接，确保数据能正常显示
// ✅ 新增功能：下拉刷新、数据缓存、Token 统一

console.log('📜 项目详情脚本加载');

// ============================================
// 缓存管理
// ============================================
const ProjectDetailCache = {
    CACHE_KEY_PREFIX: 'project_detail_',
    CACHE_EXPIRY_MS: 5 * 60 * 1000,  // 5分钟缓存

    /**
     * 获取缓存数据
     */
    get(projectId) {
        try {
            const key = this.CACHE_KEY_PREFIX + projectId;
            const cached = localStorage.getItem(key);
            if (!cached) return null;

            const { data, timestamp } = JSON.parse(cached);
            const now = Date.now();

            // 检查缓存是否过期
            if (now - timestamp > this.CACHE_EXPIRY_MS) {
                localStorage.removeItem(key);
                console.log('[缓存] 项目', projectId, '缓存已过期，已清除');
                return null;
            }

            console.log('[缓存] 项目', projectId, '缓存命中');
            return data;
        } catch (err) {
            console.error('[缓存] 读取缓存失败:', err);
            return null;
        }
    },

    /**
     * 保存缓存数据
     */
    set(projectId, data) {
        try {
            const key = this.CACHE_KEY_PREFIX + projectId;
            const cached = {
                data: data,
                timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(cached));
            console.log('[缓存] 项目', projectId, '缓存已保存');
        } catch (err) {
            console.error('[缓存] 保存缓存失败:', err);
        }
    },

    /**
     * 清除缓存
     */
    clear(projectId) {
        try {
            const key = this.CACHE_KEY_PREFIX + projectId;
            localStorage.removeItem(key);
            console.log('[缓存] 项目', projectId, '缓存已清除');
        } catch (err) {
            console.error('[缓存] 清除缓存失败:', err);
        }
    }
};

// ============================================
// 下拉刷新管理
// ============================================
const PullRefresh = {
    isRefreshing: false,
    startY: 0,
    currentY: 0,

    /**
     * 初始化下拉刷新
     */
    init() {
        const main = document.querySelector('.wrap') || document.documentElement;

        main.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        main.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        main.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
    },

    handleTouchStart(e) {
        // 只在页面顶部检测下拉
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        if (scrollTop === 0) {
            this.startY = e.touches[0].clientY;
        }
    },

    handleTouchMove(e) {
        if (this.isRefreshing) return;
        if (this.startY === 0) return;

        this.currentY = e.touches[0].clientY;
        const distance = this.currentY - this.startY;

        // 下拉距离大于 50px 时触发刷新
        if (distance > 50 && document.documentElement.scrollTop === 0) {
            console.log('[下拉刷新] 触发刷新');
            this.refresh();
        }
    },

    handleTouchEnd() {
        this.startY = 0;
        this.currentY = 0;
    },

    /**
     * 执行刷新
     */
    async refresh() {
        if (this.isRefreshing) return;
        this.isRefreshing = true;

        try {
            console.log('[下拉刷新] 开始刷新数据');
            const projectId = getUrlParam('id');

            // 清除缓存并重新加载
            ProjectDetailCache.clear(projectId);
            await loadProject(projectId);

            console.log('[下拉刷新] 数据刷新完成');
            if (typeof showToast === 'function') {
                showToast('数据已更新', 1500);
            }
        } catch (err) {
            console.error('[下拉刷新] 刷新失败:', err);
            if (typeof showToast === 'function') {
                showToast('刷新失败，请稍后重试', 2000);
            }
        } finally {
            this.isRefreshing = false;
        }
    }
};

// 获取URL参数
function getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// 等待API加载
function waitForAPI() {
    return new Promise((resolve) => {
        if (window.API_CONFIG) {
            resolve();
        } else {
            const check = setInterval(() => {
                if (window.API_CONFIG) {
                    clearInterval(check);
                    resolve();
                }
            }, 50);
            setTimeout(() => { clearInterval(check); resolve(); }, 3000);
        }
    });
}

// 初始化
async function init() {
    console.log('🚀 项目详情页初始化');

    const projectId = getUrlParam('id');
    if (!projectId) {
        alert('缺少项目ID参数');
        return;
    }

    console.log('📋 项目ID:', projectId);

    // 检查登录状态
    const token = TokenManager?.getToken() || localStorage.getItem('providence_token');
    if (!token) {
        console.warn('[认购详情] 未登录，跳转到登录页');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
        return;
    }

    await waitForAPI();

    // 初始化下拉刷新
    PullRefresh.init();

    // 优先从缓存加载
    const cached = ProjectDetailCache.get(projectId);
    if (cached) {
        updatePage(cached);
        await loadUserBalance();  // 余额始终重新加载
    }

    // 后台加载最新数据
    await loadProject(projectId);
}

// project-detail.html —— 提速版数据加载（并行）
// 注意：此函数需要 renderDetail 和 renderCalc 函数支持
// async function loadProjectDetail() {
//     const id = getUrlParam('id');
//     if (!id) return;
//
//     // 🚀 并行获取项目信息 + 收益计算规则
//     const [detailRes, calcRes] = await Promise.all([
//         window.httpClient.get(`/api/project/detail.php?id=${id}`),
//         window.httpClient.get(`/api/project/calculate.php?id=${id}`)
//     ]);
//
//     if (detailRes.code === 1) renderDetail(detailRes.data);
//     if (calcRes.code === 1) renderCalc(calcRes.data);
// }

// 加载项目数据（保留兼容）
async function loadProject(id) {
    try {
        const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
        const token = TokenManager.getToken() || localStorage.getItem('providence_token') || '';

        // 添加超时控制（8秒）
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        let data = null;

        // 优先使用统一API封装（如果存在）
        if (window.ApiService && window.ApiService.project && window.ApiService.project.getDetail) {
            try {
                const apiPromise = window.ApiService.project.getDetail(id);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('API调用超时')), 8000)
                );
                const result = await Promise.race([apiPromise, timeoutPromise]);

                if (result && result.code === 1 && result.data) {
                    data = result;
                    console.log("[Project Detail] ✓ 使用统一API封装");
                }
            } catch (apiError) {
                console.warn("[Project Detail] 统一API封装调用失败:", apiError.message);
            }
        }

        // 降级方案：直接调用API
        if (!data) {
            try {
                const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
                // 使用正确的后端接口
                const url = `${API_BASE}/api/project/detail?id=${id}`;
                console.log('📡 请求项目详情:', url);

                const res = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Token': token  // ✅ 首字母大写，与其他 API 调用保持一致
                    },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }

                const contentType = res.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const text = await res.text();
                    throw new Error(`返回的不是JSON格式: ${text.substring(0, 100)}`);
                }

                const text = await res.text();
                try {
                    data = JSON.parse(text);
                    console.log("[Project Detail] ✓ 使用直接API调用，响应:", data);
                } catch (parseError) {
                    console.error("[Project Detail] JSON解析失败:", text.substring(0, 100));
                    throw new Error("服务器返回格式错误");
                }
            } catch (fetchError) {
                clearTimeout(timeoutId);
                if (fetchError.name === 'AbortError') {
                    throw new Error('请求超时，请稍后重试');
                }
                throw fetchError;
            }
        }

        console.log('📦 响应:', data);

        // 处理响应格式：code === 1 表示成功
        if (data && data.code === 1 && data.data) {
            const project = data.data;
            console.log('✅ 项目数据:', project);

            // 保存到缓存
            ProjectDetailCache.set(id, project);

            // 更新页面显示
            updatePage(project);
            await loadUserBalance(); // 加载用户余额
        } else {
            const errorMsg = data?.msg || data?.message || '加载失败';
            console.error('❌ API错误:', errorMsg, data);
            showError(errorMsg);
        }
    } catch (err) {
        console.error('❌ 加载失败:', err);
        showError(err.message || '网络错误');
    }
}

// 更新页面显示
function updatePage(p) {
    console.log('🎨 更新页面');

    // 保存项目信息供其他函数使用
    currentProject = p;

    // 项目名称和副标题
    const projName = document.getElementById('projName');
    if (projName) projName.textContent = p.name || p.title || '投资项目';

    const projSub = document.getElementById('projSub');
    if (projSub) {
        const category = p.category || p.categoryName || '固收优选';
        const desc = p.description || p.desc || p.intro || '';
        projSub.textContent = desc ? `${category} · ${desc.substring(0, 30)}${desc.length > 30 ? '...' : ''}` : category;
    }

    // 四个关键指标 - 修正字段映射
    const cycle = document.getElementById('cycle');
    if (cycle) {
        const days = parseInt(p.cycle || p.total_days || p.cycle_days || p.day || p.period || 0);
        if (days > 0) {
            if (days < 30) {
                cycle.textContent = `${days} 天`;
            } else if (days < 365) {
                const months = Math.floor(days / 30);
                cycle.textContent = `${months} 个月`;
            } else {
                const years = Math.floor(days / 365);
                cycle.textContent = `${years} 年`;
            }
        } else {
            cycle.textContent = '灵活';
        }
    }

    const rateVip = document.getElementById('rateVip');
    if (rateVip) {
        const vipRate = parseFloat(p.usdt_bonus || p.added_rate || p.vip_rate || 0);
        rateVip.textContent = vipRate > 0 ? `+${vipRate.toFixed(2)}%` : '无';
    }

    const maxAmt = document.getElementById('maxAmt');
    if (maxAmt) {
        const max = parseFloat(p.max_amount || p.max_invest || p.max || 0);
        maxAmt.textContent = max > 0 ? `¥${max.toLocaleString('zh-CN')}` : '无限制';
    }

    const minAmt = document.getElementById('minAmt');
    if (minAmt) {
        const min = parseFloat(p.min_amount || p.min_invest || p.min || 0);
        minAmt.textContent = min > 0 ? `¥${min.toLocaleString('zh-CN')}` : '—';
    }

    // 募集进度（使用API返回的progress字段或计算）
    const prog = document.getElementById('prog');
    if (prog) {
        const total = parseFloat(p.total_amount || p.total || p.total_quota || 0);
        const sold = parseFloat(p.sold_amount || p.sold || 0);
        const schedule = parseFloat(p.progress || p.schedule || 0);
        let progress = schedule;
        if (progress === 0 && total > 0) {
            progress = Math.min((sold / total) * 100, 100);
        }
        prog.style.width = progress + '%';
        prog.textContent = progress.toFixed(1) + '%';
    }

    // 募集信息
    const soldInfo = document.getElementById('soldInfo');
    if (soldInfo) {
        const sold = parseFloat(p.sold_amount || p.sold || 0);
        soldInfo.textContent = `已募集: ¥${sold.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    const totalInfo = document.getElementById('totalInfo');
    if (totalInfo) {
        const total = parseFloat(p.total_amount || p.total || p.total_quota || 0);
        totalInfo.textContent = `总额度: ¥${total > 0 ? total.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '无限制'}`;
    }

    // 项目详情
    const projectDesc = document.getElementById('projectDesc');
    if (projectDesc) {
        const desc = p.description || p.desc || p.intro || p.content || '';
        if (desc) {
            projectDesc.innerHTML = `<p style="margin: 0; white-space: pre-wrap;">${desc.replace(/\n/g, '<br>')}</p>`;
        } else {
            projectDesc.innerHTML = '<p style="margin: 0; color: #8a95a6;">暂无项目详情</p>';
        }
    }

    // 收益说明（使用API返回的字段）
    const baseRate = document.getElementById('baseRate');
    if (baseRate) {
        const rate = parseFloat(p.rate || p.base_rate || p.daily_rate || 0);
        baseRate.textContent = rate > 0 ? `${rate.toFixed(2)}%` : '—';
    }

    const vipRateText = document.getElementById('vipRateText');
    if (vipRateText) {
        const vipRate = parseFloat(p.vip_rate || 0);
        vipRateText.textContent = vipRate > 0 ? `+${vipRate.toFixed(2)}%` : '无';
    }

    const addedRateText = document.getElementById('addedRateText');
    if (addedRateText) {
        const added = parseFloat(p.added || p.added_rate || 0);
        addedRateText.textContent = added > 0 ? `${added.toFixed(2)}%` : '无';
    }

    const giftRateText = document.getElementById('giftRateText');
    if (giftRateText) {
        const gift = parseFloat(p.gift || p.gift_rate || 0);
        giftRateText.textContent = gift > 0 ? `${gift.toFixed(2)}%` : '无';
    }

    // 总收益率显示
    const totalRateEl = document.getElementById('totalRate');
    if (totalRateEl) {
        const totalRate = parseFloat(p.total_rate || 0);
        totalRateEl.textContent = totalRate > 0 ? `${totalRate.toFixed(2)}%` : '—';
    }

    // 购买和返利信息
    if (p.purchase_info) {
        const cnyRate = document.getElementById('cnyRate');
        const cnyRebate = document.getElementById('cnyRebate');
        const usdtRate = document.getElementById('usdtRate');
        const usdtRebate = document.getElementById('usdtRebate');

        if (cnyRate) {
            const rate = parseFloat(p.purchase_info.cny?.rate || p.rate || 0);
            cnyRate.textContent = rate > 0 ? `${rate.toFixed(2)}%` : '—';
        }
        if (cnyRebate) {
            const rebate = parseFloat(p.purchase_info.cny?.rebate || 0);
            cnyRebate.textContent = rebate > 0 ? `${rebate.toFixed(2)}%` : '—';
        }
        if (usdtRate) {
            const rate = parseFloat(p.purchase_info.usdt?.rate || 0);
            usdtRate.textContent = rate > 0 ? `${rate.toFixed(2)}%` : '—';
        }
        if (usdtRebate) {
            const rebate = parseFloat(p.purchase_info.usdt?.rebate || 0);
            usdtRebate.textContent = rebate > 0 ? `${rebate.toFixed(2)}%` : '—';
        }
    }

    // 倒计时
    if (p.countdown) {
        const countdownBox = document.getElementById('countdownBox');
        const countdownEl = document.getElementById('countdown');
        if (countdownBox && countdownEl) {
            countdownBox.style.display = 'block';
            startCountdown(p.countdown, countdownEl);
        }
    }

    // 项目经理信息（使用推荐理由数据）
    const pmInfo = document.getElementById('pmInfo');
    if (pmInfo && window.PROJECT_RECOMMENDATIONS) {
        const recommendation = window.PROJECT_RECOMMENDATIONS.getRandomRecommendation();
        const manager = recommendation.manager;

        pmInfo.innerHTML = `
            <img src="${manager.avatar}" alt="${manager.name}" onerror="this.src='img/user-avatar-default.svg'">
            <div style="flex: 1;">
                <b>${manager.name}</b>
                <div><small>${manager.title}</small></div>
                <div style="margin-top: 4px; font-size: 11px; color: #647086; line-height: 1.4;">${recommendation.reason}</div>
            </div>
        `;
    } else if (pmInfo) {
        const managerName = p.manager_name || p.company_name || 'PROVIDENCE';
        const managerAvatar = p.manager_avatar || p.company_image || 'img/user-avatar-default.svg';
        const managerTitle = p.manager_title || '项目负责人';

        pmInfo.innerHTML = `
            <img src="${managerAvatar}" alt="${managerName}" onerror="this.src='img/user-avatar-default.svg'">
            <div>
                <b>${managerName}</b>
                <div><small>${managerTitle}</small></div>
            </div>
        `;
    }

    // 显示兑换功能（如果项目支持USDT）
    const exchangeSection = document.getElementById('exchangeSection');
    if (exchangeSection && (p.currency === 'USDT' || p.currency === 'BOTH')) {
        exchangeSection.style.display = 'block';
        initExchange();
    }

    // 隐藏所有加载中...文本
    hideAllLoading();

    console.log('✅ 页面更新完成');
}

// 倒计时更新
let countdownInterval = null;
function startCountdown(countdownData, element) {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    let remaining = countdownData.remaining_seconds || 0;

    function update() {
        if (remaining <= 0) {
            element.textContent = '00-00-00';
            if (countdownInterval) {
                clearInterval(countdownInterval);
            }
            return;
        }

        const days = Math.floor(remaining / 86400);
        const hours = Math.floor((remaining % 86400) / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);

        element.textContent = `${String(days).padStart(2, '0')}-${String(hours).padStart(2, '0')}-${String(minutes).padStart(2, '0')}`;
        remaining--;
    }

    update();
    countdownInterval = setInterval(update, 60000); // 每分钟更新一次
}

// 初始化兑换功能
let exchangeRate = 0;
async function initExchange() {
    try {
        const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
        const token = TokenManager.getToken() || localStorage.getItem('providence_token') || '';

        const response = await fetch(`${API_BASE}/currency/get-usdt-rate`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Token': token
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.code === 1 && data.data) {
                exchangeRate = parseFloat(data.data.rate || 0);
                const rateEl = document.getElementById('exchangeRate');
                if (rateEl) {
                    rateEl.textContent = `汇率: 1 CNY = ${exchangeRate.toFixed(4)} USDT`;
                }
            }
        }
    } catch (err) {
        console.error('[Exchange] 获取汇率失败:', err);
    }

    // 绑定兑换输入事件
    const exchangeCny = document.getElementById('exchangeCny');
    const exchangeUsdt = document.getElementById('exchangeUsdt');
    const exchangeBtn = document.getElementById('exchangeBtn');

    if (exchangeCny) {
        exchangeCny.addEventListener('input', (e) => {
            const cny = parseFloat(e.target.value || 0);
            if (exchangeUsdt && exchangeRate > 0) {
                exchangeUsdt.value = (cny * exchangeRate).toFixed(4);
            }
        });
    }

    if (exchangeBtn) {
        exchangeBtn.addEventListener('click', handleExchange);
    }
}

// 处理兑换
async function handleExchange() {
    const exchangeCny = document.getElementById('exchangeCny');
    const amount = parseFloat(exchangeCny?.value || 0);

    if (amount <= 0) {
        if (typeof showToast === 'function') {
            showToast('请输入兑换金额', 2000);
        }
        return;
    }

    try {
        const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
        const token = TokenManager.getToken() || localStorage.getItem('providence_token') || '';

        const response = await fetch(`${API_BASE}/currency/exchange-cny-to-usdt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Token': token
            },
            body: JSON.stringify({ amount: amount })
        });

        const data = await response.json();

        if (data.code === 1) {
            if (typeof showToast === 'function') {
                showToast('兑换成功', 2000);
            }
            exchangeCny.value = '';
            document.getElementById('exchangeUsdt').value = '';
            await loadUserBalance(); // 重新加载余额
        } else {
            if (typeof showToast === 'function') {
                showToast(data.msg || '兑换失败', 2000);
            }
        }
    } catch (err) {
        console.error('[Exchange] 兑换失败:', err);
        if (typeof showToast === 'function') {
            showToast('兑换失败，请稍后重试', 2000);
        }
    }
}

// 显示项目经理详情（占位函数）
function showManagerDetail() {
    if (typeof showToast === 'function') {
        showToast('项目经理详情功能开发中', 2000);
    } else {
        alert('项目经理详情功能开发中');
    }
}

// 加载用户余额（CNY和USDT）
async function loadUserBalance() {
    try {
        const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
        const token = TokenManager.getToken() || localStorage.getItem('providence_token') || '';

        if (!token) {
            const balanceCnyEl = document.getElementById('balanceCny');
            const balanceUsdtEl = document.getElementById('balanceUsdt');
            if (balanceCnyEl) balanceCnyEl.textContent = '请先登录';
            if (balanceUsdtEl) balanceUsdtEl.textContent = '请先登录';
            return;
        }

        let userData = null;

        // 优先使用统一API封装
        if (window.ApiService && window.ApiService.finance && window.ApiService.finance.getUserBalance) {
            try {
                const result = await window.ApiService.finance.getUserBalance();
                if (result && result.data) {
                    userData = result.data;
                    console.log("[Balance] ✓ 使用ApiService获取余额");
                }
            } catch (e) {
                console.warn("[Balance] ApiService调用失败:", e);
            }
        }

        // 降级方案
        if (!userData) {
            const response = await fetch(API_BASE + "/api/user/info", {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Token': token
                }
            });

            if (response.ok) {
                const text = await response.text();
                try {
                    const data = JSON.parse(text);
                    if (data.code === 1 && data.data) {
                        userData = data.data;
                        console.log("[Balance] ✓ 使用直接API获取余额");
                    }
                } catch (e) {
                    console.warn("[Balance] JSON解析失败:", e);
                }
            }
        }

        // 更新CNY余额
        const balanceCnyEl = document.getElementById('balanceCny');
        if (balanceCnyEl && userData) {
            const balanceCny = parseFloat(userData.balance_cny || userData.money || 0);
            balanceCnyEl.textContent = `¥${balanceCny.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        // 更新USDT余额
        const balanceUsdtEl = document.getElementById('balanceUsdt');
        if (balanceUsdtEl && userData) {
            const balanceUsdt = parseFloat(userData.balance_usdt || 0);
            balanceUsdtEl.textContent = balanceUsdt.toFixed(4);
        }
    } catch (err) {
        console.warn("[Balance] 加载余额失败:", err);
        const balanceCnyEl = document.getElementById('balanceCny');
        const balanceUsdtEl = document.getElementById('balanceUsdt');
        if (balanceCnyEl) balanceCnyEl.textContent = '加载失败';
        if (balanceUsdtEl) balanceUsdtEl.textContent = '加载失败';
    }
}

// 隐藏所有加载中
function hideAllLoading() {
    const loadingEls = document.querySelectorAll('.loading, [data-loading]');
    loadingEls.forEach(el => el.style.display = 'none');

    // 移除加载中...文本
    document.body.innerHTML = document.body.innerHTML.replace(/加载中\.\.\./g, '');
    document.body.innerHTML = document.body.innerHTML.replace(/正在加载项目信息/g, '');
    document.body.innerHTML = document.body.innerHTML.replace(/正在加载/g, '');
}

// 显示错误
function showError(msg) {
    const projName = document.getElementById('projName');
    if (projName) projName.textContent = '加载失败: ' + msg;

    if (typeof showToast === 'function') {
        showToast(msg, 3000);
    } else {
        alert(msg);
    }
}

// 显示项目经理详情（占位函数）

// 全局变量：当前项目信息
let currentProject = null;

// 收益试算
let calculateTimer = null;
async function calculateProfit() {
    const amountInput = document.getElementById('investAmount');
    const calcResult = document.getElementById('calcResult');
    const calcWarn = document.getElementById('calcWarn');

    if (!amountInput || !currentProject) return;

    const amount = parseFloat(amountInput.value || 0);

    // 清空警告
    calcWarn.style.display = 'none';
    calcWarn.textContent = '';

    if (amount <= 0) {
        calcResult.style.display = 'none';
        return;
    }

    // 验证金额范围
    const min = parseFloat(currentProject.min_invest || 0);
    const max = parseFloat(currentProject.max_invest || 0);

    if (min > 0 && amount < min) {
        calcWarn.style.display = 'block';
        calcWarn.textContent = `最低投资金额为 ¥${min.toLocaleString('zh-CN')}`;
        calcResult.style.display = 'none';
        return;
    }

    if (max > 0 && amount > max) {
        calcWarn.style.display = 'block';
        calcWarn.textContent = `最高投资金额为 ¥${max.toLocaleString('zh-CN')}`;
        calcResult.style.display = 'none';
        return;
    }

    // 防抖：延迟500ms后调用API
    clearTimeout(calculateTimer);
    calculateTimer = setTimeout(async () => {
        try {
            const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
            const token = TokenManager.getToken() || localStorage.getItem('providence_token') || '';
            const projectId = getUrlParam('id');

            if (!token) {
                calcWarn.style.display = 'block';
                calcWarn.textContent = '请先登录';
                return;
            }

            const response = await fetch(`${API_BASE}/fund/api/project/calculate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Token': token
                },
                body: JSON.stringify({
                    project_id: parseInt(projectId),
                    amount: amount
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.code === 1 && data.data) {
                const profit = parseFloat(data.data.profit || 0);
                const total = parseFloat(data.data.total || 0);
                const dailyProfit = parseFloat(data.data.daily_profit || 0);

                document.getElementById('calcProfit').textContent = `¥${profit.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                document.getElementById('calcTotal').textContent = `¥${total.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                document.getElementById('calcDailyProfit').textContent = `¥${dailyProfit.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                calcResult.style.display = 'block';
            } else {
                calcWarn.style.display = 'block';
                calcWarn.textContent = data.msg || '计算失败';
            }
        } catch (err) {
            console.error('[Calculate] 试算失败:', err);
            calcWarn.style.display = 'block';
            calcWarn.textContent = '计算失败，请稍后重试';
        }
    }, 500);
}

// 购买项目 - 使用投资工作流服务
async function investProject() {
    const projectId = getUrlParam('id');
    const amountInput = document.getElementById('investAmount');
    const applyBtn = document.getElementById('applyBtn');

    if (!projectId || !amountInput || !currentProject) {
        showToast('参数错误', 2000);
        return;
    }

    const amount = parseFloat(amountInput.value || 0);

    if (amount <= 0) {
        showToast('请输入投资金额', 2000);
        amountInput.focus();
        return;
    }

    // 验证金额范围
    const min = parseFloat(currentProject.min_invest || 0);
    const max = parseFloat(currentProject.max_invest || 0);

    if (min > 0 && amount < min) {
        showToast(`最低投资金额为 ¥${min.toLocaleString('zh-CN')}`, 2000);
        return;
    }

    if (max > 0 && amount > max) {
        showToast(`最高投资金额为 ¥${max.toLocaleString('zh-CN')}`, 2000);
        return;
    }

    // 检查登录
    const token = TokenManager.getToken() || localStorage.getItem('providence_token') || '';
    if (!token) {
        showToast('请先登录', 2000);
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }

    // 禁用按钮，防止重复提交
    if (applyBtn) {
        applyBtn.disabled = true;
        applyBtn.textContent = '提交中...';
    }

    try {
        // 使用投资工作流服务（如果可用）
        if (window.InvestmentWorkflowService) {
            const result = await window.InvestmentWorkflowService.executeWorkflow({
                projectId: parseInt(projectId),
                amount: amount,
                currency: currentProject.currency || 'CNY'
            });

            if (result.success) {
                // 显示投资成功及附加信息
                let successMsg = '投资成功！';
                if (result.vipLevel && result.vipLevel.upgraded) {
                    successMsg = `投资成功！恭喜升级到 VIP${result.vipLevel.qualified}`;
                }
                showToast(successMsg, 2500);

                // 清空输入框
                amountInput.value = '';
                const calcResult = document.getElementById('calcResult');
                if (calcResult) calcResult.style.display = 'none';

                // 刷新余额
                await loadUserBalance();

                // 延迟跳转到订单页面
                setTimeout(() => {
                    window.location.href = 'orders.html';
                }, 2500);
            } else {
                throw new Error(result.error || '投资失败');
            }
        } else {
            // 降级方案：直接调用API
            const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
            const idempotencyKey = 'INV_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

            const response = await fetch(`${API_BASE}/fund/api/project/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Token': token,
                    'Idempotency-Key': idempotencyKey
                },
                body: JSON.stringify({
                    project_id: parseInt(projectId),
                    amount: amount,
                    currency: currentProject.currency || 'CNY'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.code === 1) {
                showToast('投资成功！', 2000);
                amountInput.value = '';
                const calcResult = document.getElementById('calcResult');
                if (calcResult) calcResult.style.display = 'none';
                await loadUserBalance();
                setTimeout(() => {
                    window.location.href = 'orders.html';
                }, 2000);
            } else {
                showToast(data.msg || '投资失败', 3000);
            }
        }
    } catch (err) {
        console.error('[Invest] 投资失败:', err);
        showToast('投资失败：' + (err.message || '网络错误'), 3000);
    } finally {
        // 恢复按钮
        if (applyBtn) {
            applyBtn.disabled = false;
            applyBtn.textContent = '申请认购';
        }
    }
}

// ========================================
// 自动初始化
// ========================================
// 监听 DOMContentLoaded 事件
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // 文档已加载，直接调用
    init();
}
