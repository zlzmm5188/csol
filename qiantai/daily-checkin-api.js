// 每日签到页面 - 统一使用config.js的API封装
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

// 获取用户token - 已禁用
// function getToken() {
//     return TokenManager.getToken() || '';
// }

// 用户签到状态
let checkinData = {
    hasCheckedToday: false,
    streakCount: 0,
    checkedDaysThisMonth: 0,
    todayReward: 10,
    monthlyCheckins: []
};

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    initCheckinPage();
});

// 初始化签到页面
async function initCheckinPage() {
    // const token = getToken();
    // if (!token) {
    //     showToast('请先登录');
    //     setTimeout(() => {
    //         window.location.href = 'login.html';
    //     }, 1500);
    //     return;
    // }

    await loadCheckinStatus();
    renderCheckinUI();
}

// 加载签到状态
async function loadCheckinStatus() {
    // const token = getToken();

    try {
        await waitForAPI();
        const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
        const response = await fetch(API_BASE + '/api/user/sign/info', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
                // 'Token': token
            }
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('解析签到状态失败:', text.substring(0, 100));
            showToast('获取签到状态失败');
            return;
        }
        console.log('签到状态:', data);

        if (data.code === 1 || data.code === 200 && data.data) {
            checkinData.hasCheckedToday = data.data.is_sign === 1;
            checkinData.streakCount = parseInt(data.data.continuous_days) || 0;
            checkinData.checkedDaysThisMonth = parseInt(data.data.month_sign_count) || 0;
            checkinData.todayReward = parseInt(data.data.today_reward) || 10;

            // 解析本月签到日期
            if (data.data.month_sign_dates && Array.isArray(data.data.month_sign_dates)) {
                checkinData.monthlyCheckins = data.data.month_sign_dates.map(d => parseInt(d));
            }
        }
    } catch (error) {
        console.error('获取签到状态失败:', error);
        showToast('获取签到状态失败');
    }
}

// 渲染签到UI
function renderCheckinUI() {
    const streakDaysEl = document.getElementById('streakDays');
    const checkedDaysEl = document.getElementById('checkedDays');
    const rewardTextEl = document.getElementById('rewardText');
    const checkinBtn = document.getElementById('checkinBtn');

    if (streakDaysEl) streakDaysEl.textContent = checkinData.streakCount;
    if (checkedDaysEl) checkedDaysEl.textContent = checkinData.checkedDaysThisMonth;
    if (rewardTextEl) rewardTextEl.textContent = `+${checkinData.todayReward} 积分`;

    // 更新签到按钮状态
    if (checkinBtn) {
        if (checkinData.hasCheckedToday) {
            checkinBtn.textContent = '✓ 今日已签到';
            checkinBtn.disabled = true;
            checkinBtn.style.background = '#10b981';
        } else {
            checkinBtn.textContent = '立即签到';
            checkinBtn.disabled = false;
            checkinBtn.style.background = '';
        }
    }

    // 渲染日历
    renderCalendar();
}

// 渲染签到日历
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = '';
    for (let day = 1; day <= daysInMonth; day++) {
        const isChecked = checkinData.monthlyCheckins.includes(day);
        const isToday = day === now.getDate();
        const className = isChecked ? 'calendar-day done' : 'calendar-day';

        html += `
            <div class="${className}${isToday ? ' today' : ''}">
                <span>${day}</span>
            </div>
        `;
    }

    calendarGrid.innerHTML = html;
}

// 执行签到
async function performCheckin() {
    // const token = getToken();
    const checkinBtn = document.getElementById('checkinBtn');

    if (checkinData.hasCheckedToday) {
        showToast('今日已签到，明天再来吧！');
        return;
    }

    // if (!token) {
    //     showToast('请先登录');
    //     return;
    // }

    // 签到动画
    checkinBtn.textContent = '签到中...';
    checkinBtn.disabled = true;

    try {
        await waitForAPI();
        const API_BASE = window.API_CONFIG?.baseURL || 'https://api.4kp3l0iq.top';
        const response = await fetch(API_BASE + '/api/user/sign/sign', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                // 'Token': token
            }
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('解析签到响应失败:', text.substring(0, 100));
            showToast('网络错误，请重试');
            checkinBtn.textContent = '立即签到';
            checkinBtn.disabled = false;
            return;
        }
        console.log('签到结果:', data);

        if (data.code === 1 || data.code === 200) {
            // 签到成功
            checkinData.hasCheckedToday = true;
            checkinData.streakCount++;
            checkinData.checkedDaysThisMonth++;

            const reward = data.data?.reward || checkinData.todayReward;

            // 更新显示
            document.getElementById('streakDays').textContent = checkinData.streakCount;
            document.getElementById('checkedDays').textContent = checkinData.checkedDaysThisMonth;
            document.getElementById('rewardText').textContent = `+${reward} 积分`;

            checkinBtn.textContent = '✓ 已签到';
            checkinBtn.style.background = '#10b981';

            // 更新日历
            const today = new Date().getDate();
            if (!checkinData.monthlyCheckins.includes(today)) {
                checkinData.monthlyCheckins.push(today);
            }
            renderCalendar();

            // 显示祝贺消息
            setTimeout(() => {
                let message = `签到成功！\n获得 ${reward} 积分\n已连续签到 ${checkinData.streakCount} 天`;
                if (checkinData.streakCount === 7 || checkinData.streakCount === 15 || checkinData.streakCount === 30) {
                    message += '\n\n🎉 恭喜达成连续签到里程碑！';
                }
                showToast(message);
            }, 300);
        } else {
            showToast(data.msg || '签到失败，请重试');
            checkinBtn.textContent = '立即签到';
            checkinBtn.disabled = false;
        }
    } catch (error) {
        console.error('签到失败:', error);
        showToast('网络错误，请重试');
        checkinBtn.textContent = '立即签到';
        checkinBtn.disabled = false;
    }
}

// 绑定签到按钮
window.addEventListener('DOMContentLoaded', function() {
    const checkinBtn = document.getElementById('checkinBtn');
    if (checkinBtn) {
        checkinBtn.addEventListener('click', performCheckin);
    }

    // 日历日期点击效果
    document.addEventListener('click', function(e) {
        if (e.target.closest('.calendar-day.done')) {
            const day = e.target.closest('.calendar-day');
            day.style.transform = 'scale(1.1)';
            setTimeout(() => {
                day.style.transform = 'scale(1)';
            }, 200);
        }
    });
});

// Toast提示
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
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
        white-space: pre-line;
        text-align: center;
        line-height: 1.6;
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        document.body.removeChild(toast);
    }, 2500);
}
