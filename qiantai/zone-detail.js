// 专区介绍页面 - 统一使用config.js的API封装
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
    level: 1
};

let categoryData = null;
let zoneProducts = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ zone-detail.js 已加载');
    initPage();
});

async function initPage() {
    console.log('🚀 初始化专区介绍页面');

    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('id');

    if (!categoryId) {
        showError('缺少专区ID');
        return;
    }

    await loadZoneDetail(categoryId);
}

async function getUserLevel() {
    // if (!userData.token) {
    //     userData.level = 0;
    //     return;
    // }

    try {
        await waitForAPI();

        // 优先使用统一API封装
        let data = null;
        if (window.API && window.API.user && window.API.user.getInfo) {
            const result = await window.API.user.getInfo();
            if (result.success && result.data) {
                data = { code: 200, msg: 'ok', data: result.data };
            }
        }

        // 降级方案
        if (!data) {
            const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
            const response = await fetch(API_BASE + '/api/user/info', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                    // 'Token': userData.token
                }
            });
            const text = await response.text();
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('解析用户数据失败:', text.substring(0, 100));
                userData.level = 0;
                return;
            }
        }
        if (data.code === 1 || data.code === 200 && data.data) {
            userData.level = parseInt(data.data.level) || 1;
        } else {
            userData.level = 0;
        }
    } catch (error) {
        console.error('获取用户等级失败:', error);
        userData.level = 0;
    }
}

async function loadZoneDetail(categoryId) {
    console.log('[专区介绍] 加载专区ID:', categoryId);
    try {
        showLoading();

        await getUserLevel();
        await waitForAPI();

        // 优先使用统一API封装
        let data = null;
        if (window.API && window.API.fund && window.API.fund.getList) {
            const result = await window.API.fund.getList();
            if (result.success && result.data) {
                data = { code: 200, msg: 'ok', data: result.data };
            }
        }

        // 降级方案
        if (!data) {
            const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
            const response = await fetch(API_BASE + '/api/project/index', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`网络错误 (${response.status})`);
            }

            const text = await response.text();
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('解析项目数据失败:', text.substring(0, 100));
                throw new Error('数据解析失败');
            }
        }

        // 找到对应专区
        categoryData = data.data.find(cat => cat.id == categoryId);
        if (!categoryData) {
            showError('专区不存在');
            return;
        }

        zoneProducts = categoryData.list || [];
        console.log('[专区介绍] 加载成功，共', zoneProducts.length, '个产品');

        // 更新标题
        document.getElementById('pageTitle').textContent = categoryData.name || '专区介绍';

        renderZoneDetail();
    } catch (error) {
        console.error('[专区介绍] 加载失败:', error);
        showError('加载失败，请检查网络连接');
    }
}

function renderZoneDetail() {
    const container = document.getElementById('contentArea');

    const html = `
        <!-- 专区Hero -->
        <div class="zone-intro-hero">
            <h2 class="zone-hero-title">${categoryData.name || '投资项目'}</h2>
            <p class="zone-hero-subtitle">专业筛选，稳健收益</p>
            <div class="zone-features-grid">
                <div class="feature-badge">✓ 稳中求进</div>
                <div class="feature-badge">✓ 攻守兼备</div>
                <div class="feature-badge">✓ 优中选优</div>
            </div>
        </div>

        <!-- 投资策略 -->
        <div class="strategy-card">
            <h3 class="strategy-title">投资策略</h3>
            <div class="strategy-list">
                <div class="strategy-item">主投优质资产，追求稳健收益</div>
                <div class="strategy-item">分散投资组合，严格控制风险</div>
                <div class="strategy-item">专业团队管理，定期调仓优化</div>
            </div>
        </div>

        <!-- 适合人群 -->
        <div class="suitable-card">
            <h3 class="suitable-title">适合人群</h3>
            <div class="people-grid">
                <div class="people-item">
                    <div class="people-type">保守型投资者</div>
                    <p class="people-desc">风险偏好低，希望获取稳定收益，本金安全优先</p>
                </div>
                <div class="people-item">
                    <div class="people-type">稳健型投资者</div>
                    <p class="people-desc">追求平衡的投资策略，希望在风险可控前提下获得较好回报</p>
                </div>
                <div class="people-item">
                    <div class="people-type">价值型投资者</div>
                    <p class="people-desc">注重长期投资价值，愿意承担适中风险获取超额收益</p>
                </div>
            </div>
        </div>

        <!-- 产品列表 -->
        <div class="products-section">
            <h3 class="section-title">精选产品 (${zoneProducts.length}个)</h3>
            <div class="product-list-compact">
                ${zoneProducts.map(project => {
                    const vipRequired = parseInt(project.vip) || 0;
                    const isLocked = vipRequired > userData.level;
                    const rate = parseFloat(project.rate) || 0;
                    const vipRate = parseFloat(project.vip_rate) || 0;
                    const totalRate = rate + vipRate;
                    const status = parseInt(project.status);

                    return `
                        <div class="product-card-compact ${isLocked ? 'locked' : ''}" onclick="viewProjectDetail(${project.id})">
                            <div class="product-header-row">
                                <div class="product-title-row">
                                    <h4 class="product-title">${project.title || '投资项目'}</h4>
                                    <div class="product-code">${project.code || '000000'}</div>
                                </div>
                                ${isLocked ? '<span class="status-tag" style="background:#9c27b0;color:#fff;">VIP' + vipRequired + '</span>' : ''}
                                ${!isLocked ? '<span class="status-tag active">募集中</span>' : ''}
                            </div>

                            <div class="product-metrics">
                                <div class="metric-box">
                                    <div class="metric-value rate">${totalRate.toFixed(2)}%</div>
                                    <div class="metric-label">年化收益</div>
                                </div>
                                <div class="metric-box">
                                    <div class="metric-value period">${project.day || 0}天</div>
                                    <div class="metric-label">投资期限</div>
                                </div>
                                <div class="metric-box">
                                    <div class="metric-value amount">${formatMoney(project.min || 1000)}</div>
                                    <div class="metric-label">起投金额</div>
                                </div>
                            </div>

                            <div class="product-actions-row">
                                <span style="font-size:12px;color:#6b7a8a;">到期还本付息</span>
                                <button class="btn-invest-primary" onclick="event.stopPropagation(); viewProjectDetail(${project.id})">
                                    立即投资
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function viewProjectDetail(projectId) {
    window.location.href = `project-detail-new.html?id=${projectId}`;
}

function formatMoney(value) {
    const num = parseFloat(value) || 0;
    if (num >= 10000) {
        return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString('zh-CN', {minimumFractionDigits: 0, maximumFractionDigits: 0});
}

function showLoading() {
    const container = document.getElementById('contentArea');
    if (container) {
        container.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <div class="loading-text">加载中...</div>
            </div>
        `;
    }
}

function showError(message) {
    const container = document.getElementById('contentArea');
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <div class="empty-text">${message}</div>
            </div>
        `;
    }
}
