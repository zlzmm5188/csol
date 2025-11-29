// 日利宝页面 - 统一使用config.js的API封装
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

// const TOKEN_KEY = 'providence_token';
const DAILY_RATE = 0.0015; // 日利率 0.15%

// 用户数据
let userData = {
    money: 0,        // 账户余额
    ribao: 0,        // 日利宝余额
    ribaoProfit: 0,  // 累计收益
    yesterdayProfit: 0 // 昨日收益
};

// 页面加载
document.addEventListener('DOMContentLoaded', function() {
    // ✅ 登录检查（Integration Spec规范）
    if (typeof TokenManager !== 'undefined' && TokenManager.requireLogin) {
        if (!TokenManager.requireLogin()) {
            return; // 未登录，已自动跳转
        }
    } else if (typeof TokenManager !== 'undefined' && TokenManager.checkLogin) {
        if (!TokenManager.checkLogin()) {
            return; // 未登录，已自动跳转
        }
    }

    initPage();
    loadRibaoData();
    bindEvents();
});

// 初始化页面
function initPage() {
    // 不再检查登录状态
    // const token = localStorage.getItem(TOKEN_KEY);
    // if (!token) {
    //     showToast('提示', '请先登录').then(() => {
    //         setTimeout(() => {
    //             window.location.href = 'login.html';
    //         }, 500);
    //     });
    //     return;
    // }
}

// 加载日利宝数据
async function loadRibaoData() {
    // ✅ 使用TokenManager统一获取Token（Integration Spec规范）
    const token = TokenManager?.getToken() || localStorage.getItem('providence_token');
    if (!token) {
        console.warn('[Ribao] 未找到Token，无法加载数据');
        return;
    }

    try {
        await waitForAPI();

        // 1. 获取用户基本信息（包含余额）
        let userInfo = null;
        if (window.API && window.API.user && window.API.user.getInfo) {
            const result = await window.API.user.getInfo();
            if (result.success && result.data) {
                userInfo = { code: 200, msg: 'ok', data: result.data };
            }
        }

        // ✅ 使用统一API客户端（Integration Spec规范）
        if (!userInfo) {
            if (typeof ApiClient !== 'undefined') {
                try {
                    userInfo = await ApiClient.get('/api/user/info');
                } catch (e) {
                    console.error('[Ribao] ApiClient调用失败:', e);
                }
            }
        }

        console.log('📡 用户信息响应:', userInfo);

        if ((userInfo.code === 1 || userInfo.code === 200) && userInfo.data) {
            // 正确获取账户余额：优先使用新API字段（balance_cny或cny），然后是旧字段money
            userData.money = parseFloat(userInfo.data.balance_cny || userInfo.data.cny || userInfo.data.money || 0);
            // 如果userInfo中有ribao字段，也更新（优先使用ribao_cny）
            if (userInfo.data.ribao_cny !== undefined) {
                userData.ribao = parseFloat(userInfo.data.ribao_cny || 0);
            } else if (userInfo.data.ribao !== undefined) {
                userData.ribao = parseFloat(userInfo.data.ribao || 0);
            }
        }

        // 2. 获取日利宝头部数据
        // ✅ 使用统一API客户端（Integration Spec规范）
        let headData = null;
        if (typeof ApiClient !== 'undefined') {
            try {
                headData = await ApiClient.get('/api/ribao/head');  // ✅ 修正路径
            } catch (e) {
                console.error('[Ribao] 获取日利宝头部数据失败:', e);
            }
        }
        console.log('📡 日利宝头部响应:', headData);

        if ((headData.code === 1 || headData.code === 200) && headData.data) {
            const data = headData.data;
            // 后端返回的字段：tmoney（日利宝余额）、tprofit（累计收益）
            userData.ribao = parseFloat(data.tmoney || 0);
            userData.ribaoProfit = parseFloat(data.tprofit || 0);

            // 昨日收益：如果后端有返回则使用，否则从收益记录中计算
            userData.yesterdayProfit = parseFloat(data.yesterday_profit || data.yesterdayProfit || 0);

            // 更新页面显示
            updateDisplay();
        } else {
            console.warn('⚠️ 日利宝头部数据响应异常:', headData);
            // 即使接口失败，也显示基本数据
            updateDisplay();
        }

        // 收益记录已移至明细页面，不再在此加载

    } catch (error) {
        console.error('❌ 加载数据失败:', error);
        await showToast('错误', '加载数据失败：' + error.message);
        // 即使加载失败，也显示当前已有的数据
        updateDisplay();
    }
}

// 更新页面显示
function updateDisplay() {
    const ribaoTotalEl = document.getElementById('ribaoTotal');
    const yesterdayProfitEl = document.getElementById('yesterdayProfit');
    const totalProfitEl = document.getElementById('totalProfit');

    if (ribaoTotalEl) ribaoTotalEl.textContent = formatMoney(userData.ribao);
    if (yesterdayProfitEl) yesterdayProfitEl.textContent = formatMoney(userData.yesterdayProfit);
    if (totalProfitEl) totalProfitEl.textContent = formatMoney(userData.ribaoProfit);
}

// 加载收益记录
async function loadProfitRecords() {
    // ✅ 使用TokenManager统一获取Token（Integration Spec规范）
    const token = TokenManager?.getToken() || localStorage.getItem('providence_token');
    if (!token) {
        console.warn('[Ribao] 未找到Token，无法加载收益记录');
        return;
    }

    const profitRecordsEl = document.getElementById('profitRecords');
    if (!profitRecordsEl) return;

    try {
        // ✅ 使用统一API客户端（Integration Spec规范）
        let response = null;
        if (typeof ApiClient !== 'undefined') {
            try {
                response = await ApiClient.get('/api/ribao/records', {  // ✅ 修正路径
                    params: { page: 1, limit: 10 }
                });
            } catch (e) {
                console.error('[Ribao] 获取收益记录失败:', e);
            }
        }
        console.log('📡 收益记录响应:', response);

        if (response && (response.code === 1 || response.code === 200) && response.data) {
            // 后端返回的可能是数组或对象包含list字段
            let records = Array.isArray(response.data) ? response.data : (response.data.list || []);

            if (records.length > 0) {
                // 如果昨日收益为0，从最近一条收益记录计算
                if (userData.yesterdayProfit === 0 && records.length > 0) {
                    const today = new Date();
                    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
                    const yesterdayStr = yesterday.toISOString().split('T')[0];

                    const yesterdayRecord = records.find(r => {
                        const recordDate = r.created_at || r.day;
                        return recordDate && recordDate.includes(yesterdayStr);
                    });

                    if (yesterdayRecord) {
                        userData.yesterdayProfit = parseFloat(yesterdayRecord.profit || 0);
                        const yesterdayProfitEl = document.getElementById('yesterdayProfit');
                        if (yesterdayProfitEl) yesterdayProfitEl.textContent = formatMoney(userData.yesterdayProfit);
                    }
                }

                const recordsHtml = records.map(record => {
                    const money = parseFloat(record.money || 0);
                    const profit = parseFloat(record.profit || 0);
                    const date = record.created_at || record.day || formatDate(record.time || Date.now() / 1000);
                    const rate = record.rate || '0.15';

                    return `
                        <div class="record-item">
                            <div class="record-left">
                                <div class="record-date">${date}</div>
                                <div class="record-money">本金 ¥${formatMoney(money)}</div>
                            </div>
                            <div class="record-right">
                                <div class="record-profit">+¥${formatMoney(profit)}</div>
                                <div class="record-rate">${rate}%</div>
                            </div>
                        </div>
                    `;
                }).join('');

                profitRecordsEl.innerHTML = recordsHtml;
            } else {
                profitRecordsEl.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📊</div>
                        <div class="empty-text">暂无收益记录</div>
                    </div>
                `;
            }
        } else {
            profitRecordsEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <div class="empty-text">暂无收益记录</div>
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ 加载收益记录失败:', error);
        profitRecordsEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <div class="empty-text">加载失败</div>
            </div>
        `;
    }
}

// 绑定事件
function bindEvents() {
    // 转入按钮
    const btnTransferIn = document.getElementById('btnTransferIn');
    if (btnTransferIn) {
        btnTransferIn.addEventListener('click', openTransferInModal);
    }

    // 转出按钮
    const btnTransferOut = document.getElementById('btnTransferOut');
    if (btnTransferOut) {
        btnTransferOut.addEventListener('click', openTransferOutModal);
    }

    // 确认转入
    const confirmTransferIn = document.getElementById('confirmTransferIn');
    if (confirmTransferIn) {
        confirmTransferIn.addEventListener('click', handleTransferIn);
    }

    // 确认转出
    const confirmTransferOut = document.getElementById('confirmTransferOut');
    if (confirmTransferOut) {
        confirmTransferOut.addEventListener('click', handleTransferOut);
    }

    // 关闭弹窗
    document.querySelectorAll('.modal-close, .btn-cancel').forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            if (modalId) {
                closeModal(modalId);
            } else {
                // 如果没有data-modal，查找父级modal
                const modal = this.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            }
        });
    });

    // 点击遮罩关闭
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });

    // 快速金额按钮 - 转入弹窗
    document.querySelectorAll('#modalTransferIn .quick-amount-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // 移除其他按钮的active状态
            document.querySelectorAll('#modalTransferIn .quick-amount-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const amount = this.dataset.amount;
            const input = document.getElementById('transferInAmount');
            if (amount === 'all') {
                input.value = userData.money || 0;
            } else {
                input.value = amount;
            }
            updateExpectedProfit();
        });
    });

    // 快速金额按钮 - 转出弹窗
    document.querySelectorAll('#modalTransferOut .quick-amount-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // 移除其他按钮的active状态
            document.querySelectorAll('#modalTransferOut .quick-amount-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const amount = this.dataset.amount;
            const input = document.getElementById('transferOutAmount');
            if (amount === 'all') {
                input.value = userData.ribao || 0;
            } else {
                input.value = amount;
            }
        });
    });

    // 转入金额输入时计算预期收益
    const transferInAmountInput = document.getElementById('transferInAmount');
    if (transferInAmountInput) {
        transferInAmountInput.addEventListener('input', function() {
            // 移除快速金额按钮的active状态（用户手动输入）
            document.querySelectorAll('#modalTransferIn .quick-amount-btn').forEach(b => b.classList.remove('active'));
            updateExpectedProfit();
        });
    }

    // 转出金额输入时移除快速金额按钮的active状态
    const transferOutAmountInput = document.getElementById('transferOutAmount');
    if (transferOutAmountInput) {
        transferOutAmountInput.addEventListener('input', function() {
            document.querySelectorAll('#modalTransferOut .quick-amount-btn').forEach(b => b.classList.remove('active'));
        });
    }
}

// 打开转入弹窗
function openTransferInModal() {
    const availableBalanceEl = document.getElementById('availableBalance');
    const transferInAmountEl = document.getElementById('transferInAmount');
    const expectedProfitEl = document.getElementById('expectedProfit');
    const modalEl = document.getElementById('modalTransferIn');

    if (availableBalanceEl) availableBalanceEl.textContent = '¥' + formatMoney(userData.money);
    if (transferInAmountEl) transferInAmountEl.value = '';
    if (expectedProfitEl) expectedProfitEl.textContent = '0.00';

    // 清除快速金额按钮的active状态
    document.querySelectorAll('#modalTransferIn .quick-amount-btn').forEach(b => b.classList.remove('active'));

    if (modalEl) modalEl.style.display = 'flex';
}

// 打开转出弹窗
function openTransferOutModal() {
    if (userData.ribao <= 0) {
        showToast('提示', '日利宝余额不足');
        return;
    }

    const ribaoBalanceEl = document.getElementById('ribaoBalance');
    const transferOutAmountEl = document.getElementById('transferOutAmount');
    const modalEl = document.getElementById('modalTransferOut');

    if (ribaoBalanceEl) ribaoBalanceEl.textContent = '¥' + formatMoney(userData.ribao);
    if (transferOutAmountEl) transferOutAmountEl.value = '';

    // 清除快速金额按钮的active状态
    document.querySelectorAll('#modalTransferOut .quick-amount-btn').forEach(b => b.classList.remove('active'));

    if (modalEl) modalEl.style.display = 'flex';
}

// 关闭弹窗
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// 更新预期收益
function updateExpectedProfit() {
    const amount = parseFloat(document.getElementById('transferInAmount')?.value || 0);
    const profit = amount * DAILY_RATE;
    const expectedProfitEl = document.getElementById('expectedProfit');
    if (expectedProfitEl) {
        expectedProfitEl.textContent = formatMoney(profit);
    }
}

// 处理转入
async function handleTransferIn() {
    const submitBtn = document.getElementById('confirmTransferIn');
    const transferInAmountEl = document.getElementById('transferInAmount');

    if (!transferInAmountEl) return;

    const amount = parseFloat(transferInAmountEl.value);

    if (!amount || amount <= 0) {
        await showToast('提示', '请输入转入金额');
        return;
    }

    if (amount < 100) {
        await showToast('提示', '最低转入金额为100元');
        return;
    }

    if (amount > 1000000) {
        await showToast('提示', '最高转入金额为1,000,000元');
        return;
    }

    if (amount > userData.money) {
        await showToast('提示', '余额不足');
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '转入中...';
    }

    try {
        // ✅ 使用统一API客户端（Integration Spec规范）
        let response = null;
        if (typeof ApiClient !== 'undefined') {
            response = await ApiClient.post('/api/user/ribao/transferin', {  // ✅ 修正路径（后端路由格式）
                amount: amount,  // ✅ 使用 amount 而不是 money
                currency: 'CNY',  // ✅ 添加币种参数
                pay_password: ''  // 注意：ribao.js中没有密码管理，需要更新前端流程
            });
        } else {
            throw new Error('ApiClient未加载');
        }

        console.log('📡 转入响应:', response);

        if (response.code === 200 || response.code === 1 || response.msg === 'ok' || (typeof response.msg === 'string' && response.msg.includes('成功'))) {
            await showToast('成功', '转入成功');
            closeModal('modalTransferIn');

            // 立即更新本地数据（避免等待接口刷新）
            userData.money = Math.max(0, userData.money - amount);
            userData.ribao = (userData.ribao || 0) + amount;
            updateDisplay();

            // 刷新完整数据
            setTimeout(() => {
                loadRibaoData();
            }, 500);
        } else {
            await showToast('错误', response.msg || response.message || '转入失败，请重试');
        }
    } catch (error) {
        console.error('❌ 转入失败:', error);
        await showToast('错误', '转入失败：' + error.message + '\n\n请重试或联系客服');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '确认转入';
        }
    }
}

// 处理转出
async function handleTransferOut() {
    const submitBtn = document.getElementById('confirmTransferOut');
    const transferOutAmountEl = document.getElementById('transferOutAmount');

    if (!transferOutAmountEl) return;

    const amount = parseFloat(transferOutAmountEl.value);

    if (!amount || amount <= 0) {
        await showToast('提示', '请输入转出金额');
        return;
    }

    if (amount < 100) {
        await showToast('提示', '最低转出金额为100元');
        return;
    }

    if (amount > 1000000) {
        await showToast('提示', '最高转出金额为1,000,000元');
        return;
    }

    if (amount > userData.ribao) {
        await showToast('提示', '日利宝余额不足');
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '转出中...';
    }

    try {
        // ✅ 使用统一API客户端（Integration Spec规范）
        let response = null;
        if (typeof ApiClient !== 'undefined') {
            response = await ApiClient.post('/api/user/ribao/transferout', {  // ✅ 修正路径（后端路由格式）
                amount: amount,  // ✅ 使用 amount 而不是 money
                currency: 'CNY',  // ✅ 添加币种参数
                pay_password: ''  // 注意：ribao.js中没有密码管理，需要更新前端流程
            });
        } else {
            throw new Error('ApiClient未加载');
        }

        console.log('📡 转出响应:', response);

        if (response.code === 200 || response.code === 1 || response.msg === 'ok' || (typeof response.msg === 'string' && response.msg.includes('成功'))) {
            await showToast('成功', '转出成功');
            closeModal('modalTransferOut');

            // 立即更新本地数据（避免等待接口刷新）
            userData.ribao = Math.max(0, userData.ribao - amount);
            userData.money = (userData.money || 0) + amount;
            updateDisplay();

            // 刷新完整数据
            setTimeout(() => {
                loadRibaoData();
            }, 500);
        } else {
            await showToast('错误', response.msg || response.message || '转出失败，请重试');
        }
    } catch (error) {
        console.error('❌ 转出失败:', error);
        await showToast('错误', '转出失败：' + error.message + '\n\n请重试或联系客服');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '确认转出';
        }
    }
}

// ✅ apiRequest函数已废弃，统一使用ApiClient（Integration Spec规范）
// 如需降级方案，请使用ApiClient.get/post

// 格式化金额
function formatMoney(amount) {
    return parseFloat(amount || 0).toFixed(2);
}

// 格式化日期
function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}
