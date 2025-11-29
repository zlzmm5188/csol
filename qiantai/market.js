/**
 * 市场数据展示 - 每个板块独特的展示格式
 */

// 全局变量
let marketData = null;
let updateInterval = null;
let previousData = null; // 存储上一次的数据用于对比
let currentPage = {
    fund: 1,
    ipo: 1,
    bond: 1
};

/**
 * 根据屏幕高度动态计算每页显示数量
 */
function calculateItemsPerPage() {
    const screenHeight = window.innerHeight;
    let fundItems = 15; // 默认 3x5

    // 根据屏幕高度调整
    if (screenHeight <= 568) {
        // iPhone SE 第一代 (320×568)
        fundItems = 12; // 3x4
    } else if (screenHeight <= 600) {
        // 小屏手机
        fundItems = 12; // 3x4
    } else if (screenHeight <= 667) {
        // iPhone 6/7/8 (375×667)
        fundItems = 12; // 3x4
    } else {
        // 正常屏幕及以上
        fundItems = 15; // 3x5
    }

    return fundItems;
}

let itemsPerPage = {
    fund: calculateItemsPerPage(),  // 根据屏幕高度动态计算
    ipo: 10,   // 表格10行
    bond: 10   // 表格10行
};

let autoPlayInterval = null;

// 监听窗口大小变化，重新计算
window.addEventListener('resize', () => {
    const newFundItems = calculateItemsPerPage();
    if (newFundItems !== itemsPerPage.fund) {
        itemsPerPage.fund = newFundItems;
        currentPage.fund = 1; // 重置到第一页
        if (marketData && marketData.funds) {
            renderFundData(marketData.funds, previousData?.funds || []);
        }
    }
});

// DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // 确保DOM完全加载后再初始化
        setTimeout(() => {
            if (document.getElementById('fund-list') || document.getElementById('ipo-list') || document.getElementById('bond-list')) {
                initMarketPage();
                initDetailModal();
            }
        }, 100);
    });
} else {
    // DOM已经加载完成
    setTimeout(() => {
        if (document.getElementById('fund-list') || document.getElementById('ipo-list') || document.getElementById('bond-list')) {
            initMarketPage();
            initDetailModal();
        }
    }, 100);
}

/**
 * 初始化市场页面
 */
function initMarketPage() {
    initTabSwitching();
    initBondFilter();
    initPagination();
    loadMarketData();
    updateInterval = setInterval(loadMarketData, 30000);
}

/**
 * 初始化标签切换
 */
function initTabSwitching() {
    const tabBtns = document.querySelectorAll('.market-tab-mobile');
    const sections = document.querySelectorAll('.market-section-mobile');

    if (!tabBtns || tabBtns.length === 0 || !sections || sections.length === 0) {
        console.warn('[市场页面] 标签元素未找到，跳过初始化');
        return;
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.add('hidden'));

            btn.classList.add('active');
            const sectionId = btn.getAttribute('data-section') + '-section';
            const targetSection = document.getElementById(sectionId);
            if (!targetSection) {
                console.warn('[市场页面] 目标区域未找到:', sectionId);
                return;
            }
            if (targetSection) {
                targetSection.classList.remove('hidden');
            }

            // 如果切换到基金页面，启动自动轮播
            const section = btn.getAttribute('data-section');
            if (section === 'fund') {
                startFundAutoPlay();
                stopBondTypeAutoPlay();
                stopBondFlash();
            } else if (section === 'bond') {
                stopFundAutoPlay();
                startBondTypeAutoPlay();
                startBondFlash();
            } else {
                stopFundAutoPlay();
                stopBondTypeAutoPlay();
                stopBondFlash();
            }
        });
    });

    // 页面加载时如果在基金页面，启动自动轮播
    const activeFund = document.querySelector('.market-tab-mobile.active[data-section="fund"]');
    if (activeFund) {
        setTimeout(() => {
            startFundAutoPlay();
        }, 3000); // 3秒后开始自动轮播
    }

    // 页面加载时如果在债券页面，启动自动切换
    const activeBond = document.querySelector('.market-tab-mobile.active[data-section="bond"]');
    if (activeBond) {
        setTimeout(() => {
            startBondTypeAutoPlay();
            startBondFlash();
        }, 500);
    }
}

/**
 * 启动债券类型自动切换
 */
function startBondTypeAutoPlay() {
    // 清除旧的定时器
    if (bondTypeAutoPlayInterval) {
        clearInterval(bondTypeAutoPlayInterval);
    }

    // 初始显示第一个类型（可转债）
    const initialType = bondTypes[currentBondTypeIndex];
    filterAndRenderBonds(initialType);

    // 每10秒切换一次
    bondTypeAutoPlayInterval = setInterval(() => {
        currentBondTypeIndex = (currentBondTypeIndex + 1) % bondTypes.length;
        const currentType = bondTypes[currentBondTypeIndex];
        filterAndRenderBonds(currentType);
    }, 10000);
}

/**
 * 停止债券类型自动切换
 */
function stopBondTypeAutoPlay() {
    if (bondTypeAutoPlayInterval) {
        clearInterval(bondTypeAutoPlayInterval);
        bondTypeAutoPlayInterval = null;
    }
}

// 债券闪烁相关变量
let bondFlashInterval = null;

/**
 * 启动债券数据闪烁动画 - 模拟实时数据更新
 */
function startBondFlash() {
    // 清除旧的定时器
    if (bondFlashInterval) {
        clearInterval(bondFlashInterval);
    }

    // 每5-8秒随机闪烁少量债券行（降低频率，保护眼睛）
    const doFlash = () => {
        // 使用 requestAnimationFrame 优化性能
        requestAnimationFrame(() => {
            const rows = document.querySelectorAll('.wind-table-row[data-type="bond"]');
            if (rows.length === 0) return;

            // 随机选择1个债券（减少同时闪烁的数量）
            const flashCount = 1;
            const selectedIndexes = new Set();

            while (selectedIndexes.size < Math.min(flashCount, rows.length)) {
                selectedIndexes.add(Math.floor(Math.random() * rows.length));
            }

            // 给选中的债券添加闪烁动画
            selectedIndexes.forEach(index => {
                const row = rows[index];

                // 随机决定是上涨还是下跌闪烁
                const flashClass = Math.random() > 0.5 ? 'flash-up' : 'flash-down';

                // 整行边框闪烁
                row.classList.add(flashClass);

                // 使用 requestAnimationFrame 移除 class
                setTimeout(() => {
                    requestAnimationFrame(() => {
                        row.classList.remove(flashClass);
                    });
                }, 1000);

                // 同时让价格字段闪烁（80%概率，更频繁）
                if (Math.random() > 0.2) {
                    const priceFields = ['col-current', 'col-high', 'col-low'];
                    const randomField = priceFields[Math.floor(Math.random() * priceFields.length)];
                    const priceCol = row.querySelector(`.${randomField}`);

                    if (priceCol) {
                        priceCol.classList.add('flash-price');

                        setTimeout(() => {
                            requestAnimationFrame(() => {
                                priceCol.classList.remove('flash-price');
                            });
                        }, 1200);
                    }
                }
            });
        });
    };

    // 立即执行一次
    doFlash();

    // 设置定时器
    bondFlashInterval = setInterval(doFlash, Math.random() * 2000 + 6000); // 6-8秒随机间隔
}

/**
 * 停止债券数据闪烁动画
 */
function stopBondFlash() {
    if (bondFlashInterval) {
        clearInterval(bondFlashInterval);
        bondFlashInterval = null;
    }
}

/**
 * 初始化分页
 */
function initPagination() {
    // 使用事件委托处理所有分页按钮
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('page-btn') && !e.target.disabled) {
            const type = e.target.dataset.type;
            const page = parseInt(e.target.dataset.page);

            if (type && page && page > 0) {
                currentPage[type] = page;

                // 重新渲染对应板块
                if (marketData) {
                    if (type === 'fund') {
                        renderFundData(marketData.funds || [], previousData?.funds || []);
                    } else if (type === 'ipo') {
                        renderIPOData(marketData.ipos || [], previousData?.ipos || []);
                    } else if (type === 'bond') {
                        renderBondData(marketData.bonds || [], previousData?.bonds || []);
                    }
                }
            }
        }
    });
}

/**
 * 初始化债券筛选
 */
function initBondFilter() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn-mobile') || e.target.parentElement.classList.contains('filter-btn-mobile')) {
            const btn = e.target.classList.contains('filter-btn-mobile') ? e.target : e.target.parentElement;
            const filterBtns = document.querySelectorAll('.filter-btn-mobile');
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterType = btn.getAttribute('data-type');
            const bondItems = document.querySelectorAll('.wind-table-row[data-bond-type]');

            bondItems.forEach(item => {
                if (filterType === 'all') {
                    item.style.display = 'flex';
                } else {
                    const bondType = item.getAttribute('data-bond-type');
                    item.style.display = bondType === filterType ? 'flex' : 'none';
                }
            });
        }
    });
}

/**
 * 加载市场数据
 */
async function loadMarketData() {
    // 直接使用本地数据（后端API未实现）
    console.log('[市场数据] 使用本地数据源');
    loadMarketDataFromLocal();

    // 如果后续后端API实现了，可以取消下面的注释
    /*
    try {
        const result = await API.market.getAll();
        if (result.success && result.data) {
            previousData = marketData;
            marketData = result.data;
            renderFundData(marketData.funds || [], previousData?.funds || []);
            renderIPOData(marketData.ipos || [], previousData?.ipos || []);
            renderBondData(marketData.bonds || [], previousData?.bonds || []);
            updateLastUpdateTime(marketData.update_time);
        } else {
            loadMarketDataFromLocal();
        }
    } catch (error) {
        console.warn('[市场数据] API未实现，使用本地数据');
        loadMarketDataFromLocal();
    }
    */
}

/**
 * 从本地JSON文件加载市场数据（备用方案）
 */
async function loadMarketDataFromLocal() {
    try {
        // 直接使用JSON文件（更可靠，避免PHP路径问题）
        let jsonResponse = await fetch('data/market-data.json?v=' + Date.now());

        // 如果相对路径失败，尝试绝对路径
        if (!jsonResponse.ok) {
            jsonResponse = await fetch(window.location.origin + '/data/market-data.json?v=' + Date.now());
        }
        if (!jsonResponse.ok) {
            throw new Error('JSON文件加载失败: ' + jsonResponse.status);
        }

        const jsonData = await jsonResponse.json();

        if (jsonData && (jsonData.funds || jsonData.ipos || jsonData.bonds)) {
            // 保存旧数据
            previousData = marketData;
            marketData = jsonData;

            renderFundData(marketData.funds || [], previousData?.funds || []);
            renderIPOData(marketData.ipos || [], previousData?.ipos || []);

            // 债券数据：默认显示可转债
            const convertibleBonds = (marketData.bonds || []).filter(bond => bond.type === 'convertible');
            if (convertibleBonds.length > 0) {
                renderBondData(convertibleBonds, previousData?.bonds?.filter(b => b.type === 'convertible') || [], 'convertible');
            } else {
                renderBondData(marketData.bonds || [], previousData?.bonds || [], 'convertible');
            }

            updateLastUpdateTime(marketData.update_time || new Date().toLocaleString('zh-CN'));
        } else {
            throw new Error('JSON数据格式不正确');
        }
    } catch (error) {
        console.error('加载本地市场数据失败:', error);
        // 显示错误提示
        const fundListEl = document.getElementById('fund-list');
        const ipoListEl = document.getElementById('ipo-list');
        const bondListEl = document.getElementById('bond-list');

        if (fundListEl && fundListEl instanceof Node) {
            fundListEl.innerHTML = '<div class="error-message" style="padding:40px;text-align:center;color:#999;">数据加载失败，请刷新重试</div>';
        }
        if (ipoListEl && ipoListEl instanceof Node) {
            ipoListEl.innerHTML = '<div class="error-message" style="padding:40px;text-align:center;color:#999;">数据加载失败，请刷新重试</div>';
        }
        if (bondListEl && bondListEl instanceof Node) {
            bondListEl.innerHTML = '<div class="error-message" style="padding:40px;text-align:center;color:#999;">数据加载失败，请刷新重试</div>';
        }
    }
}

/**
 * 渲染基金数据 - Wind风格方格布局（分页版本）
 */
function renderFundData(funds, previousFunds = []) {
    const fundListEl = document.getElementById('fund-list');
    if (!fundListEl || !(fundListEl instanceof Node) || funds.length === 0) return;

    // 计算分页
    const page = currentPage.fund;
    const perPage = itemsPerPage.fund;
    const totalPages = Math.ceil(funds.length / perPage);
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const currentFunds = funds.slice(start, end);

    fundListEl.innerHTML = `
        <div class="wind-grid">
            ${currentFunds.map(fund => {
                // 查找旧数据对比
                const oldFund = previousFunds.find(f => f.code === fund.code);
                let flashClass = '';
                if (oldFund && oldFund.change !== fund.change) {
                    // 判断是涨还是跌来决定闪烁颜色
                    if (fund.change > oldFund.change) {
                        flashClass = 'flash-up';
                    } else {
                        flashClass = 'flash-down';
                    }
                }

                // 根据标签决定名称颜色类
                let nameClass = '';
                if (fund.hot) {
                    nameClass = 'hot-fund';
                } else if (fund.stable) {
                    nameClass = 'stable-fund';
                }

                return `
                    <div class="wind-tile ${flashClass}" data-type="fund" data-id="${fund.code}">
                        <div class="tile-name ${nameClass}">${fund.name}</div>
                        <div class="tile-code">${fund.code}</div>
                        <div class="tile-main">
                            <div class="tile-nav">${fund.nav.toFixed(4)}</div>
                            <div class="tile-change ${fund.change >= 0 ? 'up' : 'down'}">
                                ${fund.change >= 0 ? '+' : ''}${fund.change.toFixed(2)}%
                    </div>
                </div>
                    </div>
                `;
            }).join('')}
                </div>
    `;

    // 动画结束后移除类
    setTimeout(() => {
        document.querySelectorAll('.wind-tile.flash-up, .wind-tile.flash-down').forEach(tile => {
            tile.classList.remove('flash-up', 'flash-down');
        });
    }, 1000);
}

/**
 * 渲染分页组件
 */
function renderPagination(type, currentPage, totalPages) {
    if (totalPages <= 1) return '';

    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push(`
            <button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}" data-type="${type}">
                ${i}
            </button>
        `);
    }

    return `
        <div class="pagination-container">
            <button class="page-btn prev" data-page="${currentPage - 1}" data-type="${type}" ${currentPage === 1 ? 'disabled' : ''}>
                ‹
            </button>
            ${pages.join('')}
            <button class="page-btn next" data-page="${currentPage + 1}" data-type="${type}" ${currentPage === totalPages ? 'disabled' : ''}>
                ›
            </button>
            </div>
    `;
}

/**
 * 渲染IPO数据 - Wind风格表格
 */
function renderIPOData(ipos, previousIpos = []) {
    const ipoListEl = document.getElementById('ipo-list');
    if (!ipoListEl || !(ipoListEl instanceof Node) || ipos.length === 0) return;

    ipoListEl.innerHTML = `
        <div class="wind-table">
            <div class="wind-table-header">
                <div class="col col-name">名称</div>
                <div class="col col-code">代码</div>
                <div class="col col-price">发行价</div>
                <div class="col col-status">状态</div>
            </div>
            ${ipos.map(ipo => {
                const oldIpo = previousIpos.find(i => i.code === ipo.code);
                let flashClass = '';
                if (oldIpo && oldIpo.status !== ipo.status) {
                    flashClass = 'flash-update';
                }

                return `
                    <div class="wind-table-row ${flashClass}" data-type="ipo" data-id="${ipo.code}">
                        <div class="col col-name">
                            <span class="name-text">${ipo.name}</span>
                            <i class="board-tag ${ipo.board_class}">${ipo.board}</i>
                        </div>
                        <div class="col col-code">${ipo.code}</div>
                        <div class="col col-price">¥${ipo.price.toFixed(2)}</div>
                        <div class="col col-status">
                            <span class="status-badge ${ipo.status_class}">${ipo.status}</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    setTimeout(() => {
        document.querySelectorAll('.wind-table-row.flash-update').forEach(row => {
            row.classList.remove('flash-update');
        });
    }, 1000);
}

// 债券板块自动切换相关变量
let bondTypeAutoPlayInterval = null;
let currentBondTypeIndex = 0;
const bondTypes = ['convertible', 'financial', 'corporate']; // 可转债、沪企债、深企债
const bondTypeNames = {
    'convertible': '可转债指数',
    'financial': '沪企债指数',
    'corporate': '深企债指数'
};

/**
 * 渲染债券指数
 */
function renderBondIndices(activeType = 'convertible') {
    const bondIndicesEl = document.getElementById('bond-indices');
    if (!bondIndicesEl) return;

    // 模拟债券指数数据
    const indices = [
        { type: 'convertible', name: '可转债指数', value: 398.52, change: 0.12, changePercent: 0.03 },
        { type: 'financial', name: '沪企债指数', value: 301.45, change: 0.03, changePercent: 0.01 },
        { type: 'corporate', name: '深企债指数', value: 127.84, change: -0.01, changePercent: -0.01 }
    ];

    bondIndicesEl.innerHTML = indices.map(index => {
        const isUp = index.change >= 0;
        const upDownClass = isUp ? 'up' : 'down';
        const arrow = isUp ? '▲' : '▼';
        const isActive = index.type === activeType;

        return `
            <div class="bond-index-card ${isActive ? 'active' : ''}" data-bond-type="${index.type}" style="cursor: pointer;">
                <div class="bond-index-name">${index.name}</div>
                <div class="bond-index-value">${index.value.toFixed(2)}</div>
                <div class="bond-index-change ${upDownClass}">
                    ${arrow} ${Math.abs(index.change).toFixed(2)} ${isUp ? '+' : ''}${index.changePercent.toFixed(2)}%
                </div>
            </div>
        `;
    }).join('');

    // 添加点击事件 - 使用事件委托确保绑定成功
    bondIndicesEl.querySelectorAll('.bond-index-card').forEach(card => {
        // 移除旧的事件监听器（如果存在）
        const newCard = card.cloneNode(true);
        card.parentNode.replaceChild(newCard, card);

        newCard.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const type = this.dataset.bondType;
            console.log('[债券指数] 点击类型:', type);

            if (!type) {
                console.error('[债券指数] 未找到类型');
                return;
            }

            currentBondTypeIndex = bondTypes.indexOf(type);
            if (currentBondTypeIndex === -1) {
                console.error('[债券指数] 类型不在列表中:', type);
                return;
            }

            // 更新激活状态
            bondIndicesEl.querySelectorAll('.bond-index-card').forEach(c => {
                c.classList.remove('active');
            });
            this.classList.add('active');

            filterAndRenderBonds(type);
            stopBondTypeAutoPlay(); // 点击后停止自动切换
        });
    });
}

/**
 * 筛选并渲染指定类型的债券
 */
function filterAndRenderBonds(type = 'convertible') {
    if (!marketData || !marketData.bonds) {
        console.error('[债券筛选] 市场数据未加载');
        return;
    }

    const filteredBonds = marketData.bonds.filter(bond => bond.type === type);
    console.log('[债券筛选] 类型:', type, '找到', filteredBonds.length, '条数据');

    if (filteredBonds.length === 0) {
        console.warn('[债券筛选] 没有找到类型为', type, '的债券数据');
        console.log('[债券筛选] 可用类型:', [...new Set(marketData.bonds.map(b => b.type))]);
    }

    renderBondData(filteredBonds, [], type);
}

/**
 * 渲染债券数据 - Wind风格表格
 */
function renderBondData(bonds, previousBonds = [], activeType = 'convertible') {
    const bondListEl = document.getElementById('bond-list');
    if (!bondListEl || !(bondListEl instanceof Node) || bonds.length === 0) return;

    // 渲染债券指数
    renderBondIndices(activeType);

    bondListEl.innerHTML = `
        <div class="wind-table">
            <div class="wind-table-header">
                <div class="col col-code">代码</div>
                <div class="col col-name">名称</div>
                <div class="col col-current">最新</div>
                <div class="col col-open">今开</div>
                <div class="col col-high">最高</div>
                <div class="col col-low">最低</div>
            </div>
            ${bonds.map(bond => {
                const oldBond = previousBonds.find(b => b.code === bond.code);
                let flashClass = '';
                if (oldBond && oldBond.price !== bond.price) {
                    if (bond.price > oldBond.price) {
                        flashClass = 'flash-up';
                    } else {
                        flashClass = 'flash-down';
                    }
                }

                // 生成今开、最高、最低价格
                const openPrice = bond.price * (1 + (Math.random() * 0.02 - 0.01));
                const highPrice = bond.price * (1 + Math.random() * 0.015);
                const lowPrice = bond.price * (1 - Math.random() * 0.015);

                const changePercent = ((bond.price - openPrice) / openPrice * 100);
                const isUp = changePercent >= 0;
                const rowColorClass = isUp ? 'row-up' : (changePercent < 0 ? 'row-down' : '');

                return `
                    <div class="wind-table-row ${flashClass} ${rowColorClass}" data-bond-type="${bond.type}" data-type="bond" data-id="${bond.code}">
                        <div class="col col-code">${bond.code}</div>
                        <div class="col col-name">${bond.name}</div>
                        <div class="col col-current ${isUp ? 'up' : 'down'}">${bond.price.toFixed(2)}</div>
                        <div class="col col-open">${openPrice.toFixed(2)}</div>
                        <div class="col col-high">${highPrice.toFixed(2)}</div>
                        <div class="col col-low">${lowPrice.toFixed(2)}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    setTimeout(() => {
        document.querySelectorAll('.wind-table-row.flash-up, .wind-table-row.flash-down').forEach(row => {
            row.classList.remove('flash-up', 'flash-down');
        });
    }, 1000);
}

/**
 * 更新最后更新时间
 */
function updateLastUpdateTime(updateTime) {
    const timeEl = document.getElementById('last-update-time');
    if (timeEl) {
        // 保持实时更新状态，不修改HTML结构
        // HTML结构中已包含跳动的圆点和"实时更新中..."文字
    }
}

/**
 * 初始化详情弹窗
 */
function initDetailModal() {
    const modal = document.getElementById('detail-modal');
    const overlay = document.getElementById('detail-overlay');
    const backBtn = document.getElementById('detail-back');

    // 点击遮罩关闭
    overlay?.addEventListener('click', closeDetailModal);

    // 点击返回按钮关闭
    backBtn?.addEventListener('click', closeDetailModal);

    // 监听基金方格点击
    document.addEventListener('click', function(e) {
        const tile = e.target.closest('.wind-tile');
        if (tile) {
            e.preventDefault();
            e.stopPropagation();
            const type = tile.dataset.type;
            const id = tile.dataset.id;
            console.log('点击基金:', type, id);
            openDetailModal(type, id);
            return;
        }

        const row = e.target.closest('.wind-table-row');
        if (row) {
            e.preventDefault();
            e.stopPropagation();
            const type = row.dataset.type;
            const id = row.dataset.id;
            console.log('点击表格:', type, id);
            openDetailModal(type, id);
            return;
        }
    }, true);
}

/**
 * 打开详情弹窗
 */
function openDetailModal(type, id) {
    console.log('[详情弹窗] 打开详情:', type, id);
    const modal = document.getElementById('detail-modal');
    const title = document.getElementById('detail-title');
    const content = document.getElementById('detail-content');

    if (!modal) {
        console.error('[详情弹窗] Modal元素不存在');
        return;
    }

    if (!marketData) {
        console.error('[详情弹窗] 市场数据未加载');
        return;
    }

    let item = null;
    try {
    if (type === 'fund') {
            item = marketData.funds?.find(f => f.code === id);
            if (item) {
                renderFundDetail(item, title, content);
            } else {
                console.error('[详情弹窗] 未找到基金:', id, '可用代码:', marketData.funds?.map(f => f.code));
            }
    } else if (type === 'ipo') {
            item = marketData.ipos?.find(i => i.code === id);
            if (item) {
                renderIPODetail(item, title, content);
            } else {
                console.error('[详情弹窗] 未找到IPO:', id, '可用代码:', marketData.ipos?.map(i => i.code));
            }
    } else if (type === 'bond') {
            item = marketData.bonds?.find(b => b.code === id);
            if (item) {
                renderBondDetail(item, title, content);
            } else {
                console.error('[详情弹窗] 未找到债券:', id);
                console.log('[详情弹窗] 可用债券代码:', marketData.bonds?.map(b => ({code: b.code, name: b.name, type: b.type})));
            }
        } else {
            console.error('[详情弹窗] 未知类型:', type);
        }
    } catch (error) {
        console.error('[详情弹窗] 渲染详情时出错:', error);
        return;
    }

    if (item && modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        console.log('[详情弹窗] 详情弹窗已打开');
    } else {
        console.error('[详情弹窗] 无法打开，item:', item, 'modal:', modal);
    }
}

/**
 * 关闭详情弹窗
 */
function closeDetailModal() {
    const modal = document.getElementById('detail-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * 生成持仓列表
 */
function generateHoldings(fund) {
    const stocks = ['贵州茅台', '宁德时代', '腾讯控股', '比亚迪', '美的集团', '中国平安', '招商银行', '五粮液', '隆基绿能', '阿里巴巴'];
    const baseIndex = fund.code.charCodeAt(0) % 8;
    let html = '<div class="holdings-list">';

    for (let i = 0; i < 4; i++) {
        const stockName = stocks[(baseIndex + i) % stocks.length];
        const percent = (8.5 - i * 0.6 + (fund.code.charCodeAt(i+1) % 10) * 0.1).toFixed(2);
        const trend = (fund.code.charCodeAt(i) % 2 === 0) ? 'up' : 'down';
        const trendValue = ((fund.code.charCodeAt(i) % 30) * 0.1).toFixed(2);
        const topClass = i < 3 ? 'top3' : '';

        html += `
            <div class="holding-item">
                <div class="holding-left">
                    <div class="holding-rank ${topClass}">${i + 1}</div>
                    <div class="holding-name">${stockName}</div>
                </div>
                <div class="holding-right">
                    <div class="holding-percent">${percent}%</div>
                    <div class="holding-trend ${trend}">${trend === 'up' ? '+' : '-'}${trendValue}%</div>
                </div>
            </div>
        `;
    }

    html += '</div>';
    return html;
}

/**
 * 渲染基金详情
 */
function renderFundDetail(fund, titleEl, contentEl) {
    titleEl.textContent = `${fund.name} (${fund.code})`;

    contentEl.innerHTML = `
        <!-- 基金信息 - 与标题融合 -->
        <div class="fund-info-header">
            <div class="fund-info-row">
                <div class="fund-info-item">
                    <span class="fund-info-label">基金经理:</span>
                    <span class="fund-info-value">${['张伟', '李娜', '王强', '刘芳', '陈明', '周杰', '谢洽宇', '赵敏'][fund.code.charCodeAt(0) % 8]}</span>
                </div>
                <div class="fund-info-item">
                    <span class="fund-info-label">基金公司:</span>
                    <span class="fund-info-value">${['中欧基金', '华夏基金', '易方达', '南方基金', '嘉实基金', '广发基金', '汇添富', '博时基金'][fund.code.charCodeAt(1) % 8]}</span>
                </div>
                <div class="fund-info-item">
                    <span class="fund-info-label">基金代码:</span>
                    <span class="fund-info-value">${fund.code}</span>
                </div>
            </div>
            <div class="fund-info-row">
                <div class="fund-info-item">
                    <span class="fund-info-label">基金类型:</span>
                    <span class="fund-info-value">${fund.type}</span>
                </div>
                <div class="fund-info-item">
                    <span class="fund-info-label">当前净值:</span>
                    <span class="fund-info-value">${fund.nav.toFixed(4)}</span>
                </div>
                <div class="fund-info-item">
                    <span class="fund-info-label">日涨幅:</span>
                    <span class="fund-info-value ${fund.change >= 0 ? 'positive' : 'negative'}">
                        ${fund.change >= 0 ? '+' : ''}${fund.change.toFixed(2)}%
                    </span>
                </div>
            </div>
        </div>

        <!-- 持仓占比 -->
        <div class="detail-card">
            <h3 class="detail-card-title">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/></svg>
                前四大持仓
            </h3>
            <div class="detail-allocation">
                <div class="allocation-chart">
                    <div class="holdings-ring"></div>
                    <div class="allocation-center">
                        <div class="allocation-center-label">总持仓</div>
                        <div class="allocation-center-value">100%</div>
                    </div>
                </div>
                <div class="allocation-list">
                    ${generateHoldings(fund)}
                </div>
            </div>
        </div>

        <!-- 业绩表现与历史业绩 -->
        <div class="detail-card">
            <h3 class="detail-card-title">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                业绩表现
            </h3>
            <div class="detail-perf-grid">
                <div class="detail-perf-item">
                    <div class="detail-perf-label">近1月</div>
                    <div class="detail-perf-value ${fund.change_1m >= 0 ? 'up' : 'down'}">
                        ${fund.change_1m >= 0 ? '+' : ''}${fund.change_1m.toFixed(2)}%
                    </div>
                </div>
                <div class="detail-perf-item">
                    <div class="detail-perf-label">近3月</div>
                    <div class="detail-perf-value ${fund.change_3m >= 0 ? 'up' : 'down'}">
                        ${fund.change_3m >= 0 ? '+' : ''}${fund.change_3m.toFixed(2)}%
                    </div>
                </div>
                <div class="detail-perf-item">
                    <div class="detail-perf-label">今年来</div>
                    <div class="detail-perf-value ${fund.change_ytd >= 0 ? 'up' : 'down'}">
                        ${fund.change_ytd >= 0 ? '+' : ''}${fund.change_ytd.toFixed(2)}%
                    </div>
                </div>
                </div>

            <!-- 历史业绩走势图 -->
            <div class="simple-line-chart" style="margin-top:16px;">
                <svg viewBox="0 0 300 60" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="lineGradient${fund.code}" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#4a9eff;stop-opacity:0.3" />
                            <stop offset="100%" style="stop-color:#4a9eff;stop-opacity:0.02" />
                        </linearGradient>
                        <filter id="shadow${fund.code}">
                            <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#4a9eff" flood-opacity="0.5"/>
                        </filter>
                    </defs>
                    <!-- 折线下方填充 -->
                    <path d="M 0 ${53 - (fund.code.charCodeAt(0) % 15)} L 25 ${48 - (fund.code.charCodeAt(1) % 12)} L 50 ${44 - (fund.code.charCodeAt(2) % 15)} L 75 ${38 - (fund.code.charCodeAt(0) % 18) + (fund.change_1m >= 0 ? 4 : -4)} L 100 ${34 - (fund.code.charCodeAt(3) % 12)} L 125 ${30 - (fund.code.charCodeAt(1) % 15)} L 150 ${24 - (fund.code.charCodeAt(2) % 18) + (fund.change_3m >= 0 ? 6 : -6)} L 175 ${22 - (fund.code.charCodeAt(4) % 12)} L 200 ${20 - (fund.code.charCodeAt(0) % 15)} L 225 ${16 - (fund.code.charCodeAt(1) % 12) + (fund.change_ytd >= 0 ? 8 : -8)} L 250 ${14 - (fund.code.charCodeAt(3) % 15)} L 275 ${12 - (fund.code.charCodeAt(2) % 10)} L 300 ${8 - (fund.code.charCodeAt(0) % 8)} L 300 60 L 0 60 Z" fill="url(#lineGradient${fund.code})"/>
                    <!-- 折线 -->
                    <polyline points="0,${53 - (fund.code.charCodeAt(0) % 15)} 25,${48 - (fund.code.charCodeAt(1) % 12)} 50,${44 - (fund.code.charCodeAt(2) % 15)} 75,${38 - (fund.code.charCodeAt(0) % 18) + (fund.change_1m >= 0 ? 4 : -4)} 100,${34 - (fund.code.charCodeAt(3) % 12)} 125,${30 - (fund.code.charCodeAt(1) % 15)} 150,${24 - (fund.code.charCodeAt(2) % 18) + (fund.change_3m >= 0 ? 6 : -6)} 175,${22 - (fund.code.charCodeAt(4) % 12)} 200,${20 - (fund.code.charCodeAt(0) % 15)} 225,${16 - (fund.code.charCodeAt(1) % 12) + (fund.change_ytd >= 0 ? 8 : -8)} 250,${14 - (fund.code.charCodeAt(3) % 15)} 275,${12 - (fund.code.charCodeAt(2) % 10)} 300,${8 - (fund.code.charCodeAt(0) % 8)}" fill="none" stroke="#4a9eff" stroke-width="2.5" opacity="0.9" filter="url(#shadow${fund.code})"/>
                    <!-- 关键点标记 -->
                    <circle cx="75" cy="${38 - (fund.code.charCodeAt(0) % 18) + (fund.change_1m >= 0 ? 4 : -4)}" r="3.5" fill="#4a9eff" opacity="0.8"/>
                    <circle cx="150" cy="${24 - (fund.code.charCodeAt(2) % 18) + (fund.change_3m >= 0 ? 6 : -6)}" r="3.5" fill="#4a9eff" opacity="0.8"/>
                    <circle cx="225" cy="${16 - (fund.code.charCodeAt(1) % 12) + (fund.change_ytd >= 0 ? 8 : -8)}" r="3.5" fill="#4a9eff" opacity="0.8"/>
                    <circle cx="300" cy="${8 - (fund.code.charCodeAt(0) % 8)}" r="3.5" fill="#4a9eff" opacity="0.8"/>
                </svg>
                <div class="chart-labels">
                    <div class="chart-label-item">
                        <span class="label-time">第1周</span>
                        <span class="label-value ${fund.change >= 0 ? 'positive' : 'negative'}">${fund.change >= 0 ? '+' : ''}${fund.change.toFixed(2)}%</span>
            </div>
                    <div class="chart-label-item">
                        <span class="label-time">第2周</span>
                        <span class="label-value ${fund.change_1m >= 0 ? 'positive' : 'negative'}">${fund.change_1m >= 0 ? '+' : ''}${(fund.change_1m * 0.4).toFixed(2)}%</span>
            </div>
                    <div class="chart-label-item">
                        <span class="label-time">第3周</span>
                        <span class="label-value ${fund.change_3m >= 0 ? 'positive' : 'negative'}">${fund.change_3m >= 0 ? '+' : ''}${(fund.change_3m * 0.35).toFixed(2)}%</span>
        </div>
                    <div class="chart-label-item">
                        <span class="label-time">第4周</span>
                        <span class="label-value ${fund.change_ytd >= 0 ? 'positive' : 'negative'}">${fund.change_ytd >= 0 ? '+' : ''}${(fund.change_ytd * 0.3).toFixed(2)}%</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 投资分析与风险提示 -->
        <div class="detail-card analysis-card">
            <h3 class="detail-card-title">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                投资分析
            </h3>
            <div class="detail-analysis">
                <p><strong>投资策略：</strong>该基金采用${fund.type === '股票型' ? '主动选股策略，重点投资具有成长潜力的优质企业' : '灵活配置策略，在股票和债券之间动态调整仓位'}。</p>
                <p><strong>持仓特点：</strong>基金经理${fund.manager}管理经验丰富，擅长${fund.type === '股票型' ? '挖掘行业龙头和高成长标的' : '把握市场节奏，注重风险控制'}。</p>
                <p><strong>业绩评价：</strong>近期表现${Math.abs(fund.change) > 2 ? '波动较大' : '相对稳健'}，${fund.change_ytd > 30 ? '年内收益表现优异' : fund.change_ytd > 10 ? '年内收益稳定' : '年内收益承压'}。</p>
            </div>
            <div class="detail-risk" style="margin-top:16px;">
                <strong>风险提示：</strong>基金投资有风险，过往业绩不代表未来表现。投资者应充分了解基金的投资范围、风险收益特征，审慎决策。市场有风险，投资需谨慎。
            </div>
        </div>
    `;
}

/**
 * 渲染IPO详情
 */
function renderIPODetail(ipo, titleEl, contentEl) {
    titleEl.textContent = ipo.name;

    contentEl.innerHTML = `
        <!-- 公司简介与申购数据 -->
        <div class="detail-card" style="margin-bottom:12px;">
            <h3 class="detail-card-title" style="font-size:15px;margin-bottom:8px;">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                公司简介
            </h3>
            <div style="font-size:14px;line-height:1.6;color:#555;margin-bottom:14px;">
                <p style="margin:0 0 8px 0;"><strong style="color:#222;">所属行业：</strong>${ipo.industry}</p>
                <p style="margin:0;">${ipo.description}</p>
            </div>
            <div class="detail-info-grid">
                <div class="detail-info-item">
                    <div class="detail-info-label">股票代码</div>
                    <div class="detail-info-value" style="color:#5AA7FF;">${ipo.code}</div>
                </div>
                <div class="detail-info-item">
                    <div class="detail-info-label">上市板块</div>
                    <div class="detail-info-value">${ipo.board}</div>
                </div>
                <div class="detail-info-item">
                    <div class="detail-info-label">当前状态</div>
                    <div class="detail-info-value" style="color:#ff6b6b;">${ipo.status}</div>
                </div>
                <div class="detail-info-item">
                    <div class="detail-info-label">发行价格</div>
                    <div class="detail-info-value" style="color:#5AA7FF;">¥${ipo.price.toFixed(2)}</div>
                </div>
                <div class="detail-info-item">
                    <div class="detail-info-label">价格区间</div>
                    <div class="detail-info-value">${ipo.price_range}</div>
                </div>
                <div class="detail-info-item">
                    <div class="detail-info-label">市盈率</div>
                    <div class="detail-info-value">${ipo.pe.toFixed(2)}倍</div>
                </div>
                <div class="detail-info-item">
                    <div class="detail-info-label">发行数量</div>
                    <div class="detail-info-value">${ipo.amount}</div>
                </div>
                <div class="detail-info-item">
                    <div class="detail-info-label">募资金额</div>
                    <div class="detail-info-value" style="color:#ff9500;">¥${(ipo.code.charCodeAt(0) % 50 + 10).toFixed(2)}亿</div>
                </div>
                <div class="detail-info-item">
                    <div class="detail-info-label">主承销商</div>
                    <div class="detail-info-value">${['中信证券', '华泰证券', '国泰君安', '中金公司', '招商证券'][ipo.code.charCodeAt(0) % 5]}</div>
                </div>
                <div class="detail-info-item">
                    <div class="detail-info-label">申购日期</div>
                    <div class="detail-info-value">${ipo.apply_date}</div>
                </div>
                <div class="detail-info-item">
                    <div class="detail-info-label">公布中签</div>
                    <div class="detail-info-value">${ipo.result_date}</div>
                </div>
                <div class="detail-info-item">
                    <div class="detail-info-label">上市日期</div>
                    <div class="detail-info-value">${ipo.list_date}</div>
                </div>
                <div class="detail-info-item">
                    <div class="detail-info-label">预计中签率</div>
                    <div class="detail-info-value">${(ipo.win_rate * 100).toFixed(2)}%</div>
                </div>
                <div class="detail-info-item">
                    <div class="detail-info-label">顶格申购</div>
                    <div class="detail-info-value">${ipo.max_purchase}</div>
                </div>
                <div class="detail-info-item">
                    <div class="detail-info-label">单账户限额</div>
                    <div class="detail-info-value">${(ipo.code.charCodeAt(1) % 5 + 1) * 10000}股</div>
                </div>
            </div>
        </div>

        <!-- 发行结构 -->
        <div class="detail-card" style="margin-bottom:12px;">
            <h3 class="detail-card-title" style="font-size:15px;margin-bottom:10px;">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/></svg>
                发行结构
            </h3>
            <div class="detail-info-grid">
                <div class="detail-info-item">
                    <div class="detail-info-label">网上发行</div>
                    <div class="detail-info-value">${(ipo.code.charCodeAt(0) % 30 + 25).toFixed(1)}%</div>
            </div>
                <div class="detail-info-item">
                    <div class="detail-info-label">网下配售</div>
                    <div class="detail-info-value">${(ipo.code.charCodeAt(1) % 25 + 30).toFixed(1)}%</div>
                </div>
                <div class="detail-info-item">
                    <div class="detail-info-label">战略配售</div>
                    <div class="detail-info-value">${(100 - (ipo.code.charCodeAt(0) % 30 + 25) - (ipo.code.charCodeAt(1) % 25 + 30)).toFixed(1)}%</div>
                    </div>
                <div class="detail-info-item">
                    <div class="detail-info-label">网上申购户数</div>
                    <div class="detail-info-value">${(ipo.code.charCodeAt(2) % 50 + 150).toFixed(0)}万户</div>
                    </div>
                <div class="detail-info-item">
                    <div class="detail-info-label">有效申购倍数</div>
                    <div class="detail-info-value">${(ipo.code.charCodeAt(0) % 200 + 100).toFixed(0)}倍</div>
                </div>
                <div class="detail-info-item">
                    <div class="detail-info-label">冻结资金</div>
                    <div class="detail-info-value" style="color:#ff9500;">¥${(ipo.code.charCodeAt(1) % 500 + 200).toFixed(0)}亿</div>
                    </div>
                    </div>
                    </div>

        <!-- 市场表现 -->
        <div class="detail-card" style="margin-bottom:12px;">
            <h3 class="detail-card-title" style="font-size:15px;margin-bottom:10px;">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                市场表现
            </h3>

            <!-- 核心指标卡片 -->
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;">
                <div style="background:${(ipo.code.charCodeAt(0) % 2 === 0) ? 'linear-gradient(135deg,rgba(255,71,87,0.1),rgba(255,71,87,0.05))' : 'linear-gradient(135deg,rgba(46,213,115,0.1),rgba(46,213,115,0.05))'};border:1px solid ${(ipo.code.charCodeAt(0) % 2 === 0) ? 'rgba(255,71,87,0.3)' : 'rgba(46,213,115,0.3)'};border-radius:8px;padding:12px;text-align:center;">
                    <div style="font-size:12px;color:#666;margin-bottom:6px;">首日涨幅</div>
                    <div style="font-size:20px;font-weight:600;color:${(ipo.code.charCodeAt(0) % 2 === 0) ? '#ff4757' : '#2ed573'};">
                        ${(ipo.code.charCodeAt(0) % 2 === 0) ? '+' : ''}${(ipo.code.charCodeAt(0) % 50 + 10).toFixed(2)}%
                </div>
            </div>
                <div style="background:linear-gradient(135deg,rgba(90,167,255,0.1),rgba(90,167,255,0.05));border:1px solid rgba(90,167,255,0.3);border-radius:8px;padding:12px;text-align:center;">
                    <div style="font-size:12px;color:#666;margin-bottom:6px;">当前价格</div>
                    <div style="font-size:20px;font-weight:600;color:#5AA7FF;">
                        ¥${(ipo.price * (1 + (ipo.code.charCodeAt(0) % 50 + 10) / 100)).toFixed(2)}
        </div>
                    </div>
                <div style="background:${(ipo.code.charCodeAt(1) % 2 === 0) ? 'linear-gradient(135deg,rgba(255,71,87,0.1),rgba(255,71,87,0.05))' : 'linear-gradient(135deg,rgba(46,213,115,0.1),rgba(46,213,115,0.05))'};border:1px solid ${(ipo.code.charCodeAt(1) % 2 === 0) ? 'rgba(255,71,87,0.3)' : 'rgba(46,213,115,0.3)'};border-radius:8px;padding:12px;text-align:center;">
                    <div style="font-size:12px;color:#666;margin-bottom:6px;">今日涨跌</div>
                    <div style="font-size:20px;font-weight:600;color:${(ipo.code.charCodeAt(1) % 2 === 0) ? '#ff4757' : '#2ed573'};">
                        ${(ipo.code.charCodeAt(1) % 2 === 0) ? '+' : ''}${(ipo.code.charCodeAt(1) % 30 - 5).toFixed(2)}%
                    </div>
                </div>
            </div>

            <!-- 价格走势图 -->
            <div style="margin-bottom:16px;">
                <div style="font-size:13px;color:#666;margin-bottom:8px;font-weight:500;">价格走势</div>
                <svg viewBox="0 0 320 120" style="width:100%;height:auto;">
                    <defs>
                        <linearGradient id="ipoChartGradient${ipo.code}" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:${(ipo.code.charCodeAt(0) % 2 === 0) ? '#ff4757' : '#2ed573'};stop-opacity:0.2" />
                            <stop offset="100%" style="stop-color:${(ipo.code.charCodeAt(0) % 2 === 0) ? '#ff4757' : '#2ed573'};stop-opacity:0.02" />
                        </linearGradient>
                        <filter id="ipoChartShadow${ipo.code}">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${(ipo.code.charCodeAt(0) % 2 === 0) ? '#ff4757' : '#2ed573'}" flood-opacity="0.3"/>
                        </filter>
                    </defs>

                    <!-- 网格线 -->
                    <line x1="20" y1="20" x2="20" y2="80" stroke="#e0e0e0" stroke-width="1"/>
                    <line x1="20" y1="80" x2="300" y2="80" stroke="#e0e0e0" stroke-width="1"/>
                    <line x1="20" y1="50" x2="300" y2="50" stroke="#f0f0f0" stroke-width="1" stroke-dasharray="4,4"/>

                    <!-- 数据曲线 -->
                    <path d="M 20 ${70 - (ipo.code.charCodeAt(0) % 20)} L 85 ${50 - (ipo.code.charCodeAt(1) % 25)} L 150 ${40 - (ipo.code.charCodeAt(2) % 20)} L 215 ${35 - (ipo.code.charCodeAt(0) % 15)} L 280 ${30 - (ipo.code.charCodeAt(1) % 15)} L 300 ${28 - (ipo.code.charCodeAt(2) % 10)} L 300 80 L 20 80 Z" fill="url(#ipoChartGradient${ipo.code})"/>

                    <polyline points="20,${70 - (ipo.code.charCodeAt(0) % 20)} 85,${50 - (ipo.code.charCodeAt(1) % 25)} 150,${40 - (ipo.code.charCodeAt(2) % 20)} 215,${35 - (ipo.code.charCodeAt(0) % 15)} 280,${30 - (ipo.code.charCodeAt(1) % 15)} 300,${28 - (ipo.code.charCodeAt(2) % 10)}"
                        fill="none"
                        stroke="${(ipo.code.charCodeAt(0) % 2 === 0) ? '#ff4757' : '#2ed573'}"
                        stroke-width="3"
                        opacity="0.9"
                        filter="url(#ipoChartShadow${ipo.code})"/>

                    <!-- 数据点 -->
                    <circle cx="20" cy="${70 - (ipo.code.charCodeAt(0) % 20)}" r="4" fill="${(ipo.code.charCodeAt(0) % 2 === 0) ? '#ff4757' : '#2ed573'}" opacity="0.9"/>
                    <circle cx="85" cy="${50 - (ipo.code.charCodeAt(1) % 25)}" r="4" fill="${(ipo.code.charCodeAt(0) % 2 === 0) ? '#ff4757' : '#2ed573'}" opacity="0.9"/>
                    <circle cx="150" cy="${40 - (ipo.code.charCodeAt(2) % 20)}" r="4" fill="${(ipo.code.charCodeAt(0) % 2 === 0) ? '#ff4757' : '#2ed573'}" opacity="0.9"/>
                    <circle cx="215" cy="${35 - (ipo.code.charCodeAt(0) % 15)}" r="4" fill="${(ipo.code.charCodeAt(0) % 2 === 0) ? '#ff4757' : '#2ed573'}" opacity="0.9"/>
                    <circle cx="280" cy="${30 - (ipo.code.charCodeAt(1) % 15)}" r="4" fill="${(ipo.code.charCodeAt(0) % 2 === 0) ? '#ff4757' : '#2ed573'}" opacity="0.9"/>
                    <circle cx="300" cy="${28 - (ipo.code.charCodeAt(2) % 10)}" r="4" fill="${(ipo.code.charCodeAt(0) % 2 === 0) ? '#ff4757' : '#2ed573'}" opacity="0.9"/>

                    <!-- X轴标签 -->
                    <text x="20" y="95" fill="#999" font-size="11" text-anchor="middle">首日</text>
                    <text x="85" y="95" fill="#999" font-size="11" text-anchor="middle">第3天</text>
                    <text x="150" y="95" fill="#999" font-size="11" text-anchor="middle">第7天</text>
                    <text x="215" y="95" fill="#999" font-size="11" text-anchor="middle">第15天</text>
                    <text x="280" y="95" fill="#999" font-size="11" text-anchor="middle">第30天</text>
                    <text x="300" y="95" fill="#999" font-size="11" text-anchor="middle">今日</text>

                    <!-- 价格标签 -->
                    <text x="15" y="25" fill="#666" font-size="11" text-anchor="end">¥${(ipo.price * 1.5).toFixed(0)}</text>
                    <text x="15" y="54" fill="#666" font-size="11" text-anchor="end">¥${(ipo.price * 1.2).toFixed(0)}</text>
                    <text x="15" y="84" fill="#666" font-size="11" text-anchor="end">¥${ipo.price.toFixed(0)}</text>
                </svg>
            </div>

            <!-- 详细数据 -->
            <div class="detail-info-grid">
                <div class="detail-info-item">
                    <div class="detail-info-label">最高价</div>
                    <div class="detail-info-value" style="color:#ff4757;">¥${(ipo.price * (1 + (ipo.code.charCodeAt(0) % 50 + 20) / 100)).toFixed(2)}</div>
                </div>
                <div class="detail-info-item">
                    <div class="detail-info-label">最低价</div>
                    <div class="detail-info-value" style="color:#2ed573;">¥${(ipo.price * (1 + (ipo.code.charCodeAt(1) % 20) / 100)).toFixed(2)}</div>
                </div>
                <div class="detail-info-item">
                    <div class="detail-info-label">成交额</div>
                    <div class="detail-info-value" style="color:#ff9500;">¥${(ipo.code.charCodeAt(2) % 30 + 10).toFixed(2)}亿</div>
                </div>
                <div class="detail-info-item">
                    <div class="detail-info-label">换手率</div>
                    <div class="detail-info-value">${(ipo.code.charCodeAt(0) % 40 + 30).toFixed(2)}%</div>
                </div>
                <div class="detail-info-item">
                    <div class="detail-info-label">总市值</div>
                    <div class="detail-info-value">¥${(ipo.code.charCodeAt(1) % 200 + 100).toFixed(2)}亿</div>
                </div>
                <div class="detail-info-item">
                    <div class="detail-info-label">流通市值</div>
                    <div class="detail-info-value">¥${(ipo.code.charCodeAt(2) % 80 + 40).toFixed(2)}亿</div>
                </div>
            </div>
        </div>

        <!-- 风险提示 -->
        <div class="detail-card" style="margin-bottom:12px;">
            <div class="detail-risk" style="margin:0;">
                <strong>风险提示：</strong>新股投资存在较大风险，可能出现破发、流动性不足等情况。投资者应充分了解公司基本面、行业前景及市场环境，理性参与申购。市场有风险，投资需谨慎。
            </div>
        </div>
    `;
}

/**
 * 渲染债券详情
 */
function renderBondDetail(bond, titleEl, contentEl) {
    if (!bond) {
        console.error('[债券详情] 债券数据为空');
        contentEl.innerHTML = '<div class="error-message">债券数据不存在</div>';
        return;
    }

    try {
        titleEl.textContent = bond.name || '债券详情';

    // 生成模拟数据
        const fullName = bond.type === 'convertible'
            ? `${bond.name}可转换公司债券`
            : `${bond.name}2023年面向专业投资者非公开发行公司债券`;
        const issuer = bond.name && bond.name.length >= 6
            ? `${bond.name.substring(0, 6)}集团有限公司`
            : `${bond.name || '发行人'}集团有限公司`;
        const ticketRate = (bond.code?.charCodeAt(0) % 3 + 2 || 2.5).toFixed(2);
        const issueStartDate = `2023-09-0${((bond.code?.charCodeAt(0) || 0) % 6 + 1)}`;
        const listingDate = `2023-09-${((bond.code?.charCodeAt(1) || 0) % 20 + 10)}`;
        const interestDate = `2023-09-0${((bond.code?.charCodeAt(0) || 0) % 6 + 1)}`;
        const maturityDate = `20${((bond.code?.charCodeAt(0) || 0) % 10 + 26)}-09-0${((bond.code?.charCodeAt(0) || 0) % 6 + 1)}`;
        const paymentDate = `09-0${((bond.code?.charCodeAt(0) || 0) % 6 + 1)}`;
    const remainingPeriod = ((new Date(maturityDate) - new Date()) / (365 * 24 * 60 * 60 * 1000)).toFixed(2);

    // 计算更多详细数据
    const faceValue = '100.00';
    const minTradeUnit = '1手(10张)';
    const accruedInterest = (parseFloat(ticketRate) / 365 * Math.floor(Math.random() * 180)).toFixed(4);
        const bondPrice = parseFloat(bond.price) || 100;
        const fullPrice = (bondPrice + parseFloat(accruedInterest)).toFixed(4);
    const duration = (parseFloat(remainingPeriod) * 0.92).toFixed(2);
    const convexity = (parseFloat(duration) * 1.15).toFixed(2);
        const ytm = (bond.yield || 0).toFixed(3);
        const currentYield = bondPrice ? (parseFloat(ticketRate) / bondPrice * 100).toFixed(3) : '0.000';

    contentEl.innerHTML = `
        <div class="detail-card compact-card">
            <h3 class="detail-section-title">发行信息</h3>
            <div class="bond-info-grid-3col">
                <div class="bond-info-item full-row">
                    <span class="bond-label">债券全称</span>
                    <span class="bond-value">${fullName}</span>
                </div>
                <div class="bond-info-item">
                    <span class="bond-label">债券代码</span>
                    <span class="bond-value">${bond.code}</span>
                </div>
                <div class="bond-info-item">
                    <span class="bond-label">债券简称</span>
                    <span class="bond-value">${bond.name}</span>
            </div>
                <div class="bond-info-item">
                    <span class="bond-label">发行人</span>
                    <span class="bond-value">${issuer}</span>
                </div>
                <div class="bond-info-item">
                    <span class="bond-label">债券类型</span>
                    <span class="bond-value">${bond.type_name || '可转债'}</span>
                </div>
                <div class="bond-info-item">
                    <span class="bond-label">信用评级</span>
                    <span class="bond-value rating-highlight">${bond.rating}</span>
                    </div>
                <div class="bond-info-item">
                    <span class="bond-label">发行规模</span>
                    <span class="bond-value">${bond.amount}</span>
                </div>
                <div class="bond-info-item">
                    <span class="bond-label">债券期限</span>
                    <span class="bond-value">${bond.period}</span>
            </div>
                <div class="bond-info-item">
                    <span class="bond-label">剩余期限</span>
                    <span class="bond-value">${remainingPeriod}年</span>
        </div>
                <div class="bond-info-item">
                    <span class="bond-label">票面面值</span>
                    <span class="bond-value">${faceValue}元</span>
                </div>
                <div class="bond-info-item">
                    <span class="bond-label">票面利率</span>
                    <span class="bond-value rate-highlight">${ticketRate}%</span>
                </div>
                <div class="bond-info-item">
                    <span class="bond-label">付息方式</span>
                    <span class="bond-value">每年付息一次</span>
                </div>
                <div class="bond-info-item">
                    <span class="bond-label">计息方式</span>
                    <span class="bond-value">单利按年计息</span>
                </div>
                <div class="bond-info-item">
                    <span class="bond-label">发行起始日</span>
                    <span class="bond-value">${issueStartDate}</span>
                </div>
                <div class="bond-info-item">
                    <span class="bond-label">上市日期</span>
                    <span class="bond-value">${listingDate}</span>
                </div>
                <div class="bond-info-item">
                    <span class="bond-label">起息日</span>
                    <span class="bond-value">${interestDate}</span>
                </div>
                <div class="bond-info-item">
                    <span class="bond-label">到期日</span>
                    <span class="bond-value">${maturityDate}</span>
                </div>
                <div class="bond-info-item">
                    <span class="bond-label">付息日</span>
                    <span class="bond-value">每年${paymentDate}</span>
                </div>
            </div>
        </div>

        <div class="detail-card compact-card">
            <h3 class="detail-section-title">实时行情</h3>
            <div class="simple-line-chart" style="margin-bottom:8px;">
                ${generateBondKLineChart(bond)}
            </div>
            <div class="bond-info-grid-3col">
                <div class="bond-info-item highlight-item">
                    <span class="bond-label">最新价</span>
                    <span class="bond-value price-big ${(bond.change || 0) >= 0 ? 'up' : 'down'}">${bondPrice.toFixed(2)}</span>
                </div>
                <div class="bond-info-item highlight-item">
                    <span class="bond-label">涨跌幅</span>
                    <span class="bond-value ${(bond.change || 0) >= 0 ? 'up' : 'down'}">${(bond.change || 0) >= 0 ? '+' : ''}${(bond.change || 0).toFixed(2)}%</span>
                </div>
                <div class="bond-info-item highlight-item">
                    <span class="bond-label">到期收益率</span>
                    <span class="bond-value rate-highlight">${ytm}%</span>
                </div>
                <div class="bond-info-item">
                    <span class="bond-label">应计利息</span>
                    <span class="bond-value">${accruedInterest}</span>
                </div>
                <div class="bond-info-item">
                    <span class="bond-label">全价</span>
                    <span class="bond-value">${fullPrice}</span>
                </div>
                <div class="bond-info-item">
                    <span class="bond-label">当前收益率</span>
                    <span class="bond-value">${currentYield}%</span>
                </div>
                <div class="bond-info-item">
                    <span class="bond-label">久期</span>
                    <span class="bond-value">${duration}年</span>
                </div>
                <div class="bond-info-item">
                    <span class="bond-label">凸性</span>
                    <span class="bond-value">${convexity}</span>
                </div>
                <div class="bond-info-item">
                    <span class="bond-label">交易单位</span>
                    <span class="bond-value">${minTradeUnit}</span>
                </div>
            </div>
        </div>

        <div class="detail-card compact-card">
            <h3 class="detail-section-title">投资提示</h3>
            <div class="detail-analysis compact-text">
                <p><strong>投资要点：</strong>该${bond.type_name || '可转债'}信用评级为${bond.rating || 'AAA'}，票面利率${ticketRate}%，到期收益率${ytm}%，适合追求稳健收益的投资者。${bond.type === 'convertible' ? '可转债具有债券和股票双重属性，可转换为股票。' : ''}债券价格受市场利率、信用状况等多重因素影响。</p>
                <p><strong>风险提示：</strong>债券投资存在利率风险、信用风险、流动性风险等。请投资者根据自身风险承受能力谨慎投资。</p>
            </div>
        </div>
    `;
    } catch (error) {
        console.error('[债券详情] 渲染时出错:', error);
        contentEl.innerHTML = '<div class="error-message" style="padding:40px;text-align:center;color:#999;">加载详情失败，请稍后重试</div>';
    }
}

/**
 * 生成债券K线图
 */
function generateBondKLineChart(bond) {
    if (!bond || !bond.price) {
        return '<div style="height:220px;display:flex;align-items:center;justify-content:center;color:#999;">图表数据不足</div>';
    }

    const width = 340;
    const height = 220;
    const padding = { top: 20, right: 20, bottom: 30, left: 45 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // 生成30天的K线数据
    const basePrice = parseFloat(bond.price) || 100;
    const klineData = [];
    let prevClose = basePrice * (0.98 + Math.random() * 0.04);

    for (let i = 0; i < 30; i++) {
        const volatility = 0.015;
        const open = prevClose;
        const close = open * (1 + (Math.random() - 0.5) * volatility * 2);
        const high = Math.max(open, close) * (1 + Math.random() * volatility);
        const low = Math.min(open, close) * (1 - Math.random() * volatility);

        klineData.push({ open, high, low, close });
        prevClose = close;
    }

    // 计算价格范围
    const allPrices = klineData.flatMap(d => [d.high, d.low]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;
    const yPadding = priceRange * 0.1;

    // Y轴缩放函数
    const scaleY = (price) => {
        return chartHeight - ((price - minPrice + yPadding) / (priceRange + 2 * yPadding)) * chartHeight;
    };

    // 生成K线柱
    const candleWidth = chartWidth / klineData.length * 0.6;
    const candleSpacing = chartWidth / klineData.length;

    const candles = klineData.map((d, i) => {
        const x = i * candleSpacing + candleSpacing / 2;
        const isUp = d.close >= d.open;
        const color = isUp ? 'rgba(255,71,87,0.7)' : 'rgba(46,213,115,0.7)';
        const fillColor = isUp ? 'rgba(255,71,87,0.2)' : 'rgba(46,213,115,0.2)';

        const bodyTop = Math.min(scaleY(d.open), scaleY(d.close));
        const bodyHeight = Math.abs(scaleY(d.open) - scaleY(d.close)) || 1;

        return `
            <!-- 上下影线 -->
            <line x1="${x}" y1="${scaleY(d.high)}" x2="${x}" y2="${scaleY(d.low)}"
                  stroke="${color}" stroke-width="1" stroke-opacity="0.6"/>
            <!-- K线实体 -->
            <rect x="${x - candleWidth / 2}" y="${bodyTop}"
                  width="${candleWidth}" height="${bodyHeight}"
                  fill="${fillColor}" stroke="${color}" stroke-width="1.5"/>
        `;
    }).join('');

    // Y轴刻度
    const yTicks = 5;
    const yTicksHtml = Array.from({ length: yTicks }, (_, i) => {
        const price = minPrice + (priceRange / (yTicks - 1)) * i;
        const y = scaleY(price);
        return `
            <line x1="0" y1="${y}" x2="${chartWidth}" y2="${y}"
                  stroke="rgba(201,155,43,0.1)" stroke-width="1" stroke-dasharray="3,3"/>
            <text x="-5" y="${y + 4}" text-anchor="end" font-size="10" fill="#999">
                ${price.toFixed(2)}
            </text>
        `;
    }).join('');

    // X轴刻度（每5天显示一次）
    const xTicks = [];
    for (let i = 0; i < klineData.length; i += 5) {
        const x = i * candleSpacing + candleSpacing / 2;
        const date = new Date();
        date.setDate(date.getDate() - (klineData.length - i));
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
        xTicks.push(`
            <text x="${x}" y="${chartHeight + 20}" text-anchor="middle" font-size="10" fill="#999">
                ${dateStr}
            </text>
        `);
    }

    return `
        <svg viewBox="0 0 ${width} ${height}" style="width:100%;height:auto;margin-top:10px;">
            <defs>
                <linearGradient id="bondKlineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:rgba(201,155,43,0.05);stop-opacity:1" />
                    <stop offset="100%" style="stop-color:rgba(201,155,43,0);stop-opacity:0" />
                </linearGradient>
            </defs>
            <g transform="translate(${padding.left}, ${padding.top})">
                <!-- 网格线和Y轴刻度 -->
                ${yTicksHtml}

                <!-- K线柱 -->
                ${candles}

                <!-- X轴 -->
                <line x1="0" y1="${chartHeight}" x2="${chartWidth}" y2="${chartHeight}"
                      stroke="rgba(201,155,43,0.2)" stroke-width="1"/>

                <!-- X轴刻度 -->
                ${xTicks.join('')}
            </g>
        </svg>
    `;
}

/**
 * 随机闪烁动画 - 让数据看起来在实时更新
 */
let flashInterval = null;

function startRandomFlash() {
    // 清除旧的定时器
    if (flashInterval) {
        clearInterval(flashInterval);
    }

    // 每3-5秒随机闪烁一些项目
    flashInterval = setInterval(() => {
        // 获取所有基金方格
        const tiles = document.querySelectorAll('.wind-tile[data-type="fund"]');
        if (tiles.length === 0) return;

        // 随机选择2-4个项目
        const flashCount = Math.floor(Math.random() * 3) + 2; // 2-4个
        const selectedIndexes = new Set();

        while (selectedIndexes.size < Math.min(flashCount, tiles.length)) {
            selectedIndexes.add(Math.floor(Math.random() * tiles.length));
        }

        // 给选中的项目添加闪烁动画
        selectedIndexes.forEach(index => {
            const tile = tiles[index];
            // 随机决定是红色还是绿色闪烁
            const flashClass = Math.random() > 0.5 ? 'flash-up' : 'flash-down';
            tile.classList.add(flashClass);

            // 1秒后移除动画
            setTimeout(() => {
                tile.classList.remove(flashClass);
            }, 1000);
        });
    }, 3000 + Math.random() * 2000); // 3-5秒随机间隔
}

// 页面加载完成后启动随机闪烁
window.addEventListener('load', () => {
    setTimeout(startRandomFlash, 2000); // 2秒后开始
});

/**
 * 随机打乱数组顺序（Fisher-Yates洗牌算法）
 */
function shuffleArray(array) {
    const newArray = [...array]; // 创建副本，不修改原数组
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

/**
 * 启动基金自动轮播
 */
function startFundAutoPlay() {
    stopFundAutoPlay(); // 先停止之前的

    if (!marketData || !marketData.funds || marketData.funds.length === 0) return;

    const totalPages = Math.ceil(marketData.funds.length / itemsPerPage.fund);
    if (totalPages <= 1) return; // 只有一页不需要轮播

    autoPlayInterval = setInterval(() => {
        // 自动翻到下一页
        currentPage.fund++;
        if (currentPage.fund > totalPages) {
            currentPage.fund = 1; // 循环到第一页
            // 回到第一页时，打乱顺序
            marketData.funds = shuffleArray(marketData.funds);
        }

        // 重新渲染基金数据
        renderFundData(marketData.funds || [], previousData?.funds || []);
    }, 5000); // 每5秒切换一次
}

/**
 * 停止基金自动轮播
 */
function stopFundAutoPlay() {
    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
    }
}

// 清理所有定时器
function cleanupAllIntervals() {
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
    if (flashInterval) {
        clearInterval(flashInterval);
        flashInterval = null;
    }
    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
    }
    if (bondTypeAutoPlayInterval) {
        clearInterval(bondTypeAutoPlayInterval);
        bondTypeAutoPlayInterval = null;
    }
    if (bondFlashInterval) {
        clearInterval(bondFlashInterval);
        bondFlashInterval = null;
    }
}

// 页面卸载时清除定时器
window.addEventListener('beforeunload', cleanupAllIntervals);
window.addEventListener('pagehide', cleanupAllIntervals);
window.addEventListener('unload', cleanupAllIntervals);

// 页面隐藏时暂停定时器，显示时恢复
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // 页面隐藏时暂停所有定时器
        cleanupAllIntervals();
    } else {
        // 页面显示时恢复数据更新（如果数据已加载）
        if (marketData && !updateInterval) {
            updateInterval = setInterval(loadMarketData, 30000);
        }

        // 恢复基金自动轮播（如果在基金页面）
        const activeFund = document.querySelector('.market-tab-mobile.active[data-section="fund"]');
        if (activeFund && !autoPlayInterval) {
            setTimeout(() => {
                startFundAutoPlay();
            }, 1000);
        }

        // 恢复债券自动切换（如果在债券页面）
        const activeBond = document.querySelector('.market-tab-mobile.active[data-section="bond"]');
        if (activeBond) {
            if (!bondTypeAutoPlayInterval) {
                startBondTypeAutoPlay();
            }
            if (!bondFlashInterval) {
                startBondFlash();
            }
        }
    }
});
