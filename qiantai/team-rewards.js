// 团队管理奖页面 - 统一使用config.js的API封装
// 确保在HTML中已加载config.js: <script src="config.js"></script>

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

let userData = {
    // token: TokenManager.getToken() || '',
    teamCount: 0,
    teamInvest: 0,
    rules: []
};

document.addEventListener('DOMContentLoaded', function() {
    // ✅ 登录检查（Integration Spec规范）
    if (typeof TokenManager !== "undefined" && TokenManager.requireLogin) {
        if (!TokenManager.requireLogin()) {
            return; // 未登录，已自动跳转
        }
    } else if (typeof TokenManager !== "undefined" && TokenManager.checkLogin) {
        if (!TokenManager.checkLogin()) {
            return; // 未登录，已自动跳转
        }
    }    initPage();
});

function initPage() {
    // if (!userData.token) {
    //     showToast('请先登录');
    //     setTimeout(() => {
    //         window.location.href = 'login.html';
    //     }, 1500);
    //     return;
    // }

    loadRewardsData();
}

async function loadRewardsData() {
    try {
        await waitForAPI();

        // 1. 获取团队统计信息（使用新的API）
        let teamInfo = null;
        if (window.httpClient) {
            try {
                const response = await window.httpClient.get('/api/team/reward-info');
                teamInfo = response.data || response;
            } catch (e) {
                console.error('[Team] 获取团队信息失败:', e);
            }
        } else {
            const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
            const token = TokenManager?.getToken() || localStorage.getItem('providence_token');
            const response = await fetch(API_BASE + '/api/team/reward-info', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Token': token
                }
            });

            if (response.ok) {
                teamInfo = await response.json();
            }
        }

        console.log('📡 团队统计信息:', teamInfo);

        // 2. 获取USDT汇率
        let usdtRate = 7.2; // 默认汇率
        try {
            if (window.httpClient) {
                const rateResponse = await window.httpClient.get('/api/currency/rate');
                const rateData = rateResponse.data || rateResponse;
                if (rateData && rateData.rate) {
                    usdtRate = parseFloat(rateData.rate);
                }
            } else {
                const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
                const rateResponse = await fetch(API_BASE + '/api/currency/rate', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (rateResponse.ok) {
                    const rateData = await rateResponse.json();
                    if (rateData && rateData.data && rateData.data.rate) {
                        usdtRate = parseFloat(rateData.data.rate);
                    }
                }
            }
        } catch (e) {
            console.warn('[Team] 获取汇率失败，使用默认值:', e);
        }

        // 3. 直接加载团队管理奖金表格（介绍页面不需要实时数据）
        loadBonusTable();
    } catch (error) {
        console.error('❌ 加载团队奖励数据失败:', error);
        showToast('加载失败，请重试');
    }
}

async function loadBonusTable() {
    const container = document.getElementById('bonusTableContainer');
    if (!container) return;

    try {
        // 团队管理奖奖励配置（基于需求规范）
        // 下级成员  累计投资      奖励
        const bonusLevels = {
            3: { min_invest: 80000, reward: 1800 },
            5: { min_invest: 150000, reward: 2500 },
            10: { min_invest: 500000, reward: 8800 },
            20: { min_invest: 1500000, reward: 18000 },
            50: { min_invest: 3800000, reward: 25000 },
            100: { min_invest: 8800000, reward: 38000 },
            200: { min_invest: 15000000, reward: 66000 },
            500: { min_invest: 58000000, reward: 100000 },
            1000: { min_invest: 98000000, reward: 180000 }
        };

        let tableHtml = '<table class="bonus-table"><thead><tr><th>下级成员</th><th>累计投资</th><th>奖励</th></tr></thead><tbody>';

        Object.keys(bonusLevels).sort((a, b) => parseInt(a) - parseInt(b)).forEach(level => {
            const config = bonusLevels[level];
            const memberCount = parseInt(level);
            const investAmount = config.min_invest || 0;
            const rewardAmount = config.reward || 0;

            tableHtml += `
                <tr>
                    <td>${memberCount}人</td>
                    <td>¥${formatMoney(investAmount)}</td>
                    <td>¥${formatNumber(rewardAmount)}</td>
                </tr>
            `;
        });

        tableHtml += '</tbody></table>';
        container.innerHTML = tableHtml;
    } catch (error) {
        console.error('加载奖金表格失败:', error);
        container.innerHTML = '<div class="empty-state"><div class="empty-text">加载失败</div></div>';
    }
}


function formatMoney(value) {
    const num = parseFloat(value) || 0;
    if (num >= 10000) {
        return (num / 10000).toFixed(2) + '万';
    }
    return num.toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function formatNumber(value) {
    return parseInt(value || 0).toLocaleString('zh-CN');
}

function showToast(message) {
    // 使用统一的toast函数（如果存在）
    if (typeof showToast === 'function' && window.showToast !== showToast) {
        window.showToast('', message);
        return;
    }

    // 降级方案：创建简单的toast
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 10000;
        pointer-events: none;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 2000);
}
