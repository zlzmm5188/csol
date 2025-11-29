/**
 * 我的团队页面 - 重构版
 * 对接后端API: /api/team/members
 * updated 2025-11-27
 */
import { apiRequest, formatMoney, getToken, redirectToLogin, showToast } from './api-utils.js';

let userData = {
    currentLevel: 1,
    teamData: {
        level1: [],      // 一级团队（直推）
        level2: []       // 二级团队（下级的下级）
    },
    stats: {
        totalMembers: 0,
        totalInvestment: 0,
        myCommission: 0
    }
};

document.addEventListener('DOMContentLoaded', function() {
    initPage();
});

async function initPage() {
    if (!getToken()) {
        showToast('请先登录');
        setTimeout(() => redirectToLogin(), 1500);
        return;
    }

    bindEvents();
    await loadAllTeamData();
    updateStats();
}

function bindEvents() {
    document.querySelectorAll('.level-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const level = parseInt(this.dataset.level);
            switchLevel(level);
        });
    });
}

/**
 * 加载所有团队数据
 */
async function loadAllTeamData() {
    const container = document.getElementById('teamList');
    if (!container) return;

    container.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <div class="loading-text">加载中...</div>
        </div>
    `;

    try {
        // 1. 加载一级团队（直推）
        const level1Response = await apiRequest('/api/team/members?level=1&page=1&limit=100', {}, 'GET');

        if (level1Response.code === 1 && level1Response.data) {
            // 后端返回格式: {code: 1, msg: '获取成功', data: {total: 0, list: []}}
            userData.teamData.level1 = level1Response.data.list || [];
            userData.stats.totalMembers += level1Response.data.total || userData.teamData.level1.length;
            console.log('[团队] 一级团队加载成功:', userData.teamData.level1.length, '人');
        } else {
            console.warn('[团队] 一级团队加载失败:', level1Response);
        }

        // 2. 加载二级团队
        const level2Response = await apiRequest('/api/team/members?level=2&page=1&limit=100', {}, 'GET');

        if (level2Response.code === 1 && level2Response.data) {
            userData.teamData.level2 = level2Response.data.list || [];
            userData.stats.totalMembers += level2Response.data.total || userData.teamData.level2.length;
            console.log('[团队] 二级团队加载成功:', userData.teamData.level2.length, '人');
        } else {
            console.warn('[团队] 二级团队加载失败:', level2Response);
        }

        // 3. 计算总投资额
        const allMembers = [...userData.teamData.level1, ...userData.teamData.level2];
        userData.stats.totalInvestment = allMembers.reduce((sum, member) => {
            return sum + (parseFloat(member.total_invest) || 0);
        }, 0);

        // 4. 初始显示一级团队
        renderTeamList(1);
        updateStats();
    } catch (error) {
        console.error('加载团队数据失败:', error);
        showEmpty('加载失败，请重试');

        if (error.message && error.message.includes('登录')) {
            setTimeout(() => redirectToLogin(), 1500);
        }
    }
}

function switchLevel(level) {
    userData.currentLevel = level;

    document.querySelectorAll('.level-tab').forEach(tab => {
        tab.classList.remove('active');
        if (parseInt(tab.dataset.level) === level) {
            tab.classList.add('active');
        }
    });

    renderTeamList(level);
}

function renderTeamList(level) {
    const container = document.getElementById('teamList');
    if (!container) return;

    const members = level === 1 ? userData.teamData.level1 : userData.teamData.level2;

    if (members.length === 0) {
        showEmpty(level === 1 ? '暂无一级团队成员' : '暂无二级团队成员');
        return;
    }

    let html = '<div class="team-members-list">';

    members.forEach((member, index) => {
        const investAmount = formatMoney(member.total_invest || 0);
        const vipLevel = member.vip_level || 0;
        const joinTime = member.join_time || member.created_at || '';
        const formattedTime = joinTime ? new Date(joinTime).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }) : '--';
        const memberId = member.user_id || member.id || index + 1;
        const memberName = member.username || '用户' + memberId;

        html += `
            <div class="team-member-item">
                <div class="member-avatar">
                    <div class="avatar-circle">${memberName.charAt(0).toUpperCase()}</div>
                </div>
                <div class="member-info">
                    <div class="member-name-row">
                        <span class="member-name">${memberName}</span>
                        <span class="member-vip">VIP${vipLevel}</span>
                    </div>
                    <div class="member-details">
                        <div class="detail-item">
                            <span class="detail-label">投资金额</span>
                            <span class="detail-value">¥${investAmount}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">加入时间</span>
                            <span class="detail-value">${formattedTime}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function updateStats() {
    // 更新团队总人数
    const totalMembersEl = document.getElementById('totalMembers');
    if (totalMembersEl) {
        totalMembersEl.textContent = userData.stats.totalMembers;
    }

    // 更新团队总投资
    const totalInvestmentEl = document.getElementById('totalInvestment');
    if (totalInvestmentEl) {
        totalInvestmentEl.textContent = '¥' + formatMoney(userData.stats.totalInvestment);
    }

    // 更新我的收益（需要从用户信息中获取）
    const myCommissionEl = document.getElementById('myCommission');
    if (myCommissionEl) {
        // 暂时显示0，后续可以从用户信息API获取
        myCommissionEl.textContent = '¥0.00';
    }
}

function showEmpty(message) {
    const container = document.getElementById('teamList');
    if (!container) return;

    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">👥</div>
            <div class="empty-text">${message}</div>
        </div>
    `;
}
