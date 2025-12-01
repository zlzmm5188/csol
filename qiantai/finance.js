/**
 * 项目页面 - 对接后台API（三板块：基金/IPO/债券）
 */

let fundsData = [];
let iposData = [];
let bondsData = [];
let currentSection = 'fund';

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

// 页面加载时获取项目数据
document.addEventListener('DOMContentLoaded', async function () {
    // ✅ 登录检查（Integration Spec规范）
    if (typeof TokenManager !== "undefined" && TokenManager.requireLogin) {
        if (!TokenManager.requireLogin()) {
            return; // 未登录，已自动跳转
        }
    } else if (typeof TokenManager !== "undefined" && TokenManager.checkLogin) {
        if (!TokenManager.checkLogin()) {
            return; // 未登录，已自动跳转
        }
    }    await loadAllProjects();
    initTabSwitching();
});

/**
 * 从后台/本地加载所有项目数据
 */
async function loadAllProjects() {
    try {
        console.log('📡 正在获取项目数据...');

        // 等待API对象加载
        await waitForAPI();

        // 优先使用统一API封装
        let apiResponse = null;
        let apiData = null;

        if (window.API && window.API.fund && window.API.fund.getList) {
            const result = await window.API.fund.getList();
            if (result.success && result.data) {
                apiData = { code: 200, msg: 'ok', data: result.data };
            }
        }

        // 降级方案：直接使用fetch
        if (!apiData) {
            const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
            try {
                apiResponse = await fetch(API_BASE + '/api/project/index', {
                    headers: { 'Accept': 'application/json' }
                });
                if (apiResponse && apiResponse.ok) {
                    const text = await apiResponse.text();

                    // 检查是否是HTML错误页面
                    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html') || text.includes('系统发生错误') || text.includes('ThinkPHP')) {
                        console.warn('[API] /api/project/index 返回HTML错误页面');
                    } else {
                        try {
                            apiData = JSON.parse(text);
                        } catch (e) {
                            console.warn('解析项目数据失败');
                        }
                    }
                }
            } catch (e) {
                console.warn('API失败，使用market-crawler');
            }
        }

        if (apiData && apiData.data && Array.isArray(apiData.data)) {
            // 解析API返回的项目数据
            fundsData = [];
            iposData = [];
            bondsData = [];

            apiData.data.forEach(cat => {
                if (cat.list && Array.isArray(cat.list)) {
                    cat.list.forEach(p => {
                        // 根据分类名称或项目属性分类
                        const categoryName = (cat.name || '').toLowerCase();
                        if (categoryName.includes('基金') || categoryName.includes('fund')) {
                            fundsData.push(p);
                        } else if (categoryName.includes('ipo') || categoryName.includes('新股')) {
                            iposData.push(p);
                        } else if (categoryName.includes('债券') || categoryName.includes('bond') || categoryName.includes('可转债')) {
                            bondsData.push(p);
                        } else {
                            // 默认放入基金
                            fundsData.push(p);
                        }
                    });
                }
            });

            console.log('✅ 项目数据加载成功（API）');
            // 标记当前板块已渲染
            renderedSections[currentSection] = true;
            renderCurrentSection();
            return;
        }

        // 如果API失败，从market-crawler获取数据
        const response = await fetch('market-crawler.php?action=get&type=all');
    const result = await response.json();

    if (result.success && result.data) {
        fundsData = result.data.funds || [];
        iposData = result.data.ipos || [];
        bondsData = result.data.bonds || [];

        console.log('✅ 项目数据加载成功（market-crawler）');
        renderedSections[currentSection] = true;
        renderCurrentSection();
    } else {
        loadDefaultProjects();
    }
    } catch (error) {
        console.error('❌ 加载项目失败:', error);
        loadDefaultProjects();
    }
}

/**
 * 加载默认项目数据（备用）
 */
function loadDefaultProjects() {
    fundsData = [{ code: '000001', name: '易方达优选', nav: 2.45, change: 1.2 }];
    iposData = [{ code: '301373', name: '凌玮科技', price: 28.5, status: '申购中' }];
    bondsData = [{ code: '019666', name: '23国债15', price: 100.03, yield: 2.85 }];
    renderCurrentSection();
}

/**
 * 渲染当前板块
 */
function renderCurrentSection() {
    if (currentSection === 'fund') {
        renderFunds();
    } else if (currentSection === 'ipo') {
        renderIPOs();
    } else if (currentSection === 'bond') {
        renderBonds();
    }
}

/**
 * 渲染基金项目
 */
function renderFunds() {
    const container = document.getElementById('fundProjectsList');
    if (!container || fundsData.length === 0) return;

    // 获取用户VIP信息
    const user = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const userVipLevel = user.vip_level || 1;
    const userVipRate = user.vip_rate || 0.3;

    const html = fundsData.slice(0, 10).map(fund => {
        const requiredVip = fund.required_vip_level || 1;
        const canBuy = userVipLevel >= requiredVip;
        const vipBadge = requiredVip > 1 ? `<span class="vip-badge">VIP${requiredVip}+</span>` : '';
        const baseRate = fund.rate || (fund.change_1m ? Math.abs(fund.change_1m / 3) : 8.5);
        const totalRate = baseRate + userVipRate;

        return `
        <div class="product-card ${!canBuy ? 'product-locked' : ''}">
            <div class="product-badge">优选</div>
            ${vipBadge}
            <div class="product-header">
                <h3>${fund.name} (${fund.code})</h3>
                <p class="product-subtitle">净值: ${fund.nav.toFixed(4)} · 涨跌: ${fund.change >= 0 ? '+' : ''}${fund.change.toFixed(2)}%</p>
            </div>
            <div class="product-rate-box">
                <div class="rate-item">
                    <span class="rate-label">基础年化</span>
                    <span class="rate-value">${baseRate.toFixed(2)}%</span>
                </div>
                <div class="rate-plus">+</div>
                <div class="rate-item">
                    <span class="rate-label">VIP加息</span>
                    <span class="rate-value vip-rate">+${userVipRate}%</span>
                </div>
                <div class="rate-total">
                    <span class="rate-label">实得年化</span>
                    <span class="rate-value total">${totalRate.toFixed(2)}%</span>
                </div>
            </div>
            <div class="product-highlights">
                <div class="highlight">
                    <span class="hl-icon">📊</span>
                    <span>近1月 <strong>${fund.change_1m ? fund.change_1m.toFixed(2) : '--'}%</strong></span>
                </div>
                <div class="highlight">
                    <span class="hl-icon">⭐</span>
                    <span>评级 <strong>${'★'.repeat(fund.rating || 3)}</strong></span>
                </div>
                <div class="highlight">
                    <span class="hl-icon">💼</span>
                    <span>基金经理 <strong>${fund.manager || '张三'}</strong></span>
                </div>
            </div>
            <button class="btn-product ${!canBuy ? 'btn-locked' : ''}" onclick="${canBuy ? `viewDetail('fund', '${fund.id || fund.code}'); return false;` : `showVipUpgrade(${requiredVip}); return false;`}">
                ${canBuy ? '查看详情' : `需要VIP${requiredVip}解锁`}
            </button>
        </div>
    `;
    }).join('');

    container.innerHTML = html;
}

/**
 * 渲染IPO项目
 */
function renderIPOs() {
    const container = document.getElementById('ipoProjectsList');
    if (!container || iposData.length === 0) return;

    const html = iposData.map(ipo => `
        <div class="product-card ${ipo.status === '申购中' ? 'premium' : ''}">
            <div class="product-badge ${ipo.status === '申购中' ? 'exclusive' : ''}">${ipo.status}</div>
            <div class="product-header">
                <h3>${ipo.name} (${ipo.code})</h3>
                <p class="product-subtitle">${ipo.industry || ''} · ${ipo.board || ''}</p>
            </div>
            <div class="product-highlights">
                <div class="highlight">
                    <span class="hl-icon">💰</span>
                    <span>发行价 <strong>${ipo.price}元</strong></span>
                </div>
                <div class="highlight">
                    <span class="hl-icon">📈</span>
                    <span>市盈率 <strong>${ipo.pe || '--'}</strong></span>
                </div>
                <div class="highlight">
                    <span class="hl-icon">🎯</span>
                    <span>申购日期 <strong>${ipo.apply_date || '--'}</strong></span>
                </div>
            </div>
            <button class="btn-product" onclick="viewDetail('ipo', '${ipo.id || ipo.code}'); return false;">查看详情</button>
        </div>
    `).join('');

    container.innerHTML = html;
}

/**
 * 渲染债券项目
 */
function renderBonds() {
    const container = document.getElementById('bondProjectsList');
    if (!container || bondsData.length === 0) return;

    const html = bondsData.slice(0, 10).map(bond => `
        <div class="product-card">
            <div class="product-badge">${bond.rating}</div>
            <div class="product-header">
                <h3>${bond.name} (${bond.code})</h3>
                <p class="product-subtitle">${bond.type_name || ''} · ${bond.period}</p>
            </div>
            <div class="product-highlights">
                <div class="highlight">
                    <span class="hl-icon">💵</span>
                    <span>最新价 <strong>${bond.price.toFixed(2)}</strong></span>
                </div>
                <div class="highlight">
                    <span class="hl-icon">📊</span>
                    <span>到期收益率 <strong>${bond.yield.toFixed(2)}%</strong></span>
                </div>
                <div class="highlight">
                    <span class="hl-icon">📅</span>
                    <span>期限 <strong>${bond.period}</strong></span>
                </div>
            </div>
            <button class="btn-product" onclick="viewDetail('bond', '${bond.id || bond.code}'); return false;">查看详情</button>
        </div>
    `).join('');

    container.innerHTML = html;
}

// 记录每个板块是否已渲染
const renderedSections = {
    fund: false,
    ipo: false,
    bond: false
};

/**
 * 初始化标签切换
 */
function initTabSwitching() {
    const tabBtns = document.querySelectorAll('.market-tab-mobile');
    const sections = document.querySelectorAll('.product-section');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            // 如果点击的是当前已激活的标签，不执行任何操作
            if (this.classList.contains('active')) {
                return;
            }

            tabBtns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.add('hidden'));

            this.classList.add('active');
            const newSection = this.dataset.section;
            currentSection = newSection;

            const sectionId = newSection + '-section';
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.remove('hidden');
                // 只在首次显示时渲染，避免重复渲染
                if (!renderedSections[newSection]) {
                    renderCurrentSection();
                    renderedSections[newSection] = true;
                }
            }
        });
    });
}

/**
 * 查看项目详情
 */
function viewDetail(type, code) {
    // 阻止默认行为和事件冒泡
    if (typeof event !== 'undefined' && event) {
        event.preventDefault();
        event.stopPropagation();
    }

    // 从实际项目数据中查找项目ID
    let projectId = null;
    let project = null;

    if (type === 'fund' && fundsData.length > 0) {
        project = fundsData.find(p => p.id == code || p.code == code);
        projectId = project?.id;
    } else if (type === 'ipo' && iposData.length > 0) {
        project = iposData.find(p => p.id == code || p.code == code);
        projectId = project?.id;
    } else if (type === 'bond' && bondsData.length > 0) {
        project = bondsData.find(p => p.id == code || p.code == code);
        projectId = project?.id;
    }

    // 如果code本身就是数字，可能是ID
    if (!projectId && !isNaN(code)) {
        projectId = parseInt(code);
    }

    // 跳转到项目详情页，使用replace避免历史记录，添加时间戳防止缓存
    if (projectId) {
        // 使用replace避免返回时刷新
        window.location.replace(`project-detail.html?id=${projectId}&t=${Date.now()}`);
    } else {
        // 如果找不到项目ID，尝试使用code
        window.location.replace(`project-detail.html?code=${code}&type=${type}&t=${Date.now()}`);
    }

    return false;
}

/**
 * 显示VIP升级提示
 */
async function showVipUpgrade(requiredLevel) {
    const user = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const currentLevel = user.vip_level || 1;

    const msg = `该项目需要VIP${requiredLevel}才能投资\n您当前是VIP${currentLevel}，立即前往升级？`;

    if (await showConfirm('', msg)) {
        window.location.href = 'vip-level.html';
    }
}

/**
 * 格式化金额
 */
function formatMoney(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
