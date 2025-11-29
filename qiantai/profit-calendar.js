// 收益日历页面 - 统一使用config.js的API封装
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
};

let currentDate = new Date();
let profitData = {}; // 存储每日收益数据

document.addEventListener('DOMContentLoaded', function () {
    initPage();
    loadProfitData();
    bindEvents();
});

function initPage() {
    // 不再检查登录状态
    // 渲染当前月份日历
    renderCalendar();
}

async function loadProfitData() {
    try {
        await waitForAPI();

        // 优先使用统一API封装（如果config.js中有对应接口）
        let data = null;
        const params = {
            year: currentDate.getFullYear(),
            month: currentDate.getMonth() + 1
        };

        // 降级方案：直接使用fetch
        const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
        const response = await fetch(API_BASE + '/user/profit/calendar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                // 'Token': userData.token
            },
            body: JSON.stringify(params)
        });

        const text = await response.text();

        // 检查是否是HTML错误页面
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html') || text.includes('系统发生错误') || text.includes('ThinkPHP')) {
            console.warn('[API] /user/profit/calendar 返回HTML错误页面');
            loadMockData();
            return;
        }

        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('解析收益数据失败:', text.substring(0, 100));
            loadMockData();
            return;
        }

        console.log('收益数据:', data);

        if (data.code === 1 || data.code === 200 && data.data) {
            // 更新总览数据
            updateOverview(data.data);

            // 存储每日收益数据
            if (data.data.daily) {
                profitData = data.data.daily;
                renderCalendar();
            }
        } else {
            // 如果API不存在，使用模拟数据
            loadMockData();
        }
    } catch (error) {
        console.error('加载收益数据失败:', error);
        loadMockData();
    }
}

function loadMockData() {
    // 模拟数据
    const mockData = {
        today_profit: 53246.27,
        year_profit: 1278793.12,
        profit_rate: 29.59,
        daily: {}
    };

    // 生成本月模拟数据
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const profit = (Math.random() - 0.4) * 10000; // -4000 到 6000
        mockData.daily[date] = {
            profit: profit,
            rate: (profit / 100000 * 100).toFixed(2)
        };
    }

    profitData = mockData.daily;
    updateOverview(mockData);
    renderCalendar();
}

function updateOverview(data) {
    document.getElementById('todayProfit').textContent = formatProfit(data.today_profit || 0);
    document.getElementById('todayProfit').className = 'amount-value ' + (data.today_profit >= 0 ? 'positive' : 'negative');

    document.getElementById('yearProfit').textContent = formatProfit(data.year_profit || 0);
    document.getElementById('yearProfit').className = 'stat-value ' + (data.year_profit >= 0 ? 'positive' : 'negative');

    document.getElementById('profitRate').textContent = formatRate(data.profit_rate || 0);
    document.getElementById('profitRate').className = 'stat-value ' + (data.profit_rate >= 0 ? 'positive' : 'negative');
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // 更新月份显示
    document.getElementById('currentMonth').textContent = `${year}年 ${month + 1}月`;

    // 获取当月第一天是星期几（0=周日）
    const firstDay = new Date(year, month, 1).getDay();

    // 获取当月天数
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 生成日历HTML
    let html = '';
    let dayCount = 1;

    // 计算需要几行
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
        if (i < firstDay || dayCount > daysInMonth) {
            // 空单元格
            html += '<div class="calendar-cell empty"></div>';
        } else {
            // 日期单元格
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayCount).padStart(2, '0')}`;
            const dayData = profitData[dateStr] || { profit: 0, rate: 0 };
            const profit = dayData.profit || 0;
            const isToday = dayCount === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear();

            // 判断收益状态
            let profitClass = 'profit-neutral';
            if (profit > 0) {
                profitClass = 'profit-up';
            } else if (profit < 0) {
                profitClass = 'profit-down';
            }

            const todayClass = isToday ? 'today' : '';

            html += `
                <div class="calendar-cell ${todayClass} ${profitClass}"
                     data-date="${dateStr}" data-profit="${profit}">
                    <div class="cell-day">${dayCount}</div>
                    <div class="cell-profit ${profit >= 0 ? 'positive' : 'negative'}">
                        ${formatProfitShort(profit)}
                    </div>
                </div>
            `;
            dayCount++;
        }
    }

    document.getElementById('calendarBody').innerHTML = html;

    // 绑定日期点击事件
    document.querySelectorAll('.calendar-cell:not(.empty)').forEach(cell => {
        cell.addEventListener('click', function () {
            const date = this.dataset.date;
            const profit = this.dataset.profit;
            showDayDetail(date, profit);
        });
    });
}

function bindEvents() {
    // 刷新按钮
    document.getElementById('btnRefresh').addEventListener('click', function (e) {
        e.preventDefault();
        loadProfitData();
        showToast('数据已刷新');
    });

    // 查看曲线
    document.getElementById('btnViewCurve').addEventListener('click', function (e) {
        e.preventDefault();
        showToast('曲线功能开发中');
    });

    // 月份导航
    document.getElementById('btnPrevMonth').addEventListener('click', function () {
        currentDate.setMonth(currentDate.getMonth() - 1);
        loadProfitData();
    });

    document.getElementById('btnNextMonth').addEventListener('click', function () {
        currentDate.setMonth(currentDate.getMonth() + 1);
        loadProfitData();
    });

    // 时间段切换
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const period = this.dataset.period;
            if (period === 'today') {
                currentDate = new Date();
                loadProfitData();
            }
        });
    });

    // 视图切换
    document.querySelectorAll('.dist-tab-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.dist-tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const tab = this.dataset.tab;
            if (tab === 'calendar') {
                document.getElementById('calendarView').style.display = 'block';
                document.getElementById('chartView').style.display = 'none';
            } else {
                document.getElementById('calendarView').style.display = 'none';
                document.getElementById('chartView').style.display = 'block';
            }
        });
    });
}

function showDayDetail(date, profit) {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const dateStr = `${year}年${month}月${day}日`;

    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'day-detail-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="modal-content-day">
            <div class="modal-header-day">
                <h3>${dateStr} 收益详情</h3>
                <button class="modal-close" onclick="this.closest('.day-detail-modal').remove()">×</button>
            </div>
            <div class="modal-body-day">
                <div class="detail-summary">
                    <div class="summary-item">
                        <div class="summary-label">当日收益</div>
                        <div class="summary-value ${profit >= 0 ? 'positive' : 'negative'}">
                            ${formatProfit(profit)} 元
                        </div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">收益率</div>
                        <div class="summary-value ${profit >= 0 ? 'positive' : 'negative'}">
                            ${(Math.random() * 2 - 0.5).toFixed(3)}%
                        </div>
                    </div>
                </div>
                <div class="detail-projects">
                    <h4 class="projects-title">收益来源</h4>
                    <div class="project-list">
                        ${generateMockProjects(profit)}
                    </div>
                </div>
            </div>
            <div class="modal-footer-day">
                <button class="btn-modal-close" onclick="this.closest('.day-detail-modal').remove()">
                    关闭
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
}

function generateMockProjects(totalProfit) {
    const projects = [
        { name: '稳健增长基金A', icon: '📈' },
        { name: 'IPO战略配售B', icon: '🎯' },
        { name: '智能科技私募C', icon: '🚀' },
        { name: '绿色能源投资D', icon: '⚡' }
    ];

    let html = '';
    let remaining = totalProfit;

    for (let i = 0; i < Math.min(projects.length, Math.floor(Math.random() * 3) + 2); i++) {
        const project = projects[i];
        const isLast = i === Math.min(projects.length, Math.floor(Math.random() * 3) + 1);
        const profit = isLast ? remaining : remaining * (0.2 + Math.random() * 0.3);
        remaining -= profit;

        html += `
            <div class="project-item">
                <div class="project-icon">${project.icon}</div>
                <div class="project-info">
                    <div class="project-name">${project.name}</div>
                    <div class="project-time">${Math.floor(Math.random() * 12 + 1)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}</div>
                </div>
                <div class="project-profit ${profit >= 0 ? 'positive' : 'negative'}">
                    ${formatProfit(profit)}
                </div>
            </div>
        `;
    }

    return html || '<div class="no-data">暂无数据</div>';
}

function formatProfit(value) {
    const num = parseFloat(value);
    const sign = num >= 0 ? '+' : '';
    return sign + num.toFixed(2);
}

function formatProfitShort(value) {
    const num = parseFloat(value);
    const sign = num >= 0 ? '+' : '';

    if (Math.abs(num) >= 10000) {
        return sign + (num / 10000).toFixed(1) + '万';
    } else if (Math.abs(num) >= 1000) {
        return sign + (num / 1000).toFixed(1) + 'k';
    } else {
        return sign + num.toFixed(0);
    }
}

function formatRate(value) {
    const num = parseFloat(value);
    const sign = num >= 0 ? '+' : '';
    return sign + num.toFixed(2) + '%';
}

function showToast(message, duration = 2000) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}
