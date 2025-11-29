// 签到功能 - 统一使用config.js的API封装
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
            }, 1500);
        }
    });
}

// 检查签到状态
async function checkCheckinStatus() {
    try {
        await waitForAPI();
        // const token = TokenManager.getToken();
        // if (!token) {
        //     showToast('请先登录');
        //     return null;
        // }

        const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
        const response = await fetch(`${API_BASE}/api/user/sign/info`, {
            method: 'GET',
            headers: {
                // 'Token': token,
                'Content-Type': 'application/json'
            }
        });

        const text = await response.text();

        // 检查是否是HTML错误页面
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html') || text.includes('系统发生错误') || text.includes('ThinkPHP')) {
            console.warn('[API] /api/user/sign/info 返回HTML错误页面');
            return null;
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('解析签到状态失败:', text.substring(0, 100));
            return null;
        }
        return data;
    } catch (error) {
        console.error('检查签到状态失败:', error);
        return null;
    }
}

// 执行签到
async function doCheckin() {
    try {
        await waitForAPI();
        // const token = TokenManager.getToken();
        // if (!token) {
        //     showToast('请先登录');
        //     return;
        // }

        const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
        const response = await fetch(`${API_BASE}/api/user/sign/sign`, {
            method: 'POST',
            headers: {
                // 'Token': token,
                'Content-Type': 'application/json'
            }
        });

        const text = await response.text();

        // 检查是否是HTML错误页面
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html') || text.includes('系统发生错误') || text.includes('ThinkPHP')) {
            console.warn('[API] /api/user/sign/sign 返回HTML错误页面');
            showToast('网络错误，请稍后重试');
            return;
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('解析签到响应失败:', text.substring(0, 100));
            showToast('网络错误，请稍后重试');
            return;
        }

        if (data.msg === '签到成功' || data.code === 1 || data.code === 200) {
            showCheckinSuccess(data.data);
        } else {
            showToast(data.msg || '签到失败');
        }
    } catch (error) {
        console.error('签到失败:', error);
        showToast('网络错误，请稍后重试');
    }
}

// 显示签到成功弹窗
function showCheckinSuccess(data) {
    const modal = document.createElement('div');
    modal.className = 'checkin-modal';
    modal.innerHTML = `
        <div class="checkin-modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="checkin-modal-content">
            <div class="checkin-success-icon">✓</div>
            <h2 class="checkin-title">签到成功！</h2>
            <div class="checkin-rewards">
                <div class="reward-item">
                    <span class="reward-label">获得积分</span>
                    <span class="reward-value">+${data.points || 10}</span>
                </div>
                <div class="reward-item">
                    <span class="reward-label">连续签到</span>
                    <span class="reward-value">${data.continuous_days || 1}天</span>
                </div>
            </div>
            <div class="checkin-tips">
                ${data.continuous_days >= 7 ? '🎉 连续签到7天，获得额外奖励！' : '连续签到可获得更多积分'}
            </div>
            <button class="checkin-btn" onclick="this.closest('.checkin-modal').remove()">确定</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// 打开签到弹窗
async function openCheckin() {
    const status = await checkCheckinStatus();

    if (!status || status.code === 501) {
        showToast('请先登录');
        return;
    }

    if (status.data && status.data.is_checkin) {
        showToast('今日已签到');
        return;
    }

    // 显示签到确认弹窗
    const modal = document.createElement('div');
    modal.className = 'checkin-modal';
    modal.innerHTML = `
        <div class="checkin-modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="checkin-modal-content">
            <div class="checkin-icon">📅</div>
            <h2 class="checkin-title">每日签到</h2>
            <div class="checkin-info">
                <p>连续签到 ${status.data.continuous_days || 0} 天</p>
                <p class="checkin-reward-text">今日签到可获得 10-30 积分</p>
            </div>
            <div class="checkin-actions">
                <button class="checkin-btn-cancel" onclick="this.closest('.checkin-modal').remove()">取消</button>
                <button class="checkin-btn-confirm" onclick="doCheckin(); this.closest('.checkin-modal').remove();">立即签到</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Toast提示
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}
